const express = require('express');
const router = express.Router();
const requireRole = require('../middleware/role.middleware');
const { authenticateJWT } = require('../middleware/auth.middleware');

// All admin routes require role enforcement at group level
router.use(authenticateJWT, requireRole('admin'));

// Bridge to admin logic (users, locations, bookings, audit logs)
const adminController = require('../controllers/admin.controller');
router.use('/', adminController);

module.exports = router;
