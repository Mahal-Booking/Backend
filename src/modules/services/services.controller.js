import Service from '../../models/Service.model.js';

/**
 * @desc    Get all services (with optional filtering)
 * @route   GET /api/services
 * @access  Public
 */
export const getAllServices = async (req, res, next) => {
    try {
        const { status, category, city } = req.query;
        const filter = { isActive: true };

        console.log('📊 getAllServices called with params:', req.query);

        // Status filter
        if (status === 'all') {
            // No status filter - show all
            delete filter.isActive;
        } else if (status) {
            filter.approvalStatus = status;
        } else {
            // Default: only approved services for public
            filter.approvalStatus = 'approved';
        }

        // Category filter
        if (category) {
            filter.category = category;
        }

        // City filter
        if (city) {
            filter['location.city'] = new RegExp(city, 'i');
        }

        console.log('🔍 MongoDB filter:', JSON.stringify(filter, null, 2));

        const services = await Service.find(filter)
            .populate('provider', 'name email phone')
            .sort({ createdAt: -1 });

        const total = await Service.countDocuments(filter);

        console.log(`✨ Found ${services.length} services out of ${total} total`);

        res.json({
            success: true,
            count: services.length,
            total,
            data: services
        });
    } catch (error) {
        console.error('❌ Error in getAllServices:', error);
        next(error);
    }
};

/**
 * @desc    Get single service by ID
 * @route   GET /api/services/:id
 * @access  Public
 */
export const getServiceById = async (req, res, next) => {
    try {
        const service = await Service.findById(req.params.id)
            .populate('provider', 'name email phone');

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        // Check visibility
        if (service.approvalStatus !== 'approved') {
            // If not approved, only owner or admin can view
            const isAuthorized = req.user && (
                req.user.role === 'admin' ||
                (req.user._id && service.provider._id.toString() === req.user._id.toString())
            );

            if (!isAuthorized) {
                return res.status(404).json({
                    success: false,
                    message: 'Service not found'
                });
            }
        }

        res.json({
            success: true,
            data: service
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new service
 * @route   POST /api/services
 * @access  Private (Contractor/Admin)
 */
export const createService = async (req, res, next) => {
    try {
        const serviceData = {
            ...req.body,
            provider: req.user._id,
            approvalStatus: 'pending'
        };

        const service = await Service.create(serviceData);

        console.log(`✅ Service created: ${service.name} by ${req.user.name} (Status: pending)`);

        res.status(201).json({
            success: true,
            message: 'Service submitted for approval',
            data: service
        });
    } catch (error) {
        console.error('❌ Error creating service:', error);
        next(error);
    }
};

/**
 * @desc    Update service
 * @route   PUT /api/services/:id
 * @access  Private (Owner/Admin)
 */
export const updateService = async (req, res, next) => {
    try {
        let service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        // Check ownership (unless admin)
        if (service.provider.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this service'
            });
        }

        service = await Service.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        console.log(`📝 Service updated: ${service.name}`);

        res.json({
            success: true,
            data: service
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete service
 * @route   DELETE /api/services/:id
 * @access  Private (Owner/Admin)
 */
export const deleteService = async (req, res, next) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        // Check ownership (unless admin)
        if (service.provider.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this service'
            });
        }

        await Service.findByIdAndDelete(req.params.id);

        console.log(`🗑️  Service deleted: ${service.name}`);

        res.json({
            success: true,
            message: 'Service deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update service approval status
 * @route   PATCH /api/services/:id/approval
 * @access  Private (Admin only)
 */
export const updateApprovalStatus = async (req, res, next) => {
    try {
        const { status, rejectionReason } = req.body;

        console.log(`📝 Admin approval request for service ${req.params.id}:`, { status, rejectionReason });

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
                message: 'Reason is required when declining a service'
            });
        }

        const service = await Service.findById(req.params.id).populate('provider', 'name email');

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        // Store previous status for logging
        const previousStatus = service.approvalStatus;

        // Update approval status
        service.approvalStatus = status;

        if (status === 'declined') {
            service.rejectionReason = rejectionReason;
        } else {
            // Clear rejection reason if approving
            service.rejectionReason = undefined;
        }

        await service.save();

        console.log(`✅ Service ${service.name} status changed: ${previousStatus} → ${status}`);

        res.json({
            success: true,
            message: `Service ${status} successfully`,
            data: {
                _id: service._id,
                name: service.name,
                approvalStatus: service.approvalStatus,
                rejectionReason: service.rejectionReason,
                provider: service.provider,
                updatedAt: service.updatedAt
            }
        });
    } catch (error) {
        console.error('❌ Error updating approval status:', error);
        next(error);
    }
};

/**
 * @desc    Get my services (for service provider)
 * @route   GET /api/services/my/services
 * @access  Private
 */
export const getMyServices = async (req, res, next) => {
    try {
        const services = await Service.find({ provider: req.user._id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: services.length,
            data: services
        });
    } catch (error) {
        next(error);
    }
};
