const GalleryPhoto = require('../models/GalleryPhoto');
const GalleryFolder = require('../models/GalleryFolder');
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

    const { caption, folderId } = req.body;
    const isVideo = req.file.mimetype.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';

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
 * Get all gallery folders with item counts & cover preview
 */
exports.getGalleryFolders = async (req, res, next) => {
  try {
    const folders = await GalleryFolder.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name profilePhoto')
      .lean();

    // Aggregate photo count and cover per folder
    const counts = await GalleryPhoto.aggregate([
      { $match: { folder: { $ne: null } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$folder', count: { $sum: 1 }, latestUrl: { $first: '$url' }, latestResourceType: { $first: '$resourceType' } } }
    ]);

    const countMap = {};
    counts.forEach(c => {
      countMap[c._id.toString()] = { count: c.count, latestUrl: c.latestUrl, latestResourceType: c.latestResourceType };
    });

    const enrichedFolders = folders.map(f => ({
      ...f,
      itemCount: countMap[f._id.toString()]?.count || 0,
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
    const { name, description, color } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Folder name is required.' });
    }

    const newFolder = await GalleryFolder.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      color: color || '#0F9D58',
      createdBy: req.user._id
    });

    await newFolder.populate('createdBy', 'name profilePhoto');

    res.status(201).json({
      success: true,
      message: 'Folder created successfully.',
      data: { folder: { ...newFolder.toObject(), itemCount: 0, coverUrl: '' } }
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
    const { name, description, color } = req.body;

    const folder = await GalleryFolder.findById(id);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found.' });
    }

    if (name && name.trim()) folder.name = name.trim();
    if (description !== undefined) folder.description = description.trim();
    if (color) folder.color = color;

    await folder.save();
    await folder.populate('createdBy', 'name profilePhoto');

    const itemCount = await GalleryPhoto.countDocuments({ folder: folder._id });

    res.status(200).json({
      success: true,
      message: 'Folder updated successfully.',
      data: { folder: { ...folder.toObject(), itemCount } }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a gallery folder and its contents (deletes Cloudinary assets first)
 */
exports.deleteGalleryFolder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const folder = await GalleryFolder.findById(id);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found.' });
    }

    // 1. Find and delete all photos in this folder from Cloudinary first
    const photos = await GalleryPhoto.find({ folder: id });
    if (photos.length > 0) {
      await deleteMultipleMedia(photos);
    }

    // 2. Delete database records
    await GalleryPhoto.deleteMany({ folder: id });
    await folder.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Folder and its media contents deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

