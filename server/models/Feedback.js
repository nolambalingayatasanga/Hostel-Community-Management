const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Feedback content is required'],
    trim: true,
    maxlength: [3000, 'Feedback content cannot exceed 3000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted'],
    default: 'pending'
  },
  adminReply: {
    type: String,
    default: '',
    trim: true
  },
  repliedAt: {
    type: Date
  },
  repliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isLiked: {
    type: Boolean,
    default: false
  },
  likedAt: {
    type: Date
  },
  likedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

FeedbackSchema.index({ user: 1, createdAt: -1 });
FeedbackSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Feedback', FeedbackSchema);
