import razorpay, { verifyPaymentSignature } from '../../config/razorpay.config.js';
import Payment from '../../models/Payment.model.js';
import Booking from '../../models/Booking.model.js';

/**
 * @desc    Create Razorpay order for booking
 * @route   POST /api/payments/create-order
 * @access  Private
 */
export const createOrder = async (req, res, next) => {
    try {
        const { bookingId } = req.body;

        // Find booking
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Verify ownership
        if (booking.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to pay for this booking'
            });
        }

        // Check if payment already exists
        const existingPayment = await Payment.findOne({ bookingId });
        if (existingPayment && existingPayment.status === 'success') {
            return res.status(400).json({
                success: false,
                message: 'Payment already completed for this booking'
            });
        }

        // Create Razorpay order
        const options = {
            amount: booking.totalAmount * 100, // Amount in paise
            currency: 'INR',
            receipt: `booking_${bookingId}`,
            notes: {
                bookingId: bookingId.toString(),
                userId: req.user._id.toString()
            }
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // Create or update payment record
        let payment;
        if (existingPayment) {
            payment = await Payment.findByIdAndUpdate(
                existingPayment._id,
                {
                    gatewayOrderId: razorpayOrder.id,
                    amount: booking.totalAmount,
                    status: 'created'
                },
                { new: true }
            );
        } else {
            payment = await Payment.create({
                bookingId,
                gateway: 'razorpay',
                gatewayOrderId: razorpayOrder.id,
                amount: booking.totalAmount,
                status: 'created'
            });
        }

        // Update booking with payment reference
        booking.payment = payment._id;
        await booking.save();

        res.json({
            success: true,
            data: {
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                keyId: process.env.RAZORPAY_KEY_ID,
                payment: payment
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Verify Razorpay payment
 * @route   POST /api/payments/verify
 * @access  Private
 */
export const verifyPayment = async (req, res, next) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Verify signature
        const isValid = verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature'
            });
        }

        // Find payment by order ID
        const payment = await Payment.findOne({ gatewayOrderId: razorpay_order_id });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment record not found'
            });
        }

        // Update payment status
        payment.gatewayPaymentId = razorpay_payment_id;
        payment.status = 'success';
        payment.rawResponse = {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        };
        await payment.save();

        // Update booking status
        const booking = await Booking.findById(payment.bookingId);
        if (booking) {
            booking.status = 'confirmed';
            booking.paymentStatus = 'paid';
            await booking.save();
        }

        res.json({
            success: true,
            message: 'Payment verified successfully',
            data: {
                payment,
                booking
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Handle payment failure
 * @route   POST /api/payments/failure
 * @access  Private
 */
export const handlePaymentFailure = async (req, res, next) => {
    try {
        const { razorpay_order_id, error } = req.body;

        const payment = await Payment.findOne({ gatewayOrderId: razorpay_order_id });

        if (payment) {
            payment.status = 'failed';
            payment.rawResponse = { error };
            await payment.save();
        }

        res.json({
            success: false,
            message: 'Payment failed',
            data: payment
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get payment details
 * @route   GET /api/payments/:id
 * @access  Private
 */
export const getPaymentById = async (req, res, next) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate({
                path: 'bookingId',
                populate: [
                    { path: 'mahal', select: 'name' },
                    { path: 'user', select: 'name email' }
                ]
            });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Check authorization
        const isOwner = payment.bookingId.user._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this payment'
            });
        }

        res.json({
            success: true,
            data: payment
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get user's payment history
 * @route   GET /api/payments/my/history
 * @access  Private
 */
export const getMyPayments = async (req, res, next) => {
    try {
        const bookings = await Booking.find({ user: req.user._id }).select('_id');
        const bookingIds = bookings.map(b => b._id);

        const payments = await Payment.find({ bookingId: { $in: bookingIds } })
            .populate({
                path: 'bookingId',
                select: 'eventDate totalAmount',
                populate: { path: 'mahal', select: 'name' }
            })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: payments
        });
    } catch (error) {
        next(error);
    }
};
