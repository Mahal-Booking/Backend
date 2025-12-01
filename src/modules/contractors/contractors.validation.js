import { z } from 'zod';

/**
 * Validation schema for creating a contractor service
 */
export const createContractorSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(200),
    type: z.enum([
        'catering',
        'ice_cream',
        'decoration',
        'photography',
        'music',
        'others'
    ]),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
    location: z.object({
        city: z.string().min(1, 'City is required'),
        state: z.string().min(1, 'State is required'),
        pincode: z.string().regex(/^[0-9]{6}$/, 'Please provide a valid 6-digit pincode')
    }),
    basePrice: z.number().min(0, 'Price cannot be negative'),
    photos: z.array(z.string()).default([]),
    packages: z.array(z.object({
        name: z.string(),
        description: z.string(),
        price: z.number().min(0)
    })).default([])
});

/**
 * Validation schema for updating a contractor service
 */
export const updateContractorSchema = createContractorSchema.partial();

/**
 * Validation schema for contractor search/filter
 */
export const searchContractorSchema = z.object({
    serviceType: z.enum([
        'catering',
        'ice_cream',
        'decoration',
        'photography',
        'music',
        'others'
    ]).optional(),
    city: z.string().optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(10)
});
