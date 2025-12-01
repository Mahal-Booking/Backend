import express from 'express';
import {
    getAllServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
    updateApprovalStatus,
    getMyServices
} from './services.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/services/my/services
 * @desc    Get my services (for service provider)
 * @access  Private
 */
router.get('/my/services', authenticate, getMyServices);

/**
 * @route   GET /api/services
 * @desc    Get all services (with optional filtering)
 * @access  Public
 */
router.get('/', getAllServices);

/**
 * @route   GET /api/services/:id
 * @desc    Get single service by ID
 * @access  Public
 */
router.get('/:id', getServiceById);

/**
 * @route   POST /api/services
 * @desc    Create new service
 * @access  Private (Contractor/Admin)
 */
router.post('/', authenticate, createService);

/**
 * @route   PUT /api/services/:id
 * @desc    Update service
 * @access  Private (Owner/Admin)
 */
router.put('/:id', authenticate, updateService);

/**
 * @route   PATCH /api/services/:id/approval
 * @desc    Update service approval status (Admin only)
 * @access  Private (Admin)
 */
router.patch('/:id/approval', authenticate, updateApprovalStatus);

/**
 * @route   DELETE /api/services/:id
 * @desc    Delete service
 * @access  Private (Owner/Admin)
 */
router.delete('/:id', authenticate, deleteService);

export default router;
