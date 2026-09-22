const Organization = require('../models/Organization');
const JobOpening = require('../models/JobOpening');
const JobApplication = require('../models/JobApplication');
const { uploadBufferToS3 } = require('../middleware/s3UploadMiddleware');

/**
 * Check if user can create organizations and post jobs
 * Rule: Except students, anyone can create organizations and post openings
 */
const canManageJobs = (user) => {
  if (!user || !user.role) return false;
  const role = user.role.toUpperCase();
  return role !== 'STUDENT';
};

const CAN_APPLY_ROLES = ['STUDENT', 'ALUMNI', 'STAFF', 'MEMBER'];
const canApplyForJobs = (user) => {
  if (!user || !user.role) return false;
  const role = user.role.toUpperCase();
  return CAN_APPLY_ROLES.includes(role);
};

const isAdminOrWarden = (user) => {
  if (!user || !user.role) return false;
  const role = user.role.toUpperCase();
  return role === 'ADMIN' || role === 'WARDEN' || role === 'CHAIRPERSON';
};

// -------------------------------------------------------------
// Organization Controller Methods
// -------------------------------------------------------------

/**
 * GET /api/jobs/organization/my
 * Fetch the organization created by the current user
 */
exports.getMyOrganization = async (req, res) => {
  try {
    const org = await Organization.findOne({ createdBy: req.user._id });
    return res.status(200).json({
      success: true,
      data: org
    });
  } catch (error) {
    console.error('Error in getMyOrganization:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve organization profile',
      error: error.message
    });
  }
};

/**
 * POST /api/jobs/organization
 * Create or update organization profile
 */
exports.createOrUpdateOrganization = async (req, res) => {
  try {
    if (!canManageJobs(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Student accounts are not permitted to create organization profiles'
      });
    }

    const {
      name,
      industry,
      headOfficeLocation,
      operatingLocations,
      establishedYear,
      numberOfEmployees,
      yearsOperating,
      description,
      website,
      contactEmail,
      contactPhone
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Organization name is required' });
    }
    if (!industry || !industry.trim()) {
      return res.status(400).json({ success: false, message: 'Industry is required' });
    }
    if (!headOfficeLocation || !headOfficeLocation.trim()) {
      return res.status(400).json({ success: false, message: 'Head office location is required' });
    }

    let parsedLocations = [];
    if (operatingLocations) {
      if (Array.isArray(operatingLocations)) {
        parsedLocations = operatingLocations.filter(Boolean);
      } else if (typeof operatingLocations === 'string') {
        // Try JSON parse first (frontend sends JSON.stringify([...]))
        try {
          const parsed = JSON.parse(operatingLocations);
          if (Array.isArray(parsed)) {
            parsedLocations = parsed.filter(Boolean);
          } else {
            parsedLocations = operatingLocations.split(',').map(s => s.trim()).filter(Boolean);
          }
        } catch {
          parsedLocations = operatingLocations.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
    }
    if (!parsedLocations || parsedLocations.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one operating location is required' });
    }

    if (!establishedYear) {
      return res.status(400).json({ success: false, message: 'Established year is required' });
    }
    const empCount = (numberOfEmployees !== undefined && numberOfEmployees !== null ? numberOfEmployees : (yearsOperating || '')).toString().trim();
    if (!empCount) {
      return res.status(400).json({ success: false, message: 'Number of employees is required' });
    }
    if (!website || !website.trim()) {
      return res.status(400).json({ success: false, message: 'Company website is required' });
    }
    if (!contactEmail || !contactEmail.trim()) {
      return res.status(400).json({ success: false, message: 'Contact email is required' });
    }
    if (!contactPhone || !contactPhone.trim()) {
      return res.status(400).json({ success: false, message: 'Contact phone is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Company description / overview is required' });
    }

    const estYearNum = parseInt(establishedYear, 10);
    let computedYears = parseInt(empCount, 10) || 0;

    let existingOrg = await Organization.findOne({ createdBy: req.user._id });

    // Handle logo upload if provided (logo is optional)
    let logoData = existingOrg?.logo || { url: '', key: '' };
    if (req.file) {
      const s3Res = await uploadBufferToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'organization-logos'
      );
      logoData = { url: s3Res.url, key: s3Res.key };
    }

    if (existingOrg) {
      existingOrg.name = name.trim();
      existingOrg.industry = industry.trim();
      existingOrg.headOfficeLocation = headOfficeLocation.trim();
      existingOrg.operatingLocations = parsedLocations;
      existingOrg.establishedYear = estYearNum;
      existingOrg.numberOfEmployees = empCount;
      existingOrg.yearsOperating = computedYears;
      existingOrg.description = description.trim();
      existingOrg.website = website.trim();
      existingOrg.contactEmail = contactEmail.trim();
      existingOrg.contactPhone = contactPhone.trim();
      if (req.file) existingOrg.logo = logoData;

      await existingOrg.save();
      return res.status(200).json({
        success: true,
        message: 'Organization profile updated successfully',
        data: existingOrg
      });
    }

    const newOrg = await Organization.create({
      name: name.trim(),
      industry: industry.trim(),
      headOfficeLocation: headOfficeLocation.trim(),
      operatingLocations: parsedLocations,
      establishedYear: estYearNum,
      numberOfEmployees: empCount,
      yearsOperating: computedYears,
      description: description.trim(),
      website: website.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      logo: logoData,
      createdBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: 'Organization profile created successfully',
      data: newOrg
    });
  } catch (error) {
    console.error('Error in createOrUpdateOrganization:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save organization profile',
      error: error.message
    });
  }
};

// -------------------------------------------------------------
// Job Openings Controller Methods
// -------------------------------------------------------------

/**
 * GET /api/jobs
 * List all job openings with filters and search
 */
exports.getJobOpenings = async (req, res) => {
  try {
    const { search, jobType, location, experience, interviewMode, status, myOrg } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    } else if (!status && !myOrg) {
      // Default to open jobs unless viewing own or explicitly requesting all
      query.status = 'Open';
    }

    if (myOrg === 'true') {
      const userOrg = await Organization.findOne({ createdBy: req.user._id });
      if (!userOrg) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
      query.organization = userOrg._id;
    }

    if (jobType && jobType !== 'All') {
      query.jobType = jobType;
    }

    if (interviewMode && interviewMode !== 'All') {
      query.interviewMode = interviewMode;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { jobRole: searchRegex },
        { location: searchRegex },
        { educationQualification: searchRegex },
        { description: searchRegex }
      ];
    }

    let jobs = await JobOpening.find(query)
      .populate('organization')
      .populate('createdBy', 'name email role profilePhoto')
      .sort({ createdAt: -1 });

    // Auto-close jobs whose applicationDeadline has passed
    const now = new Date();
    const bulkOps = [];
    jobs = jobs.map(job => {
      const jobObj = job.toObject();
      if (jobObj.applicationDeadline && new Date(jobObj.applicationDeadline) < now && jobObj.status !== 'Closed') {
        jobObj.status = 'Closed';
        bulkOps.push({ updateOne: { filter: { _id: jobObj._id }, update: { $set: { status: 'Closed' } } } });
      }
      return jobObj;
    });
    if (bulkOps.length > 0) {
      await JobOpening.bulkWrite(bulkOps);
    }

    // Mark whether current user has already applied to each job
    const userApplications = await JobApplication.find({ applicant: req.user._id }).select('job status');
    const appliedJobMap = {};
    userApplications.forEach(app => {
      appliedJobMap[app.job.toString()] = app.status;
    });

    const enrichedJobs = jobs.map(job => ({
      ...job,
      hasApplied: Boolean(appliedJobMap[job._id.toString()]),
      applicationStatus: appliedJobMap[job._id.toString()] || null
    }));

    return res.status(200).json({
      success: true,
      count: enrichedJobs.length,
      data: enrichedJobs
    });
  } catch (error) {
    console.error('Error in getJobOpenings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve job openings',
      error: error.message
    });
  }
};

/**
 * GET /api/jobs/:id
 * Retrieve single job opening details
 */
exports.getJobDetails = async (req, res) => {
  try {
    const job = await JobOpening.findById(req.params.id)
      .populate('organization')
      .populate('createdBy', 'name email role profilePhoto');

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job opening not found' });
    }

    const myApp = await JobApplication.findOne({ job: job._id, applicant: req.user._id });

    return res.status(200).json({
      success: true,
      data: {
        ...job.toObject(),
        hasApplied: Boolean(myApp),
        myApplication: myApp
      }
    });
  } catch (error) {
    console.error('Error in getJobDetails:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve job opening',
      error: error.message
    });
  }
};

/**
 * POST /api/jobs
 * Post a new job opening inside organization
 */
exports.createJobOpening = async (req, res) => {
  try {
    if (!canManageJobs(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Student accounts are not permitted to post job openings'
      });
    }

    let organization = await Organization.findOne({ createdBy: req.user._id });
    if (!organization && !isAdminOrWarden(req.user)) {
      return res.status(400).json({
        success: false,
        message: 'Please create an Organization Profile first before posting jobs'
      });
    }

    const {
      jobRole,
      jobType,
      location,
      salaryRange,
      experienceYears,
      educationQualification,
      description,
      resumeRequired,
      documentsRequired,
      interviewMode,
      interviewTiming,
      interviewLocation,
      interviewStartDate,
      interviewEndDate,
      interviewStartTime,
      interviewEndTime,
      meetingLink,
      googleMapLink,
      offlineAddress,
      openingsCount,
      applicationDeadline,
      orgId
    } = req.body;

    if (isAdminOrWarden(req.user) && orgId) {
      organization = await Organization.findById(orgId);
    }

    if (!organization) {
      return res.status(400).json({ success: false, message: 'An active organization is required' });
    }

    if (organization.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'This organization has been blocked from posting jobs by an administrator'
      });
    }

    if (!jobRole || !jobRole.trim()) {
      return res.status(400).json({ success: false, message: 'Job role / title is required' });
    }
    if (!jobType || !jobType.trim()) {
      return res.status(400).json({ success: false, message: 'Job type is required' });
    }
    if (!location || !location.trim()) {
      return res.status(400).json({ success: false, message: 'Job location is required' });
    }
    if (!salaryRange || !salaryRange.trim()) {
      return res.status(400).json({ success: false, message: 'Salary range is required' });
    }
    if (!experienceYears || !experienceYears.trim()) {
      return res.status(400).json({ success: false, message: 'Experience requirement is required' });
    }
    if (!educationQualification || !educationQualification.trim()) {
      return res.status(400).json({ success: false, message: 'Education qualification is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Job description is required' });
    }
    if (!openingsCount || parseInt(openingsCount, 10) < 1) {
      return res.status(400).json({ success: false, message: 'Number of openings is required' });
    }
    if (!applicationDeadline) {
      return res.status(400).json({ success: false, message: 'Application deadline is required' });
    }
    if (!interviewMode || !interviewMode.trim()) {
      return res.status(400).json({ success: false, message: 'Interview mode is required' });
    }
    if (!interviewStartDate || !interviewEndDate || !interviewStartTime || !interviewEndTime) {
      return res.status(400).json({ success: false, message: 'Interview start/end dates and daily times are required' });
    }

    if (interviewMode === 'Online') {
      if (!meetingLink || !meetingLink.trim()) {
        return res.status(400).json({ success: false, message: 'Online meeting link is required for Online interviews' });
      }
    } else if (interviewMode === 'Offline / In-person') {
      if (!googleMapLink || !googleMapLink.trim()) {
        return res.status(400).json({ success: false, message: 'Google Maps location link is required for Offline interviews' });
      }
      const mapLower = googleMapLink.trim().toLowerCase();
      const isValidMapsUrl = mapLower.includes('google.com') || mapLower.includes('goo.gl');
      if (!isValidMapsUrl) {
        return res.status(400).json({ success: false, message: 'Please provide a valid Google Maps URL containing google.com' });
      }
      if (
        !offlineAddress ||
        !offlineAddress.venueName?.trim() ||
        !offlineAddress.street?.trim() ||
        !offlineAddress.city?.trim() ||
        !offlineAddress.state?.trim() ||
        !offlineAddress.pincode?.trim()
      ) {
        return res.status(400).json({ success: false, message: 'Full physical venue address (Building/Venue, Street, City, State, PIN) is required' });
      }
    }

    if (!documentsRequired || (Array.isArray(documentsRequired) && documentsRequired.length === 0)) {
      return res.status(400).json({ success: false, message: 'At least one required document must be specified' });
    }

    // Auto-generate composite interview timing string if not provided
    let computedTiming = interviewTiming ? interviewTiming.trim() : '';
    if (!computedTiming && (interviewStartDate || interviewStartTime)) {
      const dates = interviewStartDate ? (interviewEndDate && interviewEndDate !== interviewStartDate ? `${interviewStartDate} to ${interviewEndDate}` : interviewStartDate) : '';
      const times = interviewStartTime ? (interviewEndTime ? `${interviewStartTime} - ${interviewEndTime}` : interviewStartTime) : '';
      computedTiming = [dates, times].filter(Boolean).join(', ');
    }

    // Auto-generate composite interview location string if not provided
    let computedLocation = interviewLocation ? interviewLocation.trim() : '';
    if (interviewMode === 'Online') {
      computedLocation = meetingLink ? meetingLink.trim() : (computedLocation || 'Online (Google Meet / Zoom)');
    } else if (interviewMode === 'Offline / In-person' && offlineAddress) {
      const parts = [
        offlineAddress.venueName,
        offlineAddress.street,
        offlineAddress.landmark,
        offlineAddress.city,
        offlineAddress.state,
        offlineAddress.pincode
      ].filter(Boolean);
      if (parts.length > 0) {
        computedLocation = parts.join(', ');
      }
    }

    const job = await JobOpening.create({
      organization: organization._id,
      jobRole: jobRole.trim(),
      jobType: jobType || 'Full-time',
      location: location.trim(),
      salaryRange: salaryRange ? salaryRange.trim() : 'Negotiable',
      experienceYears: experienceYears ? experienceYears.trim() : '0-1 years (Fresher)',
      educationQualification: educationQualification ? educationQualification.trim() : '',
      description: description ? description.trim() : '',
      resumeRequired: resumeRequired !== undefined ? Boolean(resumeRequired) : true,
      documentsRequired: documentsRequired || [],
      interviewMode: interviewMode || 'Online',
      interviewStartDate: interviewStartDate || '',
      interviewEndDate: interviewEndDate || '',
      interviewStartTime: interviewStartTime || '',
      interviewEndTime: interviewEndTime || '',
      interviewTiming: computedTiming,
      meetingLink: meetingLink ? meetingLink.trim() : '',
      googleMapLink: googleMapLink ? (/^https?:\/\//i.test(googleMapLink.trim()) ? googleMapLink.trim() : `https://${googleMapLink.trim()}`) : '',
      offlineAddress: offlineAddress || {},
      interviewLocation: computedLocation,
      openingsCount: openingsCount ? parseInt(openingsCount, 10) : 1,
      applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
      status: 'Open',
      createdBy: req.user._id
    });

    const populated = await JobOpening.findById(job._id)
      .populate('organization')
      .populate('createdBy', 'name email role');

    return res.status(201).json({
      success: true,
      message: 'Job opening posted successfully',
      data: populated
    });
  } catch (error) {
    console.error('Error in createJobOpening:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to post job opening',
      error: error.message
    });
  }
};

/**
 * PUT /api/jobs/:id
 * Update an existing job opening
 */
exports.updateJobOpening = async (req, res) => {
  try {
    const job = await JobOpening.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job opening not found' });
    }

    const isOwner = job.createdBy.toString() === req.user._id.toString();
    // Only the creator can edit. Admins can only delete.
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Only the job creator can edit this posting' });
    }

    const updatableFields = [
      'jobRole', 'jobType', 'location', 'salaryRange', 'experienceYears',
      'educationQualification', 'description', 'resumeRequired',
      'documentsRequired', 'interviewMode', 'interviewStartDate',
      'interviewEndDate', 'interviewStartTime', 'interviewEndTime',
      'interviewTiming', 'meetingLink', 'googleMapLink', 'offlineAddress',
      'interviewLocation', 'openingsCount', 'applicationDeadline'
    ];
    // Note: 'status' is deliberately excluded — it is auto-derived from applicationDeadline

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    });

    // Recalculate timing if dates or times were updated and timing not explicitly passed
    if (req.body.interviewStartDate || req.body.interviewStartTime) {
      const sDate = job.interviewStartDate;
      const eDate = job.interviewEndDate;
      const sTime = job.interviewStartTime;
      const eTime = job.interviewEndTime;
      const dates = sDate ? (eDate && eDate !== sDate ? `${sDate} to ${eDate}` : sDate) : '';
      const times = sTime ? (eTime ? `${sTime} - ${eTime}` : sTime) : '';
      job.interviewTiming = [dates, times].filter(Boolean).join(', ');
    }

    // Recalculate location summary
    if (job.interviewMode === 'Online') {
      if (job.meetingLink) {
        job.interviewLocation = job.meetingLink;
      }
    } else if (job.interviewMode === 'Offline / In-person' && job.offlineAddress) {
      const parts = [
        job.offlineAddress.venueName,
        job.offlineAddress.street,
        job.offlineAddress.landmark,
        job.offlineAddress.city,
        job.offlineAddress.state,
        job.offlineAddress.pincode
      ].filter(Boolean);
      if (parts.length > 0) {
        job.interviewLocation = parts.join(', ');
      }
    }

    await job.save();

    const populated = await JobOpening.findById(job._id)
      .populate('organization')
      .populate('createdBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Job opening updated successfully',
      data: populated
    });
  } catch (error) {
    console.error('Error in updateJobOpening:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update job opening',
      error: error.message
    });
  }
};

/**
 * DELETE /api/jobs/:id
 * Delete a job opening and its applications
 */
exports.deleteJobOpening = async (req, res) => {
  try {
    const job = await JobOpening.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job opening not found' });
    }

    const isOwner = job.createdBy.toString() === req.user._id.toString();
    if (!isOwner && !isAdminOrWarden(req.user)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this job' });
    }

    await JobApplication.deleteMany({ job: job._id });
    await JobOpening.findByIdAndDelete(job._id);

    return res.status(200).json({
      success: true,
      message: 'Job opening and associated applications deleted successfully',
      data: { _id: job._id }
    });
  } catch (error) {
    console.error('Error in deleteJobOpening:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete job opening',
      error: error.message
    });
  }
};

// -------------------------------------------------------------
// Job Application Controller Methods
// -------------------------------------------------------------

/**
 * POST /api/jobs/:id/apply
 * Apply to a job opening with details and optional resume file
 */
exports.applyForJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await JobOpening.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job opening not found' });
    }

    if (job.status !== 'Open') {
      return res.status(400).json({ success: false, message: 'This job opening is closed' });
    }

    if (!canApplyForJobs(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only students, alumni, staff, and members can apply for job openings'
      });
    }

    const existingApp = await JobApplication.findOne({ job: jobId, applicant: req.user._id });
    if (existingApp) {
      return res.status(400).json({ success: false, message: 'You have already applied for this position' });
    }

    const {
      applicantName,
      applicantEmail,
      applicantPhone,
      experience,
      education,
      coverNote
    } = req.body;

    let resumeData = { url: '', key: '', originalName: '', size: 0 };
    if (req.file) {
      const s3Res = await uploadBufferToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'job-resumes'
      );
      resumeData = {
        url: s3Res.url,
        key: s3Res.key,
        originalName: req.file.originalname,
        size: req.file.size || req.file.buffer?.length || 0
      };
    } else if (job.resumeRequired) {
      return res.status(400).json({ success: false, message: 'A resume document is required for this role' });
    }

    const application = await JobApplication.create({
      job: jobId,
      applicant: req.user._id,
      applicantName: (applicantName || req.user.name || '').trim(),
      applicantEmail: (applicantEmail || req.user.email || '').trim(),
      applicantPhone: (applicantPhone || req.user.phone || '').trim(),
      experience: experience ? experience.trim() : '',
      education: education ? education.trim() : '',
      coverNote: coverNote ? coverNote.trim() : '',
      resume: resumeData,
      status: 'Applied'
    });

    // Increment applicants counter on the job
    await JobOpening.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully! The organization will review your profile.',
      data: application
    });
  } catch (error) {
    console.error('Error in applyForJob:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
};

/**
 * GET /api/jobs/my-applications
 * Retrieve list of all applications made by current user
 */
exports.getMyApplications = async (req, res) => {
  try {
    if (!canApplyForJobs(req.user)) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    const applications = await JobApplication.find({ applicant: req.user._id })
      .populate({
        path: 'job',
        populate: { path: 'organization' }
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    console.error('Error in getMyApplications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve applications',
      error: error.message
    });
  }
};

/**
 * GET /api/jobs/:id/applicants
 * List all applicants for a job (employer or admin)
 */
exports.getJobApplicants = async (req, res) => {
  try {
    const job = await JobOpening.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job opening not found' });
    }

    const isOwner = job.createdBy.toString() === req.user._id.toString();
    if (!isOwner && !isAdminOrWarden(req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view applicants' });
    }

    const applicants = await JobApplication.find({ job: job._id })
      .populate('applicant', 'name email phone role profilePhoto')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applicants.length,
      data: applicants
    });
  } catch (error) {
    console.error('Error in getJobApplicants:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve applicants',
      error: error.message
    });
  }
};

/**
 * PATCH /api/jobs/applications/:appId/status
 * Update status of an application (employer or admin)
 */
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, statusNote } = req.body;
    const application = await JobApplication.findById(req.params.appId).populate('job');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const isOwner = application.job.createdBy.toString() === req.user._id.toString();
    if (!isOwner && !isAdminOrWarden(req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to update application status' });
    }

    if (status) application.status = status;
    if (statusNote !== undefined) application.statusNote = statusNote.trim();
    await application.save();

    return res.status(200).json({
      success: true,
      message: `Applicant status updated to ${status}`,
      data: application
    });
  } catch (error) {
    console.error('Error in updateApplicationStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: error.message
    });
  }
};

/**
 * PATCH /api/jobs/organization/:id/toggle-block
 * Admin-only: Block or unblock an organization from posting jobs
 */
exports.toggleBlockOrganization = async (req, res) => {
  try {
    if (!isAdminOrWarden(req.user)) {
      return res.status(403).json({ success: false, message: 'Only administrators can block or unblock organizations' });
    }
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }
    org.isBlocked = !org.isBlocked;
    if (org.isBlocked) {
      org.blockedAt = new Date();
      org.blockedReason = req.body.reason || 'Blocked by administrator';
    } else {
      org.blockedAt = null;
      org.blockedReason = '';
    }
    await org.save();
    return res.status(200).json({
      success: true,
      message: org.isBlocked ? 'Organization has been blocked from posting jobs' : 'Organization has been unblocked',
      data: org
    });
  } catch (error) {
    console.error('Error in toggleBlockOrganization:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update organization status',
      error: error.message
    });
  }
};

