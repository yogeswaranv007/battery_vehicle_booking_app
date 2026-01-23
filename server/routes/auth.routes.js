const express = require('express');
const router = express.Router();
const passport = require('passport');
const { authenticateJWT } = require('../middleware/auth.middleware');
const authController = require('../controllers/auth.controller');

// Google OAuth routes (disabled safely if env is missing)
router.get('/google', (req, res, next) => {
  if (!passport.googleStrategyEnabled) {
    return res.status(503).json({ error: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' });
  }
  passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!passport.googleStrategyEnabled) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=Google OAuth not configured`);
  }
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=Authentication failed`, session: false })(req, res, next);
}, async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=No user found`);
    }

    // Handle new Google users - redirect to registration to collect regNumber
    if (req.user.isNewUser) {
      const { googleProfile } = req.user;
      return res.redirect(`${process.env.FRONTEND_URL}/register?googleData=${encodeURIComponent(JSON.stringify(googleProfile))}`);
    }

    if (req.user.status !== 'active') {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=Account deactivated&details=Your account has been deactivated by the admin. Please contact the administrator.`);
    }

    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ _id: req.user._id, role: req.user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    const errorMessage = error.message || 'Authentication failed';
    const errorDetails = error.details || 'An unexpected error occurred';
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(errorMessage)}&details=${encodeURIComponent(errorDetails)}`);
  }
});

// Local auth endpoints via controller/service
router.post('/register', authController.register);
router.post('/register-google', authController.registerGoogle);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOtp);
router.post('/reset-password', authController.resetPassword);
router.get('/me', authenticateJWT, authController.me);

module.exports = router;
