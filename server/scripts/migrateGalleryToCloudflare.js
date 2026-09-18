require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const { startMigrationQueue, getMigrationStatus } = require('../services/galleryMigrationService');
const { isR2Configured } = require('../config/cloudflareR2');

// Support loading from root .env or server .env
if (!process.env.MONGO_URI) {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') });
}

async function runCliMigration() {
  console.log('========================================================');
  console.log('   Gallery Media Cloudinary -> Cloudflare R2 Migration   ');
  console.log('========================================================\n');

  if (!isR2Configured()) {
    console.error('ERROR: Cloudflare R2 is not fully configured in your .env file.');
    console.error('Please make sure you have filled in:');
    console.error('  - CLOUDFLARE_R2_ACCOUNT_ID');
    console.error('  - CLOUDFLARE_R2_ACCESS_KEY_ID');
    console.error('  - CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    console.error('  - CLOUDFLARE_R2_BUCKET_NAME');
    console.error('  - CLOUDFLARE_R2_PUBLIC_URL (e.g. https://pub-xxx.r2.dev)\n');
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hostel-community';
  console.log(`Connecting to MongoDB...`);

  try {
    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB successfully.\n`);
  } catch (dbErr) {
    console.error(`Database connection failed:`, dbErr.message);
    process.exit(1);
  }

  try {
    console.log('Initializing queue...');
    await startMigrationQueue();

    // Poll until completed
    const checkInterval = setInterval(() => {
      const status = getMigrationStatus();
      if (!status.isRunning) {
        clearInterval(checkInterval);
        console.log('\n========================================================');
        console.log(`Migration Finished!`);
        console.log(`  Total:      ${status.total}`);
        console.log(`  Successful: ${status.successful}`);
        console.log(`  Failed:     ${status.failed}`);
        console.log('========================================================\n');
        mongoose.connection.close();
        process.exit(status.failed > 0 ? 1 : 0);
      }
    }, 1000);
  } catch (err) {
    console.error('Migration failed to start:', err.message);
    mongoose.connection.close();
    process.exit(1);
  }
}

runCliMigration();
