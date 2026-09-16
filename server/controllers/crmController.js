const CustomField = require('../models/CustomField');
const StatusGroup = require('../models/StatusGroup');
const Status = require('../models/Status');
const User = require('../models/User');
const TableLayout = require('../models/TableLayout');

/**
 * Fetch all crm metadata including columns, groups, statuses, and assignees
 */
exports.getMetadata = async (req, res, next) => {
  try {
    let customFields = await CustomField.find({}).sort({ order: 1 });

    // Auto-ensure Relative Name and Channels exist
    const slugs = customFields.map(f => (f.slug || '').toLowerCase());
    let added = false;
    let maxOrder = customFields.reduce((max, f) => Math.max(max, f.order || 0), 7);

    if (!slugs.includes('relativename')) {
      maxOrder += 1;
      const f = await CustomField.create({
        name: 'Relative Name',
        slug: 'relativeName',
        type: 'text',
        isInternal: true,
        order: maxOrder,
        isVisible: true
      });
      customFields.push(f);
      added = true;
    }

    if (!slugs.includes('channels')) {
      maxOrder += 1;
      const f = await CustomField.create({
        name: 'Channels',
        slug: 'channels',
        type: 'text',
        isInternal: true,
        order: maxOrder,
        isVisible: true
      });
      customFields.push(f);
      added = true;
    }

    if (!slugs.includes('role')) {
      maxOrder += 1;
      const f = await CustomField.create({
        name: 'Role',
        slug: 'role',
        type: 'select',
        options: ['ADMIN', 'WARDEN', 'MEMBER', 'STAFF', 'STUDENT', 'ALUMNI'],
        isInternal: true,
        order: maxOrder,
        isVisible: true
      });
      customFields.push(f);
      added = true;
    }

    if (!slugs.includes('logindetails')) {
      maxOrder += 1;
      const f = await CustomField.create({
        name: 'Login Details',
        slug: 'loginDetails',
        type: 'text',
        isInternal: true,
        order: maxOrder,
        isVisible: true
      });
      customFields.push(f);
      added = true;
    }

    if (added) {
      customFields.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    // Only Admin can see Login Details column in table metadata
    const isAdmin = req.user && req.user.role === 'ADMIN';
    const returnedCustomFields = isAdmin
      ? customFields
      : customFields.filter(f => (f.slug || '').toLowerCase() !== 'logindetails');

    const statusGroups = await StatusGroup.find({}).populate({
      path: 'statuses',
      options: { sort: { order: 1 } }
    }).sort({ order: 1 });
    const statuses = await Status.find({}).sort({ order: 1 });
    const agents = await User.find({ role: { $in: ['ADMIN', 'WARDEN', 'STAFF'] } }, 'name email phone role');
    const tableLayouts = req.user ? await TableLayout.find({ user: req.user._id }) : [];

    res.status(200).json({
      success: true,
      data: {
        customFields: returnedCustomFields,
        statusGroups,
        statuses,
        teams: [],
        agents,
        tableLayouts
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create custom field
 */
exports.createCustomField = async (req, res, next) => {
  try {
    const { name, type, options, order } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    
    // Check if slug already exists
    const existing = await CustomField.findOne({ slug });
    if (existing) {
      return res.status(400).json({ success: false, message: `Field with key '${slug}' already exists.` });
    }

    const newField = await CustomField.create({
      name,
      slug,
      type,
      options: options || [],
      order: order || 0,
      isVisible: true,
      isInternal: false
    });
    res.status(217).json({ success: true, data: newField });
  } catch (err) {
    next(err);
  }
};

/**
 * Save field layouts (visibility and ordering)
 */
exports.saveLayout = async (req, res, next) => {
  try {
    const fields = req.body;
    for (const f of fields) {
      await CustomField.findByIdAndUpdate(f._id, {
        isVisible: f.isVisible,
        order: f.order
      });
    }
    res.status(200).json({ success: true, message: 'Layout configuration saved successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete custom field
 */
exports.deleteCustomField = async (req, res, next) => {
  try {
    await CustomField.findByIdAndDelete(req.params.id);
    // Remove custom field entries from users
    await User.updateMany({}, {
      $pull: { lead_data: { customField: req.params.id } }
    });
    res.status(200).json({ success: true, message: 'Custom field deleted.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Fetch usage count of a custom field
 */
exports.fetchFieldUsage = async (req, res, next) => {
  try {
    const count = await User.countDocuments({
      'lead_data': {
        $elemMatch: {
          customField: req.params.id,
          value: { $ne: '' }
        }
      }
    });
    res.status(200).json({ success: true, usage: count });
  } catch (err) {
    next(err);
  }
};

/**
 * Create status group
 */
exports.createStatusGroup = async (req, res, next) => {
  try {
    const { name } = req.body;
    const order = (await StatusGroup.countDocuments({})) + 1;
    const newGroup = await StatusGroup.create({ name, order });
    res.status(217).json({ success: true, data: newGroup });
  } catch (err) {
    next(err);
  }
};

/**
 * Update status group
 */
exports.updateStatusGroup = async (req, res, next) => {
  try {
    const updated = await StatusGroup.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete status group and its statuses
 */
exports.deleteStatusGroup = async (req, res, next) => {
  try {
    const group = await StatusGroup.findById(req.params.id);
    if (group) {
      await Status.deleteMany({ statusGroup: group._id });
    }
    await StatusGroup.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Status group and its stages deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Reorder status groups
 */
exports.reorderStatusGroups = async (req, res, next) => {
  try {
    const { statuses } = req.body;
    for (const g of statuses) {
      await StatusGroup.findByIdAndUpdate(g._id, { order: g.order });
    }
    res.status(200).json({ success: true, message: 'Status groups reordered.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Create status stage
 */
exports.createStatus = async (req, res, next) => {
  try {
    const { name, description, statusGroup } = req.body;
    const order = (await Status.countDocuments({ statusGroup })) + 1;
    const newStatus = await Status.create({ name, description, statusGroup, order });
    
    await StatusGroup.findByIdAndUpdate(statusGroup, {
      $push: { statuses: newStatus._id }
    });
    res.status(217).json({ success: true, data: newStatus });
  } catch (err) {
    next(err);
  }
};

/**
 * Update status stage
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const { name, description, statusGroup } = req.body;
    const oldStatus = await Status.findById(req.params.id);
    if (!oldStatus) {
      return res.status(404).json({ success: false, message: 'Status stage not found.' });
    }

    const groupChanged = statusGroup && String(statusGroup) !== String(oldStatus.statusGroup);
    
    if (groupChanged) {
      await StatusGroup.findByIdAndUpdate(oldStatus.statusGroup, {
        $pull: { statuses: oldStatus._id }
      });
      await StatusGroup.findByIdAndUpdate(statusGroup, {
        $push: { statuses: oldStatus._id }
      });
    }

    const updated = await Status.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete status stage
 */
exports.deleteStatus = async (req, res, next) => {
  try {
    const status = await Status.findById(req.params.id);
    if (status) {
      await StatusGroup.findByIdAndUpdate(status.statusGroup, {
        $pull: { statuses: status._id }
      });
    }
    await Status.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Status stage deleted.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Order status stages inside and across status groups
 */
exports.orderStatuses = async (req, res, next) => {
  try {
    const { sourceGroup, sourceArray, destinationGroup, destinationArray, status } = req.body;
    
    if (sourceGroup !== destinationGroup) {
      await Status.findByIdAndUpdate(status, { statusGroup: destinationGroup });
    }

    await StatusGroup.findByIdAndUpdate(sourceGroup, { statuses: sourceArray });
    await StatusGroup.findByIdAndUpdate(destinationGroup, { statuses: destinationArray });

    for (let i = 0; i < sourceArray.length; i++) {
      await Status.findByIdAndUpdate(sourceArray[i], { order: i });
    }
    for (let i = 0; i < destinationArray.length; i++) {
      await Status.findByIdAndUpdate(destinationArray[i], { order: i });
    }

    res.status(200).json({ success: true, message: 'Statuses reordered.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all saved table layouts for the logged-in user
 */
exports.getTabLayouts = async (req, res, next) => {
  try {
    const layouts = await TableLayout.find({ user: req.user._id });
    res.status(200).json({ success: true, data: layouts });
  } catch (err) {
    next(err);
  }
};

/**
 * Save or update table column layout (order & hidden columns) for a specific tab
 */
exports.saveTabLayout = async (req, res, next) => {
  try {
    const { tabId } = req.params;
    const { columnOrder, hiddenColumns } = req.body;

    if (!tabId) {
      return res.status(400).json({ success: false, message: 'tabId is required' });
    }

    const updated = await TableLayout.findOneAndUpdate(
      { user: req.user._id, tabId },
      {
        user: req.user._id,
        tabId,
        columnOrder: columnOrder || [],
        hiddenColumns: hiddenColumns || []
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};
