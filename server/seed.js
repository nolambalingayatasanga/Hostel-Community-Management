const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('./models/User');
const CustomField = require('./models/CustomField');
const StatusGroup = require('./models/StatusGroup');
const Status = require('./models/Status');
const Access = require('./models/Access');

const seedSystemDefaults = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel-community';
    console.log(`Connecting to database at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('Verifying system custom fields...');
    const defaultFields = [
      { name: 'Slot No.', slug: 'slNo', type: 'number', order: 0, isInternal: true },
      { name: 'Reg No.', slug: 'registrationNumber', type: 'text', order: 1, isInternal: true },
      { name: 'Receipt No', slug: 'receiptNo', type: 'text', order: 2, isInternal: true },
      { name: 'Kanada Overview', slug: 'localLanguageDetails', type: 'text', order: 3, isInternal: true },
      { name: 'Name', slug: 'name', type: 'text', order: 4, isInternal: true },
      { name: 'Email', slug: 'email', type: 'text', order: 5, isInternal: true },
      { name: 'Phone', slug: 'phone', type: 'text', order: 6, isInternal: true },
      { name: 'Role', slug: 'role', type: 'select', options: ['ADMIN', 'CHAIRPERSON', 'MEMBER', 'STAFF', 'STUDENT', 'ALUMNI'], order: 7, isInternal: true },
      { name: 'Status', slug: 'status', type: 'select', order: 8, isInternal: true },
      { name: 'Gender', slug: 'gender', type: 'select', options: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'], order: 9, isInternal: true },
      { name: 'Age', slug: 'age', type: 'number', order: 10, isInternal: true },
      { name: 'Joining Date', slug: 'joiningdate', type: 'date', order: 11, isInternal: true },
      { name: 'Relative Name', slug: 'relativeName', type: 'text', order: 12, isInternal: true },
      { name: 'Channels', slug: 'channels', type: 'text', order: 13, isInternal: true },
      { name: 'Street', slug: 'address.street', type: 'text', order: 14, isInternal: true },
      { name: 'Area', slug: 'address.area', type: 'text', order: 15, isInternal: true },
      { name: 'Landmark', slug: 'address.landmark', type: 'text', order: 16, isInternal: true },
      { name: 'Location', slug: 'address.location', type: 'text', order: 17, isInternal: true },
      { name: 'City', slug: 'address.city', type: 'text', order: 18, isInternal: true },
      { name: 'District', slug: 'address.district', type: 'text', order: 19, isInternal: true },
      { name: 'Taluk', slug: 'address.taluk', type: 'text', order: 20, isInternal: true },
      { name: 'Pincode', slug: 'address.pincode', type: 'text', order: 21, isInternal: true },
      { name: 'College', slug: 'education.college', type: 'text', order: 22, isInternal: true },
      { name: 'Course', slug: 'education.course', type: 'text', order: 23, isInternal: true },
      { name: 'Occupation', slug: 'employment.occupation', type: 'text', order: 24, isInternal: true },
      { name: 'Organization', slug: 'employment.organization', type: 'text', order: 25, isInternal: true },
      { name: 'Login Details', slug: 'loginDetails', type: 'text', order: 26, isInternal: true }
    ];

    for (const f of defaultFields) {
      const exists = await CustomField.findOne({ slug: f.slug });
      if (!exists) {
        await CustomField.create({ ...f, isVisible: true });
      }
    }

    console.log('Verifying status groups and pipeline stages...');
    const groups = [
      { name: 'Students', order: 0, statuses: ['Active Student', 'Suspended Student'] },
      { name: 'Alumni', order: 1, statuses: ['Graduated', 'Career Profiles'] },
      { name: 'Staff', order: 2, statuses: ['Active Staff'] },
      { name: 'Inquiry', order: 3, statuses: ['Applied', 'Contacted'] },
      { name: 'Chairperson', order: 4, statuses: ['Active Chairperson'] }
    ];

    for (const g of groups) {
      let group = await StatusGroup.findOne({ name: g.name });
      if (!group) {
        group = await StatusGroup.create({ name: g.name, order: g.order });
      }

      const statusIds = [];
      for (let i = 0; i < g.statuses.length; i++) {
        const sName = g.statuses[i];
        let status = await Status.findOne({ name: sName, statusGroup: group._id });
        if (!status) {
          status = await Status.create({ name: sName, statusGroup: group._id, order: i });
        }
        statusIds.push(status._id);
      }
      group.statuses = statusIds;
      await group.save();
    }

    // Seed default RBAC permissions
    console.log('Verifying default access control permissions...');
    await Access.seedDefaults();

    // Verify Primary Admin exists (do not recreate or overwrite if existing)
    const adminExists = await User.findOne({ role: 'ADMIN' });
    if (!adminExists) {
      console.log('No administrator found. Initializing primary admin...');
      await User.create({
        role: 'ADMIN',
        accountStatus: 'ACTIVE',
        name: 'madhan',
        email: 'madhanku635@gmail.com',
        phone: '9988776655',
        passwordHash: '123123',
        registrationNumber: 'REG-ADM-01',
        gender: 'MALE',
        joiningDate: new Date()
      });
      console.log('Primary administrator initialized.');
    } else {
      console.log(`Administrator account verified: ${adminExists.email}`);
    }

    console.log('\nSystem defaults verified successfully. Zero dummy data present.');
    process.exit(0);
  } catch (error) {
    console.error('Error during system defaults verification:', error);
    process.exit(1);
  }
};

seedSystemDefaults();
