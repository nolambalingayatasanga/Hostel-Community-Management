const Facility = require('../models/Facility');
const FacilityCategory = require('../models/FacilityCategory');
const { uploadBufferToS3 } = require('../middleware/s3UploadMiddleware');

/**
 * GET /api/facilities/categories
 * Get all facility categories (seeds defaults if none exist)
 */
exports.getCategories = async (req, res) => {
  try {
    await FacilityCategory.seedDefaults();
    const categories = await FacilityCategory.find().sort({ order: 1, createdAt: 1 });
    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve facility categories',
      error: error.message
    });
  }
};

/**
 * POST /api/facilities/categories
 * Create a new category (Admin / Warden only)
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const trimmedName = name.trim();
    const existing = await FacilityCategory.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists' });
    }

    const count = await FacilityCategory.countDocuments();
    const category = await FacilityCategory.create({
      name: trimmedName,
      icon: icon || 'ApartmentIcon',
      order: count + 1
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

/**
 * PUT /api/facilities/categories/:id
 * Update category name (Admin / Warden only)
 */
exports.updateCategory = async (req, res) => {
  try {
    const { name, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const category = await FacilityCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const oldName = category.name;
    const newName = name.trim();

    category.name = newName;
    if (icon) category.icon = icon;
    await category.save();

    // Cascade update facilities using the old category name
    if (oldName !== newName) {
      await Facility.updateMany({ category: oldName }, { category: newName });
    }

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

/**
 * DELETE /api/facilities/categories/:id
 * Delete a category (Admin / Warden only)
 */
exports.deleteCategory = async (req, res) => {
  try {
    const category = await FacilityCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await FacilityCategory.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
};

/**
 * GET /api/facilities
 * Fetch all facilities (accessible to all authenticated users)
 */
exports.getFacilities = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = { isActive: true };

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { timings: regex },
        { category: regex }
      ];
    }

    if (category && category !== 'ALL') {
      filter.category = category;
    }

    const facilities = await Facility.find(filter)
      .sort({ createdAt: 1 })
      .populate('createdBy', 'name role')
      .populate('updatedBy', 'name role');

    return res.status(200).json({
      success: true,
      data: facilities,
      count: facilities.length
    });
  } catch (error) {
    console.error('Error fetching facilities:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve facilities',
      error: error.message
    });
  }
};

/**
 * GET /api/facilities/:id
 * Get single facility
 */
exports.getFacilityById = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }
    return res.status(200).json({ success: true, data: facility });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/facilities
 * Create a new facility (Restricted to Admin / Warden / Access user)
 */
exports.createFacility = async (req, res) => {
  try {
    const { name, category, timings, tagline } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Facility title is required' });
    }

    let photo = req.body.photo ? String(req.body.photo).trim() : '';

    if (req.file) {
      try {
        const uploadRes = await uploadBufferToS3(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          'facilities'
        );
        if (uploadRes?.url) {
          photo = uploadRes.url;
        }
      } catch (uploadErr) {
        console.error('Facility photo upload error:', uploadErr);
      }
    }

    if (!photo) {
      return res.status(400).json({ success: false, message: 'Facility photo is required' });
    }

    const newFacility = await Facility.create({
      name: name.trim(),
      category: (category || 'Food & Dining').trim(),
      photo,
      timings: (timings || '24/7 Available').trim(),
      tagline: (tagline || '').trim(),
      createdBy: req.user?._id
    });

    return res.status(201).json({
      success: true,
      message: 'Facility added successfully',
      data: newFacility
    });
  } catch (error) {
    console.error('Error creating facility:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add facility',
      error: error.message
    });
  }
};

/**
 * PUT /api/facilities/:id
 * Update an existing facility (Restricted to Admin / Warden / Access user)
 */
exports.updateFacility = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }

    const { name, category, timings, tagline, isActive } = req.body;

    if (name && name.trim()) facility.name = name.trim();
    if (category) facility.category = category.trim();
    if (timings !== undefined) facility.timings = timings.trim();
    if (tagline !== undefined) facility.tagline = tagline.trim();
    if (isActive !== undefined) facility.isActive = Boolean(isActive);

    if (req.body.photo) {
      facility.photo = String(req.body.photo).trim();
    }

    if (req.file) {
      try {
        const uploadRes = await uploadBufferToS3(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          'facilities'
        );
        if (uploadRes?.url) {
          facility.photo = uploadRes.url;
        }
      } catch (uploadErr) {
        console.error('Facility photo upload error on edit:', uploadErr);
      }
    }

    facility.updatedBy = req.user?._id;
    await facility.save();

    return res.status(200).json({
      success: true,
      message: 'Facility updated successfully',
      data: facility
    });
  } catch (error) {
    console.error('Error updating facility:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update facility',
      error: error.message
    });
  }
};

/**
 * DELETE /api/facilities/:id
 * Delete a facility (Restricted to Admin / Warden / Access user)
 */
exports.deleteFacility = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }

    await Facility.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Facility removed successfully'
    });
  } catch (error) {
    console.error('Error deleting facility:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete facility',
      error: error.message
    });
  }
};
