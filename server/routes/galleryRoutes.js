const express = require('express');
const galleryController = require('../controllers/galleryController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public endpoint for slideshow preview images (only images, unauthenticated)
router.get('/public-previews', galleryController.getPublicGalleryPreviews);

// All routes require authentication
router.use(protect);

// Folder management routes
router.get('/folders', galleryController.getGalleryFolders);
router.post('/folders', restrictTo('ADMIN', 'WARDEN'), galleryController.createGalleryFolder);
router.put('/folders/:id', restrictTo('ADMIN', 'WARDEN'), galleryController.updateGalleryFolder);
router.delete('/folders/:id', restrictTo('ADMIN', 'WARDEN'), galleryController.deleteGalleryFolder);

// Presigned URL for Cloudflare R2 client-side direct upload
router.get('/presigned-url', galleryController.getPresignedR2Url);

// Upload signature endpoint for direct-to-Cloudinary upload (kept for Events & fallback)
router.get('/upload-signature', galleryController.getUploadSignature);

// Cloudinary -> Cloudflare R2 Migration Queue (Admin only)
router.post('/admin/migrate-to-cloudflare', restrictTo('ADMIN'), galleryController.startCloudflareMigration);
router.get('/admin/migrate-status', restrictTo('ADMIN'), galleryController.getCloudflareMigrationStatus);

// Read gallery (all authenticated roles)
router.get('/', galleryController.getGalleryPhotos);

// Upload photo (any authenticated user)
router.post('/', upload.single('photo'), galleryController.uploadGalleryPhoto);

// Delete photo from gallery (any authenticated user — controller enforces ownership)
router.delete('/:id', galleryController.deleteGalleryPhoto);

module.exports = router;
