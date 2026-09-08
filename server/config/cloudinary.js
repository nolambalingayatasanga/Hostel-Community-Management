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
 * Deletes an image or video from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - Cloudinary resource type ('image' or 'video')
 * @returns {Promise<any>}
 */
const deleteImage = async (publicId, resourceType = 'image') => {
  if (!isConfigured || !publicId || publicId.startsWith('mock_')) {
    console.log(`[Mock Cloudinary Delete] Deleting resource: ${publicId}`);
    return { result: 'ok' };
  }

  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    return null;
  }
};

module.exports = {
  cloudinary,
  isConfigured,
  uploadImage,
  deleteImage
};
