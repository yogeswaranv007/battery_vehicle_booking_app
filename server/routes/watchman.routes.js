const express = require('express');
const router = express.Router();
const requireRole = require('../middleware/role.middleware');
const { authenticateJWT } = require('../middleware/auth.middleware');
const bookingController = require('../controllers/booking.controller');

// Watchman-specific routes (role enforcement at group level)
router.use(authenticateJWT, requireRole('watchman'));

// Watchman: get all bookings (filtered by watchman logic)
router.get('/bookings', bookingController.getAllBookings);

// Watchman: update booking status
router.put('/bookings/:id/status', bookingController.updateStatus);

module.exports = router;
