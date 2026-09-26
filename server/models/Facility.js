const mongoose = require('mongoose');

const FacilitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Facility name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Facility category is required'],
    trim: true,
    default: 'Food & Dining'
  },
  photo: {
    type: String,
    required: [true, 'Facility photo is required']
  },
  timings: {
    type: String,
    trim: true,
    default: '24/7 Available'
  },
  tagline: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

FacilitySchema.statics.seedDefaults = async function() {
  // Dummy data seeding removed
  return;
};

module.exports = mongoose.model('Facility', FacilitySchema);
