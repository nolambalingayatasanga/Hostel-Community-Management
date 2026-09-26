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

    // Auto-migrate any legacy age field in customFields to DOB
    for (const f of customFields) {
      if ((f.slug || '').toLowerCase() === 'age' || (f.name || '').toLowerCase() === 'age') {
        f.name = 'DOB';
        f.slug = 'dob';
        f.type = 'date';
        f.isInternal = true;
        await CustomField.findByIdAndUpdate(f._id, {
          name: 'DOB',
          slug: 'dob',
          type: 'date',
          isInternal: true
        });
      }
    }

    // Auto-ensure Employment options contain Student and Intern
    for (const f of customFields) {
      if ((f.slug || '').toLowerCase().includes('employment') || (f.name || '').toLowerCase() === 'employment') {
        const requiredOptions = ['Student', 'Intern', 'Employed', 'Business Owner', 'Entrepreneur', 'Higher Studies', 'Government Service', 'Retired', 'Unemployed'];
        const current = f.options || [];
        if (!current.includes('Student') || !current.includes('Intern')) {
          f.options = requiredOptions;
          await CustomField.findByIdAndUpdate(f._id, { options: requiredOptions });
        }
      }
    }

    // Auto-migrate Course to Branch, Start Year to College Joining, End Year to Graduation Year
    for (const f of customFields) {
      if ((f.slug || '').toLowerCase() === 'education.course' && f.name !== 'Branch') {
        f.name = 'Branch';
        await CustomField.findByIdAndUpdate(f._id, { name: 'Branch' });
      }
      if ((f.slug || '').toLowerCase() === 'education.startyear' && f.name !== 'College Joining') {
        f.name = 'College Joining';
        await CustomField.findByIdAndUpdate(f._id, { name: 'College Joining' });
      }
      if ((f.slug || '').toLowerCase() === 'education.endyear' && f.name !== 'Graduation Year') {
        f.name = 'Graduation Year';
        await CustomField.findByIdAndUpdate(f._id, { name: 'Graduation Year' });
      }
    }

    // Auto-ensure default columns and required schema fields exist
    const slugs = customFields.map(f => (f.slug || '').toLowerCase());
    let added = false;
    let maxOrder = customFields.reduce((max, f) => Math.max(max, f.order || 0), 7);

    const defaultFieldsToEnsure = [
      { name: 'Name', slug: 'name', type: 'text', isInternal: true, order: 0 },
      { name: 'Email', slug: 'email', type: 'email', isInternal: true, order: 1 },
      { name: 'Phone', slug: 'phone', type: 'text', isInternal: true, order: 2 },
      { name: 'Channels', slug: 'channels', type: 'text', isInternal: true, order: 3 },
      { name: 'College', slug: 'education.college', type: 'text', isInternal: true, order: 4 },
      { name: 'Branch', slug: 'education.course', type: 'text', isInternal: true, order: 5 },
      { name: 'DOB', slug: 'dob', type: 'date', isInternal: true, order: 6 },
      { name: 'College Joining', slug: 'education.startYear', type: 'number', isInternal: true, order: 7 },
      { name: 'Graduation Year', slug: 'education.endYear', type: 'number', isInternal: true, order: 8 },
      { name: 'Role', slug: 'role', type: 'select', options: ['ADMIN', 'WARDEN', 'MEMBER', 'STAFF', 'STUDENT', 'ALUMNI'], isInternal: true, order: 9 },
      { name: 'Relative Name', slug: 'relativeName', type: 'text', isInternal: true, order: 10 },
      { name: 'Login Details', slug: 'loginDetails', type: 'text', isInternal: true, order: 11 },
    ];

    for (const df of defaultFieldsToEnsure) {
      if (!slugs.includes(df.slug.toLowerCase())) {
        maxOrder += 1;
        const created = await CustomField.create({
          ...df,
          order: maxOrder,
          isVisible: true
        });
        customFields.push(created);
        slugs.push(df.slug.toLowerCase());
        added = true;
      }
    }

    const defaultSlugOrders = {
      'name': 0,
      'email': 1,
      'phone': 2,
      'channels': 3,
      'education.college': 4,
      'education.course': 5,
      'dob': 6,
      'education.startyear': 7,
      'education.endyear': 8,
      'role': 9,
      'gender': 10,
      'slno': 11,
      'registrationnumber': 12,
      'receiptno': 13,
      'locallanguagedetails': 14,
      'adhaar': 15,
      'relativename': 16,
      'address.street': 17,
      'address.area': 18,
      'address.landmark': 19,
      'address.location': 20,
      'address.city': 21,
      'address.district': 22,
      'address.taluk': 23,
      'address.pincode': 24,
      'education.startmonth': 25,
      'education.endmonth': 26,
      'employment.occupation': 27,
      'employment.organization': 28,
      'employment.industry': 29,
      'employment.worklocation': 30,
      'employment.employmentstatus': 31,
      'employment.businessname': 32,
      'employment.businesstype': 33,
      'logindetails': 34,
    };

    for (const f of customFields) {
      const s = (f.slug || '').toLowerCase();
      if (defaultSlugOrders[s] !== undefined && f.order !== defaultSlugOrders[s]) {
        f.order = defaultSlugOrders[s];
        await CustomField.findByIdAndUpdate(f._id, { order: defaultSlugOrders[s] });
      }
    }

    customFields.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    // Filter out obsolete Status column
    customFields = customFields.filter(f => (f.slug || '').toLowerCase() !== 'status' && (f.name || '').toLowerCase() !== 'status');

    // Only Admin can see Login Details column in table metadata
    const isAdmin = req.user && req.user.role === 'ADMIN';
    const returnedCustomFields = isAdmin
      ? customFields
      : customFields.filter(f => (f.slug || '').toLowerCase() !== 'logindetails');

    // Delete legacy Inquiry status group from DB if it exists so it doesn't appear in Users tabs
    await StatusGroup.deleteMany({ name: { $in: [/^inquiry$/i, /^enquiry$/i] } }).catch(() => {});

    const statusGroups = await StatusGroup.find({
      name: { $nin: [/^inquiry$/i, /^enquiry$/i] }
    }).populate({
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
      { returnDocument: 'after', upsert: true }
    );

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};
