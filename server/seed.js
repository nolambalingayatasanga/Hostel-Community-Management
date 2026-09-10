const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('./models/User');
const Event = require('./models/Event');
const CustomField = require('./models/CustomField');
const StatusGroup = require('./models/StatusGroup');
const Status = require('./models/Status');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel-community';
    console.log(`Connecting to database at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Event.deleteMany({});
    await CustomField.deleteMany({});
    await StatusGroup.deleteMany({});
    await Status.deleteMany({});

    console.log('Seeding custom fields...');
    const fields = [
      { name: 'Name', slug: 'name', type: 'text', order: 0, isInternal: true },
      { name: 'Email', slug: 'email', type: 'text', order: 1, isInternal: true },
      { name: 'Phone', slug: 'phone', type: 'text', order: 2, isInternal: true },
      { name: 'Role', slug: 'role', type: 'select', options: ['ADMIN', 'CHAIRPERSON', 'MEMBER', 'STAFF', 'STUDENT', 'ALUMNI'], order: 3, isInternal: true },
      { name: 'Status', slug: 'status', type: 'select', order: 4, isInternal: true },
      { name: 'Gender', slug: 'gender', type: 'select', options: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'], order: 5, isInternal: true },
      { name: 'Age', slug: 'age', type: 'number', order: 6, isInternal: true },
      { name: 'Joining Date', slug: 'joiningdate', type: 'date', order: 7, isInternal: true },
    ];
    await CustomField.insertMany(fields);

    console.log('Seeding status groups and pipeline stages...');
    const groupStudents = await StatusGroup.create({ name: 'Students', order: 0 });
    const statusActiveStudent = await Status.create({ name: 'Active Student', statusGroup: groupStudents._id, order: 0 });
    const statusSuspendedStudent = await Status.create({ name: 'Suspended Student', statusGroup: groupStudents._id, order: 1 });
    groupStudents.statuses = [statusActiveStudent._id, statusSuspendedStudent._id];
    await groupStudents.save();

    const groupAlumni = await StatusGroup.create({ name: 'Alumni', order: 1 });
    const statusGraduated = await Status.create({ name: 'Graduated', statusGroup: groupAlumni._id, order: 0 });
    const statusCareer = await Status.create({ name: 'Career Profiles', statusGroup: groupAlumni._id, order: 1 });
    groupAlumni.statuses = [statusGraduated._id, statusCareer._id];
    await groupAlumni.save();

    const groupStaff = await StatusGroup.create({ name: 'Staff', order: 2 });
    const statusActiveStaff = await Status.create({ name: 'Active Staff', statusGroup: groupStaff._id, order: 0 });
    groupStaff.statuses = [statusActiveStaff._id];
    await groupStaff.save();

    const groupInquiry = await StatusGroup.create({ name: 'Inquiry', order: 3 });
    const statusApplied = await Status.create({ name: 'Applied', statusGroup: groupInquiry._id, order: 0 });
    const statusContacted = await Status.create({ name: 'Contacted', statusGroup: groupInquiry._id, order: 1 });
    groupInquiry.statuses = [statusApplied._id, statusContacted._id];
    await groupInquiry.save();

    const groupChairperson = await StatusGroup.create({ name: 'Chairperson', order: 4 });
    const statusActiveChairperson = await Status.create({ name: 'Active Chairperson', statusGroup: groupChairperson._id, order: 0 });
    groupChairperson.statuses = [statusActiveChairperson._id];
    await groupChairperson.save();

    console.log('Seeding users...');

    // 1. ADMIN
    const adminUser = await User.create({
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      status: statusActiveStaff._id,
      name: 'madhan',
      email: 'madhaku635@gmail',
      phone: '9988776655',
      passwordHash: '123123', // will be hashed by mongoose pre-save hook
      registrationNumber: 'REG-ADM-01',
      localLanguageDetails: 'मेरा नाम मधन है और मैं छात्रावास समिति का मुख्य अध्यक्ष हूँ। मेरा कार्यालय बेंगलुरु में स्थित है।',
      gender: 'MALE',
      joiningDate: new Date('2020-01-01'),
      adhaar: '1111 2222 3333',
      address: {
        street: 'Hostel Main Road',
        area: 'Campus East',
        landmark: 'Near Library',
        location: 'Admin Block',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        taluk: 'Bengaluru North',
        pincode: '560001'
      },
      employment: {
        occupation: 'Main Chairperson',
        organization: 'Hostel Trust Committee',
        employmentStatus: 'Employed'
      }
    });

    // 2. CHAIRPERSONS
    const chairperson1 = await User.create({
      role: 'CHAIRPERSON',
      accountStatus: 'ACTIVE',
      status: statusActiveChairperson._id,
      name: 'Dr. Ramesh Kumar',
      email: 'ramesh.chairperson@hostelcomm.org',
      phone: '8877665544',
      passwordHash: 'ChairpersonPassword123!',
      registrationNumber: 'REG-CH-01',
      localLanguageDetails: 'ನನ್ನ ಹೆಸರು ಡಾ. ರಮೇಶ್ ಕುಮಾರ್ ಮತ್ತು ನಾನು ಪ್ರಾಧ್ಯಾಪಕ ಹಾಗೂ ಮುಖ್ಯಸ್ಥನಾಗಿ ಸೇವೆ ಸಲ್ಲಿಸುತ್ತಿದ್ದೇನೆ. ನನ್ನ ವಿಳಾಸ ಕೋರಮಂಗಲ ಬೆಂಗಳೂರು.',
      gender: 'MALE',
      joiningDate: new Date('2021-06-15'),
      adhaar: '2222 3333 4444',
      address: {
        street: '80 Feet Road',
        area: 'Koramangala',
        landmark: 'Opposite Playground',
        location: 'Prestige Apartments',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        taluk: 'Koramangala',
        pincode: '560034'
      },
      employment: {
        occupation: 'Professor & Dean',
        organization: 'State Technical University',
        employmentStatus: 'Employed'
      }
    });

    const chairperson2 = await User.create({
      role: 'CHAIRPERSON',
      accountStatus: 'ACTIVE',
      status: statusActiveChairperson._id,
      name: 'Suhasini Rao',
      email: 'suhasini.chairperson@hostelcomm.org',
      phone: '8765432109',
      passwordHash: 'ChairpersonPassword123!',
      registrationNumber: 'REG-CH-02',
      localLanguageDetails: 'ನನ್ನ ಹೆಸರು ಸುಹಾಸಿನಿ ರಾವ್ ಮತ್ತು ನಾನು ಸಮಾಜ ಸೇವಕಿಯಾಗಿದ್ದೇನೆ. ನನ್ನ ವಾಸಸ್ಥಳ ಬೆಂಗಳೂರಿನ ಜಯನಗರದಲ್ಲಿದೆ.',
      gender: 'FEMALE',
      joiningDate: new Date('2022-02-10'),
      adhaar: '3333 4444 5555',
      address: {
        street: '3rd Cross',
        area: 'Jayanagar',
        landmark: 'Near Metro Station',
        location: 'Jayanagar 4th Block',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        taluk: 'Jayanagar',
        pincode: '560041'
      },
      employment: {
        occupation: 'Social Worker',
        organization: 'Namma Bengaluru Foundation',
        employmentStatus: 'Self-Employed'
      }
    });

    // 3. STAFF
    const staff1 = await User.create({
      role: 'STAFF',
      accountStatus: 'ACTIVE',
      status: statusActiveStaff._id,
      name: 'Anthony Dsouza',
      email: 'anthony.staff@hostelcomm.org',
      phone: '7766554433',
      passwordHash: 'StaffPassword123!',
      registrationNumber: 'REG-ST-01',
      localLanguageDetails: 'मेरा नाम एंथनी डिसूजा है और मैं छात्रावास का वार्डन हूँ। मेरा मुख्य काम छात्रों की देखभाल करना है।',
      gender: 'MALE',
      joiningDate: new Date('2023-01-10'),
      adhaar: '4444 5555 6666',
      address: {
        street: 'Campus Main Road',
        area: 'Campus East',
        landmark: 'Near Dining Hall',
        location: 'Staff Quarters Block A',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        taluk: 'Bengaluru North',
        pincode: '560001'
      },
      employment: {
        occupation: 'Hostel Warden',
        organization: 'Hostel Trust Committee',
        employmentStatus: 'Employed'
      }
    });

    // 4. MEMBERS
    const member1 = await User.create({
      role: 'MEMBER',
      accountStatus: 'ACTIVE',
      status: statusActiveStaff._id,
      name: 'Rajesh Hegde',
      email: 'rajesh.member@hostelcomm.org',
      phone: '7654321098',
      passwordHash: 'MemberPassword123!',
      registrationNumber: 'REG-MB-01',
      localLanguageDetails: 'मेरा नाम राजेश हेगड़े है और मैं सॉफ्टवेयर मैनेजर हूँ। मेरा स्थायी निवास बेलंदूर बेंगलुरु में स्थित है।',
      gender: 'MALE',
      joiningDate: new Date('2023-07-01'),
      adhaar: '5555 6666 7777',
      address: {
        street: 'Green Glen Layout',
        area: 'Bellandur',
        landmark: 'Near Sobha Apts',
        location: 'Bellandur Lake Road',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        taluk: 'Varthur',
        pincode: '560103'
      },
      employment: {
        occupation: 'Software Manager (Parent Representative)',
        organization: 'TechCorp Services',
        employmentStatus: 'Employed'
      }
    });

    // 5. STUDENTS
    const student1 = await User.create({
      role: 'STUDENT',
      accountStatus: 'ACTIVE',
      status: statusActiveStudent._id,
      name: 'Amit Sharma',
      email: 'amit.student@hostelcomm.org',
      phone: '9876543210',
      passwordHash: 'StudentPassword123!',
      localLanguageDetails: 'मेरा नाम अमित शर्मा है और मैं आरवी इंजीनियरिंग कॉलेज में कंप्यूटर साइंस की पढ़ाई कर रहा हूँ।',
      gender: 'MALE',
      joiningDate: new Date('2024-08-01'),
      adhaar: '6666 7777 8888',
      address: {
        street: 'Girinagar',
        area: 'Sector 4',
        landmark: 'Near Water Tank',
        location: 'Girinagar Layout',
        city: 'Shimoga',
        district: 'Shimoga',
        taluk: 'Shimoga',
        pincode: '577201'
      },
      education: {
        college: 'RV College of Engineering',
        course: 'B.E. Computer Science',
        startMonth: 8,
        startYear: 2024,
        endMonth: 5,
        endYear: 2028 // Future expected graduation
      }
    });

    const student2 = await User.create({
      role: 'STUDENT',
      accountStatus: 'ACTIVE',
      status: statusActiveStudent._id,
      name: 'Priyanka Sen',
      email: 'priyanka.student@hostelcomm.org',
      phone: '9876543211',
      passwordHash: 'StudentPassword123!',
      localLanguageDetails: 'ನನ್ನ ಹೆಸರು ಪ್ರಿಯಾಂಕಾ ಸೇನ್ ಮತ್ತು ನಾನು ಬಿಎಂಎಸ್ ಕಾಲೇಜಿನಲ್ಲಿ ಮಾಹಿತಿ ತಂತ್ರಜ್ಞಾನ ವಿದ್ಯಾರ್ಥಿನಿಯಾಗಿದ್ದೇನೆ. ನಾನು ಕೊಲ್ಕತ್ತಾದಿಂದ ಬಂದವಳು.',
      gender: 'FEMALE',
      joiningDate: new Date('2023-08-01'),
      adhaar: '7777 8888 9999',
      address: {
        street: 'Lake View Road',
        area: 'Salt Lake',
        landmark: 'Near City Center',
        location: 'Apartment 2B',
        city: 'Kolkata',
        district: 'Kolkata',
        taluk: 'Salt Lake',
        pincode: '700029'
      },
      education: {
        college: 'BMS College of Engineering',
        course: 'B.Tech Information Technology',
        startMonth: 8,
        startYear: 2023,
        endMonth: 6,
        endYear: 2027 // Future expected graduation
      }
    });

    // 6. ALUMNI
    const alumni1 = await User.create({
      role: 'ALUMNI',
      accountStatus: 'ACTIVE',
      status: statusGraduated._id,
      name: 'Nikhil Gowda',
      email: 'nikhil.alumni@hostelcomm.org',
      phone: '9876543212',
      passwordHash: 'AlumniPassword123!',
      registrationNumber: 'REG-AL-01',
      localLanguageDetails: 'ನನ್ನ ಹೆಸರು ನಿಖಿಲ್ ಗೌಡ ಮತ್ತು ನಾನು ಗೂಗಲ್ ಇಂಡಿಯಾದಲ್ಲಿ ಹಿರಿಯ ಸಾಫ್ಟ್‌ವೇರ್ ಎಂಜಿನಿಯರ್ ಆಗಿ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೇನೆ.',
      gender: 'MALE',
      joiningDate: new Date('2018-08-01'),
      adhaar: '8888 9999 0000',
      address: {
        street: 'Green Layout',
        area: 'Gokulam',
        landmark: 'Near Temple',
        location: 'Villa 5',
        city: 'Mysuru',
        district: 'Mysuru',
        taluk: 'Mysuru',
        pincode: '570002'
      },
      education: {
        college: 'RV College of Engineering',
        course: 'B.E. Computer Science',
        startMonth: 8,
        startYear: 2018,
        endMonth: 6,
        endYear: 2022 // Past graduation
      },
      employment: {
        occupation: 'Senior Software Engineer',
        organization: 'Google India',
        industry: 'Technology',
        workLocation: 'Bengaluru',
        employmentStatus: 'Employed'
      }
    });

    const alumni2 = await User.create({
      role: 'ALUMNI',
      accountStatus: 'ACTIVE',
      status: statusGraduated._id,
      name: 'Divya Nair',
      email: 'divya.alumni@hostelcomm.org',
      phone: '9876543213',
      passwordHash: 'AlumniPassword123!',
      registrationNumber: 'REG-AL-02',
      localLanguageDetails: 'ನನ್ನ ಹೆಸರು ದಿವ್ಯಾ ನಾಯರ್ ಮತ್ತು ನಾನು ಕೊಚ್ಚಿಯಲ್ಲಿ ಫಿನ್‌ಟೆಕ್ ಲ್ಯಾಬ್ಸ್ ಸ್ಟಾರ್ಟ್‌ಅಪ್‌ನ ಸಹ-ಸ್ಥಾಪಕಿ ಮತ್ತು ಸಿಟಿಒ ಆಗಿದ್ದೇನೆ.',
      gender: 'FEMALE',
      joiningDate: new Date('2019-08-01'),
      adhaar: '9999 0000 1111',
      address: {
        street: 'MG Road',
        area: 'Kochi Center',
        landmark: 'Near Metro Pillar 12',
        location: 'Rose Villa',
        city: 'Kochi',
        district: 'Ernakulam',
        taluk: 'Kochi',
        pincode: '682001'
      },
      education: {
        college: 'PES University',
        course: 'B.E. Electronics & Communication',
        startMonth: 8,
        startYear: 2019,
        endMonth: 6,
        endYear: 2023 // Past graduation
      },
      employment: {
        occupation: 'Co-Founder & CTO',
        organization: 'FinTech Labs startup',
        industry: 'Finance / Technology',
        workLocation: 'HSR Layout, Bengaluru',
        employmentStatus: 'Entrepreneur',
        businessName: 'FinTech Labs',
        businessType: 'Partnership Startup'
      }
    });

    console.log('Seeding community events...');

    // Events
    const eventDate1 = new Date();
    eventDate1.setDate(eventDate1.getDate() + 10); // 10 days in future (Upcoming)

    const eventDate2 = new Date();
    eventDate2.setDate(eventDate2.getDate() + 20); // 20 days in future (Upcoming)

    const eventDate3 = new Date();
    eventDate3.setDate(eventDate3.getDate() - 15); // 15 days in past (Past)

    const event1 = await Event.create({
      title: 'Hostel Annual Day Celebration 2026',
      description: 'Join us for our main hostel annual day, filled with cultural events, food stalls, student performances, and an address by the chairperson.',
      eventDate: eventDate1,
      startTime: '16:00',
      endTime: '21:00',
      location: 'Hostel Main Ground, Campus East',
      locationUrl: 'https://www.google.com/maps/search/?api=1&query=Hostel+Main+Ground+Campus+East',
      color: '#7c3aed',
      coverImage: {
        url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
        publicId: 'mock_cover_annual_day'
      },
      createdBy: adminUser._id
    });

    const event2 = await Event.create({
      title: 'Grand Alumni Meet & Networking Session',
      description: 'A special gathering of our hostel alumni. RV, PES, and BMS graduates will connect, share industry experiences, and mentor current students.',
      eventDate: eventDate2,
      startTime: '10:00',
      endTime: '15:00',
      location: 'Seminar Auditorium, Block C',
      locationUrl: 'https://www.google.com/maps/search/?api=1&query=Seminar+Auditorium+Block+C',
      color: '#0088ff',
      coverImage: {
        url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
        publicId: 'mock_cover_alumni_meet'
      },
      createdBy: adminUser._id
    });

    const event3 = await Event.create({
      title: 'Community Sports Meet - Football & Cricket Cup',
      description: 'The inter-hostel community sports tournament. Students vs Alumni friendly matches, followed by tea and snacks.',
      eventDate: eventDate3,
      startTime: '08:00',
      endTime: '14:00',
      location: 'College Sports Pavilion',
      locationUrl: 'https://www.google.com/maps/search/?api=1&query=College+Sports+Pavilion',
      color: '#ea580c',
      coverImage: {
        url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
        publicId: 'mock_cover_sports'
      },
      createdBy: chairperson1._id
    });

    console.log('\nDatabase seeded successfully!');
    console.log('--------------------------------------------------');
    console.log('Admin Login Details:');
    console.log('  Email: madhaku635@gmail  OR  Phone: 9988776655');
    console.log('  Password: 123123\n');
    console.log('Student Login Details:');
    console.log('  Email: amit.student@hostelcomm.org  OR  Phone: 9876543210');
    console.log('  Password: StudentPassword123!\n');
    console.log('Alumni Login Details:');
    console.log('  Email: nikhil.alumni@hostelcomm.org  OR  Phone: 9876543212');
    console.log('  Password: AlumniPassword123!');
    console.log('--------------------------------------------------\n');

    await mongoose.disconnect();
    console.log('Disconnected from database.');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
