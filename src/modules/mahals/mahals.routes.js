import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireAnyRole, requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
    createMahal,
    getAllMahals,
    getMahalById,
    updateMahal,
    deleteMahal,
    getMyMahals,
    updateApprovalStatus
} from './mahals.controller.js';
import {
    createMahalSchema,
    updateMahalSchema,
    searchMahalSchema
} from './mahals.validation.js';

const router = express.Router();

// Public routes
router.get('/', validate({ query: searchMahalSchema }), getAllMahals);
router.get('/:id', getMahalById);

// Protected routes - Mahal Owner
router.post(
    '/',
    authenticate,
    requireAnyRole(['mahal_owner', 'admin']),
    validate({ body: createMahalSchema }),
    createMahal
);

router.get(
    '/my/listings',
    authenticate,
    requireRole('mahal_owner'),
    getMyMahals
);

router.put(
    '/:id',
    authenticate,
    requireAnyRole(['mahal_owner', 'admin']),
    validate({ body: updateMahalSchema }),
    updateMahal
);

router.delete(
    '/:id',
    authenticate,
    requireAnyRole(['mahal_owner', 'admin']),
    deleteMahal
);

// Admin routes
router.patch(
    '/:id/approval',
    authenticate,
    requireRole('admin'),
    updateApprovalStatus
);

export default router;
