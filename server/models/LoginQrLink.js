const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  ip: String,
  type: String,
  os: String,
  browser: String,
  accessType: {
    type: String,
    enum: ['qr', 'direct'],
    default: 'qr'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const LoginQrLinkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Kambi Connect Login'
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    default: 'kambi-login'
  },
  code: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  qrCode: {
    type: String,
    required: true
  },
  trackingLink: {
    type: String,
    required: true
  },
  qrTrackingLink: {
    type: String,
    required: true
  },
  redirectUrl: {
    type: String,
    required: true,
    default: 'https://www.kambi-connect.in/login'
  },
  clickCount: {
    type: Number,
    default: 0
  },
  scanCount: {
    type: Number,
    default: 0
  },
  devices: [deviceSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('LoginQrLink', LoginQrLinkSchema);
