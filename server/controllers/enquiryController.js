const Enquiry = require('../models/Enquiry');
const Access = require('../models/Access');
const { uploadBufferToS3 } = require('../middleware/s3UploadMiddleware');

const isAuthorizedForEnquiries = async (user) => {
  if (!user) return false;
  const role = user.role;
  if (['ADMIN', 'ADMINISTRATOR', 'WARDEN', 'CHAIRPERSON'].includes(role)) {
    return true;
  }
  const accessRec = await Access.findOne({ page: 'users', role });
  return !!(accessRec?.tabPermissions?.['enquiry']);
};

exports.isAuthorizedForEnquiries = isAuthorizedForEnquiries;

/**
 * POST /api/enquiries
 * Submit a new enquiry
 */
exports.createEnquiry = async (req, res) => {
  try {
    const { name, email, phone, category, subject, message } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Your name is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Contact number is required' });
    }

    const currentUser = req.user;
    let attachmentUrl = '';
    let attachmentName = '';

    if (req.file) {
      try {
        const uploadResult = await uploadBufferToS3(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          'enquiries'
        );
        attachmentUrl = uploadResult.url;
        attachmentName = req.file.originalname;
      } catch (uploadErr) {
        console.error('Attachment upload warning:', uploadErr.message);
      }
    }

    const enquiry = await Enquiry.create({
      name: name.trim(),
      email: (email || '').trim().toLowerCase(),
      phone: phone.trim(),
      category: category || 'General Enquiry',
      subject: (subject || '').trim() || 'General Enquiry',
      message: (message || '').trim(),
      attachmentUrl,
      attachmentName,
      user: currentUser?._id || null,
      userRole: currentUser?.role || 'STUDENT'
    });

    return res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully! We will get back to you soon.',
      data: enquiry
    });
  } catch (error) {
    console.error('Error creating enquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit enquiry',
      error: error.message
    });
  }
};

/**
 * GET /api/enquiries
 * Retrieve enquiries list
 * If Admin/Warden: gets all or filtered by status/search
 * If regular user and ?my=true: gets their own enquiries
 */
exports.getEnquiries = async (req, res) => {
  try {
    const { status, search, category, my } = req.query;
    const isAuthorized = await isAuthorizedForEnquiries(req.user);

    // If not logged in and not authorized, return empty list
    if (!isAuthorized && !req.user) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const filter = {};

    // If regular user without enquiry permission, or explicit "my" flag, filter to current user's records
    if (!isAuthorized || my === 'true') {
      if (req.user?._id) {
        filter.$or = [
          { user: req.user._id },
          { email: req.user.email?.toLowerCase() }
        ];
      }
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (category && category !== 'ALL') {
      filter.category = category;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      const searchConditions = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { subject: regex },
        { message: regex },
        { category: regex }
      ];
      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          { $or: searchConditions }
        ];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    const enquiries = await Enquiry.find(filter)
      .sort({ createdAt: -1 })
      .populate('user', 'name role profilePhoto email phone')
      .populate('resolvedBy', 'name role');

    return res.status(200).json({
      success: true,
      data: enquiries,
      count: enquiries.length
    });
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve enquiries',
      error: error.message
    });
  }
};

/**
 * GET /api/enquiries/:id
 * Retrieve a single enquiry
 */
exports.getEnquiryById = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id)
      .populate('user', 'name role profilePhoto email phone')
      .populate('resolvedBy', 'name role');

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    return res.status(200).json({ success: true, data: enquiry });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/enquiries/:id/status
 * Update enquiry status and admin notes (Admin / Warden only)
 */
exports.updateEnquiryStatus = async (req, res) => {
  try {
    const isAuthorized = await isAuthorizedForEnquiries(req.user);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'You do not have permission to manage enquiries' });
    }

    const { status, adminNotes } = req.body;

    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    if (status) {
      enquiry.status = status;
      if (status === 'Resolved' || status === 'Closed') {
        enquiry.resolvedBy = req.user?._id;
        enquiry.resolvedAt = new Date();
      }
    }

    if (adminNotes !== undefined) {
      enquiry.adminNotes = adminNotes.trim();
    }

    await enquiry.save();

    return res.status(200).json({
      success: true,
      message: `Enquiry status updated to ${enquiry.status}`,
      data: enquiry
    });
  } catch (error) {
    console.error('Error updating enquiry status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update enquiry status',
      error: error.message
    });
  }
};

/**
 * DELETE /api/enquiries/:id
 * Delete an enquiry (Admin / Warden only)
 */
exports.deleteEnquiry = async (req, res) => {
  try {
    const isAuthorized = await isAuthorizedForEnquiries(req.user);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'You do not have permission to manage enquiries' });
    }

    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    await Enquiry.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Enquiry removed successfully'
    });
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete enquiry',
      error: error.message
    });
  }
};
