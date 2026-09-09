const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = require('../server/app');

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel-community';
  await mongoose.connect(mongoUri);
  isConnected = true;
};

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB Serverless Connection Error:', err);
  }
  return app(req, res);
};
