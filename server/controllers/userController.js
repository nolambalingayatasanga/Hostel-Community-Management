const mongoose = require('mongoose');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Status = require('../models/Status');
const StatusGroup = require('../models/StatusGroup');
const GalleryPhoto = require('../models/GalleryPhoto');
const GalleryFolder = require('../models/GalleryFolder');
const Event = require('../models/Event');
const PasswordResetActivity = require('../models/PasswordResetActivity');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const { sanitizeUser } = require('../middleware/authMiddleware');
const { logAuditEvent } = require('../utils/auditLogger');
const { getDefaultProfilePhoto } = require('../utils/defaultProfilePhoto');

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
    const joinDateMin = req.query.joinDateMin || req.query.startDate || filters.joinDateMin || filters.startDate;
    const joinDateMax = req.query.joinDateMax || req.query.endDate || filters.joinDateMax || filters.endDate;
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
      query.role = { $nin: ['ADMIN', 'WARDEN'] };
    }

    // 2. Direct Filters
    if (role) query.role = role.toUpperCase();
    if (gender) query.gender = gender.toUpperCase();
    
    // Check if status is account status
    if (status && ['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status.toUpperCase())) {
      query.accountStatus = status.toUpperCase();
    }

    // Dropped contacts filter
    const isDroppedTab = statusGroup === 'dropped' || filters.statusGroup === 'dropped' || filters.isDropped === true;
    if (isDroppedTab) {
      query.isDropped = true;
    } else {
      query.isDropped = { $ne: true };
    }

    // Filter by Status Group (which maps to user role)
    if (statusGroup && mongoose.Types.ObjectId.isValid(statusGroup)) {
      const group = await StatusGroup.findById(statusGroup);
      if (group) {
        const groupNameLower = group.name.toLowerCase();
        if (groupNameLower === 'students') {
          query.role = 'STUDENT';
        } else if (groupNameLower === 'alumni') {
          query.role = 'ALUMNI';
        } else if (groupNameLower === 'staff') {
          query.role = 'STAFF';
        } else if (groupNameLower === 'warden' || groupNameLower === 'chairperson') {
          query.role = 'WARDEN';
        } else if (groupNameLower === 'admin') {
          query.role = 'ADMIN';
        } else if (groupNameLower === 'members') {
          query.role = 'MEMBER';
        } else {
          query.role = group.name.toUpperCase();
        }
      } else {
        query.role = '__NON_EXISTING__';
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

    // 3. Joining date range filter (maps to joiningDate & memberInfo.registeredDate)
    if (joinDateMin || joinDateMax) {
      let minDate = null;
      if (joinDateMin) {
        const rawMin = String(joinDateMin).trim();
        minDate = /^\d{4}-\d{2}-\d{2}$/.test(rawMin)
          ? new Date(`${rawMin}T00:00:00.000Z`)
          : new Date(rawMin);
      }

      let maxDate = null;
      if (joinDateMax) {
        const rawMax = String(joinDateMax).trim();
        maxDate = /^\d{4}-\d{2}-\d{2}$/.test(rawMax)
          ? new Date(`${rawMax}T23:59:59.999Z`)
          : new Date(rawMax);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(rawMax) && !isNaN(maxDate.getTime())) {
          maxDate.setHours(23, 59, 59, 999);
        }
      }

      const validMin = minDate && !isNaN(minDate.getTime());
      const validMax = maxDate && !isNaN(maxDate.getTime());

      if (validMin || validMax) {
        // Date conditions for BSON Date fields
        const dateCond = {};
        if (validMin) dateCond.$gte = minDate;
        if (validMax) dateCond.$lte = maxDate;

        // String conditions in case dates were stored as ISO / YYYY-MM-DD strings
        const strMin = validMin ? minDate.toISOString().slice(0, 10) : null;
        const strMax = validMax ? maxDate.toISOString().slice(0, 10) + 'T23:59:59.999Z' : null;
        const strCond = {};
        if (strMin) strCond.$gte = strMin;
        if (strMax) strCond.$lte = strMax;

        const dateBranches = [
          { joiningDate: dateCond },
          { 'memberInfo.registeredDate': dateCond }
        ];

        if (strMin || strMax) {
          dateBranches.push({ joiningDate: strCond });
          dateBranches.push({ 'memberInfo.registeredDate': strCond });
        }

        if (!query.$and) query.$and = [];
        query.$and.push({ $or: dateBranches });
      }
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
    delete baseQuery.role;
    baseQuery.isDropped = { $ne: true };

    const totalAllLeads = await User.countDocuments(baseQuery);

    // Fetch matching users and total count
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .populate('lead_data.customField')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Apply privacy sanitation and name/relation separation before returning
    const sanitizedUsers = users.map(u => {
      const sanitized = sanitizeUser(u, req.user, { isUsersTable: true });
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
        gQuery.role = 'STUDENT';
      } else if (groupNameLower === 'alumni') {
        gQuery.role = 'ALUMNI';
      } else if (groupNameLower === 'staff') {
        gQuery.role = 'STAFF';
      } else if (groupNameLower === 'warden' || groupNameLower === 'chairperson') {
        gQuery.role = 'WARDEN';
      } else if (groupNameLower === 'admin') {
        gQuery.role = 'ADMIN';
      } else if (groupNameLower === 'members') {
        gQuery.role = 'MEMBER';
      } else {
        gQuery.role = g.name.toUpperCase();
      }
      const count = await User.countDocuments(gQuery);
      statusGroupsCount[g.name] = count;
      statusGroupsCount[String(g._id)] = count;
    }

    const membersCount = await User.countDocuments({ ...baseQuery, role: 'MEMBER' });
    statusGroupsCount['all'] = membersCount;
    statusGroupsCount['Members'] = membersCount;

    const droppedCount = await User.countDocuments({ ...baseQuery, isDropped: true });
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

    // Handle employment sanitization
    if (profileData.employment) {
      const emp = { ...profileData.employment };
      if (!emp.employmentStatus || !emp.employmentStatus.trim()) {
        delete emp.employmentStatus;
      }
      profileData.employment = emp;
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

    // Covert background audit logging
    logAuditEvent({
      req,
      user,
      action: 'PROFILE_EDIT',
      details: { updatedFields: Object.keys(profileData || {}) }
    });

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

    const targetUserId = (req.params.id && ['ADMIN', 'WARDEN'].includes(req.user.role))
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
    // Protect the master default ProfileIcon from deletion if shared
    const isMasterDefault = oldMedia && (
      oldMedia === 'hostel-community/profiles/vzsuddpebsujc0ayuku3' ||
      oldMedia.includes('vzsuddpebsujc0ayuku3')
    );
    if (oldMedia && !isMasterDefault) {
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

    // Security check: If request is by a WARDEN, they cannot create ADMIN or WARDEN accounts
    if ((req.user.role === 'WARDEN' || req.user.role === 'CHAIRPERSON') && ['ADMIN', 'WARDEN', 'CHAIRPERSON'].includes(assignedRole)) {
      return res.status(403).json({
        success: false,
        message: 'Wardens do not have permission to create Admin or Warden accounts.'
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

    // Resolve accountStatus
    let finalAccountStatus = 'ACTIVE';

    if (status && ['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status.toUpperCase())) {
      finalAccountStatus = status.toUpperCase();
    } else if (req.body.accountStatus && ['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(req.body.accountStatus.toUpperCase())) {
      finalAccountStatus = req.body.accountStatus.toUpperCase();
    }

    // Create user with default ProfileIcon
    const defaultPhoto = await getDefaultProfilePhoto();

    const newUser = new User({
      name,
      email: normalizedEmail,
      phone: normalizedPhone,
      profilePhoto: defaultPhoto,
      passwordHash: initialPassword, // Pre-save hook hashes this
      role: assignedRole,
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
      employment: (employment && typeof employment === 'object') ? {
        ...employment,
        employmentStatus: (employment.employmentStatus && employment.employmentStatus.trim()) ? employment.employmentStatus.trim() : undefined
      } : undefined,
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

    // Security check: If request is by a WARDEN, they cannot edit ADMIN or WARDEN users
    if ((req.user.role === 'WARDEN' || req.user.role === 'CHAIRPERSON') && ['ADMIN', 'WARDEN', 'CHAIRPERSON'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Wardens do not have permission to edit Admin or Warden accounts.'
      });
    }

    // Security check: If request is by a WARDEN, they cannot set anyone's role to ADMIN or WARDEN
    if ((req.user.role === 'WARDEN' || req.user.role === 'CHAIRPERSON') && updates.role && ['ADMIN', 'WARDEN', 'CHAIRPERSON'].includes(updates.role.toUpperCase())) {
      return res.status(403).json({
        success: false,
        message: 'Wardens do not have permission to set user roles to Admin or Warden.'
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

    // Handle Role update
    if (updates.role !== undefined) {
      const normalizedRole = String(updates.role).toUpperCase().trim();
      const validRoles = ['ADMIN', 'WARDEN', 'MEMBER', 'STAFF', 'STUDENT', 'ALUMNI'];
      if (validRoles.includes(normalizedRole)) {
        user.role = normalizedRole;
      }
      delete updates.role;
    }

    // Map aadhaarNumber to adhaar if needed
    if (updates.aadhaarNumber && !updates.adhaar) {
      updates.adhaar = updates.aadhaarNumber;
    }
    delete updates.aadhaarNumber;

    if (updates.adhaar !== undefined) {
      user.adhaar = updates.adhaar ? String(updates.adhaar).trim() : '';
      delete updates.adhaar;
    }

    // Ignore obsolete CRM status update
    if (updates.status !== undefined) {
      delete updates.status;
    }

    // Handle account status update
    if (updates.accountStatus !== undefined) {
      const normalizedAccountStatus = String(updates.accountStatus || '').toUpperCase().trim();
      if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(normalizedAccountStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid account status value.'
        });
      }
      user.accountStatus = normalizedAccountStatus;
      delete updates.accountStatus;
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

    // Handle partial address updates
    if (updates.address) {
      user.address = {
        ...(user.address ? (user.address.toObject ? user.address.toObject() : user.address) : {}),
        ...updates.address
      };
      delete updates.address;
    }

    // Handle partial employment updates
    if (updates.employment) {
      const empData = { ...updates.employment };
      if (empData.employmentStatus !== undefined && (!empData.employmentStatus || !empData.employmentStatus.trim())) {
        delete empData.employmentStatus;
      }
      user.employment = {
        ...(user.employment ? (user.employment.toObject ? user.employment.toObject() : user.employment) : {}),
        ...empData
      };
      delete updates.employment;
    }

    // Handle localLanguageDetails
    if (updates.localLanguageDetails !== undefined) {
      user.localLanguageDetails = updates.localLanguageDetails ? String(updates.localLanguageDetails).trim() : '';
      delete updates.localLanguageDetails;
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

    // Covert background audit logging
    logAuditEvent({
      req,
      user: req.user,
      action: 'USER_EDIT',
      details: {
        targetUserId: user._id,
        targetUserName: user.name,
        updatedFields: Object.keys(updates || {})
      }
    });

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

    // Security check: If request is by a WARDEN, they cannot change status of ADMIN or WARDEN accounts
    if ((req.user.role === 'WARDEN' || req.user.role === 'CHAIRPERSON') && ['ADMIN', 'WARDEN', 'CHAIRPERSON'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Wardens do not have permission to change status of Admin or Warden accounts.'
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

    // Security check: If request is by a WARDEN, they cannot delete ADMIN or WARDEN accounts
    if ((req.user.role === 'WARDEN' || req.user.role === 'CHAIRPERSON') && ['ADMIN', 'WARDEN', 'CHAIRPERSON'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Wardens do not have permission to delete Admin or Warden accounts.'
      });
    }

    // Delete photo from Cloudinary first if it exists
    if (user.profilePhoto && (user.profilePhoto.publicId || user.profilePhoto.url)) {
      await deleteImage(user.profilePhoto.publicId || user.profilePhoto.url);
    }

    // Remove from database
    await User.findByIdAndDelete(id);

    // Covert background audit logging
    logAuditEvent({
      req,
      user: req.user,
      action: 'USER_DELETE',
      details: {
        targetUserId: user._id,
        targetUserName: user.name,
        targetEmail: user.email,
        targetPhone: user.phone,
        targetRole: user.role
      }
    });

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
 * Get dashboard stats and aggregation charts (ADMIN/WARDEN only)
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    if (!['ADMIN', 'WARDEN'].includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only ADMIN and WARDEN users can access dashboard statistics.'
      });
    }

    const defaultProfilePhoto = (await getDefaultProfilePhoto()).url;
    const currentDate = new Date();
    const startOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1);

    // 1. Basic Counts
    const totalStudents = await User.countDocuments({ role: 'STUDENT' });
    const totalAlumni = await User.countDocuments({ role: 'ALUMNI' });
    const totalMembers = await User.countDocuments({ role: 'MEMBER' });
    const totalStaff = await User.countDocuments({ role: 'STAFF' });
    const totalWardens = await User.countDocuments({ role: 'WARDEN' });
    const totalAdmins = await User.countDocuments({ role: 'ADMIN' });
    const totalUsers = await User.countDocuments();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingEvents = await Event.countDocuments({ eventDate: { $gte: today } });
    const totalEvents = await Event.countDocuments();
    const pastEvents = await Event.countDocuments({ eventDate: { $lt: today } });

    const eventTrendByMonth = await Event.aggregate([
      { $match: { eventDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$eventDate' },
            month: { $month: '$eventDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const formattedEventTrend = Array.from({ length: 6 }).map((_, index) => {
      const dt = new Date(currentDate.getFullYear(), currentDate.getMonth() - (5 - index), 1);
      const keyYear = dt.getFullYear();
      const keyMonth = dt.getMonth() + 1;
      const found = eventTrendByMonth.find(
        (item) => item._id.year === keyYear && item._id.month === keyMonth
      );

      return {
        period: dt.toLocaleString('en-US', { month: 'short' }),
        events: found?.count || 0
      };
    });

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

    const membersByStatus = await User.aggregate([
      { $group: { _id: '$accountStatus', value: { $sum: 1 } } }
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

    // 4. Profile Completeness & completion trends
    const profileCompleteness = await User.aggregate([
      {
        $group: {
          _id: null,
          totalProfiles: { $sum: 1 },
          phone: {
            $sum: { $cond: [{ $ne: [{ $ifNull: ['$phone', ''] }, ''] }, 1, 0] }
          },
          email: {
            $sum: { $cond: [{ $ne: [{ $ifNull: ['$email', ''] }, ''] }, 1, 0] }
          },
          address: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $ne: [{ $ifNull: ['$address.street', ''] }, ''] },
                    { $ne: [{ $ifNull: ['$address.city', ''] }, ''] },
                    { $ne: [{ $ifNull: ['$address.district', ''] }, ''] },
                    { $ne: [{ $ifNull: ['$address.pincode', ''] }, ''] }
                  ]
                },
                1,
                0
              ]
            }
          },
          education: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $ne: [{ $ifNull: ['$education.college', ''] }, ''] },
                    { $ne: [{ $ifNull: ['$education.course', ''] }, ''] }
                  ]
                },
                1,
                0
              ]
            }
          },
          employment: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $ne: [{ $ifNull: ['$employment.occupation', ''] }, ''] },
                    { $ne: [{ $ifNull: ['$employment.organization', ''] }, ''] },
                    { $ne: [{ $ifNull: ['$employment.industry', ''] }, ''] }
                  ]
                },
                1,
                0
              ]
            }
          },
          profilePhoto: {
            $sum: {
              $cond: [
                { $ne: [{ $ifNull: ['$profilePhoto.url', ''] }, defaultProfilePhoto] },
                1,
                0
              ]
            }
          },
          social: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $ne: [{ $ifNull: ['$channels.instagram', ''] }, ''] },
                    { $ne: [{ $ifNull: ['$channels.linkedin', ''] }, ''] },
                    { $ne: [{ $ifNull: ['$channels.whatsapp', ''] }, ''] }
                  ]
                },
                1,
                0
              ]
            }
          },
          completeProfiles: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: [{ $ifNull: ['$phone', ''] }, ''] },
                    { $ne: [{ $ifNull: ['$email', ''] }, ''] },
                    {
                      $or: [
                        { $ne: [{ $ifNull: ['$address.city', ''] }, ''] },
                        { $ne: [{ $ifNull: ['$education.college', ''] }, ''] }
                      ]
                    }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // 5. Gallery overview (photo/video counts, uploads, folders)
    const [totalGalleryPhotos, totalGalleryFolders, mediaTypeDistribution] = await Promise.all([
      GalleryPhoto.countDocuments(),
      GalleryFolder.countDocuments(),
      GalleryPhoto.aggregate([
        { $group: { _id: '$resourceType', count: { $sum: 1 } } },
        { $project: { name: '$_id', value: '$count' } },
        { $sort: { value: -1 } }
      ])
    ]);

    const uploadsByMonth = await GalleryPhoto.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          photos: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthKeys = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - (5 - index), 1);
      return {
        period: date.toLocaleString('en-US', { month: 'short' }),
        date,
        year: date.getFullYear(),
        month: date.getMonth() + 1
      };
    });

    const galleryMonthlyUploads = monthKeys.map(({ period, year, month }) => {
      const found = uploadsByMonth.find(
        (item) => item._id.year === year && item._id.month === month
      );
      return {
        period,
        uploads: found?.photos || 0
      };
    });

    const profileTotals = profileCompleteness[0] || {};

    // 5. Password Reset Statistics (Email sent/failed & OTP vs Redirect Link usage)
    const [
      emailsSentSuccess,
      emailsSentFailed,
      otpUsageCount,
      linkUsageCount
    ] = await Promise.all([
      PasswordResetActivity.countDocuments({ type: 'EMAIL_SENT' }),
      PasswordResetActivity.countDocuments({ type: 'EMAIL_FAILED' }),
      PasswordResetActivity.countDocuments({ type: 'PASSWORD_RESET_OTP' }),
      PasswordResetActivity.countDocuments({ type: 'PASSWORD_RESET_LINK' })
    ]);

    const passwordResetStats = {
      emails: {
        successful: emailsSentSuccess,
        failed: emailsSentFailed,
        total: emailsSentSuccess + emailsSentFailed
      },
      usage: {
        otp: otpUsageCount,
        redirectLink: linkUsageCount,
        total: otpUsageCount + linkUsageCount
      }
    };

    res.status(200).json({
      success: true,
      data: {
        counts: {
          students: totalStudents,
          alumni: totalAlumni,
          members: totalMembers,
          staff: totalStaff,
          wardens: totalWardens,
          chairpersons: totalWardens,
          admins: totalAdmins,
          total: totalUsers,
          upcomingEvents,
          totalEvents,
          pastEvents
        },
        recentUsers,
        profileStats: {
          total: profileTotals.totalProfiles || 0,
          complete: profileTotals.completeProfiles || 0,
          dimensions: [
            { label: 'Phone', value: profileTotals.phone || 0 },
            { label: 'Email', value: profileTotals.email || 0 },
            { label: 'Address', value: profileTotals.address || 0 },
            { label: 'Education', value: profileTotals.education || 0 },
            { label: 'Employment', value: profileTotals.employment || 0 },
            { label: 'Social', value: profileTotals.social || 0 },
            { label: 'Profile Photo', value: profileTotals.profilePhoto || 0 }
          ],
          completePercent: profileTotals.totalProfiles
            ? Math.round((profileTotals.completeProfiles / profileTotals.totalProfiles) * 100)
            : 0
        },
        eventStats: {
          total: totalEvents,
          upcoming: upcomingEvents,
          past: pastEvents,
          trend: formattedEventTrend
        },
        galleryStats: {
          totalPhotos: totalGalleryPhotos,
          totalFolders: totalGalleryFolders,
          uploadsByMonth: galleryMonthlyUploads,
          mediaTypeDistribution
        },
        passwordResetStats,
        charts: {
          rolesDistribution,
          studentsByCollege,
          studentsByCourse,
          alumniByOccupation,
          alumniByCompany,
          locationDistribution,
          ageDistribution: formattedAgeDistribution,
          accountStatusDistribution: membersByStatus,
          eventTrend: formattedEventTrend,
          galleryUploadsByMonth: galleryMonthlyUploads
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
 * Multi-strategy translation helper that tries:
 * 1. Google clients5 dict-chrome-ex (reliable, fast, no auth required)
 * 2. MyMemory API (official free translation service fallback)
 * 3. Google translate_a single gtx fallback
 */
const performTranslation = async (text, targetLang = 'kn', sourceLang = null) => {
  const clean = text.trim();
  const hasKn = /[\u0C80-\u0CFF]/.test(clean);

  // Determine explicit source language to prevent Google from returning text untranslated
  let sl = sourceLang;
  if (!sl) {
    if (targetLang === 'kn') {
      sl = 'en';
    } else if (targetLang === 'en') {
      sl = hasKn ? 'kn' : 'auto';
    } else {
      sl = 'auto';
    }
  }

  // If text is already in Kannada and target is Kannada, return text directly
  if (targetLang === 'kn' && hasKn && !/[a-zA-Z]/.test(clean)) {
    return clean;
  }

  // Strategy 1: Google clients5 dict-chrome-ex
  try {
    const googleUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sl}&tl=${targetLang}&q=${encodeURIComponent(clean)}`;
    const res = await fetch(googleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        let resultStr = '';
        if (typeof data[0] === 'string') {
          resultStr = data.join('');
        } else if (Array.isArray(data[0])) {
          resultStr = data[0].map(item => (typeof item === 'string' ? item : item?.[0] || '')).join('');
        } else if (typeof data[0]?.[0] === 'string') {
          resultStr = data[0][0];
        }
        if (resultStr && resultStr.trim()) {
          // If translating to Kannada, make sure result contains Kannada characters
          if (targetLang === 'kn') {
            if (/[\u0C80-\u0CFF]/.test(resultStr)) {
              return resultStr.trim();
            }
          } else {
            return resultStr.trim();
          }
        }
      }
    }
  } catch (err) {
    console.warn('Translation strategy 1 failed:', err.message);
  }

  // Strategy 2: MyMemory Translated API
  try {
    const langPair = `${sl === 'auto' ? 'en' : sl}|${targetLang}`;
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=${langPair}`;
    const res = await fetch(myMemoryUrl);
    if (res.ok) {
      const data = await res.json();
      const tr = data?.responseData?.translatedText;
      if (tr && !tr.startsWith('MYMEMORY WARNING')) {
        return tr.trim();
      }
    }
  } catch (err) {
    console.warn('Translation strategy 2 failed:', err.message);
  }

  // Strategy 3: Google translate_a single client=gtx
  try {
    const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${targetLang}&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetch(gtxUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.[0])) {
        const joined = data[0].map(c => c?.[0] || '').join('');
        if (joined && joined.trim()) return joined.trim();
      }
    }
  } catch (err) {
    console.warn('Translation strategy 3 failed:', err.message);
  }

  throw new Error('All translation providers failed.');
};

/**
 * Translate English text to Kannada using multi-strategy translation service
 * Numbers/pincodes are normalized to Arabic numerals
 */
exports.translateToKannada = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Text to translate is required.' });
    }

    let translatedText = await performTranslation(text, 'kn', 'en');
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
 * Translate Kannada text to English using multi-strategy translation service
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
    let translatedText = await performTranslation(sanitizedInput, 'en', 'kn');
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

/**
 * Get detailed audit logs & login telemetry for a specific user (ADMIN ONLY)
 */
exports.getUserAuditLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('name email phone role accountStatus lastLoginAt lastLoginDetails createdAt registrationNumber gender');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const logs = await AuditLog.find({
      $or: [
        { user: user._id },
        { userId: String(user._id) },
        ...(user.email ? [{ email: user.email }] : []),
        ...(user.phone ? [{ phone: user.phone }] : [])
      ]
    })
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      data: {
        user,
        logs
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Track user route navigation / page visit covertly in background telemetry
 */
exports.trackPageView = async (req, res, next) => {
  try {
    const { path, pageTitle } = req.body;
    if (!path) {
      return res.status(400).json({ success: false, message: 'Path is required.' });
    }

    logAuditEvent({
      req,
      user: req.user,
      action: 'PAGE_VIEW',
      status: 'SUCCESS',
      details: {
        path: String(path).trim(),
        pageTitle: String(pageTitle || '').trim()
      }
    }).catch(err => console.error('[Telemetry] Failed to log page view:', err));

    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
