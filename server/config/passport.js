const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

/* =========================
   SESSION HANDLING
========================= */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

/* =========================
   GOOGLE OAUTH STRATEGY
========================= */
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
} = process.env;

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Ensure email exists
          if (!profile.emails || !profile.emails.length) {
            return done(new Error('Google account has no email'), null);
          }

          const email = profile.emails[0].value;

          // Restrict domain
          if (!email.endsWith('@bitsathy.ac.in')) {
            return done(new Error('Only bitsathy.ac.in emails allowed'), null);
          }

          // Find user by Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            // Check if email already exists
            const existingUser = await User.findOne({ email });

            if (existingUser) {
              // Link Google account
              existingUser.googleId = profile.id;
              await existingUser.save();
              return done(null, existingUser);
            }

            // For Google OAuth, mark as incomplete (needs regNumber from registration form)
            // Return user object with flag to redirect to registration
            const googleUser = {
              _id: null, // No DB entry yet
              googleId: profile.id,
              name: profile.displayName,
              email,
              role: 'student',
              status: 'active',
              isNewUser: true,
              googleProfile: {
                id: profile.id,
                displayName: profile.displayName,
                email: email,
              }
            };
            return done(null, googleUser);
          }

          return done(null, user);
        } catch (err) {
          console.error('Google OAuth Error:', err);
          return done(err, null);
        }
      }
    )
  );

  passport.googleStrategyEnabled = true;
  console.log('✅ Google OAuth strategy enabled');
} else {
  passport.googleStrategyEnabled = false;
  console.warn('⚠️ Google OAuth disabled: missing env variables');
}

/* =========================
   JWT STRATEGY
========================= */
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload._id);
        if (!user) return done(null, false);
        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

module.exports = passport;