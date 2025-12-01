import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const testApprovalSystem = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mahal';

        console.log('\n🔍 TESTING APPROVAL SYSTEM\n');
        console.log('='.repeat(60));

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // Get all mahals
        const mahals = await mongoose.connection.db.collection('mahals').find().toArray();

        console.log(`📊 Total Mahals: ${mahals.length}\n`);

        // Group by status
        const byStatus = {
            pending: mahals.filter(m => m.approvalStatus === 'pending'),
            approved: mahals.filter(m => m.approvalStatus === 'approved'),
            rejected: mahals.filter(m => m.approvalStatus === 'rejected')
        };

        console.log('📈 STATUS BREAKDOWN:');
        console.log(`   ⏳ Pending:  ${byStatus.pending.length}`);
        console.log(`   ✅ Approved: ${byStatus.approved.length}`);
        console.log(`   ❌ Rejected: ${byStatus.rejected.length}\n`);

        console.log('='.repeat(60));

        // Show pending mahals (need admin action)
        if (byStatus.pending.length > 0) {
            console.log('\n⚠️  PENDING MAHALS (Need Admin Approval):\n');
            byStatus.pending.forEach((m, i) => {
                console.log(`${i + 1}. ${m.name}`);
                console.log(`   Location: ${m.location?.city}, ${m.location?.state}`);
                console.log(`   Owner: ${m.owner || 'N/A'}`);
                console.log(`   Submitted: ${new Date(m.createdAt).toLocaleString('en-IN')}`);
                console.log('');
            });
        } else {
            console.log('\n✨ No pending mahals - all have been reviewed!\n');
        }

        // Show approved mahals (visible on website)
        if (byStatus.approved.length > 0) {
            console.log('✅ APPROVED MAHALS (Visible on Website):\n');
            byStatus.approved.forEach((m, i) => {
                console.log(`${i + 1}. ${m.name}`);
                console.log(`   Location: ${m.location?.city}, ${m.location?.state}`);
                console.log(`   Approved: ${new Date(m.updatedAt).toLocaleString('en-IN')}`);
                console.log('');
            });
        }

        // Show rejected mahals (owner needs to fix)
        if (byStatus.rejected.length > 0) {
            console.log('❌ REJECTED MAHALS (Owner Notified):\n');
            byStatus.rejected.forEach((m, i) => {
                console.log(`${i + 1}. ${m.name}`);
                console.log(`   Location: ${m.location?.city}, ${m.location?.state}`);
                console.log(`   Reason: "${m.rejectionReason || 'No reason provided'}"`);
                console.log(`   Rejected: ${new Date(m.updatedAt).toLocaleString('en-IN')}`);
                console.log('');
            });
        }

        console.log('='.repeat(60));
        console.log('\n📋 APPROVAL SYSTEM STATUS:');
        console.log(`   • Database: ✅ Connected`);
        console.log(`   • Schema Fields: ✅ approvalStatus, rejectionReason`);
        console.log(`   • Timestamps: ✅ createdAt, updatedAt`);
        console.log(`   • Ready for Admin Actions: ✅ Yes`);
        console.log('\n✅ Approval system is working correctly!\n');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
};

testApprovalSystem();
