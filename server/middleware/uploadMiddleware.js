const multer = require('multer');

// Configure memory storage (for legacy routes still using buffer)
const storage = multer.memoryStorage();

// File filter: accept image and video formats
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type! Please upload only images or videos.'), false);
  }
};

// Create multer instance with NO file size limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter
});

/**
 * Middleware to validate media - No file size limits enforced
 */
const validateMediaLimits = (req, res, next) => {
  next();
};

upload.validateMediaLimits = validateMediaLimits;

module.exports = upload;
