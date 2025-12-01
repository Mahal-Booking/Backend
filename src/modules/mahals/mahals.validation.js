import { z } from 'zod';

/**
 * Validation schema for creating a mahal
 */
export const createMahalSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(200),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
    location: z.object({
        address: z.string().min(5, 'Address is required'),
        city: z.string().min(2, 'City is required'),
        state: z.string().min(2, 'State is required'),
        pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode - must be 6 digits'),
        coordinates: z.object({
            latitude: z.number().optional(),
            longitude: z.number().optional()
        }).optional()
    }),
    capacity: z.number().int().min(50, 'Capacity must be at least 50').max(10000, 'Capacity cannot exceed 10000'),
    pricing: z.object({
        basePrice: z.number().min(1000, 'Base price must be at least ₹1000'),
        currency: z.string().default('INR')
    }),
    amenities: z.array(z.string()).default([]),
    images: z.array(z.string()).default([]), // Allow any string, not just URLs
    availability: z.object({
        daysInAdvance: z.number().int().min(1).default(30),
        blockedDates: z.array(z.string()).default([])
    }).optional().default({ daysInAdvance: 30, blockedDates: [] })
});

/**
 * Validation schema for updating a mahal
 */
export const updateMahalSchema = createMahalSchema.partial();

/**
 * Validation schema for mahal search/filter
 */
export const searchMahalSchema = z.object({
    city: z.string().optional().or(z.literal('')),
    minCapacity: z.coerce.number().int().optional().or(z.literal('')),
    maxCapacity: z.coerce.number().int().optional().or(z.literal('')),
    minPrice: z.coerce.number().optional().or(z.literal('')),
    maxPrice: z.coerce.number().optional().or(z.literal('')),
    amenities: z.array(z.string()).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10)
});
