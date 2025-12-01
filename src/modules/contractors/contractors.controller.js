import Contractor from '../../models/Contractor.model.js';

/**
 * @desc    Create a new contractor service
 * @route   POST /api/contractors
 * @access  Private (contractor only)
 */
export const createContractor = async (req, res, next) => {
    try {
        const contractorData = {
            ...req.body,
            ownerId: req.user._id
        };

        const contractor = await Contractor.create(contractorData);

        res.status(201).json({
            success: true,
            message: 'Contractor service created successfully',
            data: contractor
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all contractors with search and filter
 * @route   GET /api/contractors
 * @access  Public
 */
export const getAllContractors = async (req, res, next) => {
    try {
        const { type, serviceType, city, minPrice, maxPrice, page = 1, limit = 10, status } = req.query;

        // Build filter query
        const filter = {};

        // If status is provided, use it. If 'all', don't filter. Otherwise default to 'approved'
        if (status === 'all') {
            // No approvalStatus filter
        } else if (status) {
            filter.approvalStatus = status;
        } else {
            filter.approvalStatus = 'approved';
        }

        if (type || serviceType) {
            filter.type = type || serviceType;
        }

        if (city) {
            filter['location.city'] = new RegExp(city, 'i');
        }

        if (minPrice || maxPrice) {
            filter.basePrice = {};
            if (minPrice) filter.basePrice.$gte = parseFloat(minPrice);
            if (maxPrice) filter.basePrice.$lte = parseFloat(maxPrice);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [contractors, total] = await Promise.all([
            Contractor.find(filter)
                .populate('ownerId', 'name email phone')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            Contractor.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: contractors,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single contractor by ID
 * @route   GET /api/contractors/:id
 * @access  Public
 */
export const getContractorById = async (req, res, next) => {
    try {
        const contractor = await Contractor.findById(req.params.id)
            .populate('ownerId', 'name email phone');

        if (!contractor) {
            return res.status(404).json({
                success: false,
                message: 'Contractor not found'
            });
        }

        res.json({
            success: true,
            data: contractor
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update contractor
 * @route   PUT /api/contractors/:id
 * @access  Private (owner or admin)
 */
export const updateContractor = async (req, res, next) => {
    try {
        const contractor = await Contractor.findById(req.params.id);

        if (!contractor) {
            return res.status(404).json({
                success: false,
                message: 'Contractor not found'
            });
        }

        // Check ownership
        if (contractor.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this contractor'
            });
        }

        // If updating after approval, reset approval status
        if (contractor.approvalStatus === 'approved') {
            req.body.approvalStatus = 'pending';
        }

        const updatedContractor = await Contractor.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Contractor updated successfully',
            data: updatedContractor
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete contractor
 * @route   DELETE /api/contractors/:id
 * @access  Private (owner or admin)
 */
export const deleteContractor = async (req, res, next) => {
    try {
        const contractor = await Contractor.findById(req.params.id);

        if (!contractor) {
            return res.status(404).json({
                success: false,
                message: 'Contractor not found'
            });
        }

        // Check ownership
        if (contractor.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this contractor'
            });
        }

        await contractor.deleteOne();

        res.json({
            success: true,
            message: 'Contractor deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get contractors owned by current user
 * @route   GET /api/contractors/my/services
 * @access  Private (contractor)
 */
export const getMyContractors = async (req, res, next) => {
    try {
        const contractors = await Contractor.find({ ownerId: req.user._id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: contractors
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update contractor approval status
 * @route   PATCH /api/contractors/:id/approval
 * @access  Private (admin only)
 */
export const updateApprovalStatus = async (req, res, next) => {
    try {
        const { status, rejectionReason } = req.body;

        if (!['approved', 'declined'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid approval status'
            });
        }

        const updateData = { approvalStatus: status };
        if (status === 'declined' && rejectionReason) {
            updateData.rejectionReason = rejectionReason;
        }

        const contractor = await Contractor.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!contractor) {
            return res.status(404).json({
                success: false,
                message: 'Contractor not found'
            });
        }

        res.json({
            success: true,
            message: `Contractor ${status} successfully`,
            data: contractor
        });
    } catch (error) {
        next(error);
    }
};
