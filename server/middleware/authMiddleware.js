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

    // Grant access
    req.user = currentUser;
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
const sanitizeUser = (targetUser, currentUser) => {
  if (!targetUser) return null;
  
  const target = targetUser.toObject ? targetUser.toObject() : { ...targetUser };
  
  // If target is current user, or viewer is admin/member, show full details
  if (currentUser && (currentUser._id.toString() === target._id.toString() || ['ADMIN', 'CHAIRPERSON'].includes(currentUser.role))) {
    // Remove internal password info just in case
    delete target.passwordHash;
    delete target.passwordResetToken;
    delete target.passwordResetExpires;
    return target;
  }

  // Redact private fields
  delete target.email;
  delete target.phone;
  delete target.address;
  delete target.dateOfBirth;
  delete target.passwordHash;
  delete target.passwordResetToken;
  delete target.passwordResetExpires;
  delete target.resetPasswordToken;
  delete target.resetPasswordExpires;
  
  return target;
};

module.exports = {
  protect,
  restrictTo,
  sanitizeUser
};
