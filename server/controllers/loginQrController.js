const LoginQrLink = require('../models/LoginQrLink');
const generateQRCode = require('../utils/qrGenerator');
const { generateRandomCode } = require('../utils/helpers');
const { getClientIp, normalizeIp } = require('../utils/getClientIp');

const LOGIN_QR_SLUG = 'kambi-login';
const LOGIN_REDIRECT_URL = process.env.QR_REDIRECT_URL || 'https://www.kambi-connect.in/login';

const getPublicBaseUrl = (req) => {
  const headerOrigin = req?.headers?.['x-client-url'];
  const queryOrigin = req?.query?.origin;
  const candidate = queryOrigin || headerOrigin;
  if (candidate && /^https?:\/\/[^\s]+$/i.test(String(candidate))) {
    return String(candidate).replace(/\/$/, '');
  }
  return (process.env.PUBLIC_QR_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
};

const normalizeCode = (rawCode = '') => {
  return String(rawCode).trim().replace(/=qr$/i, '');
};

const buildAnalytics = (link, { page = 1, limit = 15 } = {}) => {
  const devices = [...(link.devices || [])]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .map((device) => ({
      ...((device && device.toObject) ? device.toObject() : device),
      ip: normalizeIp(device.ip) || device.ip || ''
    }));
  const qrDevices = devices.filter((d) => d.accessType === 'qr');
  const directDevices = devices.filter((d) => d.accessType !== 'qr');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const todayScans = devices.filter(
    (d) => d.accessType === 'qr' && new Date(d.timestamp) >= startOfToday
  ).length;
  const todayClicks = devices.filter(
    (d) => d.accessType !== 'qr' && new Date(d.timestamp) >= startOfToday
  ).length;
  const weekScans = devices.filter(
    (d) => d.accessType === 'qr' && new Date(d.timestamp) >= sevenDaysAgo
  ).length;

  const trendMap = {};
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    trendMap[dateStr] = { date: dateStr, day: dayName, scans: 0, clicks: 0 };
  }
  devices.forEach((device) => {
    const dateStr = new Date(device.timestamp).toISOString().split('T')[0];
    if (!trendMap[dateStr]) return;
    if (device.accessType === 'qr') {
      trendMap[dateStr].scans += 1;
    } else {
      trendMap[dateStr].clicks += 1;
    }
  });

  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 15, 1), 100);
  const total = devices.length;
  const skip = (parsedPage - 1) * parsedLimit;

  return {
    name: link.name,
    slug: link.slug,
    code: link.code,
    trackingLink: link.trackingLink,
    qrTrackingLink: link.qrTrackingLink,
    redirectUrl: link.redirectUrl || LOGIN_REDIRECT_URL,
    qrCode: link.qrCode,
    clickCount: link.clickCount || 0,
    scanCount: link.scanCount || 0,
    totalInteractions: (link.clickCount || 0) + (link.scanCount || 0),
    todayScans,
    todayClicks,
    weekScans,
    directDeviceHits: directDevices.length,
    scanDeviceHits: qrDevices.length,
    uniqueDeviceCount: new Set(devices.map((d) => d.ip).filter(Boolean)).size,
    trend: Object.values(trendMap),
    devices: devices.slice(skip, skip + parsedLimit),
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit) || 1
    }
  };
};

const ensureLoginQr = async (req) => {
  const baseUrl = getPublicBaseUrl(req);
  let link = await LoginQrLink.findOne({ slug: LOGIN_QR_SLUG });

  if (link) {
    const trackingLink = `${baseUrl}/${link.code}`;
    const qrTrackingLink = `${trackingLink}?r=qr`;
    const needsRefresh =
      link.trackingLink !== trackingLink ||
      link.qrTrackingLink !== qrTrackingLink ||
      link.redirectUrl !== LOGIN_REDIRECT_URL;

    if (needsRefresh) {
      const { qrCode } = await generateQRCode(qrTrackingLink);
      link.trackingLink = trackingLink;
      link.qrTrackingLink = qrTrackingLink;
      link.redirectUrl = LOGIN_REDIRECT_URL;
      link.qrCode = qrCode;
      await link.save();
    }

    return link;
  }

  const code = generateRandomCode();
  const trackingLink = `${baseUrl}/${code}`;
  const qrTrackingLink = `${trackingLink}?r=qr`;
  const { qrCode } = await generateQRCode(qrTrackingLink);

  return LoginQrLink.create({
    name: 'Kambi Connect Login',
    slug: LOGIN_QR_SLUG,
    code,
    qrCode,
    trackingLink,
    qrTrackingLink,
    redirectUrl: LOGIN_REDIRECT_URL
  });
};

/**
 * GET /api/qr-scans/t/:code
 * Public tracking endpoint. Counts the scan/click, stores device info, then
 * redirects to https://www.kambi-connect.in/login
 */
exports.trackLoginQr = async (req, res) => {
  try {
    const rawCode = req.params.code || '';
    const code = normalizeCode(rawCode);
    const isQr = req.query.r === 'qr' || /=qr$/i.test(rawCode);

    if (code) {
      await LoginQrLink.findOneAndUpdate(
        { code },
        {
          $inc: {
            [isQr ? 'scanCount' : 'clickCount']: 1
          },
          $push: {
            devices: {
              ...req.deviceInfo,
              ip: getClientIp(req),
              accessType: isQr ? 'qr' : 'direct',
              timestamp: new Date()
            }
          }
        }
      );
    }
  } catch (error) {
    console.error('Error tracking login QR:', error);
  }

  return res.redirect(LOGIN_REDIRECT_URL);
};

/**
 * GET /api/qr-scans/login-qr
 * Return (or create) the login QR and analytics for the dashboard.
 */
exports.getLoginQr = async (req, res) => {
  try {
    const link = await ensureLoginQr(req);
    return res.status(200).json({
      success: true,
      data: buildAnalytics(link, {
        page: req.query.page,
        limit: req.query.limit
      })
    });
  } catch (error) {
    console.error('Error fetching login QR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load login QR',
      error: error.message
    });
  }
};

/**
 * GET /api/qr-scans/login-qr/download
 * Download the login QR as PNG (default) or SVG.
 */
exports.downloadLoginQr = async (req, res) => {
  try {
    const link = await ensureLoginQr(req);
    const format = String(req.query.format || 'png').toLowerCase();

    if (format === 'svg') {
      res.set('Content-Type', 'image/svg+xml');
      res.set('Content-Disposition', 'attachment; filename="kambi-connect-login-qr.svg"');
      return res.send(link.qrCode);
    }

    const { qrPngBuffer } = await generateQRCode(link.qrTrackingLink);
    res.set('Content-Type', 'image/png');
    res.set('Content-Disposition', 'attachment; filename="kambi-connect-login-qr.png"');
    return res.send(qrPngBuffer);
  } catch (error) {
    console.error('Error downloading login QR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to download QR code',
      error: error.message
    });
  }
};

/**
 * DELETE /api/qr-scans/login-qr/device/:id
 * Delete a specific device scan log and decrement appropriate count
 */
exports.deleteDeviceLog = async (req, res) => {
  try {
    const { id } = req.params;
    const link = await LoginQrLink.findOne({ slug: LOGIN_QR_SLUG });
    if (!link) {
      return res.status(404).json({ success: false, message: 'Login QR record not found' });
    }

    const device = link.devices.id(id);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device scan log not found' });
    }

    const isQr = device.accessType === 'qr';
    link.devices.pull({ _id: id });
    if (isQr) {
      link.scanCount = Math.max(0, (link.scanCount || 0) - 1);
    } else {
      link.clickCount = Math.max(0, (link.clickCount || 0) - 1);
    }

    await link.save();

    return res.status(200).json({
      success: true,
      message: 'Scan log deleted successfully',
      data: buildAnalytics(link, { page: req.query.page, limit: req.query.limit })
    });
  } catch (error) {
    console.error('Error deleting device log:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete scan log',
      error: error.message
    });
  }
};

/**
 * DELETE /api/qr-scans/login-qr/devices
 * Clear all device scan logs or selected device IDs, resetting counts accordingly
 */
exports.clearDeviceLogs = async (req, res) => {
  try {
    const link = await LoginQrLink.findOne({ slug: LOGIN_QR_SLUG });
    if (!link) {
      return res.status(404).json({ success: false, message: 'Login QR record not found' });
    }

    const { ids, resetCounts = true } = req.body || {};

    if (Array.isArray(ids) && ids.length > 0) {
      const idSet = new Set(ids.map(String));
      let qrRemoved = 0;
      let clickRemoved = 0;

      link.devices = link.devices.filter(d => {
        if (idSet.has(String(d._id))) {
          if (d.accessType === 'qr') qrRemoved++;
          else clickRemoved++;
          return false;
        }
        return true;
      });

      link.scanCount = Math.max(0, (link.scanCount || 0) - qrRemoved);
      link.clickCount = Math.max(0, (link.clickCount || 0) - clickRemoved);
    } else {
      link.devices = [];
      if (resetCounts !== false) {
        link.scanCount = 0;
        link.clickCount = 0;
      }
    }

    await link.save();

    return res.status(200).json({
      success: true,
      message: Array.isArray(ids) && ids.length > 0
        ? `${ids.length} scan logs deleted successfully`
        : 'All scan logs and counts cleared successfully',
      data: buildAnalytics(link, { page: 1, limit: req.query.limit })
    });
  } catch (error) {
    console.error('Error clearing device logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear scan logs',
      error: error.message
    });
  }
};

