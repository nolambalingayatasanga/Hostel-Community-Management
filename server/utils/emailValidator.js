const User = require('../models/User');

// Standard email syntax validator (RFC 5322)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Verify email existence only against our local database.
 * External Google / SMTP deliverability verification has been removed.
 * Returns: { status: 'EXISTS' | 'INVALID_FORMAT' | 'ALREADY_REGISTERED', message: string }
 */
async function verifyEmailDeliverability(rawEmail) {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return { status: 'INVALID_FORMAT', message: 'Please enter a valid email address' };
  }

  const email = rawEmail.trim().toLowerCase();

  // 1. Syntax & format validation
  if (!EMAIL_REGEX.test(email)) {
    return { status: 'INVALID_FORMAT', message: 'Please enter a valid email address' };
  }

  const [userPart, domain] = email.split('@');
  if (!userPart || !domain || domain.indexOf('.') === -1) {
    return { status: 'INVALID_FORMAT', message: 'Please enter a valid email address' };
  }

  // 2. Database uniqueness check: Only verify with our database if present or not
  try {
    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return {
        status: 'ALREADY_REGISTERED',
        message: 'This email is already registered. Please log in.'
      };
    }
  } catch (err) {
    console.error('Error checking existing user in database for email validation:', err);
  }

  // Not in database -> Email is available to register
  return { status: 'EXISTS', message: 'Email is available' };
}

module.exports = {
  verifyEmailDeliverability
};
