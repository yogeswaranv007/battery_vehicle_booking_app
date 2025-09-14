const express = require('express');
const router = express.Router();
const passport = require('passport');
const Booking = require('../models/Booking');

// Get bookings for admin/watchman, with optional date filter
router.get('/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'watchman') {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const { date } = req.query;
      const query = {};

      // For watchman, restrict to pending + completed; admin sees all
      if (req.user.role === 'watchman') {
        query.status = { $in: ['pending', 'completed'] };
      }

      if (date) {
        // Convert provided date (YYYY-MM-DD) to Date at UTC midnight for matching
        const d = new Date(date);
        if (!isNaN(d.getTime())) {
          d.setUTCHours(0, 0, 0, 0);
          query.date = d;
        }
      }

      const bookings = await Booking.find(query)
        .populate('user', 'name email')
        .sort({ date: 1, time: 1, createdAt: -1 });
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Get user's bookings
router.get('/my-bookings',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      if (!req.user || !req.user._id) {
        console.error('No user found in request');
        return res.status(401).json({ 
          message: 'Unauthorized',
          details: 'User not authenticated'
        });
      }

      console.log('Fetching bookings for user:', req.user._id);
      const bookings = await Booking.find({ user: req.user._id })
        .populate({
          path: 'user',
          select: 'name email',
          model: 'User'
        })
        .sort({ date: -1, createdAt: -1 });
      
      console.log('Found bookings:', bookings);
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({ 
          message: 'Invalid user ID',
          details: 'The provided user ID is not valid'
        });
      }
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          message: 'Validation error',
          details: Object.values(error.errors).map(err => err.message)
        });
      }
      res.status(500).json({ 
        message: 'Server error', 
        error: error.message,
        details: 'Failed to fetch bookings. Please try again later.',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

// Create new booking
router.post('/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { date, time, fromPlace, destination } = req.body;
      console.log('Received booking request:', { 
        date,
        time,
        fromPlace,
        destination, 
        user: req.user._id,
        userRole: req.user.role 
      });

      // Validate required fields
      if (!date || !time || !fromPlace || !destination) {
        console.log('Missing required fields:', { date, time, destination });
        return res.status(400).json({ 
          message: 'Missing required fields',
          details: {
            date: !date ? 'Date is required' : undefined,
            time: !time ? 'Time is required' : undefined,
            fromPlace: !fromPlace ? 'From place is required' : undefined,
            destination: !destination ? 'Destination is required' : undefined
          }
        });
      }

      // Validate date format and convert to local date
      let bookingDate;
      try {
        bookingDate = new Date(date);
        if (isNaN(bookingDate.getTime())) {
          throw new Error('Invalid date');
        }
        // Set time to start of day in local timezone
        bookingDate.setUTCHours(0, 0, 0, 0);
        console.log('Converted booking date:', bookingDate.toISOString());
      } catch (error) {
        console.error('Date conversion error:', error);
        return res.status(400).json({ 
          message: 'Invalid date format',
          details: 'Please provide a valid date in YYYY-MM-DD format'
        });
      }

      // Validate time format
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(time)) {
        console.log('Invalid time format:', time);
        return res.status(400).json({ 
          message: 'Invalid time format',
          details: 'Time must be in HH:MM format (24-hour), e.g., 14:30 or 09:15'
        });
      }

      // Check if slot is available (same date and time)
      const existingBooking = await Booking.findOne({
        date: bookingDate,
        time,
        status: { $in: ['pending', 'approved'] }
      });

      if (existingBooking) {
        console.log('Time slot already booked:', existingBooking);
        return res.status(400).json({ 
          message: 'Time slot already booked',
          details: 'This time slot has already been booked by another user'
        });
      }

      // Create new booking
      const booking = new Booking({
        user: req.user._id,
        date: bookingDate,
        time,
        fromPlace,
        destination,
        status: 'pending'
      });

      console.log('Attempting to save booking:', booking);
      await booking.save();
      console.log('Booking created successfully:', booking);
      
      res.status(201).json(booking);
    } catch (error) {
      console.error('Error creating booking:', error);
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        console.error('Validation errors:', validationErrors);
        return res.status(400).json({ 
          message: 'Validation error',
          details: validationErrors
        });
      }
      if (error.name === 'MongoError' && error.code === 11000) {
        console.error('Duplicate booking error:', error);
        return res.status(400).json({ 
          message: 'Duplicate booking',
          details: 'A booking already exists for this date and time'
        });
      }
      res.status(500).json({ 
        message: 'Server error', 
        error: error.message,
        details: 'An unexpected error occurred while creating the booking'
      });
    }
  }
);

// Update booking status (admin and watchman only)
router.put('/:id/status',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'watchman') {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const { status } = req.body;
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        console.error('Booking not found for ID:', req.params.id);
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Validate status values
      const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
      if (!validStatuses.includes(status)) {
        console.error('Invalid status value:', status);
        return res.status(400).json({ 
          message: 'Invalid status',
          details: 'Status must be one of: pending, approved, rejected, completed'
        });
      }

      // Only update status field, skip validation for other fields
      try {
        await Booking.updateOne({ _id: booking._id }, { $set: { status } });
        booking.status = status;
      } catch (saveError) {
        console.error('Error saving booking status:', saveError);
        return res.status(500).json({ message: 'Server error', error: saveError.message });
      }

      res.json(booking);
    } catch (error) {
      console.error('Error updating booking status:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

module.exports = router; 