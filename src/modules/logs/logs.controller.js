import ActivityLog from '../../models/ActivityLog.model.js';
import User from '../../models/User.model.js';

/**
 * @desc    Create activity log (for manual logging if needed)
 * @route   POST /api/logs
 * @access  Private
 */
export const createLog = async (req, res, next) => {
    try {
        const {
            action,
            description,
            targetType,
            targetId,
            targetName,
            metadata
        } = req.body;

        const log = await ActivityLog.create({
            userId: req.user._id,
            userName: req.user.name,
            role: req.user.role,
            action,
            description,
            targetType,
            targetId,
            targetName,
            metadata,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        res.status(201).json({
            success: true,
            data: log
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get grouped activity logs by user (for admin dashboard)
 * @route   GET /api/admin/logs/grouped
 * @access  Private (Admin only)
 */
export const getGroupedLogs = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;

        // Build match filter for search
        const matchFilter = search
            ? { userName: { $regex: search, $options: 'i' } }
            : {};

        // Aggregate to get last activity per user
        const groupedLogs = await ActivityLog.aggregate([
            { $match: matchFilter },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$userId',
                    userName: { $first: '$userName' },
                    role: { $first: '$role' },
                    lastAction: { $first: '$action' },
                    lastDescription: { $first: '$description' },
                    lastTime: { $first: '$createdAt' },
                    totalActivities: { $sum: 1 }
                }
            },
            { $sort: { lastTime: -1 } },
            { $skip: (parseInt(page) - 1) * parseInt(limit) },
            { $limit: parseInt(limit) }
        ]);

        // Get total count for pagination
        const totalCountResult = await ActivityLog.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: '$userId'
                }
            },
            {
                $count: 'total'
            }
        ]);

        const total = totalCountResult.length > 0 ? totalCountResult[0].total : 0;

        res.json({
            success: true,
            data: groupedLogs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all activity logs for a specific user
 * @route   GET /api/admin/logs/user/:userId
 * @access  Private (Admin only)
 */
export const getUserLogs = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [logs, total] = await Promise.all([
            ActivityLog.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            ActivityLog.countDocuments({ userId })
        ]);

        res.json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                logs
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get recent activity logs (for dashboard stats)
 * @route   GET /api/admin/logs/recent
 * @access  Private (Admin only)
 */
export const getRecentLogs = async (req, res, next) => {
    try {
        const { limit = 10 } = req.query;

        const logs = await ActivityLog.find()
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get activity statistics
 * @route   GET /api/admin/logs/stats
 * @access  Private (Admin only)
 */
export const getActivityStats = async (req, res, next) => {
    try {
        const { days = 7 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        // Get stats by action type
        const actionStats = await ActivityLog.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Get stats by role
        const roleStats = await ActivityLog.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Get daily activity count
        const dailyStats = await ActivityLog.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: {
                actionStats,
                roleStats,
                dailyStats,
                period: `Last ${days} days`
            }
        });
    } catch (error) {
        next(error);
    }
};
