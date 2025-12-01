import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const checkMahals = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mahal';

        await mongoose.connect(mongoUri);

        const mahals = await mongoose.connection.db.collection('mahals').find().toArray();

        console.log('\n📊 MAHAL STATUS REPORT\n');
        console.log('='.repeat(60));

        const byStatus = {
            approved: mahals.filter(m => m.approvalStatus === 'approved'),
            pending: mahals.filter(m => m.approvalStatus === 'pending'),
            rejected: mahals.filter(m => m.approvalStatus === 'rejected'),
            other: mahals.filter(m => !m.approvalStatus || !['approved', 'pending', 'rejected'].includes(m.approvalStatus))
        };

        console.log(`Total Mahals: ${mahals.length}\n`);
        console.log(`✅ Approved: ${byStatus.approved.length}`);
        console.log(`⏳ Pending:  ${byStatus.pending.length}`);
        console.log(`❌ Rejected: ${byStatus.rejected.length}`);
        console.log(`❓ Other:    ${byStatus.other.length}\n`);
        console.log('='.repeat(60));

        if (mahals.length > 0) {
            console.log('\n📋 ALL MAHALS:\n');
            mahals.forEach((m, i) => {
                const statusIcon = m.approvalStatus === 'approved' ? '✅' :
                    m.approvalStatus === 'pending' ? '⏳' :
                        m.approvalStatus === 'rejected' ? '❌' : '❓';
                console.log(`${i + 1}. ${statusIcon} ${m.name || 'Unnamed'}`);
                console.log(`   Location: ${m.location?.city || 'N/A'}, ${m.location?.state || 'N/A'}`);
                console.log(`   Capacity: ${m.capacity || 'N/A'} | Price: ₹${m.pricing?.basePrice || m.basePrice || 'N/A'}`);
                console.log(`   Status: ${m.approvalStatus || 'N/A'}`);
                console.log(`   ID: ${m._id}\n`);
            });
        }

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

checkMahals();
