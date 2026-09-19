const mongoose = require('mongoose');

const DriveLinkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an event name or title'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  driveUrl: {
    type: String,
    required: [true, 'Please provide a Google Drive media link'],
    trim: true
  },
  eventDate: {
    type: Date,
    required: [true, 'Please provide the date of the event']
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  thumbnail: {
    type: String,
    trim: true,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

DriveLinkSchema.index({ eventDate: -1 });
DriveLinkSchema.index({ createdAt: -1 });

module.exports = mongoose.model('DriveLink', DriveLinkSchema);
