const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, optionalProtect, restrictTo } = require('../middleware/authMiddleware');
const enquiryController = require('../controllers/enquiryController');

const docUpload = multer({
  storage: multer.memoryStorage()
});

// Create enquiry: Open to all users (public path & authenticated)
router.post('/', optionalProtect, docUpload.single('document'), enquiryController.createEnquiry);

// Read enquiries (optionalProtect: returns user's enquiries if logged in, all if admin)
router.get('/', optionalProtect, enquiryController.getEnquiries);
router.get('/:id', optionalProtect, enquiryController.getEnquiryById);

// Management for authorized users (Admin, Warden, or authorized via Access Control)
router.patch(
  '/:id/status',
  protect,
  enquiryController.updateEnquiryStatus
);

router.delete(
  '/:id',
  protect,
  enquiryController.deleteEnquiry
);

module.exports = router;
