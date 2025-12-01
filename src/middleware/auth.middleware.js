import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

/**
 * Custom error class for authentication errors
 */
export class AuthError extends Error {
    /**
     * @param {string} message - Error message
     * @param {number} [statusCode=401] - HTTP status code
     */
    constructor(message, statusCode = 401) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AuthError';
    }
}

/**
 * Middleware to verify JWT token from cookies
 * Attaches user object to req.user if valid
 */
export const authenticate = async (req, res, next) => {
    try {
        // Get token from cookie
        const token = req.cookies?.accessToken;

        if (!token) {
            throw new AuthError('Access token not found. Please login.');
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        // Get user from database (exclude password)
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            throw new AuthError('User not found. Please login again.');
        }

        // Attach user to request
        req.user = user;
        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new AuthError('Invalid token. Please login again.'));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new AuthError('Token expired. Please refresh your session.', 401));
        }
        next(error);
    }
};

/**
 * Optional authentication - doesn't fail if no token
 * Used for routes that work for both authenticated and guest users
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken;

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            const user = await User.findById(decoded.userId).select('-password');
            if (user) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Silently fail for optional auth
        next();
    }
};

/**
 * Middleware to require admin role
 * Must be used after authenticate middleware
 */
export const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return next(new AuthError('Authentication required', 401));
    }

    if (req.user.role !== 'admin') {
        return next(new AuthError('Admin privileges required', 403));
    }

    next();
};
