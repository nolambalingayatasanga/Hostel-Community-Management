const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/email');
const { extractClientInfo, logAuditEvent } = require('../utils/auditLogger');
const { getDefaultProfilePhoto } = require('../utils/defaultProfilePhoto');
const { verifyEmailDeliverability } = require('../utils/emailValidator');

// Helper to sign JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'default_hostel_secret_jwt_key_987654321', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Send auth response with token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  // Remove password from output
  const userObject = user.toObject();
  delete userObject.passwordHash;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user: userObject
    }
  });
};

/**
 * Register user - stage 1 (Email, Phone, Password, Role)
 */
exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      adhaar,
      dob,
      password,
      role,
      gender,
      registrationNumber,
      college,
      course,
      startYear,
      endYear
    } = req.body;

    // Validate mandatory common fields
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all mandatory fields (Name, Email, Phone, Password, Role).'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.'
      });
    }

    // Prevent public Admin, Chairperson, or Staff registration
    if (['ADMIN', 'CHAIRPERSON', 'STAFF'].includes(role.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'ADMIN, CHAIRPERSON, and STAFF accounts cannot be registered publicly.'
      });
    }

    // Normalizing email, phone, and optional adhaar
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone.trim().replace(/\s+/g, '');

    // Validate email format and check if already registered in database
    const emailCheck = await verifyEmailDeliverability(normalizedEmail);
    if (emailCheck.status === 'ALREADY_REGISTERED') {
      return res.status(400).json({
        success: false,
        status: 'ALREADY_REGISTERED',
        message: 'This email is already registered. Please log in.'
      });
    }
    if (emailCheck.status === 'INVALID_FORMAT' || emailCheck.status === 'DOES_NOT_EXIST') {
      return res.status(400).json({
        success: false,
        status: 'INVALID_FORMAT',
        message: 'Please enter a valid email address.'
      });
    }

    let cleanAdhaar = undefined;

    if (adhaar && typeof adhaar === 'string' && adhaar.trim()) {
      cleanAdhaar = adhaar.trim().replace(/\s+/g, '');
      if (cleanAdhaar.length !== 12 || !/^\d{12}$/.test(cleanAdhaar)) {
        return res.status(400).json({
          success: false,
          message: 'If provided, Aadhaar number must be a valid 12-digit number.'
        });
      }
    }

    // Determine final role & education fields
    let finalRole = role.toUpperCase();
    const educationData = {};
    let memberInfoData = undefined;

    if (finalRole === 'STUDENT' || finalRole === 'ALUMNI') {
      if (!college || !startYear || !endYear) {
        return res.status(400).json({
          success: false,
          message: 'College Name, Joining Year, and Graduation Year are mandatory for Student/Alumni registration.'
        });
      }

      const currentYear = new Date().getFullYear();
      const gradYearNum = parseInt(endYear, 10);
      const startYearNum = parseInt(startYear, 10);

      if (isNaN(gradYearNum) || isNaN(startYearNum)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide valid 4-digit years for Joining and Graduation Year.'
        });
      }

      // If graduation year < current year, role is ALUMNI; else STUDENT
      finalRole = gradYearNum < currentYear ? 'ALUMNI' : 'STUDENT';

      educationData.college = college.trim();
      if (course && course.trim()) {
        educationData.course = course.trim();
      }
      educationData.startYear = startYearNum;
      educationData.endYear = gradYearNum;
    } else if (finalRole === 'MEMBER') {
      finalRole = 'MEMBER';
      if (registrationNumber && registrationNumber.trim()) {
        memberInfoData = { registrationNo: registrationNumber.trim() };
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid role selected.'
      });
    }

    // Check if user already exists with email, phone, or Aadhaar
    const searchConditions = [
      { email: normalizedEmail },
      { phone: normalizedPhone }
    ];
    if (cleanAdhaar) {
      searchConditions.push({ adhaar: cleanAdhaar });
      searchConditions.push({ adhaar: `${cleanAdhaar.slice(0, 4)} ${cleanAdhaar.slice(4, 8)} ${cleanAdhaar.slice(8, 12)}` });
    }

    const existingUser = await User.findOne({
      $or: searchConditions
    });

    if (existingUser) {
      let duplicateField = 'email or phone';
      if (existingUser.email === normalizedEmail) duplicateField = 'Email Address';
      else if (existingUser.phone === normalizedPhone) duplicateField = 'Phone Number';
      else if (cleanAdhaar && (existingUser.adhaar === cleanAdhaar || existingUser.adhaar?.replace(/\s+/g, '') === cleanAdhaar)) duplicateField = 'Aadhaar Number';

      return res.status(400).json({
        success: false,
        message: `An account with this ${duplicateField} already exists.`
      });
    }

    // Calculate age from DOB if provided
    let calculatedAge = null;
    let parsedDob = null;
    if (dob) {
      const d = new Date(dob);
      if (!isNaN(d.getTime())) {
        parsedDob = d;
        const diffMs = Date.now() - d.getTime();
        const a = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
        if (!isNaN(a) && a >= 0) calculatedAge = a;
      }
    }

    const client = extractClientInfo(req);
    const sessionId = crypto.randomUUID();
    const defaultPhoto = await getDefaultProfilePhoto();

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      profilePhoto: defaultPhoto,
      ...(cleanAdhaar ? { adhaar: cleanAdhaar } : { adhaar: '' }),
      gender: gender ? gender.toUpperCase() : undefined,
      registrationNumber: registrationNumber ? registrationNumber.trim() : undefined,
      ...(memberInfoData && { memberInfo: memberInfoData }),
      ...(parsedDob && { dob: parsedDob, dateOfBirth: parsedDob }),
      ...(calculatedAge !== null && { age: calculatedAge }),
      passwordHash: password, // Pre-save hook hashes this
      role: finalRole,
      ...(Object.keys(educationData).length > 0 && { education: educationData }),
      accountStatus: 'ACTIVE', // Active status upon registration
      lastLoginAt: Date.now(),
      lastLoginDetails: {
        ip: client.ip,
        browser: client.browser,
        os: client.os,
        device: client.deviceType,
        userAgent: client.userAgent,
        sessionId,
        timestamp: new Date()
      }
    });

    // Covert background audit logging
    logAuditEvent({
      req,
      user: newUser,
      action: 'REGISTER',
      sessionId,
      details: { role: finalRole, email: normalizedEmail, phone: normalizedPhone }
    });

    createSendToken(newUser, 201, res); // 201 created status
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to build search conditions from an identifier (Email, Phone, or Aadhaar)
 */
const buildUserSearchConditions = (rawIdentifier) => {
  const clean = rawIdentifier.trim();
  const noSpace = clean.replace(/\s+/g, '');
  const digitsOnly = clean.replace(/\D/g, '');

  const conditions = [
    { email: clean.toLowerCase() },
    { email: noSpace.toLowerCase() },
    { phone: clean },
    { phone: noSpace },
    { adhaar: clean },
    { adhaar: noSpace },
    { registrationNumber: clean },
    { registrationNumber: noSpace }
  ];

  // If 12 digits, also format as 'XXXX XXXX XXXX'
  if (digitsOnly.length === 12) {
    const formatted = `${digitsOnly.slice(0, 4)} ${digitsOnly.slice(4, 8)} ${digitsOnly.slice(8, 12)}`;
    conditions.push({ adhaar: formatted });
    conditions.push({ adhaar: digitsOnly });
  }

  // If 10 digits, also check phone
  if (digitsOnly.length === 10) {
    conditions.push({ phone: digitsOnly });
  }

  return conditions;
};

/**
 * Login user - can use Email, Phone number, or Aadhaar number
 */
exports.login = async (req, res, next) => {
  try {
    const { loginIdentifier, password } = req.body;

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email, phone number, or Aadhaar number and password.'
      });
    }

    const user = await User.findOne({
      $or: buildUserSearchConditions(loginIdentifier)
    }).select('+passwordHash'); // include passwordHash

    if (!user || !(await user.comparePassword(password))) {
      // Log failed login attempt for security / brute-force monitoring
      logAuditEvent({
        req,
        user: user || null,
        action: 'LOGIN',
        status: 'FAILURE',
        details: { loginIdentifier, reason: 'Invalid credentials' }
      });

      return res.status(401).json({
        success: false,
        message: 'Incorrect login credentials or password.'
      });
    }

    if (user.isDropped) {
      logAuditEvent({
        req,
        user,
        action: 'LOGIN',
        status: 'FAILURE',
        details: { loginIdentifier, reason: 'Account dropped' }
      });

      return res.status(403).json({
        success: false,
        message: 'Your account has been dropped. Access is denied. Please contact an administrator.'
      });
    }

    if (user.accountStatus !== 'ACTIVE') {
      logAuditEvent({
        req,
        user,
        action: 'LOGIN',
        status: 'FAILURE',
        details: { loginIdentifier, reason: `Account status: ${user.accountStatus}` }
      });

      return res.status(403).json({
        success: false,
        message: `Your account is currently ${user.accountStatus}. Please contact an administrator.`
      });
    }

    // Extract client info & update last login telemetry
    const client = extractClientInfo(req);
    const sessionId = crypto.randomUUID();

    user.lastLoginAt = Date.now();
    user.lastLoginDetails = {
      ip: client.ip,
      browser: client.browser,
      os: client.os,
      device: client.deviceType,
      userAgent: client.userAgent,
      sessionId,
      timestamp: new Date()
    };
    await user.save({ validateBeforeSave: false });

    // Covert background audit logging
    logAuditEvent({
      req,
      user,
      action: 'LOGIN',
      sessionId,
      details: { loginIdentifier }
    });

    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user (me)
 */
exports.getMe = async (req, res, next) => {
  try {
    // req.user was populated by protect middleware
    res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password - request reset token via email/phone/Aadhaar
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { loginIdentifier } = req.body;

    if (!loginIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email, phone number, or Aadhaar number.'
      });
    }

    const user = await User.findOne({
      $or: buildUserSearchConditions(loginIdentifier)
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with those credentials.'
      });
    }

    if (user.isDropped) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been dropped. Access is denied. Please contact an administrator.'
      });
    }

    if (user.accountStatus !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Your account is currently ${user.accountStatus}. Please contact an administrator.`
      });
    }

    if (!user.email) {
      return res.status(400).json({
        success: false,
        message: 'This account does not have an email address registered. Please contact an administrator to reset your password.'
      });
    }

    // Generate random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and set to database field with 1 hour expiration
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save({ validateBeforeSave: false });

    // Determine client base URL: prioritize current URL params, body params, and request headers over env or default urls
    const rawUrl =
      req.query?.clientUrl ||
      req.query?.redirectUrl ||
      req.query?.origin ||
      req.query?.url ||
      req.body?.clientUrl ||
      req.body?.redirectUrl ||
      req.body?.origin ||
      req.headers?.['x-client-url'] ||
      req.headers?.origin ||
      req.headers?.referer;

    let clientBaseUrl = '';
    if (rawUrl) {
      try {
        const parsed = new URL(rawUrl);
        clientBaseUrl = `${parsed.protocol}//${parsed.host}`;
      } catch (_) {
        clientBaseUrl = String(rawUrl).replace(/\/+$/, '');
      }
    }

    // If not supplied in params/headers, derive dynamically from the incoming request host & protocol
    if (!clientBaseUrl) {
      const forwardedHost = req.headers?.['x-forwarded-host'];
      if (forwardedHost) {
        const proto = req.headers?.['x-forwarded-proto'] || req.protocol || 'https';
        clientBaseUrl = `${proto}://${forwardedHost}`.replace(/\/+$/, '');
      } else if (req.get && req.get('host')) {
        clientBaseUrl = `${req.protocol}://${req.get('host')}`.replace(/\/+$/, '');
      }
    }

    // Only fallback if no request context could be extracted
    if (!clientBaseUrl) {
      clientBaseUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    }
    clientBaseUrl = clientBaseUrl.replace(/\/+$/, '');

    const resetURL = `${clientBaseUrl}/reset-password/${resetToken}`;
    
    const message = `Forgot your password? Please open this link to reset it: ${resetURL}\nIf you did not request this, please ignore this message.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Your Password Reset Token (valid for 60 mins)',
        message,
        html: `
          <h3>Password Reset Request</h3>
          <p>You requested a password reset for your Hostel Community Management account.</p>
          <p>Please click the button below to reset your password:</p>
          <a href="${resetURL}" style="display:inline-block;padding:12px 24px;background-color:#1877F2;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">Reset Password</a>
          <p style="margin-top:20px;">Or copy this link: <a href="${resetURL}">${resetURL}</a></p>
          <p><em>This link is valid for 60 minutes. If you did not request a reset, you can safely ignore this email.</em></p>
        `
      });

      res.status(200).json({
        success: true,
        message: 'Password reset link sent successfully.'
      });
    } catch (err) {
      console.error('Send Email Error:', err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      
      return res.status(500).json({
        success: false,
        message: 'Error sending email: ' + (err.message || 'SMTP service error. Please check server logs.')
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using token
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide password and confirmPassword.'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    // Hash the token from URL to match hashed token in DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.'
      });
    }

    if (user.isDropped) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been dropped. Access is denied.'
      });
    }

    if (user.accountStatus !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Your account status is ${user.accountStatus}. Access is denied.`
      });
    }

    // Update password
    user.passwordHash = password; // Pre-save hook hashes this
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send JWT token
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Real-time Email Existence in Database Verification
 * Returns { success: true, status: 'EXISTS' | 'INVALID_FORMAT' | 'ALREADY_REGISTERED', message: string }
 */
exports.validateEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(200).json({
        success: true,
        status: 'INVALID_FORMAT',
        message: 'Please enter a valid email address'
      });
    }

    const result = await verifyEmailDeliverability(email);
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error during email validation endpoint execution:', error);
    return res.status(200).json({
      success: true,
      status: 'EXISTS',
      message: 'Email is available'
    });
  }
};

