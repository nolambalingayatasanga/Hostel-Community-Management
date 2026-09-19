const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const deviceDetector = require('../middleware/deviceMiddleware');
const qrScanController = require('../controllers/qrScanController');
const loginQrController = require('../controllers/loginQrController');

// Public tracking: scan domain/{code}?r=qr → count + redirect to kambi-connect login
router.get('/t/:code', deviceDetector, loginQrController.trackLoginQr);

// Public direct portal click tracking (API beacon)
router.get('/track-direct', deviceDetector, loginQrController.trackDirectClick);
router.post('/track-direct', deviceDetector, loginQrController.trackDirectClick);

// Public scan redirect endpoint (legacy member identifier scans)
router.get('/public-scan/:identifier', qrScanController.publicScan);

// All other QR scan operations are strictly ADMIN only
router.use(protect);
router.use(restrictTo('ADMIN'));

// Login QR dashboard
router.get('/login-qr', loginQrController.getLoginQr);
router.put('/login-qr', loginQrController.updateLoginQr);
router.get('/login-qr/download', loginQrController.downloadLoginQr);
router.delete('/login-qr/device/:id', loginQrController.deleteDeviceLog);
router.delete('/login-qr/devices', loginQrController.clearDeviceLogs);

// Core scan endpoints
router.post('/scan', qrScanController.recordScan);
router.get('/stats', qrScanController.getStats);
router.get('/logs', qrScanController.getLogs);
router.delete('/logs/:id', qrScanController.deleteLog);
router.get('/search-members', qrScanController.searchMembers);

module.exports = router;
