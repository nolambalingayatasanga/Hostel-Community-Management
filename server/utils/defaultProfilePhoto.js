const path = require('path');
const fs = require('fs');
const { uploadImage } = require('../config/cloudinary');

const DEFAULT_PROFILE_PHOTO = {
  url: 'https://res.cloudinary.com/mkifnpvk/image/upload/v1789187464/hostel-community/profiles/vzsuddpebsujc0ayuku3.jpg',
  publicId: 'hostel-community/profiles/vzsuddpebsujc0ayuku3'
};

/**
 * Upload the default Basavanna ProfileIcon.jpeg from src/assets to Cloudinary for each new user
 * Falls back to verified pre-uploaded Cloudinary asset if file is not found or network is offline
 */
const getDefaultProfilePhoto = async () => {
  try {
    const defaultImagePath = path.join(__dirname, '../../src/assets/ProfileIcon.jpeg');
    if (fs.existsSync(defaultImagePath)) {
      const result = await uploadImage(defaultImagePath, 'hostel-community/profiles', 'image/jpeg', 'image');
      if (result && result.url) {
        return {
          url: result.url,
          publicId: result.publicId
        };
      }
    }
  } catch (err) {
    console.error('Failed uploading default ProfileIcon.jpeg to Cloudinary:', err.message);
  }
  return { ...DEFAULT_PROFILE_PHOTO };
};

module.exports = {
  getDefaultProfilePhoto,
  DEFAULT_PROFILE_PHOTO
};
