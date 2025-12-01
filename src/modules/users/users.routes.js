import express from 'express';
import {
    getUserDetails,
    disableUser,
    enableUser,
    disableUserOrders,
    enableUserOrders,
    deleteBooking
} from './users.controller.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/users/:userId
 * @desc    Get user details with booking history
 * @access  Private (Admin only)
 */
router.get('/:userId', authenticate, requireAdmin, getUserDetails);

/**
 * @route   POST /api/users/:userId/disable
 * @desc    Disable user account for N days
 * @access  Private (Admin only)
 */
router.post('/:userId/disable', authenticate, requireAdmin, disableUser);

/**
 * @route   POST /api/users/:userId/enable
 * @desc    Enable user account
 * @access  Private (Admin only)
 */
router.post('/:userId/enable', authenticate, requireAdmin, enableUser);

/**
 * @route   POST /api/users/:userId/disable-orders
 * @desc    Disable orders for user for N days
 * @access  Private (Admin only)
 */
router.post('/:userId/disable-orders', authenticate, requireAdmin, disableUserOrders);

/**
 * @route   POST /api/users/:userId/enable-orders
 * @desc    Enable orders for user
 * @access  Private (Admin only)
 */
router.post('/:userId/enable-orders', authenticate, requireAdmin, enableUserOrders);

/**
 * @route   DELETE /api/users/:userId/bookings/:bookingId
 * @desc    Delete a booking
 * @access  Private (Admin only)
 */
router.delete('/:userId/bookings/:bookingId', authenticate, requireAdmin, deleteBooking);

export default router;
