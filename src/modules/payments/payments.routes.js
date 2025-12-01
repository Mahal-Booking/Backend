import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import {
    createOrder,
    verifyPayment,
    handlePaymentFailure,
    getPaymentById,
    getMyPayments
} from './payments.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.post('/failure', handlePaymentFailure);
router.get('/my/history', getMyPayments);
router.get('/:id', getPaymentById);

export default router;
