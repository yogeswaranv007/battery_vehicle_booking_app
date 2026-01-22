const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: [
      'user_activated',
      'user_deactivated',
      'password_reset_requested',
      'password_reset_successful',
      'password_reset_failed',
      'login_attempt',
      'login_blocked_deactivated',
      'otp_generated',
      'otp_verified',
      'otp_verification_failed',
      'user_created',
      'user_deleted',
      'user_status_changed',
      'booking_created',
      'booking_updated',
      'booking_approved',
      'booking_rejected',
      'booking_dispatched',
      'booking_completed',
      'booking_deleted'
    ],
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Optional for self-service actions like OTP requests
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // System actions or self-service actions
  },
  email: {
    type: String,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['student', 'watchman', 'admin'],
    default: null // Optional for self-service actions
  },
  details: {
    type: String
  },
  reason: {
    type: String
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success'
  },
  errorMessage: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 7776000 // 90 days
  }
});

// Index for queries by user and timestamp
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ email: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
