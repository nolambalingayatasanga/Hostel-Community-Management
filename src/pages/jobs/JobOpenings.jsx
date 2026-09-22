import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  IconButton,
  Chip,
  Avatar,
  Stack,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  InputAdornment,
  FormControl,
  InputLabel,
  FormHelperText,
  Switch,
  FormControlLabel,
  useTheme,
  useMediaQuery,
  Badge,
  Autocomplete,
  Checkbox
} from '@mui/material';
import {
  Work as WorkIcon,
  Business as BusinessIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  School as EducationIcon,
  Timelapse as ExperienceIcon,
  Description as ResumeIcon,
  VideoCall as OnlineInterviewIcon,
  MeetingRoom as InPersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  People as ApplicantsIcon,
  CheckCircle as CheckIcon,
  CloudUpload as UploadIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Launch as OpenLinkIcon,
  Language as WebsiteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CheckCircle as AppliedCheckIcon,
  Map as MapIcon,
  Link as LinkIcon,
  AccessTime as TimeIcon,
  CalendarMonth as CalendarIcon,
  Directions as DirectionsIcon
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import { useJobDraft } from '../../context/JobDraftContext';
import API from '../../api';

const INDUSTRIES = [
  'IT & Software Development',
  'Technology & Electronics',
  'Finance & Banking',
  'Healthcare & Pharmaceuticals',
  'Manufacturing & Industrial',
  'Education & Training',
  'Construction & Real Estate',
  'Retail & E-commerce',
  'Consulting & Professional Services',
  'Marketing & Advertising',
  'Hospitality & Tourism',
  'Automobile',
  'Government & Public Sector',
  'Other'
];

const JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Hybrid', 'Contract'];

const INDIA_LOCATIONS = [
  // Major Metro Cities
  'Bengaluru (Bangalore)', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata',
  'Ahmedabad', 'Noida', 'Gurugram (Gurgaon)', 'Navi Mumbai', 'Thane',
  // IT & Tech Hubs
  'Whitefield, Bengaluru', 'Electronic City, Bengaluru', 'Koramangala, Bengaluru',
  'Baner, Pune', 'Hinjewadi, Pune', 'Magarpatta, Pune', 'Kharadi, Pune',
  'HITEC City, Hyderabad', 'Gachibowli, Hyderabad', 'Kondapur, Hyderabad',
  'Cyber City, Gurugram', 'DLF Cyber Hub, Gurugram', 'Sector 62, Noida',
  'Andheri, Mumbai', 'BKC (Bandra Kurla Complex), Mumbai', 'Powai, Mumbai', 'Lower Parel, Mumbai',
  'OMR (Old Mahabalipuram Road), Chennai', 'Tidel Park, Chennai',
  'Salt Lake Sector V, Kolkata',
  // Tier 2 Cities
  'Jaipur', 'Lucknow', 'Chandigarh', 'Indore', 'Bhopal', 'Nagpur', 'Coimbatore', 'Kochi',
  'Thiruvananthapuram', 'Mysuru (Mysore)', 'Mangaluru (Mangalore)', 'Hubli-Dharwad',
  'Vijayawada', 'Visakhapatnam (Vizag)', 'Warangal', 'Tirupati',
  'Madurai', 'Salem', 'Tiruchirappalli (Trichy)', 'Vellore',
  'Surat', 'Vadodara (Baroda)', 'Rajkot', 'Gandhinagar',
  'Patna', 'Ranchi', 'Bhubaneswar', 'Guwahati', 'Dehradun', 'Amritsar', 'Ludhiana',
  'Faridabad', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut',
  // Special Economic Zones & IT Parks
  'Manyata Tech Park, Bengaluru', 'Embassy Tech Village, Bengaluru',
  'GIFT City, Gandhinagar', 'Rajiv Gandhi IT Park, Chandigarh',
  'Technopark, Thiruvananthapuram', 'Infopark, Kochi', 'SmartCity Kochi',
  // Remote / PAN India
  'Remote (Work From Home)', 'PAN India',
];

export const EDUCATION_DEGREES = [
  // School & Pre-University
  '10th Standard / Secondary School (SSLC / CBSE / ICSE)',
  '12th / Higher Secondary / PUC (Science - PCMB / PCMC)',
  '12th / Higher Secondary / PUC (Commerce)',
  '12th / Higher Secondary / PUC (Arts / Humanities)',
  'Vocational Education / ITI Certificate',
  // Polytechnic & Technical Diplomas
  'Polytechnic Diploma in Computer Science & Engineering',
  'Polytechnic Diploma in Information Technology',
  'Polytechnic Diploma in Civil Engineering',
  'Polytechnic Diploma in Mechanical Engineering',
  'Polytechnic Diploma in Electrical & Electronics (EEE)',
  'Polytechnic Diploma in Electronics & Communication (ECE)',
  'Polytechnic Diploma in Automobile Engineering',
  'Diploma in Pharmacy (D.Pharm)',
  'Diploma in Hotel Management & Catering',
  // General & Undergraduate Degrees
  "Bachelor's Degree / Any Graduate",
  'B.E. / B.Tech in Computer Science & Engineering (CSE)',
  'B.E. / B.Tech in Information Technology (IT)',
  'B.E. / B.Tech in Artificial Intelligence & Machine Learning (AI & ML)',
  'B.E. / B.Tech in Data Science',
  'B.E. / B.Tech in Electronics & Communication Engineering (ECE)',
  'B.E. / B.Tech in Electrical & Electronics Engineering (EEE)',
  'B.E. / B.Tech in Mechanical Engineering',
  'B.E. / B.Tech in Civil Engineering',
  'B.E. / B.Tech in Chemical Engineering',
  'B.E. / B.Tech in Biotechnology',
  'B.E. / B.Tech in Aerospace / Aeronautical Engineering',
  'BCA (Bachelor of Computer Applications)',
  'B.Sc in Computer Science',
  'B.Sc in Information Technology',
  'B.Sc in Data Science / Cyber Security',
  'B.Sc in Mathematics / Statistics',
  'B.Sc in Physics / Chemistry',
  'B.Sc in Biotechnology / Microbiology / Biochemistry',
  'B.Sc in Nursing / Allied Health',
  'B.Sc in Agriculture / Horticulture / Forestry',
  'B.Com (General)',
  'B.Com in Accounting & Finance',
  'B.Com in Taxation',
  'B.Com with Computer Applications',
  'BBA (Bachelor of Business Administration)',
  'BBM (Bachelor of Business Management)',
  'B.A. in Economics',
  'B.A. in English / Literature',
  'B.A. in Journalism & Mass Communication',
  'B.A. in Psychology / Sociology / Political Science',
  'B.Des (Bachelor of Design - UI/UX / Product / Graphic)',
  'B.Arch (Bachelor of Architecture)',
  'B.Pharm (Bachelor of Pharmacy)',
  'Pharm.D (Doctor of Pharmacy)',
  'MBBS (Bachelor of Medicine, Bachelor of Surgery)',
  'BDS (Bachelor of Dental Surgery)',
  'BPT (Bachelor of Physiotherapy)',
  'B.Ed (Bachelor of Education)',
  'B.P.Ed (Bachelor of Physical Education)',
  'B.A. LL.B / B.B.A. LL.B / LL.B (Law)',
  'BHM (Bachelor of Hotel Management)',
  // Postgraduate Degrees
  "Master's Degree / Any Post Graduate",
  'M.Tech / M.E. in Computer Science & Engineering',
  'M.Tech / M.E. in Artificial Intelligence / Data Science',
  'M.Tech / M.E. in VLSI Design & Embedded Systems',
  'M.Tech / M.E. in Software Engineering',
  'M.Tech / M.E. in Mechanical / Thermal Engineering',
  'M.Tech / M.E. in Structural Engineering',
  'MCA (Master of Computer Applications)',
  'M.Sc in Computer Science',
  'M.Sc in Information Technology / Cyber Security',
  'M.Sc in Mathematics / Applied Statistics',
  'M.Sc in Physics / Applied Physics',
  'M.Sc in Chemistry / Organic Chemistry',
  'M.Sc in Biotechnology / Life Sciences',
  'MBA in Finance',
  'MBA in Marketing',
  'MBA in Human Resource Management (HR)',
  'MBA in Operations / Supply Chain Management',
  'MBA in Business Analytics / Data Analytics',
  'MBA in Information Technology (IT)',
  'M.Com (Master of Commerce)',
  'M.A. in Economics',
  'M.A. in English / Linguistics',
  'M.A. in Journalism & Mass Communication',
  'M.Des (Master of Design)',
  'M.Pharm (Master of Pharmacy)',
  'MS (Master of Science / Master of Surgery)',
  'MD (Doctor of Medicine)',
  'MDS (Master of Dental Surgery)',
  'MPT (Master of Physiotherapy)',
  'LL.M (Master of Laws)',
  'M.Ed (Master of Education)',
  // Advanced Research & Doctorate
  'M.Phil (Master of Philosophy)',
  'Ph.D in Computer Science & Engineering',
  'Ph.D in Engineering / Technology',
  'Ph.D in Physical / Chemical / Mathematical Sciences',
  'Ph.D in Biological Sciences / Biotechnology',
  'Ph.D in Management Studies / Commerce',
  'Ph.D in Humanities / Social Sciences',
  'Ph.D in Law',
  'Ph.D / Doctorate (Any Stream)',
  'Post-Doctoral Fellowship (PostDoc)'
];

export const REQUIRED_DOCUMENTS_OPTIONS = [
  'Updated Resume / Curriculum Vitae (CV)',
  'Passport Size Photographs (2-4 copies)',
  'Government Photo ID Proof (Aadhaar / PAN / Voter ID / Passport / Driving License)',
  '10th / Secondary School Marksheet & Passing Certificate',
  '12th / Higher Secondary / PUC Marksheet & Certificate',
  'Diploma Certificate & All Semester Marksheets',
  'Undergraduate Degree Certificate / Provisional Degree',
  'Undergraduate All Semester Marksheets / Consolidated Transcript',
  'Postgraduate Degree Certificate / Marksheets',
  'Previous Employer Relieving Letter & Service Certificate',
  'Last 3 Months Salary Slips',
  'Bank Account Statement (Last 3-6 Months)',
  'Previous Employer Appointment Letter / Offer Letter',
  'College ID Card / Bona Fide Certificate (for Students & Interns)',
  'Portfolio / GitHub Repository / Project Work Samples',
  'Technical / Professional Certifications',
  'Recommendation Letter / Reference Contacts',
  'Caste / Category / Income Certificate (if applicable)',
  'Medical Fitness Certificate',
  'Address Proof Document'
];

export default function JobOpenings() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Role permissions:
  // 1. Except student, anyone can create organization and post openings
  const userRole = (user?.role || '').toUpperCase();
  const canCreateOrganization = userRole !== 'STUDENT';
  // 2. Only students, alumni, staff, and members can apply for openings & view "My Applications"
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

  // -------------------------------------------------------------
  // Modals state & Form Drafts (Persistent across refresh)
  // -------------------------------------------------------------
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
    resetApplyDraft,
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
  const handleOpenOrgDialog = () => {
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
  };

  const handleSaveOrganization = async (e) => {
    if (e) e.preventDefault();
    if (!orgForm.name.trim()) {
      enqueueSnackbar('Company/Organization name is required', { variant: 'warning' });
      return;
    }
    if (!orgForm.headOfficeLocation.trim()) {
      enqueueSnackbar('Head office location is required', { variant: 'warning' });
      return;
    }

    try {
      setSavingOrg(true);
      const formData = new FormData();
      formData.append('name', orgForm.name.trim());
      formData.append('industry', orgForm.industry);
      formData.append('headOfficeLocation', orgForm.headOfficeLocation.trim());
      formData.append('operatingLocations', JSON.stringify(orgForm.operatingLocations));
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
  };

  // -------------------------------------------------------------
  // Job Posting Handlers & Timing Helpers
  // -------------------------------------------------------------
  const computeTimingSummary = (sDate, eDate, sTime, eTime) => {
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
  };

  const handleOpenPostJob = (jobToEdit = null) => {
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
      // If no draft exists yet, prefill default location from organization
      if (!jobForm.jobRole && !jobForm.location && organization?.headOfficeLocation) {
        setJobForm(prev => ({ ...prev, location: organization.headOfficeLocation }));
      }
    }
    setJobDialogOpen(true);
  };

  const handleSaveJob = async (e) => {
    if (e) e.preventDefault();
    if (!jobForm.jobRole.trim()) {
      enqueueSnackbar('Job Role / Title is required', { variant: 'warning' });
      return;
    }
    if (!jobForm.location.trim()) {
      enqueueSnackbar('Job location is required', { variant: 'warning' });
      return;
    }

    // Validate Google Maps link when interview mode is Offline
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
  };

  // -------------------------------------------------------------
  // Delete Job Handlers
  // -------------------------------------------------------------
  const handleOpenDeleteJob = (job) => {
    setDeletingJob(job);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDeleteJob = async () => {
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
  };

  // -------------------------------------------------------------
  // Job Application Handlers
  // -------------------------------------------------------------
  const handleOpenApply = (job) => {
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
  };

  const handleSubmitApplication = async (e) => {
    if (e) e.preventDefault();
    if (applyingJob?.resumeRequired && !resumeFile) {
      enqueueSnackbar('Please select and upload your resume document', { variant: 'warning' });
      return;
    }

    try {
      setSubmittingApp(true);
      const formData = new FormData();
      formData.append('applicantName', applyForm.applicantName.trim());
      formData.append('applicantEmail', applyForm.applicantEmail.trim());
      formData.append('applicantPhone', applyForm.applicantPhone.trim());
      formData.append('experience', applyForm.experience.trim());
      formData.append('education', applyForm.education.trim());
      formData.append('coverNote', applyForm.coverNote.trim());
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
  };

  // -------------------------------------------------------------
  // View Applicants Handlers (For Job Poster)
  // -------------------------------------------------------------
  const handleOpenApplicants = async (job) => {
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
  };

  const handleUpdateApplicantStatus = async (appId, newStatus) => {
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
  };

  const handleToggleJobStatus = async (job) => {
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
  };

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
          xs: 'calc(100vh - 80px)',
          sm: 'calc(100vh - 100px)',
          md: 'calc(100vh - 116px)'
        },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* ── Top Page Header ── */}
      <Box
        sx={{
          mb: 1.5,
          width: '100%',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1.5,
          flexShrink: 0
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <WorkIcon sx={{ color: '#0088ff', fontSize: 28 }} />
            Job Openings & Careers
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.25 }}>
            Discover career opportunities, explore companies, and apply for roles directly.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flexShrink: 0, ml: { sm: 'auto' } }}>
          {/* Organization Profile setup for eligible users */}
          {canCreateOrganization && (
            <Button
              variant="outlined"
              startIcon={<BusinessIcon sx={{ fontSize: 18 }} />}
              onClick={handleOpenOrgDialog}
              sx={{
                borderRadius: '10px',
                px: 2,
                py: 0.9,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '13.5px',
                borderColor: '#CBD5E1',
                color: '#334155',
                bgcolor: '#FFFFFF',
                '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' }
              }}
            >
              {organization ? organization.name : 'Setup Organization'}
            </Button>
          )}

          {/* Post Job Opening Button */}
          {canCreateOrganization && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenPostJob()}
              sx={{
                borderRadius: '10px',
                px: 2.5,
                py: 0.9,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '13.5px',
                bgcolor: '#0088ff',
                boxShadow: '0 2px 8px rgba(0, 136, 255, 0.25)',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#0077ee', boxShadow: 'none' }
              }}
            >
              Post Job Opening
            </Button>
          )}
        </Stack>
      </Box>

      {/* ── Sub Navigation Tabs ── */}
      <Box sx={{ borderBottom: 1, borderColor: '#E2E8F0', mb: 1.5, flexShrink: 0 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => { setActiveTab(val); setPage(0); }}
          sx={{
            minHeight: 42,
            '& .MuiTabs-indicator': { bgcolor: '#0088ff', height: 3, borderRadius: '3px' },
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '13.5px', minHeight: 42, py: 0.75, whiteSpace: 'nowrap' }
          }}
        >
          <Tab
            value="explore"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Explore Openings</span>
                <Chip label={openJobs.length} size="small" sx={{ height: 20, fontSize: '11px', fontWeight: 700, bgcolor: activeTab === 'explore' ? '#0088ff' : '#E2E8F0', color: activeTab === 'explore' ? '#fff' : '#64748B' }} />
              </Box>
            }
          />
          <Tab
            value="closed"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Applications Closed</span>
                <Chip label={closedJobs.length} size="small" sx={{ height: 20, fontSize: '11px', fontWeight: 700, bgcolor: activeTab === 'closed' ? '#0088ff' : '#E2E8F0', color: activeTab === 'closed' ? '#fff' : '#64748B' }} />
              </Box>
            }
          />
          {canApplyForJobs && (
            <Tab
              value="my-applications"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>My Applications</span>
                  <Chip label={myApplications.length} size="small" sx={{ height: 20, fontSize: '11px', fontWeight: 700, bgcolor: activeTab === 'my-applications' ? '#0088ff' : '#E2E8F0', color: activeTab === 'my-applications' ? '#fff' : '#64748B' }} />
                </Box>
              }
            />
          )}
          {canCreateOrganization && (
            <Tab
              value="my-org"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>My Postings & Org</span>
                  <Chip label={myPostedJobs.length} size="small" sx={{ height: 20, fontSize: '11px', fontWeight: 700, bgcolor: activeTab === 'my-org' ? '#0088ff' : '#E2E8F0', color: activeTab === 'my-org' ? '#fff' : '#64748B' }} />
                </Box>
              }
            />
          )}
        </Tabs>
      </Box>

      {/* ── TAB 1 & TAB 2: EXPLORE OPENINGS & APPLICATIONS CLOSED (Table View) ── */}
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
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#FFFFFF'
          }}
        >
          {/* Table Toolbar */}
          <Box
            sx={{
              p: 2,
              bgcolor: '#FFFFFF',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', md: 'center' },
              gap: 1.5,
              flexShrink: 0
            }}
          >
            {/* Filter Chips */}
            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: { xs: 0.5, md: 0 }, alignItems: 'center' }}>
              <Chip
                label={`All (${stats.total})`}
                onClick={() => { setJobTypeFilter('All'); setPage(0); }}
                color={jobTypeFilter === 'All' ? 'primary' : 'default'}
                variant={jobTypeFilter === 'All' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}
              />
              <Chip
                label={`Full-time (${stats.fullTime})`}
                onClick={() => { setJobTypeFilter('Full-time'); setPage(0); }}
                color={jobTypeFilter === 'Full-time' ? 'primary' : 'default'}
                variant={jobTypeFilter === 'Full-time' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}
              />
              <Chip
                label={`Internship (${stats.internship})`}
                onClick={() => { setJobTypeFilter('Internship'); setPage(0); }}
                color={jobTypeFilter === 'Internship' ? 'secondary' : 'default'}
                variant={jobTypeFilter === 'Internship' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}
              />
              <Chip
                label={`Hybrid (${stats.hybrid})`}
                onClick={() => { setJobTypeFilter('Hybrid'); setPage(0); }}
                color={jobTypeFilter === 'Hybrid' ? 'info' : 'default'}
                variant={jobTypeFilter === 'Hybrid' ? 'filled' : 'outlined'}
                sx={{ fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}
              />
            </Stack>

            {/* Search and Refresh */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: { xs: '100%', md: 320 } }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search job title, company, location..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => { setSearchQuery(''); setPage(0); }} sx={{ p: 0.5 }}>
                          <CloseIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </InputAdornment>
                    ) : null
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    height: 38,
                    fontSize: '13px'
                  }
                }}
              />

              <Tooltip title="Refresh job listings">
                <IconButton
                  onClick={fetchJobs}
                  disabled={loading}
                  sx={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    bgcolor: '#FFFFFF',
                    color: '#64748B',
                    p: 0.9,
                    flexShrink: 0,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease',
                    '&:hover': { bgcolor: '#F8FAFC', color: '#1E293B', borderColor: '#CBD5E1' }
                  }}
                >
                  <RefreshIcon
                    sx={{
                      fontSize: 20,
                      animation: loading ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      }
                    }}
                  />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* Table Content */}
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
                  <TableRow>
                    <TableCell colSpan={10} sx={{ py: 8, textAlign: 'center' }}>
                      <CircularProgress size={36} sx={{ color: '#0088ff' }} />
                    </TableCell>
                  </TableRow>
                ) : paginatedJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} sx={{ py: 8, textAlign: 'center' }}>
                      <WorkIcon sx={{ fontSize: 44, color: '#94A3B8', mb: 1, opacity: 0.6 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                        {activeTab === 'closed' ? 'No closed applications found' : 'No job openings found'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                        {searchQuery || jobTypeFilter !== 'All'
                          ? 'Try clearing the search query or filter.'
                          : activeTab === 'closed'
                            ? 'No job openings have been closed yet.'
                            : 'No active job opportunities posted yet. Check back soon!'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedJobs.map((job, idx) => {
                    const isCreator = String(job.createdBy?._id || job.createdBy) === String(user?._id || user?.id);
                    const rowNumber = page * rowsPerPage + idx + 1;

                    return (
                      <TableRow
                        key={job._id}
                        hover
                        sx={{
                          bgcolor: '#FFFFFF',
                          transition: 'background-color 0.15s ease',
                          '&:last-child td, &:last-child th': { border: 0 }
                        }}
                      >
                        {/* # */}
                        <TableCell sx={{ py: 1.5, px: 2, fontSize: '13px', color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {rowNumber}
                        </TableCell>

                        {/* Company / Organization */}
                        <TableCell sx={{ py: 1.5, px: 2, whiteSpace: 'nowrap' }}>
                          <Stack direction="row" spacing={1.25} alignItems="center">
                            <Avatar
                              src={job.organization?.logo?.url || ''}
                              sx={{ width: 36, height: 36, bgcolor: '#EFF6FF', color: '#0088ff', fontSize: '13px', fontWeight: 700, border: '1px solid #E2E8F0' }}
                            >
                              {job.organization?.name?.charAt(0) || <BusinessIcon sx={{ fontSize: 18 }} />}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                                {job.organization?.name || 'Company'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                {job.organization?.industry || 'Industry'}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Job Role & Type */}
                        <TableCell sx={{ py: 1.5, px: 2, whiteSpace: 'nowrap' }}>
                          <Box>
                            <Typography
                              variant="body2"
                              onClick={() => { setViewingJob(job); setViewDialogOpen(true); }}
                              sx={{ fontWeight: 700, color: '#0088ff', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                            >
                              {job.jobRole}
                            </Typography>
                            <Chip
                              label={job.jobType}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '10.5px',
                                fontWeight: 700,
                                mt: 0.5,
                                bgcolor: job.jobType === 'Full-time' ? '#ECFDF5' : job.jobType === 'Internship' ? '#F5F3FF' : '#EFF6FF',
                                color: job.jobType === 'Full-time' ? '#059669' : job.jobType === 'Internship' ? '#7C3AED' : '#2563EB'
                              }}
                            />
                          </Box>
                        </TableCell>

                        {/* Location */}
                        <TableCell sx={{ py: 1.5, px: 2, whiteSpace: 'nowrap' }}>
                          <Typography variant="body2" sx={{ color: '#334155', display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '13px' }}>
                            <LocationIcon sx={{ fontSize: 15, color: '#64748B' }} />
                            {job.location}
                          </Typography>
                        </TableCell>

                        {/* Experience & Edu */}
                        <TableCell sx={{ py: 1.5, px: 2, whiteSpace: 'nowrap' }}>
                          <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 600, fontSize: '12.5px' }}>
                            {job.experienceYears}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', maxWidth: 160, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {job.educationQualification || 'Any Graduate'}
                          </Typography>
                        </TableCell>

                        {/* Salary */}
                        <TableCell sx={{ py: 1.5, px: 2, whiteSpace: 'nowrap' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A', fontSize: '13px' }}>
                            {job.salaryRange}
                          </Typography>
                        </TableCell>

                        {/* Interview Mode */}
                        <TableCell sx={{ py: 1.5, px: 2, whiteSpace: 'nowrap' }}>
                          <Chip
                            icon={job.interviewMode === 'Online' ? <OnlineInterviewIcon sx={{ fontSize: '13px !important' }} /> : <InPersonIcon sx={{ fontSize: '13px !important' }} />}
                            label={job.interviewMode || 'Online'}
                            size="small"
                            sx={{ height: 22, fontSize: '11px', fontWeight: 600, bgcolor: job.interviewMode === 'Online' ? '#EFF6FF' : '#FEF3C7', color: job.interviewMode === 'Online' ? '#1D4ED8' : '#B45309' }}
                          />
                        </TableCell>

                        {/* People Applied Count */}
                        <TableCell sx={{ py: 1.5, px: 2, textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <Chip
                            icon={<ApplicantsIcon sx={{ fontSize: '14px !important' }} />}
                            label={`${job.applicantsCount || 0} applied`}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: '11px',
                              fontWeight: 700,
                              bgcolor: (job.applicantsCount || 0) > 0 ? '#EFF6FF' : '#F8FAFC',
                              color: (job.applicantsCount || 0) > 0 ? '#1D4ED8' : '#64748B',
                              border: '1px solid',
                              borderColor: (job.applicantsCount || 0) > 0 ? '#BFDBFE' : '#E2E8F0'
                            }}
                          />
                        </TableCell>

                        {/* Openings Count */}
                        <TableCell sx={{ py: 1.5, px: 2, textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>
                            {job.openingsCount}
                          </Typography>
                        </TableCell>

                        {/* Action Buttons */}
                        <TableCell sx={{ py: 1.5, px: 2, textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <Stack direction="row" spacing={0.75} justifyContent="flex-end" alignItems="center">
                            {/* View Details */}
                            <Tooltip title="View job description & details">
                              <IconButton
                                size="small"
                                onClick={() => { setViewingJob(job); setViewDialogOpen(true); }}
                                sx={{ color: '#64748B', '&:hover': { color: '#0088ff', bgcolor: '#F0F9FF' } }}
                              >
                                <ViewIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>

                            {/* Creator or Admin controls */}
                            {(isCreator || isAdmin) && (
                              <>
                                <Tooltip title={`View applicants (${job.applicantsCount || 0})`}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenApplicants(job)}
                                    sx={{ color: '#0088ff', '&:hover': { bgcolor: '#EFF6FF' } }}
                                  >
                                    <Badge badgeContent={job.applicantsCount || 0} color="primary">
                                      <ApplicantsIcon sx={{ fontSize: 18 }} />
                                    </Badge>
                                  </IconButton>
                                </Tooltip>

                                {/* Toggle Open / Closed Status */}
                                <Tooltip title={job.status === 'Closed' ? 'Reopen job applications' : 'Close applications'}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleToggleJobStatus(job)}
                                    sx={{
                                      color: job.status === 'Closed' ? '#16A34A' : '#D97706',
                                      '&:hover': { bgcolor: job.status === 'Closed' ? '#F0FDF4' : '#FFFBEB' }
                                    }}
                                  >
                                    {job.status === 'Closed' ? <RefreshIcon sx={{ fontSize: 17 }} /> : <CloseIcon sx={{ fontSize: 17 }} />}
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Edit job opening">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenPostJob(job)}
                                    sx={{ color: '#64748B', '&:hover': { bgcolor: '#F1F5F9' } }}
                                  >
                                    <EditIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Delete job opening">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenDeleteJob(job)}
                                    sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEF2F2' } }}
                                  >
                                    <DeleteIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}

                            {/* Apply Button or Closed Status */}
                            {job.status === 'Closed' ? (
                              job.hasApplied ? (
                                <Chip
                                  icon={<AppliedCheckIcon sx={{ fontSize: '14px !important', color: '#059669 !important' }} />}
                                  label="Applied"
                                  size="small"
                                  sx={{ height: 28, px: 0.5, bgcolor: '#ECFDF5', color: '#059669', fontWeight: 700, fontSize: '11.5px', whiteSpace: 'nowrap' }}
                                />
                              ) : (
                                <Chip
                                  label="Closed"
                                  size="small"
                                  sx={{ height: 28, px: 1, bgcolor: '#F1F5F9', color: '#64748B', fontWeight: 700, fontSize: '11.5px', border: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}
                                />
                              )
                            ) : job.hasApplied ? (
                              <Chip
                                icon={<AppliedCheckIcon sx={{ fontSize: '14px !important', color: '#059669 !important' }} />}
                                label="Applied"
                                size="small"
                                sx={{ height: 28, px: 0.5, bgcolor: '#ECFDF5', color: '#059669', fontWeight: 700, fontSize: '11.5px', whiteSpace: 'nowrap' }}
                              />
                            ) : canApplyForJobs ? (
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleOpenApply(job)}
                                sx={{
                                  borderRadius: '8px',
                                  px: 1.75,
                                  py: 0.4,
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  textTransform: 'none',
                                  bgcolor: '#0088ff',
                                  boxShadow: 'none',
                                  whiteSpace: 'nowrap',
                                  '&:hover': { bgcolor: '#0077ee', boxShadow: 'none' }
                                }}
                              >
                                Apply
                              </Button>
                            ) : null}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination Footer */}
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid #EEF2F6',
              bgcolor: '#FFFFFF',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1.5,
              flexShrink: 0
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" sx={{ fontSize: '13px', color: '#64748B' }}>
                Rows per page:
              </Typography>
              <Select
                size="small"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(0);
                }}
                sx={{
                  height: 32,
                  fontSize: '13px',
                  borderRadius: '8px',
                  '& .MuiSelect-select': { py: 0.5, px: 1.25 }
                }}
              >
                {[10, 25, 50, 100].map((num) => (
                  <MenuItem key={num} value={num} sx={{ fontSize: '13px' }}>
                    {num}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="body2" sx={{ fontSize: '13px', color: '#64748B' }}>
                {filteredJobs.length === 0
                  ? '0 of 0'
                  : `${page * rowsPerPage + 1}–${Math.min((page + 1) * rowsPerPage, filteredJobs.length)} of ${filteredJobs.length}`}
              </Typography>

              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="small"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  sx={{ border: '1px solid #E2E8F0', borderRadius: '8px', p: 0.5 }}
                >
                  <ChevronLeftIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setPage(p => p + 1)}
                  disabled={(page + 1) * rowsPerPage >= filteredJobs.length}
                  sx={{ border: '1px solid #E2E8F0', borderRadius: '8px', p: 0.5 }}
                >
                  <ChevronRightIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Stack>
            </Stack>
          </Box>
        </Paper>
      )}

      {/* ── TAB 2: MY APPLICATIONS ── */}
      {activeTab === 'my-applications' && canApplyForJobs && (
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            flex: 1,
            minHeight: 0,
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            overflow: 'auto',
            p: { xs: 2, sm: 3 },
            bgcolor: '#FFFFFF'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 2 }}>
            My Submitted Applications
          </Typography>

          {myAppsLoading ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <CircularProgress size={32} sx={{ color: '#0088ff' }} />
            </Box>
          ) : myApplications.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <ResumeIcon sx={{ fontSize: 44, color: '#94A3B8', mb: 1, opacity: 0.6 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                You haven't applied to any jobs yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                Switch to the "Explore Openings" tab to find opportunities matching your profile.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setActiveTab('explore')}
                sx={{ mt: 2, borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
              >
                Browse Job Openings
              </Button>
            </Box>
          ) : (
            <Stack spacing={2}>
              {myApplications.map((app) => (
                <Card
                  key={app._id}
                  sx={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    p: 2
                  }}
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {app.job?.jobRole || 'Role Title'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>
                        {app.job?.organization?.name} • {app.job?.location}
                      </Typography>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.75, flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip
                          icon={<ApplicantsIcon sx={{ fontSize: '14px !important' }} />}
                          label={`${app.job?.applicantsCount || 1} people applied`}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: '11px',
                            fontWeight: 700,
                            bgcolor: '#EFF6FF',
                            color: '#1D4ED8',
                            border: '1px solid #BFDBFE'
                          }}
                        />
                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                          Applied on {new Date(app.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </Typography>
                        {app.job?.status === 'Closed' && (
                          <Chip
                            label="Applications Closed"
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '10.5px',
                              fontWeight: 700,
                              bgcolor: '#FEE2E2',
                              color: '#B91C1C'
                            }}
                          />
                        )}
                      </Stack>
                    </Box>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Chip
                        label={app.status}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '11px',
                          bgcolor: app.status === 'Accepted' || app.status === 'Shortlisted' ? '#DCFCE7' : app.status === 'Rejected' ? '#FEE2E2' : '#EFF6FF',
                          color: app.status === 'Accepted' || app.status === 'Shortlisted' ? '#15803D' : app.status === 'Rejected' ? '#B91C1C' : '#1D4ED8'
                        }}
                      />

                      {app.resume?.url && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ResumeIcon />}
                          href={app.resume.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ textTransform: 'none', borderRadius: '8px', fontSize: '12px' }}
                        >
                          View Resume
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Paper>
      )}

      {/* ── TAB 3: MY POSTINGS & ORGANIZATION ── */}
      {activeTab === 'my-org' && canCreateOrganization && (
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            flex: 1,
            minHeight: 0,
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            overflow: 'auto',
            p: { xs: 2, sm: 3 },
            bgcolor: '#FFFFFF'
          }}
        >
          {/* Organization Profile Card */}
          <Box sx={{ p: 2.5, mb: 3, borderRadius: '14px', border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={organization?.logo?.url || ''}
                  sx={{ width: 56, height: 56, bgcolor: '#0088ff', fontSize: '20px', fontWeight: 700 }}
                >
                  {organization?.name?.charAt(0) || <BusinessIcon />}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    {organization?.name || 'Your Organization Profile'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>
                    {organization?.industry || 'Industry'} • Head Office: {organization?.headOfficeLocation || 'Not specified'}
                  </Typography>
                  {organization?.establishedYear && (
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      Established in {organization.establishedYear} ({organization.yearsOperating || 0} years in operation)
                    </Typography>
                  )}
                </Box>
              </Stack>

              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleOpenOrgDialog}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', borderColor: '#CBD5E1' }}
              >
                Edit Company Profile
              </Button>
            </Stack>
          </Box>


          {myPostedJobs.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <WorkIcon sx={{ fontSize: 40, color: '#94A3B8', opacity: 0.5, mb: 1 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
                No active jobs posted yet under your organization
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => handleOpenPostJob()}
                sx={{ mt: 1.5, borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
              >
                Post Your First Job Opening
              </Button>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {myPostedJobs.map((job) => (
                <Card
                  key={job._id}
                  sx={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    p: 2,
                    boxShadow: 'none',
                    '&:hover': { borderColor: '#94A3B8' }
                  }}
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {job.jobRole}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>
                        {job.jobType} • {job.location} • {job.salaryRange} • {job.openingsCount} Openings
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                        Posted on {new Date(job.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ApplicantsIcon />}
                        onClick={() => handleOpenApplicants(job)}
                        sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 700 }}
                      >
                        Applicants ({job.applicantsCount || 0})
                      </Button>
                      <IconButton size="small" onClick={() => handleOpenPostJob(job)}>
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleOpenDeleteJob(job)}>
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Paper>
      )}

      {/* ── MODAL 1: ORGANIZATION PROFILE DIALOG ── */}
      <Dialog
        open={orgDialogOpen}
        onClose={() => !savingOrg && setOrgDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <BusinessIcon sx={{ color: '#0088ff' }} />
            <span>{organization ? 'Edit Organization Profile' : 'Create Organization Profile'}</span>
          </Stack>
          <IconButton size="small" onClick={() => !savingOrg && setOrgDialogOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleSaveOrganization} sx={{ mt: 1 }}>
            <Stack spacing={2.5}>
              {/* Logo / Photo */}
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Avatar
                  src={orgLogoPreview}
                  sx={{ width: 64, height: 64, bgcolor: '#EFF6FF', color: '#0088ff', border: '1px solid #CBD5E1' }}
                >
                  <BusinessIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    size="small"
                    sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
                  >
                    Upload Company Logo
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setOrgLogoFile(file);
                          setOrgLogoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </Button>

                </Box>
              </Stack>

              {/* Row 1: Name & Industry */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                    Company / Organization Name <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    value={orgForm.name}
                    onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                    Industry
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    displayEmpty
                    value={orgForm.industry}
                    onChange={(e) => setOrgForm({ ...orgForm, industry: e.target.value })}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {INDUSTRIES.map((ind) => (
                      <MenuItem key={ind} value={ind}>
                        {ind}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              </Stack>

              {/* Row 2: Head Office & Operating Locations */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                    Main Head Office Location <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    value={orgForm.headOfficeLocation}
                    onChange={(e) => setOrgForm({ ...orgForm, headOfficeLocation: e.target.value })}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                    Operating Locations List
                  </Typography>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={INDIA_LOCATIONS}
                    value={Array.isArray(orgForm.operatingLocations) ? orgForm.operatingLocations : []}
                    onChange={(_, newValue) => setOrgForm({ ...orgForm, operatingLocations: newValue })}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return (
                          <Chip
                            key={key}
                            label={option}
                            size="small"
                            {...tagProps}
                            sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, fontSize: '11px' }}
                          />
                        );
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder={orgForm.operatingLocations?.length ? '' : 'Search or type a city...'}
                      />
                    )}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F8FAFC', fontSize: '13px' }
                    }}
                  />
                </Box>
              </Stack>

              {/* Row 3: Established Year & Operating Years */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                    Established Year
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={orgForm.establishedYear}
                    onChange={(e) => {
                      const year = e.target.value;
                      const diff = year ? Math.max(0, new Date().getFullYear() - parseInt(year, 10)) : '';
                      setOrgForm({ ...orgForm, establishedYear: year, yearsOperating: diff });
                    }}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                    Number of Years Since Operating
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={orgForm.yearsOperating}
                    onChange={(e) => setOrgForm({ ...orgForm, yearsOperating: e.target.value })}
                  />
                </Box>
              </Stack>

              {/* Row 4: Website, Email, Phone */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                    Website
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={orgForm.website}
                    onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                    Contact Email
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="email"
                    value={orgForm.contactEmail}
                    onChange={(e) => setOrgForm({ ...orgForm, contactEmail: e.target.value })}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                    Contact Phone
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={orgForm.contactPhone}
                    onChange={(e) => setOrgForm({ ...orgForm, contactPhone: e.target.value })}
                  />
                </Box>
              </Stack>

              {/* About / Description */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  About the Organization / Overview
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  value={orgForm.description}
                  onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
                />
              </Box>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => resetOrgDraft()} disabled={savingOrg} sx={{ textTransform: 'none', color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveOrganization}
            disabled={savingOrg || !orgForm.name.trim() || !orgForm.headOfficeLocation.trim()}
            startIcon={savingOrg ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ borderRadius: '8px', px: 3, textTransform: 'none', fontWeight: 700, bgcolor: '#0088ff' }}
          >
            {savingOrg ? 'Saving...' : 'Save Organization Profile'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── MODAL 2: POST / EDIT JOB OPENING DIALOG ── */}
      <Dialog
        open={jobDialogOpen}
        onClose={() => !savingJob && setJobDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <WorkIcon sx={{ color: '#0088ff' }} />
            <span>{editingJob ? 'Edit Job Opening' : 'Post New Job Opening'}</span>
          </Stack>
          <IconButton size="small" onClick={() => !savingJob && setJobDialogOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleSaveJob} sx={{ mt: 1 }}>
            <Stack spacing={2.5}>
              {/* Role & Type */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                    Job Role / Title <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    value={jobForm.jobRole}
                    onChange={(e) => setJobForm({ ...jobForm, jobRole: e.target.value })}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                    Job Type
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    displayEmpty
                    value={jobForm.jobType}
                    onChange={(e) => setJobForm({ ...jobForm, jobType: e.target.value })}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {JOB_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              </Stack>

              {/* Location & Salary */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                    Job Location <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                    Salary Range
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={jobForm.salaryRange}
                    onChange={(e) => setJobForm({ ...jobForm, salaryRange: e.target.value })}
                  />
                </Box>
              </Stack>

              {/* Experience & Education */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                    Experience Required <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    value={jobForm.experienceYears}
                    onChange={(e) => setJobForm({ ...jobForm, experienceYears: e.target.value })}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                    Education Qualification
                  </Typography>
                  <Autocomplete
                    freeSolo
                    fullWidth
                    options={EDUCATION_DEGREES}
                    value={jobForm.educationQualification}
                    onChange={(_, newValue) => setJobForm({ ...jobForm, educationQualification: newValue || '' })}
                    onInputChange={(_, newInputValue) => setJobForm({ ...jobForm, educationQualification: newInputValue })}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                      />
                    )}
                  />
                </Box>
              </Stack>

              {/* Number of Openings */}
              <Box sx={{ maxWidth: { sm: 260 } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Number of Openings
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={jobForm.openingsCount}
                  onChange={(e) => setJobForm({ ...jobForm, openingsCount: e.target.value })}
                  size="small"
                />
              </Box>

              {/* Interview Process & Timing Details */}
              <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: 18, color: '#0088ff' }} /> Interview Process & Timing Details
                  </Typography>
                  {jobForm.interviewTiming && (
                    <Chip
                      label={jobForm.interviewTiming}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: '11px' }}
                    />
                  )}
                </Stack>

                <Stack spacing={2.5}>
                  {/* Interview Mode Selector */}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                      Interview Mode
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      displayEmpty
                      value={jobForm.interviewMode}
                      onChange={(e) => setJobForm({ ...jobForm, interviewMode: e.target.value })}
                    >
                      <MenuItem value=""><em>None</em></MenuItem>
                      <MenuItem value="Online">Online (Google Meet / Zoom / MS Teams / Video Call)</MenuItem>
                      <MenuItem value="Offline / In-person">Offline / In-person (Office / Venue Visit)</MenuItem>
                    </Select>
                  </Box>

                  {/* Timing Pickers: MUI Date range & Time picker */}
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Box sx={{ pt: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, display: 'block' }}>
                        Interview Timing & Availability (Date Range & Time Range):
                      </Typography>
                      <Stack spacing={2}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                              Interview Start Date
                            </Typography>
                            <DatePicker
                              format="DD/MM/YYYY"
                              value={jobForm.interviewStartDate ? dayjs(jobForm.interviewStartDate) : null}
                              onChange={(newValue) => {
                                const sDate = newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '';
                                const timing = computeTimingSummary(sDate, jobForm.interviewEndDate, jobForm.interviewStartTime, jobForm.interviewEndTime);
                                setJobForm({ ...jobForm, interviewStartDate: sDate, interviewTiming: timing });
                              }}
                              slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                          </Box>

                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                              Interview End Date
                            </Typography>
                            <DatePicker
                              format="DD/MM/YYYY"
                              value={jobForm.interviewEndDate ? dayjs(jobForm.interviewEndDate) : null}
                              onChange={(newValue) => {
                                const eDate = newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '';
                                const timing = computeTimingSummary(jobForm.interviewStartDate, eDate, jobForm.interviewStartTime, jobForm.interviewEndTime);
                                setJobForm({ ...jobForm, interviewEndDate: eDate, interviewTiming: timing });
                              }}
                              slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                          </Box>
                        </Stack>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                              Daily Start Time
                            </Typography>
                            <TimePicker
                              value={jobForm.interviewStartTime ? dayjs(`2000-01-01T${jobForm.interviewStartTime}`) : null}
                              onChange={(newValue) => {
                                const sTime = newValue && newValue.isValid() ? newValue.format('HH:mm') : '';
                                const timing = computeTimingSummary(jobForm.interviewStartDate, jobForm.interviewEndDate, sTime, jobForm.interviewEndTime);
                                setJobForm({ ...jobForm, interviewStartTime: sTime, interviewTiming: timing });
                              }}
                              slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                          </Box>

                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                              Daily End Time
                            </Typography>
                            <TimePicker
                              value={jobForm.interviewEndTime ? dayjs(`2000-01-01T${jobForm.interviewEndTime}`) : null}
                              onChange={(newValue) => {
                                const eTime = newValue && newValue.isValid() ? newValue.format('HH:mm') : '';
                                const timing = computeTimingSummary(jobForm.interviewStartDate, jobForm.interviewEndDate, jobForm.interviewStartTime, eTime);
                                setJobForm({ ...jobForm, interviewEndTime: eTime, interviewTiming: timing });
                              }}
                              slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                          </Box>
                        </Stack>
                      </Stack>
                    </Box>
                  </LocalizationProvider>

                  {/* Mode-Specific Fields */}
                  {jobForm.interviewMode === 'Online' && (
                    <Stack spacing={2} sx={{ pt: 1 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                          Meeting Link (Google Meet / Zoom / MS Teams) <span style={{ color: '#EF4444' }}>*</span>
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={jobForm.meetingLink || ''}
                          onChange={(e) => setJobForm({ ...jobForm, meetingLink: e.target.value })}
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LinkIcon sx={{ fontSize: 18, color: '#0088ff' }} />
                                </InputAdornment>
                              ),
                              endAdornment: jobForm.meetingLink ? (
                                <InputAdornment position="end">
                                  <Button
                                    size="small"
                                    href={jobForm.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{ textTransform: 'none', fontSize: '11px', py: 0.25 }}
                                  >
                                    Test Link
                                  </Button>
                                </InputAdornment>
                              ) : null
                            }
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                          Online Interview Instructions
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={jobForm.interviewLocation || ''}
                          onChange={(e) => setJobForm({ ...jobForm, interviewLocation: e.target.value })}
                        />
                      </Box>
                    </Stack>
                  )}

                  {jobForm.interviewMode === 'Offline / In-person' && (
                    <Stack spacing={2} sx={{ pt: 1 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                          Google Maps Location Link <span style={{ color: '#EF4444' }}>*</span>
                        </Typography>
                        {(() => {
                          const val = jobForm.googleMapLink || '';
                          const isValidMapsUrl = (url) => {
                            if (!url.trim()) return null; // neutral
                            return /^https?:\/\/(maps\.google\.|google\.[a-z.]+\/maps|goo\.gl\/maps|maps\.app\.goo\.gl)/i.test(url.trim());
                          };
                          const valid = isValidMapsUrl(val);
                          const borderColor = valid === null ? '#E2E8F0' : valid ? '#16A34A' : '#DC2626';
                          const bgColor = valid === null ? '#F8FAFC' : valid ? '#F0FDF4' : '#FEF2F2';
                          return (
                            <>
                              <TextField
                                fullWidth
                                size="small"
                                value={val}
                                onChange={(e) => setJobForm({ ...jobForm, googleMapLink: e.target.value })}
                                error={valid === false}
                                slotProps={{
                                  input: {
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <MapIcon sx={{ fontSize: 18, color: valid === false ? '#DC2626' : valid ? '#16A34A' : '#EA4335' }} />
                                      </InputAdornment>
                                    ),
                                    endAdornment: val ? (
                                      <InputAdornment position="end">
                                        <Button
                                          size="small"
                                          href={valid ? val : undefined}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          disabled={!valid}
                                          sx={{ textTransform: 'none', fontSize: '11px', py: 0.25 }}
                                        >
                                          Open Map
                                        </Button>
                                      </InputAdornment>
                                    ) : null
                                  }
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: '10px',
                                    bgcolor: bgColor,
                                    '& fieldset': { borderColor },
                                    '&:hover fieldset': { borderColor },
                                    '&.Mui-focused fieldset': { borderColor }
                                  }
                                }}
                              />
                              {valid === false && (
                                <Typography variant="caption" sx={{ color: '#DC2626', mt: 0.5, display: 'block', fontWeight: 500 }}>
                                  Please paste a valid Google Maps link (e.g. maps.google.com/... or goo.gl/maps/...)
                                </Typography>
                              )}
                            </>
                          );
                        })()}
                      </Box>

                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, mt: 0.5 }}>
                        Physical Venue & Address Details:
                      </Typography>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                            Building / Venue / Company Name
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            value={jobForm.offlineAddress?.venueName || ''}
                            onChange={(e) => setJobForm({
                              ...jobForm,
                              offlineAddress: { ...jobForm.offlineAddress, venueName: e.target.value }
                            })}
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                            Street / Floor / Room No
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            value={jobForm.offlineAddress?.street || ''}
                            onChange={(e) => setJobForm({
                              ...jobForm,
                              offlineAddress: { ...jobForm.offlineAddress, street: e.target.value }
                            })}
                          />
                        </Box>
                      </Stack>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                            City
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            value={jobForm.offlineAddress?.city || ''}
                            onChange={(e) => setJobForm({
                              ...jobForm,
                              offlineAddress: { ...jobForm.offlineAddress, city: e.target.value }
                            })}
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                            State
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            value={jobForm.offlineAddress?.state || ''}
                            onChange={(e) => setJobForm({
                              ...jobForm,
                              offlineAddress: { ...jobForm.offlineAddress, state: e.target.value }
                            })}
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                            PIN Code
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            value={jobForm.offlineAddress?.pincode || ''}
                            onChange={(e) => setJobForm({
                              ...jobForm,
                              offlineAddress: { ...jobForm.offlineAddress, pincode: e.target.value }
                            })}
                          />
                        </Box>
                      </Stack>

                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                          Landmark
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={jobForm.offlineAddress?.landmark || ''}
                          onChange={(e) => setJobForm({
                            ...jobForm,
                            offlineAddress: { ...jobForm.offlineAddress, landmark: e.target.value }
                          })}
                        />
                      </Box>
                    </Stack>
                  )}
                </Stack>
              </Box>

              {/* Application Documents Required (Multi-Select) */}
              <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 1.5 }}>
                  Application Documents Required
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={jobForm.resumeRequired}
                      onChange={(e) => setJobForm({ ...jobForm, resumeRequired: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Require Resume / CV upload upon application</Typography>}
                />
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                    Documents to Carry / Submit (Multi-select)
                  </Typography>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={REQUIRED_DOCUMENTS_OPTIONS}
                    value={Array.isArray(jobForm.documentsRequired) ? jobForm.documentsRequired : []}
                    onChange={(_, newValue) => setJobForm({ ...jobForm, documentsRequired: newValue })}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          {...getTagProps({ index })}
                          key={option}
                          label={option}
                          size="small"
                          sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, fontSize: '11px', m: 0.25 }}
                        />
                      ))
                    }
                    renderOption={(props, option, { selected }) => {
                      const { key, ...optionProps } = props;
                      return (
                        <li key={key} {...optionProps}>
                          <Checkbox size="small" checked={selected} sx={{ mr: 1, p: 0.5 }} />
                          <Typography variant="body2" sx={{ fontSize: '13px' }}>{option}</Typography>
                        </li>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                      />
                    )}
                  />
                </Box>
              </Box>

              {/* Role Description */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Job Description & Responsibilities
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  size="small"
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                />
              </Box>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => resetJobDraft()} disabled={savingJob} sx={{ textTransform: 'none', color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveJob}
            disabled={savingJob || !jobForm.jobRole.trim() || !jobForm.location.trim()}
            startIcon={savingJob ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ borderRadius: '8px', px: 3, textTransform: 'none', fontWeight: 700, bgcolor: '#0088ff' }}
          >
            {savingJob ? 'Posting...' : editingJob ? 'Save Changes' : 'Publish Job Opening'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── MODAL 3: VIEW JOB DETAILS DIALOG ── */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Job Opening Overview</span>
          <IconButton size="small" onClick={() => setViewDialogOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewingJob && (
            <Stack spacing={3}>
              {/* Header Box */}
              <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      src={viewingJob.organization?.logo?.url || ''}
                      sx={{ width: 54, height: 54, bgcolor: '#0088ff', fontWeight: 700, fontSize: '18px' }}
                    >
                      {viewingJob.organization?.name?.charAt(0) || <BusinessIcon />}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                        {viewingJob.jobRole}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
                        {viewingJob.organization?.name} • {viewingJob.organization?.industry}
                      </Typography>
                    </Box>
                  </Stack>

                  <Chip
                    label={viewingJob.jobType}
                    color="primary"
                    sx={{ fontWeight: 700, borderRadius: '8px' }}
                  />
                </Stack>

                {/* Key Metrics */}
                <Stack direction="row" flexWrap="wrap" gap={2.5} sx={{ mt: 2.5, pt: 2, borderTop: '1px solid #E2E8F0' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Location</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationIcon sx={{ fontSize: 16, color: '#0088ff' }} /> {viewingJob.location}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Salary Range</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
                      {viewingJob.salaryRange}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Experience</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                      {viewingJob.experienceYears}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Openings</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                      {viewingJob.openingsCount} Vacancies
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Education & Description */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
                  Education Qualification Required:
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155' }}>
                  {viewingJob.educationQualification || 'Any Graduate / Equivalent Degree'}
                </Typography>
              </Box>

              {viewingJob.description && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
                    Job Description & Responsibilities:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {viewingJob.description}
                  </Typography>
                </Box>
              )}

              {/* Interview Process & Schedule Info */}
              <Box sx={{ p: 2.5, bgcolor: '#F0F9FF', borderRadius: '12px', borderLeft: '4px solid #0088ff' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0088ff', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon sx={{ fontSize: 18 }} /> Interview Schedule & Process ({viewingJob.interviewMode})
                </Typography>

                {viewingJob.interviewTiming && (
                  <Typography variant="body2" sx={{ color: '#334155', mb: 1 }}>
                    <strong>Timing & Availability:</strong> {viewingJob.interviewTiming}
                  </Typography>
                )}

                {viewingJob.interviewMode === 'Online' ? (
                  <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#FFFFFF', borderRadius: '8px', border: '1px solid #BAE6FD' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#0284C7', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                      Online Meeting Link
                    </Typography>
                    {viewingJob.meetingLink ? (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#0F172A', wordBreak: 'break-all', fontWeight: 600 }}>
                          {viewingJob.meetingLink}
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<LinkIcon />}
                          href={viewingJob.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ textTransform: 'none', bgcolor: '#0088ff', borderRadius: '6px', fontSize: '12px', whiteSpace: 'nowrap' }}
                        >
                          Join Meeting
                        </Button>
                      </Stack>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#64748B' }}>
                        Meeting link will be shared via email upon shortlist.
                      </Typography>
                    )}
                    {viewingJob.interviewLocation && (
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1 }}>
                        <strong>Instructions:</strong> {viewingJob.interviewLocation}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#FFFFFF', borderRadius: '8px', border: '1px solid #BAE6FD' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#0284C7', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                      In-Person Venue & Physical Address
                    </Typography>

                    {viewingJob.googleMapLink && (
                      <Box sx={{ mb: 1.5 }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<MapIcon />}
                          href={viewingJob.googleMapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            textTransform: 'none',
                            bgcolor: '#EA4335',
                            '&:hover': { bgcolor: '#DC2626' },
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700
                          }}
                        >
                          Navigate via Google Maps
                        </Button>
                      </Box>
                    )}

                    {viewingJob.offlineAddress?.venueName ? (
                      <Stack spacing={0.5}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          🏢 {viewingJob.offlineAddress.venueName}
                        </Typography>
                        {viewingJob.offlineAddress.street && (
                          <Typography variant="body2" sx={{ color: '#334155' }}>
                            📍 {viewingJob.offlineAddress.street}
                          </Typography>
                        )}
                        <Typography variant="body2" sx={{ color: '#334155' }}>
                          {[viewingJob.offlineAddress.city, viewingJob.offlineAddress.state, viewingJob.offlineAddress.pincode].filter(Boolean).join(', ')}
                        </Typography>
                        {viewingJob.offlineAddress.landmark && (
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            <strong>Landmark:</strong> {viewingJob.offlineAddress.landmark}
                          </Typography>
                        )}
                      </Stack>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#334155' }}>
                        {viewingJob.interviewLocation || viewingJob.location}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>

              {/* Documents to Carry & Requirements */}
              <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
                  Documents to Carry / Submit:
                </Typography>
                {(() => {
                  let docs = [];
                  if (Array.isArray(viewingJob.documentsRequired)) {
                    docs = viewingJob.documentsRequired;
                  } else if (typeof viewingJob.documentsRequired === 'string' && viewingJob.documentsRequired.trim()) {
                    docs = viewingJob.documentsRequired.split(',').map(s => s.trim()).filter(Boolean);
                  }
                  if (docs.length === 0) {
                    return (
                      <Typography variant="body2" sx={{ color: '#64748B' }}>
                        Updated Resume / CV and valid Government Photo ID Proof.
                      </Typography>
                    );
                  }
                  return (
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {docs.map((d) => (
                        <Chip
                          key={d}
                          label={d}
                          size="small"
                          sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, fontSize: '11px' }}
                        />
                      ))}
                    </Stack>
                  );
                })()}

                {viewingJob.resumeRequired && (
                  <Chip
                    label="Resume / CV Upload is Mandatory upon Application"
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1.5, fontWeight: 700, fontSize: '11px' }}
                  />
                )}
              </Box>

              {/* Company Info Box */}
              {viewingJob.organization && (
                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
                    About {viewingJob.organization.name}
                  </Typography>
                  {viewingJob.organization.description && (
                    <Typography variant="body2" sx={{ color: '#64748B', mb: 1.5, lineHeight: 1.5 }}>
                      {viewingJob.organization.description}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    {viewingJob.organization.website && (
                      <Button
                        size="small"
                        startIcon={<WebsiteIcon />}
                        href={viewingJob.organization.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ textTransform: 'none', fontSize: '12px' }}
                      >
                        Visit Website
                      </Button>
                    )}
                    {viewingJob.organization.contactEmail && (
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmailIcon sx={{ fontSize: 14 }} /> {viewingJob.organization.contactEmail}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setViewDialogOpen(false)} sx={{ textTransform: 'none', color: '#64748B' }}>
            Close
          </Button>
          {viewingJob && !viewingJob.hasApplied && viewingJob.status !== 'Closed' && canApplyForJobs && (
            <Button
              variant="contained"
              onClick={() => {
                setViewDialogOpen(false);
                handleOpenApply(viewingJob);
              }}
              sx={{ borderRadius: '8px', px: 3, textTransform: 'none', fontWeight: 700, bgcolor: '#0088ff' }}
            >
              Apply for this Role
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ── MODAL 4: APPLY FOR JOB DIALOG ── */}
      <Dialog
        open={applyDialogOpen}
        onClose={() => !submittingApp && setApplyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Apply for {applyingJob?.jobRole}</span>
          <IconButton size="small" onClick={() => !submittingApp && setApplyDialogOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handleSubmitApplication} sx={{ mt: 1 }}>
            <Stack spacing={2.5}>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Applying to <strong>{applyingJob?.organization?.name}</strong> for the <strong>{applyingJob?.jobRole}</strong> position.
              </Typography>

              {/* Documents to Carry Checklist Notice */}
              {(() => {
                let docs = [];
                if (Array.isArray(applyingJob?.documentsRequired)) {
                  docs = applyingJob.documentsRequired;
                } else if (typeof applyingJob?.documentsRequired === 'string' && applyingJob.documentsRequired.trim()) {
                  docs = applyingJob.documentsRequired.split(',').map(s => s.trim()).filter(Boolean);
                }
                if (docs.length === 0) return null;
                return (
                  <Box sx={{ p: 2, bgcolor: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#166534', mb: 0.75, display: 'flex', alignItems: 'center', gap: 0.75, fontSize: '13px' }}>
                      <CheckIcon sx={{ fontSize: 16 }} /> Documents required for this interview / selection process:
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                      {docs.map((d) => (
                        <Chip
                          key={d}
                          label={d}
                          size="small"
                          sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 600, fontSize: '11px' }}
                        />
                      ))}
                    </Stack>
                  </Box>
                );
              })()}

              {/* Applicant Name & Email */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                    Full Name <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    required
                    value={applyForm.applicantName}
                    onChange={(e) => setApplyForm({ ...applyForm, applicantName: e.target.value })}
                    size="small"
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                    Email Address <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    type="email"
                    required
                    value={applyForm.applicantEmail}
                    onChange={(e) => setApplyForm({ ...applyForm, applicantEmail: e.target.value })}
                    size="small"
                  />
                </Box>
              </Stack>

              {/* Phone & Experience */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                    Phone Number
                  </Typography>
                  <TextField
                    fullWidth
                    value={applyForm.applicantPhone}
                    onChange={(e) => setApplyForm({ ...applyForm, applicantPhone: e.target.value })}
                    size="small"
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                    Your Experience
                  </Typography>
                  <TextField
                    fullWidth
                    value={applyForm.experience}
                    onChange={(e) => setApplyForm({ ...applyForm, experience: e.target.value })}
                    size="small"
                  />
                </Box>
              </Stack>

              {/* Education */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Education / Degree
                </Typography>
                <TextField
                  fullWidth
                  value={applyForm.education}
                  onChange={(e) => setApplyForm({ ...applyForm, education: e.target.value })}
                  size="small"
                />
              </Box>

              {/* Resume Upload */}
              <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
                  Upload Resume / CV {applyingJob?.resumeRequired && <span style={{ color: '#EF4444' }}>*</span>}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                  PDF, DOCX, or Image formats up to 20MB.
                </Typography>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    size="small"
                    sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
                  >
                    Select Resume File
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.doc,.docx,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setResumeFile(file);
                      }}
                    />
                  </Button>

                  {resumeFile && (
                    <Chip
                      icon={<ResumeIcon />}
                      label={`${resumeFile.name} (${Math.round(resumeFile.size / 1024)} KB)`}
                      onDelete={() => setResumeFile(null)}
                      color="primary"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                </Stack>
              </Box>

              {/* Cover Note */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Cover Note / Why should we hire you? (Optional)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={applyForm.coverNote}
                  onChange={(e) => setApplyForm({ ...applyForm, coverNote: e.target.value })}
                  size="small"
                />
              </Box>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => resetApplyDraft()} disabled={submittingApp} sx={{ textTransform: 'none', color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitApplication}
            disabled={submittingApp || !applyForm.applicantName.trim() || !applyForm.applicantEmail.trim() || (applyingJob?.resumeRequired && !resumeFile)}
            startIcon={submittingApp ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ borderRadius: '8px', px: 3, textTransform: 'none', fontWeight: 700, bgcolor: '#0088ff' }}
          >
            {submittingApp ? 'Submitting Application...' : 'Submit Application'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── MODAL 5: VIEW APPLICANTS DIALOG (FOR EMPLOYERS) ── */}
      <Dialog
        open={applicantsDialogOpen}
        onClose={() => setApplicantsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <ApplicantsIcon sx={{ color: '#0088ff' }} />
            <span>Applicants for {applicantsJob?.jobRole} ({applicantsList.length})</span>
          </Stack>
          <IconButton size="small" onClick={() => setApplicantsDialogOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loadingApplicants ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <CircularProgress size={32} sx={{ color: '#0088ff' }} />
            </Box>
          ) : applicantsList.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <ApplicantsIcon sx={{ fontSize: 44, color: '#94A3B8', opacity: 0.5, mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                No applications submitted yet for this role
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                When candidates apply, their resumes and contact info will appear here.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {applicantsList.map((app) => (
                <Card
                  key={app._id}
                  sx={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    p: 2,
                    boxShadow: 'none'
                  }}
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        src={app.applicant?.profilePhoto?.url || ''}
                        sx={{ width: 44, height: 44, bgcolor: '#0088ff', fontWeight: 700 }}
                      >
                        {app.applicantName?.charAt(0) || 'A'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          {app.applicantName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748B', fontSize: '13px' }}>
                          {app.applicantEmail} • {app.applicantPhone || 'No Phone'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.25 }}>
                          Experience: {app.experience || 'Not specified'} | Education: {app.education || 'Not specified'}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                      {/* Resume download button */}
                      {app.resume?.url && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<ResumeIcon />}
                          href={app.resume.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ textTransform: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}
                        >
                          View Resume
                        </Button>
                      )}

                      {/* Status selector */}
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <Select
                          value={app.status}
                          onChange={(e) => handleUpdateApplicantStatus(app._id, e.target.value)}
                          sx={{ height: 32, fontSize: '12px', fontWeight: 700, borderRadius: '8px' }}
                        >
                          <MenuItem value="Applied">Applied</MenuItem>
                          <MenuItem value="Shortlisted">Shortlisted</MenuItem>
                          <MenuItem value="Interview Scheduled">Interview Scheduled</MenuItem>
                          <MenuItem value="Accepted">Accepted</MenuItem>
                          <MenuItem value="Rejected">Rejected</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>
                  </Stack>

                  {app.coverNote && (
                    <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#F8FAFC', borderRadius: '8px' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block' }}>
                        Candidate Note:
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#334155', fontStyle: 'italic', fontSize: '12.5px' }}>
                        "{app.coverNote}"
                      </Typography>
                    </Box>
                  )}
                </Card>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setApplicantsDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── MODAL 6: DELETE JOB CONFIRMATION DIALOG ── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon sx={{ color: '#EF4444' }} />
          <span>Delete Job Opening</span>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Are you sure you want to delete this job opening for <strong>{deletingJob?.jobRole}</strong>? All submitted applications for this role will also be removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting} sx={{ textTransform: 'none', color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDeleteJob}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ borderRadius: '8px', px: 2.5, textTransform: 'none', fontWeight: 700 }}
          >
            {deleting ? 'Deleting...' : 'Delete Job'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
