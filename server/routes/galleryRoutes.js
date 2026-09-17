const express = require('express');
const galleryController = require('../controllers/galleryController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Folder management routes
router.get('/folders', galleryController.getGalleryFolders);
router.post('/folders', restrictTo('ADMIN', 'WARDEN'), galleryController.createGalleryFolder);
router.put('/folders/:id', restrictTo('ADMIN', 'WARDEN'), galleryController.updateGalleryFolder);
router.delete('/folders/:id', restrictTo('ADMIN', 'WARDEN'), galleryController.deleteGalleryFolder);

// Upload signature endpoint for direct-to-Cloudinary upload (bypasses Vercel 4.5MB limit)
router.get('/upload-signature', galleryController.getUploadSignature);

// Read gallery (all authenticated roles)
router.get('/', galleryController.getGalleryPhotos);

// Upload photo (any authenticated user)
router.post('/', upload.single('photo'), galleryController.uploadGalleryPhoto);

// Delete photo from gallery (any authenticated user — controller enforces ownership)
router.delete('/:id', galleryController.deleteGalleryPhoto);

module.exports = router;
