const mongoose = require('mongoose');

const GalleryPhotoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, 'Please provide a photo URL']
  },
  publicId: {
    type: String,
    required: [true, 'Please provide a public ID or storage key']
  },
  storageProvider: {
    type: String,
    enum: ['cloudinary', 'cloudflare', 's3', 'minio'],
    default: 's3'
  },
  caption: {
    type: String,
    trim: true,
    maxlength: [200, 'Caption cannot be more than 200 characters']
  },
  resourceType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GalleryFolder',
    default: null
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

GalleryPhotoSchema.index({ folder: 1, createdAt: -1 });
GalleryPhotoSchema.index({ createdAt: -1 });

module.exports = mongoose.model('GalleryPhoto', GalleryPhotoSchema);

