const crypto = require('crypto');
const AuditLog = require('../models/AuditLog');

/**
 * Extract client network and device telemetry from request
 */
const extractClientInfo = (req) => {
  if (!req) {
    return {
      ip: '',
      browser: 'Unknown',
      os: 'Unknown',
      deviceType: 'Desktop',
      userAgent: ''
    };
  }

  // 1. Determine public IP address
  const forwarded = req.headers['x-forwarded-for'];
  let ip = '';
  if (forwarded) {
    ip = forwarded.split(',')[0].trim();
  } else if (req.headers['cf-connecting-ip']) {
    ip = req.headers['cf-connecting-ip'];
  } else if (req.headers['x-real-ip']) {
    ip = req.headers['x-real-ip'];
  } else if (req.socket && req.socket.remoteAddress) {
    ip = req.socket.remoteAddress;
  } else if (req.ip) {
    ip = req.ip;
  }

  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }

  // 2. User-Agent
  const userAgent = req.headers['user-agent'] || '';

  // 3. Browser detection
  let browser = 'Other';
  if (/edg\//i.test(userAgent)) {
    const match = userAgent.match(/edg\/(\d+[\.\d]*)/i);
    browser = `Edge ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/opr\/|opera/i.test(userAgent)) {
    const match = userAgent.match(/(?:opr|opera)\/(\d+[\.\d]*)/i);
    browser = `Opera ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/chrome|crios/i.test(userAgent) && !/edg/i.test(userAgent)) {
    const match = userAgent.match(/(?:chrome|crios)\/(\d+[\.\d]*)/i);
    browser = `Chrome ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/firefox|fxios/i.test(userAgent)) {
    const match = userAgent.match(/(?:firefox|fxios)\/(\d+[\.\d]*)/i);
    browser = `Firefox ${match ? match[1].split('.')[0] : ''}`.trim();
  } else if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) {
    const match = userAgent.match(/version\/(\d+[\.\d]*)/i);
    browser = `Safari ${match ? match[1].split('.')[0] : ''}`.trim();
  }

  // 4. Operating System detection
  let os = 'Other';
  if (/iphone/i.test(userAgent)) {
    const match = userAgent.match(/os (\d+[_\.\d]*)/i);
    os = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS (iPhone)';
  } else if (/ipad/i.test(userAgent)) {
    const match = userAgent.match(/os (\d+[_\.\d]*)/i);
    os = match ? `iPadOS ${match[1].replace(/_/g, '.')}` : 'iPadOS';
  } else if (/android/i.test(userAgent)) {
    const match = userAgent.match(/android (\d+[\.\d]*)/i);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/windows nt 10\.0/i.test(userAgent)) os = 'Windows 10/11';
  else if (/windows nt 6\.3/i.test(userAgent)) os = 'Windows 8.1';
  else if (/windows nt 6\.2/i.test(userAgent)) os = 'Windows 8';
  else if (/windows nt 6\.1/i.test(userAgent)) os = 'Windows 7';
  else if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(userAgent)) {
    const match = userAgent.match(/mac os x (\d+[_\.\d]*)/i);
    os = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
  } else if (/cros/i.test(userAgent)) {
    os = 'Chrome OS';
  } else if (/linux/i.test(userAgent)) {
    os = 'Linux';
  }

  // 5. Device Type detection
  let deviceType = 'Desktop';
  if (/ipad|tablet/i.test(userAgent)) {
    deviceType = 'Tablet';
  } else if (/mobile|iphone|ipod|android.*mobile|blackberry|iemobile/i.test(userAgent)) {
    deviceType = 'Mobile';
  }

  return {
    ip,
    browser,
    os,
    deviceType,
    userAgent
  };
};

/**
 * Covert background audit log recorder
 * Will NEVER disrupt, block, or fail user transactions
 */
const logAuditEvent = async ({
  req,
  user,
  action,
  status = 'SUCCESS',
  sessionId = null,
  details = {}
}) => {
  try {
    const client = extractClientInfo(req);
    const u = user || req?.user || {};

    const userIdStr = u._id ? String(u._id) : (u.id || '');
    
    let finalSessionId = sessionId;
    if (!finalSessionId) {
      if (req?.headers?.authorization) {
        finalSessionId = crypto.createHash('sha256').update(req.headers.authorization).digest('hex').substring(0, 16);
      } else {
        finalSessionId = crypto.randomUUID();
      }
    }

    return await AuditLog.create({
      user: u._id || undefined,
      userId: userIdStr,
      userName: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      role: u.role || '',
      action,
      status,
      ipAddress: client.ip || '',
      browser: client.browser || '',
      os: client.os || '',
      deviceType: client.deviceType || 'Desktop',
      userAgent: client.userAgent || '',
      sessionId: finalSessionId,
      details
    });
  } catch (err) {
    // Silent fail in production to not impact user experience
    console.error('Audit log background error:', err.message);
    return null;
  }
};

module.exports = {
  extractClientInfo,
  logAuditEvent
};
