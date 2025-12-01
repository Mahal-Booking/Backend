import ActivityLog from '../models/ActivityLog.model.js';

/**
 * Log user activity
 * @param {Object} params - Activity parameters
 * @param {string} params.userId - User ID performing the action
 * @param {string} params.userName - User name
 * @param {string} params.role - User role
 * @param {string} params.action - Action type (login, mahal_created, etc.)
 * @param {string} params.description - Human-readable description
 * @param {string} [params.targetType] - Type of target resource (mahal, service, etc.)
 * @param {string} [params.targetId] - ID of target resource
 * @param {string} [params.targetName] - Name of target resource
 * @param {string} [params.ipAddress] - User's IP address
 * @param {string} [params.userAgent] - User's browser agent
 * @param {Object} [params.metadata] - Additional metadata
 */
export const logActivity = async ({
    userId,
    userName,
    role,
    action,
    description,
    targetType = null,
    targetId = null,
    targetName = null,
    ipAddress = null,
    userAgent = null,
    metadata = {}
}) => {
    try {
        await ActivityLog.create({
            userId,
            userName,
            role,
            action,
            description,
            targetType,
            targetId,
            targetName,
            ipAddress,
            userAgent,
            metadata
        });
    } catch (error) {
        // Log the error but don't throw to avoid breaking the main operation
        console.error('Error logging activity:', error);
    }
};

/**
 * Get IP address from request
 * @param {Object} req - Express request object
 * @returns {string} IP address
 */
export const getIpAddress = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0] ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        'unknown';
};

/**
 * Get user agent from request
 * @param {Object} req - Express request object
 * @returns {string} User agent
 */
export const getUserAgent = (req) => {
    return req.headers['user-agent'] || 'unknown';
};
