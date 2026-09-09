/**
 * fixIndexes.js — Fixes MongoDB indexes for member import.
 * - email_1: keeps as sparse+unique (each email must be unique, nulls allowed)
 * - phone_1: drops unique constraint, recreates as sparse non-unique
 *            (members can share phones, many have no phone)
 * Run once: node server/fixIndexes.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixIndexes() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel-community';
  console.log('Connecting to DB...');
  await mongoose.connect(mongoUri);
  console.log('Connected!\n');

  const db = mongoose.connection.db;
  const collection = db.collection('users');

  let indexes = await collection.indexes();
  console.log('Current indexes:');
  indexes.forEach(idx => {
    console.log(` - ${idx.name}  sparse:${!!idx.sparse}  unique:${!!idx.unique}`);
  });

  // ── Drop phone_1 if it's unique (members share phones) ──
  const phoneIdx = indexes.find(i => i.name === 'phone_1');
  if (phoneIdx && phoneIdx.unique) {
    await collection.dropIndex('phone_1');
    console.log('\n✓ Dropped unique phone_1 index');
  }

  // Recreate phone index as sparse, NON-unique
  const existingPhoneLookup = indexes.find(i => i.name === 'phone_lookup');
  if (!existingPhoneLookup) {
    await collection.createIndex({ phone: 1 }, { sparse: true, background: true, name: 'phone_lookup' });
    console.log('✓ Created phone_lookup (sparse, non-unique) for fast login queries');
  } else {
    console.log('→ phone_lookup already exists');
  }

  // ── Verify email_1 is sparse (already handled in prior run) ──
  indexes = await collection.indexes(); // refresh
  const emailIdx = indexes.find(i => i.name === 'email_1');
  if (emailIdx && !emailIdx.sparse) {
    await collection.dropIndex('email_1');
    await collection.createIndex({ email: 1 }, { unique: true, sparse: true, background: true });
    console.log('✓ Recreated email_1 as sparse+unique');
  } else {
    console.log('→ email_1 is already sparse+unique, OK');
  }

  console.log('\nFinal indexes:');
  const finalIndexes = await collection.indexes();
  finalIndexes.forEach(i => {
    console.log(` - ${i.name}  sparse:${!!i.sparse}  unique:${!!i.unique}`);
  });

  await mongoose.disconnect();
  console.log('\nDone! Now run: node server/importMembers.js');
}

fixIndexes().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
