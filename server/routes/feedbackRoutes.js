const express = require('express');
const router = express.Router();
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const feedbackController = require('../controllers/feedbackController');

// Public route to view feedback
router.get('/', optionalProtect, feedbackController.getFeedbacks);

// Protected feedback operations require login
router.use(protect);

router.post('/', feedbackController.createFeedback);

router.route('/:id')
  .put(feedbackController.updateFeedback)
  .delete(feedbackController.deleteFeedback);

router.patch('/:id/status', feedbackController.updateStatus);
router.post('/:id/reply', feedbackController.replyFeedback);
router.post('/:id/like', feedbackController.toggleLike);

module.exports = router;
