import { z } from 'zod';

/**
 * Validation schema for user registration
 */
/**
 * Validation schema for user registration
 */
export const registerSchema = {
    body: z.object({
        name: z.string()
            .min(2, 'Name must be at least 2 characters')
            .max(100, 'Name cannot exceed 100 characters'),
        email: z.string()
            .email('Invalid email format')
            .toLowerCase(),
        phone: z.string()
            .regex(/^[0-9]{10}$/, 'Phone must be a valid 10-digit number'),
        password: z.string()
            .min(6, 'Password must be at least 6 characters')
            .max(100, 'Password cannot exceed 100 characters'),
        role: z.enum(['user', 'mahal_owner', 'contractor', 'admin'])
            .optional()
            .default('user')
    })
};

/**
 * Validation schema for user login
 */
export const loginSchema = {
    body: z.object({
        email: z.string()
            .email('Invalid email format')
            .toLowerCase(),
        password: z.string()
            .min(1, 'Password is required')
    })
};
