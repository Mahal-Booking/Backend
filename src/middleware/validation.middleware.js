import { z } from 'zod';

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
    constructor(message, errors = []) {
        super(message);
        this.statusCode = 400;
        this.name = 'ValidationError';
        this.errors = errors;
    }
}

/**
 * Middleware factory to validate request data using Zod schemas
 * @param {Object} schemas - Object containing schemas for body, params, query
 * @param {z.ZodSchema} [schemas.body] - Schema for request body
 * @param {z.ZodSchema} [schemas.params] - Schema for request params
 * @param {z.ZodSchema} [schemas.query] - Schema for request query
 * @returns {Function} Express middleware
 */
export const validate = (schemas) => {
    return async (req, res, next) => {
        try {
            const errors = [];

            // Validate body
            if (schemas.body) {
                try {
                    req.body = await schemas.body.parseAsync(req.body);
                } catch (error) {
                    if (error instanceof z.ZodError) {
                        errors.push(...error.errors.map(err => ({
                            field: err.path.join('.'),
                            message: err.message,
                            location: 'body'
                        })));
                    }
                }
            }

            // Validate params
            if (schemas.params) {
                try {
                    req.params = await schemas.params.parseAsync(req.params);
                } catch (error) {
                    if (error instanceof z.ZodError) {
                        errors.push(...error.errors.map(err => ({
                            field: err.path.join('.'),
                            message: err.message,
                            location: 'params'
                        })));
                    }
                }
            }

            // Validate query
            if (schemas.query) {
                try {
                    req.query = await schemas.query.parseAsync(req.query);
                } catch (error) {
                    if (error instanceof z.ZodError) {
                        errors.push(...error.errors.map(err => ({
                            field: err.path.join('.'),
                            message: err.message,
                            location: 'query'
                        })));
                    }
                }
            }

            // If there are validation errors, throw
            if (errors.length > 0) {
                console.log('Validation failed:', JSON.stringify(errors, null, 2));
                console.log('Request body:', JSON.stringify(req.body, null, 2));
                throw new ValidationError('Validation failed', errors);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};
