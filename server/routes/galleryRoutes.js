const express = require('express');
const galleryController = require('../controllers/galleryController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const s3UploadMiddleware = require('../middleware/s3UploadMiddleware');

const router = express.Router();

// Public endpoint for slideshow preview images (only images, unauthenticated)
router.get('/public-previews', galleryController.getPublicGalleryPreviews);

// All routes require authentication
router.use(protect);

// Folder management routes
router.get('/folders', galleryController.getGalleryFolders);
router.post('/folders', restrictTo('ADMIN', 'WARDEN'), galleryController.createGalleryFolder);
router.put('/folders/:id', restrictTo('ADMIN', 'WARDEN'), galleryController.updateGalleryFolder);
router.delete('/folders/:id', galleryController.deleteGalleryFolder);

// Presigned URL for MinIO client-side direct upload
router.get('/presigned-url', galleryController.getPresignedR2Url);

// S3 / MinIO Multipart upload endpoints (bypasses Cloudflare 100MB body size limit)
router.post('/multipart/initiate', galleryController.initiateMultipartUpload);
router.post('/multipart/presigned-parts', galleryController.getPresignedPartUrls);
router.post('/multipart/complete', galleryController.completeMultipartUpload);
router.post('/multipart/abort', galleryController.abortMultipartUpload);

// Read gallery (all authenticated roles)
router.get('/', galleryController.getGalleryPhotos);

// Upload photo/video to gallery (any authenticated user) - Streams directly to MinIO / S3
router.post(
  '/',
  s3UploadMiddleware([
    { name: 'photo' },
    { name: 'file' },
    { name: 'media' }
  ]),
  galleryController.uploadGalleryPhoto
);

// Delete photo from gallery (any authenticated user — controller enforces ownership)
router.delete('/:id', galleryController.deleteGalleryPhoto);

module.exports = router;
