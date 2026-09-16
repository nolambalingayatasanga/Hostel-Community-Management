const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const connectDB = require('./config/db');
const StatusGroup = require('./models/StatusGroup');
const Status = require('./models/Status');
const User = require('./models/User');
const Access = require('./models/Access');

async function runMigration() {
  await connectDB();
  console.log('--- Starting Migration ---');

  // 1. Rename StatusGroup Chairperson -> Warden
  const chairpersonGroup = await StatusGroup.findOne({
    name: { $regex: /^chairperson$/i }
  });

  let wardenGroup;
  if (chairpersonGroup) {
    chairpersonGroup.name = 'Warden';
    await chairpersonGroup.save();
    wardenGroup = chairpersonGroup;
    console.log(`[StatusGroup] Renamed Chairperson -> Warden (${chairpersonGroup._id})`);
  } else {
    wardenGroup = await StatusGroup.findOne({ name: { $regex: /^warden$/i } });
  }

  // 2. Rename Status "Active Chairperson" -> "Active Warden"
  const chairpersonStatus = await Status.findOne({
    name: { $regex: /^active chairperson$/i }
  });
  if (chairpersonStatus) {
    chairpersonStatus.name = 'Active Warden';
    if (wardenGroup) {
      chairpersonStatus.statusGroup = wardenGroup._id;
    }
    await chairpersonStatus.save();
    console.log(`[Status] Renamed Active Chairperson -> Active Warden (${chairpersonStatus._id})`);
  }

  // 3. Create or find Admin StatusGroup
  let adminGroup = await StatusGroup.findOne({
    name: { $regex: /^admin$/i }
  });

  if (!adminGroup) {
    const allGroups = await StatusGroup.find({}).sort({ order: -1 });
    const maxOrder = allGroups.length > 0 ? (allGroups[0].order || 0) : 0;
    
    // Create new StatusGroup for Admin
    adminGroup = await StatusGroup.create({
      name: 'Admin',
      order: maxOrder + 1,
      statuses: []
    });
    console.log(`[StatusGroup] Created new Admin group (${adminGroup._id})`);
  }

  // 4. Create or find Active Admin status stage
  let adminStatus = await Status.findOne({
    statusGroup: adminGroup._id,
    name: { $regex: /^active admin$/i }
  });

  if (!adminStatus) {
    adminStatus = await Status.create({
      name: 'Active Admin',
      description: 'Active Administrator account',
      statusGroup: adminGroup._id,
      order: 0
    });
    console.log(`[Status] Created Active Admin status (${adminStatus._id})`);
  }

  // Ensure Admin StatusGroup includes this status
  if (!adminGroup.statuses || !adminGroup.statuses.some(s => String(s) === String(adminStatus._id))) {
    adminGroup.statuses = [adminStatus._id];
    await adminGroup.save();
    console.log(`[StatusGroup] Linked Active Admin status to Admin group`);
  }

  // 5. Migrate users with role 'CHAIRPERSON' to 'WARDEN'
  const chairpersonUsersResult = await User.updateMany(
    { role: 'CHAIRPERSON' },
    { $set: { role: 'WARDEN' } }
  );
  console.log(`[User] Migrated ${chairpersonUsersResult.modifiedCount} users from CHAIRPERSON to WARDEN`);

  // 6. Update occupation 'Main Chairperson' -> 'Main Warden'
  const occResult = await User.updateMany(
    { 'employment.occupation': 'Main Chairperson' },
    { $set: { 'employment.occupation': 'Main Warden' } }
  );
  console.log(`[User] Updated ${occResult.modifiedCount} users employment.occupation to 'Main Warden'`);

  // 7. Update ADMIN users' status from Staff status to Admin status
  const adminUsers = await User.find({ role: 'ADMIN' });
  for (const admin of adminUsers) {
    admin.status = adminStatus._id;
    await admin.save();
    console.log(`[User] Updated Admin user (${admin.email || admin.name}) status to Active Admin (${adminStatus._id})`);
  }

  // 8. Update any Access records that still have role 'CHAIRPERSON'
  const accessResult = await Access.updateMany(
    { role: 'CHAIRPERSON' },
    { $set: { role: 'WARDEN' } }
  );
  console.log(`[Access] Migrated ${accessResult.modifiedCount} access records from CHAIRPERSON to WARDEN`);

  console.log('--- Migration Completed Successfully ---');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
