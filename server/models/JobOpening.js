const mongoose = require('mongoose');

const JobOpeningSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization reference is required']
  },
  jobRole: {
    type: String,
    required: [true, 'Job role / title is required'],
    trim: true
  },
  jobType: {
    type: String,
    required: [true, 'Job type is required'],
    enum: ['Full-time', 'Part-time', 'Internship', 'Hybrid', 'Contract'],
    default: 'Full-time'
  },
  location: {
    type: String,
    required: [true, 'Job location is required'],
    trim: true
  },
  salaryRange: {
    type: String,
    required: [true, 'Salary range is required'],
    trim: true
  },
  experienceYears: {
    type: String,
    required: [true, 'Experience requirement is required'],
    trim: true
  },
  educationQualification: {
    type: String,
    required: [true, 'Education qualification is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  resumeRequired: {
    type: Boolean,
    default: true
  },
  documentsRequired: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  interviewMode: {
    type: String,
    enum: ['Online', 'Offline / In-person'],
    default: 'Online'
  },
  interviewStartDate: {
    type: String,
    default: ''
  },
  interviewEndDate: {
    type: String,
    default: ''
  },
  interviewStartTime: {
    type: String,
    default: ''
  },
  interviewEndTime: {
    type: String,
    default: ''
  },
  interviewTiming: {
    type: String,
    trim: true,
    default: ''
  },
  meetingLink: {
    type: String,
    trim: true,
    default: ''
  },
  googleMapLink: {
    type: String,
    trim: true,
    default: ''
  },
  offlineAddress: {
    venueName: { type: String, default: '' },
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    landmark: { type: String, default: '' }
  },
  interviewLocation: {
    type: String,
    trim: true,
    default: ''
  },
  applicationDeadline: {
    type: Date,
    default: null
  },
  openingsCount: {
    type: Number,
    min: 1,
    required: [true, 'Number of openings is required'],
    default: 1
  },
  status: {
    type: String,
    enum: ['Open', 'Closed'],
    default: 'Open'
  },
  applicantsCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

JobOpeningSchema.index({ organization: 1, status: 1 });
JobOpeningSchema.index({ jobRole: 'text', location: 'text', description: 'text' });

module.exports = mongoose.model('JobOpening', JobOpeningSchema);
