const GalleryPhoto = require('../models/GalleryPhoto');
const GalleryFolder = require('../models/GalleryFolder');
const Access = require('../models/Access');
const { uploadImage, deleteImage, deleteMultipleMedia } = require('../config/cloudinary');

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
 * Upload a photo/video to the community gallery (with optional folderId)
 */
exports.uploadGalleryPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a file to upload.' });
    }

    // Verify Access Control create permission for gallery
    const isAdminOrWarden = ['ADMIN', 'WARDEN', 'CHAIRPERSON'].includes(req.user.role);
    if (!isAdminOrWarden) {
      const accessRec = await Access.findOne({ page: 'gallery', role: req.user.role });
      if (accessRec && (accessRec.permissions?.noAccess || (!accessRec.permissions?.fullAccess && !accessRec.permissions?.create))) {
        return res.status(403).json({ success: false, message: 'You do not have permission to upload photos/videos to the gallery.' });
      }
    }

    const folderId = req.query.folderId || req.body.folderId;
    const caption = req.body.caption || '';
    const isVideo = req.file.mimetype.startsWith('video/');
    const isImage = req.file.mimetype.startsWith('image/');
    const resourceType = isVideo ? 'video' : 'image';

    const MAX_IMAGE_SIZE = 9.8 * 1024 * 1024; // 9.8 MB
    const MAX_VIDEO_SIZE = 99 * 1024 * 1024;  // 99 MB

    if (!isImage && !isVideo) {
      return res.status(400).json({
        success: false,
        message: `Unsupported file format for "${req.file.originalname}". Only image and video files are supported.`
      });
    }

    if (isImage && req.file.size > MAX_IMAGE_SIZE) {
      return res.status(400).json({
        success: false,
        message: `Image "${req.file.originalname}" exceeds 9.8 MB limit (kept 0.2 MB below Cloudinary's 10 MB limit). Selected size: ${(req.file.size / (1024 * 1024)).toFixed(2)} MB.`
      });
    }

    if (isVideo && req.file.size > MAX_VIDEO_SIZE) {
      return res.status(400).json({
        success: false,
        message: `Video "${req.file.originalname}" exceeds 99 MB limit. Selected size: ${(req.file.size / (1024 * 1024)).toFixed(2)} MB.`
      });
    }

    // Verify folder exists if specified
    let targetFolderId = null;
    if (folderId && folderId !== 'null' && folderId !== 'undefined') {
      const folderExists = await GalleryFolder.findById(folderId);
      if (folderExists) {
        targetFolderId = folderExists._id;
      }
    }

    // Upload to Cloudinary
    const uploadResult = await uploadImage(req.file.buffer, 'hostel-community/gallery', req.file.mimetype, resourceType);

    const newPhoto = await GalleryPhoto.create({
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      caption: caption || '',
      resourceType,
      folder: targetFolderId,
      uploadedBy: req.user._id
    });

    await newPhoto.populate('uploadedBy', 'name');
    if (targetFolderId) {
      await newPhoto.populate('folder', 'name color');
      await GalleryFolder.findByIdAndUpdate(targetFolderId, { coverUrl: newPhoto.url });
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
 * Delete a photo from the gallery (deletes Cloudinary asset first)
 */
exports.deleteGalleryPhoto = async (req, res, next) => {
  try {
    const { id } = req.params;

    const photo = await GalleryPhoto.findById(id);
    if (!photo) {
      return res.status(404).json({ success: false, message: 'Media item not found.' });
    }

    // Verify Access Control delete permission for gallery
    const isAdminOrWarden = ['ADMIN', 'WARDEN', 'CHAIRPERSON'].includes(req.user.role);
    if (!isAdminOrWarden) {
      const accessRec = await Access.findOne({ page: 'gallery', role: req.user.role });
      if (accessRec && (accessRec.permissions?.noAccess || (!accessRec.permissions?.fullAccess && !accessRec.permissions?.delete))) {
        return res.status(403).json({ success: false, message: 'You do not have permission to delete gallery media.' });
      }
    }

    // Ownership check: only admin/warden/chairperson or the uploader can delete
    const isOwner = photo.uploadedBy && String(photo.uploadedBy) === String(req.user._id);
    if (!isAdminOrWarden && !isOwner) {
      return res.status(403).json({ success: false, message: 'You can only delete media you uploaded.' });
    }

    // 1. Delete image/video asset from Cloudinary first
    await deleteImage(photo.publicId || photo.url, photo.resourceType || 'image');

    // 2. Delete record from Database
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

    const enrichedFolders = folders.map(f => ({
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

    const folder = await GalleryFolder.findById(id);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found.' });
    }

    // 1. Recursively find all descendant folder IDs
    const allFolderIds = await getAllDescendantFolderIds(id);

    // 2. Find and delete all photos in this folder and descendant subfolders from Cloudinary
    const photos = await GalleryPhoto.find({ folder: { $in: allFolderIds } });
    if (photos.length > 0) {
      await deleteMultipleMedia(photos);
    }

    // 3. Delete database records for photos and all folders
    await GalleryPhoto.deleteMany({ folder: { $in: allFolderIds } });
    await GalleryFolder.deleteMany({ _id: { $in: allFolderIds } });

    res.status(200).json({
      success: true,
      message: 'Folder, subfolders, and all media contents deleted successfully.',
      data: { deletedFolderIds: allFolderIds }
    });
  } catch (error) {
    next(error);
  }
};

