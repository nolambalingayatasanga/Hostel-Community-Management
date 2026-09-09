const mongoose = require('mongoose');

const GalleryFolderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a folder name'],
    trim: true,
    maxlength: [100, 'Folder name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  color: {
    type: String,
    default: '#0088ff'
  },
  coverUrl: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

GalleryFolderSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('GalleryFolder', GalleryFolderSchema);
