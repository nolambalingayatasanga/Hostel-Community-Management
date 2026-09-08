const Event = require('../models/Event');
const { uploadImage, deleteImage } = require('../config/cloudinary');

/**
 * Get all events with filtering and sorting
 */
exports.getEvents = async (req, res, next) => {
  try {
    const { filter, sortBy, category, dateFrom, dateTo } = req.query;

    const query = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today

    // Calendar date-range filter (takes priority over filter param)
    if (dateFrom || dateTo) {
      query.eventDate = {};
      if (dateFrom) query.eventDate.$gte = new Date(dateFrom);
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query.eventDate.$lte = endOfDay;
      }
    } else {
      // Apply Filter (upcoming vs past)
      if (filter === 'upcoming') {
        query.eventDate = { $gte: today };
      } else if (filter === 'past') {
        query.eventDate = { $lt: today };
      }
    }

    // Filter by Category
    if (category) {
      query.category = category;
    }

    // Sort setup
    let sortOptions = { eventDate: 1 }; // default: upcoming first
    if (sortBy === 'newest') {
      sortOptions = { createdAt: -1 };
    } else if (sortBy === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sortBy === 'upcoming') {
      sortOptions = { eventDate: 1 };
    } else if (sortBy === 'past') {
      sortOptions = { eventDate: -1 };
    }

    const events = await Event.find(query)
      .populate('createdBy', 'name email role profilePhoto')
      .sort(sortOptions);

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single event by ID
 */
exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email role profilePhoto')
      .populate('updatedBy', 'name email')
      .populate('reviews.user', 'name profilePhoto role')
      .populate('comments.user', 'name profilePhoto role');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    res.status(200).json({
      success: true,
      data: { event }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add or update review (1 review per user)
 */
exports.addReview = async (req, res, next) => {
  try {
    const { rating, text } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    // Upsert: one review per user
    const existing = event.reviews.find((r) => String(r.user) === String(req.user._id));
    if (existing) {
      existing.rating = rating;
      existing.text = text || '';
    } else {
      event.reviews.push({ user: req.user._id, rating, text: text || '' });
    }

    await event.save();
    await event.populate('reviews.user', 'name profilePhoto role');

    res.status(200).json({ success: true, data: { reviews: event.reviews } });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a comment
 */
exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required.' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    event.comments.push({ user: req.user._id, text: text.trim() });
    await event.save();
    await event.populate('comments.user', 'name profilePhoto role');

    res.status(201).json({ success: true, data: { comments: event.comments } });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a comment (owner or admin)
 */
exports.deleteComment = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    const comment = event.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

    const isOwner = String(comment.user) === String(req.user._id);
    const isAdmin = ['ADMIN', 'CHAIRPERSON'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    comment.deleteOne();
    await event.save();

    res.status(200).json({ success: true, data: { comments: event.comments } });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new event
 */
exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, eventDate, startTime, endTime, location, category } = req.body;

    if (!title || !description || !eventDate || !startTime || !endTime || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, eventDate, startTime, endTime, and location.'
      });
    }

    let coverImage = { url: '', publicId: '' };

    // Upload cover image to Cloudinary if file exists
    if (req.file) {
      const uploadResult = await uploadImage(req.file.buffer, 'hostel-community/events', req.file.mimetype);
      coverImage = {
        url: uploadResult.url,
        publicId: uploadResult.publicId
      };
    }

    const newEvent = await Event.create({
      title,
      description,
      eventDate: new Date(eventDate),
      startTime,
      endTime,
      location,
      category,
      coverImage,
      createdBy: req.user._id
    });

    res.status(217).json({
      success: true,
      message: 'Event created successfully',
      data: { event: newEvent }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update event
 */
exports.updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Check if cover image file needs to be replaced
    if (req.file) {
      // Delete old image
      if (event.coverImage && event.coverImage.publicId) {
        await deleteImage(event.coverImage.publicId);
      }
      
      // Upload new image
      const uploadResult = await uploadImage(req.file.buffer, 'hostel-community/events', req.file.mimetype);
      event.coverImage = {
        url: uploadResult.url,
        publicId: uploadResult.publicId
      };
    }

    // Apply other updates
    Object.keys(updates).forEach((key) => {
      if (key !== 'coverImage') {
        if (key === 'eventDate') {
          event.eventDate = new Date(updates.eventDate);
        } else {
          event[key] = updates[key];
        }
      }
    });

    event.updatedBy = req.user._id;
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: { event }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete event (restricted to Admin)
 */
exports.deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Delete cover image from Cloudinary
    if (event.coverImage && event.coverImage.publicId) {
      await deleteImage(event.coverImage.publicId);
    }

    // Delete supplementary gallery images
    if (event.additionalImages && event.additionalImages.length > 0) {
      for (const img of event.additionalImages) {
        if (img.publicId) await deleteImage(img.publicId);
      }
    }

    await Event.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Event permanently deleted.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload additional images for event gallery
 */
exports.uploadEventGalleryImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select one or more image files to upload.' });
    }

    const uploadedImages = [];
    for (const file of req.files) {
      const uploadResult = await uploadImage(file.buffer, `hostel-community/events/${id}/gallery`, file.mimetype);
      uploadedImages.push({
        url: uploadResult.url,
        publicId: uploadResult.publicId
      });
    }

    event.additionalImages.push(...uploadedImages);
    event.updatedBy = req.user._id;
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Gallery images uploaded successfully',
      data: {
        additionalImages: event.additionalImages
      }
    });
  } catch (error) {
    next(error);
  }
};
