const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const fixAdminStatus = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find and update admin status
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (adminUser) {
      console.log('Current admin status:', adminUser.status);
      
      if (adminUser.status !== 'active') {
        adminUser.status = 'active';
        await adminUser.save();
        console.log('✅ Admin status updated to active!');
      } else {
        console.log('✅ Admin is already active!');
      }
      
      console.log('Admin details:');
      console.log('- Email:', adminUser.email);
      console.log('- Status:', adminUser.status);
      console.log('- Role:', adminUser.role);
    } else {
      console.log('❌ No admin user found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing admin status:', error);
    process.exit(1);
  }
};

// Run the fix
fixAdminStatus();