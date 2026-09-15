const Event = require('../models/Event');
const Access = require('../models/Access');
const { uploadImage, deleteImage, deleteMultipleMedia } = require('../config/cloudinary');
const { logAuditEvent } = require('../utils/auditLogger');

/**
 * Get all events with filtering and sorting
 */
exports.getEvents = async (req, res, next) => {
  try {
    const { filter, sortBy, dateFrom, dateTo } = req.query;

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
      .populate('comments.user', 'name profilePhoto role')
      .populate('comments.replies.user', 'name profilePhoto role')
      .populate('additionalImages.uploadedBy', 'name _id');

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

    event.comments.push({ user: req.user._id, text: text.trim(), likes: [], replies: [] });
    await event.save();
    await event.populate('comments.user', 'name profilePhoto role');
    await event.populate('comments.replies.user', 'name profilePhoto role');

    // Covert background audit log
    logAuditEvent({
      req,
      user: req.user,
      action: 'COMMENT_ADD',
      details: {
        eventId: event._id,
        eventTitle: event.title,
        commentText: text.trim().substring(0, 100)
      }
    });

    res.status(201).json({ success: true, data: { comments: event.comments } });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a reply to a comment
 */
exports.addReply = async (req, res, next) => {
  try {
    const { text } = req.body;
    const { id, commentId } = req.params;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Reply text is required.' });
    }

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    const comment = event.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

    comment.replies.push({ user: req.user._id, text: text.trim(), likes: [] });
    await event.save();
    await event.populate('comments.user', 'name profilePhoto role');
    await event.populate('comments.replies.user', 'name profilePhoto role');

    // Covert background audit log
    logAuditEvent({
      req,
      user: req.user,
      action: 'REPLY_ADD',
      details: {
        eventId: event._id,
        commentId,
        replyText: text.trim().substring(0, 100)
      }
    });

    res.status(201).json({ success: true, data: { comments: event.comments } });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle like on a comment
 */
exports.likeComment = async (req, res, next) => {
  try {
    const { id, commentId } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    const comment = event.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

    const userIdStr = String(req.user._id);
    const existingIndex = comment.likes.findIndex((userId) => String(userId) === userIdStr);

    if (existingIndex > -1) {
      comment.likes.splice(existingIndex, 1);
    } else {
      comment.likes.push(req.user._id);
    }

    await event.save();
    await event.populate('comments.user', 'name profilePhoto role');
    await event.populate('comments.replies.user', 'name profilePhoto role');

    res.status(200).json({ success: true, data: { comments: event.comments } });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle like on a reply
 */
exports.likeReply = async (req, res, next) => {
  try {
    const { id, commentId, replyId } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    const comment = event.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

    const reply = comment.replies.id(replyId);
    if (!reply) return res.status(404).json({ success: false, message: 'Reply not found.' });

    const userIdStr = String(req.user._id);
    const existingIndex = reply.likes.findIndex((userId) => String(userId) === userIdStr);

    if (existingIndex > -1) {
      reply.likes.splice(existingIndex, 1);
    } else {
      reply.likes.push(req.user._id);
    }

    await event.save();
    await event.populate('comments.user', 'name profilePhoto role');
    await event.populate('comments.replies.user', 'name profilePhoto role');

    res.status(200).json({ success: true, data: { comments: event.comments } });
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
    await event.populate('comments.user', 'name profilePhoto role');
    await event.populate('comments.replies.user', 'name profilePhoto role');

    // Covert background audit log
    logAuditEvent({
      req,
      user: req.user,
      action: 'COMMENT_DELETE',
      details: {
        eventId: event._id,
        commentId: req.params.commentId
      }
    });

    res.status(200).json({ success: true, data: { comments: event.comments } });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a reply (owner or admin)
 */
exports.deleteReply = async (req, res, next) => {
  try {
    const { id, commentId, replyId } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    const comment = event.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

    const reply = comment.replies.id(replyId);
    if (!reply) return res.status(404).json({ success: false, message: 'Reply not found.' });

    const isOwner = String(reply.user) === String(req.user._id);
    const isAdmin = ['ADMIN', 'CHAIRPERSON'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    reply.deleteOne();
    await event.save();
    await event.populate('comments.user', 'name profilePhoto role');
    await event.populate('comments.replies.user', 'name profilePhoto role');

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
    const { title, description, eventDate, startTime, endTime, location, color, locationUrl, locationCoordinates } = req.body;

    if (!title || !description || !eventDate || !startTime || !endTime || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, eventDate, startTime, endTime, and location.'
      });
    }

    let parsedCoordinates = undefined;
    if (locationCoordinates) {
      try {
        parsedCoordinates = typeof locationCoordinates === 'string' ? JSON.parse(locationCoordinates) : locationCoordinates;
      } catch (e) {
        // ignore parse error
      }
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
      locationUrl: locationUrl || '',
      locationCoordinates: parsedCoordinates,
      color: color || '#0088ff',
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
      // Delete old image from Cloudinary first
      if (event.coverImage && (event.coverImage.publicId || event.coverImage.url)) {
        await deleteImage(event.coverImage.publicId || event.coverImage.url);
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
      if (key !== 'coverImage' && key !== 'category') {
        if (key === 'eventDate') {
          event.eventDate = new Date(updates.eventDate);
        } else if (key === 'locationCoordinates') {
          try {
            event.locationCoordinates = typeof updates.locationCoordinates === 'string'
              ? JSON.parse(updates.locationCoordinates)
              : updates.locationCoordinates;
          } catch (e) {
            // ignore
          }
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
 * Delete event (restricted to Admin) - deletes all Cloudinary media first
 */
exports.deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // 1. Delete cover image from Cloudinary first
    if (event.coverImage && (event.coverImage.publicId || event.coverImage.url)) {
      await deleteImage(event.coverImage.publicId || event.coverImage.url);
    }

    // 2. Delete supplementary gallery images from Cloudinary first
    if (event.additionalImages && event.additionalImages.length > 0) {
      await deleteMultipleMedia(event.additionalImages);
    }

    // 3. Delete event record from Database
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
/**
 * Upload additional images & videos for event gallery
 */
exports.uploadEventGalleryImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Verify Access Control create permission for events
    const isAdminOrWarden = ['ADMIN', 'WARDEN', 'CHAIRPERSON'].includes(req.user.role);
    if (!isAdminOrWarden) {
      const accessRec = await Access.findOne({ page: 'events', role: req.user.role });
      if (accessRec && (accessRec.permissions?.noAccess || (!accessRec.permissions?.fullAccess && !accessRec.permissions?.create))) {
        return res.status(403).json({ success: false, message: 'You do not have permission to upload media to events.' });
      }
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select one or more image or video files to upload.' });
    }

    const MAX_IMAGE_SIZE = 9.8 * 1024 * 1024; // 9.8 MB
    const MAX_VIDEO_SIZE = 99 * 1024 * 1024;  // 99 MB

    // Validate size and file type for each uploaded file
    for (const file of req.files) {
      const isVideo = file.mimetype.startsWith('video/');
      const isImage = file.mimetype.startsWith('image/');

      if (!isImage && !isVideo) {
        return res.status(400).json({
          success: false,
          message: `Unsupported file format for "${file.originalname}". Only image and video files are supported.`
        });
      }

      if (isImage && file.size > MAX_IMAGE_SIZE) {
        return res.status(400).json({
          success: false,
          message: `Image "${file.originalname}" exceeds 9.8 MB limit (kept 0.2 MB below Cloudinary's 10 MB limit). Selected size: ${(file.size / (1024 * 1024)).toFixed(2)} MB.`
        });
      }

      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        return res.status(400).json({
          success: false,
          message: `Video "${file.originalname}" exceeds 99 MB limit. Selected size: ${(file.size / (1024 * 1024)).toFixed(2)} MB.`
        });
      }
    }

    const uploadedImages = [];
    for (const file of req.files) {
      const isVideo = file.mimetype.startsWith('video/');
      const resourceType = isVideo ? 'video' : 'image';

      const uploadResult = await uploadImage(
        file.buffer,
        `hostel-community/events/${id}/gallery`,
        file.mimetype,
        resourceType
      );

      uploadedImages.push({
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        resourceType,
        uploadedBy: req.user._id,
        createdAt: new Date()
      });
    }

    event.additionalImages.push(...uploadedImages);
    event.updatedBy = req.user._id;
    await event.save();

    await event.populate('additionalImages.uploadedBy', 'name _id');

    res.status(200).json({
      success: true,
      message: 'Media uploaded successfully',
      data: {
        additionalImages: event.additionalImages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a specific gallery image or video from event
 */
exports.deleteGalleryImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const imageIndex = event.additionalImages.findIndex((img) => String(img._id) === String(imageId));
    if (imageIndex === -1) {
      return res.status(404).json({ success: false, message: 'Media item not found in gallery.' });
    }

    const imageToDelete = event.additionalImages[imageIndex];

    // Verify Access Control delete permission for events
    const isAdminOrWarden = ['ADMIN', 'WARDEN', 'CHAIRPERSON'].includes(req.user.role);
    if (!isAdminOrWarden) {
      const accessRec = await Access.findOne({ page: 'events', role: req.user.role });
      if (accessRec && (accessRec.permissions?.noAccess || (!accessRec.permissions?.fullAccess && !accessRec.permissions?.delete))) {
        return res.status(403).json({ success: false, message: 'You do not have permission to delete event media.' });
      }
    }

    // Ownership check: only admin/warden or the uploader can delete
    const isOwner = imageToDelete.uploadedBy && String(imageToDelete.uploadedBy) === String(req.user._id);
    if (!isAdminOrWarden && !isOwner) {
      return res.status(403).json({ success: false, message: 'You can only delete media you uploaded.' });
    }

    if (imageToDelete.publicId || imageToDelete.url) {
      await deleteImage(imageToDelete.publicId || imageToDelete.url, imageToDelete.resourceType || 'image');
    }

    event.additionalImages.splice(imageIndex, 1);
    event.updatedBy = req.user._id;
    await event.save();

    // Re-populate uploadedBy before returning
    await event.populate('additionalImages.uploadedBy', 'name _id');

    res.status(200).json({
      success: true,
      message: 'Item removed from gallery.',
      data: {
        additionalImages: event.additionalImages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder gallery images
 */
exports.reorderGalleryImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderedImages } = req.body;

    if (!Array.isArray(orderedImages)) {
      return res.status(400).json({ success: false, message: 'orderedImages must be an array.' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    event.additionalImages = orderedImages;
    event.updatedBy = req.user._id;
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Media order updated successfully',
      data: {
        additionalImages: event.additionalImages
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Parse and scrape details from a direct Map URL (Google Maps, Apple Maps, OpenStreetMap)
 */
exports.parseMapUrl = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid map URL.' });
    }

    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    let finalUrl = targetUrl;
    let html = '';

    try {
      const response = await fetch(targetUrl, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      finalUrl = response.url || targetUrl;
      html = await response.text();
    } catch (fetchErr) {
      console.warn('Map URL fetch warning (continuing with URL regex parse):', fetchErr.message);
    }

    let lat = null;
    let lng = null;
    let name = null;

    const urlsToSearch = [finalUrl, targetUrl].join(' ');

    // 1. Check coordinates in URLs
    // @lat,lng,zoom
    const atMatch = urlsToSearch.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      lat = parseFloat(atMatch[1]);
      lng = parseFloat(atMatch[2]);
    }

    // Protobuf !3dlat!4dlng in Google Maps URLs
    const pbMatch = urlsToSearch.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (pbMatch) {
      lat = parseFloat(pbMatch[1]);
      lng = parseFloat(pbMatch[2]);
    }

    // ?q=lat,lng or ll=lat,lng or center=lat,lng or saddr/daddr=lat,lng
    const qCoordMatch = urlsToSearch.match(/[?&](?:q|query|ll|center|saddr|daddr)=(-?\d+\.\d+)[,;](-?\d+\.\d+)/);
    if (qCoordMatch && (lat === null || lng === null)) {
      lat = parseFloat(qCoordMatch[1]);
      lng = parseFloat(qCoordMatch[2]);
    }

    const osmMatch = urlsToSearch.match(/[?&]mlat=(-?\d+\.\d+)&mlon=(-?\d+\.\d+)/);
    if (osmMatch && (lat === null || lng === null)) {
      lat = parseFloat(osmMatch[1]);
      lng = parseFloat(osmMatch[2]);
    }

    // 2. Check HTML for coordinates if still missing
    if ((lat === null || lng === null) && html) {
      const ogImgMatch = html.match(/(?:center|markers|ll)=(-?\d+\.\d+)%2C(-?\d+\.\d+)/i);
      if (ogImgMatch) {
        lat = parseFloat(ogImgMatch[1]);
        lng = parseFloat(ogImgMatch[2]);
      }

      if (lat === null || lng === null) {
        const htmlAtMatch = html.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (htmlAtMatch) {
          lat = parseFloat(htmlAtMatch[1]);
          lng = parseFloat(htmlAtMatch[2]);
        }
      }

      if (lat === null || lng === null) {
        const pbHtmlMatch = html.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
        if (pbHtmlMatch) {
          lat = parseFloat(pbHtmlMatch[1]);
          lng = parseFloat(pbHtmlMatch[2]);
        }
      }
    }

    // 3. Extract Place Name
    // A. URL /place/Place+Name/
    const placeMatch = urlsToSearch.match(/\/place\/([^/@?#]+)/);
    if (placeMatch) {
      name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim();
    }

    // B. HTML OpenGraph meta tags
    if (!name && html) {
      const ogTitleMatch = html.match(/<meta[^>]*property=[\"']og:title[\"'][^>]*content=[\"']([^\"']+)[\"']/i)
        || html.match(/<meta[^>]*content=[\"']([^\"']+)[\"'][^>]*property=[\"']og:title[\"']/i);
      if (ogTitleMatch) {
        const rawTitle = ogTitleMatch[1].replace(/\s*[-–—|]\s*(?:Google Maps|Maps|Apple Maps)$/i, '').trim();
        if (rawTitle && rawTitle.toLowerCase() !== 'google maps') {
          name = rawTitle;
        }
      }
    }

    // C. HTML Title tag
    if (!name && html) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        const rawTitle = titleMatch[1].replace(/\s*[-–—|]\s*(?:Google Maps|Maps|Apple Maps)$/i, '').trim();
        if (rawTitle && rawTitle.toLowerCase() !== 'google maps') {
          name = rawTitle;
        }
      }
    }

    // D. Query params ?q=Place+Name if not just coords
    if (!name) {
      const qNameMatch = urlsToSearch.match(/[?&](?:q|query)=([^&]+)/);
      if (qNameMatch && !/^[\d.,\s+-]+$/.test(qNameMatch[1])) {
        name = decodeURIComponent(qNameMatch[1].replace(/\+/g, ' ')).trim();
      }
    }

    // 4. Reverse geocode via Nominatim if coordinates found but name is missing or generic
    if (lat !== null && lng !== null && (!name || name.toLowerCase().includes('google maps') || /^-?\d+\.\d+/.test(name))) {
      try {
        const revRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          { headers: { 'User-Agent': 'HostelCommunityApp/1.0', 'Accept-Language': 'en' } }
        );
        const revData = await revRes.json();
        if (revData && revData.display_name) {
          name = revData.display_name;
        }
      } catch (revErr) {
        console.warn('Reverse geocode warning:', revErr.message);
      }
    }

    // 5. Forward geocode via Nominatim if name is found but coordinates are missing
    if ((lat === null || lng === null) && name) {
      try {
        const searchRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name)}&limit=1`,
          { headers: { 'User-Agent': 'HostelCommunityApp/1.0', 'Accept-Language': 'en' } }
        );
        const searchData = await searchRes.json();
        if (Array.isArray(searchData) && searchData.length > 0) {
          lat = parseFloat(searchData[0].lat);
          lng = parseFloat(searchData[0].lon);
          if (!name || name.length < 5) {
            name = searchData[0].display_name;
          }
        }
      } catch (fwdErr) {
        console.warn('Forward geocode warning:', fwdErr.message);
      }
    }

    if (!name && lat === null && lng === null) {
      return res.status(422).json({
        success: false,
        message: 'Could not extract location details from the provided link. Please enter location manually.'
      });
    }

    const canonicalLocationUrl = lat !== null && lng !== null
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : targetUrl;

    return res.status(200).json({
      success: true,
      message: 'Location details extracted successfully',
      data: {
        name: name || (lat && lng ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : 'Pinned Location'),
        lat,
        lng,
        locationCoordinates: lat !== null && lng !== null ? { lat, lng } : null,
        locationUrl: canonicalLocationUrl,
        originalUrl: targetUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

