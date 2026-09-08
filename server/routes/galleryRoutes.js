const express = require('express');
const galleryController = require('../controllers/galleryController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Read gallery (all authenticated roles)
router.get('/', galleryController.getGalleryPhotos);

// Upload photo (restricted to ADMIN & CHAIRPERSON)
router.post('/', restrictTo('ADMIN', 'CHAIRPERSON'), upload.single('photo'), galleryController.uploadGalleryPhoto);

// Delete photo from gallery (restricted to ADMIN & CHAIRPERSON)
router.delete('/:id', restrictTo('ADMIN', 'CHAIRPERSON'), galleryController.deleteGalleryPhoto);

module.exports = router;
