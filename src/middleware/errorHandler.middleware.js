/**
 * Custom error classes
 */
export class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}

/**
 * Centralized error handling middleware
 * Should be the last middleware in the chain
 */
export const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.statusCode = err.statusCode || 500;

    // Log error (exclude sensitive data)
    if (process.env.NODE_ENV === 'development') {
        // Don't log stack trace for 401/403 auth errors to keep console clean
        if (error.statusCode === 401 || error.statusCode === 403) {
            console.log(`ℹ️  Auth Error: ${err.message}`);
        } else {
            console.error('❌ Error:', {
                name: err.name,
                message: err.message,
                statusCode: error.statusCode,
                stack: err.stack
            });
        }
    } else {
        // In production, log less detail
        console.error('❌ Error:', {
            name: err.name,
            message: err.message,
            statusCode: error.statusCode
        });
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        error.message = 'Invalid ID format';
        error.statusCode = 400;
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        error.message = `${field} already exists`;
        error.statusCode = 400;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message
        }));
        error.message = 'Validation failed';
        error.statusCode = 400;
        error.errors = errors;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error.message = 'Invalid token';
        error.statusCode = 401;
    }

    if (err.name === 'TokenExpiredError') {
        error.message = 'Token expired';
        error.statusCode = 401;
    }

    // Send response
    res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors || undefined,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError(`Route ${req.originalUrl} not found`);
    next(error);
};
