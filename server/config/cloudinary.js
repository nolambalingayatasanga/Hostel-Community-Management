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

/**
 * Uploads a file buffer or path to Cloudinary, or returns a placeholder if Cloudinary is not configured.
 * @param {string|Buffer} fileSource - File buffer or temp path
 * @param {string} folder - Folder in Cloudinary (e.g., 'hostel-community/profiles')
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadImage = async (fileSource, folder, mimetype = 'image/jpeg', resourceType = 'auto') => {
  let resolvedMimetype = mimetype;
  let resolvedResourceType = resourceType;

  // Resolve auto resource_type based on mimetype prefix
  if (resolvedResourceType === 'auto' && resolvedMimetype) {
    if (resolvedMimetype.startsWith('video/')) {
      resolvedResourceType = 'video';
    } else if (resolvedMimetype.startsWith('image/')) {
      resolvedResourceType = 'image';
    }
  }

  // If the resource type is explicitly image, but the mimetype is generic/raw, override to image/jpeg
  if (resolvedResourceType === 'image' && (!resolvedMimetype || resolvedMimetype === 'application/octet-stream')) {
    resolvedMimetype = 'image/jpeg';
  }

  if (!isConfigured) {
    // Return a mock URL/ID fallback
    console.log(`[Mock Cloudinary Upload] Uploading to folder: ${folder}`);
    const mockId = `mock_${Date.now()}`;

    // Determine placeholder URL depending on profile vs event
    let fallbackUrl = 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';
    if (folder.includes('profiles')) {
      fallbackUrl = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80'; // high quality placeholder avatar
    } else if (folder.includes('events')) {
      fallbackUrl = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'; // community event image
    }

    return {
      url: fallbackUrl,
      publicId: mockId
    };
  }

  // Convert buffer to base64 Data URI if it's a buffer
  let uploadSource = fileSource;
  if (Buffer.isBuffer(fileSource)) {
    uploadSource = `data:${resolvedMimetype};base64,${fileSource.toString('base64')}`;
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      uploadSource,
      { folder: folder, resource_type: resolvedResourceType },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id
          });
        }
      }
    );
  });
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

  if (!isConfigured || targetId.startsWith('mock_')) {
    console.log(`[Mock Cloudinary Delete] Deleting resource: ${targetId} (${targetType})`);
    return { result: 'ok' };
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
