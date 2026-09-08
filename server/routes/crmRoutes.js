const express = require('express');
const crmController = require('../controllers/crmController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/metadata', crmController.getMetadata);

// Custom fields routes
router.post('/custom-fields', restrictTo('ADMIN', 'CHAIRPERSON'), crmController.createCustomField);
router.put('/custom-fields/layout', restrictTo('ADMIN', 'CHAIRPERSON'), crmController.saveLayout);
router.get('/custom-fields/:id/usage', crmController.fetchFieldUsage);
router.delete('/custom-fields/:id', restrictTo('ADMIN', 'CHAIRPERSON'), crmController.deleteCustomField);

// Status groups routes
router.post('/status-groups', restrictTo('ADMIN', 'CHAIRPERSON'), crmController.createStatusGroup);
router.put('/status-groups/reorder', restrictTo('ADMIN', 'CHAIRPERSON'), crmController.reorderStatusGroups);
router.put('/status-groups/:id', restrictTo('ADMIN', 'CHAIRPERSON'), crmController.updateStatusGroup);
router.delete('/status-groups/:id', restrictTo('ADMIN', 'CHAIRPERSON'), crmController.deleteStatusGroup);

// Status stages routes
router.post('/statuses', restrictTo('ADMIN', 'CHAIRPERSON'), crmController.createStatus);
router.put('/statuses/reorder', restrictTo('ADMIN', 'CHAIRPERSON'), crmController.orderStatuses);
router.put('/statuses/:id', restrictTo('ADMIN', 'CHAIRPERSON'), crmController.updateStatus);
router.delete('/statuses/:id', restrictTo('ADMIN', 'CHAIRPERSON'), crmController.deleteStatus);

module.exports = router;
