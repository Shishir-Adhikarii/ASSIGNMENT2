const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const bcrypt = require('bcryptjs');

const User = require('../models/User');

// =====================================================
// LOCAL LOGIN STRATEGY
// =====================================================
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({
          email: email.toLowerCase().trim()
        });

        // User does not exist or is GitHub-only account
        if (!user || !user.password) {
          return done(null, false, {
            message: 'Invalid email or password.'
          });
        }

        // Compare entered password with hashed password
        const passwordMatches = await bcrypt.compare(
          password,
          user.password
        );

        if (!passwordMatches) {
          return done(null, false, {
            message: 'Invalid email or password.'
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// =====================================================
// GITHUB LOGIN STRATEGY
// =====================================================
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/users/github/callback`
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        // First check whether GitHub account already exists
        let user = await User.findOne({
          githubId: profile.id
        });

        // Get email from GitHub if available
        const email =
          profile.emails && profile.emails.length > 0
            ? profile.emails[0].value.toLowerCase()
            : `${profile.username}@github.local`;

        // If no GitHub ID match, try matching existing email
        if (!user) {
          user = await User.findOne({ email });
        }

        // Create new user if one does not already exist
        if (!user) {
          user = await User.create({
            username: profile.username,
            email,
            githubId: profile.id
          });
        }

        // Link GitHub account to an existing local user
        else if (!user.githubId) {
          user.githubId = profile.id;
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// =====================================================
// SESSION
// =====================================================

// Store user ID in session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Retrieve user from database using session ID
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);

    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;