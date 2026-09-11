const mongoose = require('mongoose');
const User = require('../models/User');
const Status = require('../models/Status');
const StatusGroup = require('../models/StatusGroup');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const { sanitizeUser } = require('../middleware/authMiddleware');

const splitNameAndRelation = (rawName, existingRelation = {}) => {
  if (!rawName || typeof rawName !== 'string') {
    return {
      cleanName: rawName || '',
      relativeName: existingRelation?.relatedPersonName || '',
      relationType: existingRelation?.relationshipType || ''
    };
  }

  const relRegex = /\b(s\/o|d\/o|w\/o|h\/o|c\/o|f\/o|son\s+of|daughter\s+of|wife\s+of|husband\s+of|care\s+of|father\s+of|mother\s+of)\b/i;
  const match = rawName.match(relRegex);

  if (!match) {
    return {
      cleanName: rawName.trim(),
      relativeName: existingRelation?.relatedPersonName || '',
      relationType: existingRelation?.relationshipType || ''
    };
  }

  const indicator = match[1].toLowerCase();
  let relType = existingRelation?.relationshipType || '';
  if (!relType) {
    if (indicator.includes('s/o') || indicator.includes('son')) relType = 'Father';
    else if (indicator.includes('d/o') || indicator.includes('daughter')) relType = 'Father';
    else if (indicator.includes('w/o') || indicator.includes('wife')) relType = 'Spouse';
    else if (indicator.includes('h/o') || indicator.includes('husband')) relType = 'Spouse';
    else if (indicator.includes('c/o') || indicator.includes('care')) relType = 'Guardian';
    else if (indicator.includes('f/o') || indicator.includes('father')) relType = 'Son';
    else if (indicator.includes('mother')) relType = 'Son';
  }

  const cleanName = rawName.substring(0, match.index).replace(/[-,\s.]+$/, '').trim();
  const extractedRelative = rawName.substring(match.index + match[0].length).replace(/^[-,\s.:]+/, '').replace(/[-,\s.]+$/, '').trim();

  const finalRelativeName = existingRelation?.relatedPersonName || extractedRelative;

  return {
    cleanName: cleanName || rawName.trim(),
    relativeName: finalRelativeName,
    relationType: relType
  };
};

/**
 * Get all users with advanced filters, search, sorting and pagination
 */
exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Parse filters object if sent nested
    let filters = req.query.filters;
    if (typeof filters === 'string') {
      try {
        filters = JSON.parse(filters);
      } catch (e) {
        filters = {};
      }
    } else {
      filters = filters || {};
    }

    const search = req.query.search || req.query.searchQuery || filters.searchQuery;
    const role = req.query.role || filters.role;
    const gender = req.query.gender || filters.gender;
    const status = req.query.status || filters.status;
    const statusGroup = req.query.statusGroup || filters.statusGroup;
    const college = req.query.college || filters.college;
    const course = req.query.course || filters.course;
    const occupation = req.query.occupation || filters.occupation;
    const organization = req.query.organization || filters.organization;
    const city = req.query.city || filters.city;
    const state = req.query.state || filters.state;
    const pincode = req.query.pincode || filters.pincode;
    const startYear = req.query.startYear || filters.startYear;
    const endYear = req.query.endYear || filters.endYear;
    const joinDateMin = req.query.joinDateMin || filters.joinDateMin;
    const joinDateMax = req.query.joinDateMax || filters.joinDateMax;
    const sortBy = req.query.sortBy || filters.sortBy;

    const query = {};

    // 1. Keyword search (case-insensitive across multiple fields)
    if (search) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { registrationNumber: searchRegex },
        { receiptNo: searchRegex },
        { localLanguageDetails: searchRegex },
        { adhaar: searchRegex },
        { 'memberInfo.registrationNo': searchRegex },
        { 'education.college': searchRegex },
        { 'education.course': searchRegex },
        { 'employment.occupation': searchRegex },
        { 'employment.organization': searchRegex },
        { 'relation.relatedPersonName': searchRegex },
        { 'relation.relationshipType': searchRegex },
        { 'address.street': searchRegex },
        { 'address.area': searchRegex },
        { 'address.landmark': searchRegex },
        { 'address.location': searchRegex },
        { 'address.city': searchRegex },
        { 'address.district': searchRegex },
        { 'address.taluk': searchRegex },
        { 'address.pincode': searchRegex },
        { 'lead_data.value': searchRegex } // Custom field values search support
      ];
    }

    // Student privacy filter on backend
    if (req.user?.role === 'STUDENT' && !role) {
      query.role = { $nin: ['ADMIN', 'CHAIRPERSON'] };
    }

    // 2. Direct Filters
    if (role) query.role = role.toUpperCase();
    if (gender) query.gender = gender.toUpperCase();
    
    // Check if status is account status or CRM status stage ID
    if (status) {
      if (['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status.toUpperCase())) {
        query.accountStatus = status.toUpperCase();
      } else if (mongoose.Types.ObjectId.isValid(status)) {
        query.status = status;
      }
    }

    // Dropped contacts filter
    const isDroppedTab = statusGroup === 'dropped' || filters.statusGroup === 'dropped' || filters.isDropped === true;
    if (isDroppedTab) {
      query.isDropped = true;
    } else {
      query.isDropped = { $ne: true };
    }

    // Filter by Status Group (stages inside group)
    if (statusGroup && mongoose.Types.ObjectId.isValid(statusGroup)) {
      const group = await StatusGroup.findById(statusGroup);
      if (group) {
        const groupNameLower = group.name.toLowerCase();
        if (groupNameLower === 'students') {
          query.$or = [
            { status: { $in: group.statuses } },
            { role: 'STUDENT' }
          ];
        } else if (groupNameLower === 'alumni') {
          query.$or = [
            { status: { $in: group.statuses } },
            { role: 'ALUMNI' }
          ];
        } else if (groupNameLower === 'staff') {
          query.$or = [
            { status: { $in: group.statuses } },
            { role: { $in: ['STAFF', 'ADMIN'] } }
          ];
        } else if (groupNameLower === 'chairperson') {
          query.$or = [
            { status: { $in: group.statuses } },
            { role: 'CHAIRPERSON' }
          ];
        } else {
          query.status = { $in: group.statuses };
        }
      } else {
        query.status = null;
      }
    }
    
    // Education text matches
    if (college) query['education.college'] = { $regex: college.trim(), $options: 'i' };
    if (course) query['education.course'] = { $regex: course.trim(), $options: 'i' };
    
    // Employment text matches
    if (occupation) query['employment.occupation'] = { $regex: occupation.trim(), $options: 'i' };
    if (organization) query['employment.organization'] = { $regex: organization.trim(), $options: 'i' };

    // Location Filters (Address)
    if (city) query['address.city'] = { $regex: city.trim(), $options: 'i' };
    if (pincode) query['address.pincode'] = pincode.trim();

    // Education years
    if (startYear) query['education.startYear'] = parseInt(startYear, 10);
    if (endYear) query['education.endYear'] = parseInt(endYear, 10);

    // 3. Joining date range filter
    if (joinDateMin || joinDateMax) {
      query.joiningDate = {};
      if (joinDateMin) query.joiningDate.$gte = new Date(joinDateMin);
      if (joinDateMax) query.joiningDate.$lte = new Date(joinDateMax);
    }

    // Sort setup
    let sortOptions = { createdAt: -1 };
    if (sortBy) {
      switch (sortBy) {
        case 'nameAsc':
          sortOptions = { name: 1 };
          break;
        case 'nameDesc':
          sortOptions = { name: -1 };
          break;
        case 'newest':
          sortOptions = { createdAt: -1 };
          break;
        case 'oldest':
          sortOptions = { createdAt: 1 };
          break;
        case 'graduationYear':
          sortOptions = { 'education.endYear': -1 };
          break;
        default:
          sortOptions = { createdAt: -1 };
      }
    }

    // Construct base query for status group counts and "All" count (excluding status group filters)
    const baseQuery = { ...query };
    delete baseQuery.status;
    delete baseQuery.statusGroup;
    baseQuery.isDropped = { $ne: true };

    const totalAllLeads = await User.countDocuments(baseQuery);

    // Fetch matching users and total count
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .populate('status')
      .populate('lead_data.customField')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Apply privacy sanitation and name/relation separation before returning
    const sanitizedUsers = users.map(u => {
      const sanitized = sanitizeUser(u, req.user);
      if (sanitized && sanitized.name) {
        const { cleanName, relativeName, relationType } = splitNameAndRelation(sanitized.name, sanitized.relation || {});
        sanitized.name = cleanName;
        if (!sanitized.relation || !sanitized.relation.relatedPersonName) {
          sanitized.relation = {
            relationshipType: relationType || (sanitized.relation?.relationshipType || ''),
            relatedPersonName: relativeName
          };
        }
      }
      return sanitized;
    });

    // Compute status group counts dynamically based on search/date filters
    const groups = await StatusGroup.find({});
    const statusGroupsCount = {};
    for (const g of groups) {
      const gQuery = { ...baseQuery };
      const groupNameLower = g.name.toLowerCase();
      if (groupNameLower === 'students') {
        gQuery.$or = [
          { status: { $in: g.statuses } },
          { role: 'STUDENT' }
        ];
      } else if (groupNameLower === 'alumni') {
        gQuery.$or = [
          { status: { $in: g.statuses } },
          { role: 'ALUMNI' }
        ];
      } else if (groupNameLower === 'staff') {
        gQuery.$or = [
          { status: { $in: g.statuses } },
          { role: { $in: ['STAFF', 'ADMIN'] } }
        ];
      } else if (groupNameLower === 'chairperson') {
        gQuery.$or = [
          { status: { $in: g.statuses } },
          { role: 'CHAIRPERSON' }
        ];
      } else {
        gQuery.status = { $in: g.statuses };
      }
      const count = await User.countDocuments(gQuery);
      statusGroupsCount[g.name] = count;
    }

    const droppedCount = await User.countDocuments({ isDropped: true });
    statusGroupsCount['dropped'] = droppedCount;
    statusGroupsCount['Dropped'] = droppedCount;

    res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      data: sanitizedUsers,
      leads: sanitizedUsers,
      totalLeads: total,
      totalAllLeads,
      totalPages: Math.ceil(total / limit),
      statusGroupsCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed profile for a single user by ID
 */
exports.getUser = async (req, res, next) => {
  try {
    let user = await User.findById(req.params.id)
      .populate('status')
      .populate('lead_data.customField');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Auto-transition if graduation date is older than current month
    const { checkAndTransitionSingleUser } = require('../utils/studentTransition');
    const transitioned = await checkAndTransitionSingleUser(user, req);
    if (transitioned) {
      await user.save();
      user = await User.findById(req.params.id)
        .populate('status')
        .populate('lead_data.customField');
    }

    // Sanitize user data according to privacy rules
    const sanitized = sanitizeUser(user, req.user);
    if (sanitized && sanitized.name) {
      const { cleanName, relativeName, relationType } = splitNameAndRelation(sanitized.name, sanitized.relation || {});
      sanitized.name = cleanName;
      if (!sanitized.relation || !sanitized.relation.relatedPersonName) {
        sanitized.relation = {
          relationshipType: relationType || (sanitized.relation?.relationshipType || ''),
          relatedPersonName: relativeName
        };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        user: sanitized
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update authenticated user's own profile
 */
exports.updateOwnProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Separate security fields. Users CANNOT modify their own role, status or system details.
    const {
      role,
      status,
      passwordHash,
      password,
      email,
      phone,
      createdAt,
      joiningDate,
      ...profileData
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 1. Check unique email constraint if non-empty email is changing; if empty/null, unset it
    if (email !== undefined) {
      if (email && typeof email === 'string' && email.trim()) {
        const normalizedEmail = email.toLowerCase().trim();
        if (normalizedEmail !== user.email) {
          const emailExists = await User.findOne({ email: normalizedEmail, _id: { $ne: userId } });
          if (emailExists) {
            return res.status(400).json({ success: false, message: 'This email is already in use by another account.' });
          }
          user.email = normalizedEmail;
        }
      } else {
        user.email = undefined;
      }
    }

    // 2. Handle phone update (optional field)
    if (phone !== undefined) {
      user.phone = phone && typeof phone === 'string' ? phone.trim() : '';
    }

    // 3. Handle password update if password is provided
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      }
      user.passwordHash = password; // Pre-save hook hashes this
    }



    // Handle DOB / Date of Birth sanitization
    if (profileData.dob !== undefined || profileData.dateOfBirth !== undefined) {
      const rawDob = profileData.dob || profileData.dateOfBirth;
      if (rawDob && !isNaN(new Date(rawDob).getTime())) {
        user.dob = new Date(rawDob);
        user.dateOfBirth = new Date(rawDob);
      } else {
        user.dob = null;
        user.dateOfBirth = null;
        user.age = null;
      }
      delete profileData.dob;
      delete profileData.dateOfBirth;
    }

    // Handle Relation object sanitization
    if (profileData.relation !== undefined) {
      if (profileData.relation && (profileData.relation.relationshipType || profileData.relation.relatedPersonName)) {
        user.relation = {
          relationshipType: (profileData.relation.relationshipType || '').trim(),
          relatedPersonName: (profileData.relation.relatedPersonName || '').trim()
        };
      } else {
        user.relation = undefined;
      }
      delete profileData.relation;
    }

    // Handle privacy data mask settings
    if (profileData.privacySettings) {
      user.privacySettings = {
        maskPhone: Boolean(profileData.privacySettings.maskPhone),
        maskEmail: Boolean(profileData.privacySettings.maskEmail),
        maskAdhaar: Boolean(profileData.privacySettings.maskAdhaar)
      };
      delete profileData.privacySettings;
    }

    // Handle social & communication channels
    if (profileData.channels !== undefined) {
      user.channels = {
        instagram: (profileData.channels?.instagram || '').trim(),
        linkedin: (profileData.channels?.linkedin || '').trim(),
        whatsapp: (profileData.channels?.whatsapp || '').trim()
      };
      delete profileData.channels;
    }

    // Handle education numeric casting to avoid cast errors
    if (profileData.education) {
      const edu = { ...profileData.education };
      ['startYear', 'endYear', 'startMonth', 'endMonth'].forEach((field) => {
        if (edu[field] === '' || edu[field] === null || isNaN(Number(edu[field]))) {
          edu[field] = null;
        } else {
          edu[field] = Number(edu[field]);
        }
      });
      user.education = edu;
      delete profileData.education;
    }

    // Apply updates
    Object.keys(profileData).forEach((key) => {
      user[key] = profileData[key];
    });

    // Automatically transition Student to Alumni based on graduation month and year
    const { checkAndTransitionSingleUser } = require('../utils/studentTransition');
    await checkAndTransitionSingleUser(user, req);

    user.updatedBy = userId;
    await user.save();

    // Strip password fields from output
    const sanitizedUser = user.toObject();
    delete sanitizedUser.passwordHash;
    delete sanitizedUser.resetPasswordToken;
    delete sanitizedUser.resetPasswordExpires;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: sanitizedUser
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file.' });
    }

    const targetUserId = (req.params.id && ['ADMIN', 'CHAIRPERSON'].includes(req.user.role))
      ? req.params.id
      : req.user._id;

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Store reference to previous image identifier if it exists
    const oldMedia = user.profilePhoto?.publicId || user.profilePhoto?.url;

    // Upload new image first
    const uploadResult = await uploadImage(req.file.buffer, 'hostel-community/profiles', req.file.mimetype);

    user.profilePhoto = {
      url: uploadResult.url,
      publicId: uploadResult.publicId
    };

    user.updatedBy = req.user._id;
    await user.save();

    // Delete previous image from Cloudinary ONLY after new image is successfully added and saved
    if (oldMedia) {
      try {
        await deleteImage(oldMedia);
      } catch (deleteError) {
        console.error(`Failed to delete old profile photo (${oldMedia}) from Cloudinary:`, deleteError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Transition current Student to Alumni profile
 */
exports.transitionToAlumni = async (req, res, next) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return res.status(400).json({
        success: false,
        message: 'Only accounts with the STUDENT role can transition to ALUMNI.'
      });
    }

    const {
      graduationYear,
      occupation,
      organization,
      industry,
      workLocation,
      employmentStatus,
      businessName,
      businessType,
      higherStudiesDetails
    } = req.body;

    if (!graduationYear || !employmentStatus) {
      return res.status(400).json({
        success: false,
        message: 'Please provide graduationYear and employmentStatus.'
      });
    }

    const user = await User.findById(req.user._id);

    // Change role
    user.role = 'ALUMNI';
    
    // Update graduation end year in education history
    if (user.education) {
      user.education.endYear = parseInt(graduationYear, 10);
    }

    // Set employment details
    user.employment = {
      occupation,
      organization,
      industry,
      workLocation,
      employmentStatus,
      businessName,
      businessType,
      higherStudiesDetails
    };

    user.updatedBy = req.user._id;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Successfully transitioned from Student to Alumni role.',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================
   ADMINISTRATOR ACTIONS (restricted)
   ========================================= */

/**
 * Admin creates any user account
 */
exports.adminCreateUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      status,
      gender,
      adhaar,
      aadhaarNumber,
      registrationNumber,
      localLanguageDetails,
      address,
      education,
      employment
    } = req.body;

    // Check required basic fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a full name.'
      });
    }

    const assignedRole = (role || 'MEMBER').toUpperCase();

    // Security check: If request is by a CHAIRPERSON, they cannot create ADMIN or CHAIRPERSON accounts
    if (req.user.role === 'CHAIRPERSON' && ['ADMIN', 'CHAIRPERSON'].includes(assignedRole)) {
      return res.status(403).json({
        success: false,
        message: 'Chairpersons do not have permission to create Admin or Chairperson accounts.'
      });
    }

    let normalizedEmail = undefined;
    if (email && typeof email === 'string' && email.trim()) {
      normalizedEmail = email.toLowerCase().trim();
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'A user with this email already exists.'
        });
      }
    }

    const normalizedPhone = (phone && typeof phone === 'string') ? phone.trim() : '';
    const initialPassword = password || normalizedPhone || 'Member@123';

    // Resolve status and accountStatus
    let finalStatus = undefined;
    let finalAccountStatus = 'ACTIVE';

    if (status) {
      if (['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status.toUpperCase())) {
        finalAccountStatus = status.toUpperCase();
      } else if (mongoose.Types.ObjectId.isValid(status)) {
        finalStatus = status;
      }
    }

    if (!finalStatus) {
      const defaultStatus = await Status.findOne({}).sort({ order: 1 });
      if (defaultStatus) finalStatus = defaultStatus._id;
    }

    // Create user
    const newUser = new User({
      name,
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash: initialPassword, // Pre-save hook hashes this
      role: assignedRole,
      status: finalStatus,
      accountStatus: finalAccountStatus,
      lead_data: req.body.lead_data || [],
      gender,
      adhaar: adhaar || aadhaarNumber || '',
      dob: req.body.dob ? new Date(req.body.dob) : (req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined),
      dateOfBirth: req.body.dob ? new Date(req.body.dob) : (req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined),
      relation: req.body.relation ? {
        relationshipType: (req.body.relation.relationshipType || '').trim(),
        relatedPersonName: (req.body.relation.relatedPersonName || '').trim()
      } : (req.body.relativeName ? {
        relationshipType: '',
        relatedPersonName: req.body.relativeName.trim()
      } : undefined),
      privacySettings: {
        maskPhone: Boolean(req.body.privacySettings?.maskPhone),
        maskEmail: Boolean(req.body.privacySettings?.maskEmail),
        maskAdhaar: Boolean(req.body.privacySettings?.maskAdhaar)
      },
      channels: req.body.channels ? {
        instagram: (req.body.channels.instagram || '').trim(),
        linkedin: (req.body.channels.linkedin || '').trim(),
        whatsapp: (req.body.channels.whatsapp || '').trim()
      } : undefined,
      registrationNumber,
      localLanguageDetails,
      address,
      education,
      employment,
      createdBy: req.user._id
    });

    // Auto transition if graduation is in the past
    const { checkAndTransitionSingleUser } = require('../utils/studentTransition');
    await checkAndTransitionSingleUser(newUser, req);

    await newUser.save();

    // Strip password from output
    const userObj = newUser.toObject();
    delete userObj.passwordHash;

    res.status(217).json({
      success: true,
      message: 'User created successfully by administrator',
      data: {
        user: userObj
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin updates any user details (including status and role)
 */
exports.adminUpdateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Security check: If request is by a CHAIRPERSON, they cannot edit ADMIN or CHAIRPERSON users
    if (req.user.role === 'CHAIRPERSON' && ['ADMIN', 'CHAIRPERSON'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Chairpersons do not have permission to edit Admin or Chairperson accounts.'
      });
    }

    // Security check: If request is by a CHAIRPERSON, they cannot set anyone's role to ADMIN or CHAIRPERSON
    if (req.user.role === 'CHAIRPERSON' && updates.role && ['ADMIN', 'CHAIRPERSON'].includes(updates.role.toUpperCase())) {
      return res.status(403).json({
        success: false,
        message: 'Chairpersons do not have permission to set user roles to Admin or Chairperson.'
      });
    }

    // Admin password modification check
    if (updates.password) {
      user.passwordHash = updates.password; // hashed on save
    }

    // Normalizing email, phone, and separating name and relative name if combined
    if (updates.email !== undefined) {
      if (updates.email && typeof updates.email === 'string' && updates.email.trim()) {
        const normalizedEmail = updates.email.toLowerCase().trim();
        const emailExists = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
        if (emailExists) {
          return res.status(400).json({ success: false, message: 'This email is already in use by another account.' });
        }
        user.email = normalizedEmail;
      } else {
        user.email = undefined;
      }
      delete updates.email;
    }

    if (updates.phone !== undefined) {
      user.phone = updates.phone && typeof updates.phone === 'string' ? updates.phone.trim() : '';
      delete updates.phone;
    }
    if (updates.name) {
      const { cleanName, relativeName, relationType } = splitNameAndRelation(updates.name, updates.relation || user.relation || {});
      updates.name = cleanName;
      if (relativeName && (!updates.relation || !updates.relation.relatedPersonName)) {
        if (!user.relation) user.relation = { relationshipType: '', relatedPersonName: '' };
        user.relation.relatedPersonName = relativeName;
        if (relationType && !user.relation.relationshipType) {
          user.relation.relationshipType = relationType;
        }
      }
    }

    // Map aadhaarNumber to adhaar if needed
    if (updates.aadhaarNumber && !updates.adhaar) {
      updates.adhaar = updates.aadhaarNumber;
    }

    // Non-editable system identifiers: slNo and receiptNo
    delete updates.slNo;
    delete updates.receiptNo;
    if (updates.memberInfo) {
      delete updates.memberInfo.slNo;
      delete updates.memberInfo.receiptNo;
    }

    // Handle DOB / Date of Birth sanitization
    if (updates.dob !== undefined || updates.dateOfBirth !== undefined) {
      const rawDob = updates.dob || updates.dateOfBirth;
      if (rawDob && !isNaN(new Date(rawDob).getTime())) {
        user.dob = new Date(rawDob);
        user.dateOfBirth = new Date(rawDob);
      } else {
        user.dob = null;
        user.dateOfBirth = null;
        user.age = null;
      }
      delete updates.dob;
      delete updates.dateOfBirth;
    }

    // Handle Relation object sanitization
    if (updates.relation !== undefined) {
      if (updates.relation && (updates.relation.relationshipType || updates.relation.relatedPersonName)) {
        user.relation = {
          relationshipType: (updates.relation.relationshipType || '').trim(),
          relatedPersonName: (updates.relation.relatedPersonName || '').trim()
        };
      } else {
        user.relation = undefined;
      }
      delete updates.relation;
    } else if (updates.relativeName !== undefined) {
      if (!user.relation) {
        user.relation = { relationshipType: '', relatedPersonName: '' };
      }
      user.relation.relatedPersonName = (updates.relativeName || '').trim();
      delete updates.relativeName;
    }

    // Handle privacy data mask settings
    if (updates.privacySettings) {
      user.privacySettings = {
        maskPhone: Boolean(updates.privacySettings.maskPhone),
        maskEmail: Boolean(updates.privacySettings.maskEmail),
        maskAdhaar: Boolean(updates.privacySettings.maskAdhaar)
      };
      delete updates.privacySettings;
    }

    // Handle social & communication channels
    if (updates.channels !== undefined) {
      user.channels = {
        instagram: (updates.channels?.instagram || '').trim(),
        linkedin: (updates.channels?.linkedin || '').trim(),
        whatsapp: (updates.channels?.whatsapp || '').trim()
      };
      delete updates.channels;
    }

    // Handle education numeric casting to avoid cast errors
    if (updates.education) {
      const edu = { ...updates.education };
      ['startYear', 'endYear', 'startMonth', 'endMonth'].forEach((field) => {
        if (edu[field] === '' || edu[field] === null || isNaN(Number(edu[field]))) {
          edu[field] = null;
        } else {
          edu[field] = Number(edu[field]);
        }
      });
      user.education = edu;
      delete updates.education;
    }

    // Apply updates
    Object.keys(updates).forEach((key) => {
      if (key !== 'password') {
        user[key] = updates[key];
      }
    });

    // Auto transition if graduation is in the past
    const { checkAndTransitionSingleUser } = require('../utils/studentTransition');
    await checkAndTransitionSingleUser(user, req);

    user.updatedBy = req.user._id;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin updates user account status (Deactivate / Suspend)
 */
exports.adminUpdateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid status: ACTIVE, INACTIVE, SUSPENDED.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Security check: If request is by a CHAIRPERSON, they cannot change status of ADMIN or CHAIRPERSON accounts
    if (req.user.role === 'CHAIRPERSON' && ['ADMIN', 'CHAIRPERSON'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Chairpersons do not have permission to change status of Admin or Chairperson accounts.'
      });
    }

    user.accountStatus = status.toUpperCase();
    user.updatedBy = req.user._id;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: `User status changed to ${user.accountStatus} successfully.`,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin deletes a user permanently
 */
exports.adminDeleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Security check: If request is by a CHAIRPERSON, they cannot delete ADMIN or CHAIRPERSON accounts
    if (req.user.role === 'CHAIRPERSON' && ['ADMIN', 'CHAIRPERSON'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Chairpersons do not have permission to delete Admin or Chairperson accounts.'
      });
    }

    // Delete photo from Cloudinary first if it exists
    if (user.profilePhoto && (user.profilePhoto.publicId || user.profilePhoto.url)) {
      await deleteImage(user.profilePhoto.publicId || user.profilePhoto.url);
    }

    // Remove from database
    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'User permanently deleted from the system.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin triggers transition of a Student user to Alumni by ID
 */
exports.adminTransitionStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { graduationYear, occupation, organization, industry, employmentStatus } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role !== 'STUDENT') {
      return res.status(400).json({ success: false, message: 'This user is not a Student.' });
    }

    user.role = 'ALUMNI';
    if (user.education) {
      user.education.endYear = parseInt(graduationYear || new Date().getFullYear(), 10);
    }

    user.employment = {
      occupation: occupation || 'Unemployed',
      organization: organization || '',
      industry: industry || '',
      employmentStatus: employmentStatus || 'Unemployed'
    };

    user.updatedBy = req.user._id;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Student successfully transitioned to Alumni by admin.',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dashboard stats and aggregation charts (ADMIN/MEMBER only)
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const Event = require('../models/Event');
    
    // 1. Basic Counts
    const totalStudents = await User.countDocuments({ role: 'STUDENT' });
    const totalAlumni = await User.countDocuments({ role: 'ALUMNI' });
    const totalMembers = await User.countDocuments({ role: 'MEMBER' });
    const totalStaff = await User.countDocuments({ role: 'STAFF' });
    const totalWardens = await User.countDocuments({ role: { $in: ['WARDEN', 'CHAIRPERSON'] } });
    const totalAdmins = await User.countDocuments({ role: 'ADMIN' });
    const totalUsers = await User.countDocuments();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingEvents = await Event.countDocuments({ eventDate: { $gte: today } });

    // 2. Recent Registrations
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role profilePhoto createdAt');

    // 3. Chart aggregations
    // Users by Role
    const rolesDistribution = await User.aggregate([
      { $group: { _id: '$role', value: { $sum: 1 } } }
    ]);

    // Students by College
    const studentsByCollege = await User.aggregate([
      { $match: { role: 'STUDENT', 'education.college': { $ne: null, $ne: '' } } },
      { $group: { _id: '$education.college', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Students by Course
    const studentsByCourse = await User.aggregate([
      { $match: { role: 'STUDENT', 'education.course': { $ne: null, $ne: '' } } },
      { $group: { _id: '$education.course', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Alumni by Occupation
    const alumniByOccupation = await User.aggregate([
      { $match: { role: 'ALUMNI', 'employment.occupation': { $ne: null, $ne: '' } } },
      { $group: { _id: '$employment.occupation', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Alumni by Company
    const alumniByCompany = await User.aggregate([
      { $match: { role: 'ALUMNI', 'employment.organization': { $ne: null, $ne: '' } } },
      { $group: { _id: '$employment.organization', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Users by Location (State)
    const locationDistribution = await User.aggregate([
      { $match: { 'addresses.current.state': { $ne: null, $ne: '' } } },
      { $group: { _id: '$addresses.current.state', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Age Distribution
    const currentYear = new Date().getFullYear();
    const ageBuckets = await User.aggregate([
      { $match: { dateOfBirth: { $exists: true, $ne: null } } },
      {
        $project: {
          age: {
            $subtract: [
              currentYear,
              { $year: '$dateOfBirth' }
            ]
          }
        }
      },
      {
        $bucket: {
          groupBy: '$age',
          boundaries: [0, 18, 26, 36, 51, 120],
          default: 'Other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    // Format age buckets for frontend chart readability
    const ageNames = {
      0: 'Under 18',
      18: '18-25',
      26: '26-35',
      36: '36-50',
      51: '50+'
    };
    
    const formattedAgeDistribution = ageBuckets.map(bucket => ({
      name: ageNames[bucket._id] || 'Other',
      count: bucket.count
    }));

    res.status(200).json({
      success: true,
      data: {
        counts: {
          students: totalStudents,
          alumni: totalAlumni,
          members: totalMembers,
          staff: totalStaff,
          chairpersons: totalChairpersons,
          admins: totalAdmins,
          total: totalUsers,
          upcomingEvents
        },
        recentUsers,
        charts: {
          rolesDistribution,
          studentsByCollege,
          studentsByCourse,
          alumniByOccupation,
          alumniByCompany,
          locationDistribution,
          ageDistribution: formattedAgeDistribution
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const kannadaToEnglishDigits = (str) => {
  if (!str) return str;
  const knDigits = ['೦', '೧', '೨', '೩', '೪', '೫', '೬', '೭', '೮', '೯'];
  return String(str).replace(/[೦-೯]/g, (char) => {
    const idx = knDigits.indexOf(char);
    return idx !== -1 ? String(idx) : char;
  });
};

/**
 * Translate English text to Kannada using Google Translate service
 * Numbers/pincodes are normalized to Arabic numerals
 */
exports.translateToKannada = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Text to translate is required.' });
    }

    const encodedText = encodeURIComponent(text.trim());
    const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=kn&dt=t&q=${encodedText}`;

    const response = await fetch(googleUrl);
    if (!response.ok) {
      throw new Error(`Google Translate service returned status: ${response.status}`);
    }

    const data = await response.json();
    let translatedText = Array.isArray(data?.[0])
      ? data[0].map((chunk) => chunk?.[0] || '').join('')
      : '';

    // Ensure pincodes/numerals are kept as standard English/Arabic digits (0-9)
    translatedText = kannadaToEnglishDigits(translatedText);

    res.status(200).json({
      success: true,
      data: {
        original: text,
        translatedText
      }
    });
  } catch (error) {
    console.error('Translation error in userController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to translate to Kannada: ' + error.message
    });
  }
};

/**
 * Translate Kannada text to English using Google Translate service
 * Used for auto-mapping Local Language details back to English fields
 */
exports.translateToEnglish = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Text to translate is required.' });
    }

    // Convert any Kannada numerals to standard digits before translating
    const sanitizedInput = kannadaToEnglishDigits(text.trim());
    const encodedText = encodeURIComponent(sanitizedInput);
    const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodedText}`;

    const response = await fetch(googleUrl);
    if (!response.ok) {
      throw new Error(`Google Translate service returned status: ${response.status}`);
    }

    const data = await response.json();
    let translatedText = Array.isArray(data?.[0])
      ? data[0].map((chunk) => chunk?.[0] || '').join('')
      : '';

    translatedText = kannadaToEnglishDigits(translatedText);

    res.status(200).json({
      success: true,
      data: {
        original: text,
        translatedText
      }
    });
  } catch (error) {
    console.error('Translation error to English in userController:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to translate to English: ' + error.message
    });
  }
};

/**
 * Bulk drop / restore users
 */
exports.bulkDropUsers = async (req, res, next) => {
  try {
    const { userIds, drop = true } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide user IDs.' });
    }

    await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { isDropped: Boolean(drop), droppedAt: drop ? new Date() : null, updatedBy: req.user._id } }
    );

    res.status(200).json({
      success: true,
      message: drop ? `Successfully dropped ${userIds.length} contact(s).` : `Successfully restored ${userIds.length} contact(s).`
    });
  } catch (error) {
    next(error);
  }
};

