import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'login',
            'logout',
            'register',
            'create_mahal',
            'update_mahal',
            'delete_mahal',
            'create_service',
            'update_service',
            'delete_service',
            'create_user',
            'update_user',
            'delete_user',
            'approve_mahal',
            'reject_mahal',
            'approve_service',
            'reject_service',
            'other'
        ]
    },
    targetType: {
        type: String,
        enum: ['User', 'Mahal', 'Contractor', 'Booking', 'Other'],
        default: 'Other'
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'targetType'
    },
    description: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes for better query performance
userActivitySchema.index({ userId: 1, createdAt: -1 });
userActivitySchema.index({ action: 1, createdAt: -1 });
userActivitySchema.index({ createdAt: -1 });

const UserActivity = mongoose.model('UserActivity', userActivitySchema);

export default UserActivity;
