const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true
  },
  logo: {
    url: { type: String, default: '' },
    key: { type: String, default: '' }
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    trim: true
  },
  headOfficeLocation: {
    type: String,
    required: [true, 'Head office location is required'],
    trim: true
  },
  operatingLocations: {
    type: [String],
    default: []
  },
  establishedYear: {
    type: Number,
    min: 1800,
    max: new Date().getFullYear()
  },
  yearsOperating: {
    type: Number,
    min: 0,
    default: 0
  },
  numberOfEmployees: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  website: {
    type: String,
    trim: true,
    default: ''
  },
  contactEmail: {
    type: String,
    trim: true,
    default: ''
  },
  contactPhone: {
    type: String,
    trim: true,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedReason: {
    type: String,
    default: ''
  },
  blockedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

OrganizationSchema.index({ createdBy: 1 });
OrganizationSchema.index({ name: 'text', industry: 'text', headOfficeLocation: 'text' });

module.exports = mongoose.model('Organization', OrganizationSchema);
