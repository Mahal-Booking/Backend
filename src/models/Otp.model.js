import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // The document will be automatically deleted after 5 minutes (300 seconds)
    }
});

// Index for faster lookups
otpSchema.index({ email: 1 });

const Otp = mongoose.model('Otp', otpSchema);

export default Otp;
