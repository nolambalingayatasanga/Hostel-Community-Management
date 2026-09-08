const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/email');

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
    const { name, email, phone, password, confirmPassword, role } = req.body;

    // Validation
    if (!name || !email || !phone || !password || !confirmPassword || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, phone, password, confirmPassword, and role.'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    // Prevent public Admin, Chairperson, or Staff registration
    if (['ADMIN', 'CHAIRPERSON', 'STAFF'].includes(role.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'ADMIN, CHAIRPERSON, and STAFF accounts cannot be registered publicly.'
      });
    }

    // Ensure role is valid
    let finalRole = role.toUpperCase();
    if (finalRole === 'ALUMNI') {
      finalRole = 'STUDENT';
    }
    
    const validRoles = ['MEMBER', 'STUDENT'];
    if (!validRoles.includes(finalRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role selected. Options: ${validRoles.join(', ')}`
      });
    }

    // Normalizing email and phone
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone.trim();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: normalizedPhone }]
    });

    if (existingUser) {
      const field = existingUser.email === normalizedEmail ? 'email' : 'phone number';
      return res.status(400).json({
        success: false,
        message: `An account with this ${field} already exists.`
      });
    }

    const newUser = await User.create({
      name,
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash: password, // Pre-save hook hashes this
      role: finalRole,
      accountStatus: 'ACTIVE' // Active status upon registration
    });

    createSendToken(newUser, 217, res); // 217 created status
  } catch (error) {
    next(error);
  }
};

/**
 * Login user - can use Email OR Phone number
 */
exports.login = async (req, res, next) => {
  try {
    const { loginIdentifier, password } = req.body;

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email or phone number and password.'
      });
    }

    const cleanIdentifier = loginIdentifier.trim();

    // Query by either email or phone
    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier.toLowerCase() },
        { phone: cleanIdentifier }
      ]
    }).select('+passwordHash'); // include passwordHash

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect email/phone number or password.'
      });
    }

    if (user.accountStatus !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Your account is currently ${user.accountStatus}. Please contact an administrator.`
      });
    }

    // Update last login timestamp
    user.lastLoginAt = Date.now();
    await user.save({ validateBeforeSave: false });

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
 * Forgot password - generates secure reset link
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { loginIdentifier } = req.body;
    if (!loginIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email or phone number.'
      });
    }

    const cleanIdentifier = loginIdentifier.trim();

    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier.toLowerCase() },
        { phone: cleanIdentifier }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'There is no user with that email or phone number.'
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

    // Send reset URL
    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    const message = `Forgot your password? Please open this link to reset it: ${resetURL}\nIf you did not request this, please ignore this message.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Your Password Reset Token (valid for 60 mins)',
        message,
        html: `
          <h3>Password Reset Request</h3>
          <p>You requested a password reset. Please click the button below to reset your password:</p>
          <a href="${resetURL}" style="display:inline-block;padding:10px 20px;background-color:#1976d2;color:white;text-decoration:none;border-radius:4px;">Reset Password</a>
          <p>Or copy this link: <a href="${resetURL}">${resetURL}</a></p>
          <p><em>This link is valid for 60 minutes. If you did not request a reset, please ignore this.</em></p>
        `
      });

      res.status(200).json({
        success: true,
        message: 'Password reset link sent successfully.'
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      
      return res.status(500).json({
        success: false,
        message: 'Error sending email. Please try again later.',
        error: err.message
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
