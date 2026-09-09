const express = require('express');
const eventController = require('../controllers/eventController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// View events (any authenticated role)
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEvent);

// Reviews & Comments (any authenticated user)
router.post('/:id/reviews', eventController.addReview);
router.post('/:id/comments', eventController.addComment);
router.delete('/:id/comments/:commentId', eventController.deleteComment);
router.post('/:id/comments/:commentId/reply', eventController.addReply);
router.post('/:id/comments/:commentId/like', eventController.likeComment);
router.post('/:id/comments/:commentId/replies/:replyId/like', eventController.likeReply);
router.delete('/:id/comments/:commentId/replies/:replyId', eventController.deleteReply);

// Modify events (restricted to ADMIN & CHAIRPERSON)
router.post('/', restrictTo('ADMIN', 'CHAIRPERSON'), upload.single('coverImage'), eventController.createEvent);
router.patch('/:id', restrictTo('ADMIN', 'CHAIRPERSON'), upload.single('coverImage'), eventController.updateEvent);
router.post('/:id/gallery', restrictTo('ADMIN', 'CHAIRPERSON'), upload.array('galleryImages', 10), eventController.uploadEventGalleryImages);
router.delete('/:id/gallery/:imageId', restrictTo('ADMIN', 'CHAIRPERSON'), eventController.deleteGalleryImage);
router.patch('/:id/gallery/reorder', restrictTo('ADMIN', 'CHAIRPERSON'), eventController.reorderGalleryImages);

// Delete events (ADMIN only)
router.delete('/:id', restrictTo('ADMIN'), eventController.deleteEvent);

module.exports = router;

