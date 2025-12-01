import Booking from '../../models/Booking.model.js';
import Cart from '../../models/Cart.model.js';
import Mahal from '../../models/Mahal.model.js';
import Contractor from '../../models/Contractor.model.js';

/**
 * Create a booking from the user's cart
 */
export const createBooking = async (req, res, next) => {
    try {
        const { eventDate, guestCount, specialRequests } = req.body;
        const userId = req.user._id;

        // Get cart with populated references
        const cart = await Cart.findOne({ user: userId })
            .populate('mahal')
            .populate('contractors.contractor');
        if (!cart) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }
        if (!cart.mahal) {
            return res.status(400).json({ success: false, message: 'Select a Mahal before booking' });
        }

        // Calculate total amount (simplified)
        let total = 0;
        const mahal = await Mahal.findById(cart.mahal);
        if (mahal) total += mahal.pricing?.basePrice || 0;
        for (const item of cart.contractors) {
            const contractor = await Contractor.findById(item.contractor);
            if (contractor) total += contractor.basePrice;
        }

        const booking = await Booking.create({
            userId: userId,
            mahalId: cart.mahal,
            contractorItems: cart.contractors.map(c => ({ contractorId: c.contractor, packageId: 'default', packageName: 'Standard', priceAtBooking: 0 })), // Simplified for now
            eventDate,
            guestCount,
            specialRequests,
            totalAmount: total,
            status: 'pending',
            paymentStatus: 'unpaid'
        });

        // Clear cart
        await Cart.findOneAndUpdate({ user: userId }, { $set: { mahal: null, eventDate: null, contractors: [] } });

        res.status(201).json({ success: true, data: booking });
    } catch (err) {
        next(err);
    }
};

/**
 * Get bookings for the authenticated user
 */
export const getMyBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate('mahal')
            .populate('contractorItems.contractor');
        res.json({ success: true, data: bookings });
    } catch (err) {
        next(err);
    }
};

/**
 * Get a single booking by ID with access control
 */
export const getBookingById = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('mahal')
            .populate('contractorItems.contractor');
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        const isUser = booking.user.toString() === req.user._id.toString();
        const isMahalOwner = booking.mahal && booking.mahal.ownerId && booking.mahal.ownerId.toString() === req.user._id.toString();
        const isContractor = booking.contractorItems.some(item =>
            item.contractor && item.contractor.ownerId && item.contractor.ownerId.toString() === req.user._id.toString()
        );
        if (!isUser && !isMahalOwner && !isContractor && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        res.json({ success: true, data: booking });
    } catch (err) {
        next(err);
    }
};

/**
 * Get bookings for Mahal owners
 */
export const getMahalBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find({ mahal: { $in: req.user.ownedMahals } })
            .populate('mahal')
            .populate('contractorItems.contractor');
        res.json({ success: true, data: bookings });
    } catch (err) {
        next(err);
    }
};

/**
 * Get bookings for Contractors
 */
export const getContractorBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find({ 'contractorItems.contractor': { $in: req.user.ownedContractors } })
            .populate('mahal')
            .populate('contractorItems.contractor');
        res.json({ success: true, data: bookings });
    } catch (err) {
        next(err);
    }
};

/**
 * Update booking status (admin only)
 */
export const updateBookingStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true })
            .populate('mahal')
            .populate('contractorItems.contractor');
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        res.json({ success: true, data: booking });
    } catch (err) {
        next(err);
    }
};

/**
 * Admin: get all bookings
 */
export const getAllBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find()
            .populate('mahal')
            .populate('contractorItems.contractor')
            .populate('user', 'name email');
        res.json({ success: true, data: bookings });
    } catch (err) {
        next(err);
    }
};
/**
 * Seed a demo booking for testing
 */
export const seedBooking = async (req, res, next) => {
    try {
        const mahal = await Mahal.findOne();
        if (!mahal) {
            return res.status(404).json({ success: false, message: 'No mahals found to seed booking' });
        }

        const booking = await Booking.create({
            userId: req.user._id,
            mahalId: mahal._id,
            eventDate: new Date(Date.now() + 86400000 * 10), // 10 days from now
            guestCount: 500,
            totalAmount: mahal.pricing?.basePrice || 50000,
            status: 'confirmed',
            paymentStatus: 'paid',
            contractorItems: []
        });

        res.status(201).json({ success: true, data: booking, message: 'Demo booking created' });
    } catch (err) {
        next(err);
    }
};
