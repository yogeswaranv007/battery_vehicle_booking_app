const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        // Validate time format HH:MM (24-hour format)
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Time must be in HH:MM format (24-hour)'
    } 
  },
  fromPlace: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'in-progress', 'completed', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: null
  },
  rejectionType: {
    type: String,
    enum: ['manual', 'timeout', null],
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvalTime: {
    type: Date,
    default: null
  },
  dispatchTime: {
    type: Date,
    default: null
  },
  completionTime: {
    type: Date,
    default: null
  },
  actionHistory: [{
    action: {
      type: String,
      enum: ['created', 'approved', 'rejected', 'dispatched', 'completed', 'edited', 'deleted'],
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    details: {
      type: String
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking; 