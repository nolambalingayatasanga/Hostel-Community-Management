const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  userId: {
    type: String,
    index: true
  },
  userName: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    default: ''
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'REGISTER',
      'PROFILE_EDIT',
      'USER_EDIT',
      'STATUS_CHANGE',
      'USER_DELETE',
      'COMMENT_ADD',
      'REPLY_ADD',
      'COMMENT_DELETE',
      'EVENT_CREATE',
      'EVENT_DELETE',
      'PASSWORD_CHANGE',
      'PASSWORD_RESET',
      'PAGE_VIEW',
      'PATH_VISIT',
      'OTHER'
    ],
    index: true
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE'],
    default: 'SUCCESS'
  },
  ipAddress: {
    type: String,
    default: ''
  },
  browser: {
    type: String,
    default: ''
  },
  os: {
    type: String,
    default: ''
  },
  deviceType: {
    type: String,
    enum: ['Desktop', 'Mobile', 'Tablet', 'Unknown'],
    default: 'Desktop'
  },
  userAgent: {
    type: String,
    default: ''
  },
  sessionId: {
    type: String,
    default: ''
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

AuditLogSchema.index({ user: 1, createdAt: -1 });
AuditLogSchema.index({ ipAddress: 1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema, 'audit_logs');
