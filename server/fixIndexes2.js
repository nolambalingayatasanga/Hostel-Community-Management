/**
 * fixIndexes2.js — Drops the memberInfo.registrationNo unique index
 * (it was numeric before, now string, and some rows have empty reg numbers)
 * Run once: node server/fixIndexes2.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel-community';
  console.log('Connecting...');
  await mongoose.connect(mongoUri);
  console.log('Connected!\n');

  const col = mongoose.connection.db.collection('users');
  const indexes = await col.indexes();

  console.log('Current indexes:');
  indexes.forEach(i => console.log(` - ${i.name}  unique:${!!i.unique}  sparse:${!!i.sparse}`));

  // Drop memberInfo.registrationNo_1 unique index (no longer needed as unique — some rows have empty reg nos)
  const regIdx = indexes.find(i => i.name === 'memberInfo.registrationNo_1');
  if (regIdx) {
    await col.dropIndex('memberInfo.registrationNo_1');
    console.log('\n✓ Dropped memberInfo.registrationNo_1');
  } else {
    console.log('\n→ memberInfo.registrationNo_1 not found, skipping');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(e => { console.error(e.message); process.exit(1); });
