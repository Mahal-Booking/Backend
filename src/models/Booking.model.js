import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    mahalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mahal',
        required: [true, 'Mahal ID is required']
    },
    contractorItems: [{
        contractorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Contractor',
            required: true
        },
        packageId: {
            type: String,
            required: true
        },
        packageName: {
            type: String,
            required: true
        },
        priceAtBooking: {
            type: Number,
            required: true,
            min: [0, 'Price cannot be negative']
        },
        quantity: {
            type: Number,
            default: 1,
            min: [1, 'Quantity must be at least 1']
        }
    }],
    eventDate: {
        type: Date,
        required: [true, 'Event date is required'],
        validate: {
            validator: function (value) {
                return value > new Date();
            },
            message: 'Event date must be in the future'
        }
    },
    guestCount: {
        type: Number,
        required: [true, 'Guest count is required'],
        min: [1, 'Guest count must be at least 1']
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'confirmed', 'cancelled', 'completed'],
            message: '{VALUE} is not a valid status'
        },
        default: 'pending'
    },
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: [0, 'Total amount cannot be negative']
    },
    paymentStatus: {
        type: String,
        enum: {
            values: ['unpaid', 'paid', 'refunded', 'failed'],
            message: '{VALUE} is not a valid payment status'
        },
        default: 'unpaid'
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
bookingSchema.index({ userId: 1 });
bookingSchema.index({ mahalId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ eventDate: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ 'contractorItems.contractorId': 1 });

// Virtual populate for user details
bookingSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

// Virtual populate for mahal details
bookingSchema.virtual('mahal', {
    ref: 'Mahal',
    localField: 'mahalId',
    foreignField: '_id',
    justOne: true
});

// Ensure virtuals are included in JSON
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
