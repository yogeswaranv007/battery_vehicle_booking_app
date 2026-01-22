const bookingService = require('../services/booking.service');

async function listLocations(req, res) {
  try {
    const result = await bookingService.listLocations();
    return res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getAllBookings(req, res) {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'watchman') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const result = await bookingService.getBookingsForAdminOrWatchman(req.user.role, req.query);
    return res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getMyBookings(req, res) {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized', details: 'User not authenticated' });
    }
    const result = await bookingService.getMyBookings(req.user._id);
    return res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function createBooking(req, res) {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Unauthorized', details: 'Only students can create bookings' });
    }
    if (req.user.status !== 'active') {
      return res.status(403).json({ message: 'Account deactivated', details: 'Your account has been deactivated by the admin. Please contact the administrator.' });
    }
    const result = await bookingService.createBooking(req.body, req.user);
    return res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function updateStatus(req, res) {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'watchman') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (req.user.status !== 'active') {
      return res.status(403).json({ message: 'Account deactivated', details: 'Your account has been deactivated by the admin. Please contact the administrator.' });
    }
    const result = await bookingService.updateBookingStatus(req.params.id, req.body, req.user);
    return res.status(result.status).json(result.body);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = {
  listLocations,
  getAllBookings,
  getMyBookings,
  createBooking,
  updateStatus,
};
