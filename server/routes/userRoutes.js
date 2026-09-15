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
router.post('/translate-kannada', userController.translateToKannada);
router.post('/translate-english', userController.translateToEnglish);

// Helper to allow user to update their own resource, or allow specific privileged roles
const allowSelfOrRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Please log in to get access.' });
  }
  const isSelf = req.params.id && req.user._id && String(req.user._id) === String(req.params.id);
  const hasRole = roles.includes(req.user.role);
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
router.post('/:id/photo', allowSelfOrRoles('ADMIN', 'WARDEN', 'CHAIRPERSON'), upload.single('profilePhoto'), userController.uploadProfilePhoto);
router.post('/', restrictTo('ADMIN', 'WARDEN'), userController.adminCreateUser);
router.patch('/:id/status', restrictTo('ADMIN', 'WARDEN'), userController.adminUpdateUserStatus);
router.post('/:id/transition', restrictTo('ADMIN', 'WARDEN'), userController.adminTransitionStudent);
router.patch('/:id', restrictTo('ADMIN', 'WARDEN'), userController.adminUpdateUser);
router.delete('/:id', restrictTo('ADMIN', 'WARDEN'), userController.adminDeleteUser);

// Admin audit logs
router.get('/:id/audit-logs', restrictTo('ADMIN'), userController.getUserAuditLogs);

// Directories (accessible by all authenticated users, sanitized inside userController)
router.get('/dashboard/stats', userController.getDashboardStats);
router.get('/', userController.getUsers);
router.get('/:id', userController.getUser);

module.exports = router;
