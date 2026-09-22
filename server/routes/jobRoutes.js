const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const jobController = require('../controllers/jobController');

// Memory storage for file uploads (logos, resumes, documents)
const upload = multer({
  storage: multer.memoryStorage()
});

// All job routes require authentication
router.use(protect);

// -------------------------------------------------------------
// Organization Profile Routes
// -------------------------------------------------------------
router.get('/organization/my', jobController.getMyOrganization);
router.post('/organization', upload.single('logo'), jobController.createOrUpdateOrganization);
router.patch('/organization/:id/toggle-block', jobController.toggleBlockOrganization);

// -------------------------------------------------------------
// Job Openings Routes
// -------------------------------------------------------------
router.get('/', jobController.getJobOpenings);
router.post('/', jobController.createJobOpening);

router.get('/my-applications', jobController.getMyApplications);

router.get('/:id', jobController.getJobDetails);
router.put('/:id', jobController.updateJobOpening);
router.delete('/:id', jobController.deleteJobOpening);

// -------------------------------------------------------------
// Application Routes
// -------------------------------------------------------------
router.post('/:id/apply', upload.single('resume'), jobController.applyForJob);
router.get('/:id/applicants', jobController.getJobApplicants);
router.patch('/applications/:appId/status', jobController.updateApplicationStatus);

module.exports = router;
