const mongoose = require('mongoose');

const AccessSchema = new mongoose.Schema({
  page: {
    type: String,
    required: true,
    enum: ['overview', 'users', 'events', 'gallery', 'drive_links', 'request_upload', 'profile', 'qr_scan_count', 'access_control']
  },
  role: {
    type: String,
    required: true,
    enum: ['ADMIN', 'WARDEN', 'STAFF', 'ALUMNI', 'STUDENT', 'MEMBER']
  },
  permissions: {
    fullAccess: { type: Boolean, default: false },
    view: { type: Boolean, default: false },
    create: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    noAccess: { type: Boolean, default: false }
  },
  tabPermissions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

AccessSchema.index({ page: 1, role: 1 }, { unique: true });

// Standard default permissions seeder
AccessSchema.statics.seedDefaults = async function() {
  const pages = ['overview', 'users', 'events', 'gallery', 'drive_links', 'request_upload', 'profile', 'qr_scan_count', 'access_control'];
  const roles = ['ADMIN', 'WARDEN', 'STAFF', 'ALUMNI', 'STUDENT', 'MEMBER'];

  const count = await this.countDocuments();
  if (count > 0) {
    // Ensure qr_scan_count permissions exist if table was already seeded
    const qrCount = await this.countDocuments({ page: 'qr_scan_count' });
    if (qrCount === 0) {
      const qrEntries = roles.map(role => ({
        page: 'qr_scan_count',
        role,
        permissions: role === 'ADMIN' ? {
          fullAccess: true,
          view: true,
          create: true,
          update: true,
          delete: true,
          noAccess: false
        } : {
          fullAccess: false,
          view: false,
          create: false,
          update: false,
          delete: false,
          noAccess: true
        }
      }));
      await this.insertMany(qrEntries);
    }

    // Ensure drive_links permissions exist if table was already seeded
    const driveCount = await this.countDocuments({ page: 'drive_links' });
    if (driveCount === 0) {
      const driveEntries = roles.map(role => ({
        page: 'drive_links',
        role,
        permissions: (role === 'ADMIN' || role === 'WARDEN') ? {
          fullAccess: true,
          view: true,
          create: true,
          update: true,
          delete: true,
          noAccess: false
        } : {
          fullAccess: false,
          view: true,
          create: false,
          update: false,
          delete: false,
          noAccess: false
        }
      }));
      await this.insertMany(driveEntries);
    }

    // Ensure request_upload permissions exist
    const reqCount = await this.countDocuments({ page: 'request_upload' });
    if (reqCount === 0) {
      const reqEntries = roles.map(role => ({
        page: 'request_upload',
        role,
        permissions: (role === 'ADMIN' || role === 'WARDEN') ? {
          fullAccess: true,
          view: true,
          create: true,
          update: true,
          delete: true,
          noAccess: false
        } : {
          fullAccess: false,
          view: true,
          create: true,
          update: false,
          delete: false,
          noAccess: false
        }
      }));
      await this.insertMany(reqEntries);
    }

    return; // Already initialized
  }

  const defaultEntries = [];

  for (const page of pages) {
    for (const role of roles) {
      if (page === 'qr_scan_count') {
        // QR Scan Count is STRICTLY ADMIN only
        defaultEntries.push({
          page,
          role,
          permissions: role === 'ADMIN' ? {
            fullAccess: true,
            view: true,
            create: true,
            update: true,
            delete: true,
            noAccess: false
          } : {
            fullAccess: false,
            view: false,
            create: false,
            update: false,
            delete: false,
            noAccess: true
          }
        });
        continue;
      }

      const isAdminOrWarden = role === 'ADMIN' || role === 'WARDEN';

      if (isAdminOrWarden) {
        // Admin & Warden have Full Access on all pages
        defaultEntries.push({
          page,
          role,
          permissions: {
            fullAccess: true,
            view: true,
            create: true,
            update: true,
            delete: true,
            noAccess: false
          }
        });
      } else {
        // Other roles: STAFF, ALUMNI, STUDENT, MEMBER
        if (page === 'overview' || page === 'access_control') {
          // No access to overview and access_control
          defaultEntries.push({
            page,
            role,
            permissions: {
              fullAccess: false,
              view: false,
              create: false,
              update: false,
              delete: false,
              noAccess: true
            }
          });
        } else if (page === 'profile') {
          // Can view and update profile
          defaultEntries.push({
            page,
            role,
            permissions: {
              fullAccess: false,
              view: true,
              create: false,
              update: true,
              delete: false,
              noAccess: false
            }
          });
        } else if (page === 'request_upload') {
          // Request Upload: Users can view and submit upload requests (create)
          defaultEntries.push({
            page,
            role,
            permissions: {
              fullAccess: false,
              view: true,
              create: true,
              update: false,
              delete: false,
              noAccess: false
            }
          });
        } else {
          // Users, Events, Gallery, Drive Links: View access only for normal users
          defaultEntries.push({
            page,
            role,
            permissions: {
              fullAccess: false,
              view: true,
              create: false,
              update: false,
              delete: false,
              noAccess: false
            }
          });
        }
      }
    }
  }

  await this.insertMany(defaultEntries);
  console.log(`[Access Control] Seeded ${defaultEntries.length} default access records.`);
};

module.exports = mongoose.model('Access', AccessSchema);
