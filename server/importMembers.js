/**
 * importMembers.js — FAST CLEAN RE-IMPORT
 *
 * Drops all existing MEMBER users, drops unwanted unique indexes,
 * updates CustomField definitions, and imports 100% of rows from excel.xlsx.
 *
 * Column mapping (0-indexed):
 *   col[0]: SL NO          → memberInfo.slNo (1, 2, 3...)
 *   col[1]: SL NO IN REG   → registrationNumber & memberInfo.registrationNo (e.g. 21273, 287(A), 7873 (ಎ))
 *   col[2]: EXPIRED        → memberInfo.isExpired
 *   col[3]: NAME AND ADDRESS (Kannada) → localLanguageDetails & memberInfo.rawNameAddressKannada
 *   col[4]: NAME AND ADDRESS (English) → parsed into name, relation, address, phone, aadhaar
 *   col[5]: TALUK          → address.taluk
 *   col[6]: DISTRICT       → address.district
 *   col[7]: RECEIPT NO     → receiptNo (top-level) & memberInfo.receiptNo
 *   col[8]: DATE           → memberInfo.registeredDate & joiningDate
 *
 * Usage: node server/importMembers.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('./models/User');
const CustomField = require('./models/CustomField');

// ─────────────────────────────────────────────
// Date parsing — handles Excel serial + string formats
// ─────────────────────────────────────────────
function parseDate(rawDate) {
  if (!rawDate) return null;

  // Excel serial date (number like 45926)
  if (typeof rawDate === 'number' && rawDate > 40000) {
    const utcDays = rawDate - 25569;
    return new Date(utcDays * 86400 * 1000);
  }

  const str = String(rawDate).trim();
  if (!str || str === '' || str === '0') return null;

  // Try to parse DD.MM.YY or DD.MM.YYYY
  const dotMatch = str.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})$/);
  if (dotMatch) {
    let [, d, m, y] = dotMatch;
    if (y.length === 2) y = parseInt(y) >= 50 ? '19' + y : '20' + y;
    const parsed = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00.000Z`);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // Try native Date parsing
  const native = new Date(str);
  if (!isNaN(native.getTime())) return native;

  // Year only (e.g. "91" → 1991)
  if (/^\d{2,4}$/.test(str)) {
    const yr = parseInt(str);
    if (yr >= 50 && yr <= 99) return new Date(`19${yr}-01-01T00:00:00.000Z`);
    if (yr >= 1900 && yr <= 2100) return new Date(`${yr}-01-01T00:00:00.000Z`);
  }

  return null;
}

// ─────────────────────────────────────────────
// Phone extraction
// ─────────────────────────────────────────────
function extractPhones(text) {
  if (!text) return { primary: null, additionalPhones: [] };
  const phoneRegex = /(?:ph[-\s]?|(?<!\d))(\+91|0)?([6-9]\d{9})(?!\d)/g;
  const found = [];
  let match;
  while ((match = phoneRegex.exec(text)) !== null) {
    const num = match[2];
    if (!found.includes(num)) found.push(num);
  }
  return { primary: found[0] || null, additionalPhones: found.slice(1) };
}

// ─────────────────────────────────────────────
// Aadhaar extraction (XXXX-XXXX-XXXX)
// ─────────────────────────────────────────────
function extractAadhaar(text) {
  if (!text) return '';
  const m = text.match(/\b(\d{4}[-\s]\d{4}[-\s]\d{4})\b/);
  return m ? m[1] : '';
}

// ─────────────────────────────────────────────
// Pincode extraction (6-digit)
// ─────────────────────────────────────────────
function extractPincode(text) {
  if (!text) return '';
  const m = text.match(/\b(5\d{5})\b/);
  return m ? m[1] : '';
}

// ─────────────────────────────────────────────
// Parse English Name + Address field
// ─────────────────────────────────────────────
function parseNameAndAddress(rawText) {
  if (!rawText) return { name: '', relationshipType: null, relatedPersonName: null, rawAddress: '', primary: null, additionalPhones: [], aadhaar: '', pincode: '' };

  const singleLine = rawText.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
  const { primary, additionalPhones } = extractPhones(singleLine);
  const aadhaar = extractAadhaar(singleLine);
  const pincode = extractPincode(singleLine);

  let cleaned = singleLine;
  if (primary) cleaned = cleaned.replace(new RegExp(`(\\+91|0)?${primary}`, 'g'), '');
  for (const p of additionalPhones) {
    cleaned = cleaned.replace(new RegExp(`(\\+91|0)?${p}`, 'g'), '');
  }
  if (aadhaar) cleaned = cleaned.replace(aadhaar, '');
  cleaned = cleaned.replace(/ph[:\s-]*/gi, '').replace(/\s*-\s*$/, '').trim();

  const relMatch = cleaned.match(/\b(w\/o|s\/o|d\/o|h\/o|f\/o|c\/o)\b\s+([^,.]+?)(?=\s+(?:no\.|c\.c\.|d\.no|door|flat|plot|site|near|opp|behind|street|road|cross|main|layout|nagar|colony|post|po|taluk|ta|dist|bangalore|bengaluru|pin|\d{1,4}[/\-]\d)|\s*$)/i);

  let relationshipType = null;
  let relatedPersonName = null;
  let name = '';
  let addressPart = '';

  if (relMatch) {
    relationshipType = relMatch[1].toLowerCase();
    relatedPersonName = relMatch[2].trim();
    const prefix = cleaned.substring(0, relMatch.index).trim();
    name = prefix;
    addressPart = cleaned.substring(relMatch.index + relMatch[0].length).trim();
  } else {
    const addressCutMatch = cleaned.match(/\b(?:no\.|c\.c\.\s*no|d\.no|door\s*no|flat\s*no|plot\s*no|site\s*no|house\s*no|\d{1,4}[/\-]\d{1,4}[/\-a-zA-Z]*)\b/i);
    if (addressCutMatch) {
      name = cleaned.substring(0, addressCutMatch.index).trim();
      addressPart = cleaned.substring(addressCutMatch.index).trim();
    } else {
      const words = cleaned.split(' ');
      if (words.length <= 4) {
        name = cleaned;
        addressPart = '';
      } else {
        name = words.slice(0, 3).join(' ');
        addressPart = words.slice(3).join(' ');
      }
    }
  }

  name = name.replace(/^[-,\s]+|[-,\s]+$/g, '').trim();
  addressPart = addressPart.replace(/^[-,\s]+|[-,\s]+$/g, '').trim();

  return {
    name: name || cleaned.substring(0, 40),
    relationshipType,
    relatedPersonName,
    rawAddress: addressPart || singleLine,
    primary,
    additionalPhones,
    aadhaar,
    pincode
  };
}

// ─────────────────────────────────────────────
// Ensure CustomFields in DB
// ─────────────────────────────────────────────
async function syncCustomFields() {
  console.log('Syncing CustomField definitions...');

  const desiredFields = [
    { name: 'SL NO', slug: 'slNo', type: 'number', order: 0, isInternal: true, isVisible: true },
    { name: 'Registration Number', slug: 'registrationNumber', type: 'text', order: 1, isInternal: true, isVisible: true },
    { name: 'Receipt No', slug: 'receiptNo', type: 'text', order: 2, isInternal: true, isVisible: true },
    { name: 'Local Language Details', slug: 'localLanguageDetails', type: 'text', order: 3, isInternal: true, isVisible: true },
    { name: 'Name', slug: 'name', type: 'text', order: 4, isInternal: true, isVisible: true },
    { name: 'Phone', slug: 'phone', type: 'text', order: 5, isInternal: true, isVisible: true },
    { name: 'Role', slug: 'role', type: 'select', options: ['ADMIN', 'CHAIRPERSON', 'MEMBER', 'STAFF', 'STUDENT', 'ALUMNI'], order: 6, isInternal: true, isVisible: true },
    { name: 'Status', slug: 'status', type: 'select', order: 7, isInternal: true, isVisible: true },
    { name: 'Gender', slug: 'gender', type: 'select', options: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'], order: 8, isInternal: true, isVisible: true },
    { name: 'Joining Date', slug: 'joiningdate', type: 'date', order: 9, isInternal: true, isVisible: true },
    { name: 'Adhaar', slug: 'adhaar', type: 'text', order: 10, isInternal: true, isVisible: true },
    { name: 'Street', slug: 'address.street', type: 'text', order: 11, isInternal: true, isVisible: true },
    { name: 'Taluk', slug: 'address.taluk', type: 'text', order: 12, isInternal: true, isVisible: true },
    { name: 'District', slug: 'address.district', type: 'text', order: 13, isInternal: true, isVisible: true },
    { name: 'Pincode', slug: 'address.pincode', type: 'text', order: 14, isInternal: true, isVisible: true },
    { name: 'Area', slug: 'address.area', type: 'text', order: 15, isInternal: true, isVisible: true },
    { name: 'Landmark', slug: 'address.landmark', type: 'text', order: 16, isInternal: true, isVisible: true },
    { name: 'Location', slug: 'address.location', type: 'text', order: 17, isInternal: true, isVisible: true },
    { name: 'City', slug: 'address.city', type: 'text', order: 18, isInternal: true, isVisible: true },
    { name: 'College', slug: 'education.college', type: 'text', order: 19, isInternal: true, isVisible: true },
    { name: 'Course', slug: 'education.course', type: 'text', order: 20, isInternal: true, isVisible: true },
    { name: 'Occupation', slug: 'employment.occupation', type: 'text', order: 21, isInternal: true, isVisible: true },
    { name: 'Organization', slug: 'employment.organization', type: 'text', order: 22, isInternal: true, isVisible: true }
  ];

  for (const field of desiredFields) {
    const existing = await CustomField.findOne({
      $or: [
        { slug: field.slug },
        { slug: field.slug.toLowerCase() },
        { name: field.name }
      ]
    });

    if (existing) {
      existing.name = field.name;
      existing.slug = field.slug;
      existing.type = field.type;
      existing.order = field.order;
      existing.isInternal = true;
      existing.isVisible = true;
      if (field.options) existing.options = field.options;
      await existing.save();
    } else {
      await CustomField.create(field);
    }
  }

  console.log('✓ CustomField definitions synced successfully.');
}

// ─────────────────────────────────────────────
// Main Import Function
// ─────────────────────────────────────────────
async function runImport() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected!');

  const usersCollection = mongoose.connection.collection('users');

  // Drop all unique indexes on memberInfo / registrationNo
  console.log('Dropping any unique indexes on memberInfo / registrationNo...');
  try {
    await usersCollection.dropIndex('memberInfo.registrationNo_1');
    console.log('✓ Dropped memberInfo.registrationNo_1 index');
  } catch (e) {
    // Index doesn't exist, ignore
  }

  try {
    await usersCollection.dropIndex('registrationNumber_1');
  } catch (e) {
    // Index doesn't exist, ignore
  }

  // Sync custom fields
  await syncCustomFields();

  // Drop existing MEMBER records
  console.log('\nDropping all existing MEMBER documents...');
  const delRes = await User.deleteMany({ role: 'MEMBER' });
  console.log(`✓ Deleted ${delRes.deletedCount} existing MEMBER records.`);

  const excelPath = path.join(__dirname, '../excel.xlsx');
  console.log(`\nReading: ${excelPath}`);
  const workbook = xlsx.readFile(excelPath);

  // Pre-generate password hashes for speed
  const defaultPasswordHash = bcrypt.hashSync('member@123', 10);
  const hashCache = new Map();

  const allDocumentsToInsert = [];
  let totalRowsRead = 0;

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Skip header row; include ALL rows where col[0] is present
    const dataRows = rows.slice(1).filter(row => {
      const slNo = String(row[0]).trim();
      return slNo !== '' && slNo !== '0';
    });

    console.log(`─── Sheet: ${sheetName} — ${dataRows.length} members ───`);

    for (const row of dataRows) {
      totalRowsRead++;

      const slNo           = String(row[0]).trim();                   // col[0]: SL NO (sequential: 1, 2, 3...)
      const regNoRaw       = String(row[1]).trim();                   // col[1]: SL NO IN REG (actual reg number: 21273, 287(A)...)
      const expiredRaw     = String(row[2]).trim().toLowerCase();     // col[2]: EXPIRED
      const kannadaText    = String(row[3]).trim();                   // col[3]: Kannada Name+Address → localLanguageDetails
      const englishText    = String(row[4]).trim();                   // col[4]: English Name+Address
      const taluk          = String(row[5]).trim();                   // col[5]: TALUK
      const district       = String(row[6]).trim();                   // col[6]: DISTRICT
      const receiptNoRaw   = String(row[7]).trim();                   // col[7]: RECEIPT NO
      const rawDate        = row[8];                                  // col[8]: DATE

      const parsed = parseNameAndAddress(englishText);
      const registeredDate = parseDate(rawDate);
      const isExpired = ['yes', 'y', 'expired', '1', 'true'].includes(expiredRaw);
      const phoneNumber = parsed.primary || null;

      // Fast password hashing (cost 4 for sub-second hashing)
      let passwordHash;
      if (phoneNumber) {
        if (!hashCache.has(phoneNumber)) {
          hashCache.set(phoneNumber, bcrypt.hashSync(phoneNumber, 4));
        }
        passwordHash = hashCache.get(phoneNumber);
      } else {
        passwordHash = defaultPasswordHash;
      }

      // Member document
      const doc = {
        role: 'MEMBER',
        accountStatus: 'ACTIVE',
        name: parsed.name || `Member-${regNoRaw || slNo}`,
        phone: phoneNumber,
        passwordHash,
        adhaar: parsed.aadhaar || '',
        registrationNumber: regNoRaw || '',
        receiptNo: receiptNoRaw || '',
        localLanguageDetails: kannadaText || '',
        address: {
          street: parsed.rawAddress || '',
          taluk: taluk || '',
          district: district || '',
          pincode: parsed.pincode || ''
        },
        relation: (parsed.relationshipType || parsed.relatedPersonName) ? {
          relationshipType: parsed.relationshipType || undefined,
          relatedPersonName: parsed.relatedPersonName || undefined
        } : undefined,
        memberInfo: {
          slNo: Number(slNo) || null,
          registrationNo: regNoRaw,
          receiptNo: receiptNoRaw || '',
          isExpired,
          sourceSheet: sheetName,
          rawNameAddress: englishText,
          rawNameAddressKannada: kannadaText,
          registeredDate,
          additionalPhones: parsed.additionalPhones || []
        },
        joiningDate: registeredDate || new Date(),
        lead_data: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      allDocumentsToInsert.push(doc);
    }
  }

  console.log(`\nInserting ${allDocumentsToInsert.length} member records into database...`);

  // Batch insert in chunks of 500
  const BATCH_SIZE = 500;
  let insertedCount = 0;

  for (let i = 0; i < allDocumentsToInsert.length; i += BATCH_SIZE) {
    const batch = allDocumentsToInsert.slice(i, i + BATCH_SIZE);
    await usersCollection.insertMany(batch, { ordered: false });
    insertedCount += batch.length;
    console.log(`  ✓ Inserted ${insertedCount} / ${allDocumentsToInsert.length} members...`);
  }

  console.log('\n══════════════════════════════════════════');
  console.log('         IMPORT 100% COMPLETE');
  console.log('══════════════════════════════════════════');
  console.log(`  Total rows read  : ${totalRowsRead}`);
  console.log(`  Total inserted   : ${insertedCount}`);
  console.log(`  Total failed     : 0`);
  console.log('══════════════════════════════════════════\n');

  // Verify sample
  const sample = await User.findOne({ role: 'MEMBER' }).lean();
  console.log('Sample member verified from DB:');
  console.log('  SL NO (seq)     :', sample.memberInfo?.slNo);
  console.log('  Reg Number      :', sample.registrationNumber);
  console.log('  Receipt No      :', sample.receiptNo);
  console.log('  Phone (login)   :', sample.phone);
  console.log('  Name            :', sample.name);
  console.log('  Kannada (first 80):', sample.localLanguageDetails?.substring(0, 80));
  console.log('  Taluk           :', sample.address?.taluk);
  console.log('  District        :', sample.address?.district);
  console.log('  Joining Date    :', sample.joiningDate);

  const totalInDb = await User.countDocuments({ role: 'MEMBER' });
  console.log(`\nTotal verified MEMBER count in MongoDB: ${totalInDb}`);

  await mongoose.disconnect();
  console.log('\nDisconnected from database.');
}

runImport().catch(err => {
  console.error('FATAL IMPORT ERROR:', err);
  process.exit(1);
});
