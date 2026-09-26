const mongoose = require('mongoose');

const AccessSchema = new mongoose.Schema({
  page: {
    type: String,
    required: true,
    enum: ['overview', 'users', 'events', 'gallery', 'drive_links', 'request_upload', 'job_openings', 'feedback', 'profile', 'qr_scan_count', 'access_control', 'projects', 'facilities', 'enquiry', 'organizations']
  },
  role: {
    type: String,
    required: true,
    enum: ['ADMIN', 'ADMINISTRATOR', 'WARDEN', 'STAFF', 'ALUMNI', 'STUDENT', 'MEMBER']
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
  const pages = ['overview', 'users', 'events', 'gallery', 'drive_links', 'request_upload', 'job_openings', 'feedback', 'profile', 'qr_scan_count', 'access_control', 'projects', 'facilities', 'enquiry', 'organizations'];
  const roles = ['ADMIN', 'ADMINISTRATOR', 'WARDEN', 'STAFF', 'ALUMNI', 'STUDENT', 'MEMBER'];

  const count = await this.countDocuments();
  if (count > 0) {
    // Ensure ADMINISTRATOR has full access seeded for all pages
    const adminDocCount = await this.countDocuments({ role: 'ADMINISTRATOR' });
    if (adminDocCount === 0) {
      const adminEntries = pages.map(page => ({
        page,
        role: 'ADMINISTRATOR',
        permissions: {
          fullAccess: true,
          view: true,
          create: true,
          update: true,
          delete: true,
          noAccess: false
        }
      }));
      await this.insertMany(adminEntries);
    }

    // Ensure projects permissions exist
    const projectsCount = await this.countDocuments({ page: 'projects' });
    if (projectsCount === 0) {
      const projectEntries = roles.map(role => ({
        page: 'projects',
        role,
        permissions: (role === 'ADMIN' || role === 'ADMINISTRATOR' || role === 'WARDEN') ? {
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
          update: true,
          delete: true,
          noAccess: false
        }
      }));
      await this.insertMany(projectEntries);
    }

    // Ensure facilities permissions exist
    const facilitiesCount = await this.countDocuments({ page: 'facilities' });
    if (facilitiesCount === 0) {
      const facilityEntries = roles.map(role => ({
        page: 'facilities',
        role,
        permissions: (role === 'ADMIN' || role === 'ADMINISTRATOR' || role === 'WARDEN') ? {
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
      await this.insertMany(facilityEntries);
    }

    // Ensure enquiry permissions exist
    const enquiryCount = await this.countDocuments({ page: 'enquiry' });
    if (enquiryCount === 0) {
      const enquiryEntries = roles.map(role => ({
        page: 'enquiry',
        role,
        permissions: (role === 'ADMIN' || role === 'ADMINISTRATOR' || role === 'WARDEN') ? {
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
      await this.insertMany(enquiryEntries);
    }

    // Ensure organizations permissions exist
    const organizationsCount = await this.countDocuments({ page: 'organizations' });
    if (organizationsCount === 0) {
      const orgEntries = roles.map(role => ({
        page: 'organizations',
        role,
        permissions: (role === 'ADMIN' || role === 'ADMINISTRATOR') ? {
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
      await this.insertMany(orgEntries);
    }

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

    // Ensure feedback permissions exist
    const feedbackCount = await this.countDocuments({ page: 'feedback' });
    if (feedbackCount === 0) {
      const feedbackEntries = roles.map(role => ({
        page: 'feedback',
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
          update: true,
          delete: false,
          noAccess: false
        }
      }));
      await this.insertMany(feedbackEntries);
    }

    // Ensure job_openings permissions exist
    const jobCount = await this.countDocuments({ page: 'job_openings' });
    if (jobCount === 0) {
      const jobEntries = roles.map(role => ({
        page: 'job_openings',
        role,
        permissions: (role === 'ADMIN' || role === 'WARDEN') ? {
          fullAccess: true,
          view: true,
          create: true,
          update: true,
          delete: true,
          noAccess: false
        } : (role === 'STUDENT' || role === 'STAFF') ? {
          fullAccess: false,
          view: true,
          create: false,
          update: false,
          delete: false,
          noAccess: false
        } : {
          fullAccess: false,
          view: true,
          create: true,
          update: true,
          delete: true,
          noAccess: false
        }
      }));
      await this.insertMany(jobEntries);
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
          permissions: (role === 'ADMIN' || role === 'ADMINISTRATOR') ? {
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

      const isAdminOrWarden = role === 'ADMIN' || role === 'ADMINISTRATOR' || role === 'WARDEN';

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
