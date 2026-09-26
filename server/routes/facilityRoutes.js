const express = require('express');
const router = express.Router();
const { protect, optionalProtect, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const facilityController = require('../controllers/facilityController');

// Category routes
// Read categories is public (optionalProtect to identify admin)
router.get('/categories', optionalProtect, facilityController.getCategories);

// Manage categories (Admin / Warden / Administrator only)
router.post(
  '/categories',
  protect,
  restrictTo('ADMIN', 'ADMINISTRATOR', 'WARDEN'),
  facilityController.createCategory
);
router.put(
  '/categories/:id',
  protect,
  restrictTo('ADMIN', 'ADMINISTRATOR', 'WARDEN'),
  facilityController.updateCategory
);
router.delete(
  '/categories/:id',
  protect,
  restrictTo('ADMIN', 'ADMINISTRATOR', 'WARDEN'),
  facilityController.deleteCategory
);

// Read facility routes: Public access (optionalProtect to check if admin)
router.get('/', optionalProtect, facilityController.getFacilities);
router.get('/:id', optionalProtect, facilityController.getFacilityById);

// Write facility routes: Only access users (Admin / Warden / Administrator) can add, edit, or delete
router.post(
  '/',
  restrictTo('ADMIN', 'ADMINISTRATOR', 'WARDEN'),
  upload.single('photo'),
  upload.validateMediaLimits,
  facilityController.createFacility
);

router.put(
  '/:id',
  restrictTo('ADMIN', 'ADMINISTRATOR', 'WARDEN'),
  upload.single('photo'),
  upload.validateMediaLimits,
  facilityController.updateFacility
);

router.delete(
  '/:id',
  restrictTo('ADMIN', 'ADMINISTRATOR', 'WARDEN'),
  facilityController.deleteFacility
);

module.exports = router;
