const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const bcrypt = require('bcryptjs');

const User = require('../models/User');

passport.use(
    new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        async (email, password, done) => {
            try {
                const user = await User.findOne({
                    email: email.toLowerCase()
                });

                if (!user || !user.password) {
                    return done(null, false, {
                        message: 'Invalid email or password.'
                    });
                }

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

passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: `${process.env.BASE_URL}/users/github/callback`
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({
                    githubId: profile.id
                });

                const email =
                    profile.emails && profile.emails.length
                        ? profile.emails[0].value.toLowerCase()
                        : `${profile.username}@github.local`;

                if (!user) {
                    user = await User.findOne({ email });
                }

                if (!user) {
                    user = await User.create({
                        username: profile.username,
                        email,
                        githubId: profile.id
                    });
                } else if (!user.githubId) {
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

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

module.exports = passport;