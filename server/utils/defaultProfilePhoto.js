const DEFAULT_PROFILE_PHOTO = {
  url: 'https://staging-storage-api.emovur.com/madhan/uploads/1789848439497_default_ProfileIcon.jpeg',
  publicId: 'uploads/1789848439497_default_ProfileIcon.jpeg'
};

/**
 * Returns the default Basavanna ProfileIcon hosted on MinIO storage
 */
const getDefaultProfilePhoto = async () => {
  return { ...DEFAULT_PROFILE_PHOTO };
};

module.exports = {
  getDefaultProfilePhoto,
  DEFAULT_PROFILE_PHOTO
};
