const express = require('express');
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const s3UploadMiddleware = require('../middleware/s3UploadMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Self endpoints
router.get('/profile', (req, res, next) => {
  req.params.id = req.user._id;
  return userController.getUser(req, res, next);
});
router.patch('/profile', userController.updateOwnProfile);
router.post('/profile/photo', s3UploadMiddleware('profilePhoto'), userController.uploadProfilePhoto);
router.post('/profile/resume', s3UploadMiddleware('resume'), userController.uploadResume);
router.delete('/profile/resume', userController.deleteResume);
router.post('/profile/transition', restrictTo('STUDENT'), userController.transitionToAlumni);
router.post('/translate-kannada', userController.translateToKannada);
router.post('/translate-english', userController.translateToEnglish);
router.post('/track-page-view', userController.trackPageView);

// Helper to allow user to update their own resource, or allow specific privileged roles
const allowSelfOrRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Please log in to get access.' });
  }
  const isSelf = req.params.id && req.user._id && String(req.user._id) === String(req.params.id);
  const hasRole = roles.includes(req.user.role) || req.user.role === 'ADMINISTRATOR';
  if (isSelf || hasRole) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'You do not have permission to perform this action.'
  });
};

// Admin & Warden management endpoints
router.post('/bulk-drop', restrictTo('ADMIN', 'WARDEN'), userController.bulkDropUsers);
router.post('/:id/photo', allowSelfOrRoles('ADMIN', 'WARDEN'), s3UploadMiddleware('profilePhoto'), userController.uploadProfilePhoto);
router.post('/:id/resume', allowSelfOrRoles('ADMIN', 'WARDEN'), s3UploadMiddleware('resume'), userController.uploadResume);
router.delete('/:id/resume', allowSelfOrRoles('ADMIN', 'WARDEN'), userController.deleteResume);
router.post('/', restrictTo('ADMIN', 'WARDEN'), userController.adminCreateUser);
router.patch('/:id/status', restrictTo('ADMIN', 'WARDEN'), userController.adminUpdateUserStatus);
router.post('/:id/transition', restrictTo('ADMIN', 'WARDEN'), userController.adminTransitionStudent);
router.patch('/:id', restrictTo('ADMIN', 'WARDEN'), userController.adminUpdateUser);
router.delete('/:id', restrictTo('ADMIN', 'WARDEN'), userController.adminDeleteUser);

// Admin audit logs
router.get('/:id/audit-logs', restrictTo('ADMIN'), userController.getUserAuditLogs);

// Dashboard Overview Micro-Thread Routes (Restricted to ADMIN, ADMINISTRATOR, WARDEN)
router.get('/dashboard/community', restrictTo('ADMIN', 'WARDEN'), userController.getDashboardCommunityStats);
router.get('/dashboard/events', restrictTo('ADMIN', 'WARDEN'), userController.getDashboardEventStats);
router.get('/dashboard/gallery', restrictTo('ADMIN', 'WARDEN'), userController.getDashboardGalleryStats);
router.get('/dashboard/jobs', restrictTo('ADMIN', 'WARDEN'), userController.getDashboardJobStats);
router.get('/dashboard/qr', restrictTo('ADMIN', 'WARDEN'), userController.getDashboardQrStats);
router.get('/dashboard/security', restrictTo('ADMIN', 'WARDEN'), userController.getDashboardSecurityStats);
router.get('/dashboard/recent', restrictTo('ADMIN', 'WARDEN'), userController.getDashboardRecentRegistrations);
router.get('/dashboard/stats', restrictTo('ADMIN', 'WARDEN'), userController.getDashboardStats);
router.get('/', userController.getUsers);
router.get('/:id', userController.getUser);

module.exports = router;
