import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
    getCart,
    addMahalToCart,
    removeMahalFromCart,
    addContractorToCart,
    removeContractorFromCart,
    clearCart
} from './cart.controller.js';
import {
    addMahalToCartSchema,
    removeMahalSchema,
    addContractorToCartSchema,
    removeContractorSchema,
    clearCartSchema
} from './cart.validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getCart);
router.post('/mahal', validate({ body: addMahalToCartSchema }), addMahalToCart);
router.delete('/mahal', validate({ body: removeMahalSchema }), removeMahalFromCart);
router.post('/contractor', validate({ body: addContractorToCartSchema }), addContractorToCart);
router.delete('/contractor/:contractorId', validate({ params: removeContractorSchema }), removeContractorFromCart);
router.delete('/reset', validate({ body: clearCartSchema }), clearCart);

export default router;
