const Booking = require('../models/Booking');
const Location = require('../models/Location');
const User = require('../models/User');
const { logAudit } = require('../utils/auditLogger');

async function listLocations() {
  const locations = await Location.find().select('_id name').sort({ name: 1 });
  return { status: 200, body: locations };
}

async function getBookingsForAdminOrWatchman(role, filters = {}) {
  const query = {};
  if (role === 'watchman') {
    query.status = { $in: ['pending', 'approved', 'in-progress', 'completed'] };
  }
  if (filters.date) {
    const d = new Date(filters.date);
    if (!isNaN(d.getTime())) {
      d.setUTCHours(0, 0, 0, 0);
      query.date = d;
    }
  }
  const bookings = await Booking.find(query)
    .populate('user', 'name email')
    .populate('approvedBy', 'name email')
    .sort({ date: 1, time: 1, createdAt: -1 });
  return { status: 200, body: bookings };
}

async function getMyBookings(userId) {
  const bookings = await Booking.find({ user: userId })
    .populate({ path: 'user', select: 'name email', model: 'User' })
    .populate({ path: 'approvedBy', select: 'name email', model: 'User' })
    .sort({ date: -1, createdAt: -1 });
  return { status: 200, body: bookings };
}

async function createBooking({ date, time, fromPlace, destination }, user) {
  if (!date || !time || !fromPlace || !destination) {
    return { status: 400, body: { message: 'Missing required fields', details: { date: !date ? 'Date is required' : undefined, time: !time ? 'Time is required' : undefined, fromPlace: !fromPlace ? 'From location is required' : undefined, destination: !destination ? 'To location is required' : undefined } } };
  }
  let bookingDate;
  try {
    bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime())) throw new Error('Invalid date');
    bookingDate.setUTCHours(0, 0, 0, 0);
  } catch (e) {
    return { status: 400, body: { message: 'Invalid date format', details: 'Please provide a valid date in YYYY-MM-DD format' } };
  }
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    return { status: 400, body: { message: 'Invalid time format', details: 'Time must be in HH:MM format (24-hour), e.g., 14:30 or 09:15' } };
  }
  const existingBooking = await Booking.findOne({
    date: bookingDate,
    time,
    status: { $in: ['pending', 'approved', 'in-progress'] },
    $expr: { $and: [{ $eq: ['$fromPlace', fromPlace] }, { $eq: ['$destination', destination] }] }
  });
  if (existingBooking) {
    return { status: 400, body: { message: 'Route unavailable at this time', details: 'The same route (from and to locations) is already booked at this time. Please choose a different time or route.' } };
  }
  const booking = new Booking({
    user: user._id,
    date: bookingDate,
    time,
    fromPlace,
    destination,
    status: 'pending',
    actionHistory: [{ action: 'created', performedBy: user._id, performedAt: new Date(), details: `Booking created by ${user.name || user.email}` }]
  });
  await booking.save();
  await logAudit('booking_created', user, user, { details: `Booking created: ${fromPlace} to ${destination} on ${date} at ${time}` });
  return { status: 201, body: booking };
}

async function updateBookingStatus(bookingId, { status, rejectionType }, user) {
  const booking = await Booking.findById(bookingId).populate('user', 'name email').populate('approvedBy', 'name email');
  if (!booking) {
    return { status: 404, body: { message: 'Booking not found' } };
  }
  const validStatuses = ['pending', 'approved', 'in-progress', 'rejected', 'completed'];
  if (!validStatuses.includes(status)) {
    return { status: 400, body: { message: 'Invalid status', details: 'Status must be one of: pending, approved, in-progress, rejected, completed' } };
  }
  const updateData = { status };
  const now = new Date();
  const actionHistoryEntry = { performedBy: user._id, performedAt: now };

  if (status === 'approved' && booking.status === 'pending') {
    updateData.approvedBy = user._id;
    updateData.approvalTime = now;
    actionHistoryEntry.action = 'approved';
    actionHistoryEntry.details = `Booking approved by ${user.role} ${user.name || user.email}`;
  } else if (status === 'in-progress' && booking.status === 'approved') {
    updateData.dispatchTime = now;
    actionHistoryEntry.action = 'dispatched';
    actionHistoryEntry.details = `Vehicle dispatched by ${user.role} ${user.name || user.email}`;
  } else if (status === 'completed') {
    updateData.completionTime = now;
    actionHistoryEntry.action = 'completed';
    actionHistoryEntry.details = `Booking completed by ${user.role} ${user.name || user.email}`;
  } else if (status === 'rejected') {
    actionHistoryEntry.action = 'rejected';
    actionHistoryEntry.details = `Booking rejected by ${user.role} ${user.name || user.email}`;
    updateData.rejectionType = (rejectionType && ['manual', 'timeout'].includes(rejectionType)) ? rejectionType : 'manual';
  }

  if (!booking.actionHistory) booking.actionHistory = [];
  booking.actionHistory.push(actionHistoryEntry);
  updateData.actionHistory = booking.actionHistory;
  await Booking.updateOne({ _id: booking._id }, { $set: updateData });
  booking.status = status;
  if (status === 'approved') {
    booking.approvedBy = user;
    booking.approvalTime = now;
  }
  if (status === 'in-progress') {
    booking.dispatchTime = now;
  }
  if (status === 'completed') {
    booking.completionTime = now;
  }
  return { status: 200, body: booking };
}

module.exports = {
  listLocations,
  getBookingsForAdminOrWatchman,
  getMyBookings,
  createBooking,
  updateBookingStatus,
};
