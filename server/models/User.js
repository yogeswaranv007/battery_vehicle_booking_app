const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/@bitsathy\.ac\.in$/, 'Please use a valid college email']
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId;
    }
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  regNumber: {
    type: String,
    required: function() {
      return this.role === 'student';
    },
    match: [/^[0-9]{7}[A-Z]{2}[0-9]{3}$/, 'Please enter a valid registration number (e.g., 7376232IT286)']
  },
  role: {
    type: String,
    enum: ['student', 'watchman', 'admin'],
    default: 'student'
  },
  phone: {
    type: String,
    required: function() {
      return this.role === 'watchman';
    }
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'inactive'],
    default: 'pending'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Prevent creation of admin users through registration (but allow through seed/direct creation)
  if (this.isNew && this.role === 'admin' && !this.allowAdminCreation) {
    const error = new Error('Admin users cannot be created through registration');
    return next(error);
  }
  
  // Set status to active for students and admins (if not already set)
  if (this.isNew && (this.role === 'student' || this.role === 'admin')) {
    if (!this.status || this.status === 'pending') {
      this.status = 'active';
    }
  }
  
  // Only hash password if it's being modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 