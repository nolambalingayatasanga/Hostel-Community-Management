const HostelOrganization = require('../models/HostelOrganization');
const User = require('../models/User');

// Helper to check if requester is Admin or Administrator
const isAdmin = (user) => user && ['ADMIN', 'ADMINISTRATOR'].includes(user.role);

/**
 * GET /api/organizations
 * Public/Protected: Fetch list of hostel organizations
 */
exports.getOrganizations = async (req, res) => {
  try {
    await HostelOrganization.seedDefaults();

    const isUserAdmin = isAdmin(req.user);
    const query = isUserAdmin ? {} : { isActive: true };

    const organizations = await HostelOrganization.find(query).sort({ order: 1, name: 1 });

    // Count users associated with each organization for admin dashboard
    const userCounts = await User.aggregate([
      {
        $project: {
          org: { $ifNull: ['$hostelLocation', '$organization'] }
        }
      },
      {
        $match: { org: { $exists: true, $ne: '' } }
      },
      {
        $group: { _id: '$org', count: { $sum: 1 } }
      }
    ]);
    const countMap = {};
    userCounts.forEach(c => {
      if (c._id && typeof c._id === 'string') {
        countMap[c._id.trim()] = c.count;
      }
    });

    const data = organizations.map(org => {
      const trimmedName = (org.name || '').trim();
      return {
        ...org.toObject(),
        userCount: countMap[trimmedName] || 0
      };
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Error fetching hostel organizations:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch organizations' });
  }
};

/**
 * POST /api/organizations
 * Admin only: Create a new organization
 */
exports.createOrganization = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Only administrators can create organizations' });
    }

    const { name, code, type, city, address, contactPerson, contactPhone, isActive, order } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Organization name is required' });
    }

    const existing = await HostelOrganization.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An organization with this name already exists' });
    }

    const highestOrder = await HostelOrganization.findOne().sort('-order');
    const newOrder = order !== undefined ? Number(order) : (highestOrder ? (highestOrder.order || 0) + 1 : 1);

    const organization = await HostelOrganization.create({
      name: name.trim(),
      code: code ? code.trim() : '',
      type: type || 'Boys Hostel',
      city: city ? city.trim() : '',
      address: address ? address.trim() : '',
      contactPerson: contactPerson ? contactPerson.trim() : '',
      contactPhone: contactPhone ? contactPhone.trim() : '',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      order: newOrder,
      createdBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: organization
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create organization' });
  }
};

/**
 * PUT /api/organizations/:id
 * Admin only: Update an existing organization
 */
exports.updateOrganization = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Only administrators can update organizations' });
    }

    const { id } = req.params;
    const { name, code, type, city, address, contactPerson, contactPhone, isActive, order } = req.body;

    const organization = await HostelOrganization.findById(id);
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    const oldName = organization.name;

    if (name && name.trim() && name.trim() !== oldName) {
      const duplicate = await HostelOrganization.findOne({ name: name.trim(), _id: { $ne: id } });
      if (duplicate) {
        return res.status(400).json({ success: false, message: 'Another organization with this name already exists' });
      }
      organization.name = name.trim();

      // Cascade update all users who were assigned to oldName
      const escapedOld = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await User.updateMany(
        {
          $or: [
            { hostelLocation: oldName },
            { organization: oldName },
            { hostelLocation: new RegExp(`^${escapedOld}$`, 'i') },
            { organization: new RegExp(`^${escapedOld}$`, 'i') }
          ]
        },
        { $set: { hostelLocation: name.trim(), organization: name.trim() } }
      );
    }

    if (code !== undefined) organization.code = code.trim();
    if (type !== undefined) organization.type = type;
    if (city !== undefined) organization.city = city.trim();
    if (address !== undefined) organization.address = address.trim();
    if (contactPerson !== undefined) organization.contactPerson = contactPerson.trim();
    if (contactPhone !== undefined) organization.contactPhone = contactPhone.trim();
    if (isActive !== undefined) organization.isActive = Boolean(isActive);
    if (order !== undefined) organization.order = Number(order);

    await organization.save();

    return res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      data: organization
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update organization' });
  }
};

/**
 * DELETE /api/organizations/:id
 * Admin only: Delete an organization
 */
exports.deleteOrganization = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Only administrators can delete organizations' });
    }

    const { id } = req.params;
    const organization = await HostelOrganization.findById(id);
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    // Check if users are currently assigned to this organization
    const orgName = (organization.name || '').trim();
    const escapedOrg = orgName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const assignedCount = await User.countDocuments({
      $or: [
        { hostelLocation: orgName },
        { organization: orgName },
        { hostelLocation: new RegExp(`^${escapedOrg}$`, 'i') },
        { organization: new RegExp(`^${escapedOrg}$`, 'i') }
      ]
    });

    if (assignedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${assignedCount} user(s) are currently assigned to "${organization.name}". This organization cannot be deleted until all users under it are reassigned to another organization.`
      });
    }

    await HostelOrganization.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Organization deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete organization' });
  }
};
