const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Google OAuth routes
router.get('/google',
  (req, res, next) => {
    console.log('Initiating Google OAuth...');
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      prompt: 'select_account'
    })(req, res, next);
  }
);

router.get('/google/callback',
  (req, res, next) => {
    console.log('Google OAuth callback received');
    passport.authenticate('google', { 
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=Authentication failed`,
      session: false
    })(req, res, next);
  },
  async (req, res) => {
    try {
      console.log('Google OAuth successful, user:', req.user);
      
      if (!req.user) {
        console.error('No user found after Google OAuth');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=No user found`);
      }

      // Handle new users
      if (req.user.isNewUser) {
        const { googleProfile } = req.user;
        console.log('New user detected, redirecting to registration with profile:', googleProfile);
        // Redirect to registration page with Google profile data
        return res.redirect(
          `${process.env.FRONTEND_URL}/register?googleData=${encodeURIComponent(
            JSON.stringify(googleProfile)
          )}`
        );
      }

      // Handle existing users
      console.log('Existing user found, generating token...');
      const token = jwt.sign(
        { _id: req.user._id, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      console.log('Token generated, redirecting to frontend...');
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Error in Google OAuth callback:', error);
      // Send detailed error information
      const errorMessage = error.message || 'Authentication failed';
      const errorDetails = error.details || 'An unexpected error occurred';
      res.redirect(
        `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(errorMessage)}&details=${encodeURIComponent(errorDetails)}`
      );
    }
  }
);

// Complete Google registration
router.post('/google/complete-registration', async (req, res) => {
  try {
    const { googleProfile, regNumber } = req.body;

    // Validate registration number
    const regNumberRegex = /^[0-9]{7}[A-Z]{2}[0-9]{3}$/;
    if (!regNumberRegex.test(regNumber)) {
      return res.status(400).json({ 
        message: 'Invalid registration number format',
        details: 'Registration number must be in the format: 7376232IT286'
      });
    }

    // Create new user
    const user = new User({
      ...googleProfile,
      regNumber
    });

    await user.save();
    console.log('New user created:', user._id);

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({ 
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Google registration error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Local registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, regNumber, role, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: {
          name: !name ? 'Name is required' : undefined,
          email: !email ? 'Email is required' : undefined,
          password: !password ? 'Password is required' : undefined
        }
      });
    }

    // Validate email format
    if (!email.endsWith('@bitsathy.ac.in')) {
      return res.status(400).json({ 
        message: 'Invalid email format',
        details: 'Email must end with @bitsathy.ac.in'
      });
    }

    // Validate registration number for students
    if (role === 'student') {
      if (!regNumber) {
        return res.status(400).json({ 
          message: 'Registration number is required for students',
          details: 'Please provide your registration number'
        });
      }

      // Validate registration number format
      const regNumberRegex = /^[0-9]{7}[A-Z]{2}[0-9]{3}$/;
      if (!regNumberRegex.test(regNumber)) {
        return res.status(400).json({ 
          message: 'Invalid registration number format',
          details: 'Registration number must be in the format: 7376232IT286'
        });
      }
    }

    // Validate phone number for watchmen
    if (role === 'watchman') {
      if (!phone) {
        return res.status(400).json({ 
          message: 'Phone number is required for watchmen',
          details: 'Please provide your phone number'
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists',
        details: 'A user with this email already exists'
      });
    }

    // Set status based on role
    const status = role === 'student' ? 'active' : 'pending';

    // Create new user
    const user = new User({
      name,
      email,
      password,
      regNumber,
      role,
      phone,
      status // Set status based on role
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({ 
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Local login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    // Validate required fields
    if (!email || !password) {
      console.log('Missing required fields:', { email: !!email, password: !!password });
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: {
          email: !email ? 'Email is required' : undefined,
          password: !password ? 'Password is required' : undefined
        }
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('No user found with email:', email);
      return res.status(401).json({ 
        message: 'Invalid credentials',
        details: 'No user found with this email'
      });
    }

    console.log('User found:', {
      _id: user._id,
      email: user.email,
      role: user.role,
      status: user.status,
      hasGoogleId: !!user.googleId
    });

    // Check if user is a Google user
    if (user.googleId) {
      console.log('User is a Google user, redirecting to Google login');
      return res.status(401).json({ 
        message: 'Invalid login method',
        details: 'This account was created using Google. Please use Google Sign-In.'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      console.log('User account is not active:', user.status);
      return res.status(401).json({ 
        message: 'Account not active',
        details: 'Your account is pending approval. Please contact the administrator.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Invalid credentials',
        details: 'Incorrect password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('Login successful for user:', user._id);
    res.json({ 
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: 'An unexpected error occurred. Please try again later.'
    });
  }
});

// Get current user
router.get('/me',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.json(req.user);
  }
);

module.exports = router; 