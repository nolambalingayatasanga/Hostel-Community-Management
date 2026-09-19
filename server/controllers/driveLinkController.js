const DriveLink = require('../models/DriveLink');
const { uploadImage } = require('../config/cloudinary');

/**
 * GET /api/drive-links
 * Fetch all Google Drive event links (accessible to all authenticated users)
 */
exports.getDriveLinks = async (req, res) => {
  try {
    const { search, year, category } = req.query;

    const filter = {};

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: regex },
        { description: regex },
        { category: regex }
      ];
    }

    if (year && year !== 'ALL') {
      const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
      const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);
      filter.eventDate = { $gte: startOfYear, $lte: endOfYear };
    }

    if (category && category !== 'ALL') {
      filter.category = category;
    }

    const driveLinks = await DriveLink.find(filter)
      .sort({ eventDate: -1, createdAt: -1 })
      .populate('createdBy', 'name role profilePhoto')
      .populate('updatedBy', 'name role profilePhoto');

    return res.status(200).json({
      success: true,
      data: driveLinks,
      count: driveLinks.length
    });
  } catch (error) {
    console.error('Error fetching drive links:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve drive links',
      error: error.message
    });
  }
};

/**
 * GET /api/drive-links/:id
 * Get a single drive link by ID
 */
exports.getDriveLinkById = async (req, res) => {
  try {
    const driveLink = await DriveLink.findById(req.params.id)
      .populate('createdBy', 'name role profilePhoto')
      .populate('updatedBy', 'name role profilePhoto');

    if (!driveLink) {
      return res.status(404).json({
        success: false,
        message: 'Drive link not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: driveLink
    });
  } catch (error) {
    console.error('Error fetching drive link by id:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve drive link',
      error: error.message
    });
  }
};

/**
 * POST /api/drive-links
 * Create a new Google Drive event link (Admin only)
 */
exports.createDriveLink = async (req, res) => {
  try {
    const { title, description, driveUrl, eventDate, category, thumbnailFocus } = req.body;
    let thumbnail = req.body.thumbnail ? String(req.body.thumbnail).trim() : '';
    const validFocus = ['center', 'top', 'bottom', 'left', 'right'].includes(thumbnailFocus) ? thumbnailFocus : 'center';

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Event name or title is required'
      });
    }

    if (!driveUrl || !driveUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Google Drive media URL is required'
      });
    }

    if (!eventDate) {
      return res.status(400).json({
        success: false,
        message: 'Date of event is required'
      });
    }

    // Process file upload if provided
    if (req.file) {
      try {
        const uploadRes = await uploadImage(
          req.file.buffer,
          'hostel-community/drive-links',
          req.file.mimetype,
          'image'
        );
        if (uploadRes?.url) {
          thumbnail = uploadRes.url;
        }
      } catch (uploadErr) {
        console.error('Thumbnail upload error:', uploadErr);
      }
    }

    // Ensure URL has protocol
    let formattedUrl = driveUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const driveLink = await DriveLink.create({
      title: title.trim(),
      description: (description || '').trim(),
      driveUrl: formattedUrl,
      eventDate: new Date(eventDate),
      category: (category || 'General').trim(),
      thumbnail: thumbnail || '',
      thumbnailFocus: validFocus,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    const populated = await DriveLink.findById(driveLink._id)
      .populate('createdBy', 'name role profilePhoto');

    return res.status(201).json({
      success: true,
      message: 'Google Drive link added successfully',
      data: populated
    });
  } catch (error) {
    console.error('Error creating drive link:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create drive link',
      error: error.message
    });
  }
};

/**
 * PUT /api/drive-links/:id
 * Update an existing drive link (Admin only)
 */
exports.updateDriveLink = async (req, res) => {
  try {
    const { title, description, driveUrl, eventDate, category, thumbnail, thumbnailFocus } = req.body;

    const driveLink = await DriveLink.findById(req.params.id);
    if (!driveLink) {
      return res.status(404).json({
        success: false,
        message: 'Drive link not found'
      });
    }

    if (title !== undefined) driveLink.title = title.trim();
    if (description !== undefined) driveLink.description = description.trim();
    if (driveUrl !== undefined) {
      let formattedUrl = driveUrl.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
      driveLink.driveUrl = formattedUrl;
    }
    if (eventDate !== undefined) driveLink.eventDate = new Date(eventDate);
    if (category !== undefined) driveLink.category = category.trim();

    // Process file upload if provided
    if (req.file) {
      try {
        const uploadRes = await uploadImage(
          req.file.buffer,
          'hostel-community/drive-links',
          req.file.mimetype,
          'image'
        );
        if (uploadRes?.url) {
          driveLink.thumbnail = uploadRes.url;
        }
      } catch (uploadErr) {
        console.error('Thumbnail upload error:', uploadErr);
      }
    } else if (thumbnail !== undefined) {
      driveLink.thumbnail = String(thumbnail).trim();
    }

    if (thumbnailFocus !== undefined) {
      driveLink.thumbnailFocus = ['center', 'top', 'bottom', 'left', 'right'].includes(thumbnailFocus)
        ? thumbnailFocus
        : 'center';
    }

    driveLink.updatedBy = req.user._id;

    await driveLink.save();

    const populated = await DriveLink.findById(driveLink._id)
      .populate('createdBy', 'name role profilePhoto')
      .populate('updatedBy', 'name role profilePhoto');

    return res.status(200).json({
      success: true,
      message: 'Google Drive link updated successfully',
      data: populated
    });
  } catch (error) {
    console.error('Error updating drive link:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update drive link',
      error: error.message
    });
  }
};

/**
 * DELETE /api/drive-links/:id
 * Delete a drive link (Admin only)
 */
exports.deleteDriveLink = async (req, res) => {
  try {
    const driveLink = await DriveLink.findByIdAndDelete(req.params.id);
    if (!driveLink) {
      return res.status(404).json({
        success: false,
        message: 'Drive link not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Drive link deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting drive link:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete drive link',
      error: error.message
    });
  }
};
