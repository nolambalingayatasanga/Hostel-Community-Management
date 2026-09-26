const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: 150
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  githubUrl: {
    type: String,
    trim: true,
    default: ''
  },
  liveUrl: {
    type: String,
    trim: true,
    default: ''
  },
  videoUrl: {
    type: String,
    trim: true,
    default: ''
  },
  thumbnail: {
    type: String,
    default: ''
  },
  thumbnailFocus: {
    type: String,
    enum: ['center', 'top', 'bottom', 'left', 'right'],
    default: 'center'
  },
  category: {
    type: String,
    trim: true,
    default: 'Web Development'
  },
  industry: {
    type: String,
    trim: true,
    default: 'Web Development'
  },
  driveUrl: {
    type: String,
    trim: true,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  media: [{
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video', 'document', 'pdf', 'other'], default: 'image' },
    name: { type: String, default: '' }
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  authorName: {
    type: String,
    default: 'Anonymous'
  },
  authorRole: {
    type: String,
    default: 'STUDENT'
  },
  authorEmail: {
    type: String,
    default: ''
  },
  authorPhone: {
    type: String,
    default: ''
  },
  authorAvatar: {
    type: String,
    default: ''
  },
  projectType: {
    type: String,
    enum: ['College Project', 'Personal Project'],
    default: 'College Project'
  },
  scopeType: {
    type: String,
    enum: ['Team Project', 'Solo Project'],
    default: 'Team Project'
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  viewedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  starsCount: {
    type: Number,
    default: 0
  },
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, default: 'Anonymous' },
    userAvatar: { type: String, default: '' },
    userRole: { type: String, default: 'STUDENT' },
    text: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

ProjectSchema.index({ title: 'text', description: 'text', category: 'text', industry: 'text' });

ProjectSchema.statics.seedDefaults = async function() {
  // Dummy data seeding removed
  return;
};

module.exports = mongoose.model('Project', ProjectSchema);
