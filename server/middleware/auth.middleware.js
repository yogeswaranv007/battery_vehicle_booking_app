// JWT authentication middleware
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateJWT = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ 
        message: 'Account deactivated',
        details: 'Your account has been deactivated. Please contact the administrator.'
      });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = {
  authenticateJWT,
};
