import express from 'express';
import { register, login, refreshToken, logout, getCurrentUser, getAllUsers, createUser, updateUser, deleteUser, disableUser, enableUser } from './auth.controller.js';
import { validate } from '../../middleware/validation.middleware.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authLimiter } from '../../middleware/rateLimiter.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authLimiter, validate(registerSchema), register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authLimiter, validate(loginSchema), login);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public (requires refresh token cookie)
 */
router.post('/refresh-token', refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   GET /api/auth/users
 * @desc    Get all users (Admin only)
 * @access  Private (Admin)
 */
router.get('/users', authenticate, getAllUsers);

/**
 * @route   POST /api/auth/users
 * @desc    Create a user (Admin only)
 * @access  Private (Admin)
 */
router.post('/users', authenticate, createUser);

/**
 * @route   PUT /api/auth/users/:id
 * @desc    Update a user (Admin only)
 * @access  Private (Admin)
 */
router.put('/users/:id', authenticate, updateUser);

/**
 * @route   PATCH /api/auth/users/:id/disable
 * @desc    Disable a user for N days (Admin only)
 * @access  Private (Admin)
 */
router.patch('/users/:id/disable', authenticate, disableUser);

/**
 * @route   PATCH /api/auth/users/:id/enable
 * @desc    Enable a disabled user (Admin only)
 * @access  Private (Admin)
 */
router.patch('/users/:id/enable', authenticate, enableUser);

/**
 * @route   DELETE /api/auth/users/:id
 * @desc    Delete a user (Admin only)
 * @access  Private (Admin)
 */
router.delete('/users/:id', authenticate, deleteUser);

export default router;
