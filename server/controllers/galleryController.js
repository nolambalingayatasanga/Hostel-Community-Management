const mongoose = require('mongoose');
const GalleryPhoto = require('../models/GalleryPhoto');
const GalleryFolder = require('../models/GalleryFolder');
const Event = require('../models/Event');
const Access = require('../models/Access');
const {
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { getS3Client, deleteFromS3 } = require('../middleware/s3UploadMiddleware');

/**
 * Get gallery photos with 30-items-per-page pagination and optional folder filter
 */
exports.getGalleryPhotos = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 30);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.folderId) {
      if (req.query.folderId === 'null' || req.query.folderId === 'none') {
        filter.folder = null;
      } else {
        filter.folder = req.query.folderId;
      }
    }

    const [photos, total] = await Promise.all([
      GalleryPhoto.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'name')
        .populate('folder', 'name color')
        .lean(),
      GalleryPhoto.countDocuments(filter)
    ]);

    const pages = Math.ceil(total / limit);
    const hasMore = page < pages;

    res.status(200).json({
      success: true,
      data: {
        photos,
        pagination: {
          total,
          page,
          limit,
          pages,
          hasMore
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get MinIO / S3 presigned PUT URL for client-side direct uploads
 * (Bypasses Vercel 4.5MB serverless payload limit entirely; zero server load, any file size)
 */
exports.getPresignedMinioUrl = async (req, res, next) => {
  try {
    const filename = req.query.filename || 'media';
    const fileType = req.query.fileType || 'application/octet-stream';
    const folder = req.query.folder || 'uploads';
    const timestamp = Date.now();
    const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${folder}/${timestamp}_${cleanFilename}`;

    const s3 = getS3Client();
    const command = new PutObjectCommand({
      Bucket: 'madhan',
      Key: key,
      ContentType: fileType,
      ACL: 'public-read'
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const endpoint = (process.env.MINIO_ENDPOINT || 'https://staging-storage-api.emovur.com').replace(/\/+$/, '');
    const publicUrl = `${endpoint}/madhan/${key}`;

    res.status(200).json({
      success: true,
      data: {
        uploadUrl,
        publicUrl,
        key,
        storageProvider: 's3'
      }
    });
  } catch (err) {
    next(err);
  }
};
exports.getPresignedR2Url = exports.getPresignedMinioUrl; // Backwards compatible alias

/**
 * Initiate S3/MinIO multipart upload for large files (>50MB/100MB)
 * Bypasses Cloudflare 100MB body limits by uploading in 10MB parts
 */
exports.initiateMultipartUpload = async (req, res, next) => {
  try {
    const { filename, fileType, folder = 'uploads' } = req.body;
    const cleanFilename = (filename || 'media').replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${folder}/${Date.now()}_${cleanFilename}`;

    const s3 = getS3Client();
    const command = new CreateMultipartUploadCommand({
      Bucket: 'madhan',
      Key: key,
      ContentType: fileType || 'application/octet-stream',
      ACL: 'public-read'
    });

    const result = await s3.send(command);

    res.status(200).json({
      success: true,
      data: {
        uploadId: result.UploadId,
        key
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Generate presigned PUT URLs for all parts of a multipart upload in one batch
 */
exports.getPresignedPartUrls = async (req, res, next) => {
  try {
    const { uploadId, key, totalParts } = req.body;
    if (!uploadId || !key || !totalParts) {
      return res.status(400).json({ success: false, message: 'uploadId, key, and totalParts are required' });
    }

    const s3 = getS3Client();
    const parts = [];

    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const command = new UploadPartCommand({
        Bucket: 'madhan',
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber
      });
      const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 7200 });
      parts.push({ partNumber, presignedUrl });
    }

    res.status(200).json({
      success: true,
      data: { parts }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Complete S3/MinIO multipart upload
 */
exports.completeMultipartUpload = async (req, res, next) => {
  try {
    const { uploadId, key, parts } = req.body;
    if (!uploadId || !key || !Array.isArray(parts) || parts.length === 0) {
      return res.status(400).json({ success: false, message: 'uploadId, key, and parts array are required' });
    }

    const s3 = getS3Client();
    const sortedParts = [...parts].sort((a, b) => a.PartNumber - b.PartNumber);

    const command = new CompleteMultipartUploadCommand({
      Bucket: 'madhan',
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: sortedParts
      }
    });

    await s3.send(command);

    const endpoint = (process.env.MINIO_ENDPOINT || 'https://staging-storage-api.emovur.com').replace(/\/+$/, '');
    const publicUrl = `${endpoint}/madhan/${key}`;

    res.status(200).json({
      success: true,
      data: {
        url: publicUrl,
        publicId: key,
        key,
        storageProvider: 's3'
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Abort S3/MinIO multipart upload if cancelled or failed
 */
exports.abortMultipartUpload = async (req, res, next) => {
  try {
    const { uploadId, key } = req.body;
    if (!uploadId || !key) {
      return res.status(400).json({ success: false, message: 'uploadId and key are required' });
    }

    const s3 = getS3Client();
    const command = new AbortMultipartUploadCommand({
      Bucket: 'madhan',
      Key: key,
      UploadId: uploadId
    });

    await s3.send(command);

    res.status(200).json({
      success: true,
      message: 'Multipart upload aborted successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Upload a photo/video to the community gallery (streams to MinIO / S3 with no size limits)
 */
exports.uploadGalleryPhoto = async (req, res, next) => {
  try {
    // Verify Access Control create permission for gallery
    const isAdminOrWarden = ['ADMIN', 'WARDEN'].includes(req.user.role);
    if (!isAdminOrWarden) {
      const accessRec = await Access.findOne({ page: 'gallery', role: req.user.role });
      if (accessRec && (accessRec.permissions?.noAccess || (!accessRec.permissions?.fullAccess && !accessRec.permissions?.create))) {
        return res.status(403).json({ success: false, message: 'You do not have permission to upload photos/videos to the gallery.' });
      }
    }

    const folderId = req.query.folderId || req.body.folderId;
    const caption = req.body.caption || '';
    const directUrl = req.body.url;
    const directPublicId = req.body.publicId;
    let storageProvider = req.body.storageProvider || 's3';
    let resourceType = req.body.resourceType;

    // Verify folder exists if specified
    let targetFolderId = null;
    if (folderId && folderId !== 'null' && folderId !== 'undefined') {
      const folderExists = await GalleryFolder.findById(folderId);
      if (folderExists) {
        targetFolderId = folderExists._id;
      }
    }

    let finalUrl = directUrl;
    let finalPublicId = directPublicId;

    // If direct upload was performed by frontend
    if (finalUrl && finalPublicId) {
      if (!resourceType) {
        resourceType = (finalUrl.includes('/video/') || /\.(mp4|mov|webm|mkv|ogg)$/i.test(finalUrl)) ? 'video' : 'image';
      }
      storageProvider = req.body.storageProvider || (finalUrl.includes('cloudinary.com') ? 'cloudinary' : 's3');
    } else {
      // File uploaded via MinIO / S3 middleware (No limits on file size!)
      const file = (req.files && (req.files.photo?.[0] || req.files.file?.[0] || req.files.media?.[0])) || req.file;
      if (!file) {
        return res.status(400).json({ success: false, message: 'Please select a file to upload.' });
      }

      const isVideo = (file.mimetype || '').startsWith('video/');
      const isImage = (file.mimetype || '').startsWith('image/');
      resourceType = isVideo ? 'video' : 'image';

      if (!isImage && !isVideo) {
        return res.status(400).json({
          success: false,
          message: `Unsupported file format for "${file.originalname}". Only image and video files are supported.`
        });
      }

      const endpoint = (process.env.MINIO_ENDPOINT || 'https://staging-storage-api.emovur.com').replace(/\/+$/, '');
      const bucket = file.bucket || 'madhan';
      const key = file.key;
      finalUrl = file.location && file.location.startsWith('http') && file.location.includes(bucket)
        ? file.location
        : `${endpoint}/${bucket}/${key}`;
      finalPublicId = file.key;
      storageProvider = 's3';
    }

    const newPhoto = await GalleryPhoto.create({
      url: finalUrl,
      publicId: finalPublicId,
      storageProvider,
      caption: caption || '',
      resourceType,
      folder: targetFolderId,
      uploadedBy: req.user._id
    });

    await newPhoto.populate('uploadedBy', 'name');
    if (targetFolderId) {
      await newPhoto.populate('folder', 'name color');
      await GalleryFolder.findByIdAndUpdate(targetFolderId, { coverUrl: newPhoto.url });

      // Automatically sync with matching event to eliminate duplicates and keep event updated
      const matchingEvent = await Event.findOne({ galleryFolder: targetFolderId });
      if (matchingEvent) {
        const alreadyInEvent = matchingEvent.additionalImages.some(
          img => img.url === newPhoto.url || (img.publicId && img.publicId === newPhoto.publicId)
        );
        if (!alreadyInEvent) {
          matchingEvent.additionalImages.unshift({
            _id: newPhoto._id,
            url: newPhoto.url,
            publicId: newPhoto.publicId,
            resourceType: newPhoto.resourceType,
            uploadedBy: req.user._id,
            caption: newPhoto.caption,
            createdAt: newPhoto.createdAt
          });
          await matchingEvent.save();
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Media uploaded to gallery successfully.',
      data: { photo: newPhoto }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a photo from the gallery (deletes MinIO / S3 or Cloudinary asset first)
 */
exports.deleteGalleryPhoto = async (req, res, next) => {
  try {
    const { id } = req.params;

    const photo = await GalleryPhoto.findById(id);
    if (!photo) {
      return res.status(404).json({ success: false, message: 'Media item not found.' });
    }

    // Verify Access Control delete permission for gallery
    const isAdminOrWarden = ['ADMIN', 'WARDEN'].includes(req.user.role);
    if (!isAdminOrWarden) {
      const accessRec = await Access.findOne({ page: 'gallery', role: req.user.role });
      if (accessRec && (accessRec.permissions?.noAccess || (!accessRec.permissions?.fullAccess && !accessRec.permissions?.delete))) {
        return res.status(403).json({ success: false, message: 'You do not have permission to delete gallery media.' });
      }
    }

    // Ownership check: only admin/warden or the uploader can delete
    const isOwner = photo.uploadedBy && String(photo.uploadedBy) === String(req.user._id);
    if (!isAdminOrWarden && !isOwner) {
      return res.status(403).json({ success: false, message: 'You can only delete media you uploaded.' });
    }

    // 1. Delete asset from MinIO / S3
    try {
      if (photo.publicId || photo.url) {
        await deleteFromS3(photo.publicId || photo.url);
      }
    } catch (s3Err) {
      console.error('Error deleting photo from S3:', s3Err.message);
    }

    // 2. If photo belongs to an event folder, also remove from Event.additionalImages
    if (photo.folder) {
      const pullFilter = [];
      if (photo.publicId) pullFilter.push({ publicId: photo.publicId });
      if (photo.url) pullFilter.push({ url: photo.url });
      if (pullFilter.length > 0) {
        await Event.updateMany(
          { galleryFolder: photo.folder },
          { $pull: { additionalImages: pullFilter.length === 1 ? pullFilter[0] : { $or: pullFilter } } }
        ).catch((err) => console.error('Error removing from Event.additionalImages:', err.message));
      }
    }

    // 3. Delete record from Database
    await photo.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Media item deleted from gallery successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to recursively retrieve all descendant folder IDs for a given folder
 */
const getAllDescendantFolderIds = async (folderId) => {
  const ids = [folderId];
  const queue = [folderId];
  while (queue.length > 0) {
    const currId = queue.shift();
    const children = await GalleryFolder.find({ parentFolder: currId }, '_id').lean();
    for (const child of children) {
      ids.push(child._id);
      queue.push(child._id);
    }
  }
  return ids;
};

/**
 * Get all gallery folders with item counts, subfolder counts & cover preview
 */
exports.getGalleryFolders = async (req, res, next) => {
  try {
    const folders = await GalleryFolder.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name profilePhoto')
      .populate('parentFolder', 'name color')
      .lean();

    // Aggregate photo count and cover per folder
    const [counts, subfolderCounts] = await Promise.all([
      GalleryPhoto.aggregate([
        { $match: { folder: { $ne: null } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$folder', count: { $sum: 1 }, latestUrl: { $first: '$url' }, latestResourceType: { $first: '$resourceType' } } }
      ]),
      GalleryFolder.aggregate([
        { $match: { parentFolder: { $ne: null } } },
        { $group: { _id: '$parentFolder', count: { $sum: 1 } } }
      ])
    ]);

    const countMap = {};
    counts.forEach(c => {
      countMap[c._id.toString()] = { count: c.count, latestUrl: c.latestUrl, latestResourceType: c.latestResourceType };
    });

    const subfolderCountMap = {};
    subfolderCounts.forEach(s => {
      if (s._id) subfolderCountMap[s._id.toString()] = s.count;
    });

    // Automatically detect and prune duplicate root folders with matching names
    const rootNameMap = new Map();
    const duplicateFolderIdsToDelete = [];

    for (const f of folders) {
      if (!f.parentFolder) {
        const normName = (f.name || '').trim().toLowerCase();
        const itemCount = countMap[f._id.toString()]?.count || 0;
        const subCount = subfolderCountMap[f._id.toString()] || 0;

        if (rootNameMap.has(normName)) {
          const existing = rootNameMap.get(normName);
          // If current is empty and existing has items (or both empty), prune current
          if (itemCount === 0 && subCount === 0) {
            duplicateFolderIdsToDelete.push(f._id);
            continue;
          } else if (existing.itemCount === 0 && existing.subCount === 0) {
            // If existing was empty and current has items, prune existing and keep current
            duplicateFolderIdsToDelete.push(existing._id);
            rootNameMap.set(normName, { _id: f._id, itemCount, subCount });
            continue;
          } else if (subCount === 0) {
            // Both have items: merge photos into existing and prune current
            await GalleryPhoto.updateMany({ folder: f._id }, { folder: existing._id });
            duplicateFolderIdsToDelete.push(f._id);
            existing.itemCount += itemCount;
            if (countMap[existing._id.toString()]) {
              countMap[existing._id.toString()].count = existing.itemCount;
            }
            continue;
          }
        } else {
          rootNameMap.set(normName, { _id: f._id, itemCount, subCount });
        }
      }
    }

    if (duplicateFolderIdsToDelete.length > 0) {
      await GalleryFolder.deleteMany({ _id: { $in: duplicateFolderIdsToDelete } });
    }

    const validFolders = folders.filter(
      f => !duplicateFolderIdsToDelete.some(delId => String(delId) === String(f._id))
    );

    const enrichedFolders = validFolders.map(f => ({
      ...f,
      itemCount: countMap[f._id.toString()]?.count || 0,
      subfolderCount: subfolderCountMap[f._id.toString()] || 0,
      coverUrl: countMap[f._id.toString()]?.latestUrl || '',
      coverResourceType: countMap[f._id.toString()]?.latestResourceType || 'image'
    }));

    res.status(200).json({
      success: true,
      data: { folders: enrichedFolders }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new gallery folder (Google Drive style)
 */
exports.createGalleryFolder = async (req, res, next) => {
  try {
    const { name, description, color, parentFolder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Folder name is required.' });
    }

    let validParentId = null;
    if (parentFolder && parentFolder !== 'null' && parentFolder !== 'undefined') {
      const parentExists = await GalleryFolder.findById(parentFolder);
      if (!parentExists) {
        return res.status(404).json({ success: false, message: 'Parent folder not found.' });
      }
      validParentId = parentExists._id;
    }

    const newFolder = await GalleryFolder.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      color: color || '#0F9D58',
      parentFolder: validParentId,
      createdBy: req.user._id
    });

    await newFolder.populate('createdBy', 'name profilePhoto');
    if (validParentId) {
      await newFolder.populate('parentFolder', 'name color');
    }

    res.status(201).json({
      success: true,
      message: validParentId ? 'Subfolder created successfully.' : 'Folder created successfully.',
      data: { folder: { ...newFolder.toObject(), itemCount: 0, subfolderCount: 0, coverUrl: '' } }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing gallery folder
 */
exports.updateGalleryFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, color, parentFolder } = req.body;

    const folder = await GalleryFolder.findById(id);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found.' });
    }

    if (name && name.trim()) folder.name = name.trim();
    if (description !== undefined) folder.description = description.trim();
    if (color) folder.color = color;

    if (parentFolder !== undefined) {
      if (parentFolder && parentFolder !== 'null' && parentFolder !== 'undefined') {
        if (String(parentFolder) === String(folder._id)) {
          return res.status(400).json({ success: false, message: 'Folder cannot be a parent of itself.' });
        }
        const descendantIds = await getAllDescendantFolderIds(folder._id);
        if (descendantIds.some(dId => String(dId) === String(parentFolder))) {
          return res.status(400).json({ success: false, message: 'Folder cannot have one of its descendant subfolders as its parent.' });
        }
        folder.parentFolder = parentFolder;
      } else {
        folder.parentFolder = null;
      }
    }

    await folder.save();
    await folder.populate('createdBy', 'name profilePhoto');
    if (folder.parentFolder) {
      await folder.populate('parentFolder', 'name color');
    }

    const [itemCount, subfolderCount] = await Promise.all([
      GalleryPhoto.countDocuments({ folder: folder._id }),
      GalleryFolder.countDocuments({ parentFolder: folder._id })
    ]);

    res.status(200).json({
      success: true,
      message: 'Folder updated successfully.',
      data: { folder: { ...folder.toObject(), itemCount, subfolderCount } }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a gallery folder and all its subfolders and contents (deletes Cloudinary assets first)
 */
exports.deleteGalleryFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid folder ID.' });
    }

    const folder = await GalleryFolder.findById(id);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found.' });
    }

    // Check delete permissions: Admin, Warden, folder creator, or role with delete permission in Access model
    const isAdminOrWarden = ['ADMIN', 'WARDEN'].includes(req.user?.role);
    const isOwner = folder.createdBy && String(folder.createdBy) === String(req.user?._id);
    if (!isAdminOrWarden && !isOwner) {
      const accessRec = await Access.findOne({ page: 'gallery', role: req.user?.role });
      if (accessRec && (accessRec.permissions?.noAccess || (!accessRec.permissions?.fullAccess && !accessRec.permissions?.delete))) {
        return res.status(403).json({ success: false, message: 'You do not have permission to delete this folder.' });
      }
    }

    // 1. Recursively find all descendant folder IDs
    const allFolderIds = await getAllDescendantFolderIds(id);

    const objectIds = allFolderIds
      .filter((fid) => mongoose.Types.ObjectId.isValid(fid))
      .map((fid) => new mongoose.Types.ObjectId(fid));

    // 2. Find and delete all photos in this folder and descendant subfolders
    const photos = await GalleryPhoto.find({ folder: { $in: [...objectIds, id] } });
    if (photos.length > 0) {
      for (const p of photos) {
        if (p.publicId || p.url) {
          try {
            await deleteFromS3(p.publicId || p.url);
          } catch (s3Err) {
            console.error('Error deleting photo from S3:', s3Err.message);
          }
        }
      }
    }

    // 3. Delete database records for photos and all folders
    await GalleryPhoto.deleteMany({ folder: { $in: [...objectIds, id] } });
    await GalleryFolder.deleteMany({ _id: { $in: [...objectIds, id] } });
    await GalleryFolder.findByIdAndDelete(id);

    // 4. Detach folder from any events and clear their event media
    const eventFilter = [
      { galleryFolder: { $in: [...objectIds, id] } }
    ];
    if (folder.name) {
      eventFilter.push({ title: folder.name });
    }
    await Event.updateMany(
      { $or: eventFilter },
      { $set: { galleryFolder: null, additionalImages: [] } }
    );

    res.status(200).json({
      success: true,
      message: 'Folder, subfolders, and all media contents deleted successfully.',
      data: { deletedFolderIds: allFolderIds.map(String) }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public endpoint to fetch all gallery media (images and videos) for auth slideshow
 */
exports.getPublicGalleryPreviews = async (req, res, next) => {
  try {
    const media = await GalleryPhoto.find({})
      .sort({ createdAt: -1 })
      .select('url caption resourceType')
      .lean();

    res.status(200).json({
      success: true,
      data: media
    });
  } catch (error) {
    next(error);
  }
};

