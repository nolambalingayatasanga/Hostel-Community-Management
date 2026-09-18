const axios = require('axios');
const GalleryPhoto = require('../models/GalleryPhoto');
const { isR2Configured, uploadToR2 } = require('../config/cloudflareR2');
const { deleteImage } = require('../config/cloudinary');

let migrationState = {
  isRunning: false,
  total: 0,
  processed: 0,
  successful: 0,
  failed: 0,
  currentItem: null,
  logs: [],
  startedAt: null,
  completedAt: null
};

const getMigrationStatus = () => {
  return { ...migrationState };
};

/**
 * Starts migrating gallery media from Cloudinary to Cloudflare R2 one by one in a queue.
 */
const startMigrationQueue = async (onProgressCallback = null) => {
  if (migrationState.isRunning) {
    throw new Error('Migration is already in progress.');
  }

  if (!isR2Configured()) {
    throw new Error('Cloudflare R2 credentials are missing in environment variables. Please set CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, and CLOUDFLARE_R2_BUCKET_NAME.');
  }

  // Find all photos currently on Cloudinary or missing storageProvider === 'cloudflare'
  const photosToMigrate = await GalleryPhoto.find({
    $or: [
      { storageProvider: { $ne: 'cloudflare' } },
      { storageProvider: { $exists: false } },
      { url: /cloudinary\.com/ }
    ]
  }).sort({ createdAt: 1 });

  migrationState = {
    isRunning: true,
    total: photosToMigrate.length,
    processed: 0,
    successful: 0,
    failed: 0,
    currentItem: null,
    logs: [],
    startedAt: new Date(),
    completedAt: null
  };

  const addLog = (message, type = 'info') => {
    const entry = { timestamp: new Date().toISOString(), message, type };
    migrationState.logs.push(entry);
    if (migrationState.logs.length > 500) {
      migrationState.logs.shift();
    }
    console.log(`[R2 Migration Queue] [${type.toUpperCase()}] ${message}`);
    if (typeof onProgressCallback === 'function') {
      try {
        onProgressCallback(entry, migrationState);
      } catch (e) {}
    }
  };

  addLog(`Starting migration queue for ${photosToMigrate.length} gallery item(s)...`);

  if (photosToMigrate.length === 0) {
    migrationState.isRunning = false;
    migrationState.completedAt = new Date();
    addLog('No gallery items require migration. All are already on Cloudflare R2.');
    return migrationState;
  }

  // Process items sequentially in queue
  (async () => {
    try {
      for (let i = 0; i < photosToMigrate.length; i++) {
        const photo = photosToMigrate[i];
        const itemNumber = i + 1;
        migrationState.currentItem = {
          id: photo._id,
          url: photo.url,
          index: itemNumber,
          total: photosToMigrate.length
        };

        addLog(`[Item ${itemNumber}/${photosToMigrate.length}] Processing Photo ID ${photo._id} (${photo.resourceType || 'image'})...`);

        try {
          // 1. Download media stream/buffer from Cloudinary
          const downloadRes = await axios.get(photo.url, {
            responseType: 'arraybuffer',
            timeout: 120000 // 2 minutes timeout for large videos
          });

          const buffer = Buffer.from(downloadRes.data);
          const contentType = downloadRes.headers['content-type'] || (photo.resourceType === 'video' ? 'video/mp4' : 'image/jpeg');

          // Extract file extension
          let ext = photo.resourceType === 'video' ? '.mp4' : '.jpg';
          if (contentType.includes('png')) ext = '.png';
          else if (contentType.includes('webp')) ext = '.webp';
          else if (contentType.includes('webm')) ext = '.webm';
          else if (contentType.includes('mov')) ext = '.mov';
          else if (contentType.includes('quicktime')) ext = '.mov';

          const key = `gallery/migrated_${photo._id}_${Date.now()}${ext}`;

          // 2. Upload to Cloudflare R2
          addLog(`[Item ${itemNumber}/${photosToMigrate.length}] Uploading ${(buffer.length / (1024 * 1024)).toFixed(2)} MB to Cloudflare R2 key: ${key}...`);
          const r2Res = await uploadToR2(buffer, key, contentType);

          const originalPublicId = photo.publicId;

          // 3. Update Database Record
          photo.url = r2Res.url;
          photo.publicId = r2Res.key;
          photo.storageProvider = 'cloudflare';
          await photo.save();

          addLog(`[Item ${itemNumber}/${photosToMigrate.length}] Updated MongoDB record with Cloudflare URL: ${r2Res.url}`);

          // 4. Delete from Cloudinary one by one
          if (originalPublicId) {
            try {
              await deleteImage(originalPublicId, photo.resourceType || 'image');
              addLog(`[Item ${itemNumber}/${photosToMigrate.length}] Successfully deleted original asset from Cloudinary: ${originalPublicId}`, 'success');
            } catch (cldDeleteErr) {
              addLog(`[Item ${itemNumber}/${photosToMigrate.length}] Warning: Failed to delete Cloudinary asset "${originalPublicId}": ${cldDeleteErr.message}`, 'warn');
            }
          }

          migrationState.successful++;
        } catch (itemErr) {
          migrationState.failed++;
          addLog(`[Item ${itemNumber}/${photosToMigrate.length}] Error migrating photo ${photo._id}: ${itemErr.message}`, 'error');
        }

        migrationState.processed++;
      }

      migrationState.completedAt = new Date();
      addLog(`Migration queue complete! ${migrationState.successful} successful, ${migrationState.failed} failed out of ${migrationState.total} total.`, 'success');
    } catch (queueErr) {
      addLog(`Fatal queue execution error: ${queueErr.message}`, 'error');
    } finally {
      migrationState.isRunning = false;
      migrationState.currentItem = null;
    }
  })();

  return migrationState;
};

module.exports = {
  startMigrationQueue,
  getMigrationStatus
};
