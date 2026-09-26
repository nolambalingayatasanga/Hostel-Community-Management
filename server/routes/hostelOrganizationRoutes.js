const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const hostelOrganizationController = require('../controllers/hostelOrganizationController');

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_hostel_secret_jwt_key_987654321');
      const currentUser = await User.findById(decoded.id);
      if (currentUser && currentUser.accountStatus === 'ACTIVE' && !currentUser.isDropped) {
        req.user = currentUser;
      }
    }
  } catch (e) {
    // Continue without token
  }
  next();
};

// GET organizations - public / optional auth
router.get('/', optionalAuth, hostelOrganizationController.getOrganizations);

// Admin-only management endpoints
router.post('/', protect, restrictTo('ADMIN', 'ADMINISTRATOR'), hostelOrganizationController.createOrganization);
router.put('/:id', protect, restrictTo('ADMIN', 'ADMINISTRATOR'), hostelOrganizationController.updateOrganization);
router.delete('/:id', protect, restrictTo('ADMIN', 'ADMINISTRATOR'), hostelOrganizationController.deleteOrganization);

module.exports = router;
