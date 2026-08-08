const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('../config/passport');

const User = require('../models/User');
const { ensureGuest } = require('../middleware/auth');

router.get('/register', ensureGuest, (req, res) => {
    res.render('users/register', {
        title: 'Register'
    });
});

router.post('/register', ensureGuest, async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        if (!username || !email || !password || !confirmPassword) {
            return res.render('users/register', {
                title: 'Register',
                error: 'Please complete all fields.',
                username,
                email
            });
        }

        if (password !== confirmPassword) {
            return res.render('users/register', {
                title: 'Register',
                error: 'Passwords do not match.',
                username,
                email
            });
        }

        if (password.length < 6) {
            return res.render('users/register', {
                title: 'Register',
                error: 'Password must be at least 6 characters.',
                username,
                email
            });
        }

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

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword
        });

        req.login(user, (err) => {
            if (err) {
                return next(err);
            }

            res.redirect('/assignments/my');
        });
    } catch (error) {
        console.error(error);

        res.render('users/register', {
            title: 'Register',
            error: 'Unable to create your account.'
        });
    }
});

router.get('/login', ensureGuest, (req, res) => {
    res.render('users/login', {
        title: 'Login'
    });
});

router.post('/login', ensureGuest, (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }

        if (!user) {
            return res.render('users/login', {
                title: 'Login',
                error: info.message
            });
        }

        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }

            const returnTo = req.session.returnTo || '/assignments/my';

            delete req.session.returnTo;

            res.redirect(returnTo);
        });
    })(req, res, next);
});

router.get(
    '/github',
    passport.authenticate('github', {
        scope: ['user:email']
    })
);

router.get(
    '/github/callback',
    passport.authenticate('github', {
        failureRedirect: '/users/login'
    }),
    (req, res) => {
        res.redirect('/assignments/my');
    }
);

router.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }

        req.session.destroy(() => {
            res.redirect('/');
        });
    });
});

module.exports = router;