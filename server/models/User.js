const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AddressSchema = new mongoose.Schema({
  street: { type: String, trim: true },
  area: { type: String, trim: true },
  landmark: { type: String, trim: true },
  location: { type: String, trim: true },
  city: { type: String, trim: true },
  district: { type: String, trim: true },
  taluk: { type: String, trim: true },
  pincode: { type: String, trim: true }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['ADMIN', 'CHAIRPERSON', 'MEMBER', 'STAFF', 'STUDENT', 'ALUMNI'],
    required: true
  },
  status: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Status'
  },
  accountStatus: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  lead_data: [{
    customField: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomField'
    },
    value: {
      type: String,
      default: ''
    }
  }],
  name: {
    type: String,
    required: [true, 'Please provide a full name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    unique: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: [true, 'Please provide a password']
  },
  profilePhoto: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' }
  },
  registrationNumber: {
    type: String,
    trim: true
  },
  localLanguageDetails: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']
  },
  adhaar: {
    type: String,
    trim: true,
    default: ''
  },
  address: { type: AddressSchema },
  // Education fields (used by STUDENT, ALUMNI)
  education: {
    college: { type: String, trim: true },
    course: { type: String, trim: true },
    startMonth: { type: Number },
    startYear: { type: Number },
    endMonth: { type: Number },
    endYear: { type: Number }
  },
  // Employment fields (used by ALUMNI, and occupation details for STAFF/MEMBER/CHAIRPERSON/ADMIN)
  employment: {
    occupation: { type: String, trim: true }, // Occupation or job title
    organization: { type: String, trim: true }, // Company or organization
    industry: { type: String, trim: true },
    workLocation: { type: String, trim: true },
    employmentStatus: {
      type: String,
      enum: ['Employed', 'Self-Employed', 'Business Owner', 'Entrepreneur', 'Higher Studies', 'Government Service', 'Retired', 'Unemployed', 'Other']
    },
    // For business owners
    businessName: { type: String, trim: true },
    businessType: { type: String, trim: true },
    // For higher studies
    higherStudiesDetails: {
      institution: { type: String, trim: true },
      course: { type: String, trim: true },
      location: { type: String, trim: true }
    }
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save hook: Hash password if modified
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to verify password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Add indexes for frequent search filters
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ name: 1 });
UserSchema.index({ 'education.college': 1 });
UserSchema.index({ 'education.course': 1 });
UserSchema.index({ 'education.endYear': 1 });
UserSchema.index({ 'education.endMonth': 1 });
UserSchema.index({ 'employment.occupation': 1 });
UserSchema.index({ 'employment.organization': 1 });
UserSchema.index({ 'address.city': 1 });

module.exports = mongoose.model('User', UserSchema);
