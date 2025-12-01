import { z } from 'zod';

// Schema for adding a Mahal to cart
export const addMahalToCartSchema = z.object({
    mahalId: z.string().min(1, 'Mahal ID is required'),
    eventDate: z.string().optional()
});

// Schema for removing Mahal (no body needed)
export const removeMahalSchema = z.object({});

// Schema for adding a Contractor to cart
export const addContractorToCartSchema = z.object({
    contractorId: z.string().uuid().or(z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId'))
});

// Schema for removing contractor
export const removeContractorSchema = z.object({
    contractorId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId')
});

// Schema for clearing cart (no body)
export const clearCartSchema = z.object({});
