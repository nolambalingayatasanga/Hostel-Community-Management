const express = require('express');
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Self endpoints
router.patch('/profile', userController.updateOwnProfile);
router.post('/profile/photo', upload.single('profilePhoto'), userController.uploadProfilePhoto);
router.post('/profile/transition', restrictTo('STUDENT'), userController.transitionToAlumni);

// Admin & Chairperson management endpoints
router.post('/', restrictTo('ADMIN', 'CHAIRPERSON'), userController.adminCreateUser);
router.patch('/:id/status', restrictTo('ADMIN', 'CHAIRPERSON'), userController.adminUpdateUserStatus);
router.post('/:id/transition', restrictTo('ADMIN', 'CHAIRPERSON'), userController.adminTransitionStudent);
router.patch('/:id', restrictTo('ADMIN', 'CHAIRPERSON'), userController.adminUpdateUser);
router.delete('/:id', restrictTo('ADMIN', 'CHAIRPERSON'), userController.adminDeleteUser);

// Directories (accessible by all authenticated users, sanitized inside userController)
router.get('/dashboard/stats', restrictTo('ADMIN', 'CHAIRPERSON'), userController.getDashboardStats);
router.get('/', userController.getUsers);
router.get('/:id', userController.getUser);

module.exports = router;
