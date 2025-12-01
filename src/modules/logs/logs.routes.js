import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import {
    createLog,
    getGroupedLogs,
    getUserLogs,
    getRecentLogs,
    getActivityStats
} from './logs.controller.js';

const router = express.Router();

// Protected routes (authenticated users can log their own activities)
router.post('/', authenticate, createLog);

// Admin-only routes
router.get('/grouped', authenticate, requireRole('admin'), getGroupedLogs);
router.get('/user/:userId', authenticate, requireRole('admin'), getUserLogs);
router.get('/recent', authenticate, requireRole('admin'), getRecentLogs);
router.get('/stats', authenticate, requireRole('admin'), getActivityStats);

export default router;
