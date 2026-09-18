const mongoose = require('mongoose');

const PasswordResetActivitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['EMAIL_SENT', 'EMAIL_FAILED', 'PASSWORD_RESET_OTP', 'PASSWORD_RESET_LINK'],
    required: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  method: {
    type: String,
    enum: ['OTP', 'LINK', null],
    default: null
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  errorMessage: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

PasswordResetActivitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('PasswordResetActivity', PasswordResetActivitySchema, 'password_reset_activities');
