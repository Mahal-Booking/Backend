import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    },
    role: {
        type: String,
        enum: ['user', 'mahal_owner', 'contractor', 'admin'],
        default: 'user'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    disabledUntil: {
        type: Date,
        default: undefined
    },
    ordersDisabledUntil: {
        type: Date,
        default: undefined
    }
}, {
    timestamps: true
});

// Index for faster email lookups
userSchema.index({ email: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
    // Only hash if password is modified
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Compare provided password with stored hash
 * @param {string} candidatePassword - Password to check
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Get user object without sensitive data
 * @returns {Object}
 */
userSchema.methods.toSafeObject = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
