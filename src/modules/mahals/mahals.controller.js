import Mahal from '../../models/Mahal.model.js';

/**
 * @desc    Create a new mahal
 * @route   POST /api/mahals
 * @access  Private (mahal_owner only)
 */
export const createMahal = async (req, res, next) => {
    try {
        const mahalData = {
            ...req.body,
            owner: req.user._id
        };

        const mahal = await Mahal.create(mahalData);

        res.status(201).json({
            success: true,
            message: 'Mahal created successfully',
            data: mahal
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all mahals with search and filter
 * @route   GET /api/mahals
 * @access  Public
 */
export const getAllMahals = async (req, res, next) => {
    try {
        const { city, minCapacity, maxCapacity, minPrice, maxPrice, amenities, page = 1, limit = 10, status } = req.query;

        console.log('📊 getAllMahals called with params:', req.query);

        // Build filter query
        const filter = {};

        // If status is provided, use it. If 'all', don't filter. Otherwise default to 'approved'
        if (status === 'all') {
            // No approvalStatus filter
            console.log('🔓 Fetching ALL mahals (no status filter)');
        } else if (status) {
            filter.approvalStatus = status;
            console.log(`🔒 Filtering by status: ${status}`);
        } else {
            filter.approvalStatus = 'approved';
            console.log('✅ Filtering by default status: approved');
        }

        if (city) {
            filter['location.city'] = new RegExp(city, 'i');
        }

        if (minCapacity || maxCapacity) {
            filter.capacity = {};
            if (minCapacity) filter.capacity.$gte = parseInt(minCapacity);
            if (maxCapacity) filter.capacity.$lte = parseInt(maxCapacity);
        }

        if (minPrice || maxPrice) {
            filter['pricing.basePrice'] = {};
            if (minPrice) filter['pricing.basePrice'].$gte = parseFloat(minPrice);
            if (maxPrice) filter['pricing.basePrice'].$lte = parseFloat(maxPrice);
        }

        if (amenities && amenities.length > 0) {
            const amenitiesArray = Array.isArray(amenities) ? amenities : [amenities];
            filter.amenities = { $all: amenitiesArray };
        }

        console.log('🔍 MongoDB filter:', JSON.stringify(filter, null, 2));

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [mahals, total] = await Promise.all([
            Mahal.find(filter)
                .populate('owner', 'name email phone')
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            Mahal.countDocuments(filter)
        ]);

        console.log(`✨ Found ${mahals.length} mahals out of ${total} total`);

        if (mahals.length > 0) {
            console.log('📋 Sample mahal:', {
                id: mahals[0]._id,
                name: mahals[0].name,
                approvalStatus: mahals[0].approvalStatus,
                location: mahals[0].location
            });
        } else {
            console.log('⚠️  No mahals found with current filter');
            // Let's check if there are ANY mahals in the database
            const allMahalsCount = await Mahal.countDocuments({});
            console.log(`📊 Total mahals in database (no filter): ${allMahalsCount}`);

            if (allMahalsCount > 0) {
                const sampleMahal = await Mahal.findOne({});
                console.log('📋 Sample mahal from DB:', {
                    id: sampleMahal?._id,
                    name: sampleMahal?.name,
                    approvalStatus: sampleMahal?.approvalStatus,
                    location: sampleMahal?.location
                });
            }
        }

        res.json({
            success: true,
            data: mahals,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('❌ Error in getAllMahals:', error);
        next(error);
    }
};

/**
 * @desc    Get single mahal by ID
 * @route   GET /api/mahals/:id
 * @access  Public
 */
export const getMahalById = async (req, res, next) => {
    try {
        const mahal = await Mahal.findById(req.params.id)
            .populate('owner', 'name email phone');

        if (!mahal) {
            return res.status(404).json({
                success: false,
                message: 'Mahal not found'
            });
        }

        // Check visibility
        if (mahal.approvalStatus !== 'approved') {
            // If not approved, only owner or admin can view
            const isAuthorized = req.user && (
                req.user.role === 'admin' ||
                (req.user._id && mahal.owner._id.toString() === req.user._id.toString())
            );

            if (!isAuthorized) {
                return res.status(404).json({
                    success: false,
                    message: 'Mahal not found' // Hide unapproved mahals
                });
            }
        }

        res.json({
            success: true,
            data: mahal
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update mahal
 * @route   PUT /api/mahals/:id
 * @access  Private (owner or admin)
 */
export const updateMahal = async (req, res, next) => {
    try {
        const mahal = await Mahal.findById(req.params.id);

        if (!mahal) {
            return res.status(404).json({
                success: false,
                message: 'Mahal not found'
            });
        }

        // Check ownership
        if (mahal.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this mahal'
            });
        }

        // If updating after approval, reset approval status
        if (mahal.approvalStatus === 'approved') {
            req.body.approvalStatus = 'pending';
        }

        const updatedMahal = await Mahal.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Mahal updated successfully',
            data: updatedMahal
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete mahal
 * @route   DELETE /api/mahals/:id
 * @access  Private (owner or admin)
 */
export const deleteMahal = async (req, res, next) => {
    try {
        const mahal = await Mahal.findById(req.params.id);

        if (!mahal) {
            return res.status(404).json({
                success: false,
                message: 'Mahal not found'
            });
        }

        // Check ownership
        if (mahal.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this mahal'
            });
        }

        await mahal.deleteOne();

        res.json({
            success: true,
            message: 'Mahal deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get mahals owned by current user
 * @route   GET /api/mahals/my/listings
 * @access  Private (mahal_owner)
 */
export const getMyMahals = async (req, res, next) => {
    try {
        const mahals = await Mahal.find({ owner: req.user._id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: mahals
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update mahal approval status
 * @route   PATCH /api/mahals/:id/approval
 * @access  Private (admin only)
 */
export const updateApprovalStatus = async (req, res, next) => {
    try {
        const { status, rejectionReason } = req.body;

        console.log(`📝 Admin approval request for mahal ${req.params.id}:`, { status, rejectionReason });

        if (!['approved', 'declined'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid approval status. Must be "approved" or "declined"'
            });
        }

        // If declining, require a reason
        if (status === 'declined' && !rejectionReason) {
            return res.status(400).json({
                success: false,
                message: 'Reason is required when declining a mahal'
            });
        }

        const mahal = await Mahal.findById(req.params.id).populate('owner', 'name email');

        if (!mahal) {
            return res.status(404).json({
                success: false,
                message: 'Mahal not found'
            });
        }

        // Store previous status for logging
        const previousStatus = mahal.approvalStatus;

        // Update approval status
        mahal.approvalStatus = status;

        if (status === 'declined') {
            mahal.rejectionReason = rejectionReason;
        } else {
            // Clear rejection reason if approving
            mahal.rejectionReason = undefined;
        }

        await mahal.save();

        console.log(`✅ Mahal ${mahal.name} status changed: ${previousStatus} → ${status}`);

        res.json({
            success: true,
            message: `Mahal ${status} successfully`,
            data: {
                _id: mahal._id,
                name: mahal.name,
                approvalStatus: mahal.approvalStatus,
                rejectionReason: mahal.rejectionReason,
                owner: mahal.owner,
                updatedAt: mahal.updatedAt
            }
        });
    } catch (error) {
        console.error('❌ Error updating approval status:', error);
        next(error);
    }
};
