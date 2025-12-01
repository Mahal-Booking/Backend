import jwt from 'jsonwebtoken';
import User from '../../models/User.model.js';
import { AuthError } from '../../middleware/auth.middleware.js';
import { logActivity, getIpAddress, getUserAgent } from '../../utils/activityLogger.js';
import otpGenerator from 'otp-generator';
import Otp from '../../models/Otp.model.js';
import { sendOtpEmail } from '../../utils/emailService.js';

/**
 * Generate JWT access token
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
const generateAccessToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_ACCESS_SECRET || '',
        /** @type {import('jsonwebtoken').SignOptions} */({ expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' })
    );
};

/**
 * Generate JWT refresh token
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET || '',
        /** @type {import('jsonwebtoken').SignOptions} */({ expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' })
    );
};

/**
 * Set auth cookies in response
 * @param {import('express').Response} res - Express response object
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
    /** @type {import('express').CookieOptions} */
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        domain: process.env.COOKIE_DOMAIN || 'localhost'
    };

    res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

/**
 * Send OTP for signup
 * POST /api/auth/send-otp
 */
export const sendSignupOtp = async (req, res, next) => {
    try {
        const { email } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Generate OTP
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });

        // Save OTP to DB
        await Otp.create({ email, otp });

        // Send Email
        await sendOtpEmail(email, otp);

        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * Verify OTP and Register
 * POST /api/auth/verify-register
 */
export const verifyAndRegister = async (req, res, next) => {
    try {
        const { name, email, phone, password, role, otp } = req.body;

        // Verify OTP
        const otpRecord = await Otp.findOne({ email, otp }).sort({ createdAt: -1 });
        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new AuthError('Email already registered', 400);
        }

        // Create new user
        const user = await User.create({
            name,
            email,
            phone,
            password,
            role: role || 'user'
        });

        // Delete used OTPs
        await Otp.deleteMany({ email });

        // Generate tokens
        const accessToken = generateAccessToken(user._id.toString());
        const refreshToken = generateRefreshToken(user._id.toString());

        // Set cookies
        setAuthCookies(res, accessToken, refreshToken);

        // Send response (exclude password)
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: userResponse
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Register a new user (Legacy/Admin)
 * POST /api/auth/register
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const register = async (req, res, next) => {
    try {
        const { name, email, phone, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new AuthError('Email already registered', 400);
        }

        // Create new user
        const user = await User.create({
            name,
            email,
            phone,
            password,
            role: role || 'user'
        });

        // Generate tokens
        const accessToken = generateAccessToken(user._id.toString());
        const refreshToken = generateRefreshToken(user._id.toString());

        // Set cookies
        setAuthCookies(res, accessToken, refreshToken);

        // Send response (exclude password)
        const userResponse = /** @type {any} */ (user.toObject());
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: userResponse
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Login user
 * POST /api/auth/login
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user and include password for comparison
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            throw new AuthError('Email not found. Please check your email or register.', 401);
        }

        if (!user.isActive) {
            throw new AuthError('Your account has been deactivated. Please contact support.', 403);
        }

        // Check password
        const isPasswordValid = await /** @type {any} */ (user).comparePassword(password);

        if (!isPasswordValid) {
            throw new AuthError('Incorrect password. Please try again.', 401);
        }

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Set cookies
        setAuthCookies(res, accessToken, refreshToken);

        // Log activity
        logActivity({
            userId: user._id.toString(),
            action: 'login',
            description: `User ${user.name} logged in`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req)
        });

        // Send response
        const userResponse = /** @type {any} */ (user.toObject());
        delete userResponse.password;

        res.json({
            success: true,
            message: 'Login successful',
            user: userResponse
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Refresh access token using refresh token
 * POST /api/auth/refresh-token
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const refreshToken = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            throw new AuthError('Refresh token not found', 401);
        }

        // Verify refresh token
        // @ts-ignore
        const decoded = /** @type {import('jsonwebtoken').JwtPayload} */ (jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || ''));

        // Get user
        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new AuthError('User not found', 401);
        }

        if (!user.isActive) {
            throw new AuthError('Account deactivated', 403);
        }

        // Generate new tokens (token rotation)
        const newAccessToken = generateAccessToken(user._id.toString());
        const newRefreshToken = generateRefreshToken(user._id.toString());

        // Set new cookies
        setAuthCookies(res, newAccessToken, newRefreshToken);

        res.json({
            success: true,
            message: 'Token refreshed successfully'
        });

    } catch (error) {
        const err = /** @type {Error} */ (error);
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return next(new AuthError('Invalid or expired refresh token', 401));
        }
        next(error);
    }
};

/**
 * Logout user
 * POST /api/auth/logout
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const logout = async (req, res, next) => {
    try {
        // Clear cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get current user
 * GET /api/auth/me
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const getCurrentUser = async (req, res, next) => {
    try {
        // req.user is set by authenticate middleware
        res.json({ success: true, user: req.user });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all users (Admin only)
 * GET /api/auth/users
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const getAllUsers = async (req, res, next) => {
    try {
        // Ensure user is admin (this check should also be in middleware, but double check here)
        if (req.user.role !== 'admin') {
            throw new AuthError('Not authorized to view all users', 403);
        }

        const users = await User.find().select('-password').sort({ createdAt: -1 });

        res.json({
            success: true,
            data: users
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Create user (Admin only)
 * POST /api/auth/users
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const createUser = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            throw new AuthError('Not authorized to create users', 403);
        }

        const { name, email, phone, password, role, isActive } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new AuthError('Email already registered', 400);
        }

        const user = await User.create({
            name,
            email,
            phone,
            password,
            role: role || 'user',
            isActive: isActive !== undefined ? isActive : true
        });

        const userResponse = /** @type {any} */ (user.toObject());
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: userResponse
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update user (Admin only)
 * PUT /api/auth/users/:id
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const updateUser = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            throw new AuthError('Not authorized to update users', 403);
        }

        const { name, email, phone, role, isActive, password } = req.body;
        const updateData = { name, email, phone, role, isActive };

        // If password is provided, we need to handle it separately because of the pre-save hook
        // However, findByIdAndUpdate doesn't trigger pre-save hooks.
        // So if password is changing, we should find, update, and save.

        let user = await User.findById(req.params.id);
        if (!user) {
            throw new AuthError('User not found', 404);
        }

        if (password) {
            user.password = password;
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.role = role || user.role;
        if (isActive !== undefined) user.isActive = isActive;

        await user.save();

        const userResponse = /** @type {any} */ (user.toObject());
        delete userResponse.password;

        res.json({
            success: true,
            message: 'User updated successfully',
            data: userResponse
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete user (Admin only)
 * DELETE /api/auth/users/:id
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const deleteUser = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            throw new AuthError('Not authorized to delete users', 403);
        }

        // Prevent admin from deleting themselves
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            throw new AuthError('User not found', 404);
        }

        console.log(`🗑️  Admin ${req.user.name} deleted user: ${user.name} (${user.email})`);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Disable user account for N days (Admin only)
 * PATCH /api/auth/users/:id/disable
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const disableUser = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            throw new AuthError('Not authorized to disable users', 403);
        }

        const { days, reason } = req.body;

        if (!days || days < 1) {
            return res.status(400).json({
                success: false,
                message: 'Please specify number of days (minimum 1)'
            });
        }

        // Prevent admin from disabling themselves
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot disable your own account'
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            throw new AuthError('User not found', 404);
        }

        // Calculate disable until date
        const disableUntil = new Date();
        disableUntil.setDate(disableUntil.getDate() + parseInt(days));

        user.isActive = false;
        user.disabledUntil = disableUntil;

        await user.save();

        console.log(`🚫 Admin ${req.user.name} disabled user ${user.name} for ${days} days until ${disableUntil.toISOString()}`);

        res.json({
            success: true,
            message: `User disabled for ${days} days`,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isActive: user.isActive,
                disabledUntil: user.disabledUntil
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Enable user account (Admin only)
 * PATCH /api/auth/users/:id/enable
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const enableUser = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            throw new AuthError('Not authorized to enable users', 403);
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            throw new AuthError('User not found', 404);
        }

        user.isActive = true;
        user.disabledUntil = undefined;

        await user.save();

        console.log(`✅ Admin ${req.user.name} enabled user ${user.name}`);

        res.json({
            success: true,
            message: 'User enabled successfully',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isActive: user.isActive
            }
        });
    } catch (error) {
        next(error);
    }
};
