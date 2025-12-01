import Cart from '../../models/Cart.model.js';
import Mahal from '../../models/Mahal.model.js';
import Contractor from '../../models/Contractor.model.js';

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
export const getCart = async (req, res, next) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id })
            .populate('mahal')
            .populate('contractors.contractor');

        if (!cart) {
            cart = await Cart.create({ user: req.user._id });
        }

        res.json({
            success: true,
            data: cart
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add mahal to cart
 * @route   POST /api/cart/mahal
 * @access  Private
 */
export const addMahalToCart = async (req, res, next) => {
    try {
        console.log('=== ADD MAHAL TO CART REQUEST ===');
        console.log('Request body:', req.body);
        console.log('User:', req.user?._id);

        const { mahalId, eventDate } = req.body;

        // Verify mahal exists
        const mahal = await Mahal.findById(mahalId);
        if (!mahal) {
            return res.status(404).json({
                success: false,
                message: 'Mahal not found'
            });
        }

        // Allow pending mahals for testing, but prefer approved
        if (mahal.approvalStatus === 'rejected') {
            return res.status(400).json({
                success: false,
                message: 'This mahal is not available for booking'
            });
        }

        // Find or create cart
        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = await Cart.create({ user: req.user._id });
        }

        // Check if mahal already in cart - replace it instead of rejecting
        if (cart.mahal) {
            console.log('Replacing existing mahal in cart');
        }

        // Add mahal to cart (eventDate is optional)
        cart.mahal = mahalId;
        if (eventDate) {
            cart.eventDate = eventDate;
        }
        await cart.save();

        await cart.populate('mahal');

        res.json({
            success: true,
            message: 'Mahal added to cart',
            data: cart
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Remove mahal from cart
 * @route   DELETE /api/cart/mahal
 * @access  Private
 */
export const removeMahalFromCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart || !cart.mahal) {
            return res.status(404).json({
                success: false,
                message: 'No mahal in cart'
            });
        }

        cart.mahal = null;
        cart.eventDate = null;
        await cart.save();

        res.json({
            success: true,
            message: 'Mahal removed from cart',
            data: cart
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add contractor to cart
 * @route   POST /api/cart/contractor
 * @access  Private
 */
export const addContractorToCart = async (req, res, next) => {
    try {
        const { contractorId } = req.body;

        // Verify contractor exists and is approved
        const contractor = await Contractor.findById(contractorId);
        if (!contractor) {
            return res.status(404).json({
                success: false,
                message: 'Contractor not found'
            });
        }

        if (contractor.approvalStatus !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'This contractor is not available for booking'
            });
        }

        // Find or create cart
        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = await Cart.create({ user: req.user._id });
        }

        // Check if contractor already in cart
        const existingContractor = cart.contractors.find(
            c => c.contractor.toString() === contractorId
        );

        if (existingContractor) {
            return res.status(400).json({
                success: false,
                message: 'Contractor already in cart'
            });
        }

        // Add contractor to cart
        cart.contractors.push({ contractor: contractorId });
        await cart.save();

        await cart.populate('contractors.contractor');

        res.json({
            success: true,
            message: 'Contractor added to cart',
            data: cart
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Remove contractor from cart
 * @route   DELETE /api/cart/contractor/:contractorId
 * @access  Private
 */
export const removeContractorFromCart = async (req, res, next) => {
    try {
        const { contractorId } = req.params;

        const cart = await Cart.findOneAndUpdate(
            { user: req.user._id },
            { $pull: { contractors: { contractor: contractorId } } },
            { new: true }
        )
            .populate('mahal')
            .populate('contractors.contractor');

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        res.json({
            success: true,
            message: 'Contractor removed from cart',
            data: cart
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Clear cart
 * @route   DELETE /api/cart/reset
 * @access  Private
 */
export const clearCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.mahal = null;
        cart.eventDate = null;
        cart.contractors = [];
        await cart.save();

        res.json({
            success: true,
            message: 'Cart cleared',
            data: cart
        });
    } catch (error) {
        next(error);
    }
};
