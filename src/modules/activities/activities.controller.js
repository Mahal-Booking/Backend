import UserActivity from '../../models/UserActivity.model.js';
import { AuthError } from '../../middleware/auth.middleware.js';

/**
 * Get all user activities with pagination and filtering
 * GET /api/activities
 */
export const getAllActivities = async (req, res, next) => {
    try {
        // Ensure user is admin
        if (req.user.role !== 'admin') {
            throw new AuthError('Not authorized to view activities', 403);
        }

        const {
            page = 1,
            limit = 20,
            userId,
            action,
            startDate,
            endDate
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build filter query
        const filter = {};

        if (userId) {
            filter.userId = userId;
        }

        if (action) {
            filter.action = action;
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Fetch activities with user information
        const [activities, total] = await Promise.all([
            UserActivity.find(filter)
                .populate('userId', 'name email role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            UserActivity.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: activities,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get activity statistics
 * GET /api/activities/stats
 */
export const getActivityStats = async (req, res, next) => {
    try {
        // Ensure user is admin
        if (req.user.role !== 'admin') {
            throw new AuthError('Not authorized to view activity stats', 403);
        }

        const { days = 7 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const stats = await UserActivity.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        const totalActivities = await UserActivity.countDocuments({
            createdAt: { $gte: startDate }
        });

        res.json({
            success: true,
            data: {
                stats,
                totalActivities,
                period: `Last ${days} days`
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get activities for a specific user
 * GET /api/activities/user/:userId
 */
export const getUserActivities = async (req, res, next) => {
    try {
        // Ensure user is admin or viewing their own activities
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.userId) {
            throw new AuthError('Not authorized to view these activities', 403);
        }

        const { page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [activities, total] = await Promise.all([
            UserActivity.find({ userId: req.params.userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            UserActivity.countDocuments({ userId: req.params.userId })
        ]);

        res.json({
            success: true,
            data: activities,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get current user's activities
 * GET /api/activities/me
 */
export const getMyActivities = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [activities, total] = await Promise.all([
            UserActivity.find({ userId: req.user._id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            UserActivity.countDocuments({ userId: req.user._id })
        ]);

        res.json({
            success: true,
            data: activities,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete old activities (cleanup)
 * DELETE /api/activities/cleanup
 */
export const cleanupOldActivities = async (req, res, next) => {
    try {
        // Ensure user is admin
        if (req.user.role !== 'admin') {
            throw new AuthError('Not authorized to cleanup activities', 403);
        }

        const { days = 90 } = req.body;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

        const result = await UserActivity.deleteMany({
            createdAt: { $lt: cutoffDate }
        });

        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} activities older than ${days} days`
        });

    } catch (error) {
        next(error);
    }
};
