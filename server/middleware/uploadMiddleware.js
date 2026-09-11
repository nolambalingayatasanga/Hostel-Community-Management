const multer = require('multer');

// Configure memory storage (we will upload the file buffer to Cloudinary)
const storage = multer.memoryStorage();

// File filter: accept image and video formats
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type! Please upload only images or videos.'), false);
  }
};

// File size limits (0.2 MB less than Cloudinary limits):
// - Cloudinary standard image limit: 10 MB -> Set to 9.8 MB
// - Cloudinary standard video limit: 100 MB -> Set to 99 MB
const MAX_IMAGE_SIZE = 9.8 * 1024 * 1024; // 9.8 Megabytes (10,276,044 bytes)
const MAX_VIDEO_SIZE = 99 * 1024 * 1024;  // 99 Megabytes (103,809,024 bytes)

// Create multer instance with 100MB size limit (chunked uploads handle up to 100MB in memory/temp)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 Megabytes
  }
});

/**
 * Middleware to validate file sizes:
 * Images <= 9.8 MB (0.2 MB below Cloudinary's 10 MB limit)
 * Videos <= 99 MB (0.2 MB+ below Cloudinary's 100 MB limit)
 */
const validateMediaLimits = (req, res, next) => {
  let files = [];
  if (req.files) {
    files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
  } else if (req.file) {
    files = [req.file];
  }

  for (const file of files) {
    if (file.mimetype.startsWith('image/')) {
      if (file.size > MAX_IMAGE_SIZE) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        return res.status(400).json({
          success: false,
          message: `Image "${file.originalname}" exceeds the 9.8 MB limit (kept 0.2 MB below Cloudinary's 10 MB limit). Selected size: ${sizeMb} MB.`
        });
      }
    } else if (file.mimetype.startsWith('video/')) {
      if (file.size > MAX_VIDEO_SIZE) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        return res.status(400).json({
          success: false,
          message: `Video "${file.originalname}" exceeds the 99 MB limit. Selected size: ${sizeMb} MB.`
        });
      }
    }
  }

  next();
};

upload.validateMediaLimits = validateMediaLimits;
upload.MAX_IMAGE_SIZE = MAX_IMAGE_SIZE;
upload.MAX_VIDEO_SIZE = MAX_VIDEO_SIZE;

module.exports = upload;

