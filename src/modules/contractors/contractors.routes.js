import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireAnyRole, requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
    createContractor,
    getAllContractors,
    getContractorById,
    updateContractor,
    deleteContractor,
    getMyContractors,
    updateApprovalStatus
} from './contractors.controller.js';
import {
    createContractorSchema,
    updateContractorSchema,
    searchContractorSchema
} from './contractors.validation.js';

const router = express.Router();

// Public routes
router.get('/', validate({ query: searchContractorSchema }), getAllContractors);
router.get('/:id', getContractorById);

// Protected routes - Contractor
router.post(
    '/',
    authenticate,
    requireAnyRole(['contractor', 'admin']),
    validate({ body: createContractorSchema }),
    createContractor
);

router.get(
    '/my/services',
    authenticate,
    requireRole('contractor'),
    getMyContractors
);

router.put(
    '/:id',
    authenticate,
    requireAnyRole(['contractor', 'admin']),
    validate({ body: updateContractorSchema }),
    updateContractor
);

router.delete(
    '/:id',
    authenticate,
    requireAnyRole(['contractor', 'admin']),
    deleteContractor
);

// Admin routes
router.patch(
    '/:id/approval',
    authenticate,
    requireRole('admin'),
    updateApprovalStatus
);

export default router;
