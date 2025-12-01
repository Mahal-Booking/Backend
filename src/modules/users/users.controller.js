import User from '../../models/User.model.js';
import Booking from '../../models/Booking.model.js';
import { AuthError } from '../../middleware/auth.middleware.js';
import { logActivity, getIpAddress, getUserAgent } from '../../utils/activityLogger.js';

/**
 * Get user details with booking history
 * GET /api/users/:userId
 */
export const getUserDetails = async (req, res, next) => {
    try {
        // Ensure user is admin
        if (req.user.role !== 'admin') {
            throw new AuthError('Not authorized to view user details', 403);
        }

        const user = await User.findById(req.params.userId).select('-password');

        if (!user) {
            throw new AuthError('User not found', 404);
        }

        // Get user's booking history
        const bookings = await Booking.find({ userId: req.params.userId })
            .populate('mahalId', 'name location pricing')
            .sort({ createdAt: -1 })
            .lean();

        // Calculate aggregate stats
        const stats = {
            totalBookings: bookings.length,
            completedBookings: bookings.filter(b => b.status === 'completed').length,
            cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
            totalSpent: bookings
                .filter(b => b.status === 'completed')
                .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
        };

        res.json({
            success: true,
            data: {
                user,
                bookings,
                stats
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Disable user account for N days
 * POST /api/users/:userId/disable
 */
export const disableUser = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            throw new AuthError('Not authorized to disable users', 403);
        }

        const { days } = req.body;

        if (!days || days < 1) {
            throw new AuthError('Invalid number of days', 400);
        }

        const user = await User.findById(req.params.userId);

        if (!user) {
            throw new AuthError('User not found', 404);
        }

        // Calculate disable until date
        const disableUntil = new Date();
        disableUntil.setDate(disableUntil.getDate() + parseInt(days));

        user.isActive = false;
        user.disabledUntil = disableUntil;
        await user.save();

        // Log activity
        logActivity({
            userId: req.user._id.toString(),
            action: 'update_user',
            description: `Disabled user ${user.name} for ${days} days`,
            targetType: 'User',
            targetId: user._id.toString(),
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            metadata: { days, disableUntil }
        });

        res.json({
            success: true,
            message: `User disabled until ${disableUntil.toLocaleDateString()}`,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                disabledUntil: user.disabledUntil
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Enable user account (remove disable)
 * POST /api/users/:userId/enable
 */
export const enableUser = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            throw new AuthError('Not authorized to enable users', 403);
        }

        const user = await User.findById(req.params.userId);

        if (!user) {
            throw new AuthError('User not found', 404);
        }

        user.isActive = true;
        user.disabledUntil = undefined;
        await user.save();

        // Log activity
        logActivity({
            userId: req.user._id.toString(),
            action: 'update_user',
            description: `Enabled user ${user.name}`,
            targetType: 'User',
            targetId: user._id.toString(),
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req)
        });

        res.json({
            success: true,
            message: 'User enabled successfully',
            data: {
                _id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Disable orders for user for N days
 * POST /api/users/:userId/disable-orders
 */
export const disableUserOrders = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            throw new AuthError('Not authorized to disable user orders', 403);
        }

        const { days } = req.body;

        if (!days || days < 1) {
            throw new AuthError('Invalid number of days', 400);
        }

        const user = await User.findById(req.params.userId);

        if (!user) {
            throw new AuthError('User not found', 404);
        }

        // Calculate disable until date
        const disableUntil = new Date();
        disableUntil.setDate(disableUntil.getDate() + parseInt(days));

        user.ordersDisabledUntil = disableUntil;
        await user.save();

        // Log activity
        logActivity({
            userId: req.user._id.toString(),
            action: 'update_user',
            description: `Disabled orders for user ${user.name} for ${days} days`,
            targetType: 'User',
            targetId: user._id.toString(),
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            metadata: { days, disableUntil }
        });

        res.json({
            success: true,
            message: `Orders disabled until ${disableUntil.toLocaleDateString()}`,
            data: {
                _id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                ordersDisabledUntil: user.ordersDisabledUntil
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Enable orders for user (remove restriction)
 * POST /api/users/:userId/enable-orders
 */
export const enableUserOrders = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            throw new AuthError('Not authorized to enable user orders', 403);
        }

        const user = await User.findById(req.params.userId);

        if (!user) {
            throw new AuthError('User not found', 404);
        }

        user.ordersDisabledUntil = undefined;
        await user.save();

        // Log activity
        logActivity({
            userId: req.user._id.toString(),
            action: 'update_user',
            description: `Enabled orders for user ${user.name}`,
            targetType: 'User',
            targetId: user._id.toString(),
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req)
        });

        res.json({
            success: true,
            message: 'Orders enabled successfully',
            data: {
                _id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Delete a booking (admin only)
 * DELETE /api/users/:userId/bookings/:bookingId
 */
export const deleteBooking = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            throw new AuthError('Not authorized to delete bookings', 403);
        }

        const booking = await Booking.findById(req.params.bookingId);

        if (!booking) {
            throw new AuthError('Booking not found', 404);
        }

        if (booking.userId.toString() !== req.params.userId) {
            throw new AuthError('Booking does not belong to this user', 400);
        }

        await Booking.findByIdAndDelete(req.params.bookingId);

        // Log activity
        logActivity({
            userId: req.user._id.toString(),
            action: 'delete_user',
            description: `Deleted booking ${booking._id} for user`,
            targetType: 'Booking',
            targetId: booking._id.toString(),
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req)
        });

        res.json({
            success: true,
            message: 'Booking deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};
