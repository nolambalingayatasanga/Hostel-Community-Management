const mongoose = require('mongoose');

const UploadRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetCategory: {
    type: String,
    enum: ['gallery', 'drive_links', 'events'],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a title or memory name'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  // Media files (photos/videos)
  media: [
    {
      url: { type: String, required: true },
      publicId: { type: String, default: '' },
      storageProvider: { type: String, enum: ['cloudinary', 'cloudflare'], default: 'cloudflare' },
      resourceType: { type: String, enum: ['image', 'video'], default: 'image' },
      caption: { type: String, default: '' },
      originalName: { type: String, default: '' },
      size: { type: Number, default: 0 }
    }
  ],
  // Fields for Drive Link requests
  driveUrl: {
    type: String,
    trim: true,
    default: ''
  },
  driveCategory: {
    type: String,
    trim: true,
    default: 'General'
  },
  driveEventDate: {
    type: Date
  },
  driveThumbnail: {
    type: String,
    default: ''
  },
  driveThumbnailFocus: {
    type: String,
    enum: ['center', 'top', 'bottom', 'left', 'right'],
    default: 'center'
  },
  // Fields for Event requests
  eventDetails: {
    eventDate: { type: Date },
    startTime: { type: String },
    endTime: { type: String },
    location: { type: String },
    locationUrl: { type: String, default: '' },
    color: { type: String, default: '#0088ff' },
    coverImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' }
    }
  },
  // Fields for Gallery requests
  galleryFolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GalleryFolder',
    default: null
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  adminFeedback: {
    type: String,
    default: '',
    trim: true
  },
  publishedIds: [
    {
      type: mongoose.Schema.Types.ObjectId
    }
  ]
}, {
  timestamps: true
});

UploadRequestSchema.index({ status: 1, createdAt: -1 });
UploadRequestSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('UploadRequest', UploadRequestSchema);
