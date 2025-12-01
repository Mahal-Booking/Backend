import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/auth.routes.js';
import mahalRoutes from './modules/mahals/mahals.routes.js';
import contractorRoutes from './modules/contractors/contractors.routes.js';
import servicesRoutes from './modules/services/services.routes.js';
import cartRoutes from './modules/cart/cart.routes.js';
import bookingRoutes from './modules/bookings/bookings.routes.js';
import paymentRoutes from './modules/payments/payments.routes.js';
import activityRoutes from './modules/activities/activities.routes.js';
import userRoutes from './modules/users/users.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import logsRoutes from './modules/logs/logs.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware.js';
import { apiLimiter } from './middleware/rateLimiter.middleware.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true, // Allow cookies
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Apply general rate limiting to all routes
app.use('/api/', apiLimiter);

// Health check
app.get('/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/mahals', mahalRoutes);
app.use('/api/contractors', contractorRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/logs', logsRoutes);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Error handler - must be last
app.use(errorHandler);

export default app;
