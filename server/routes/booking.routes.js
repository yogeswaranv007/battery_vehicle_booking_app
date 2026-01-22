const express = require('express');
const router = express.Router();
const passport = require('passport');
const bookingController = require('../controllers/booking.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');
const { validateBookingData } = require('../middleware/validation.middleware');

// Public endpoint for locations list
router.get('/locations/list', bookingController.listLocations);

// Admin/Watchman: get all bookings (with optional date filter)
router.get('/', passport.authenticate('jwt', { session: false }), bookingController.getAllBookings);

// User: get my bookings
router.get('/my-bookings', passport.authenticate('jwt', { session: false }), bookingController.getMyBookings);

// Student: create booking (with active check + validation)
router.post('/', authenticateJWT, validateBookingData, bookingController.createBooking);

// Admin/Watchman: update booking status (with active check)
router.put('/:id/status', authenticateJWT, bookingController.updateStatus);

module.exports = router;
