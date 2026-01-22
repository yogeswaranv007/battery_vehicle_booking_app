require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
// Initialize passport strategies
require('./config/passport');

const app = express();

// Core middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Database connection (reuses existing URI)
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/battery-vehicle-booking')
  .then(() => console.log('Server(app.js) connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Role-based routes (bridge existing modules)
const authRoutes = require('./routes/auth.routes');
const bookingRoutes = require('./routes/booking.routes');
const adminRoutes = require('./routes/admin.routes');
const studentRoutes = require('./routes/student.routes');
const watchmanRoutes = require('./routes/watchman.routes');

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/watchman', watchmanRoutes);

module.exports = app;
