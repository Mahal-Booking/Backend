// src/config/database.config.js
import mongoose from 'mongoose';

/**
 * Connect to MongoDB database.
 * Uses MONGODB_URI env var or falls back to a local dev DB.
 */
export const connectDB = async () => {
    try {
        const mongoUri =
            process.env.MONGODB_URI || 'mongodb://localhost:27017/mahal';

        console.log('🔌 Attempting to connect to MongoDB...');
        console.log('📍 Connection URI:', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')); // Hide password

        const conn = await mongoose.connect(mongoUri);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📦 Database Name: ${conn.connection.name}`);

        // List all collections
        const collections = await conn.connection.db.listCollections().toArray();
        console.log('📚 Available collections:', collections.map(c => c.name).join(', '));

        // Check mahals collection specifically
        const mahalsCollection = collections.find(c => c.name === 'mahals');
        if (mahalsCollection) {
            const count = await conn.connection.db.collection('mahals').countDocuments();
            console.log(`✨ Mahals collection found with ${count} documents`);

            if (count > 0) {
                const sample = await conn.connection.db.collection('mahals').findOne();
                console.log('📋 Sample mahal document:', {
                    _id: sample._id,
                    name: sample.name,
                    approvalStatus: sample.approvalStatus,
                    hasLocation: !!sample.location,
                    hasPricing: !!sample.pricing
                });
            }
        } else {
            console.log('⚠️  Mahals collection not found in database!');
        }

        // Connection event listeners
        mongoose.connection.on('error', (err) => {
            console.error(`❌ MongoDB connection error: ${err}`);
        });
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️  MongoDB disconnected');
        });

        // Graceful shutdown on SIGINT (Ctrl+C)
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });
    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        console.error('Full error:', error);
        process.exit(1);
    }
};

