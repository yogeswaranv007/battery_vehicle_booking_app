const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Location = require('../models/Location');
const Booking = require('../models/Booking');
const AuditLog = require('../models/AuditLog');
const { logAudit } = require('../utils/auditLogger');
const { sendDeactivationEmail, sendActivationEmail } = require('../utils/emailService');
const router = express.Router();

// Middleware to authenticate admin
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ 
        message: 'Account deactivated',
        details: 'Your account has been deactivated. Please contact the system administrator.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Change admin password
router.post('/change-password', authenticateAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    // Check current password
    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User Management Routes

// Get all users with optional filters
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const { role, status, search } = req.query;
    const query = { isDeleted: false };

    // Filter by role if provided
    if (role && ['student', 'watchman', 'admin'].includes(role)) {
      query.role = role;
    }

    // Filter by status if provided
    if (status && ['active', 'pending', 'inactive'].includes(status)) {
      query.status = status;
    }

    // Search by name or email if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -googleId')
      .sort({ createdAt: -1 });

    // Format response to exclude sensitive fields
    const formattedUsers = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      regNumber: user.regNumber || null,
      phone: user.phone || null,
      createdAt: user.createdAt,
      deletedAt: user.deletedAt
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new user (admin only)
router.post('/users/create', authenticateAdmin, async (req, res) => {
  try {
    const { name, email, password, role, regNumber, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: 'name, email, password, and role are required'
      });
    }

    // Validate role
    if (!['student', 'watchman', 'admin'].includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role',
        details: 'Role must be student, watchman, or admin'
      });
    }

    // Validate email format
    if (!email.match(/@bitsathy\.ac\.in$/)) {
      return res.status(400).json({ 
        message: 'Invalid email',
        details: 'Email must end with @bitsathy.ac.in'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Weak password',
        details: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists',
        details: 'A user with this email already exists'
      });
    }

    // Validate role-specific required fields
    if (role === 'student' && !regNumber) {
      return res.status(400).json({ 
        message: 'Registration number required for students',
        details: 'Format: 7376232IT286'
      });
    }

    if (role === 'watchman' && !phone) {
      return res.status(400).json({ 
        message: 'Phone number required for watchmen',
        details: 'Please provide a valid phone number'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      regNumber: role === 'student' ? regNumber : undefined,
      phone: role === 'watchman' ? phone : undefined,
      status: role === 'admin' ? 'active' : 'pending',
      allowAdminCreation: true
    });

    await user.save();

    // Return user data without password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      regNumber: user.regNumber,
      phone: user.phone,
      createdAt: user.createdAt
    };

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message
    });
  }
});

// Update user status (activate/deactivate)
router.put('/users/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    if (!['active', 'pending', 'inactive'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status',
        details: 'Status must be active, pending, or inactive'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deactivating the only admin
    if (status === 'inactive' && user.role === 'admin') {
      const activeAdmins = await User.countDocuments({ role: 'admin', status: 'active', _id: { $ne: user._id } });
      if (activeAdmins === 0) {
        return res.status(400).json({ 
          message: 'Cannot deactivate last admin',
          details: 'At least one admin must remain active'
        });
      }
    }

    user.status = status;
    await user.save();

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      regNumber: user.regNumber,
      phone: user.phone,
      createdAt: user.createdAt
    };

    res.json(userResponse);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user information (name, phone, etc.)
router.put('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, phone, regNumber } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update allowed fields
    if (name) {
      user.name = name.trim();
    }

    if (phone && user.role === 'watchman') {
      user.phone = phone.trim();
    }

    if (regNumber && user.role === 'student') {
      const regNumberRegex = /^[0-9]{7}[A-Z]{2}[0-9]{3}$/;
      if (!regNumberRegex.test(regNumber)) {
        return res.status(400).json({ 
          message: 'Invalid registration number format',
          details: 'Registration number must be in the format: 7376232IT286'
        });
      }
      user.regNumber = regNumber;
    }

    await user.save();

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      regNumber: user.regNumber,
      phone: user.phone,
      createdAt: user.createdAt
    };

    res.json(userResponse);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Soft delete user (does not delete booking history)
router.delete('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting the only admin
    if (user.role === 'admin') {
      const otherAdmins = await User.countDocuments({ role: 'admin', _id: { $ne: user._id }, isDeleted: false });
      if (otherAdmins === 0) {
        return res.status(400).json({ 
          message: 'Cannot delete last admin',
          details: 'At least one admin must remain in the system'
        });
      }
    }

    // Soft delete: mark as deleted, preserve booking history
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = req.user._id;
    await user.save();

    res.json({ 
      message: 'User deleted successfully (soft deleted)',
      note: 'Booking history preserved for audit purposes'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Location Management Routes

// Get all locations
router.get('/locations', authenticateAdmin, async (req, res) => {
  try {
    const locations = await Location.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new location
router.post('/locations', authenticateAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Location name is required' });
    }

    // Check if location already exists
    const existingLocation = await Location.findOne({ name: name.trim() });
    if (existingLocation) {
      return res.status(400).json({ message: 'Location already exists' });
    }

    const location = new Location({
      name: name.trim(),
      description: description || '',
      createdBy: req.user._id
    });

    await location.save();
    res.status(201).json(location);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update location
router.put('/locations/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Location name is required' });
    }

    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // Check if new name is already taken by another location
    const existingLocation = await Location.findOne({
      name: name.trim(),
      _id: { $ne: req.params.id }
    });
    if (existingLocation) {
      return res.status(400).json({ message: 'Location name already exists' });
    }

    location.name = name.trim();
    location.description = description || '';
    location.updatedAt = Date.now();
    await location.save();

    res.json(location);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete location
router.delete('/locations/:id', authenticateAdmin, async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    await Location.findByIdAndDelete(req.params.id);
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin booking control routes

// Approve booking (admin only)
router.put('/bookings/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending bookings can be approved' });
    }

    booking.status = 'approved';
    booking.approvedBy = req.user._id;
    booking.approvalTime = new Date();
    booking.actionHistory.push({
      action: 'approved',
      performedBy: req.user._id,
      performedAt: new Date(),
      details: `Booking approved by admin ${req.user.name || req.user.email}`
    });

    await booking.save();
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email regNumber')
      .populate('approvedBy', 'name email');
    
    res.json(populatedBooking);
  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Dispatch booking (admin only)
router.put('/bookings/:id/dispatch', authenticateAdmin, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved bookings can be dispatched' });
    }

    booking.status = 'in-progress';
    booking.dispatchTime = new Date();
    booking.actionHistory.push({
      action: 'dispatched',
      performedBy: req.user._id,
      performedAt: new Date(),
      details: `Vehicle dispatched by admin ${req.user.name || req.user.email}`
    });

    await booking.save();
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email regNumber')
      .populate('approvedBy', 'name email');
    
    res.json(populatedBooking);
  } catch (error) {
    console.error('Error dispatching booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Complete booking (admin only)
router.put('/bookings/:id/complete', authenticateAdmin, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'in-progress') {
      return res.status(400).json({ message: 'Only in-progress bookings can be completed' });
    }

    booking.status = 'completed';
    booking.completionTime = new Date();
    booking.actionHistory.push({
      action: 'completed',
      performedBy: req.user._id,
      performedAt: new Date(),
      details: `Booking completed by admin ${req.user.name || req.user.email}`
    });

    await booking.save();
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email regNumber')
      .populate('approvedBy', 'name email');
    
    res.json(populatedBooking);
  } catch (error) {
    console.error('Error completing booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete booking (admin only)
router.delete('/bookings/:id', authenticateAdmin, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Add deletion to action history before deleting
    booking.actionHistory.push({
      action: 'deleted',
      performedBy: req.user._id,
      performedAt: new Date(),
      details: `Booking deleted by admin ${req.user.name || req.user.email}`
    });
    await booking.save();

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted successfully', booking });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Edit booking (admin only)
router.put('/bookings/:id/edit', authenticateAdmin, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const { date, time, fromPlace, destination, status, assignedWatchman } = req.body;
    const changes = [];

    // Validate location if being changed
    if (fromPlace && destination && fromPlace === destination) {
      return res.status(400).json({ 
        message: 'Invalid Location Selection',
        details: 'Pickup and destination locations must be different'
      });
    }

    if (date && date !== booking.date.toISOString().split('T')[0]) {
      booking.date = new Date(date);
      changes.push(`date changed to ${date}`);
    }

    if (time && time !== booking.time) {
      booking.time = time;
      changes.push(`time changed to ${time}`);
    }

    if (fromPlace && fromPlace !== booking.fromPlace) {
      booking.fromPlace = fromPlace;
      changes.push(`pickup location changed to ${fromPlace}`);
    }

    if (destination && destination !== booking.destination) {
      booking.destination = destination;
      changes.push(`destination changed to ${destination}`);
    }

    if (status && status !== booking.status) {
      booking.status = status;
      changes.push(`status changed to ${status}`);
      
      // Update timestamps based on status
      if (status === 'approved' && !booking.approvalTime) {
        booking.approvalTime = new Date();
        booking.approvedBy = assignedWatchman || req.user._id;
      } else if (status === 'in-progress' && !booking.dispatchTime) {
        booking.dispatchTime = new Date();
      } else if (status === 'completed' && !booking.completionTime) {
        booking.completionTime = new Date();
      }
    }

    if (assignedWatchman && assignedWatchman !== booking.approvedBy?.toString()) {
      const watchman = await User.findById(assignedWatchman);
      if (watchman && watchman.role === 'watchman') {
        booking.approvedBy = assignedWatchman;
        changes.push(`watchman assigned: ${watchman.name}`);
      }
    }

    if (changes.length > 0) {
      booking.actionHistory.push({
        action: 'edited',
        performedBy: req.user._id,
        performedAt: new Date(),
        details: `Booking edited by admin ${req.user.name || req.user.email}: ${changes.join(', ')}`
      });

      await booking.save();
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email regNumber')
      .populate('approvedBy', 'name email');
    
    res.json(populatedBooking);
  } catch (error) {
    console.error('Error editing booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all bookings with filters (admin only)
router.get('/bookings/filter', authenticateAdmin, async (req, res) => {
  try {
    const { userId, watchmanId, status, startDate, endDate } = req.query;
    const query = {};

    if (userId) {
      query.user = userId;
    }

    if (watchmanId) {
      query.approvedBy = watchmanId;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email regNumber phone')
      .populate('approvedBy', 'name email')
      .populate({
        path: 'actionHistory.performedBy',
        select: 'name email role'
      })
      .sort({ date: -1, createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching filtered bookings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Deactivate User (admin only)
router.put('/users/:id/deactivate', authenticateAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.params.id;

    // Prevent admin from deactivating themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ 
        message: 'Cannot deactivate yourself',
        details: 'You cannot deactivate your own admin account'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deactivating another admin or the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isDeleted: false });
      if (adminCount <= 1) {
        return res.status(400).json({ 
          message: 'Cannot deactivate last admin',
          details: 'At least one admin must remain active'
        });
      }
    }

    // Deactivate user
    user.status = 'inactive';
    await user.save();

    // Log audit
    await logAudit('user_deactivated', user, req.user, {
      details: `User ${user.name} (${user.email}) has been deactivated`,
      reason: reason || 'No reason provided',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Send email notification
    try {
      await sendDeactivationEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Error sending deactivation email:', emailError);
    }

    res.json({ 
      message: 'User deactivated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Activate User (admin only)
router.put('/users/:id/activate', authenticateAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Activate user
    user.status = 'active';
    await user.save();

    // Log audit
    await logAudit('user_activated', user, req.user, {
      details: `User ${user.name} (${user.email}) has been activated`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Send email notification
    try {
      await sendActivationEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Error sending activation email:', emailError);
    }

    res.json({ 
      message: 'User activated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error activating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Audit Logs (admin only)
router.get('/audit-logs', authenticateAdmin, async (req, res) => {
  try {
    const { userId, action, email, limit = 100, skip = 0 } = req.query;
    const query = {};

    if (userId) {
      query.user = userId;
    }

    if (action) {
      query.action = action;
    }

    if (email) {
      query.email = { $regex: email, $options: 'i' };
    }

    const logs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .populate('performedBy', 'name email role')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await AuditLog.countDocuments(query);

    res.json({
      logs,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;