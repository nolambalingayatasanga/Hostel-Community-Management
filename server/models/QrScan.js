const mongoose = require('mongoose');

const QrScanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required for QR scan log'],
    index: true
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scanType: {
    type: String,
    enum: ['GATE_ENTRY', 'GATE_EXIT', 'MESS_MEAL', 'EVENT_ENTRY', 'ATTENDANCE', 'GENERAL'],
    default: 'GENERAL',
    index: true
  },
  location: {
    type: String,
    trim: true,
    default: 'Main Gate'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  qrPayload: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['VALID', 'INVALID', 'SUSPENDED', 'EXPIRED'],
    default: 'VALID'
  },
  scannedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

QrScanSchema.index({ user: 1, scannedAt: -1 });
QrScanSchema.index({ scannedAt: -1 });

module.exports = mongoose.model('QrScan', QrScanSchema);
