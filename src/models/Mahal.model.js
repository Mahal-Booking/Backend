import mongoose from 'mongoose';

const mahalSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Owner is required']
    },
    name: {
        type: String,
        required: [true, 'Mahal name is required'],
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
    location: {
        address: {
            type: String,
            required: [true, 'Address is required']
        },
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
        pincode: {
            type: String,
            required: [true, 'Pincode is required'],
            match: [/^[0-9]{6}$/, 'Please provide a valid 6-digit pincode']
        },
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    capacity: {
        type: Number,
        required: [true, 'Capacity is required'],
        min: [50, 'Capacity must be at least 50'],
        max: [10000, 'Capacity cannot exceed 10000']
    },
    pricing: {
        basePrice: {
            type: Number,
            required: [true, 'Base price is required'],
            min: [1000, 'Price must be at least 1000']
        },
        currency: {
            type: String,
            default: 'INR'
        }
    },
    amenities: [{
        type: String,
        trim: true
    }],
    images: [{
        type: String,
        trim: true
    }],
    availability: {
        daysInAdvance: {
            type: Number,
            default: 30
        },
        blockedDates: [{
            type: String
        }]
    },
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
mahalSchema.index({ 'location.city': 1 });
mahalSchema.index({ approvalStatus: 1, isActive: 1 });
mahalSchema.index({ capacity: 1 });
mahalSchema.index({ 'pricing.basePrice': 1 });
mahalSchema.index({ owner: 1 });

// Ensure virtuals are included in JSON
mahalSchema.set('toJSON', { virtuals: true });
mahalSchema.set('toObject', { virtuals: true });

const Mahal = mongoose.model('Mahal', mahalSchema);

export default Mahal;
