import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Service provider is required']
    },
    name: {
        type: String,
        required: [true, 'Service name is required'],
        trim: true,
        minlength: [3, 'Name must be at least 3 characters'],
        maxlength: [200, 'Name cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        minlength: [10, 'Description must be at least 10 characters'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['catering', 'decoration', 'photography', 'music', 'transport', 'other'],
        trim: true
    },
    pricing: {
        basePrice: {
            type: Number,
            required: [true, 'Base price is required'],
            min: [500, 'Price must be at least 500']
        },
        currency: {
            type: String,
            default: 'INR'
        },
        priceType: {
            type: String,
            enum: ['per_event', 'per_hour', 'per_day', 'custom'],
            default: 'per_event'
        }
    },
    location: {
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true
        },
        state: {
            type: String,
            required: [true, 'State is required'],
            trim: true
        },
        serviceArea: {
            type: String,
            trim: true
        }
    },
    contact: {
        phone: {
            type: String,
            required: [true, 'Contact phone is required']
        },
        email: {
            type: String,
            trim: true
        }
    },
    images: [{
        type: String,
        trim: true
    }],
    features: [{
        type: String,
        trim: true
    }],
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'declined'],
        default: 'pending'
    },
    rejectionReason: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
serviceSchema.index({ category: 1 });
serviceSchema.index({ approvalStatus: 1, isActive: 1 });
serviceSchema.index({ 'location.city': 1 });
serviceSchema.index({ provider: 1 });

// Ensure virtuals are included in JSON
serviceSchema.set('toJSON', { virtuals: true });
serviceSchema.set('toObject', { virtuals: true });

const Service = mongoose.model('Service', serviceSchema);

export default Service;
