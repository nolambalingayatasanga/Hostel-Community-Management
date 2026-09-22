const Feedback = require('../models/Feedback');

/**
 * Check if user is Admin, Warden, or Chairperson
 */
const isAdminOrWarden = (user) => {
  if (!user || !user.role) return false;
  const role = user.role.toUpperCase();
  return role === 'ADMIN' || role === 'WARDEN' || role === 'CHAIRPERSON';
};

/**
 * GET /api/feedback
 * Fetch feedbacks.
 * - Admin/Warden: gets all feedbacks (with optional status & search filter)
 * - Regular users: gets only their own submitted feedbacks
 */
exports.getFeedbacks = async (req, res) => {
  try {
    const user = req.user;
    const isStaff = isAdminOrWarden(user);
    const { status, search } = req.query;

    const query = {};

    if (!isStaff) {
      // Regular user can only see their own feedback
      query.user = user._id;
    } else {
      // Admin/Warden can filter by status if provided
      if (status && (status === 'pending' || status === 'accepted')) {
        query.status = status;
      }
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { content: searchRegex },
        { adminReply: searchRegex }
      ];
    }

    const feedbacks = await Feedback.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone role profilePhoto')
      .populate('repliedBy', 'name role')
      .populate('likedBy', 'name role');

    return res.status(200).json({
      success: true,
      count: feedbacks.length,
      data: feedbacks
    });
  } catch (error) {
    console.error('Error in getFeedbacks:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve feedbacks',
      error: error.message
    });
  }
};

/**
 * POST /api/feedback
 * Submit a new feedback
 */
exports.createFeedback = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Feedback content cannot be empty'
      });
    }

    const feedback = await Feedback.create({
      user: req.user._id,
      content: content.trim(),
      status: 'pending'
    });

    const populated = await Feedback.findById(feedback._id)
      .populate('user', 'name email phone role profilePhoto');

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: populated
    });
  } catch (error) {
    console.error('Error in createFeedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
};

/**
 * PUT /api/feedback/:id
 * Edit an existing feedback (User can only edit their own feedback)
 */
exports.updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Feedback content cannot be empty'
      });
    }

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Verify ownership
    const isOwner = feedback.user.toString() === req.user._id.toString();
    const isStaff = isAdminOrWarden(req.user);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own feedback'
      });
    }

    feedback.content = content.trim();
    feedback.isEdited = true;
    await feedback.save();

    const populated = await Feedback.findById(feedback._id)
      .populate('user', 'name email phone role profilePhoto')
      .populate('repliedBy', 'name role')
      .populate('likedBy', 'name role');

    return res.status(200).json({
      success: true,
      message: 'Feedback updated successfully',
      data: populated
    });
  } catch (error) {
    console.error('Error in updateFeedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update feedback',
      error: error.message
    });
  }
};

/**
 * PATCH /api/feedback/:id/status
 * Admin/Warden marks feedback as accepted or pending
 */
exports.updateStatus = async (req, res) => {
  try {
    if (!isAdminOrWarden(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update feedback status'
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'accepted'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either pending or accepted'
      });
    }

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    feedback.status = status;
    await feedback.save();

    const populated = await Feedback.findById(feedback._id)
      .populate('user', 'name email phone role profilePhoto')
      .populate('repliedBy', 'name role')
      .populate('likedBy', 'name role');

    return res.status(200).json({
      success: true,
      message: `Feedback status updated to ${status}`,
      data: populated
    });
  } catch (error) {
    console.error('Error in updateStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
};

/**
 * POST /api/feedback/:id/reply
 * Admin/Warden sends or edits reply
 */
exports.replyFeedback = async (req, res) => {
  try {
    if (!isAdminOrWarden(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can reply to feedback'
      });
    }

    const { id } = req.params;
    const { reply } = req.body;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    feedback.adminReply = reply ? reply.trim() : '';
    feedback.repliedAt = reply && reply.trim() ? new Date() : null;
    feedback.repliedBy = reply && reply.trim() ? req.user._id : null;
    await feedback.save();

    const populated = await Feedback.findById(feedback._id)
      .populate('user', 'name email phone role profilePhoto')
      .populate('repliedBy', 'name role')
      .populate('likedBy', 'name role');

    return res.status(200).json({
      success: true,
      message: reply ? 'Reply saved successfully' : 'Reply cleared',
      data: populated
    });
  } catch (error) {
    console.error('Error in replyFeedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save reply',
      error: error.message
    });
  }
};

/**
 * POST /api/feedback/:id/like
 * Admin/Warden toggles like on a feedback
 */
exports.toggleLike = async (req, res) => {
  try {
    if (!isAdminOrWarden(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can like feedback'
      });
    }

    const { id } = req.params;
    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    feedback.isLiked = !feedback.isLiked;
    feedback.likedAt = feedback.isLiked ? new Date() : null;
    feedback.likedBy = feedback.isLiked ? req.user._id : null;
    await feedback.save();

    const populated = await Feedback.findById(feedback._id)
      .populate('user', 'name email phone role profilePhoto')
      .populate('repliedBy', 'name role')
      .populate('likedBy', 'name role');

    return res.status(200).json({
      success: true,
      message: feedback.isLiked ? 'Feedback liked' : 'Feedback unliked',
      data: populated
    });
  } catch (error) {
    console.error('Error in toggleLike:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update like status',
      error: error.message
    });
  }
};

/**
 * DELETE /api/feedback/:id
 * Delete a feedback (User can delete their own feedback; Admin/Warden can delete any feedback)
 */
exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    const isOwner = feedback.user.toString() === req.user._id.toString();
    const isStaff = isAdminOrWarden(req.user);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this feedback'
      });
    }

    await Feedback.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully',
      data: { _id: id }
    });
  } catch (error) {
    console.error('Error in deleteFeedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete feedback',
      error: error.message
    });
  }
};
