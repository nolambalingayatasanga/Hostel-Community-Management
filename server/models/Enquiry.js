const mongoose = require('mongoose');

const EnquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Your full name is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  phone: {
    type: String,
    required: [true, 'Contact phone number is required'],
    trim: true
  },
  category: {
    type: String,
    enum: [
      'Room Admission & Availability',
      'Hostel Facilities & Amenities',
      'Mess & Food Services',
      'Fee Structure & Payments',
      'Maintenance & Housekeeping',
      'General Enquiry'
    ],
    default: 'General Enquiry'
  },
  subject: {
    type: String,
    trim: true,
    default: 'General Enquiry'
  },
  message: {
    type: String,
    trim: true,
    default: ''
  },
  attachmentUrl: {
    type: String,
    default: ''
  },
  attachmentName: {
    type: String,
    default: ''
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userRole: {
    type: String,
    default: 'STUDENT'
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Closed'],
    default: 'Pending'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

EnquirySchema.index({ name: 'text', email: 'text', phone: 'text', message: 'text', subject: 'text' });

module.exports = mongoose.model('Enquiry', EnquirySchema);
