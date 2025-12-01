// src/modules/bookings/bookings.routes.js
import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
    createBooking,
    getMyBookings,
    getBookingById,
    getMahalBookings,
    getContractorBookings,
    updateBookingStatus,
    getAllBookings,
    seedBooking
} from './bookings.controller.js';
import {
    createBookingSchema,
    updateBookingStatusSchema
} from './bookings.validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Seed route (for testing)
router.post('/seed', seedBooking);

// User routes
router.post('/', validate({ body: createBookingSchema }), createBooking);
router.get('/my', getMyBookings);
router.get('/:id', getBookingById);

// Mahal owner routes
router.get('/mahal/received', requireRole('mahal_owner'), getMahalBookings);

// Contractor routes
router.get('/contractor/received', requireRole('contractor'), getContractorBookings);

// Status update – admin only
router.patch('/:id/status', requireRole('admin'), validate({ body: updateBookingStatusSchema }), updateBookingStatus);

// Admin routes
router.get('/admin/all', requireRole('admin'), getAllBookings);

export default router;
