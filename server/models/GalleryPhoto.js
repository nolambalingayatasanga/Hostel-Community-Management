const mongoose = require('mongoose');

const GalleryPhotoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, 'Please provide a photo URL']
  },
  publicId: {
    type: String,
    required: [true, 'Please provide a Cloudinary public ID']
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
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GalleryPhoto', GalleryPhotoSchema);
