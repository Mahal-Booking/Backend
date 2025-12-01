import { AuthError } from './auth.middleware.js';

/**
 * Middleware to check if user has required role
 * @param {string} role - Required role
 * @returns {Function} Express middleware
 */
export const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AuthError('Authentication required'));
        }

        if (req.user.role !== role) {
            return next(new AuthError(`Access denied. ${role} role required.`, 403));
        }

        next();
    };
};

/**
 * Middleware to check if user has any of the specified roles
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} Express middleware
 */
export const requireAnyRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AuthError('Authentication required'));
        }

        if (!roles.includes(req.user.role)) {
            return next(new AuthError(`Access denied. One of these roles required: ${roles.join(', ')}`, 403));
        }

        next();
    };
};

/**
 * Middleware to verify resource ownership
 * Checks if the resource's ownerId matches the authenticated user's ID
 * @param {string} resourceType - Type of resource (e.g., 'mahal', 'contractor')
 * @returns {Function} Express middleware
 */
export const isOwner = (resourceType) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return next(new AuthError('Authentication required'));
            }

            // Admin can access everything
            if (req.user.role === 'admin') {
                return next();
            }

            // Get resource ID from params
            const resourceId = req.params.id;

            if (!resourceId) {
                return next(new Error('Resource ID not found in request'));
            }

            // Import the appropriate model
            let Model;
            if (resourceType === 'mahal') {
                const { default: Mahal } = await import('../models/Mahal.model.js');
                Model = Mahal;
            } else if (resourceType === 'contractor') {
                const { default: Contractor } = await import('../models/Contractor.model.js');
                Model = Contractor;
            } else {
                return next(new Error('Invalid resource type'));
            }

            // Find resource
            const resource = await Model.findById(resourceId);

            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: `${resourceType} not found`
                });
            }

            // Check ownership
            if (resource.ownerId.toString() !== req.user._id.toString()) {
                return next(new AuthError('Access denied. You do not own this resource.', 403));
            }

            // Attach resource to request for use in controller
            req.resource = resource;
            next();

        } catch (error) {
            next(error);
        }
    };
};

/**
 * Middleware to check if user is authenticated (any role)
 */
export const requireAuth = (req, res, next) => {
    if (!req.user) {
        return next(new AuthError('Authentication required'));
    }
    next();
};
