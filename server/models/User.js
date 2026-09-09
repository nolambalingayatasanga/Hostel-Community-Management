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

// Stores parsed relation/family info extracted from the combined Name+Address field
const RelationSchema = new mongoose.Schema({
  relationshipType: {
    type: String,
    enum: ['w/o', 's/o', 'd/o', 'h/o', 'f/o', 'other'],
    trim: true
  },
  relatedPersonName: { type: String, trim: true } // Name of the related person (spouse/parent/sibling)
}, { _id: false });

// Member-specific fields populated during Excel import
const MemberInfoSchema = new mongoose.Schema({
  slNo: { type: Number },                             // SL NO column (sequential: 1, 2, 3...)
  registrationNo: { type: String, trim: true },       // SL NO IN REG column (actual reg number, stored as string to handle e.g. '287(A)')
  receiptNo: { type: String, trim: true },            // RECEIPT NO column
  isExpired: { type: Boolean, default: false },       // EXPIRED column
  sourceSheet: { type: String, trim: true },          // Excel sheet name e.g. 'ANEKAL-72'
  rawNameAddress: { type: String, trim: true },       // Original English combined Name+Address field
  rawNameAddressKannada: { type: String, trim: true },// Kannada version of the same field
  registeredDate: { type: Date },                     // DATE column (member registration date)
  additionalPhones: [{ type: String, trim: true }]    // Extra phone numbers beyond the primary one
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
  // Email is optional for imported members (phone is used as login identifier)
  email: {
    type: String,
    unique: true,
    sparse: true,   // Allows multiple documents with no email (null is not considered duplicate)
    lowercase: true,
    trim: true
  },
  // Phone is optional structurally but filled for all imported members
  // Not unique because: (a) members may share phones, (b) many have no phone (null)
  phone: {
    type: String,
    trim: true
  },
  // Password is optional; imported members use phone as default password
  passwordHash: {
    type: String
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
  dob: {
    type: Date
  },
  adhaar: {
    type: String,
    trim: true,
    default: ''
  },
  address: { type: AddressSchema },

  // Family/relation info parsed from the combined Name+Address field
  relation: { type: RelationSchema },

  // Receipt number from the Excel RECEIPT NO column (top-level for easy display)
  receiptNo: {
    type: String,
    trim: true,
    default: ''
  },

  // Member-specific fields populated during Excel import
  memberInfo: { type: MemberInfoSchema },

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
    occupation: { type: String, trim: true },     // Occupation or job title
    organization: { type: String, trim: true },   // Company or organization
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
  if (!this.passwordHash) return next(); // Skip if no password set
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
  if (!this.passwordHash) return false;
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
UserSchema.index({ 'memberInfo.registrationNo': 1 }, { sparse: true });
UserSchema.index({ registrationNumber: 1 }, { sparse: true });

module.exports = mongoose.model('User', UserSchema);
