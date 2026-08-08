const mongoose = require('mongoose');

async function connectDB() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is missing from .env');
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error(
      'MongoDB connection error:',
      error.message
    );

    // Do not shut down Express while debugging
    console.log(
      'Server will continue running without MongoDB.'
    );
  }
}

module.exports = connectDB;