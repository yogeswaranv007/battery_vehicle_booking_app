const express = require('express');
const router = express.Router();
const requireRole = require('../middleware/role.middleware');
const { authenticateJWT } = require('../middleware/auth.middleware');
const { validateBookingData } = require('../middleware/validation.middleware');
const bookingController = require('../controllers/booking.controller');

// Student-specific routes (role enforcement at group level)
router.use(authenticateJWT, requireRole('student'));

// Student: create booking (with validation)
router.post('/bookings', validateBookingData, bookingController.createBooking);

// Student: get my bookings
router.get('/bookings', bookingController.getMyBookings);

module.exports = router;
