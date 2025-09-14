const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

// Default admin credentials
const DEFAULT_ADMIN = {
  name: 'System Administrator',
  email: 'admin@bitsathy.ac.in',
  password: 'Admin@123',
  role: 'admin',
  status: 'active'
};

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin account already exists:');
      console.log('Email:', existingAdmin.email);
      console.log('Password: Please use the existing password or change it through the admin panel');
      process.exit(0);
    }

    // Create admin account
    const adminUser = new User({
      ...DEFAULT_ADMIN,
      allowAdminCreation: true // Flag to bypass the pre-save restriction
    });
    await adminUser.save();

    console.log('✅ Default admin account created successfully!');
    console.log('');
    console.log('📧 Admin Email: admin@bitsathy.ac.in');
    console.log('🔑 Admin Password: Admin@123');
    console.log('');
    console.log('⚠️  IMPORTANT: Please change the default password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    process.exit(1);
  }
};

// Run the seeder
seedAdmin();