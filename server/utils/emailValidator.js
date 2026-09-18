const User = require('../models/User');

// Standard email syntax validator (RFC 5322)
const EMAIL_SYNTAX_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Recognized TLDs (.com, .in, .co.in, .ac.in, .org, .edu, etc.)
const VALID_TLD_REGEX = /\.(com|in|org|net|edu|gov|co\.in|ac\.in|res\.in|org\.in|edu\.in|net\.in|io|ai|me|info|biz|[a-z]{2,})$/i;

function validateEmailSyntaxAndDomain(rawEmail) {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return { valid: false, message: 'Please enter a valid email address.' };
  }
  const email = rawEmail.trim().toLowerCase();
  if (!email.includes('@')) {
    return { valid: false, message: "Email must contain an '@' symbol." };
  }
  const parts = email.split('@');
  if (parts.length !== 2) {
    return { valid: false, message: "Email can only contain one '@' symbol." };
  }
  const [userPart, domain] = parts;
  if (!userPart) {
    return { valid: false, message: 'Please enter the username part before @.' };
  }
  if (!domain || !domain.includes('.')) {
    return { valid: false, message: 'Please enter a valid domain ending with .com, .in, etc.' };
  }
  if (!EMAIL_SYNTAX_REGEX.test(email)) {
    return { valid: false, message: 'Please enter a valid email address format.' };
  }
  if (domain.includes('..') || userPart.includes('..')) {
    return { valid: false, message: 'Email cannot contain consecutive dots.' };
  }
  const domainLower = domain.toLowerCase();
  if (/^(gmial|gamil|gmaill|gmai)\./i.test(domainLower)) {
    return { valid: false, message: 'Invalid email domain. Did you mean @gmail.com?' };
  }
  if (domainLower.startsWith('gmail.')) {
    if (domainLower !== 'gmail.com') {
      return { valid: false, message: 'Invalid Gmail address. Must end with @gmail.com' };
    }
  }
  if (!VALID_TLD_REGEX.test(domainLower)) {
    return { valid: false, message: 'Email must end with a valid domain (e.g. .com, .in, etc.).' };
  }
  return { valid: true, email };
}

/**
 * Verify email syntax, domain format, and existence against our local database.
 * Returns: { status: 'EXISTS' | 'INVALID_FORMAT' | 'ALREADY_REGISTERED', message: string }
 */
async function verifyEmailDeliverability(rawEmail) {
  const check = validateEmailSyntaxAndDomain(rawEmail);
  if (!check.valid) {
    return { status: 'INVALID_FORMAT', message: check.message };
  }

  const email = check.email;

  // Database uniqueness check
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

  // Not in database -> Email is valid and available to register
  return { status: 'EXISTS', message: 'Email is available' };
}

module.exports = {
  verifyEmailDeliverability,
  validateEmailSyntaxAndDomain
};
