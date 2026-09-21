const Event = require('../models/Event');
const Access = require('../models/Access');
const GalleryFolder = require('../models/GalleryFolder');
const GalleryPhoto = require('../models/GalleryPhoto');
const { deleteFromS3, uploadBufferToS3, getS3Client } = require('../middleware/s3UploadMiddleware');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { logAuditEvent } = require('../utils/auditLogger');

// In-flight promise locks to prevent concurrent race conditions when ensuring event gallery folders
const ensureFolderLocks = new Map();

/**
 * Helper to ensure a GalleryFolder exists for an event and sync existing additionalImages
 */
const ensureEventFolderHelper = async (event, user) => {
  if (!event) return null;
  const eventId = String(event._id || event);

  // If a folder creation or ensurance is already in-flight for this event, await the same promise
  if (ensureFolderLocks.has(eventId)) {
    return ensureFolderLocks.get(eventId);
  }

  const promise = (async () => {
    try {
      // Reload event to ensure we are operating on the freshest DB document
      const currentEvent = await Event.findById(eventId);
      if (!currentEvent) return null;

      let folder = null;

      // 1. Check if event has a valid galleryFolder reference
      if (currentEvent.galleryFolder) {
        const existingId = currentEvent.galleryFolder._id || currentEvent.galleryFolder;
        folder = await GalleryFolder.findById(existingId);
      }

      // 2. If not found by ID, look up existing root folder with matching name
      if (!folder && currentEvent.title) {
        const titleRegex = new RegExp(`^${currentEvent.title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        folder = await GalleryFolder.findOne({ name: { $regex: titleRegex }, parentFolder: null }).sort({ createdAt: 1 });
      }

      // 3. If still not found, create new folder in Gallery
      if (!folder && currentEvent.title) {
        folder = await GalleryFolder.create({
          name: currentEvent.title.trim(),
          description: `Media for event: ${currentEvent.title.trim()}`,
          color: currentEvent.color || '#0088ff',
          coverUrl: currentEvent.coverImage?.url || '',
          createdBy: user?._id || currentEvent.createdBy,
          parentFolder: null
        });
      }

      // 4. Link folder to event if not linked
      if (folder && (!currentEvent.galleryFolder || String(currentEvent.galleryFolder._id || currentEvent.galleryFolder) !== String(folder._id))) {
        currentEvent.galleryFolder = folder._id;
        await Event.findByIdAndUpdate(currentEvent._id, { galleryFolder: folder._id });
        if (typeof event === 'object' && event !== null) {
          event.galleryFolder = folder._id;
        }
      }

      // 5. Clean up any duplicate empty root folders for this event title
      if (folder && currentEvent.title) {
        const titleRegex = new RegExp(`^${currentEvent.title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        const duplicateFolders = await GalleryFolder.find({
          name: { $regex: titleRegex },
          parentFolder: null,
          _id: { $ne: folder._id }
        });

        for (const dup of duplicateFolders) {
          const dupPhotosCount = await GalleryPhoto.countDocuments({ folder: dup._id });
          const dupSubfolderCount = await GalleryFolder.countDocuments({ parentFolder: dup._id });

          if (dupPhotosCount === 0 && dupSubfolderCount === 0) {
            await GalleryFolder.findByIdAndDelete(dup._id);
          } else if (dupSubfolderCount === 0) {
            // Move any photos from duplicate into the primary folder, then delete duplicate folder
            await GalleryPhoto.updateMany({ folder: dup._id }, { folder: folder._id });
            await GalleryFolder.findByIdAndDelete(dup._id);
          }
        }
      }

      // 6. Sync any existing additionalImages into GalleryPhoto under this folder to prevent duplicates & ensure visibility in Gallery
      if (folder && currentEvent.additionalImages && currentEvent.additionalImages.length > 0) {
        const existingPhotos = await GalleryPhoto.find({ folder: folder._id }).select('url publicId');
        const existingUrlSet = new Set(existingPhotos.map(p => p.url));
        const existingKeySet = new Set(existingPhotos.map(p => p.publicId).filter(Boolean));

        const photosToInsert = [];
        for (const img of currentEvent.additionalImages) {
          if (img.url && !existingUrlSet.has(img.url) && (!img.publicId || !existingKeySet.has(img.publicId))) {
            photosToInsert.push({
              url: img.url,
              publicId: img.publicId || img.url,
              storageProvider: img.storageProvider || 's3',
              resourceType: img.resourceType || (img.url.includes('/video/') || /\.(mp4|mov|webm|mkv|ogg)$/i.test(img.url) ? 'video' : 'image'),
              caption: currentEvent.title,
              folder: folder._id,
              uploadedBy: img.uploadedBy || user?._id || currentEvent.createdBy,
              createdAt: img.createdAt || new Date()
            });
            existingUrlSet.add(img.url);
            if (img.publicId) existingKeySet.add(img.publicId);
          }
        }

        if (photosToInsert.length > 0) {
          await GalleryPhoto.insertMany(photosToInsert);
          if (!folder.coverUrl && photosToInsert[0]?.url) {
            folder.coverUrl = photosToInsert[0].url;
            await folder.save();
          }
        }
      }

      return folder;
    } finally {
      ensureFolderLocks.delete(eventId);
    }
  })();

  ensureFolderLocks.set(eventId, promise);
  return promise;
};

/**
 * Endpoint to ensure gallery folder exists for event (called on clicking Add Media)
 */
exports.ensureEventFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id).populate('galleryFolder');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Do NOT create an empty folder here. Only return the existing folder if one already exists.
    let folder = event.galleryFolder;
    if (!folder && event.title) {
      folder = await GalleryFolder.findOne({ name: event.title, parentFolder: null });
      if (folder) {
        event.galleryFolder = folder._id;
        await Event.findByIdAndUpdate(event._id, { galleryFolder: folder._id });
      }
    }

    res.status(200).json({
      success: true,
      message: folder ? 'Gallery folder found' : 'No gallery folder yet (created on first upload)',
      data: {
        folder: folder || null,
        eventId: event._id
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all events with filtering and sorting
 */
exports.getEvents = async (req, res, next) => {
  try {
    const { filter, sortBy, dateFrom, dateTo } = req.query;

    const query = {};

    // Filter by category or search term
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { location: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today

    // Calendar date-range filter (takes priority over filter param)
    if (dateFrom || dateTo) {
      const conditions = [];
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        conditions.push({
          $or: [
            { startDate: { $lte: endOfDay } },
            { eventDate: { $lte: endOfDay } }
          ]
        });
      }
      if (dateFrom) {
        const startOfDay = new Date(dateFrom);
        startOfDay.setHours(0, 0, 0, 0);
        conditions.push({
          $or: [
            { endDate: { $gte: startOfDay } },
            { $and: [{ endDate: { $exists: false } }, { eventDate: { $gte: startOfDay } }] },
            { $and: [{ endDate: null }, { eventDate: { $gte: startOfDay } }] }
          ]
        });
      }
      if (conditions.length > 0) {
        query.$and = conditions;
      }
    } else {
      // Apply Filter (upcoming vs past)
      if (filter === 'upcoming') {
        query.$or = [
          { endDate: { $gte: today } },
          { $and: [{ endDate: { $exists: false } }, { eventDate: { $gte: today } }] },
          { $and: [{ endDate: null }, { eventDate: { $gte: today } }] }
        ];
      } else if (filter === 'past') {
        query.$or = [
          { endDate: { $lt: today } },
          { $and: [{ endDate: { $exists: false } }, { eventDate: { $lt: today } }] },
          { $and: [{ endDate: null }, { eventDate: { $lt: today } }] }
        ];
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
      .populate('additionalImages.uploadedBy', 'name _id profilePhoto role')
      .populate('galleryFolder', 'name color coverUrl');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Connect or fetch media from the event's gallery folder
    let folder = event.galleryFolder;
    if (folder) {
      const existingId = folder._id || folder;
      folder = await GalleryFolder.findById(existingId);
    }
    if (!folder && event.title) {
      folder = await GalleryFolder.findOne({ name: event.title, parentFolder: null });
      if (folder) {
        event.galleryFolder = folder._id;
        await Event.findByIdAndUpdate(event._id, { galleryFolder: folder._id });
      }
    }

    if (folder) {
      const folderId = folder._id || folder;
      const folderPhotos = await GalleryPhoto.find({ folder: folderId })
        .sort({ createdAt: -1 })
        .populate('uploadedBy', 'name _id profilePhoto role');

      if (folderPhotos && folderPhotos.length > 0) {
        event.additionalImages = folderPhotos.map((p) => ({
          _id: p._id,
          url: p.url,
          publicId: p.publicId,
          resourceType: p.resourceType,
          uploadedBy: p.uploadedBy,
          caption: p.caption,
          createdAt: p.createdAt,
          galleryPhotoId: p._id,
        }));
      } else {
        // Folder exists but has 0 photos - event media should be empty
        event.additionalImages = [];
      }
    } else {
      // Folder does not exist (e.g. deleted from gallery or never created) - event media should be empty
      event.additionalImages = [];
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
    const isAdmin = ['ADMIN', 'WARDEN'].includes(req.user.role);
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
    const isAdmin = ['ADMIN', 'WARDEN'].includes(req.user.role);
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
    const { title, description, startDate, endDate, eventDate, startTime, endTime, location, color, locationUrl, locationCoordinates } = req.body;

    const actualStartDate = startDate || eventDate;
    const actualEndDate = endDate || actualStartDate;

    if (!title || !description || !actualStartDate || !startTime || !endTime || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, date, start time, end time, and location.'
      });
    }

    const startObj = new Date(actualStartDate);
    const endObj = new Date(actualEndDate);
    if (endObj < startObj) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be earlier than start date.'
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

    // Upload cover image to MinIO if file exists
    if (req.file) {
      if (req.file.location && req.file.key) {
        coverImage = {
          url: req.file.location,
          publicId: req.file.key
        };
      } else if (req.file.buffer) {
        const uploadResult = await uploadBufferToS3(req.file.buffer, req.file.originalname, req.file.mimetype, 'uploads');
        coverImage = {
          url: uploadResult.url,
          publicId: uploadResult.publicId
        };
      }
    }

    const newEvent = await Event.create({
      title,
      description,
      startDate: startObj,
      endDate: endObj,
      eventDate: startObj, // for backwards compatibility
      startTime,
      endTime,
      location,
      locationUrl: locationUrl || '',
      locationCoordinates: parsedCoordinates,
      color: color || '#0088ff',
      coverImage,
      createdBy: req.user._id
    });

    // Note: Do NOT create an empty folder here. A gallery folder will be created only when the first media item is actually uploaded.
    res.status(201).json({
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
      // Delete old image from MinIO first
      if (event.coverImage && (event.coverImage.publicId || event.coverImage.url)) {
        await deleteFromS3(event.coverImage.publicId || event.coverImage.url);
      }
      
      // Upload new image to MinIO
      if (req.file.location && req.file.key) {
        event.coverImage = {
          url: req.file.location,
          publicId: req.file.key
        };
      } else if (req.file.buffer) {
        const uploadResult = await uploadBufferToS3(req.file.buffer, req.file.originalname, req.file.mimetype, 'uploads');
        event.coverImage = {
          url: uploadResult.url,
          publicId: uploadResult.publicId
        };
      }
    }

    // Apply other updates
    Object.keys(updates).forEach((key) => {
      if (key !== 'coverImage' && key !== 'category') {
        if (key === 'startDate') {
          event.startDate = new Date(updates.startDate);
          event.eventDate = new Date(updates.startDate);
        } else if (key === 'endDate') {
          event.endDate = new Date(updates.endDate);
        } else if (key === 'eventDate') {
          event.eventDate = new Date(updates.eventDate);
          if (!updates.startDate) event.startDate = new Date(updates.eventDate);
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

    if (event.startDate && event.endDate && new Date(event.endDate) < new Date(event.startDate)) {
      event.endDate = event.startDate;
    }
    if (event.startDate && !event.endDate) {
      event.endDate = event.startDate;
    }

    event.updatedBy = req.user._id;
    await event.save();

    // Sync gallery folder name if title was updated
    if (updates.title && event.galleryFolder) {
      try {
        const folderId = event.galleryFolder._id || event.galleryFolder;
        await GalleryFolder.findByIdAndUpdate(folderId, { name: updates.title.trim() });
      } catch (fErr) {
        // ignore folder sync error
      }
    }

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
 * Delete event (restricted to Admin) - deletes all MinIO media first
 */
exports.deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // 1. Delete standalone cover image from MinIO if not used in gallery photos
    if (event.coverImage && (event.coverImage.publicId || event.coverImage.url)) {
      const coverKeyOrUrl = event.coverImage.publicId || event.coverImage.url;
      const usedInGallery = await GalleryPhoto.findOne({
        $or: [{ publicId: coverKeyOrUrl }, { url: coverKeyOrUrl }]
      });
      if (!usedInGallery) {
        await deleteFromS3(coverKeyOrUrl).catch((err) => console.error('Error deleting cover image:', err.message));
      }
    }

    // 2. Note: Per requirements, do NOT delete related gallery folder or media in gallery.
    // Gallery folder and all media are preserved in the Gallery.

    // 3. Delete event record from Database
    await Event.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Event permanently deleted. Related gallery folder and media are preserved in Gallery.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/events/presigned-url
 * Generate presigned PUT URL for direct-to-MinIO uploads with NO size limits
 */
exports.getPresignedEventUploadUrl = async (req, res, next) => {
  try {
    const { filename, contentType } = req.query;
    if (!filename) {
      return res.status(400).json({ success: false, message: 'filename is required' });
    }

    const s3 = getS3Client();
    const bucket = 'madhan';
    const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `uploads/${Date.now().toString()}_${cleanName}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType || 'application/octet-stream',
      ACL: 'public-read',
      ContentDisposition: 'inline',
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const endpoint = (process.env.MINIO_ENDPOINT || 'https://staging-storage-api.emovur.com').replace(/\/+$/, '');
    const publicUrl = `${endpoint}/${bucket}/${key}`;

    res.status(200).json({
      success: true,
      data: {
        uploadUrl,
        publicUrl,
        key,
        bucket,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload additional images & videos for event gallery (MinIO with NO size limits)
 */
exports.uploadEventGalleryImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Verify Access Control create permission for events
    const isAdminOrWarden = ['ADMIN', 'WARDEN'].includes(req.user.role);
    if (!isAdminOrWarden) {
      const accessRec = await Access.findOne({ page: 'events', role: req.user.role });
      if (accessRec && (accessRec.permissions?.noAccess || (!accessRec.permissions?.fullAccess && !accessRec.permissions?.create))) {
        return res.status(403).json({ success: false, message: 'You do not have permission to upload media to events.' });
      }
    }

    // Ensure gallery folder exists in Gallery for this event in the background
    const folder = await ensureEventFolderHelper(event, req.user);
    const targetFolderId = folder ? folder._id : null;

    // If images were already directly uploaded to MinIO via frontend
    if (req.body.images && Array.isArray(req.body.images) && req.body.images.length > 0) {
      for (const img of req.body.images) {
        const resourceType = img.resourceType || (img.url.includes('/video/') || /\.(mp4|mov|webm|mkv|ogg)$/i.test(img.url) ? 'video' : 'image');
        const fileUrl = img.url;
        const fileKey = img.publicId || img.key;

        // Check if photo already exists in this folder to prevent duplicates
        const existing = await GalleryPhoto.findOne({
          folder: targetFolderId,
          $or: [{ url: fileUrl }, { publicId: fileKey }]
        });

        if (!existing) {
          await GalleryPhoto.create({
            url: fileUrl,
            publicId: fileKey,
            storageProvider: 's3',
            resourceType,
            folder: targetFolderId,
            caption: event.title,
            uploadedBy: req.user._id,
            createdAt: new Date()
          });
        }
      }
    } else {
      const files = req.files || (req.file ? [req.file] : []);
      if (files.length === 0) {
        return res.status(400).json({ success: false, message: 'Please select one or more image or video files to upload.' });
      }

      for (const file of files) {
        const isVideo = (file.mimetype || '').startsWith('video/');
        const resourceType = isVideo ? 'video' : 'image';

        let fileUrl = file.location;
        let fileKey = file.key;

        if (!fileUrl && file.buffer) {
          const uploadResult = await uploadBufferToS3(file.buffer, file.originalname, file.mimetype, 'uploads');
          fileUrl = uploadResult.url;
          fileKey = uploadResult.publicId;
        }

        if (fileUrl) {
          const existing = await GalleryPhoto.findOne({
            folder: targetFolderId,
            $or: [{ url: fileUrl }, { publicId: fileKey }]
          });

          if (!existing) {
            await GalleryPhoto.create({
              url: fileUrl,
              publicId: fileKey,
              storageProvider: 's3',
              resourceType,
              folder: targetFolderId,
              caption: event.title,
              uploadedBy: req.user._id,
              createdAt: new Date()
            });
          }
        }
      }
    }

    // Update folder cover if not set
    if (folder) {
      const latestPhoto = await GalleryPhoto.findOne({ folder: folder._id }).sort({ createdAt: -1 });
      if (latestPhoto && (!folder.coverUrl || folder.coverUrl === '')) {
        folder.coverUrl = latestPhoto.url;
        await folder.save();
      }
    }

    // Retrieve all photos from this gallery folder (single source of truth)
    const allFolderPhotos = targetFolderId
      ? await GalleryPhoto.find({ folder: targetFolderId }).sort({ createdAt: -1 }).populate('uploadedBy', 'name _id profilePhoto role')
      : [];

    const updatedMedia = allFolderPhotos.map(p => ({
      _id: p._id,
      url: p.url,
      publicId: p.publicId,
      resourceType: p.resourceType,
      uploadedBy: p.uploadedBy,
      caption: p.caption,
      createdAt: p.createdAt,
      galleryPhotoId: p._id
    }));

    event.additionalImages = updatedMedia;
    event.updatedBy = req.user._id;
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Media uploaded successfully',
      data: {
        additionalImages: updatedMedia,
        folderId: targetFolderId
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a specific gallery image or video from event (MinIO & GalleryPhoto)
 */
exports.deleteGalleryImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Verify Access Control delete permission for events
    const isAdminOrWarden = ['ADMIN', 'WARDEN'].includes(req.user.role);
    if (!isAdminOrWarden) {
      const accessRec = await Access.findOne({ page: 'events', role: req.user.role });
      if (accessRec && (accessRec.permissions?.noAccess || (!accessRec.permissions?.fullAccess && !accessRec.permissions?.delete))) {
        return res.status(403).json({ success: false, message: 'You do not have permission to delete event media.' });
      }
    }

    // Find photo in GalleryPhoto or in event.additionalImages
    let photoToDelete = await GalleryPhoto.findById(imageId);
    let imageToDelete = null;

    if (!photoToDelete) {
      imageToDelete = event.additionalImages.find((img) => String(img._id) === String(imageId));
      if (imageToDelete) {
        photoToDelete = await GalleryPhoto.findOne({
          $or: [
            { url: imageToDelete.url },
            { publicId: imageToDelete.publicId }
          ]
        });
      }
    } else {
      imageToDelete = {
        url: photoToDelete.url,
        publicId: photoToDelete.publicId,
        uploadedBy: photoToDelete.uploadedBy
      };
    }

    if (!photoToDelete && !imageToDelete) {
      return res.status(404).json({ success: false, message: 'Media item not found in gallery.' });
    }

    // Ownership check: only admin/warden or the uploader can delete
    const uploaderId = photoToDelete?.uploadedBy || imageToDelete?.uploadedBy;
    const isOwner = uploaderId && String(uploaderId) === String(req.user._id);
    if (!isAdminOrWarden && !isOwner) {
      return res.status(403).json({ success: false, message: 'You can only delete media you uploaded.' });
    }

    const keyOrUrl = photoToDelete?.publicId || photoToDelete?.url || imageToDelete?.publicId || imageToDelete?.url;
    if (keyOrUrl) {
      await deleteFromS3(keyOrUrl);
    }

    if (photoToDelete) {
      await GalleryPhoto.findByIdAndDelete(photoToDelete._id);
    }

    const delUrl = photoToDelete?.url || imageToDelete?.url;
    event.additionalImages = event.additionalImages.filter(img =>
      String(img._id) !== String(imageId) && img.url !== delUrl
    );
    event.updatedBy = req.user._id;
    await event.save();

    // Fetch remaining photos from gallery folder if exists
    let remaining = [];
    const targetFolderId = event.galleryFolder?._id || event.galleryFolder;
    if (targetFolderId) {
      const photos = await GalleryPhoto.find({ folder: targetFolderId })
        .sort({ createdAt: -1 })
        .populate('uploadedBy', 'name _id profilePhoto role');
      remaining = photos.map(p => ({
        _id: p._id,
        url: p.url,
        publicId: p.publicId,
        resourceType: p.resourceType,
        uploadedBy: p.uploadedBy,
        caption: p.caption,
        createdAt: p.createdAt
      }));
    } else {
      remaining = event.additionalImages;
    }

    res.status(200).json({
      success: true,
      message: 'Item removed from gallery.',
      data: {
        additionalImages: remaining
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

