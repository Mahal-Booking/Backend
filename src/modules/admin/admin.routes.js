import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import {
    getAllMahals,
    getMahalById,
    updateApprovalStatus as updateMahalStatus
} from '../mahals/mahals.controller.js';
import {
    getAllServices,
    getServiceById,
    updateApprovalStatus as updateServiceStatus
} from '../services/services.controller.js';
import {
    getAllContractors,
    getContractorById,
    updateApprovalStatus as updateContractorStatus
} from '../contractors/contractors.controller.js';

const router = express.Router();

// Middleware to ensure only admins access these routes
router.use(authenticate, requireRole('admin'));

// --- Mahals ---

// GET /api/admin/mahals - List pending mahals (default) or filtered
router.get('/mahals', (req, res, next) => {
    // Default to pending if not specified
    if (!req.query.status) {
        req.query.status = 'pending';
    }
    getAllMahals(req, res, next);
});

// GET /api/admin/mahals/:id - View details
router.get('/mahals/:id', getMahalById);

// PATCH /api/admin/mahals/:id/status - Approve/Decline
router.patch('/mahals/:id/status', updateMahalStatus);


// --- Services ---

// GET /api/admin/services - List pending services (default) or filtered
router.get('/services', (req, res, next) => {
    // Default to pending if not specified
    if (!req.query.status) {
        req.query.status = 'pending';
    }
    getAllServices(req, res, next);
});

// GET /api/admin/services/:id - View details
router.get('/services/:id', getServiceById);

// PATCH /api/admin/services/:id/status - Approve/Decline
router.patch('/services/:id/status', updateServiceStatus);


// --- Contractors ---

// GET /api/admin/contractors - List all contractors (for Services tab)
router.get('/contractors', (req, res, next) => {
    // Pass status=all to get all contractors
    if (!req.query.status) {
        req.query.status = 'all';
    }
    getAllContractors(req, res, next);
});

// GET /api/admin/contractors/:id - View details
router.get('/contractors/:id', getContractorById);

// PATCH /api/admin/contractors/:id/status - Approve/Decline
router.patch('/contractors/:id/status', updateContractorStatus);

export default router;

