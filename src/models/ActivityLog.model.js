import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    userName: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['user', 'mahal_owner', 'contractor', 'admin']
    },
    action: {
        type: String,
        required: true,
        enum: [
            // Common actions
            'login',
            'logout',
            'profile_update',

            // User actions
            'booking_created',
            'booking_cancelled',
            'booking_updated',

            // Mahal Owner actions
            'mahal_created',
            'mahal_updated',
            'mahal_deleted',
            'booking_viewed',

            // Contractor actions
            'service_created',
            'service_updated',
            'service_deleted',

            // Admin actions
            'mahal_approved',
            'mahal_declined',
            'service_approved',
            'service_declined',
            'contractor_approved',
            'contractor_declined',
            'user_deleted',
            'user_updated',
            'system_settings_update'
        ]
    },
    targetType: {
        type: String,
        enum: ['mahal', 'service', 'booking', 'user', 'contractor', 'system'],
        default: null
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    targetName: {
        type: String,
        default: null
    },
    description: {
        type: String,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ role: 1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
