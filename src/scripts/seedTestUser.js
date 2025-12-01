// Seed script to create a test user for login
import dotenv from 'dotenv';
import { connectDB } from '../config/database.config.js';
import User from '../models/User.model.js';

dotenv.config();

const createTestUser = async () => {
    try {
        await connectDB();
        const email = 'test@example.com';
        const existing = await User.findOne({ email });
        if (existing) {
            console.log('Test user already exists');
            process.exit(0);
        }
        const user = new User({
            name: 'Test User',
            email,
            phone: '1234567890',
            password: 'password123', // will be hashed by pre-save hook
            role: 'user'
        });
        await user.save();
        console.log('Test user created successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error creating test user:', err);
        process.exit(1);
    }
};

createTestUser();
