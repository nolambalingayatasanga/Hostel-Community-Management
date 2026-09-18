const mongoose = require('mongoose');
const QrScan = require('../models/QrScan');
const User = require('../models/User');

/**
 * Helper to resolve user from diverse QR code payloads
 */
async function resolveUserFromQr(qrRaw) {
  if (!qrRaw) return null;
  const raw = String(qrRaw).trim();

  // 1. Check if raw string is direct MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(raw) && raw.length === 24) {
    const user = await User.findById(raw);
    if (user) return user;
  }

  // 2. Check JSON payload (e.g. { "userId": "...", "regNo": "..." })
  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.userId && mongoose.Types.ObjectId.isValid(parsed.userId)) {
        const user = await User.findById(parsed.userId);
        if (user) return user;
      }
      if (parsed.registrationNumber || parsed.regNo) {
        const reg = parsed.registrationNumber || parsed.regNo;
        const user = await User.findOne({
          $or: [
            { registrationNumber: reg },
            { 'memberInfo.registrationNo': reg }
          ]
        });
        if (user) return user;
      }
      if (parsed.email) {
        const user = await User.findOne({ email: parsed.email.toLowerCase().trim() });
        if (user) return user;
      }
    } catch {
      // not JSON
    }
  }

  // 3. Check formatted prefixes e.g. "HOSTEL:USER:<id>" or "USER:<id>" or "KC:USER:<id>"
  const prefixMatch = raw.match(/(?:HOSTEL|KAMBI|KC)?(?::)?USER:([a-f\d]{24})/i);
  if (prefixMatch && prefixMatch[1]) {
    const user = await User.findById(prefixMatch[1]);
    if (user) return user;
  }

  // 4. Check if raw is a URL with an ObjectId (e.g. /public-scan/<id> or similar)
  const urlMatch = raw.match(/public-scan\/([a-f\d]{24})/i) || raw.match(/\/([a-f\d]{24})(?:\/|\?|$)/i);
  if (urlMatch && urlMatch[1]) {
    const user = await User.findById(urlMatch[1]);
    if (user) return user;
  }

  // 5. Check by registration number / email / phone
  let user = await User.findOne({
    $or: [
      { registrationNumber: raw },
      { 'memberInfo.registrationNo': raw },
      { receiptNo: raw },
      { email: raw.toLowerCase() },
      { phone: raw }
    ]
  });
  if (user) return user;

  return null;
}

/**
 * GET /api/qr-scans/public-scan/:identifier
 * Public scanning endpoint for phone cameras.
 * Counts the scan in database and redirects to https://www.kambi-connect.in/login
 */
exports.publicScan = async (req, res) => {
  const REDIRECT_URL = 'https://www.kambi-connect.in/login';
  try {
    const { identifier } = req.params;
    const targetUser = await resolveUserFromQr(identifier);

    if (targetUser) {
      let status = 'VALID';
      if (targetUser.accountStatus === 'SUSPENDED') {
        status = 'SUSPENDED';
      } else if (targetUser.accountStatus === 'INACTIVE' || targetUser.isDropped) {
        status = 'EXPIRED';
      }

      // Record scan log
      await QrScan.create({
        user: targetUser._id,
        scannedBy: targetUser._id,
        scanType: 'GENERAL',
        location: 'Mobile Camera QR Scan',
        notes: 'Scanned via direct QR code link',
        qrPayload: identifier,
        status,
        scannedAt: new Date()
      });

      // Increment user's scan count
      await User.findByIdAndUpdate(targetUser._id, {
        $inc: { qrScanCount: 1 },
        $set: { lastQrScannedAt: new Date() }
      });
    }

    return res.redirect(REDIRECT_URL);
  } catch (error) {
    console.error('Error in publicScan:', error);
    return res.redirect(REDIRECT_URL);
  }
};

/**
 * POST /api/qr-scans/scan
 * Record a QR code scan event and increment verification count
 */
exports.recordScan = async (req, res) => {
  try {
    const { qrCode, userId, scanType = 'GENERAL', location = 'Main Gate', notes = '' } = req.body;

    let targetUser = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      targetUser = await User.findById(userId);
    } else if (qrCode) {
      targetUser = await resolveUserFromQr(qrCode);
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'No registered member or student found matching this QR code.'
      });
    }

    // Determine verification status
    let status = 'VALID';
    if (targetUser.accountStatus === 'SUSPENDED') {
      status = 'SUSPENDED';
    } else if (targetUser.accountStatus === 'INACTIVE' || targetUser.isDropped) {
      status = 'EXPIRED';
    }

    // Record scan log
    const scan = await QrScan.create({
      user: targetUser._id,
      scannedBy: req.user._id,
      scanType,
      location: location || 'Main Gate',
      notes: notes || '',
      qrPayload: qrCode || `USER:${targetUser._id}`,
      status,
      scannedAt: new Date()
    });

    // Increment user scan count and update last scanned timestamp
    await User.findByIdAndUpdate(targetUser._id, {
      $inc: { qrScanCount: 1 },
      $set: { lastQrScannedAt: new Date() }
    });

    const updatedUser = await User.findById(targetUser._id)
      .select('name email phone role profilePhoto registrationNumber memberInfo education employment accountStatus isDropped qrScanCount lastQrScannedAt');

    const totalScans = await QrScan.countDocuments({ user: targetUser._id });

    return res.status(200).json({
      success: true,
      message: status === 'VALID'
        ? 'QR Code verified and scan recorded successfully!'
        : `Scan recorded with alert: Member account is ${status}`,
      scan,
      user: updatedUser,
      totalScans
    });
  } catch (error) {
    console.error('Error recording QR scan:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record QR scan',
      error: error.message
    });
  }
};

/**
 * GET /api/qr-scans/stats
 * Aggregate dashboard statistics for QR scans
 */
exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalScans,
      todayScans,
      weekScans,
      uniqueUsersList,
      scansByTypeRaw,
      recentScansRaw,
      topScannedUsers
    ] = await Promise.all([
      QrScan.countDocuments(),
      QrScan.countDocuments({ scannedAt: { $gte: startOfToday } }),
      QrScan.countDocuments({ scannedAt: { $gte: sevenDaysAgo } }),
      QrScan.distinct('user'),
      QrScan.aggregate([
        { $group: { _id: '$scanType', count: { $sum: 1 } } }
      ]),
      // Daily trend for the past 7 days
      QrScan.aggregate([
        { $match: { scannedAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$scannedAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      User.find({ qrScanCount: { $gt: 0 } })
        .sort({ qrScanCount: -1 })
        .limit(6)
        .select('name email phone role profilePhoto qrScanCount lastQrScannedAt registrationNumber')
    ]);

    // Role breakdown: join with User
    const scansByRoleRaw = await QrScan.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $group: {
          _id: '$userInfo.role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format trend data for recharts
    const trendMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      trendMap[dateStr] = { date: dateStr, day: dayName, count: 0 };
    }
    recentScansRaw.forEach(item => {
      if (trendMap[item._id]) {
        trendMap[item._id].count = item.count;
      }
    });
    const trend = Object.values(trendMap);

    return res.status(200).json({
      success: true,
      stats: {
        totalScans,
        todayScans,
        weekScans,
        uniqueUsers: uniqueUsersList.length,
        scansByType: scansByTypeRaw.map(s => ({ type: s._id || 'GENERAL', count: s.count })),
        scansByRole: scansByRoleRaw.map(r => ({ role: r._id || 'OTHER', count: r.count })),
        trend,
        topScannedUsers
      }
    });
  } catch (error) {
    console.error('Error fetching QR scan stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve QR scan statistics',
      error: error.message
    });
  }
};

/**
 * GET /api/qr-scans/logs
 * Retrieve paginated scan history logs with filtering
 */
exports.getLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const { search, scanType, role, status, startDate, endDate } = req.query;

    const filter = {};

    if (scanType && scanType !== 'ALL') {
      filter.scanType = scanType;
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.scannedAt = {};
      if (startDate) filter.scannedAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.scannedAt.$lte = end;
      }
    }

    // If searching or filtering by role, first find matching users
    let userFilter = null;
    if (search || (role && role !== 'ALL')) {
      const uQuery = {};
      if (role && role !== 'ALL') {
        uQuery.role = role;
      }
      if (search) {
        const sRegex = new RegExp(search.trim(), 'i');
        uQuery.$or = [
          { name: sRegex },
          { email: sRegex },
          { phone: sRegex },
          { registrationNumber: sRegex },
          { 'memberInfo.registrationNo': sRegex }
        ];
      }
      const matchedUsers = await User.find(uQuery).select('_id');
      const userIds = matchedUsers.map(u => u._id);
      filter.user = { $in: userIds };
    }

    const [logs, total] = await Promise.all([
      QrScan.find(filter)
        .sort({ scannedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email phone role profilePhoto registrationNumber memberInfo qrScanCount accountStatus isDropped')
        .populate('scannedBy', 'name role'),
      QrScan.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    console.error('Error fetching QR scan logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve scan logs',
      error: error.message
    });
  }
};

/**
 * DELETE /api/qr-scans/logs/:id
 * Delete a specific scan log entry
 */
exports.deleteLog = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await QrScan.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Scan record not found' });
    }
    return res.status(200).json({ success: true, message: 'Scan record deleted successfully' });
  } catch (error) {
    console.error('Error deleting scan record:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete record', error: error.message });
  }
};

/**
 * GET /api/qr-scans/search-members
 * Search users to generate QR or test manual scan
 */
exports.searchMembers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      const topUsers = await User.find({ isDropped: false })
        .limit(10)
        .select('name email phone role profilePhoto registrationNumber memberInfo qrScanCount');
      return res.status(200).json({ success: true, users: topUsers });
    }

    const regex = new RegExp(q, 'i');
    const users = await User.find({
      $or: [
        { name: regex },
        { email: regex },
        { phone: regex },
        { registrationNumber: regex },
        { 'memberInfo.registrationNo': regex }
      ]
    })
      .limit(15)
      .select('name email phone role profilePhoto registrationNumber memberInfo qrScanCount');

    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Error searching members for QR:', error);
    return res.status(500).json({ success: false, message: 'Search failed', error: error.message });
  }
};
