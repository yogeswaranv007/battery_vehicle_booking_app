const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:5000/api/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google OAuth profile received:', {
      id: profile.id,
      displayName: profile.displayName,
      email: profile.emails?.[0]?.value,
      provider: profile.provider,
      photos: profile.photos?.[0]?.value
    });
    
    if (!profile.emails || !profile.emails[0]) {
      console.error('No email found in Google profile');
      return done(new Error('No email found in Google profile'), null);
    }

    // Validate email domain
    const email = profile.emails[0].value;
    if (!email.endsWith('@bitsathy.ac.in')) {
      console.log('Invalid email domain:', email);
      return done(new Error('Email must end with @bitsathy.ac.in'), null);
    }

    // Check if user exists with Google ID
    let user = await User.findOne({ googleId: profile.id });
    console.log('User lookup by Google ID:', user ? 'Found' : 'Not found');

    if (!user) {
      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        // If user exists but doesn't have Google ID, add it
        if (!existingUser.googleId) {
          existingUser.googleId = profile.id;
          await existingUser.save();
          console.log('Added Google ID to existing user:', existingUser._id);
          return done(null, existingUser);
        }
        console.log('Email already exists with different Google ID:', email);
        return done(new Error('Email already registered with a different Google account'), null);
      }

      // For first-time users, return a special object with Google profile data
      const googleProfile = {
        googleId: profile.id,
        email: email,
        name: profile.displayName,
        role: 'student',
        status: 'active'
      };
      console.log('New user profile created:', googleProfile);
      return done(null, {
        isNewUser: true,
        googleProfile
      });
    }

    console.log('Existing user found:', {
      _id: user._id,
      email: user.email,
      role: user.role,
      status: user.status
    });
    return done(null, user);
  } catch (err) {
    console.error('Google OAuth error:', err);
    return done(err, null);
  }
}));

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const user = await User.findById(payload._id);
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (err) {
    return done(err, false);
  }
}));

module.exports = passport; 