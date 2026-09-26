const Project = require('../models/Project');
const ProjectCategory = require('../models/ProjectCategory');
const { uploadBufferToS3 } = require('../middleware/s3UploadMiddleware');

/**
/**
 * GET /api/projects
 * Fetch all projects (with search, category/industry, and sorting)
 */
exports.getProjects = async (req, res) => {
  try {
    const { search, category, industry, projectType } = req.query;
    const filter = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: regex },
        { description: regex },
        { category: regex },
        { industry: regex },
        { authorName: regex },
        { tags: regex }
      ];
    }

    if (projectType && projectType !== 'ALL') {
      filter.projectType = projectType;
    }

    const selectedIndustry = industry || category;
    if (selectedIndustry && selectedIndustry !== 'ALL') {
      if (selectedIndustry === 'College Projects' || selectedIndustry === 'College Project') {
        filter.projectType = 'College Project';
      } else if (selectedIndustry === 'Personal Projects' || selectedIndustry === 'Personal Project') {
        filter.projectType = 'Personal Project';
      } else {
        filter.$or = [
          { industry: selectedIndustry },
          { category: selectedIndustry }
        ];
      }
    }

    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .populate('author', 'name role profilePhoto email phone');

    // Ensure accurate view counts based on unique viewers where tracked
    const sanitizedProjects = projects.map(p => {
      const doc = p.toObject();
      if (Array.isArray(doc.viewedBy) && doc.viewedBy.length > 0) {
        doc.viewsCount = doc.viewedBy.length;
      }
      return doc;
    });

    return res.status(200).json({
      success: true,
      data: sanitizedProjects,
      count: sanitizedProjects.length
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve projects',
      error: error.message
    });
  }
};

/**
 * GET /api/projects/categories
 * Get all project categories
 */
exports.getCategories = async (req, res) => {
  try {
    await ProjectCategory.seedDefaults();
    const categories = await ProjectCategory.find().sort({ order: 1, name: 1 });
    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching project categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories',
      error: error.message
    });
  }
};

/**
 * POST /api/projects/categories
 * Create new project category (Admin / Warden / Administrator only)
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, icon, order } = req.body;
    const trimmed = (name || '').trim();
    if (!trimmed) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    const existing = await ProjectCategory.findOne({ name: new RegExp(`^${trimmed}$`, 'i') });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }

    const highest = await ProjectCategory.findOne().sort({ order: -1 });
    const nextOrder = order !== undefined ? Number(order) : (highest ? highest.order + 1 : 1);

    const category = await ProjectCategory.create({
      name: trimmed,
      icon: icon || 'TagIcon',
      order: nextOrder
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Error creating project category:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

/**
 * PUT /api/projects/categories/:id
 * Update project category (Admin / Warden / Administrator only)
 */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, order } = req.body;

    const category = await ProjectCategory.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const oldName = category.name;
    const newName = (name || '').trim();
    if (!newName) {
      return res.status(400).json({
        success: false,
        message: 'Category name cannot be empty'
      });
    }

    category.name = newName;
    if (icon) category.icon = icon;
    if (order !== undefined) category.order = Number(order);
    await category.save();

    // Cascade update existing projects using the old category name
    if (oldName !== newName) {
      await Project.updateMany({ category: oldName }, { category: newName });
    }

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Error updating project category:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

/**
 * DELETE /api/projects/categories/:id
 * Delete project category (Admin / Warden / Administrator only)
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await ProjectCategory.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const catName = category.name;
    await ProjectCategory.findByIdAndDelete(id);

    // Update any projects in this category to 'Other'
    await Project.updateMany({ category: catName }, { category: 'Other' });

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project category:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
};

/**
 * GET /api/projects/industries
 * Get all available industries (preset list + any user-created industries)
 */
exports.getIndustries = async (req, res) => {
  try {
    const dbCats = await ProjectCategory.find().sort({ order: 1, name: 1 });
    if (dbCats && dbCats.length > 0) {
      return res.status(200).json({
        success: true,
        data: dbCats.map((c) => c.name)
      });
    }

    const DEFAULT_INDUSTRIES = [
      'Web Development',
      'Mobile Apps',
      'AI & Machine Learning',
      'Cloud & DevOps',
      'IoT & Hardware',
      'Cybersecurity',
      'Fintech',
      'Healthcare / HealthTech',
      'EdTech',
      'E-Commerce',
      'Gaming & AR/VR',
      'Open Source'
    ];

    const dbIndustries = await Project.distinct('industry');
    const dbCategories = await Project.distinct('category');

    const allSet = new Set(DEFAULT_INDUSTRIES);
    [...dbIndustries, ...dbCategories].forEach((item) => {
      if (item && typeof item === 'string' && item.trim()) {
        allSet.add(item.trim());
      }
    });

    return res.status(200).json({
      success: true,
      data: Array.from(allSet)
    });
  } catch (error) {
    console.error('Error fetching industries:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve industries',
      error: error.message
    });
  }
};

/**
 * GET /api/projects/:id
 * Get single project details
 */
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('author', 'name role profilePhoto email phone')
      .populate('comments.user', 'name role profilePhoto email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Calculate unique views: only increment when a new user opens it, not for the same person
    const currentUserId = req.user?._id?.toString();
    if (currentUserId) {
      if (!Array.isArray(project.viewedBy)) {
        project.viewedBy = [];
      }
      const alreadyViewed = project.viewedBy.some(
        (uid) => uid && uid.toString() === currentUserId
      );
      if (!alreadyViewed) {
        project.viewedBy.push(req.user._id);
        project.viewsCount = project.viewedBy.length;
        await project.save();
      } else if (project.viewsCount > project.viewedBy.length) {
        // Sanitize legacy repeated view counts
        project.viewsCount = project.viewedBy.length;
        await project.save();
      }
    }

    return res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error fetching project by id:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve project',
      error: error.message
    });
  }
};

/**
 * POST /api/projects
 * Direct project creation without submission approval
 */
exports.createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      githubUrl,
      liveUrl,
      driveUrl,
      videoUrl,
      category,
      industry,
      projectType,
      scopeType,
      media,
      tags,
      thumbnailFocus
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Project title is required'
      });
    }

    let thumbnail = req.body.thumbnail ? String(req.body.thumbnail).trim() : '';

    let parsedMedia = [];
    if (Array.isArray(media)) {
      parsedMedia = media;
    } else if (typeof media === 'string') {
      try {
        parsedMedia = JSON.parse(media);
      } catch {}
    }

    // Handle all uploaded files (supports thumbnail and multiple media files)
    const uploadedFiles = Array.isArray(req.files)
      ? req.files
      : req.file
      ? [req.file]
      : [];

    for (const file of uploadedFiles) {
      try {
        const uploadRes = await uploadBufferToS3(
          file.buffer,
          file.originalname,
          file.mimetype,
          'projects'
        );
        if (uploadRes?.url) {
          if (file.fieldname === 'thumbnail') {
            thumbnail = uploadRes.url;
          } else {
            const isVideo = file.mimetype.startsWith('video/');
            const isPdf = file.mimetype === 'application/pdf';
            const mediaType = isVideo ? 'video' : isPdf ? 'pdf' : 'image';
            parsedMedia.push({
              url: uploadRes.url,
              type: mediaType,
              name: file.originalname
            });
            if (!thumbnail && !isVideo && !isPdf) {
              thumbnail = uploadRes.url;
            }
          }
        }
      } catch (uploadErr) {
        console.error('File upload error in createProject:', uploadErr);
      }
    }

    // Format GitHub and live URLs if provided
    let formattedGithub = (githubUrl || '').trim();
    if (formattedGithub && !/^https?:\/\//i.test(formattedGithub)) {
      formattedGithub = `https://${formattedGithub}`;
    }

    let formattedLive = (liveUrl || '').trim();
    if (formattedLive && !/^https?:\/\//i.test(formattedLive)) {
      formattedLive = `https://${formattedLive}`;
    }

    let formattedDrive = (driveUrl || '').trim();
    if (formattedDrive && !/^https?:\/\//i.test(formattedDrive)) {
      formattedDrive = `https://${formattedDrive}`;
    }

    let formattedVideo = (videoUrl || '').trim();
    if (formattedVideo && !/^https?:\/\//i.test(formattedVideo)) {
      formattedVideo = `https://${formattedVideo}`;
    }

    let parsedTags = [];
    if (Array.isArray(tags)) {
      parsedTags = tags;
    } else if (typeof tags === 'string') {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    const currentUser = req.user;
    const finalIndustry = (category || industry || 'Web Development').trim();
    const finalProjectType = (projectType || 'College Project').trim();
    const finalScopeType = (scopeType || (finalProjectType === 'Personal Project' ? 'Solo Project' : 'Team Project')).trim();

    const newProject = await Project.create({
      title: title.trim(),
      description: (description || '').trim(),
      githubUrl: formattedGithub,
      liveUrl: formattedLive,
      driveUrl: formattedDrive,
      videoUrl: formattedVideo,
      thumbnail,
      thumbnailFocus: thumbnailFocus || 'center',
      industry: finalIndustry,
      category: finalIndustry,
      projectType: finalProjectType,
      scopeType: finalScopeType,
      media: parsedMedia,
      tags: parsedTags,
      author: currentUser?._id,
      authorName: currentUser?.name || 'Anonymous',
      authorRole: currentUser?.role || 'STUDENT',
      authorEmail: currentUser?.email || '',
      authorPhone: currentUser?.phone || '',
      authorAvatar: currentUser?.profilePhoto?.url || ''
    });

    return res.status(201).json({
      success: true,
      message: 'Project shared successfully!',
      data: newProject
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to share project',
      error: error.message
    });
  }
};

/**
 * PUT /api/projects/:id
 * Update project (author or admin)
 */
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isAdmin = ['ADMIN', 'ADMINISTRATOR', 'WARDEN'].includes(req.user?.role);
    const isAuthor = project.author && project.author.toString() === req.user?._id?.toString();

    if (!isAdmin && !isAuthor) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this project'
      });
    }

    const {
      title,
      description,
      githubUrl,
      liveUrl,
      driveUrl,
      videoUrl,
      category,
      industry,
      projectType,
      scopeType,
      media,
      tags,
      thumbnailFocus
    } = req.body;

    if (title && title.trim()) project.title = title.trim();
    if (description !== undefined) project.description = description.trim();
    if (projectType) project.projectType = projectType.trim();
    if (scopeType) project.scopeType = scopeType.trim();

    if (media !== undefined) {
      if (Array.isArray(media)) {
        project.media = media;
      } else if (typeof media === 'string') {
        try {
          project.media = JSON.parse(media);
        } catch {}
      }
    }

    if (githubUrl !== undefined) {
      let formattedGithub = githubUrl.trim();
      if (formattedGithub && !/^https?:\/\//i.test(formattedGithub)) {
        formattedGithub = `https://${formattedGithub}`;
      }
      project.githubUrl = formattedGithub;
    }

    if (liveUrl !== undefined) {
      let formattedLive = liveUrl.trim();
      if (formattedLive && !/^https?:\/\//i.test(formattedLive)) {
        formattedLive = `https://${formattedLive}`;
      }
      project.liveUrl = formattedLive;
    }

    if (driveUrl !== undefined) {
      let formattedDrive = driveUrl.trim();
      if (formattedDrive && !/^https?:\/\//i.test(formattedDrive)) {
        formattedDrive = `https://${formattedDrive}`;
      }
      project.driveUrl = formattedDrive;
    }

    if (videoUrl !== undefined) {
      let formattedVideo = videoUrl.trim();
      if (formattedVideo && !/^https?:\/\//i.test(formattedVideo)) {
        formattedVideo = `https://${formattedVideo}`;
      }
      project.videoUrl = formattedVideo;
    }

    const updatedIndustry = (industry || category || '').trim();
    if (updatedIndustry) {
      project.industry = updatedIndustry;
      project.category = updatedIndustry;
    }
    if (thumbnailFocus) project.thumbnailFocus = thumbnailFocus;

    if (req.body.thumbnail !== undefined) {
      project.thumbnail = String(req.body.thumbnail).trim();
    }

    // Handle all uploaded files (supports thumbnail and multiple media files)
    const uploadedFiles = Array.isArray(req.files)
      ? req.files
      : req.file
      ? [req.file]
      : [];

    for (const file of uploadedFiles) {
      try {
        const uploadRes = await uploadBufferToS3(
          file.buffer,
          file.originalname,
          file.mimetype,
          'projects'
        );
        if (uploadRes?.url) {
          if (file.fieldname === 'thumbnail') {
            project.thumbnail = uploadRes.url;
          } else {
            const isVideo = file.mimetype.startsWith('video/');
            const isPdf = file.mimetype === 'application/pdf';
            const mediaType = isVideo ? 'video' : isPdf ? 'pdf' : 'image';
            if (!Array.isArray(project.media)) project.media = [];
            project.media.push({
              url: uploadRes.url,
              type: mediaType,
              name: file.originalname
            });
            if (!project.thumbnail && !isVideo && !isPdf) {
              project.thumbnail = uploadRes.url;
            }
          }
        }
      } catch (uploadErr) {
        console.error('File upload error on edit in updateProject:', uploadErr);
      }
    }

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        project.tags = tags;
      } else if (typeof tags === 'string') {
        try {
          project.tags = JSON.parse(tags);
        } catch {
          project.tags = tags.split(',').map(t => t.trim()).filter(Boolean);
        }
      }
    }

    await project.save();
    await project.populate('author', 'name role profilePhoto email phone');

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error.message
    });
  }
};

/**
 * DELETE /api/projects/:id
 * Delete project (author or admin)
 */
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isAdmin = ['ADMIN', 'ADMINISTRATOR', 'WARDEN'].includes(req.user?.role);
    const isAuthor = project.author && project.author.toString() === req.user?._id?.toString();

    if (!isAdmin && !isAuthor) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this project'
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error.message
    });
  }
};

/**
 * POST /api/projects/:id/like
 * Like or unlike a project
 */
exports.toggleLikeProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const userId = req.user._id;
    const isLiked = project.likes.some(id => id.toString() === userId.toString());

    if (isLiked) {
      project.likes = project.likes.filter(id => id.toString() !== userId.toString());
    } else {
      project.likes.push(userId);
    }

    project.starsCount = project.likes.length;
    await project.save();

    return res.status(200).json({
      success: true,
      isLiked: !isLiked,
      starsCount: project.starsCount
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update like status',
      error: error.message
    });
  }
};

/**
 * POST /api/projects/:id/comments
 * Add comment to project
 */
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const user = req.user;
    const newComment = {
      user: user._id,
      userName: user.name || 'Anonymous',
      userAvatar: user.profilePhoto?.url || '',
      userRole: user.role || 'STUDENT',
      text: text.trim(),
      likes: [],
      createdAt: new Date()
    };

    if (!Array.isArray(project.comments)) project.comments = [];
    project.comments.unshift(newComment);
    await project.save();

    return res.status(201).json({
      success: true,
      message: 'Comment added',
      data: project.comments
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return res.status(500).json({ success: false, message: 'Failed to add comment', error: error.message });
  }
};

/**
 * DELETE /api/projects/:id/comments/:commentId
 * Delete a comment from project
 */
exports.deleteComment = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const comment = project.comments?.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const isAdmin = ['ADMIN', 'ADMINISTRATOR', 'WARDEN'].includes(req.user?.role);
    const isCommentAuthor = String(comment.user) === String(req.user._id);

    if (!isAdmin && !isCommentAuthor) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    project.comments = project.comments.filter(c => String(c._id) !== String(req.params.commentId));
    await project.save();

    return res.status(200).json({
      success: true,
      message: 'Comment deleted',
      data: project.comments
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete comment', error: error.message });
  }
};

/**
 * POST /api/projects/:id/comments/:commentId/like
 * Toggle like on a comment
 */
exports.toggleCommentLike = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const comment = project.comments?.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const userId = req.user._id;
    if (!Array.isArray(comment.likes)) comment.likes = [];
    const hasLiked = comment.likes.some(id => String(id) === String(userId));

    if (hasLiked) {
      comment.likes = comment.likes.filter(id => String(id) !== String(userId));
    } else {
      comment.likes.push(userId);
    }

    await project.save();
    return res.status(200).json({
      success: true,
      data: project.comments
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    return res.status(500).json({ success: false, message: 'Failed to like comment', error: error.message });
  }
};
