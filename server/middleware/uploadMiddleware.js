const multer = require('multer');

// Configure memory storage (for legacy routes still using buffer)
const storage = multer.memoryStorage();

// File filter: accept image, video, and document formats
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    file.mimetype === 'application/pdf' ||
    file.mimetype.includes('document') ||
    file.mimetype.includes('msword') ||
    file.mimetype.includes('officedocument')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type! Please upload only images, videos, or documents.'), false);
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
