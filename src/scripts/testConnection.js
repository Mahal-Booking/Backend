import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const testConnection = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mahal';

        console.log('🔌 Testing MongoDB connection...');
        console.log('📍 URI:', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));

        await mongoose.connect(mongoUri);

        console.log('✅ Connected successfully!');
        console.log('📦 Database:', mongoose.connection.name);

        // List collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📚 Collections in database:');
        collections.forEach(c => console.log(`  - ${c.name}`));

        // Check mahals collection
        const mahalsCount = await mongoose.connection.db.collection('mahals').countDocuments();
        console.log(`\n✨ Total mahals in collection: ${mahalsCount}`);

        if (mahalsCount > 0) {
            console.log('\n📋 First 3 mahals:');
            const mahals = await mongoose.connection.db.collection('mahals').find().limit(3).toArray();
            mahals.forEach((m, i) => {
                console.log(`\n${i + 1}. ${m.name || 'Unnamed'}`);
                console.log(`   ID: ${m._id}`);
                console.log(`   Status: ${m.approvalStatus || 'N/A'}`);
                console.log(`   Location: ${m.location?.city || 'N/A'}, ${m.location?.state || 'N/A'}`);
                console.log(`   Capacity: ${m.capacity || 'N/A'}`);
                console.log(`   Price: ₹${m.pricing?.basePrice || m.basePrice || 'N/A'}`);
            });
        } else {
            console.log('\n⚠️  No mahals found in the database!');
            console.log('Please check:');
            console.log('1. Are you connected to the correct database?');
            console.log('2. Did you upload data to the "mahals" collection?');
            console.log('3. Is the collection name spelled correctly?');
        }

        await mongoose.connection.close();
        console.log('\n✅ Test completed');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
};

testConnection();
