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
    enum: ['ADMIN', 'WARDEN', 'MEMBER', 'STAFF', 'STUDENT', 'ALUMNI'],
    required: true
  },
  accountStatus: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  isDropped: {
    type: Boolean,
    default: false,
    index: true
  },
  droppedAt: {
    type: Date
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
    sparse: true,   // Allows multiple documents with no email (null or undefined is not considered duplicate)
    lowercase: true,
    trim: true,
    set: v => (v && typeof v === 'string' && v.trim() !== '' ? v.toLowerCase().trim() : undefined)
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
    url: {
      type: String,
      default: 'https://res.cloudinary.com/mkifnpvk/image/upload/v1789187464/hostel-community/profiles/vzsuddpebsujc0ayuku3.jpg'
    },
    publicId: {
      type: String,
      default: 'hostel-community/profiles/vzsuddpebsujc0ayuku3'
    }
  },
  registrationNumber: {
    type: String,
    trim: true,
    set: v => (v && typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined)
  },
  localLanguageDetails: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']
  },
  age: {
    type: Number
  },
  dob: {
    type: Date
  },
  dateOfBirth: {
    type: Date
  },
  adhaar: {
    type: String,
    trim: true,
    default: ''
  },
  privacySettings: {
    maskPhone: { type: Boolean, default: false },
    maskEmail: { type: Boolean, default: false },
    maskAdhaar: { type: Boolean, default: false }
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
  // Employment fields (used by ALUMNI, and occupation details for STAFF/MEMBER/WARDEN/ADMIN)
  employment: {
    occupation: { type: String, trim: true },     // Occupation or job title
    organization: { type: String, trim: true },   // Company or organization
    industry: { type: String, trim: true },
    workLocation: { type: String, trim: true },
    employmentStatus: {
      type: String,
      enum: ['Intern', 'Employed', 'Business Owner', 'Entrepreneur', 'Higher Studies', 'Government Service', 'Retired', 'Unemployed'],
      set: v => (v && typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined)
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
  // Social & communication channels (Instagram, LinkedIn, WhatsApp)
  channels: {
    instagram: { type: String, trim: true, default: '' },
    linkedin: { type: String, trim: true, default: '' },
    whatsapp: { type: String, trim: true, default: '' }
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date
  },
  lastLoginDetails: {
    ip: { type: String, default: '' },
    browser: { type: String, default: '' },
    os: { type: String, default: '' },
    device: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    sessionId: { type: String, default: '' },
    timestamp: { type: Date }
  },
  lastActive: {
    type: Date,
    default: Date.now
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

// Pre-save hook: Hash password if modified & compute age from DOB (Mongoose 8/9 async hook)
UserSchema.pre('save', async function () {
  // Sync dob and dateOfBirth fields
  if (this.isModified('dob')) {
    this.dateOfBirth = this.dob;
  } else if (this.isModified('dateOfBirth')) {
    this.dob = this.dateOfBirth;
  } else {
    if (this.dob && !this.dateOfBirth) {
      this.dateOfBirth = this.dob;
    }
    if (this.dateOfBirth && !this.dob) {
      this.dob = this.dateOfBirth;
    }
  }

  // Calculate age automatically from birth date
  const birthDate = this.dob || this.dateOfBirth;
  if (birthDate) {
    const diffMs = Date.now() - new Date(birthDate).getTime();
    const calculatedAge = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
    if (!isNaN(calculatedAge) && calculatedAge >= 0) {
      this.age = calculatedAge;
    }
  } else {
    this.age = undefined;
  }

  if (!this.isModified('passwordHash')) return;
  if (!this.passwordHash) return; // Skip if no password set
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Instance method to verify password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Add indexes for frequent search filters
UserSchema.index({ role: 1 });
UserSchema.index({ name: 1 });
UserSchema.index({ dob: 1 });
UserSchema.index({ 'relation.relatedPersonName': 1 });
UserSchema.index({ 'education.college': 1 });
UserSchema.index({ 'education.course': 1 });
UserSchema.index({ 'education.endYear': 1 });
UserSchema.index({ 'education.endMonth': 1 });
UserSchema.index({ 'employment.occupation': 1 });
UserSchema.index({ 'employment.organization': 1 });
UserSchema.index({ 'memberInfo.registrationNo': 1 }, { sparse: true });
UserSchema.index({ registrationNumber: 1 }, { sparse: true });

module.exports = mongoose.model('User', UserSchema);
