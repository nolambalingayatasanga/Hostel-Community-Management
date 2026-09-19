const express = require('express');
const eventController = require('../controllers/eventController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const s3UploadMiddleware = require('../middleware/s3UploadMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Presigned URL for direct-to-MinIO client-side upload (NO size limits)
router.get('/presigned-url', eventController.getPresignedEventUploadUrl);

// View events (any authenticated role)
router.get('/', eventController.getEvents);
router.post('/parse-map-url', eventController.parseMapUrl);
router.get('/:id', eventController.getEvent);

// Reviews & Comments (any authenticated user)
router.post('/:id/reviews', eventController.addReview);
router.post('/:id/comments', eventController.addComment);
router.delete('/:id/comments/:commentId', eventController.deleteComment);
router.post('/:id/comments/:commentId/reply', eventController.addReply);
router.post('/:id/comments/:commentId/like', eventController.likeComment);
router.post('/:id/comments/:commentId/replies/:replyId/like', eventController.likeReply);
router.delete('/:id/comments/:commentId/replies/:replyId', eventController.deleteReply);

// Modify events (restricted to ADMIN & WARDEN) - MinIO storage with NO size limits
router.post('/', restrictTo('ADMIN', 'WARDEN'), s3UploadMiddleware('coverImage'), eventController.createEvent);
router.patch('/:id', restrictTo('ADMIN', 'WARDEN'), s3UploadMiddleware('coverImage'), eventController.updateEvent);
// Gallery upload & delete: any authenticated user (controller enforces ownership for delete)
router.post('/:id/gallery', s3UploadMiddleware('galleryImages'), eventController.uploadEventGalleryImages);
router.delete('/:id/gallery/:imageId', eventController.deleteGalleryImage);
router.patch('/:id/gallery/reorder', restrictTo('ADMIN', 'WARDEN'), eventController.reorderGalleryImages);

// Delete events (ADMIN only)
router.delete('/:id', restrictTo('ADMIN'), eventController.deleteEvent);

module.exports = router;

