import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Work as WorkIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import { useJobDraft } from '../../context/JobDraftContext';
import API from '../../api';

// Subcomponents
import {
  JobPageHeader,
  JobNavigationTabs,
  JobToolbar,
  JobTableRow,
  JobCardItem,
  JobTableSkeleton,
  JobCardsSkeleton,
  JobPagination,
  MyApplicationsView,
  MyOrgView,
  OrganizationDialog,
  JobPostDialog,
  JobDetailsDialog,
  ApplyJobDialog,
  ApplicantsDialog,
  DeleteJobDialog
} from '../../components/Jobs';

// Re-export constants for backward compatibility
export {
  EDUCATION_DEGREES,
  REQUIRED_DOCUMENTS_OPTIONS,
  INDUSTRIES,
  JOB_TYPES,
  INDIA_LOCATIONS
} from '../../constants/jobConstants';

export default function JobOpenings() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Role permissions
  const userRole = (user?.role || '').toUpperCase();
  const canCreateOrganization = userRole !== 'STUDENT';
  const canApplyForJobs = ['STUDENT', 'ALUMNI', 'STAFF', 'MEMBER'].includes(userRole);
  const isAdmin = userRole === 'ADMIN' || userRole === 'WARDEN' || userRole === 'CHAIRPERSON';

  // Navigation tab: 'explore' | 'closed' | 'my-applications' | 'my-org'
  const [activeTab, setActiveTab] = useState('explore');

  useEffect(() => {
    if (activeTab === 'my-applications' && !canApplyForJobs) {
      setActiveTab('explore');
    }
  }, [activeTab, canApplyForJobs]);

  // Jobs data state
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // User's organization state
  const [organization, setOrganization] = useState(null);
  const [orgLoading, setOrgLoading] = useState(false);

  // User's applications state
  const [myApplications, setMyApplications] = useState([]);
  const [myAppsLoading, setMyAppsLoading] = useState(false);

  // Filter & Search state
  const [jobTypeFilter, setJobTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Draft Context
  const {
    jobDialogOpen,
    setJobDialogOpen,
    jobForm,
    setJobForm,
    editingJob,
    setEditingJob,
    resetJobDraft,

    orgDialogOpen,
    setOrgDialogOpen,
    orgForm,
    setOrgForm,
    resetOrgDraft,

    applyDialogOpen,
    setApplyDialogOpen,
    applyForm,
    setApplyForm,
    applyingJob,
    setApplyingJob,
    resetApplyDraft
  } = useJobDraft();

  const [orgLogoFile, setOrgLogoFile] = useState(null);
  const [orgLogoPreview, setOrgLogoPreview] = useState('');
  const [savingOrg, setSavingOrg] = useState(false);
  const [savingJob, setSavingJob] = useState(false);

  // View Job Details modal
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingJob, setViewingJob] = useState(null);

  // Resume File & Submitting state for Apply dialog
  const [resumeFile, setResumeFile] = useState(null);
  const [submittingApp, setSubmittingApp] = useState(false);

  // View Applicants modal (for job creator/admin)
  const [applicantsDialogOpen, setApplicantsDialogOpen] = useState(false);
  const [applicantsJob, setApplicantsJob] = useState(null);
  const [applicantsList, setApplicantsList] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  // Delete Confirmation modal
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingJob, setDeletingJob] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // -------------------------------------------------------------
  // Data Fetching
  // -------------------------------------------------------------
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/jobs?status=all');
      if (res.data?.success) {
        setJobs(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load job openings', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  const fetchMyOrganization = useCallback(async () => {
    if (!canCreateOrganization) return;
    try {
      setOrgLoading(true);
      const res = await API.get('/jobs/organization/my');
      if (res.data?.success && res.data.data) {
        setOrganization(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching my organization:', err);
    } finally {
      setOrgLoading(false);
    }
  }, [canCreateOrganization]);

  const fetchMyApplications = useCallback(async () => {
    if (!canApplyForJobs) return;
    try {
      setMyAppsLoading(true);
      const res = await API.get('/jobs/my-applications');
      if (res.data?.success) {
        setMyApplications(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching my applications:', err);
    } finally {
      setMyAppsLoading(false);
    }
  }, [canApplyForJobs]);

  useEffect(() => {
    fetchJobs();
    if (canCreateOrganization) {
      fetchMyOrganization();
    }
    if (canApplyForJobs) {
      fetchMyApplications();
    }
  }, [fetchJobs, fetchMyOrganization, fetchMyApplications, canCreateOrganization, canApplyForJobs]);

  // -------------------------------------------------------------
  // Organization Handlers
  // -------------------------------------------------------------
  const handleOpenOrgDialog = useCallback(() => {
    if (organization) {
      if (!orgForm.name) {
        setOrgForm({
          name: organization.name || '',
          industry: organization.industry || '',
          headOfficeLocation: organization.headOfficeLocation || '',
          operatingLocations: Array.isArray(organization.operatingLocations)
            ? organization.operatingLocations
            : (organization.operatingLocations
              ? (typeof organization.operatingLocations === 'string'
                ? organization.operatingLocations.split(',').map(s => s.trim()).filter(Boolean)
                : [])
              : []),
          establishedYear: organization.establishedYear || '',
          yearsOperating: organization.yearsOperating || '',
          description: organization.description || '',
          website: organization.website || '',
          contactEmail: organization.contactEmail || '',
          contactPhone: organization.contactPhone || ''
        });
      }
      setOrgLogoPreview(organization.logo?.url || '');
    }
    setOrgLogoFile(null);
    setOrgDialogOpen(true);
  }, [organization, orgForm.name, setOrgForm, setOrgDialogOpen]);

  const handleSaveOrganization = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!orgForm.name?.trim()) {
      enqueueSnackbar('Company/Organization name is required', { variant: 'warning' });
      return;
    }
    if (!orgForm.headOfficeLocation?.trim()) {
      enqueueSnackbar('Head office location is required', { variant: 'warning' });
      return;
    }

    try {
      setSavingOrg(true);
      const formData = new FormData();
      formData.append('name', orgForm.name.trim());
      formData.append('industry', orgForm.industry || '');
      formData.append('headOfficeLocation', orgForm.headOfficeLocation.trim());
      formData.append('operatingLocations', JSON.stringify(orgForm.operatingLocations || []));
      if (orgForm.establishedYear) formData.append('establishedYear', orgForm.establishedYear);
      if (orgForm.yearsOperating) formData.append('yearsOperating', orgForm.yearsOperating);
      if (orgForm.description) formData.append('description', orgForm.description.trim());
      if (orgForm.website) formData.append('website', orgForm.website.trim());
      if (orgForm.contactEmail) formData.append('contactEmail', orgForm.contactEmail.trim());
      if (orgForm.contactPhone) formData.append('contactPhone', orgForm.contactPhone.trim());
      if (orgLogoFile) formData.append('logo', orgLogoFile);

      const res = await API.post('/jobs/organization', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        setOrganization(res.data.data);
        enqueueSnackbar('Organization profile saved successfully!', { variant: 'success' });
        resetOrgDraft();
      }
    } catch (err) {
      console.error('Error saving organization:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to save organization', { variant: 'error' });
    } finally {
      setSavingOrg(false);
    }
  }, [orgForm, orgLogoFile, enqueueSnackbar, resetOrgDraft]);

  // -------------------------------------------------------------
  // Timing Computation Helper
  // -------------------------------------------------------------
  const computeTimingSummary = useCallback((sDate, eDate, sTime, eTime) => {
    let datePart = '';
    if (sDate) {
      const sDay = dayjs(sDate);
      if (sDay.isValid()) {
        const formattedStart = sDay.format('DD/MM/YYYY');
        if (eDate && eDate !== sDate) {
          const eDay = dayjs(eDate);
          datePart = `${formattedStart} - ${eDay.isValid() ? eDay.format('DD/MM/YYYY') : eDate}`;
        } else {
          datePart = formattedStart;
        }
      }
    }
    let timePart = '';
    if (sTime) {
      const startT = dayjs(`2000-01-01T${sTime}`);
      const formattedStart = startT.isValid() ? startT.format('hh:mm A') : sTime;
      if (eTime) {
        const endT = dayjs(`2000-01-01T${eTime}`);
        timePart = `${formattedStart} - ${endT.isValid() ? endT.format('hh:mm A') : eTime}`;
      } else {
        timePart = formattedStart;
      }
    }
    return [datePart, timePart].filter(Boolean).join(', ');
  }, []);

  // -------------------------------------------------------------
  // Job Post / Edit Handlers
  // -------------------------------------------------------------
  const handleOpenPostJob = useCallback((jobToEdit = null) => {
    if (!organization && !isAdmin) {
      enqueueSnackbar('Please setup your Organization Profile first to post job openings.', { variant: 'info' });
      handleOpenOrgDialog();
      return;
    }

    if (jobToEdit) {
      setEditingJob(jobToEdit);
      let docs = [];
      if (Array.isArray(jobToEdit.documentsRequired)) {
        docs = jobToEdit.documentsRequired;
      } else if (typeof jobToEdit.documentsRequired === 'string' && jobToEdit.documentsRequired.trim()) {
        docs = jobToEdit.documentsRequired.split(',').map(s => s.trim()).filter(Boolean);
      }

      setJobForm({
        jobRole: jobToEdit.jobRole || '',
        jobType: jobToEdit.jobType || '',
        location: jobToEdit.location || '',
        salaryRange: jobToEdit.salaryRange || '',
        experienceYears: jobToEdit.experienceYears || '',
        educationQualification: jobToEdit.educationQualification || '',
        description: jobToEdit.description || '',
        resumeRequired: jobToEdit.resumeRequired !== false,
        documentsRequired: docs,
        interviewMode: jobToEdit.interviewMode || '',
        interviewStartDate: jobToEdit.interviewStartDate || '',
        interviewEndDate: jobToEdit.interviewEndDate || '',
        interviewStartTime: jobToEdit.interviewStartTime || '',
        interviewEndTime: jobToEdit.interviewEndTime || '',
        interviewTiming: jobToEdit.interviewTiming || '',
        meetingLink: jobToEdit.meetingLink || '',
        googleMapLink: jobToEdit.googleMapLink || '',
        offlineAddress: jobToEdit.offlineAddress || {
          venueName: '',
          street: '',
          landmark: '',
          city: '',
          state: '',
          pincode: ''
        },
        interviewLocation: jobToEdit.interviewLocation || '',
        openingsCount: jobToEdit.openingsCount || 1
      });
    } else {
      if (editingJob) {
        setEditingJob(null);
      }
      if (!jobForm.jobRole && !jobForm.location && organization?.headOfficeLocation) {
        setJobForm(prev => ({ ...prev, location: organization.headOfficeLocation }));
      }
    }
    setJobDialogOpen(true);
  }, [organization, isAdmin, enqueueSnackbar, handleOpenOrgDialog, setEditingJob, setJobForm, editingJob, jobForm.jobRole, jobForm.location, setJobDialogOpen]);

  const handleSaveJob = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!jobForm.jobRole?.trim()) {
      enqueueSnackbar('Job Role / Title is required', { variant: 'warning' });
      return;
    }
    if (!jobForm.location?.trim()) {
      enqueueSnackbar('Job location is required', { variant: 'warning' });
      return;
    }

    if (jobForm.interviewMode === 'Offline / In-person') {
      const mapLink = (jobForm.googleMapLink || '').trim();
      const isValidMapsUrl = /^https?:\/\/(maps\.google\.|google\.[a-z.]+\/maps|goo\.gl\/maps|maps\.app\.goo\.gl)/i.test(mapLink);
      if (!mapLink) {
        enqueueSnackbar('A Google Maps location link is required for offline interviews', { variant: 'warning' });
        return;
      }
      if (!isValidMapsUrl) {
        enqueueSnackbar('Please enter a valid Google Maps link (maps.google.com, goo.gl/maps, etc.)', { variant: 'warning' });
        return;
      }
    }

    try {
      setSavingJob(true);
      if (editingJob) {
        const res = await API.put(`/jobs/${editingJob._id}`, jobForm);
        if (res.data?.success) {
          enqueueSnackbar('Job opening updated successfully!', { variant: 'success' });
          setJobs(prev => prev.map(j => j._id === editingJob._id ? res.data.data : j));
          resetJobDraft();
        }
      } else {
        const res = await API.post('/jobs', jobForm);
        if (res.data?.success) {
          enqueueSnackbar('Job opening posted successfully!', { variant: 'success' });
          setJobs(prev => [res.data.data, ...prev]);
          resetJobDraft();
        }
      }
    } catch (err) {
      console.error('Error saving job opening:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to save job opening', { variant: 'error' });
    } finally {
      setSavingJob(false);
    }
  }, [jobForm, editingJob, enqueueSnackbar, resetJobDraft]);

  // -------------------------------------------------------------
  // Delete Job Handlers
  // -------------------------------------------------------------
  const handleOpenDeleteJob = useCallback((job) => {
    setDeletingJob(job);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDeleteJob = useCallback(async () => {
    if (!deletingJob) return;
    try {
      setDeleting(true);
      const res = await API.delete(`/jobs/${deletingJob._id}`);
      if (res.data?.success) {
        enqueueSnackbar('Job opening deleted successfully', { variant: 'success' });
        setJobs(prev => prev.filter(j => j._id !== deletingJob._id));
        setDeleteDialogOpen(false);
        setDeletingJob(null);
        if (viewingJob && viewingJob._id === deletingJob._id) {
          setViewDialogOpen(false);
        }
      }
    } catch (err) {
      console.error('Error deleting job:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete job', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  }, [deletingJob, enqueueSnackbar, viewingJob]);

  // -------------------------------------------------------------
  // Job Application Handlers
  // -------------------------------------------------------------
  const handleOpenApply = useCallback((job) => {
    setApplyingJob(job);
    if (!applyForm.applicantName) {
      setApplyForm({
        applicantName: user?.name || '',
        applicantEmail: user?.email || '',
        applicantPhone: user?.phone || '',
        experience: '',
        education: '',
        coverNote: ''
      });
    }
    setResumeFile(null);
    setApplyDialogOpen(true);
  }, [applyForm.applicantName, user, setApplyingJob, setApplyForm, setApplyDialogOpen]);

  const handleSubmitApplication = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (applyingJob?.resumeRequired && !resumeFile) {
      enqueueSnackbar('Please select and upload your resume document', { variant: 'warning' });
      return;
    }

    try {
      setSubmittingApp(true);
      const formData = new FormData();
      formData.append('applicantName', (applyForm.applicantName || '').trim());
      formData.append('applicantEmail', (applyForm.applicantEmail || '').trim());
      formData.append('applicantPhone', (applyForm.applicantPhone || '').trim());
      formData.append('experience', (applyForm.experience || '').trim());
      formData.append('education', (applyForm.education || '').trim());
      formData.append('coverNote', (applyForm.coverNote || '').trim());
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      const res = await API.post(`/jobs/${applyingJob._id}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        enqueueSnackbar('Application submitted successfully! Good luck.', { variant: 'success' });
        setJobs(prev => prev.map(j => j._id === applyingJob._id ? { ...j, hasApplied: true, applicationStatus: 'Applied' } : j));
        resetApplyDraft();
        fetchMyApplications();
      }
    } catch (err) {
      console.error('Error submitting application:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to submit application', { variant: 'error' });
    } finally {
      setSubmittingApp(false);
    }
  }, [applyingJob, resumeFile, applyForm, enqueueSnackbar, resetApplyDraft, fetchMyApplications]);

  // -------------------------------------------------------------
  // View Applicants Handlers (For Job Poster)
  // -------------------------------------------------------------
  const handleOpenApplicants = useCallback(async (job) => {
    setApplicantsJob(job);
    setApplicantsDialogOpen(true);
    try {
      setLoadingApplicants(true);
      const res = await API.get(`/jobs/${job._id}/applicants`);
      if (res.data?.success) {
        setApplicantsList(res.data.data || []);
      }
    } catch (err) {
      console.error('Error loading applicants:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load applicants', { variant: 'error' });
    } finally {
      setLoadingApplicants(false);
    }
  }, [enqueueSnackbar]);

  const handleUpdateApplicantStatus = useCallback(async (appId, newStatus) => {
    try {
      const res = await API.patch(`/jobs/applications/${appId}/status`, { status: newStatus });
      if (res.data?.success) {
        enqueueSnackbar(`Status updated to ${newStatus}`, { variant: 'success' });
        setApplicantsList(prev => prev.map(a => a._id === appId ? { ...a, status: newStatus } : a));
      }
    } catch (err) {
      console.error('Error updating status:', err);
      enqueueSnackbar('Failed to update applicant status', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const handleToggleJobStatus = useCallback(async (job) => {
    const nextStatus = job.status === 'Closed' ? 'Open' : 'Closed';
    try {
      const res = await API.put(`/jobs/${job._id}`, { status: nextStatus });
      if (res.data?.success) {
        enqueueSnackbar(
          nextStatus === 'Closed' ? 'Job applications marked as Closed.' : 'Job opening reopened successfully!',
          { variant: 'success' }
        );
        setJobs(prev => prev.map(j => j._id === job._id ? { ...j, status: nextStatus } : j));
      }
    } catch (err) {
      console.error('Error toggling job status:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to update job status', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const handleViewDetails = useCallback((job) => {
    setViewingJob(job);
    setViewDialogOpen(true);
  }, []);

  // -------------------------------------------------------------
  // Filtered & Paginated Jobs (Open vs Closed)
  // -------------------------------------------------------------
  const openJobs = useMemo(() => jobs.filter(j => j.status !== 'Closed'), [jobs]);
  const closedJobs = useMemo(() => jobs.filter(j => j.status === 'Closed'), [jobs]);

  const currentTabJobs = useMemo(() => {
    if (activeTab === 'closed') return closedJobs;
    return openJobs;
  }, [activeTab, openJobs, closedJobs]);

  const filteredJobs = useMemo(() => {
    let list = currentTabJobs;

    if (jobTypeFilter !== 'All') {
      list = list.filter(j => j.jobType === jobTypeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(j =>
        (j.jobRole || '').toLowerCase().includes(q) ||
        (j.organization?.name || '').toLowerCase().includes(q) ||
        (j.location || '').toLowerCase().includes(q) ||
        (j.educationQualification || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [currentTabJobs, jobTypeFilter, searchQuery]);

  const paginatedJobs = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredJobs.slice(start, start + rowsPerPage);
  }, [filteredJobs, page, rowsPerPage]);

  const stats = useMemo(() => {
    const target = currentTabJobs;
    const total = target.length;
    const fullTime = target.filter(j => j.jobType === 'Full-time').length;
    const internship = target.filter(j => j.jobType === 'Internship').length;
    const hybrid = target.filter(j => j.jobType === 'Hybrid').length;
    return { total, fullTime, internship, hybrid };
  }, [currentTabJobs]);

  const myPostedJobs = useMemo(() => {
    const myOrgId = organization?._id;
    if (!myOrgId) return [];
    return jobs.filter(j => String(j.organization?._id || j.organization) === String(myOrgId));
  }, [jobs, organization]);

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        height: {
          xs: 'auto',
          md: 'calc(100vh - 116px)'
        },
        display: 'flex',
        flexDirection: 'column',
        overflow: { xs: 'visible', md: 'hidden' },
        pb: { xs: 4, md: 0 }
      }}
    >
      {/* ── Top Page Header ── */}
      <JobPageHeader
        canCreateOrganization={canCreateOrganization}
        organization={organization}
        onOpenOrgDialog={handleOpenOrgDialog}
        onOpenPostJob={handleOpenPostJob}
      />

      {/* ── Sub Navigation Tabs ── */}
      <JobNavigationTabs
        activeTab={activeTab}
        onTabChange={(val) => { setActiveTab(val); setPage(0); }}
        openCount={openJobs.length}
        closedCount={closedJobs.length}
        myAppsCount={myApplications.length}
        myPostedCount={myPostedJobs.length}
        canApplyForJobs={canApplyForJobs}
        canCreateOrganization={canCreateOrganization}
      />

      {/* ── TAB 1 & 2: EXPLORE OPENINGS & APPLICATIONS CLOSED ── */}
      {(activeTab === 'explore' || activeTab === 'closed') && (
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            flex: 1,
            minHeight: 0,
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.05)',
            overflow: { xs: 'visible', md: 'hidden' },
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#FFFFFF'
          }}
        >
          {/* Table Toolbar */}
          <JobToolbar
            stats={stats}
            jobTypeFilter={jobTypeFilter}
            onFilterChange={(filter) => { setJobTypeFilter(filter); setPage(0); }}
            searchQuery={searchQuery}
            onSearchChange={(query) => { setSearchQuery(query); setPage(0); }}
            onClearSearch={() => { setSearchQuery(''); setPage(0); }}
            loading={loading}
            onRefresh={fetchJobs}
          />

          {/* Content: Mobile Cards Feed (< md) OR Desktop Table (>= md) */}
          {isMobile ? (
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: { xs: 'visible', md: 'auto' },
                bgcolor: '#F8FAFC',
                p: { xs: 1.5, sm: 2 }
              }}
            >
              {loading ? (
                <JobCardsSkeleton cards={4} />
              ) : paginatedJobs.length === 0 ? (
                <Box sx={{ py: 8, px: 2, textAlign: 'center', bgcolor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                  <WorkIcon sx={{ fontSize: 44, color: '#94A3B8', mb: 1, opacity: 0.6 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                    {activeTab === 'closed' ? 'No closed applications found' : 'No job openings found'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                    {searchQuery || jobTypeFilter !== 'All'
                      ? 'Try clearing your search query or filter.'
                      : activeTab === 'closed'
                        ? 'No job openings have been closed yet.'
                        : 'No active job opportunities posted yet. Check back soon!'}
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {paginatedJobs.map((job) => {
                    const isCreator = String(job.createdBy?._id || job.createdBy) === String(user?._id || user?.id);
                    return (
                      <JobCardItem
                        key={job._id}
                        job={job}
                        isCreator={isCreator}
                        isAdmin={isAdmin}
                        canApplyForJobs={canApplyForJobs}
                        onViewDetails={handleViewDetails}
                        onOpenApplicants={handleOpenApplicants}
                        onToggleStatus={handleToggleJobStatus}
                        onEditJob={handleOpenPostJob}
                        onDeleteJob={handleOpenDeleteJob}
                        onApplyJob={handleOpenApply}
                      />
                    );
                  })}
                </Stack>
              )}
            </Box>
          ) : (
            <TableContainer
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'auto',
                bgcolor: '#FFFFFF',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <Table stickyHeader sx={{ minWidth: 1100 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                    <TableCell sx={{ py: 1.75, px: 2, fontWeight: 700, fontSize: '13px', color: '#64748B', bgcolor: '#F8FAFC', width: 50, borderBottom: '1px solid #EEF2F6', zIndex: 2, whiteSpace: 'nowrap' }}>
                      #
                    </TableCell>
                    <TableCell sx={{ py: 1.75, px: 2, fontWeight: 700, fontSize: '13px', color: '#64748B', bgcolor: '#F8FAFC', minWidth: 190, borderBottom: '1px solid #EEF2F6', zIndex: 2, whiteSpace: 'nowrap' }}>
                      Company / Organization
                    </TableCell>
                    <TableCell sx={{ py: 1.75, px: 2, fontWeight: 700, fontSize: '13px', color: '#64748B', bgcolor: '#F8FAFC', minWidth: 190, borderBottom: '1px solid #EEF2F6', zIndex: 2, whiteSpace: 'nowrap' }}>
                      Job Role & Type
                    </TableCell>
                    <TableCell sx={{ py: 1.75, px: 2, fontWeight: 700, fontSize: '13px', color: '#64748B', bgcolor: '#F8FAFC', minWidth: 140, borderBottom: '1px solid #EEF2F6', zIndex: 2, whiteSpace: 'nowrap' }}>
                      Location
                    </TableCell>
                    <TableCell sx={{ py: 1.75, px: 2, fontWeight: 700, fontSize: '13px', color: '#64748B', bgcolor: '#F8FAFC', minWidth: 150, borderBottom: '1px solid #EEF2F6', zIndex: 2, whiteSpace: 'nowrap' }}>
                      Experience & Education
                    </TableCell>
                    <TableCell sx={{ py: 1.75, px: 2, fontWeight: 700, fontSize: '13px', color: '#64748B', bgcolor: '#F8FAFC', minWidth: 130, borderBottom: '1px solid #EEF2F6', zIndex: 2, whiteSpace: 'nowrap' }}>
                      Salary Range
                    </TableCell>
                    <TableCell sx={{ py: 1.75, px: 2, fontWeight: 700, fontSize: '13px', color: '#64748B', bgcolor: '#F8FAFC', minWidth: 130, borderBottom: '1px solid #EEF2F6', zIndex: 2, whiteSpace: 'nowrap' }}>
                      Interview Mode
                    </TableCell>
                    <TableCell sx={{ py: 1.75, px: 2, fontWeight: 700, fontSize: '13px', color: '#64748B', bgcolor: '#F8FAFC', minWidth: 130, borderBottom: '1px solid #EEF2F6', textAlign: 'center', zIndex: 2, whiteSpace: 'nowrap' }}>
                      People Applied
                    </TableCell>
                    <TableCell sx={{ py: 1.75, px: 2, fontWeight: 700, fontSize: '13px', color: '#64748B', bgcolor: '#F8FAFC', minWidth: 80, borderBottom: '1px solid #EEF2F6', textAlign: 'center', zIndex: 2, whiteSpace: 'nowrap' }}>
                      Openings
                    </TableCell>
                    <TableCell sx={{ py: 1.75, px: 2, fontWeight: 700, fontSize: '13px', color: '#64748B', bgcolor: '#F8FAFC', minWidth: 180, borderBottom: '1px solid #EEF2F6', textAlign: 'right', zIndex: 2, whiteSpace: 'nowrap' }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <JobTableSkeleton rows={rowsPerPage} />
                  ) : paginatedJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} sx={{ py: 8, textAlign: 'center' }}>
                        <WorkIcon sx={{ fontSize: 44, color: '#94A3B8', mb: 1, opacity: 0.6 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                          {activeTab === 'closed' ? 'No closed applications found' : 'No job openings found'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                          {searchQuery || jobTypeFilter !== 'All' ? '' : activeTab === 'closed' ? 'No job openings have been closed yet.' : 'No active job opportunities posted yet. Check back soon!'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedJobs.map((job, idx) => {
                      const isCreator = String(job.createdBy?._id || job.createdBy) === String(user?._id || user?.id);
                      const rowNumber = page * rowsPerPage + idx + 1;
                      return (
                        <JobTableRow
                          key={job._id}
                          job={job}
                          rowNumber={rowNumber}
                          isCreator={isCreator}
                          isAdmin={isAdmin}
                          canApplyForJobs={canApplyForJobs}
                          onViewDetails={handleViewDetails}
                          onOpenApplicants={handleOpenApplicants}
                          onToggleStatus={handleToggleJobStatus}
                          onEditJob={handleOpenPostJob}
                          onDeleteJob={handleOpenDeleteJob}
                          onApplyJob={handleOpenApply}
                        />
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination Footer */}
          <JobPagination
            page={page}
            rowsPerPage={rowsPerPage}
            totalItems={filteredJobs.length}
            onPageChange={setPage}
            onRowsPerPageChange={(newVal) => {
              setRowsPerPage(newVal);
              setPage(0);
            }}
          />
        </Paper>
      )}

      {/* ── TAB 3: MY APPLICATIONS ── */}
      {activeTab === 'my-applications' && canApplyForJobs && (
        <MyApplicationsView
          myApplications={myApplications}
          loading={myAppsLoading}
          onBrowseJobs={() => setActiveTab('explore')}
        />
      )}

      {/* ── TAB 4: MY POSTINGS & ORGANIZATION ── */}
      {activeTab === 'my-org' && canCreateOrganization && (
        <MyOrgView
          organization={organization}
          myPostedJobs={myPostedJobs}
          onOpenOrgDialog={handleOpenOrgDialog}
          onOpenPostJob={handleOpenPostJob}
          onOpenApplicants={handleOpenApplicants}
          onOpenDeleteJob={handleOpenDeleteJob}
        />
      )}

      {/* ── MODALS (Mounted only when open to preserve DOM performance) ── */}
      {orgDialogOpen && (
        <OrganizationDialog
          open={orgDialogOpen}
          onClose={resetOrgDraft}
          organization={organization}
          orgForm={orgForm}
          setOrgForm={setOrgForm}
          orgLogoFile={orgLogoFile}
          setOrgLogoFile={setOrgLogoFile}
          orgLogoPreview={orgLogoPreview}
          setOrgLogoPreview={setOrgLogoPreview}
          savingOrg={savingOrg}
          onSaveOrganization={handleSaveOrganization}
        />
      )}

      {jobDialogOpen && (
        <JobPostDialog
          open={jobDialogOpen}
          onClose={resetJobDraft}
          editingJob={editingJob}
          jobForm={jobForm}
          setJobForm={setJobForm}
          savingJob={savingJob}
          onSaveJob={handleSaveJob}
          computeTimingSummary={computeTimingSummary}
        />
      )}

      {viewDialogOpen && (
        <JobDetailsDialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          job={viewingJob}
          canApplyForJobs={canApplyForJobs}
          onOpenApply={handleOpenApply}
        />
      )}

      {applyDialogOpen && (
        <ApplyJobDialog
          open={applyDialogOpen}
          onClose={resetApplyDraft}
          applyingJob={applyingJob}
          applyForm={applyForm}
          setApplyForm={setApplyForm}
          resumeFile={resumeFile}
          setResumeFile={setResumeFile}
          submittingApp={submittingApp}
          onSubmitApplication={handleSubmitApplication}
        />
      )}

      {applicantsDialogOpen && (
        <ApplicantsDialog
          open={applicantsDialogOpen}
          onClose={() => setApplicantsDialogOpen(false)}
          job={applicantsJob}
          applicantsList={applicantsList}
          loading={loadingApplicants}
          onUpdateStatus={handleUpdateApplicantStatus}
        />
      )}

      {deleteDialogOpen && (
        <DeleteJobDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          job={deletingJob}
          deleting={deleting}
          onConfirmDelete={handleConfirmDeleteJob}
        />
      )}
    </Box>
  );
}
