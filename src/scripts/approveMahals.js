import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const approveMahals = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mahal';

        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected!\n');

        // Find all pending mahals
        const pendingMahals = await mongoose.connection.db.collection('mahals')
            .find({ approvalStatus: 'pending' })
            .toArray();

        console.log(`📋 Found ${pendingMahals.length} pending mahals:\n`);
        pendingMahals.forEach((m, i) => {
            console.log(`${i + 1}. ${m.name} (${m.location?.city || 'N/A'})`);
        });

        if (pendingMahals.length > 0) {
            console.log('\n🔄 Approving all pending mahals...');

            const result = await mongoose.connection.db.collection('mahals').updateMany(
                { approvalStatus: 'pending' },
                { $set: { approvalStatus: 'approved' } }
            );

            console.log(`✅ Updated ${result.modifiedCount} mahals to "approved" status\n`);

            // Verify
            const approvedCount = await mongoose.connection.db.collection('mahals')
                .countDocuments({ approvalStatus: 'approved' });

            console.log(`📊 Total approved mahals now: ${approvedCount}`);
        } else {
            console.log('\n✨ No pending mahals found. All mahals are already approved!');
        }

        await mongoose.connection.close();
        console.log('\n✅ Done!');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
};

approveMahals();
