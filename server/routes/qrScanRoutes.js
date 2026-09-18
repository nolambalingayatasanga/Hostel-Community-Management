const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const qrScanController = require('../controllers/qrScanController');

// Public scan redirect endpoint (for mobile phone camera scans)
router.get('/public-scan/:identifier', qrScanController.publicScan);

// All other QR scan operations are strictly ADMIN only
router.use(protect);
router.use(restrictTo('ADMIN'));

// Core scan endpoints
router.post('/scan', qrScanController.recordScan);
router.get('/stats', qrScanController.getStats);
router.get('/logs', qrScanController.getLogs);
router.delete('/logs/:id', qrScanController.deleteLog);
router.get('/search-members', qrScanController.searchMembers);

module.exports = router;
