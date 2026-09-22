const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const feedbackController = require('../controllers/feedbackController');

// All feedback routes require authentication
router.use(protect);

router.route('/')
  .get(feedbackController.getFeedbacks)
  .post(feedbackController.createFeedback);

router.route('/:id')
  .put(feedbackController.updateFeedback)
  .delete(feedbackController.deleteFeedback);

router.patch('/:id/status', feedbackController.updateStatus);
router.post('/:id/reply', feedbackController.replyFeedback);
router.post('/:id/like', feedbackController.toggleLike);

module.exports = router;
