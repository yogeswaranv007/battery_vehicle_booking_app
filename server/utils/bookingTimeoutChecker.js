const cron = require('node-cron');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Run every minute to check for bookings that should be auto-rejected
const startBookingTimeoutChecker = () => {
  console.log('Booking timeout checker started - runs every minute');

  // Schedule to run every minute: "0 * * * * *" or every minute: "*/1 * * * *"
  cron.schedule('*/1 * * * *', async () => {
    try {
      const now = new Date();
      
      // Find all pending bookings where the scheduled time has passed
      // We need to combine date and time fields to compare with current time
      const bookings = await Booking.find({ status: 'pending' })
        .populate('user', 'name email')
        .populate('approvedBy', 'name email');

      let autoRejectedCount = 0;

      for (const booking of bookings) {
        // Combine date and time to get the scheduled booking time
        const bookingDateStr = booking.date.toISOString().split('T')[0]; // YYYY-MM-DD
        const [hours, minutes] = booking.time.split(':');
        
        // Create a date object for the booking time (in local timezone)
        const bookingDateTime = new Date(bookingDateStr);
        bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // If current time is past the booking time and still pending, auto-reject
        if (now > bookingDateTime) {
          booking.status = 'rejected';
          booking.rejectionReason = 'Time Out - No approval before scheduled time';
          booking.rejectionType = 'timeout';
          
          // Add to action history
          booking.actionHistory.push({
            action: 'rejected',
            performedBy: booking.user,
            performedAt: now,
            details: 'Automatically rejected by system - scheduled time passed without approval'
          });

          await booking.save();
          autoRejectedCount++;

          console.log(`Auto-rejected booking ${booking._id} for user ${booking.user.name} - Scheduled time: ${bookingDateTime}, Current time: ${now}`);
        }
      }

      if (autoRejectedCount > 0) {
        console.log(`[${new Date().toISOString()}] Auto-rejected ${autoRejectedCount} bookings due to timeout`);
      }
    } catch (error) {
      console.error('Error in booking timeout checker:', error);
    }
  });
};

module.exports = { startBookingTimeoutChecker };
