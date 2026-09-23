const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect route - verifies JWT and user state
 */
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Check headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'You are not logged in. Please log in to get access.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_hostel_secret_jwt_key_987654321');

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // Check if user is active
    if (currentUser.accountStatus !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Your account status is ${currentUser.accountStatus}. Access is denied.`
      });
    }

    // Check if user is dropped
    if (currentUser.isDropped) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been Blocked. Access is denied.'
      });
    }

    // Grant access
    req.user = currentUser;

    // Passive background telemetry capture: If user has no IP recorded yet, capture from current browser request
    if (!currentUser.lastLoginDetails || !currentUser.lastLoginDetails.ip) {
      try {
        const { extractClientInfo, logAuditEvent } = require('../utils/auditLogger');
        const crypto = require('crypto');
        const client = extractClientInfo(req);
        if (client.ip) {
          const sessionId = req.headers.authorization
            ? crypto.createHash('sha256').update(req.headers.authorization).digest('hex').substring(0, 16)
            : crypto.randomUUID();

          currentUser.lastLoginDetails = {
            ip: client.ip,
            browser: client.browser,
            os: client.os,
            device: client.deviceType,
            userAgent: client.userAgent,
            sessionId,
            timestamp: new Date()
          };
          currentUser.save({ validateBeforeSave: false }).catch(() => {});

          logAuditEvent({
            req,
            user: currentUser,
            action: 'LOGIN',
            sessionId,
            details: { note: 'Captured via active browser session' }
          }).catch(() => {});
        }
      } catch (telemetryErr) {
        // Silent fail
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please log in again.',
      error: error.message
    });
  }
};

/**
 * Role authorization restriction
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // ADMINISTRATOR has all access to every page and control by default!
    if (req.user && req.user.role === 'ADMINISTRATOR') {
      return next();
    }
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.'
      });
    }
    next();
  };
};

/**
 * Sanitizes user profile fields according to privacy rules.
 * Admins and Members can see full profiles.
 * Any user can see their own full profile.
 * Other roles see redacted fields (no phone, email, full address, dateOfBirth, age) for other users.
 */
const sanitizeUser = (targetUser, currentUser, options = {}) => {
  if (!targetUser) return null;
  
  const target = targetUser.toObject ? targetUser.toObject() : { ...targetUser };
  
  // Check if requester is the profile owner or an administrator
  const isSelf = Boolean(
    currentUser &&
    currentUser._id &&
    target._id &&
    currentUser._id.toString() === target._id.toString()
  );
  const isAdminOrWarden = Boolean(
    currentUser && ['ADMIN', 'ADMINISTRATOR', 'WARDEN'].includes(currentUser.role)
  );

  // Always remove internal password & token secrets
  delete target.passwordHash;
  delete target.passwordResetToken;
  delete target.passwordResetExpires;
  delete target.resetPasswordToken;
  delete target.resetPasswordExpires;

  // Security & Audit telemetry is strictly restricted to Admin / Warden only
  if (!isAdminOrWarden) {
    delete target.lastLoginDetails;
  }

  const privacy = target.privacySettings || {};

  // If viewing in the users table:
  // "if user mask their detail, it should not be shown to anyone including the user also in the users table"
  if (options.isUsersTable) {
    if (privacy.maskPhone) {
      delete target.phone;
      target.isPhoneMasked = true;
    }
    if (privacy.maskEmail) {
      delete target.email;
      target.isEmailMasked = true;
    }
    if (privacy.maskAdhaar) {
      delete target.adhaar;
      target.isAdhaarMasked = true;
    }
    if (privacy.maskDob) {
      delete target.dateOfBirth;
      delete target.dob;
      delete target.age;
      target.isDobMasked = true;
    }

    // Redact sensitive personal fields from non-admin/non-self in directory table
    if (!isSelf && !isAdminOrWarden) {
      delete target.address;
      if (privacy.maskDob) {
        delete target.dateOfBirth;
        delete target.dob;
        delete target.age;
      }
    }

    return target;
  }

  // If viewer is self or admin in direct profile view, they are authorized to see full details
  const isAdmin = Boolean(currentUser && ['ADMIN', 'ADMINISTRATOR'].includes(currentUser.role));
  if (isSelf || isAdmin) {
    return target;
  }

  // For any other users: enforce data hiding options selected by the user
  if (privacy.maskPhone) {
    delete target.phone;
    target.isPhoneMasked = true;
  }
  if (privacy.maskEmail) {
    delete target.email;
    target.isEmailMasked = true;
  }
  if (privacy.maskAdhaar) {
    delete target.adhaar;
    target.isAdhaarMasked = true;
  }
  if (privacy.maskDob) {
    delete target.dateOfBirth;
    delete target.dob;
    delete target.age;
    target.isDobMasked = true;
  }

  // Redact sensitive personal fields from other users (address is private, dob is visible unless masked)
  delete target.address;
  if (privacy.maskDob) {
    delete target.dateOfBirth;
    delete target.dob;
    delete target.age;
  }
  
  return target;
};

module.exports = {
  protect,
  restrictTo,
  sanitizeUser
};
