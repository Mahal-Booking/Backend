import { z } from 'zod';

/**
 * Validation schema for creating a booking
 */
export const createBookingSchema = z.object({
    eventDate: z.string().refine((date) => {
        const eventDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate >= today;
    }, 'Event date must be in the future'),
    guestCount: z.number().int().min(1, 'Guest count must be at least 1'),
    specialRequests: z.string().optional()
});

/**
 * Validation schema for updating booking status
 */
export const updateBookingStatusSchema = z.object({
    status: z.enum(['confirmed', 'cancelled', 'completed'])
});
