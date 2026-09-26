const mongoose = require('mongoose');

const HostelOrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization / Hostel name is required'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    trim: true,
    default: ''
  },
  type: {
    type: String,
    enum: ['Boys Hostel', 'Girls Hostel', 'Combined', 'Other'],
    default: 'Boys Hostel'
  },
  city: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  contactPerson: {
    type: String,
    trim: true,
    default: ''
  },
  contactPhone: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

HostelOrganizationSchema.index({ isActive: 1, order: 1 });

const INITIAL_ORGANIZATIONS = [
  { name: 'Kambi sidrammana boys Hostel - Basaveshwara nagar', type: 'Boys Hostel', city: 'Bengaluru', order: 1 },
  { name: 'Kambi sidrammana boys Hostel - Bashyam circle nagar', type: 'Boys Hostel', city: 'Bengaluru', order: 2 },
  { name: 'Kambi sidrammana Girls Hostel -Rajaji nagar', type: 'Girls Hostel', city: 'Bengaluru', order: 3 },
  { name: 'Sri Siddaramanna Boys Hostel - Tumkuru', type: 'Boys Hostel', city: 'Tumkuru', order: 4 },
  { name: 'GM Siddaramanna Girls Hostel - Tumkuru', type: 'Girls Hostel', city: 'Tumkuru', order: 5 }
];

HostelOrganizationSchema.statics.seedDefaults = async function() {
  try {
    const count = await this.countDocuments();
    if (count > 0) return; // Organizations already initialized, do not overwrite admin changes

    for (const org of INITIAL_ORGANIZATIONS) {
      await this.create(org);
    }
  } catch (err) {
    console.error('Error seeding default hostel organizations:', err);
  }
};

module.exports = mongoose.model('HostelOrganization', HostelOrganizationSchema);
