const express = require('express');
const router = express.Router();
const { protect, optionalProtect, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const projectController = require('../controllers/projectController');

// Category public read routes
router.get('/categories', optionalProtect, projectController.getCategories);
router.get('/industries', optionalProtect, projectController.getIndustries);

// Protected routes below
router.use(protect);

// Category write routes (Admin / Warden / Administrator only)
router.post(
  '/categories',
  restrictTo('ADMIN', 'ADMINISTRATOR', 'WARDEN'),
  projectController.createCategory
);
router.put(
  '/categories/:id',
  restrictTo('ADMIN', 'ADMINISTRATOR', 'WARDEN'),
  projectController.updateCategory
);
router.delete(
  '/categories/:id',
  restrictTo('ADMIN', 'ADMINISTRATOR', 'WARDEN'),
  projectController.deleteCategory
);

// Read routes
router.get('/', projectController.getProjects);
router.get('/industries', projectController.getIndustries);
router.get('/:id', projectController.getProjectById);

// Direct project creation (Students, Alumni, Staff, Admins, etc.) without submission review
router.post('/', upload.any(), upload.validateMediaLimits, projectController.createProject);

// Update / Delete / Like
router.put('/:id', upload.any(), upload.validateMediaLimits, projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.post('/:id/like', projectController.toggleLikeProject);

// Comments
router.post('/:id/comments', projectController.addComment);
router.delete('/:id/comments/:commentId', projectController.deleteComment);
router.post('/:id/comments/:commentId/like', projectController.toggleCommentLike);

module.exports = router;
