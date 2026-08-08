const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('../config/passport');

const User = require('../models/User');
const { ensureGuest } = require('../middleware/auth');

// ==============================
// REGISTER
// ==============================

// Show registration page
router.get('/register', ensureGuest, (req, res) => {
  res.render('users/register', {
    title: 'Register'
  });
});

// Register a new user
router.post('/register', ensureGuest, async (req, res, next) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Check that all fields are completed
    if (!username || !email || !password || !confirmPassword) {
      return res.render('users/register', {
        title: 'Register',
        error: 'Please complete all fields.',
        username,
        email
      });
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      return res.render('users/register', {
        title: 'Register',
        error: 'Passwords do not match.',
        username,
        email
      });
    }

    // Minimum password length
    if (password.length < 6) {
      return res.render('users/register', {
        title: 'Register',
        error: 'Password must be at least 6 characters.',
        username,
        email
      });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({
      username: username.trim()
    });

    if (existingUsername) {
      return res.render('users/register', {
        title: 'Register',
        error: 'Username is already in use.',
        username,
        email
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (existingEmail) {
      return res.render('users/register', {
        title: 'Register',
        error: 'Email is already registered.',
        username,
        email
      });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword
    });

    // Automatically log in after registration
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }

      return res.redirect('/assignments/my');
    });

  } catch (error) {
    console.error('Registration error:', error);

    res.render('users/register', {
      title: 'Register',
      error: 'Unable to create your account.'
    });
  }
});

// ==============================
// LOGIN
// ==============================

// Show login page
router.get('/login', ensureGuest, (req, res) => {
  res.render('users/login', {
    title: 'Login'
  });
});

// Local login
router.post('/login', ensureGuest, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.render('users/login', {
        title: 'Login',
        error: info?.message || 'Invalid email or password.'
      });
    }

    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }

      const returnTo =
        req.session.returnTo || '/assignments/my';

      delete req.session.returnTo;

      return res.redirect(returnTo);
    });
  })(req, res, next);
});

// ==============================
// GITHUB LOGIN
// ==============================

// Start GitHub authentication
router.get(
  '/github',
  passport.authenticate('github', {
    scope: ['user:email']
  })
);

// GitHub callback
router.get(
  '/github/callback',
  passport.authenticate('github', {
    failureRedirect: '/users/login'
  }),
  (req, res) => {
    res.redirect('/assignments/my');
  }
);

// ==============================
// LOGOUT
// ==============================

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }

      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });
});

module.exports = router;