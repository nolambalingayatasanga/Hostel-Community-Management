const express = require('express');
const crmController = require('../controllers/crmController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/metadata', crmController.getMetadata);

// Custom fields routes
router.post('/custom-fields', restrictTo('ADMIN', 'WARDEN'), crmController.createCustomField);
router.put('/custom-fields/layout', restrictTo('ADMIN', 'WARDEN'), crmController.saveLayout);
router.get('/custom-fields/:id/usage', crmController.fetchFieldUsage);
router.delete('/custom-fields/:id', restrictTo('ADMIN', 'WARDEN'), crmController.deleteCustomField);

// Status groups routes
router.post('/status-groups', restrictTo('ADMIN', 'WARDEN'), crmController.createStatusGroup);
router.put('/status-groups/reorder', restrictTo('ADMIN', 'WARDEN'), crmController.reorderStatusGroups);
router.put('/status-groups/:id', restrictTo('ADMIN', 'WARDEN'), crmController.updateStatusGroup);
router.delete('/status-groups/:id', restrictTo('ADMIN', 'WARDEN'), crmController.deleteStatusGroup);

// Status stages routes
router.post('/statuses', restrictTo('ADMIN', 'WARDEN'), crmController.createStatus);
router.put('/statuses/reorder', restrictTo('ADMIN', 'WARDEN'), crmController.orderStatuses);
router.put('/statuses/:id', restrictTo('ADMIN', 'WARDEN'), crmController.updateStatus);
router.delete('/statuses/:id', restrictTo('ADMIN', 'WARDEN'), crmController.deleteStatus);

// Independent per-tab table layout routes
router.get('/layouts', crmController.getTabLayouts);
router.put('/layouts/:tabId', crmController.saveTabLayout);

module.exports = router;
