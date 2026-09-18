const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const driveLinkController = require('../controllers/driveLinkController');

// All drive link routes require authentication
router.use(protect);

// Read routes: Accessible to all authenticated users (Students, Alumni, Staff, Wardens, Members, Admin)
router.get('/', driveLinkController.getDriveLinks);
router.get('/:id', driveLinkController.getDriveLinkById);

// Write routes: Strictly full access for Admin
router.post('/', restrictTo('ADMIN'), driveLinkController.createDriveLink);
router.put('/:id', restrictTo('ADMIN'), driveLinkController.updateDriveLink);
router.delete('/:id', restrictTo('ADMIN'), driveLinkController.deleteDriveLink);

module.exports = router;
