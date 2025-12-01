import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication routes
 * Stricter limits to prevent brute force attacks
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 20 : 500, // Much higher for dev
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests
    skipSuccessfulRequests: true
});

/**
 * General API rate limiter
 * More lenient for general API usage
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Much higher for dev
    message: {
        success: false,
        message: 'Too many requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Rate limiter for payment routes
 * Moderate limits for payment operations
 */
export const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 payment attempts per hour
    message: {
        success: false,
        message: 'Too many payment attempts. Please try again after an hour.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
