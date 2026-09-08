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

// Create multer instance with 25MB size limit
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 Megabytes
  }
});

module.exports = upload;
