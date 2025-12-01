import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI is not defined in .env');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@mahal.com';
        const adminPassword = 'admin123'; // Default password

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        const adminUser = await User.create({
            name: 'Super Admin',
            email: adminEmail,
            password: hashedPassword,
            phone: '9999999999',
            role: 'admin',
        });

        console.log('Admin user created successfully:');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
};

createAdmin();
