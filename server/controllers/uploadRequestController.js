const UploadRequest = require('../models/UploadRequest');
const GalleryPhoto = require('../models/GalleryPhoto');
const DriveLink = require('../models/DriveLink');
const Event = require('../models/Event');
const Access = require('../models/Access');
const User = require('../models/User');
const { deleteFromS3 } = require('../middleware/s3UploadMiddleware');

/**
 * Check if user has moderation/review rights for request_upload
 */
const hasModerationAccess = async (user) => {
  if (!user) return false;
  if (user.role === 'ADMIN' || user.role === 'WARDEN' || user.role === 'CHAIRPERSON') {
    return true;
  }
  const access = await Access.findOne({ page: 'request_upload', role: user.role });
  return access && (access.permissions?.fullAccess || access.permissions?.update);
};

/**
 * POST /api/upload-requests
 * Submit a new upload request for memories (Gallery, Drive Links, or Events)
 */
exports.createRequest = async (req, res, next) => {
  try {
    // Verify Access Control create permission for request_upload
    const isAdminOrWarden = ['ADMIN', 'WARDEN', 'CHAIRPERSON'].includes(req.user.role);
    if (!isAdminOrWarden) {
      const accessRec = await Access.findOne({ page: 'request_upload', role: req.user.role });
      if (accessRec && (accessRec.permissions?.noAccess || (!accessRec.permissions?.fullAccess && !accessRec.permissions?.create))) {
        return res.status(403).json({ success: false, message: 'You do not have permission to submit upload requests.' });
      }
    }

    const {
      targetCategory,
      title,
      description,
      media,
      driveUrl,
      driveCategory,
      driveEventDate,
      driveThumbnail,
      driveThumbnailFocus,
      eventDetails,
      galleryFolder
    } = req.body;

    if (!targetCategory || !['gallery', 'drive_links', 'events'].includes(targetCategory)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid destination category (gallery, drive_links, or events).'
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a title or event name for your memory submission.'
      });
    }

    // Category specific validations
    if (targetCategory === 'gallery') {
      if (!media || !Array.isArray(media) || media.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please upload at least one photo or video for the gallery.'
        });
      }
    } else if (targetCategory === 'drive_links') {
      if (!driveUrl || !driveUrl.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid Google Drive link.'
        });
      }
      if (!driveEventDate) {
        return res.status(400).json({
          success: false,
          message: 'Please select the date of the event for the Drive Link.'
        });
      }
    } else if (targetCategory === 'events') {
      if (!eventDetails || !eventDetails.eventDate || !eventDetails.startTime || !eventDetails.endTime || !eventDetails.location) {
        return res.status(400).json({
          success: false,
          message: 'Please provide all event details (date, start time, end time, and location).'
        });
      }
    }

    const newRequest = await UploadRequest.create({
      user: req.user._id,
      targetCategory,
      title: title.trim(),
      description: description ? description.trim() : '',
      media: Array.isArray(media) ? media : [],
      driveUrl: driveUrl ? driveUrl.trim() : '',
      driveCategory: driveCategory || 'General',
      driveEventDate: driveEventDate ? new Date(driveEventDate) : undefined,
      driveThumbnail: driveThumbnail || '',
      driveThumbnailFocus: driveThumbnailFocus || 'center',
      eventDetails: eventDetails || {},
      galleryFolder: galleryFolder || null,
      status: 'PENDING'
    });

    res.status(201).json({
      success: true,
      message: 'Your memory upload request has been submitted successfully and is awaiting review.',
      data: newRequest
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/upload-requests/my-requests
 * Get all memory upload requests submitted by the logged in user with pagination & filters
 */
exports.getMyRequests = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = req.query.limit === 'all' ? null : Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = limit ? (page - 1) * limit : 0;

    const { status, category, search } = req.query;
    const filter = { user: req.user._id };

    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (category && category !== 'ALL') {
      if (category === 'video') {
        filter.targetCategory = 'gallery';
        filter['media.resourceType'] = 'video';
      } else if (category === 'image') {
        filter.targetCategory = 'gallery';
        filter['media.resourceType'] = { $ne: 'video' };
      } else if (category === 'drive') {
        filter.targetCategory = 'drive_links';
      } else if (category === 'event') {
        filter.targetCategory = 'events';
      } else {
        filter.targetCategory = category;
      }
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { 'media.originalName': searchRegex }
      ];
    }

    const total = await UploadRequest.countDocuments(filter);
    let query = UploadRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('reviewedBy', 'name role')
      .populate('galleryFolder', 'name')
      .lean();

    if (limit) {
      query = query.skip(skip).limit(limit);
    }

    const requests = await query;

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit: limit || total,
        total,
        totalPages: limit ? Math.max(1, Math.ceil(total / limit)) : 1
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/upload-requests
 * Get all requests (for Admin or authorized reviewers in Access Control) with pagination & filters
 */
exports.getAllRequests = async (req, res, next) => {
  try {
    const canReview = await hasModerationAccess(req.user);
    if (!canReview) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view the upload moderation queue.'
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = req.query.limit === 'all' ? null : Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = limit ? (page - 1) * limit : 0;

    const { status, category, search } = req.query;
    const filter = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (category && category !== 'ALL') {
      if (category === 'video') {
        filter.targetCategory = 'gallery';
        filter['media.resourceType'] = 'video';
      } else if (category === 'image') {
        filter.targetCategory = 'gallery';
        filter['media.resourceType'] = { $ne: 'video' };
      } else if (category === 'drive') {
        filter.targetCategory = 'drive_links';
      } else if (category === 'event') {
        filter.targetCategory = 'events';
      } else {
        filter.targetCategory = category;
      }
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchingUsers = await User.find({
        $or: [
          { name: searchRegex },
          { role: searchRegex },
          { memberId: searchRegex }
        ]
      }).select('_id').lean();
      const userIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { 'media.originalName': searchRegex },
        { user: { $in: userIds } }
      ];
    }

    const total = await UploadRequest.countDocuments(filter);
    let query = UploadRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('user', 'name email profilePhoto role memberId')
      .populate('reviewedBy', 'name role')
      .populate('galleryFolder', 'name')
      .lean();

    if (limit) {
      query = query.skip(skip).limit(limit);
    }

    const requests = await query;

    const pendingCount = await UploadRequest.countDocuments({ status: 'PENDING' });
    const approvedCount = await UploadRequest.countDocuments({ status: 'APPROVED' });
    const rejectedCount = await UploadRequest.countDocuments({ status: 'REJECTED' });

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit: limit || total,
        total,
        totalPages: limit ? Math.max(1, Math.ceil(total / limit)) : 1
      },
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: pendingCount + approvedCount + rejectedCount
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/upload-requests/:id/review
 * Approve or Reject an upload request. If approved, automatically publish to destination.
 */
exports.reviewRequest = async (req, res, next) => {
  try {
    const canReview = await hasModerationAccess(req.user);
    if (!canReview) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to review or approve upload requests.'
      });
    }

    const { id } = req.params;
    const { status, adminFeedback } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Status must be either APPROVED or REJECTED.'
      });
    }

    const request = await UploadRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Upload request not found.'
      });
    }

    if (request.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been approved and published.'
      });
    }

    let publishedIds = [];

    // AUTO-PUBLISH LOGIC UPON APPROVAL
    if (status === 'APPROVED') {
      if (request.targetCategory === 'gallery') {
        // Create GalleryPhoto entries for each media asset
        if (request.media && request.media.length > 0) {
          const createdPhotos = await Promise.all(
            request.media.map(item =>
              GalleryPhoto.create({
                url: item.url,
                publicId: item.publicId || `req_${request._id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                storageProvider: item.storageProvider || 's3',
                caption: item.caption || request.title,
                resourceType: item.resourceType || 'image',
                folder: request.galleryFolder || null,
                uploadedBy: request.user
              })
            )
          );
          publishedIds = createdPhotos.map(p => p._id);
        }
      } else if (request.targetCategory === 'drive_links') {
        // Create DriveLink entry
        const createdDriveLink = await DriveLink.create({
          title: request.title,
          description: request.description || '',
          driveUrl: request.driveUrl,
          eventDate: request.driveEventDate || new Date(),
          category: request.driveCategory || 'General',
          thumbnail: request.driveThumbnail || (request.media?.[0]?.url || ''),
          thumbnailFocus: request.driveThumbnailFocus || 'center',
          createdBy: request.user
        });
        publishedIds = [createdDriveLink._id];
      } else if (request.targetCategory === 'events') {
        // Create Event entry
        const coverImg = request.eventDetails?.coverImage?.url
          ? request.eventDetails.coverImage
          : request.media?.[0]
            ? { url: request.media[0].url, publicId: request.media[0].publicId || '' }
            : { url: '', publicId: '' };

        const additionalImgs = (request.media || []).map(m => ({
          url: m.url,
          publicId: m.publicId || '',
          resourceType: m.resourceType || 'image',
          uploadedBy: request.user,
          createdAt: new Date()
        }));

        const createdEvent = await Event.create({
          title: request.title,
          description: request.description || request.title,
          eventDate: request.eventDetails?.eventDate || new Date(),
          startTime: request.eventDetails?.startTime || '09:00',
          endTime: request.eventDetails?.endTime || '17:00',
          location: request.eventDetails?.location || 'Hostel Campus',
          locationUrl: request.eventDetails?.locationUrl || '',
          color: request.eventDetails?.color || '#0088ff',
          coverImage: coverImg,
          additionalImages: additionalImgs,
          createdBy: request.user
        });
        publishedIds = [createdEvent._id];
      }
    }

    request.status = status;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    if (adminFeedback !== undefined) {
      request.adminFeedback = adminFeedback.trim();
    }
    if (publishedIds.length > 0) {
      request.publishedIds = publishedIds;
    }

    await request.save();

    const populatedRequest = await UploadRequest.findById(request._id)
      .populate('user', 'name email profilePhoto role memberId')
      .populate('reviewedBy', 'name role')
      .populate('galleryFolder', 'name')
      .lean();

    res.status(200).json({
      success: true,
      message: status === 'APPROVED'
        ? `Request approved! Assets have been published directly to ${request.targetCategory === 'drive_links' ? 'Drive Links' : request.targetCategory.charAt(0).toUpperCase() + request.targetCategory.slice(1)}.`
        : 'Request has been rejected.',
      data: populatedRequest
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/upload-requests/:id
 * Delete a request (uploader can cancel if PENDING; Admin can delete any)
 */
exports.deleteRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await UploadRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Upload request not found.'
      });
    }

    const isAdminOrWarden = req.user.role === 'ADMIN' || req.user.role === 'WARDEN';
    const isOwner = String(request.user) === String(req.user._id);

    if (!isAdminOrWarden && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this request.'
      });
    }

    if (!isAdminOrWarden) {
      const accessRec = await Access.findOne({ page: 'request_upload', role: req.user.role });
      if (accessRec && (accessRec.permissions?.noAccess || (!accessRec.permissions?.fullAccess && !accessRec.permissions?.delete))) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete upload requests.'
        });
      }
    }

    if (!isAdminOrWarden && request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'You can only cancel pending requests.'
      });
    }

    // Clean up uploaded media assets from MinIO storage if the request wasn't approved/published
    if (request.status !== 'APPROVED' && request.media && request.media.length > 0) {
      for (const m of request.media) {
        try {
          if (m.publicId || m.url) {
            await deleteFromS3(m.publicId || m.url);
          }
        } catch (storageErr) {
          console.warn('[uploadRequestController] Could not delete file from storage:', storageErr.message);
        }
      }
    }

    await UploadRequest.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Upload request deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/upload-requests/upload-media
 * Upload a media file directly using MinIO / S3 middleware
 */
exports.uploadMediaAsset = async (req, res, next) => {
  try {
    const file = (req.files && (req.files.media?.[0] || req.files.file?.[0])) || req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a media file to upload.'
      });
    }

    const endpoint = (process.env.MINIO_ENDPOINT || 'https://staging-storage-api.emovur.com').replace(/\/+$/, '');
    const bucket = file.bucket || 'madhan';
    const key = file.key;
    const finalUrl = file.location && file.location.startsWith('http') && file.location.includes(bucket)
      ? file.location
      : `${endpoint}/${bucket}/${key}`;

    const isVideo = (file.mimetype || '').startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';

    res.status(200).json({
      success: true,
      data: {
        url: finalUrl,
        publicId: file.key,
        storageProvider: 's3',
        resourceType,
        originalName: file.originalname,
        size: file.size
      }
    });
  } catch (err) {
    next(err);
  }
};

