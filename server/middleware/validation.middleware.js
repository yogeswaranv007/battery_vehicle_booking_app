// Prevent past-time bookings and ensure From ≠ To location validation
function validateBookingData(req, res, next) {
  const { date, time, fromPlace, destination } = req.body;

  // Ensure From ≠ To
  if (fromPlace && destination && fromPlace === destination) {
    return res.status(400).json({ 
      message: 'Invalid booking', 
      details: 'From and To locations cannot be the same. Please select different locations.' 
    });
  }

  // Prevent past-time bookings (server-side enforced using server time)
  if (date && time) {
    try {
      const bookingDate = new Date(date);
      if (isNaN(bookingDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format', details: 'Please provide a valid date in YYYY-MM-DD format' });
      }

      const [hours, minutes] = time.split(':').map(Number);
      bookingDate.setUTCHours(hours, minutes, 0, 0);

      const now = new Date();
      if (bookingDate < now) {
        return res.status(400).json({ 
          message: 'Past booking not allowed', 
          details: 'Booking date and time must be in the future. Please select a future date/time.' 
        });
      }
    } catch (e) {
      return res.status(400).json({ message: 'Invalid date or time', details: 'Date/time validation failed' });
    }
  }

  next();
}

module.exports = { validateBookingData };
