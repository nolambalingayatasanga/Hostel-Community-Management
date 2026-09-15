const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  text: { type: String, trim: true, default: '' }
}, { timestamps: true });

const CommentReplySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, trim: true, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, trim: true, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replies: [CommentReplySchema]
}, { timestamps: true });

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an event title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide an event description'],
    trim: true
  },
  eventDate: {
    type: Date,
    required: [true, 'Please provide an event date']
  },
  startTime: {
    type: String, // HH:MM format
    required: [true, 'Please provide a start time']
  },
  endTime: {
    type: String, // HH:MM format
    required: [true, 'Please provide an end time']
  },
  location: {
    type: String,
    required: [true, 'Please provide an event location'],
    trim: true
  },
  locationUrl: {
    type: String,
    default: '',
    trim: true
  },
  locationCoordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  color: {
    type: String,
    default: '#0088ff',
    trim: true
  },
  coverImage: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' }
  },
  additionalImages: [
    {
      url: { type: String },
      publicId: { type: String },
      resourceType: {
        type: String,
        enum: ['image', 'video'],
        default: 'image'
      },
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  reviews: [ReviewSchema],
  comments: [CommentSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexing eventDate for sorting upcoming vs past events
EventSchema.index({ eventDate: 1 });

module.exports = mongoose.model('Event', EventSchema);

