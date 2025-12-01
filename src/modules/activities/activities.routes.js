import express from 'express';
import { getAllActivities, getActivityStats, getUserActivities, cleanupOldActivities, getMyActivities } from './activities.controller.js';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/activities/me
 * @desc    Get current user's activities
 * @access  Private
 */
router.get('/me', authenticate, getMyActivities);

/**
 * @route   GET /api/activities
 * @desc    Get all user activities with pagination and filtering
 * @access  Private (Admin only)
 */
router.get('/', authenticate, requireAdmin, getAllActivities);

/**
 * @route   GET /api/activities/stats
 * @desc    Get activity statistics
 * @access  Private (Admin only)
 */
router.get('/stats', authenticate, requireAdmin, getActivityStats);

/**
 * @route   GET /api/activities/user/:userId
 * @desc    Get activities for a specific user
 * @access  Private (Admin or own user)
 */
router.get('/user/:userId', authenticate, getUserActivities);

/**
 * @route   DELETE /api/activities/cleanup
 * @desc    Delete old activities
 * @access  Private (Admin only)
 */
router.delete('/cleanup', authenticate, requireAdmin, cleanupOldActivities);

export default router;
