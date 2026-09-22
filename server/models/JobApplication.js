const mongoose = require('mongoose');

const JobApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobOpening',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicantName: {
    type: String,
    required: true,
    trim: true
  },
  applicantEmail: {
    type: String,
    required: true,
    trim: true
  },
  applicantPhone: {
    type: String,
    trim: true,
    default: ''
  },
  experience: {
    type: String,
    trim: true,
    default: ''
  },
  education: {
    type: String,
    trim: true,
    default: ''
  },
  coverNote: {
    type: String,
    trim: true,
    default: ''
  },
  resume: {
    url: { type: String, default: '' },
    key: { type: String, default: '' },
    originalName: { type: String, default: '' },
    size: { type: Number, default: 0 }
  },
  documents: [{
    url: { type: String, default: '' },
    key: { type: String, default: '' },
    originalName: { type: String, default: '' }
  }],
  status: {
    type: String,
    enum: ['Applied', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Accepted'],
    default: 'Applied'
  },
  statusNote: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

JobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
JobApplicationSchema.index({ applicant: 1 });

module.exports = mongoose.model('JobApplication', JobApplicationSchema);
