const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel-community');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Auto-seed missing schema fields into CustomField collection
    try {
      const CustomField = require('../models/CustomField');

      // Migrate any legacy Age field to DOB date field
      await CustomField.updateMany(
        {
          $or: [
            { slug: { $regex: /^age$/i } },
            { name: { $regex: /^age$/i } }
          ]
        },
        {
          $set: {
            name: 'DOB',
            slug: 'dob',
            type: 'date',
            isInternal: true
          }
        }
      );

      const schemaFields = [
        { name: 'Slot No.', slug: 'slNo', type: 'number', isInternal: true },
        { name: 'Reg No.', slug: 'registrationNumber', type: 'text', isInternal: true },
        { name: 'Receipt No', slug: 'receiptNo', type: 'text', isInternal: true },
        { name: 'Kanada Overview', slug: 'localLanguageDetails', type: 'text', isInternal: true },
        { name: 'Adhaar', slug: 'adhaar', type: 'text', isInternal: true },
        { name: 'DOB', slug: 'dob', type: 'date', isInternal: true },
        { name: 'Role', slug: 'role', type: 'select', options: ['ADMIN', 'WARDEN', 'MEMBER', 'STAFF', 'STUDENT', 'ALUMNI'], isInternal: true },
        { name: 'Relative Name', slug: 'relativeName', type: 'text', isInternal: true },
        { name: 'Channels', slug: 'channels', type: 'text', isInternal: true },
        { name: 'Street', slug: 'address.street', type: 'text', isInternal: true },
        { name: 'Area', slug: 'address.area', type: 'text', isInternal: true },
        { name: 'Landmark', slug: 'address.landmark', type: 'text', isInternal: true },
        { name: 'Location', slug: 'address.location', type: 'text', isInternal: true },
        { name: 'City', slug: 'address.city', type: 'text', isInternal: true },
        { name: 'District', slug: 'address.district', type: 'text', isInternal: true },
        { name: 'Taluk', slug: 'address.taluk', type: 'text', isInternal: true },
        { name: 'Pincode', slug: 'address.pincode', type: 'text', isInternal: true },

        { name: 'College', slug: 'education.college', type: 'text', isInternal: true },
        { name: 'Course', slug: 'education.course', type: 'text', isInternal: true },
        { name: 'Edu Start Month', slug: 'education.startMonth', type: 'number', isInternal: true },
        { name: 'Edu Start Year', slug: 'education.startYear', type: 'number', isInternal: true },
        { name: 'Edu End Month', slug: 'education.endMonth', type: 'number', isInternal: true },
        { name: 'Edu End Year', slug: 'education.endYear', type: 'number', isInternal: true },
        { name: 'Occupation', slug: 'employment.occupation', type: 'text', isInternal: true },
        { name: 'Organization', slug: 'employment.organization', type: 'text', isInternal: true },
        { name: 'Industry', slug: 'employment.industry', type: 'text', isInternal: true },
        { name: 'Work Location', slug: 'employment.workLocation', type: 'text', isInternal: true },
        { name: 'Employment', slug: 'employment.employmentStatus', type: 'select', options: ['Student', 'Intern', 'Employed', 'Business Owner', 'Entrepreneur', 'Higher Studies', 'Government Service', 'Retired', 'Unemployed'], isInternal: true },
        { name: 'Business Name', slug: 'employment.businessName', type: 'text', isInternal: true },
        { name: 'Business Type', slug: 'employment.businessType', type: 'text', isInternal: true },
        { name: 'Login Details', slug: 'loginDetails', type: 'text', isInternal: true }
      ];

      // Update Employment CustomField options in DB
      await CustomField.updateMany(
        {
          $or: [
            { slug: { $regex: /^employment(\.employmentStatus)?$/i } },
            { name: { $regex: /^employment$/i } }
          ]
        },
        {
          $set: {
            options: ['Student', 'Intern', 'Employed', 'Business Owner', 'Entrepreneur', 'Higher Studies', 'Government Service', 'Retired', 'Unemployed']
          }
        }
      );

      // Automatically set all students in students tab to employmentStatus: 'Student'
      const User = require('../models/User');
      const studentUpdateRes = await User.updateMany(
        { role: 'STUDENT' },
        { $set: { 'employment.employmentStatus': 'Student' } }
      );
      if (studentUpdateRes.modifiedCount > 0) {
        console.log(`✓ Updated ${studentUpdateRes.modifiedCount} student(s) employmentStatus to 'Student'`);
      }


      let maxOrder = 7;
      const existingFields = await CustomField.find({});
      existingFields.forEach(f => {
        if (f.order > maxOrder) maxOrder = f.order;
      });

      for (const field of schemaFields) {
        const exists = existingFields.some(f => f.slug.toLowerCase() === field.slug.toLowerCase());
        if (!exists) {
          maxOrder += 1;
          await CustomField.create({
            ...field,
            order: maxOrder,
            isVisible: true
          });
          console.log(`Auto-seeded default schema field column: ${field.name}`);
        }
      }
    } catch (err) {
      console.error('Error auto-seeding schema fields into CustomFields:', err);
    }

    // Cleanup obsolete status CustomField and user status field
    try {
      const CustomField = require('../models/CustomField');
      const User = require('../models/User');
      await CustomField.deleteMany({
        $or: [
          { slug: { $regex: /^status$/i } },
          { name: { $regex: /^status$/i } }
        ]
      });
      await User.updateMany({}, { $unset: { status: 1 } });
    } catch (err) {
      console.error('Error cleaning up status fields:', err);
    }

    // Unset empty string emails to prevent sparse unique index collisions
    try {
      const User = require('../models/User');
      await User.updateMany({ email: '' }, { $unset: { email: 1 } });
    } catch (err) {
      console.error('Error cleaning up empty string emails:', err);
    }

  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
