const express = require('express');
const router = express.Router();
const accessController = require('../controllers/accessController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Get current user's accessible navigation items
router.get('/navigation', protect, accessController.getNavigation);
router.get('/my-permissions', protect, accessController.getMyPermissions);

// Users page sub-tabs endpoints
router.get('/user-tabs', protect, accessController.getUserTabs);
router.get('/user-tabs/my-access', protect, accessController.getMyUserTabsAccess);

// Access matrix management (restricted to ADMIN and WARDEN)
router.get('/matrix', protect, restrictTo('ADMIN', 'WARDEN'), accessController.getAccessMatrix);
router.put('/matrix', protect, restrictTo('ADMIN', 'WARDEN'), accessController.updateAccessPermission);
router.post('/reset', protect, restrictTo('ADMIN', 'WARDEN'), accessController.resetDefaults);

module.exports = router;
