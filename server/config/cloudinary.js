const cloudinary = require('cloudinary').v2;

const isConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary media storage configured successfully.');
} else {
  console.warn('WARNING: Cloudinary credentials not configured. Using fallback local/placeholder media uploads.');
}

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Uploads a file buffer or path to Cloudinary using chunked upload for videos/large files,
 * or returns a placeholder if Cloudinary is not configured.
 * @param {string|Buffer} fileSource - File buffer or temp path
 * @param {string} folder - Folder in Cloudinary (e.g., 'hostel-community/events')
 * @param {string} mimetype - MIME type of the file
 * @param {string} resourceType - 'auto', 'image', or 'video'
 * @returns {Promise<{ url: string, publicId: string, resourceType: string }>}
 */
const uploadImage = async (fileSource, folder, mimetype = 'image/jpeg', resourceType = 'auto') => {
  let resolvedMimetype = mimetype || 'image/jpeg';
  let resolvedResourceType = resourceType;

  // Resolve auto resource_type based on mimetype prefix or extension
  if (resolvedResourceType === 'auto' && resolvedMimetype) {
    if (resolvedMimetype.startsWith('video/')) {
      resolvedResourceType = 'video';
    } else if (resolvedMimetype.startsWith('image/')) {
      resolvedResourceType = 'image';
    }
  }

  // If the resource type is explicitly image, but the mimetype is generic/raw, default to image/jpeg
  if (resolvedResourceType === 'image' && (!resolvedMimetype || resolvedMimetype === 'application/octet-stream')) {
    resolvedMimetype = 'image/jpeg';
  }

  if (!isConfigured) {
    throw new Error('Cloudinary is not configured. Please ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set in environment variables.');
  }

  // Determine file extension for temp file
  let ext = resolvedResourceType === 'video' ? '.mp4' : '.jpg';
  if (resolvedMimetype.includes('png')) ext = '.png';
  else if (resolvedMimetype.includes('webp')) ext = '.webp';
  else if (resolvedMimetype.includes('webm')) ext = '.webm';
  else if (resolvedMimetype.includes('mov') || resolvedMimetype.includes('quicktime')) ext = '.mov';

  const tempFilePath = path.join(
    os.tmpdir(),
    `cld_upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`
  );

  try {
    let uploadPath = tempFilePath;
    if (Buffer.isBuffer(fileSource)) {
      await fs.promises.writeFile(tempFilePath, fileSource);
    } else if (typeof fileSource === 'string' && fs.existsSync(fileSource)) {
      uploadPath = fileSource;
    } else {
      throw new Error('Invalid fileSource: must be a Buffer or an existing file path.');
    }

    const isVideo = resolvedResourceType === 'video';
    const fileSize = Buffer.isBuffer(fileSource)
      ? fileSource.length
      : (fs.existsSync(uploadPath) ? fs.statSync(uploadPath).size : 0);

    const uploadOptions = {
      folder: folder,
      resource_type: resolvedResourceType
    };

    let result;
    // For videos or files larger than 5MB, utilize Cloudinary chunked upload via upload_large
    // Note: files over 100 MB must be uploaded using chunked uploads; chunk_size: 6000000 (6MB)
    if (isVideo || fileSize > 5 * 1024 * 1024) {
      uploadOptions.chunk_size = 6000000;
      result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_large(uploadPath, uploadOptions, (error, res) => {
          if (error) {
            console.error('Cloudinary chunked upload error:', error);
            reject(error);
          } else {
            resolve(res);
          }
        });
      });
    } else {
      result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(uploadPath, uploadOptions, (error, res) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(res);
          }
        });
      });
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type || resolvedResourceType
    };
  } finally {
    // Always clean up temp file if created
    try {
      if (fs.existsSync(tempFilePath)) {
        await fs.promises.unlink(tempFilePath);
      }
    } catch (cleanupErr) {
      console.warn('Failed to clean up temp upload file:', cleanupErr.message);
    }
  }
};

/**
 * Extract publicId and resourceType from a Cloudinary URL or publicId string
 * @param {string} urlOrId
 * @param {string} defaultType
 * @returns {{ publicId: string, resourceType: string } | null}
 */
const extractPublicIdAndType = (urlOrId, defaultType = 'image') => {
  if (!urlOrId || typeof urlOrId !== 'string') return null;

  // If it's already a clean publicId (not a full URL)
  if (!urlOrId.startsWith('http://') && !urlOrId.startsWith('https://')) {
    return { publicId: urlOrId, resourceType: defaultType };
  }

  // If it's not a cloudinary URL (e.g. Unsplash or external link), ignore
  if (!urlOrId.includes('cloudinary.com')) {
    return null;
  }

  try {
    const urlObj = new URL(urlOrId);
    const pathname = urlObj.pathname; // e.g. /demo/image/upload/v1312461204/sample.jpg or /cloudname/video/upload/hostel-community/gallery/xyz.mp4
    const parts = pathname.split('/');
    
    // Find index of 'upload' in path
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;

    // Detect resource type if present before 'upload'
    let resourceType = defaultType;
    if (uploadIndex > 0 && ['image', 'video', 'raw'].includes(parts[uploadIndex - 1])) {
      resourceType = parts[uploadIndex - 1];
    }

    // Path segments after 'upload'
    let postUpload = parts.slice(uploadIndex + 1);

    // If first segment after upload is version (e.g. 'v12345678'), skip it
    if (postUpload.length > 0 && /^v\d+$/.test(postUpload[0])) {
      postUpload = postUpload.slice(1);
    }

    if (postUpload.length === 0) return null;

    // Reconstruct full public ID path and remove file extension at the end
    let publicIdWithExt = postUpload.join('/');
    const lastDotIndex = publicIdWithExt.lastIndexOf('.');
    const publicId = lastDotIndex !== -1 ? publicIdWithExt.substring(0, lastDotIndex) : publicIdWithExt;

    return { publicId, resourceType };
  } catch (e) {
    return null;
  }
};

/**
 * Deletes an image or video from Cloudinary
 * @param {string} publicId - Cloudinary public ID or full URL
 * @param {string} resourceType - Cloudinary resource type ('image' or 'video' or 'auto')
 * @returns {Promise<any>}
 */
const deleteImage = async (publicIdOrUrl, resourceType = 'image') => {
  if (!publicIdOrUrl) return { result: 'noop' };

  const parsed = extractPublicIdAndType(publicIdOrUrl, resourceType);
  if (!parsed || !parsed.publicId) return { result: 'noop' };

  const targetId = parsed.publicId;
  const targetType = parsed.resourceType || resourceType || 'image';

  if (!isConfigured) {
    return { result: 'not_configured' };
  }

  try {
    const res = await cloudinary.uploader.destroy(targetId, { resource_type: targetType });
    console.log(`[Cloudinary Delete] Deleted ${targetId} (${targetType}):`, res);
    return res;
  } catch (error) {
    console.warn(`[Cloudinary Delete Error] Failed to delete ${targetId}:`, error.message);
    return null;
  }
};

/**
 * Deletes multiple media assets from Cloudinary in parallel
 * @param {Array<{ publicId?: string, url?: string, resourceType?: string } | string>} items
 */
const deleteMultipleMedia = async (items = []) => {
  if (!items || !Array.isArray(items) || items.length === 0) return;

  const deletePromises = items.map((item) => {
    if (!item) return Promise.resolve();
    if (typeof item === 'string') {
      return deleteImage(item);
    }
    const idOrUrl = item.publicId || item.url;
    const type = item.resourceType || 'image';
    return deleteImage(idOrUrl, type);
  });

  return Promise.allSettled(deletePromises);
};

module.exports = {
  cloudinary,
  isConfigured,
  uploadImage,
  deleteImage,
  deleteMultipleMedia,
  extractPublicIdAndType
};
