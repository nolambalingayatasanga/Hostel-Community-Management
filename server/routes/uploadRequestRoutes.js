const express = require('express');
const uploadRequestController = require('../controllers/uploadRequestController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// All routes require user authentication
router.use(protect);

// Upload a single media asset directly
router.post('/upload-media', upload.single('file'), uploadRequestController.uploadMediaAsset);

// Submit new upload request
router.post('/', uploadRequestController.createRequest);

// Get current user's submitted requests
router.get('/my-requests', uploadRequestController.getMyRequests);

// Admin/Moderator: Get all requests across system
router.get('/', uploadRequestController.getAllRequests);

// Admin/Moderator: Review and approve/reject request
router.put('/:id/review', uploadRequestController.reviewRequest);

// Cancel/Delete request
router.delete('/:id', uploadRequestController.deleteRequest);

module.exports = router;
