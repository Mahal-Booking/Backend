import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: [true, 'Booking ID is required']
    },
    gateway: {
        type: String,
        required: [true, 'Payment gateway is required'],
        enum: {
            values: ['razorpay'],
            message: '{VALUE} is not a supported payment gateway'
        },
        default: 'razorpay'
    },
    gatewayOrderId: {
        type: String,
        required: [true, 'Gateway order ID is required'],
        trim: true
    },
    gatewayPaymentId: {
        type: String,
        trim: true,
        default: null
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    status: {
        type: String,
        enum: {
            values: ['created', 'pending', 'success', 'failed', 'refunded'],
            message: '{VALUE} is not a valid payment status'
        },
        default: 'created'
    },
    rawResponse: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Index for faster booking lookups
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ gatewayOrderId: 1 });
paymentSchema.index({ gatewayPaymentId: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
