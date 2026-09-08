const GalleryPhoto = require('../models/GalleryPhoto');
const { uploadImage, deleteImage } = require('../config/cloudinary');

/**
 * Get all gallery photos (newest first)
 */
exports.getGalleryPhotos = async (req, res, next) => {
  try {
    const photos = await GalleryPhoto.find()
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name');

    res.status(200).json({
      success: true,
      data: { photos }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload a photo to the community gallery
 */
exports.uploadGalleryPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a file to upload.' });
    }

    const { caption } = req.body;
    const isVideo = req.file.mimetype.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';

    // Upload to Cloudinary using base64 helper
    const uploadResult = await uploadImage(req.file.buffer, 'hostel-community/gallery', req.file.mimetype, resourceType);

    const newPhoto = await GalleryPhoto.create({
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      caption: caption || '',
      resourceType,
      uploadedBy: req.user._id
    });

    await newPhoto.populate('uploadedBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Photo uploaded to gallery successfully.',
      data: { photo: newPhoto }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a photo from the gallery
 */
exports.deleteGalleryPhoto = async (req, res, next) => {
  try {
    const { id } = req.params;

    const photo = await GalleryPhoto.findById(id);
    if (!photo) {
      return res.status(404).json({ success: false, message: 'Photo not found.' });
    }

    // Delete image from Cloudinary media storage
    if (photo.publicId) {
      await deleteImage(photo.publicId, photo.resourceType || 'image');
    }

    // Delete record from Database
    await photo.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Photo deleted from gallery successfully.'
    });
  } catch (error) {
    next(error);
  }
};
