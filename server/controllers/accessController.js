const Access = require('../models/Access');
const StatusGroup = require('../models/StatusGroup');

const ALL_PAGES = [
  { id: 'overview', text: 'Overview', path: '/dashboard', icon: 'DashboardIcon' },
  { id: 'profile', text: 'Profile', path: '/profile', icon: 'ProfileIcon' },
  { id: 'users', text: 'Users', path: '/users', icon: 'PeopleIcon' },
  { id: 'events', text: 'Events', path: '/events', icon: 'EventIcon' },
  { id: 'gallery', text: 'Gallery', icon: 'GalleryIcon', path: '/gallery' },
  { id: 'drive_links', text: 'Drive Links', path: '/drive-links', icon: 'CloudQueueIcon' },
  { id: 'projects', text: 'Projects', path: '/projects', icon: 'CodeIcon' },
  { id: 'request_upload', text: 'Share Media', path: '/request-upload', icon: 'CloudUploadIcon' },
  { id: 'job_openings', text: 'Job Openings', path: '/job-openings', icon: 'WorkIcon' },
  { id: 'facilities', text: 'Facilities', path: '/facilities', icon: 'ApartmentIcon' },
  { id: 'enquiry', text: 'Enquiry', path: '/enquiry', icon: 'QuestionAnswerIcon' },
  { id: 'organizations', text: 'Organizations', path: '/organizations', icon: 'DomainIcon' },
  { id: 'feedback', text: 'Feedback', path: '/feedback', icon: 'FeedbackIcon' },
  { id: 'qr_scan_count', text: 'QR Scan Count', path: '/qr-scan-count', icon: 'QrCodeIcon' },
  { id: 'access_control', text: 'Access Control', path: '/access-control', icon: 'AdminIcon' }
];

const ROLES_ORDER = ['ADMINISTRATOR', 'ADMIN', 'WARDEN', 'STAFF', 'ALUMNI', 'STUDENT', 'MEMBER'];

/**
 * GET /api/access/user-tabs
 * Returns all dynamic tabs in the Users page from DB (excluding any Inquiry status group tab)
 */
exports.getUserTabs = async (req, res) => {
  try {
    // Delete any legacy Inquiry/Enquiry status group so it does not show as a tab in Users
    await StatusGroup.deleteMany({ name: { $in: [/^inquiry$/i, /^enquiry$/i] } }).catch(() => {});

    const groups = await StatusGroup.find({
      name: { $nin: [/^inquiry$/i, /^enquiry$/i] }
    }).sort({ order: 1 });

    const tabs = [
      { id: 'all', name: 'Members', isSystem: true },
      ...groups
        .filter(g => g.name.toLowerCase() !== 'inquiry' && g.name.toLowerCase() !== 'enquiry')
        .map(g => ({ id: String(g._id), name: g.name, slug: g.name.toLowerCase(), isGroup: true })),
      { id: 'dropped', name: 'Dropped', isSystem: true },
      { id: 'enquiry', name: 'Enquiry', isSystem: true, slug: 'enquiry' }
    ];
    return res.status(200).json({ success: true, data: tabs });
  } catch (error) {
    console.error('Error fetching user tabs:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/access/user-tabs/my-access
 * Returns the permitted tab IDs for the current user's role in the Users page
 */
exports.getMyUserTabsAccess = async (req, res) => {
  try {
    const userRole = req.user?.role;
    const groups = await StatusGroup.find({
      name: { $nin: [/^inquiry$/i, /^enquiry$/i] }
    }).sort({ order: 1 });

    const allTabs = [
      { id: 'all', name: 'Members' },
      ...groups
        .filter(g => g.name.toLowerCase() !== 'inquiry' && g.name.toLowerCase() !== 'enquiry')
        .map(g => ({ id: String(g._id), name: g.name, slug: g.name.toLowerCase() })),
      { id: 'dropped', name: 'Dropped' },
      { id: 'enquiry', name: 'Enquiry', slug: 'enquiry' }
    ];

    if (userRole === 'ADMINISTRATOR' || userRole === 'ADMIN' || userRole === 'CHAIRPERSON' || userRole === 'WARDEN') {
      return res.status(200).json({
        success: true,
        data: allTabs.map(t => t.id)
      });
    }

    // Check Access record for role
    const accessRec = await Access.findOne({ page: 'users', role: userRole });
    const tabPerms = accessRec?.tabPermissions || {};

    const permittedIds = allTabs.filter(tab => {
      // If explicitly defined in tabPermissions, follow it
      if (tabPerms[tab.id] !== undefined) {
        return !!tabPerms[tab.id];
      }
      if (tab.slug && tabPerms[tab.slug] !== undefined) {
        return !!tabPerms[tab.slug];
      }
      // Defaults for non-admins if not yet configured
      const nameLower = tab.name.toLowerCase();
      if (nameLower === 'admin' || nameLower === 'warden' || nameLower === 'chairperson' || tab.id === 'dropped' || tab.id === 'all' || tab.id === 'enquiry') {
        return false;
      }
      if (nameLower === 'staff') {
        return userRole === 'STAFF';
      }
      return nameLower === 'students' || nameLower === 'alumni';
    }).map(t => t.id);

    return res.status(200).json({
      success: true,
      data: permittedIds
    });
  } catch (error) {
    console.error('Error fetching my user tabs access:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/access/my-permissions
 * Returns active permissions map for the current user's role across all pages
 */
exports.getMyPermissions = async (req, res) => {
  try {
    const userRole = req.user?.role;
    if (!userRole) {
      return res.status(401).json({ success: false, message: 'User role not identified' });
    }

    await Access.seedDefaults();

    if (userRole === 'ADMIN' || userRole === 'ADMINISTRATOR') {
      const fullPerms = {};
      ALL_PAGES.forEach(p => {
        fullPerms[p.id] = {
          fullAccess: true,
          view: true,
          create: true,
          update: true,
          delete: true,
          noAccess: false
        };
      });
      return res.status(200).json({ success: true, data: fullPerms });
    }

    if (userRole === 'WARDEN' || userRole === 'CHAIRPERSON') {
      const fullPerms = {};
      ALL_PAGES.forEach(p => {
        if (p.id === 'qr_scan_count') {
          fullPerms[p.id] = {
            fullAccess: false,
            view: false,
            create: false,
            update: false,
            delete: false,
            noAccess: true
          };
        } else {
          fullPerms[p.id] = {
            fullAccess: true,
            view: true,
            create: true,
            update: true,
            delete: true,
            noAccess: false
          };
        }
      });
      return res.status(200).json({ success: true, data: fullPerms });
    }

    const roleToQuery = (userRole === 'CHAIRPERSON') ? ['CHAIRPERSON', 'WARDEN'] : [userRole];
    const records = await Access.find({ role: { $in: roleToQuery } });

    const permsMap = {};
    ALL_PAGES.forEach(p => {
      let def = { fullAccess: false, view: false, create: false, update: false, delete: false, noAccess: true };
      if (p.id === 'gallery') {
        def = { fullAccess: false, view: true, create: true, update: false, delete: true, noAccess: false };
      } else if (p.id === 'profile') {
        def = { fullAccess: false, view: true, create: false, update: true, delete: false, noAccess: false };
      } else if (p.id === 'events' || p.id === 'users' || p.id === 'drive_links' || p.id === 'facilities' || p.id === 'enquiry' || p.id === 'feedback') {
        def = { fullAccess: false, view: true, create: false, update: false, delete: false, noAccess: false };
      } else if (p.id === 'request_upload' || p.id === 'projects') {
        def = { fullAccess: false, view: true, create: true, update: false, delete: false, noAccess: false };
      }
      permsMap[p.id] = def;
    });

    records.forEach(rec => {
      if (permsMap[rec.page]) {
        const base = rec.permissions && rec.permissions.toObject ? rec.permissions.toObject() : { ...rec.permissions };
        permsMap[rec.page] = base;
      }
    });

    return res.status(200).json({ success: true, data: permsMap });
  } catch (error) {
    console.error('Error fetching my permissions:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/access/navigation
 * Returns the permitted sidebar navigation items for the current logged-in user's role,
 * or the public pages for guests. The master ordering is strictly maintained for all users.
 */
exports.getNavigation = async (req, res) => {
  try {
    const userRole = req.user?.role;

    // For unauthenticated guests, return standard community sidebar tabs in master sequence (excluding admin tabs: overview, qr_scan_count, access_control)
    if (!userRole) {
      const guestTabs = ALL_PAGES.filter(p => !['overview', 'qr_scan_count', 'access_control'].includes(p.id));
      return res.status(200).json({
        success: true,
        data: guestTabs
      });
    }

    // Ensure default permissions exist
    await Access.seedDefaults();

    // ADMINISTRATOR and ADMIN have access to all pages in the exact master sequence
    if (userRole === 'ADMINISTRATOR' || userRole === 'ADMIN') {
      return res.status(200).json({
        success: true,
        data: ALL_PAGES
      });
    }

    // Map role alias if needed (CHAIRPERSON <-> WARDEN)
    const roleToQuery = (userRole === 'CHAIRPERSON') ? ['CHAIRPERSON', 'WARDEN'] : [userRole];

    const accessRecords = await Access.find({ role: { $in: roleToQuery } });

    // Build permissions map by page
    const pagePermMap = {};
    accessRecords.forEach(rec => {
      if (!pagePermMap[rec.page] || rec.role === userRole) {
        pagePermMap[rec.page] = rec.permissions;
      }
    });

    // Filter pages based on role permissions, preserving the exact ALL_PAGES master sequence
    const accessibleTabs = ALL_PAGES.filter(pageItem => {
      // Public pages are always accessible to all users
      if (['facilities', 'enquiry', 'feedback'].includes(pageItem.id)) {
        return true;
      }

      // QR Scan Count is strictly ADMIN & ADMINISTRATOR only
      if (pageItem.id === 'qr_scan_count') {
        return false;
      }

      const perms = pagePermMap[pageItem.id];
      if (!perms) {
        if (userRole === 'CHAIRPERSON' || userRole === 'WARDEN') {
          return true;
        }
        return pageItem.id !== 'overview' && pageItem.id !== 'access_control' && pageItem.id !== 'qr_scan_count';
      }

      if (perms.noAccess) {
        return false;
      }

      return perms.fullAccess || perms.view;
    });

    return res.status(200).json({
      success: true,
      data: accessibleTabs
    });
  } catch (error) {
    console.error('Error fetching navigation access:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve navigation permissions',
      error: error.message
    });
  }
};

/**
 * GET /api/access/matrix
 * Returns the complete matrix of permissions across all pages and roles
 */
exports.getAccessMatrix = async (req, res) => {
  try {
    await Access.seedDefaults();

    const records = await Access.find();

    // Build map: { [page]: { [role]: permissions } }
    const matrix = {};
    ALL_PAGES.forEach(p => {
      matrix[p.id] = {};
      ROLES_ORDER.forEach(r => {
        matrix[p.id][r] = {
          fullAccess: false,
          view: false,
          create: false,
          update: false,
          delete: false,
          noAccess: true,
          tabPermissions: {}
        };
      });
    });

    records.forEach(rec => {
      if (matrix[rec.page]) {
        let displayRole = rec.role;
        if (displayRole === 'CHAIRPERSON' && !matrix[rec.page]['CHAIRPERSON']) {
          displayRole = 'WARDEN';
        }
        if (matrix[rec.page][displayRole]) {
          const basePerms = rec.permissions && rec.permissions.toObject ? rec.permissions.toObject() : { ...rec.permissions };
          matrix[rec.page][displayRole] = {
            ...basePerms,
            tabPermissions: rec.tabPermissions || {}
          };
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        pages: ALL_PAGES,
        roles: ROLES_ORDER,
        matrix,
        raw: records
      }
    });
  } catch (error) {
    console.error('Error fetching access matrix:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve access matrix',
      error: error.message
    });
  }
};

/**
 * PUT /api/access/matrix
 * Updates permissions for a specific (page, role) or multiple entries using atomic bulkWrite
 */
exports.updateAccessPermission = async (req, res) => {
  try {
    const { updates, page, role, permissions, tabPermissions } = req.body;

    const toProcess = [];

    if (Array.isArray(updates) && updates.length > 0) {
      toProcess.push(...updates);
    } else if (page && role && permissions) {
      toProcess.push({ page, role, permissions, tabPermissions });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload. Provide page, role, and permissions or an updates array.'
      });
    }

    const bulkOps = [];
    for (const item of toProcess) {
      const targetRole = (item.role === 'CHAIRPERSON') ? 'WARDEN' : item.role;
      const setObj = {};
      if (item.permissions) {
        setObj.permissions = item.permissions;
      }
      if (item.tabPermissions !== undefined) {
        setObj.tabPermissions = item.tabPermissions;
      }

      bulkOps.push({
        updateOne: {
          filter: { page: item.page, role: targetRole },
          update: { $set: setObj },
          upsert: true
        }
      });
    }

    if (bulkOps.length > 0) {
      await Access.bulkWrite(bulkOps);
    }

    return res.status(200).json({
      success: true,
      message: 'Permissions updated successfully'
    });
  } catch (error) {
    console.error('Error updating access permissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update access permissions',
      error: error.message
    });
  }
};

/**
 * POST /api/access/reset
 * Resets permissions back to default schema values
 */
exports.resetDefaults = async (req, res) => {
  try {
    await Access.deleteMany({});
    await Access.seedDefaults();

    return res.status(200).json({
      success: true,
      message: 'Access permissions reset to defaults successfully'
    });
  } catch (error) {
    console.error('Error resetting access permissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset access permissions',
      error: error.message
    });
  }
};
