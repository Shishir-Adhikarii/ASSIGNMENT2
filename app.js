require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const methodOverride = require('method-override');
const hbs = require('hbs');

const connectDB = require('./config/db');
const passport = require('./config/passport');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const assignmentsRouter = require('./routes/assignments');

const app = express();

// Connect to MongoDB
connectDB();

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Handlebars helper
hbs.registerHelper('eq', function (a, b) {
  return a === b;
});

// General middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Allow PUT and DELETE through forms
app.use(methodOverride('_method'));

// Session
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      'assignmenthub-development-secret',

    resave: false,
    saveUninitialized: false,

    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: false
    }
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Make logged-in user available in HBS
app.use((req, res, next) => {
  res.locals.currentUser = req.user || null;
  next();
});

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/assignments', assignmentsRouter);

// 404 handler
app.use((req, res, next) => {
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.locals.message =
    err.message || 'Something went wrong.';

  res.locals.error =
    req.app.get('env') === 'development'
      ? err
      : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;