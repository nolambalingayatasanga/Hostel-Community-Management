const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PasswordResetActivity = require('../models/PasswordResetActivity');
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
      endYear,
      privacySettings
    } = req.body;

    // Validate mandatory common fields
    if (!name || !email || !phone || !password || !role || !dob) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all mandatory fields (Name, Email, Phone, Password, Role, Date of Birth).'
      });
    }

    if (dob && isNaN(new Date(dob).getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Date of Birth.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.'
      });
    }

    // Prevent public Admin, Warden, or Staff registration
    if (['ADMIN', 'WARDEN', 'CHAIRPERSON', 'STAFF'].includes(role.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'ADMIN, WARDEN, and STAFF accounts cannot be registered publicly.'
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
    const cleanRegNo = (registrationNumber && typeof registrationNumber === 'string') ? registrationNumber.trim() : '';
    if (cleanRegNo) {
      searchConditions.push({ registrationNumber: cleanRegNo });
    }

    const existingUser = await User.findOne({
      $or: searchConditions
    });

    if (existingUser) {
      let duplicateField = 'email or phone';
      if (existingUser.email === normalizedEmail) duplicateField = 'Email Address';
      else if (existingUser.phone === normalizedPhone) duplicateField = 'Phone Number';
      else if (cleanAdhaar && (existingUser.adhaar === cleanAdhaar || existingUser.adhaar?.replace(/\s+/g, '') === cleanAdhaar)) duplicateField = 'Aadhaar Number';
      else if (cleanRegNo && existingUser.registrationNumber === cleanRegNo) duplicateField = 'Registration Number';

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
      registrationNumber: cleanRegNo || undefined,
      privacySettings: {
        maskPhone: Boolean(privacySettings?.maskPhone),
        maskEmail: Boolean(privacySettings?.maskEmail),
        maskAdhaar: Boolean(privacySettings?.maskAdhaar)
      },
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

    // Generate 6-digit numeric OTP for in-app verification
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = crypto
      .createHash('sha256')
      .update(resetOtp)
      .digest('hex');

    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    user.resetPasswordMethod = 'LINK';

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
    
    const message = `Forgot your password? Your verification OTP is: ${resetOtp}\nOr open this link to reset it directly: ${resetURL}\nIf you did not request this, please ignore this message.`;

    const otpDigits = resetOtp.split('');
    const otpBoxesHtml = otpDigits.map(digit => `
      <td align="center" style="width: 44px; height: 52px; background-color: #DBEAFE; border-radius: 10px; font-size: 26px; font-weight: 800; color: #0284C7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, monospace; text-align: center; vertical-align: middle;">
        ${digit}
      </td>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
      </head>
      <body style="margin: 0; padding: 24px 12px; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #E2E8F0;">
          <tr>
            <td style="padding: 36px 28px 32px 28px;">
              <!-- 1. Top Logo -->
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="display: inline-block; vertical-align: middle;">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 6px;">
                    <circle cx="7.5" cy="15.5" r="5.5" stroke="#1877F2" stroke-width="2.5"/>
                    <path d="M11.5 11.5L21.5 1.5" stroke="#1877F2" stroke-width="2.5" stroke-linecap="round"/>
                    <path d="M16 7L18.5 4.5" stroke="#1877F2" stroke-width="2.5" stroke-linecap="round"/>
                    <path d="M18.5 9.5L21 7" stroke="#1877F2" stroke-width="2.5" stroke-linecap="round"/>
                  </svg>
                  <span style="font-size: 22px; font-weight: 800; color: #0F172A; letter-spacing: -0.3px; vertical-align: middle;">Kambi</span>
                  <span style="font-size: 22px; font-weight: 800; color: #1877F2; letter-spacing: -0.3px; vertical-align: middle;">Connect</span>
                </span>
              </div>

              <!-- 2. Envelope Vector Graphic -->
              <div style="text-align: center; margin-bottom: 20px;">
                <svg width="180" height="135" viewBox="0 0 180 135" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block;">
                  <!-- Soft Cloud Blob -->
                  <path d="M 44 92 C 32 80 34 58 50 46 C 62 36 80 38 90 44 C 100 34 122 34 134 44 C 146 56 148 74 140 88 C 150 100 142 118 122 120 C 110 122 98 116 88 118 C 76 122 62 118 54 108 C 44 104 40 98 44 92 Z" fill="#EEF6FF" />
                  <!-- Accent Rays -->
                  <line x1="90" y1="24" x2="90" y2="18" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" />
                  <line x1="82" y1="26" x2="77" y2="21" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" />
                  <line x1="98" y1="26" x2="103" y2="21" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round" />
                  <!-- White Paper Card -->
                  <rect x="62" y="34" width="56" height="58" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2" />
                  <!-- Shield Lock Badge -->
                  <path d="M 90 46 C 97 46 102 48 102 48 V 62 C 102 70 94 75 90 77 C 86 75 78 70 78 62 V 48 C 78 48 83 46 90 46 Z" fill="#1877F2" />
                  <path d="M 87.5 59 V 56 C 87.5 54.6 88.6 53.5 90 53.5 C 91.4 53.5 92.5 54.6 92.5 56 V 59" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" />
                  <rect x="86" y="58" width="8" height="6.5" rx="1.5" fill="#FFFFFF" />
                  <circle cx="90" cy="61" r="0.8" fill="#1877F2" />
                  <!-- Open Envelope Flaps -->
                  <path d="M 52 58 L 90 82 L 128 58 L 128 104 C 128 106 126 108 124 108 L 56 108 C 54 108 52 106 52 104 Z" fill="#1D4ED8" />
                  <path d="M 52 59 L 90 85 L 52 108 Z" fill="#2563EB" />
                  <path d="M 128 59 L 90 85 L 128 108 Z" fill="#1D4ED8" />
                  <path d="M 52 108 L 90 78 L 128 108 Z" fill="#2563EB" />
                </svg>
              </div>

              <!-- 3. Title & Subtitle -->
              <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 800; color: #0F172A; text-align: center; letter-spacing: -0.5px;">Password Reset Request</h1>
              <p style="margin: 0 0 24px 0; font-size: 14.5px; color: #64748B; text-align: center; line-height: 1.5;">You requested a password reset for your Kambi Connect account.</p>

              <!-- 4. OTP Card -->
              <div style="background-color: #F0F6FF; border-radius: 16px; padding: 22px 16px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 16px 0; font-size: 12px; font-weight: 700; color: #475569; letter-spacing: 0.8px; text-transform: uppercase;">YOUR VERIFICATION CODE (OTP)</p>
                <table align="center" border="0" cellpadding="0" cellspacing="6" style="margin: 0 auto;">
                  <tr>
                    ${otpBoxesHtml}
                    <td align="center" style="vertical-align: middle; padding-left: 8px;">
                      <a href="javascript:void(0);"
                         onclick="if(navigator.clipboard){navigator.clipboard.writeText('${resetOtp}');}else{var t=document.createElement('textarea');t.value='${resetOtp}';document.body.appendChild(t);t.select();document.execCommand('copy');document.body.removeChild(t);}return false;"
                         title="Copy OTP Code"
                         style="display: inline-block; cursor: pointer; text-decoration: none; line-height: 0; vertical-align: middle; padding: 6px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
                          <rect x="9" y="9" width="13" height="13" rx="2" stroke="#0088ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="#0088ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin: 12px 0 0 0; font-size: 13px; color: #64748B;">Enter this code on the password reset screen.</p>
              </div>

              <!-- 5. Divider -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
                <tr>
                  <td style="border-bottom: 1px solid #E2E8F0; width: 44%;"></td>
                  <td style="text-align: center; width: 12%; color: #94A3B8; font-size: 12px; font-weight: 700; text-transform: uppercase; padding: 0 10px;">OR</td>
                  <td style="border-bottom: 1px solid #E2E8F0; width: 44%;"></td>
                </tr>
              </table>

              <!-- 6. Reset Password Directly Button -->
              <div style="margin-bottom: 16px;">
                <a href="${resetURL}" style="display: block; width: 100%; box-sizing: border-box; background-color: #1877F2; color: #FFFFFF; text-align: center; padding: 15px 20px; border-radius: 12px; font-weight: 700; font-size: 15px; text-decoration: none; box-shadow: 0 4px 12px rgba(24, 119, 242, 0.25);">
                  <span style="font-size: 16px; margin-right: 6px;">🔒</span> Reset Password Directly
                </a>
              </div>

              <!-- 7. Direct Link Box with Copy Button -->
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="width: 24px; vertical-align: top; padding-top: 2px;">
                      <span style="font-size: 16px; color: #64748B;">🔗</span>
                    </td>
                    <td style="vertical-align: top; padding-left: 6px;">
                    
                      <div style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 8px 10px; font-family: monospace; font-size: 11.5px; color: #1E293B; word-break: break-all; line-height: 1.4; user-select: all; -webkit-user-select: all;">
                        ${resetURL}
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- 8. Valid for 60 Minutes Notice -->
              <div style="background-color: #EFF6FF; border-radius: 12px; padding: 14px 16px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="width: 32px; vertical-align: middle;">
                      <span style="font-size: 22px;">🛡️</span>
                    </td>
                    <td style="border-left: 1.5px solid #BFDBFE; padding-left: 14px;">
                      <p style="margin: 0 0 2px 0; font-size: 13px; font-weight: 700; color: #1E40AF;">This OTP and link are valid for 60 minutes.</p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: `${resetOtp} is your Kambi Connect password reset code`,
        message,
        html: emailHtml
      });

      // Track successful password reset email sent
      await PasswordResetActivity.create({
        type: 'EMAIL_SENT',
        email: user.email,
        user: user._id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers ? req.headers['user-agent'] : ''
      }).catch(e => console.warn('Activity log error:', e.message));

      res.status(200).json({
        success: true,
        message: 'Password reset link and OTP sent successfully.'
      });
    } catch (err) {
      console.error('Send Email Error:', err);

      // Track failed password reset email attempt
      await PasswordResetActivity.create({
        type: 'EMAIL_FAILED',
        email: user.email,
        user: user._id,
        errorMessage: err.message,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers ? req.headers['user-agent'] : ''
      }).catch(e => console.warn('Activity log error:', e.message));

      user.resetPasswordToken = undefined;
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpires = undefined;
      user.resetPasswordMethod = undefined;
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
 * Verify reset OTP and generate token for password update
 */
exports.verifyResetOtp = async (req, res, next) => {
  try {
    const { email, loginIdentifier, otp } = req.body;
    const identifier = (email || loginIdentifier || '').trim().toLowerCase();
    const cleanOtp = (otp || '').toString().trim();

    if (!identifier || !cleanOtp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and verification OTP.'
      });
    }

    if (cleanOtp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be a 6-digit number.'
      });
    }

    const hashedOtp = crypto
      .createHash('sha256')
      .update(cleanOtp)
      .digest('hex');

    const user = await User.findOne({
      email: identifier,
      resetPasswordOtp: hashedOtp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please check the code or request a new one.'
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

    // Generate a fresh reset token to allow password updating
    const freshToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(freshToken)
      .digest('hex');
    // Clear the OTP so it cannot be reused, and record that this user verified via OTP
    user.resetPasswordOtp = undefined;
    user.resetPasswordMethod = 'OTP';
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      resetToken: freshToken
    });
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

    // Determine whether user reset via OTP or direct redirect link
    const resetMethod = user.resetPasswordMethod === 'OTP' ? 'OTP' : 'LINK';

    // Track usage in PasswordResetActivity
    await PasswordResetActivity.create({
      type: resetMethod === 'OTP' ? 'PASSWORD_RESET_OTP' : 'PASSWORD_RESET_LINK',
      method: resetMethod,
      email: user.email,
      user: user._id,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers ? req.headers['user-agent'] : ''
    }).catch(e => console.warn('Activity log error:', e.message));

    // Update password
    user.passwordHash = password; // Pre-save hook hashes this
    user.resetPasswordToken = undefined;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordMethod = undefined;
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

