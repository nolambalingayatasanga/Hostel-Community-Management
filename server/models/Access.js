const mongoose = require('mongoose');

const AccessSchema = new mongoose.Schema({
  page: {
    type: String,
    required: true,
    enum: ['overview', 'users', 'events', 'gallery', 'profile', 'qr_scan_count', 'access_control']
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
  const pages = ['overview', 'users', 'events', 'gallery', 'profile', 'qr_scan_count', 'access_control'];
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

    // Migrate legacy default gallery permissions for non-admin roles so they get create & delete
    await this.updateMany(
      {
        page: 'gallery',
        role: { $nin: ['ADMIN', 'WARDEN'] },
        'permissions.create': false,
        'permissions.delete': false,
        'permissions.view': true,
        'permissions.noAccess': false,
        'permissions.fullAccess': false
      },
      {
        $set: {
          'permissions.create': true,
          'permissions.delete': true
        }
      }
    );
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
        } else if (page === 'gallery') {
          // Gallery: Users can view, upload media (create), and delete their own media (delete)
          defaultEntries.push({
            page,
            role,
            permissions: {
              fullAccess: false,
              view: true,
              create: true,
              update: false,
              delete: true,
              noAccess: false
            }
          });
        } else {
          // Users, Events: View access
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
