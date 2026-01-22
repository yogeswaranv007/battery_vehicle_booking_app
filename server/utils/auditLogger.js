const AuditLog = require('../models/AuditLog');

// Helper to log audit actions
const logAudit = async (action, user, performedBy = null, details = {}) => {
  try {
    await AuditLog.create({
      action,
      user: user?._id || user || null,
      performedBy: performedBy?._id || performedBy || null,
      email: details.email || user?.email || null,
      role: user?.role || details.role || null,
      details: details.details,
      reason: details.reason,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      status: details.status || 'success',
      errorMessage: details.errorMessage
    });
  } catch (error) {
    console.error('Error logging audit:', error);
  }
};

module.exports = { logAudit };
