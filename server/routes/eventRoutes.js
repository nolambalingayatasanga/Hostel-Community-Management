const express = require('express');
const eventController = require('../controllers/eventController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

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

// Modify events (restricted to ADMIN & WARDEN)
router.post('/', restrictTo('ADMIN', 'WARDEN'), upload.single('coverImage'), eventController.createEvent);
router.patch('/:id', restrictTo('ADMIN', 'WARDEN'), upload.single('coverImage'), eventController.updateEvent);
// Gallery upload & delete: any authenticated user (controller enforces ownership for delete)
router.post('/:id/gallery', upload.array('galleryImages', 100), eventController.uploadEventGalleryImages);
router.delete('/:id/gallery/:imageId', eventController.deleteGalleryImage);
router.patch('/:id/gallery/reorder', restrictTo('ADMIN', 'WARDEN'), eventController.reorderGalleryImages);

// Delete events (ADMIN only)
router.delete('/:id', restrictTo('ADMIN'), eventController.deleteEvent);

module.exports = router;

