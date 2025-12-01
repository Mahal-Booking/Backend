import mongoose from 'mongoose';

const contractorSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Owner ID is required']
    },
    name: {
        type: String,
        required: [true, 'Contractor name is required'],
        trim: true,
        minlength: [3, 'Name must be at least 3 characters'],
        maxlength: [200, 'Name cannot exceed 200 characters']
    },
    type: {
        type: String,
        required: [true, 'Contractor type is required'],
        enum: {
            values: ['catering', 'ice_cream', 'decoration', 'photography', 'music', 'others'],
            message: '{VALUE} is not a valid contractor type'
        }
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        minlength: [10, 'Description must be at least 10 characters'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
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
        pincode: {
            type: String,
            required: [true, 'Pincode is required'],
            match: [/^[0-9]{6}$/, 'Please provide a valid 6-digit pincode']
        }
    },
    basePrice: {
        type: Number,
        required: [true, 'Base price is required'],
        min: [0, 'Price cannot be negative']
    },
    packages: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: [0, 'Package price cannot be negative']
        }
    }],
    photos: [{
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
contractorSchema.index({ 'location.city': 1 });
contractorSchema.index({ type: 1 });
contractorSchema.index({ approvalStatus: 1, isActive: 1 });
contractorSchema.index({ basePrice: 1 });

// Virtual to populate owner details
contractorSchema.virtual('owner', {
    ref: 'User',
    localField: 'ownerId',
    foreignField: '_id',
    justOne: true
});

// Ensure virtuals are included in JSON
contractorSchema.set('toJSON', { virtuals: true });
contractorSchema.set('toObject', { virtuals: true });

const Contractor = mongoose.model('Contractor', contractorSchema);

export default Contractor;
