const mongoose = require('mongoose');
const crypto = require('crypto');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  otp: {
    type: String,
    required: true
  },
  otpHash: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// TTL index - auto-delete after expiration
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to hash OTP
otpSchema.statics.hashOTP = function(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

// Method to verify OTP
otpSchema.methods.verifyOTP = function(candidateOTP) {
  const hash = mongoose.model('OTP').hashOTP(candidateOTP);
  return this.otpHash === hash && !this.isUsed && this.expiresAt > new Date();
};

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
