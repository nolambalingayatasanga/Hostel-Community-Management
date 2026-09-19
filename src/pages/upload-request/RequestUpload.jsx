import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stack,
  Tooltip,
  Divider,
  Paper,
  Badge
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Collections as GalleryIcon,
  CloudQueue as DriveIcon,
  Event as EventIcon,
  Delete as DeleteIcon,
  CheckCircle as ApprovedIcon,
  HourglassEmpty as PendingIcon,
  Cancel as RejectedIcon,
  OpenInNew as OpenInNewIcon,
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  InfoOutlined as InfoIcon,
  PhotoCamera as PhotoCameraIcon,
  PlayCircle as PlayIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionContext';
import API from '../../api';

// Drive categories
const DRIVE_CATEGORIES = [
  'General',
  'Cultural',
  'Sports',
  'Celebration',
  'Reunion',
  'Workshop',
  'Academics',
  'Farewell',
  'Freshers'
];

export default function RequestUpload() {
  const { user } = useAuth();
  const { getPagePermissions } = usePermissions();
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Review / moderation permissions
  const pagePerms = getPagePermissions('request_upload');
  const isAdminOrReviewer = Boolean(
    user?.role === 'ADMIN' ||
    user?.role === 'WARDEN' ||
    user?.role === 'CHAIRPERSON' ||
    pagePerms?.fullAccess ||
    pagePerms?.update
  );

  const adminTabs = ['request_queue', 'request_accepted', 'request_rejected'];
  const userTabs = ['submit', 'my_requests'];

  // Active top-level tab
  const urlTab = searchParams.get('tab');
  const initialTab = isAdminOrReviewer
    ? (adminTabs.includes(urlTab) ? urlTab : 'request_queue')
    : (userTabs.includes(urlTab) ? urlTab : 'submit');

  const [activeTab, setActiveTab] = useState(initialTab);

  // Synchronize tab if user role/permissions change
  useEffect(() => {
    if (isAdminOrReviewer) {
      if (!adminTabs.includes(activeTab)) {
        setActiveTab('request_queue');
      }
    } else {
      if (!userTabs.includes(activeTab)) {
        setActiveTab('submit');
      }
    }
  }, [isAdminOrReviewer]);

  // ----------------------------------------------------
  // Form State (Normal User submission)
  // ----------------------------------------------------
  const [targetCategory, setTargetCategory] = useState(
    searchParams.get('category') || 'gallery'
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Gallery specific
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState([]); // [{ url, publicId, storageProvider, resourceType, originalName, size, caption }]
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef(null);

  // Drive specific
  const [driveUrl, setDriveUrl] = useState('');
  const [driveCategory, setDriveCategory] = useState('General');
  const [driveEventDate, setDriveEventDate] = useState('');
  const [driveThumbnail, setDriveThumbnail] = useState('');
  const [driveThumbnailFocus, setDriveThumbnailFocus] = useState('center');
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const thumbInputRef = useRef(null);

  // Event specific
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [eventLocation, setEventLocation] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [eventColor, setEventColor] = useState('#0088ff');
  const [eventCover, setEventCover] = useState({ url: '', publicId: '' });
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);

  // ----------------------------------------------------
  // User Submissions State (Normal User)
  // ----------------------------------------------------
  const [myRequests, setMyRequests] = useState([]);
  const [loadingMyRequests, setLoadingMyRequests] = useState(false);
  const [myStatusFilter, setMyStatusFilter] = useState('ALL');

  // ----------------------------------------------------
  // Moderation State (Admin / Reviewer)
  // ----------------------------------------------------
  const [moderationList, setModerationList] = useState([]);
  const [loadingModeration, setLoadingModeration] = useState(false);
  const [modCategoryFilter, setModCategoryFilter] = useState('ALL');
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });

  // Moderation Dialogs
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequestForReview, setSelectedRequestForReview] = useState(null);
  const [rejectionFeedback, setRejectionFeedback] = useState('');
  const [reviewingId, setReviewingId] = useState(null);

  // Media Preview Dialog
  const [previewMedia, setPreviewMedia] = useState(null);

  // Delete Request Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ----------------------------------------------------
  // Data Fetching
  // ----------------------------------------------------
  useEffect(() => {
    // Fetch gallery folders for folder dropdown
    const fetchFolders = async () => {
      try {
        const res = await API.get('/gallery/folders');
        if (res.data?.success) {
          setFolders(res.data.data.folders || []);
        }
      } catch (err) {
        console.error('Failed to load gallery folders:', err);
      }
    };
    fetchFolders();
  }, []);

  const fetchMyRequests = async () => {
    try {
      setLoadingMyRequests(true);
      const res = await API.get('/upload-requests/my-requests');
      if (res.data?.success) {
        setMyRequests(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch user upload requests:', err);
    } finally {
      setLoadingMyRequests(false);
    }
  };

  const fetchModerationRequests = async (statusOverride = null) => {
    if (!isAdminOrReviewer) return;
    try {
      setLoadingModeration(true);
      let statusToFetch = statusOverride;
      if (!statusToFetch) {
        if (activeTab === 'request_accepted') statusToFetch = 'APPROVED';
        else if (activeTab === 'request_rejected') statusToFetch = 'REJECTED';
        else statusToFetch = 'PENDING';
      }
      const res = await API.get('/upload-requests', {
        params: {
          status: statusToFetch,
          category: modCategoryFilter
        }
      });
      if (res.data?.success) {
        setModerationList(res.data.data || []);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
      }
    } catch (err) {
      console.error('Failed to fetch moderation queue:', err);
    } finally {
      setLoadingModeration(false);
    }
  };

  useEffect(() => {
    if (!isAdminOrReviewer) {
      if (activeTab === 'my_requests') {
        fetchMyRequests();
      }
    } else {
      if (activeTab === 'request_queue') {
        fetchModerationRequests('PENDING');
      } else if (activeTab === 'request_accepted') {
        fetchModerationRequests('APPROVED');
      } else if (activeTab === 'request_rejected') {
        fetchModerationRequests('REJECTED');
      }
    }
  }, [activeTab, modCategoryFilter, isAdminOrReviewer]);

  // Handle URL changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (isAdminOrReviewer) {
      if (tab && adminTabs.includes(tab)) {
        setActiveTab(tab);
      }
    } else {
      if (tab && userTabs.includes(tab)) {
        setActiveTab(tab);
      }
    }
    const cat = searchParams.get('category');
    if (cat && ['gallery', 'drive_links', 'events'].includes(cat)) {
      setTargetCategory(cat);
    }
  }, [searchParams, isAdminOrReviewer]);

  // ----------------------------------------------------
  // File Upload Handlers
  // ----------------------------------------------------
  const handleDirectUploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await API.post('/upload-requests/upload-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data?.data;
  };

  const handleMediaFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploadingFiles(true);
      const newItems = [];
      for (const file of files) {
        try {
          const uploaded = await handleDirectUploadFile(file);
          if (uploaded) {
            newItems.push({
              url: uploaded.url,
              publicId: uploaded.publicId,
              storageProvider: uploaded.storageProvider,
              resourceType: uploaded.resourceType,
              originalName: uploaded.originalName,
              size: uploaded.size,
              caption: ''
            });
          }
        } catch (uploadErr) {
          enqueueSnackbar(`Failed to upload ${file.name}: ${uploadErr.response?.data?.message || uploadErr.message}`, {
            variant: 'error'
          });
        }
      }
      setUploadedMedia((prev) => [...prev, ...newItems]);
      enqueueSnackbar(`Successfully uploaded ${newItems.length} file(s)!`, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Upload failed', { variant: 'error' });
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleThumbnailSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingThumb(true);
      const uploaded = await handleDirectUploadFile(file);
      if (uploaded) {
        setDriveThumbnail(uploaded.url);
        enqueueSnackbar('Thumbnail uploaded successfully!', { variant: 'success' });
      }
    } catch (err) {
      enqueueSnackbar(`Thumbnail upload failed: ${err.response?.data?.message || err.message}`, { variant: 'error' });
    } finally {
      setUploadingThumb(false);
      if (thumbInputRef.current) thumbInputRef.current.value = '';
    }
  };

  const handleCoverSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      const uploaded = await handleDirectUploadFile(file);
      if (uploaded) {
        setEventCover({ url: uploaded.url, publicId: uploaded.publicId });
        enqueueSnackbar('Event cover uploaded successfully!', { variant: 'success' });
      }
    } catch (err) {
      enqueueSnackbar(`Cover upload failed: ${err.response?.data?.message || err.message}`, { variant: 'error' });
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleRemoveMedia = (index) => {
    setUploadedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCaptionChange = (index, val) => {
    setUploadedMedia((prev) =>
      prev.map((item, i) => (i === index ? { ...item, caption: val } : item))
    );
  };

  // ----------------------------------------------------
  // Submit Form Handler (Normal User)
  // ----------------------------------------------------
  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      enqueueSnackbar('Please enter a title for your submission.', { variant: 'warning' });
      return;
    }

    if (targetCategory === 'gallery') {
      if (uploadedMedia.length === 0) {
        enqueueSnackbar('Please upload at least one photo or video.', { variant: 'warning' });
        return;
      }
    } else if (targetCategory === 'drive_links') {
      if (!driveUrl.trim()) {
        enqueueSnackbar('Please enter the Google Drive URL.', { variant: 'warning' });
        return;
      }
      if (!driveEventDate) {
        enqueueSnackbar('Please choose the event date.', { variant: 'warning' });
        return;
      }
    } else if (targetCategory === 'events') {
      if (!eventDate || !startTime || !endTime || !eventLocation.trim()) {
        enqueueSnackbar('Please fill in date, start time, end time, and location for the event.', {
          variant: 'warning'
        });
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        targetCategory,
        title: title.trim(),
        description: description.trim(),
        media: targetCategory === 'drive_links' ? [] : uploadedMedia,
        galleryFolder: selectedFolder || null,
        driveUrl: driveUrl.trim(),
        driveCategory,
        driveEventDate: driveEventDate || undefined,
        driveThumbnail,
        driveThumbnailFocus,
        eventDetails: targetCategory === 'events' ? {
          eventDate,
          startTime,
          endTime,
          location: eventLocation.trim(),
          locationUrl: locationUrl.trim(),
          color: eventColor,
          coverImage: eventCover
        } : undefined
      };

      const res = await API.post('/upload-requests', payload);
      if (res.data?.success) {
        enqueueSnackbar('Request submitted successfully! It is now in the review queue.', {
          variant: 'success'
        });
        // Reset form
        setTitle('');
        setDescription('');
        setUploadedMedia([]);
        setSelectedFolder('');
        setDriveUrl('');
        setDriveEventDate('');
        setDriveThumbnail('');
        setEventDate('');
        setEventLocation('');
        setLocationUrl('');
        setEventCover({ url: '', publicId: '' });

        // Switch to My Submissions tab
        setActiveTab('my_requests');
        setSearchParams({ tab: 'my_requests' });
        fetchMyRequests();
      }
    } catch (err) {
      enqueueSnackbar(`Submission error: ${err.response?.data?.message || err.message}`, {
        variant: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // Review Handler (Approve / Reject) - Admin / Reviewer
  // ----------------------------------------------------
  const handleApprove = async (request) => {
    try {
      setReviewingId(request._id);
      const res = await API.put(`/upload-requests/${request._id}/review`, {
        status: 'APPROVED'
      });
      if (res.data?.success) {
        enqueueSnackbar(res.data.message || 'Request approved and published!', { variant: 'success' });
        fetchModerationRequests();
      }
    } catch (err) {
      enqueueSnackbar(`Approval failed: ${err.response?.data?.message || err.message}`, { variant: 'error' });
    } finally {
      setReviewingId(null);
    }
  };

  const handleOpenRejectDialog = (request) => {
    setSelectedRequestForReview(request);
    setRejectionFeedback('');
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRequestForReview) return;
    try {
      setReviewingId(selectedRequestForReview._id);
      const res = await API.put(`/upload-requests/${selectedRequestForReview._id}/review`, {
        status: 'REJECTED',
        adminFeedback: rejectionFeedback
      });
      if (res.data?.success) {
        enqueueSnackbar('Request rejected.', { variant: 'info' });
        setRejectDialogOpen(false);
        fetchModerationRequests();
      }
    } catch (err) {
      enqueueSnackbar(`Rejection failed: ${err.response?.data?.message || err.message}`, { variant: 'error' });
    } finally {
      setReviewingId(null);
    }
  };

  // ----------------------------------------------------
  // Cancel / Delete Request
  // ----------------------------------------------------
  const handleOpenDelete = (req) => {
    setRequestToDelete(req);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!requestToDelete) return;
    try {
      setDeleting(true);
      const res = await API.delete(`/upload-requests/${requestToDelete._id}`);
      if (res.data?.success) {
        enqueueSnackbar('Upload request deleted.', { variant: 'success' });
        setDeleteDialogOpen(false);
        if (isAdminOrReviewer) {
          fetchModerationRequests();
        } else {
          fetchMyRequests();
        }
      }
    } catch (err) {
      enqueueSnackbar(`Delete failed: ${err.response?.data?.message || err.message}`, { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // ----------------------------------------------------
  // Helpers
  // ----------------------------------------------------
  const getCategoryMeta = (cat) => {
    switch (cat) {
      case 'gallery':
        return { label: 'Gallery', icon: <GalleryIcon fontSize="small" />, color: '#0088ff', bg: 'rgba(0,136,255,0.08)' };
      case 'drive_links':
        return { label: 'Drive Link', icon: <DriveIcon fontSize="small" />, color: '#10b981', bg: 'rgba(16,185,129,0.08)' };
      case 'events':
        return { label: 'Event', icon: <EventIcon fontSize="small" />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' };
      default:
        return { label: cat, icon: <CloudUploadIcon fontSize="small" />, color: '#64748b', bg: '#f1f5f9' };
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <Chip
            size="small"
            icon={<PendingIcon sx={{ fontSize: '14px !important', color: '#f59e0b !important' }} />}
            label="Pending Review"
            sx={{ bgcolor: 'rgba(245,158,11,0.12)', color: '#d97706', fontWeight: 700, fontSize: '11.5px' }}
          />
        );
      case 'APPROVED':
        return (
          <Chip
            size="small"
            icon={<ApprovedIcon sx={{ fontSize: '14px !important', color: '#10b981 !important' }} />}
            label="Approved & Published"
            sx={{ bgcolor: 'rgba(16,185,129,0.12)', color: '#059669', fontWeight: 700, fontSize: '11.5px' }}
          />
        );
      case 'REJECTED':
        return (
          <Chip
            size="small"
            icon={<RejectedIcon sx={{ fontSize: '14px !important', color: '#ef4444 !important' }} />}
            label="Rejected"
            sx={{ bgcolor: 'rgba(239,68,68,0.12)', color: '#dc2626', fontWeight: 700, fontSize: '11.5px' }}
          />
        );
      default:
        return <Chip size="small" label={status} />;
    }
  };

  const filteredMyRequests = myRequests.filter((r) => {
    if (myStatusFilter === 'ALL') return true;
    return r.status === myStatusFilter;
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', pb: 8 }}>
      {/* ── Page Header ── */}
      <Box sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', pt: 3, pb: 2 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CloudUploadIcon sx={{ color: '#0088ff', fontSize: 32 }} />
                {isAdminOrReviewer ? 'Media Upload Moderation' : 'Memory Upload Hub'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                {isAdminOrReviewer
                  ? 'Review incoming member memories and accept them to automatically publish into the community archive.'
                  : 'Share your campus memories, Google Drive collections, and event media with our community.'}
              </Typography>
            </Box>

            {/* Top Level Tabs: Request Queue, Request Accepted, Request Rejected for Admin/Reviewer */}
            {isAdminOrReviewer ? (
              <Tabs
                value={adminTabs.includes(activeTab) ? activeTab : 'request_queue'}
                onChange={(_, val) => {
                  setActiveTab(val);
                  setSearchParams({ tab: val });
                }}
                sx={{
                  bgcolor: '#F1F5F9',
                  p: '4px',
                  borderRadius: '12px',
                  minHeight: '38px',
                  '& .MuiTabs-indicator': { display: 'none' }
                }}
              >
                <Tab
                  value="request_queue"
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <span>Request Queue</span>
                      {counts.pending > 0 && (
                        <Chip
                          size="small"
                          label={counts.pending}
                          sx={{
                            height: 18,
                            fontSize: '10px',
                            fontWeight: 700,
                            bgcolor: activeTab === 'request_queue' ? '#f59e0b' : '#E2E8F0',
                            color: activeTab === 'request_queue' ? '#fff' : '#64748B'
                          }}
                        />
                      )}
                    </Box>
                  }
                  icon={<PendingIcon sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  sx={{
                    minHeight: '32px',
                    borderRadius: '9px',
                    fontWeight: 600,
                    fontSize: '13px',
                    py: 0.5,
                    px: 2,
                    textTransform: 'none',
                    color: '#64748B',
                    '&.Mui-selected': { bgcolor: '#FFFFFF', color: '#f59e0b', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
                  }}
                />
                <Tab
                  value="request_accepted"
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <span>Request Accepted</span>
                      {counts.approved > 0 && (
                        <Chip
                          size="small"
                          label={counts.approved}
                          sx={{
                            height: 18,
                            fontSize: '10px',
                            fontWeight: 700,
                            bgcolor: activeTab === 'request_accepted' ? '#10b981' : '#E2E8F0',
                            color: activeTab === 'request_accepted' ? '#fff' : '#64748B'
                          }}
                        />
                      )}
                    </Box>
                  }
                  icon={<ApprovedIcon sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  sx={{
                    minHeight: '32px',
                    borderRadius: '9px',
                    fontWeight: 600,
                    fontSize: '13px',
                    py: 0.5,
                    px: 2,
                    textTransform: 'none',
                    color: '#64748B',
                    '&.Mui-selected': { bgcolor: '#FFFFFF', color: '#10b981', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
                  }}
                />
                <Tab
                  value="request_rejected"
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <span>Request Rejected</span>
                      {counts.rejected > 0 && (
                        <Chip
                          size="small"
                          label={counts.rejected}
                          sx={{
                            height: 18,
                            fontSize: '10px',
                            fontWeight: 700,
                            bgcolor: activeTab === 'request_rejected' ? '#ef4444' : '#E2E8F0',
                            color: activeTab === 'request_rejected' ? '#fff' : '#64748B'
                          }}
                        />
                      )}
                    </Box>
                  }
                  icon={<RejectedIcon sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  sx={{
                    minHeight: '32px',
                    borderRadius: '9px',
                    fontWeight: 600,
                    fontSize: '13px',
                    py: 0.5,
                    px: 2,
                    textTransform: 'none',
                    color: '#64748B',
                    '&.Mui-selected': { bgcolor: '#FFFFFF', color: '#ef4444', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
                  }}
                />
              </Tabs>
            ) : (
              <Tabs
                value={activeTab === 'my_requests' ? 'my_requests' : 'submit'}
                onChange={(_, val) => {
                  setActiveTab(val);
                  setSearchParams({ tab: val });
                }}
                sx={{
                  bgcolor: '#F1F5F9',
                  p: '4px',
                  borderRadius: '12px',
                  minHeight: '38px',
                  '& .MuiTabs-indicator': { display: 'none' }
                }}
              >
                <Tab
                  value="submit"
                  label="Submit Memory"
                  icon={<CloudUploadIcon sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  sx={{
                    minHeight: '32px',
                    borderRadius: '9px',
                    fontWeight: 600,
                    fontSize: '13px',
                    py: 0.5,
                    px: 2,
                    textTransform: 'none',
                    color: '#64748B',
                    '&.Mui-selected': { bgcolor: '#FFFFFF', color: '#0088ff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
                  }}
                />
                <Tab
                  value="my_requests"
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <span>My Submissions</span>
                      {myRequests.length > 0 && (
                        <Chip
                          size="small"
                          label={myRequests.length}
                          sx={{
                            height: 18,
                            fontSize: '10px',
                            fontWeight: 700,
                            bgcolor: activeTab === 'my_requests' ? 'rgba(0,136,255,0.15)' : '#E2E8F0',
                            color: activeTab === 'my_requests' ? '#0088ff' : '#64748B'
                          }}
                        />
                      )}
                    </Box>
                  }
                  sx={{
                    minHeight: '32px',
                    borderRadius: '9px',
                    fontWeight: 600,
                    fontSize: '13px',
                    py: 0.5,
                    px: 2,
                    textTransform: 'none',
                    color: '#64748B',
                    '&.Mui-selected': { bgcolor: '#FFFFFF', color: '#0088ff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
                  }}
                />
              </Tabs>
            )}
          </Box>
        </Container>
      </Box>

      {/* ── Main Tab Contents ── */}
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        {/* ========================================================= */}
        {/* NORMAL USER: TAB 1 - SUBMIT MEMORY FORM                   */}
        {/* ========================================================= */}
        {!isAdminOrReviewer && activeTab === 'submit' && (
          <Box component="form" onSubmit={handleSubmitRequest}>
            <Grid container spacing={3}>
              {/* Left Column: Form Details */}
              <Grid size={{ xs: 12, md: 8 }}>
                {/* Step 1: Destination Selection */}
                <Card sx={{ borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0', mb: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
                      1. Choose Destination Category
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748B', mb: 2.5 }}>
                      Where should this memory or media asset be published upon approval?
                    </Typography>

                    <Grid container spacing={2}>
                      {/* Gallery Card */}
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Paper
                          onClick={() => setTargetCategory('gallery')}
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            border: targetCategory === 'gallery' ? '2px solid #0088ff' : '1px solid #E2E8F0',
                            bgcolor: targetCategory === 'gallery' ? 'rgba(0,136,255,0.04)' : '#FFFFFF',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            '&:hover': { borderColor: '#0088ff', transform: 'translateY(-2px)' }
                          }}
                        >
                          <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: 'rgba(0,136,255,0.1)', color: '#0088ff', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                            <GalleryIcon />
                          </Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            Community Gallery
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', mt: 0.5 }}>
                            Photos & Videos with captions
                          </Typography>
                        </Paper>
                      </Grid>

                      {/* Drive Links Card */}
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Paper
                          onClick={() => setTargetCategory('drive_links')}
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            border: targetCategory === 'drive_links' ? '2px solid #10b981' : '1px solid #E2E8F0',
                            bgcolor: targetCategory === 'drive_links' ? 'rgba(16,185,129,0.04)' : '#FFFFFF',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            '&:hover': { borderColor: '#10b981', transform: 'translateY(-2px)' }
                          }}
                        >
                          <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                            <DriveIcon />
                          </Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            Google Drive Link
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', mt: 0.5 }}>
                            Event albums & folder links
                          </Typography>
                        </Paper>
                      </Grid>

                      {/* Events Card */}
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Paper
                          onClick={() => setTargetCategory('events')}
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            border: targetCategory === 'events' ? '2px solid #8b5cf6' : '1px solid #E2E8F0',
                            bgcolor: targetCategory === 'events' ? 'rgba(139,92,246,0.04)' : '#FFFFFF',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            '&:hover': { borderColor: '#8b5cf6', transform: 'translateY(-2px)' }
                          }}
                        >
                          <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: 'rgba(139,92,246,0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                            <EventIcon />
                          </Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            Event Details & Media
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', mt: 0.5 }}>
                            New event or event gallery
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Step 2: Information & Details Form */}
                <Card sx={{ borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0', mb: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', mb: 2 }}>
                      2. Memory & Asset Details
                    </Typography>

                    <TextField
                      fullWidth
                      label="Title / Memory Name"
                      placeholder="e.g., Annual Sports Meet 2026, Hostel Freshers Celebration"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      sx={{ mb: 2.5 }}
                    />

                    <TextField
                      fullWidth
                      label="Description / Context (Optional)"
                      placeholder="Share background, participants, or highlights about this memory..."
                      multiline
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      sx={{ mb: 2.5 }}
                    />

                    {/* Category: GALLERY */}
                    {targetCategory === 'gallery' && (
                      <TextField
                        select
                        fullWidth
                        label="Destination Gallery Album (Optional)"
                        value={selectedFolder}
                        onChange={(e) => setSelectedFolder(e.target.value)}
                        helperText="Assign to a specific album folder, or leave blank to put in main gallery"
                        sx={{ mb: 2.5 }}
                      >
                        <MenuItem value="">Main Gallery (Root)</MenuItem>
                        {folders.map((f) => (
                          <MenuItem key={f._id} value={f._id}>
                            📁 {f.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}

                    {/* Category: DRIVE LINKS */}
                    {targetCategory === 'drive_links' && (
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            fullWidth
                            label="Google Drive Folder URL"
                            placeholder="https://drive.google.com/drive/folders/..."
                            value={driveUrl}
                            onChange={(e) => setDriveUrl(e.target.value)}
                            required
                            helperText="Paste the public or shareable link to the Google Drive folder"
                            sx={{ mb: 1 }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <DatePicker
                            label="Date of Event *"
                            format="DD/MM/YYYY"
                            value={driveEventDate ? dayjs(driveEventDate) : null}
                            onChange={(newValue) => setDriveEventDate(newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '')}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                required: true
                              }
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            select
                            fullWidth
                            label="Category"
                            value={driveCategory}
                            onChange={(e) => setDriveCategory(e.target.value)}
                          >
                            {DRIVE_CATEGORIES.map((c) => (
                              <MenuItem key={c} value={c}>{c}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                      </Grid>
                    )}

                    {/* Category: EVENTS */}
                    {targetCategory === 'events' && (
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <DatePicker
                            label="Event Date *"
                            format="DD/MM/YYYY"
                            value={eventDate ? dayjs(eventDate) : null}
                            onChange={(newValue) => setEventDate(newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '')}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                required: true
                              }
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TimePicker
                            label="Start Time *"
                            value={startTime ? dayjs(`2000-01-01T${startTime}`) : null}
                            onChange={(newValue) => setStartTime(newValue && newValue.isValid() ? newValue.format('HH:mm') : '')}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                required: true
                              }
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TimePicker
                            label="End Time *"
                            value={endTime ? dayjs(`2000-01-01T${endTime}`) : null}
                            onChange={(newValue) => setEndTime(newValue && newValue.isValid() ? newValue.format('HH:mm') : '')}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                required: true
                              }
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            label="Event Location / Venue"
                            placeholder="Hostel Auditorium, Main Ground..."
                            value={eventLocation}
                            onChange={(e) => setEventLocation(e.target.value)}
                            required
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            fullWidth
                            label="Google Maps Location URL (Optional)"
                            placeholder="https://maps.app.goo.gl/..."
                            value={locationUrl}
                            onChange={(e) => setLocationUrl(e.target.value)}
                          />
                        </Grid>
                      </Grid>
                    )}
                  </CardContent>
                </Card>

                {/* Step 3: Media Upload Dropzone (Hidden for Google Drive Links) */}
                {targetCategory !== 'drive_links' && (
                  <Card sx={{ borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0', mb: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                          3. Upload Media Assets {targetCategory === 'gallery' ? '(Required)' : '(Optional)'}
                        </Typography>
                        {uploadedMedia.length > 0 && (
                          <Chip size="small" label={`${uploadedMedia.length} asset(s) ready`} color="primary" sx={{ fontWeight: 700 }} />
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
                        Upload photos (PNG, JPG, WEBP) or videos (MP4, MOV).
                      </Typography>

                      {/* Dropzone Box */}
                      <Box
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                          border: '2px dashed #0088ff',
                          borderRadius: '16px',
                          bgcolor: 'rgba(0,136,255,0.02)',
                          p: { xs: 3, sm: 4 },
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: 'rgba(0,136,255,0.06)',
                            borderColor: '#0066cc'
                          }
                        }}
                      >
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          onChange={handleMediaFilesSelected}
                        />
                        <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'rgba(0,136,255,0.1)', color: '#0088ff', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                          {uploadingFiles ? <CircularProgress size={24} sx={{ color: '#0088ff' }} /> : <CloudUploadIcon fontSize="medium" />}
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          {uploadingFiles ? 'Uploading assets...' : 'Click to select or drag and drop photos & videos'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                          Images up to 10MB • Videos up to 100MB
                        </Typography>
                      </Box>

                      {/* Uploaded Media Grid */}
                      {uploadedMedia.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475467', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Uploaded Assets ({uploadedMedia.length})
                          </Typography>
                          <Grid container spacing={2} sx={{ mt: 0.5 }}>
                            {uploadedMedia.map((item, idx) => (
                              <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                                <Paper
                                  elevation={0}
                                  sx={{
                                    p: 1.5,
                                    borderRadius: '12px',
                                    border: '1px solid #E2E8F0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    bgcolor: '#F8FAFC'
                                  }}
                                >
                                  {item.resourceType === 'video' ? (
                                    <Box sx={{ width: 56, height: 56, borderRadius: '8px', bgcolor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                                      <PlayIcon />
                                    </Box>
                                  ) : (
                                    <Box
                                      component="img"
                                      src={item.url}
                                      alt="thumb"
                                      sx={{ width: 56, height: 56, borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                                    />
                                  )}
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      placeholder="Add caption..."
                                      value={item.caption}
                                      onChange={(e) => handleCaptionChange(idx, e.target.value)}
                                      sx={{ '& input': { fontSize: '12px', py: 0.75 } }}
                                    />
                                    <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.5 }} noWrap>
                                      {item.originalName || 'Media File'} • {(item.size / (1024 * 1024)).toFixed(1)} MB
                                    </Typography>
                                  </Box>
                                  <IconButton size="small" onClick={() => handleRemoveMedia(idx)} sx={{ color: '#EF4444' }}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )}
              </Grid>

              {/* Right Column: Submission Info & Cover/Thumbnail Helper */}
              <Grid size={{ xs: 12, md: 4 }}>
                {/* Specific thumbnail preview for Drive Links */}
                {targetCategory === 'drive_links' && (
                  <Card sx={{ borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0', mb: 3 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
                        Drive Album Cover Thumbnail
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 2 }}>
                        Set a custom thumbnail photo to represent this album in Drive Links.
                      </Typography>

                      {driveThumbnail ? (
                        <Box sx={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', height: 160, mb: 2 }}>
                          <Box
                            component="img"
                            src={driveThumbnail}
                            alt="Cover preview"
                            sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: driveThumbnailFocus }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => setDriveThumbnail('')}
                            sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box
                          onClick={() => thumbInputRef.current?.click()}
                          sx={{
                            border: '2px dashed #CBD5E1',
                            borderRadius: '12px',
                            p: 3,
                            textAlign: 'center',
                            cursor: 'pointer',
                            mb: 2,
                            '&:hover': { borderColor: '#10b981', bgcolor: 'rgba(16,185,129,0.02)' }
                          }}
                        >
                          <input type="file" accept="image/*" ref={thumbInputRef} style={{ display: 'none' }} onChange={handleThumbnailSelected} />
                          {uploadingThumb ? (
                            <CircularProgress size={24} sx={{ color: '#10b981' }} />
                          ) : (
                            <>
                              <PhotoCameraIcon sx={{ color: '#64748B', mb: 0.5 }} />
                              <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: '#334155' }}>
                                Click to upload cover image
                              </Typography>
                            </>
                          )}
                        </Box>
                      )}

                      {driveThumbnail && (
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Focal Alignment"
                          value={driveThumbnailFocus}
                          onChange={(e) => setDriveThumbnailFocus(e.target.value)}
                        >
                          <MenuItem value="center">Center</MenuItem>
                          <MenuItem value="top">Top</MenuItem>
                          <MenuItem value="bottom">Bottom</MenuItem>
                          <MenuItem value="left">Left</MenuItem>
                          <MenuItem value="right">Right</MenuItem>
                        </TextField>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Specific Cover for Events */}
                {targetCategory === 'events' && (
                  <Card sx={{ borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0', mb: 3 }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
                        Event Banner / Cover Image
                      </Typography>
                      {eventCover.url ? (
                        <Box sx={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', height: 160, mb: 1 }}>
                          <Box
                            component="img"
                            src={eventCover.url}
                            alt="Cover"
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => setEventCover({ url: '', publicId: '' })}
                            sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff' }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box
                          onClick={() => coverInputRef.current?.click()}
                          sx={{
                            border: '2px dashed #CBD5E1',
                            borderRadius: '12px',
                            p: 3,
                            textAlign: 'center',
                            cursor: 'pointer',
                            mb: 1,
                            '&:hover': { borderColor: '#8b5cf6', bgcolor: 'rgba(139,92,246,0.02)' }
                          }}
                        >
                          <input type="file" accept="image/*" ref={coverInputRef} style={{ display: 'none' }} onChange={handleCoverSelected} />
                          {uploadingCover ? (
                            <CircularProgress size={24} sx={{ color: '#8b5cf6' }} />
                          ) : (
                            <>
                              <PhotoCameraIcon sx={{ color: '#64748B', mb: 0.5 }} />
                              <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: '#334155' }}>
                                Upload event cover banner
                              </Typography>
                            </>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Moderation Workflow Notice */}
                <Card sx={{ borderRadius: '16px', bgcolor: '#F0F9FF', border: '1px solid #BAE6FD', mb: 3 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <InfoIcon sx={{ color: '#0284C7', mt: 0.25 }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0369A1' }}>
                          Review & Approval Policy
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#0C4A6E', display: 'block', mt: 0.5, lineHeight: 1.5 }}>
                          All submissions are reviewed by the administration team to preserve community standards. Once approved, your memories will instantly appear on the public Gallery, Drive Links, or Events pages!
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Final Submit Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={submitting || uploadingFiles || uploadingThumb || uploadingCover}
                  sx={{
                    py: 1.5,
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '15px',
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #0088ff 0%, #0066cc 100%)',
                    boxShadow: '0 4px 14px rgba(0, 136, 255, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0077ee 0%, #0055bb 100%)',
                      boxShadow: '0 6px 18px rgba(0, 136, 255, 0.4)'
                    }
                  }}
                >
                  {submitting ? (
                    <CircularProgress size={22} sx={{ color: '#fff' }} />
                  ) : (
                    'Submit for Moderation Review'
                  )}
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* ========================================================= */}
        {/* NORMAL USER: TAB 2 - MY SUBMISSIONS                       */}
        {/* ========================================================= */}
        {!isAdminOrReviewer && activeTab === 'my_requests' && (
          <Box>
            {/* Filter Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', py: 0.5 }}>
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
                  <Chip
                    key={st}
                    label={st === 'ALL' ? 'All Submissions' : st.charAt(0) + st.slice(1).toLowerCase()}
                    clickable
                    onClick={() => setMyStatusFilter(st)}
                    variant={myStatusFilter === st ? 'filled' : 'outlined'}
                    color={myStatusFilter === st ? 'primary' : 'default'}
                    sx={{ fontWeight: 600, fontSize: '12.5px' }}
                  />
                ))}
              </Stack>
              <IconButton onClick={fetchMyRequests} size="small">
                <RefreshIcon />
              </IconButton>
            </Box>

            {loadingMyRequests ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : filteredMyRequests.length === 0 ? (
              <Card sx={{ borderRadius: '16px', p: 6, textAlign: 'center', border: '1px dashed #CBD5E1' }}>
                <CloudUploadIcon sx={{ fontSize: 48, color: '#94A3B8', mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155' }}>
                  No submissions found
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mb: 3, maxWidth: 400, mx: 'auto' }}>
                  {myStatusFilter === 'ALL'
                    ? "You haven't submitted any memory upload requests yet."
                    : `No ${myStatusFilter.toLowerCase()} submissions.`}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => {
                    setActiveTab('submit');
                    setSearchParams({ tab: 'submit' });
                  }}
                  startIcon={<CloudUploadIcon />}
                  sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
                >
                  Submit a Memory Now
                </Button>
              </Card>
            ) : (
              <Grid container spacing={2.5}>
                {filteredMyRequests.map((req) => {
                  const meta = getCategoryMeta(req.targetCategory);
                  return (
                    <Grid size={{ xs: 12, md: 6 }} key={req._id}>
                      <Card
                        sx={{
                          borderRadius: '16px',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                          border: '1px solid #E2E8F0',
                          transition: 'all 0.2s ease',
                          '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }
                        }}
                      >
                        <CardContent sx={{ p: 2.5 }}>
                          {/* Top row: Category Pill + Status */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Chip
                              size="small"
                              icon={meta.icon}
                              label={meta.label}
                              sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700, fontSize: '11.5px' }}
                            />
                            {getStatusChip(req.status)}
                          </Box>

                          {/* Title & Description */}
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
                            {req.title}
                          </Typography>
                          {req.description && (
                            <Typography variant="body2" sx={{ color: '#64748B', mb: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {req.description}
                            </Typography>
                          )}

                          {/* Media preview thumbnails */}
                          {req.media && req.media.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 1, mb: 1.5 }}>
                              {req.media.slice(0, 4).map((m, i) => (
                                <Box
                                  key={i}
                                  onClick={() => setPreviewMedia(m)}
                                  sx={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    border: '1px solid #E2E8F0',
                                    position: 'relative'
                                  }}
                                >
                                  {m.resourceType === 'video' ? (
                                    <Box sx={{ width: '100%', height: '100%', bgcolor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                      <PlayIcon sx={{ fontSize: 20 }} />
                                    </Box>
                                  ) : (
                                    <Box component="img" src={m.url} alt="media" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  )}
                                </Box>
                              ))}
                              {req.media.length > 4 && (
                                <Box sx={{ width: 60, height: 60, borderRadius: '8px', bgcolor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontWeight: 700, fontSize: '12px' }}>
                                  +{req.media.length - 4}
                                </Box>
                              )}
                            </Box>
                          )}

                          {/* Drive URL info if drive link */}
                          {req.driveUrl && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, p: 1, bgcolor: '#F1F5F9', borderRadius: '8px' }}>
                              <DriveIcon sx={{ fontSize: 18, color: '#10b981' }} />
                              <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {req.driveUrl}
                              </Typography>
                              <IconButton size="small" component="a" href={req.driveUrl} target="_blank" sx={{ ml: 'auto', p: 0.25 }}>
                                <OpenInNewIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )}

                          {/* Admin Feedback if rejected */}
                          {req.status === 'REJECTED' && req.adminFeedback && (
                            <Alert severity="error" sx={{ mb: 1.5, py: 0.25, '& .MuiAlert-message': { fontSize: '12px' } }}>
                              <strong>Admin Feedback:</strong> {req.adminFeedback}
                            </Alert>
                          )}

                          <Divider sx={{ my: 1.5 }} />

                          {/* Footer Info & Actions */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                              Submitted {new Date(req.createdAt).toLocaleDateString()}
                            </Typography>

                            <Stack direction="row" spacing={1}>
                              {req.status === 'APPROVED' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  endIcon={<ArrowForwardIcon />}
                                  onClick={() => {
                                    if (req.targetCategory === 'gallery') navigate('/gallery');
                                    else if (req.targetCategory === 'drive_links') navigate('/drive-links');
                                    else if (req.targetCategory === 'events') navigate('/events');
                                  }}
                                  sx={{ textTransform: 'none', fontSize: '12px', fontWeight: 600 }}
                                >
                                  View Published
                                </Button>
                              )}

                              {req.status === 'PENDING' && (
                                <Button
                                  size="small"
                                  color="error"
                                  startIcon={<DeleteIcon />}
                                  onClick={() => handleOpenDelete(req)}
                                  sx={{ textTransform: 'none', fontSize: '12px', fontWeight: 600 }}
                                >
                                  Cancel Request
                                </Button>
                              )}
                            </Stack>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        )}

        {/* ========================================================= */}
        {/* ADMIN / REVIEWER: TAB 1 - REQUEST QUEUE (PENDING)         */}
        {/* ========================================================= */}
        {isAdminOrReviewer && activeTab === 'request_queue' && (
          <Box>
            {/* Header / Category Filter Toolbar */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PendingIcon sx={{ color: '#f59e0b' }} />
                  Request Queue ({counts.pending})
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                  Submissions awaiting review. Accept to automatically publish them into the community archive.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  select
                  size="small"
                  value={modCategoryFilter}
                  onChange={(e) => setModCategoryFilter(e.target.value)}
                  sx={{ width: 160, bgcolor: '#FFFFFF' }}
                >
                  <MenuItem value="ALL">All Categories</MenuItem>
                  <MenuItem value="gallery">Gallery</MenuItem>
                  <MenuItem value="drive_links">Drive Links</MenuItem>
                  <MenuItem value="events">Events</MenuItem>
                </TextField>
                <IconButton onClick={() => fetchModerationRequests('PENDING')} size="small">
                  <RefreshIcon />
                </IconButton>
              </Stack>
            </Box>

            {loadingModeration ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : moderationList.length === 0 ? (
              <Card sx={{ borderRadius: '16px', p: 6, textAlign: 'center', border: '1px dashed #CBD5E1' }}>
                <ApprovedIcon sx={{ fontSize: 52, color: '#10b981', mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155' }}>
                  Request Queue is Empty!
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                  No pending memory requests waiting for review.
                </Typography>
              </Card>
            ) : (
              <Stack spacing={2.5}>
                {moderationList.map((req) => {
                  const meta = getCategoryMeta(req.targetCategory);
                  return (
                    <Card
                      key={req._id}
                      sx={{
                        borderRadius: '16px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                        border: '1px solid #E2E8F0',
                        overflow: 'hidden'
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        {/* Header: Submitter User Info + Category Pill */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                              component="img"
                              src={req.user?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user?.name || 'User')}&background=0088ff&color=fff`}
                              alt="Avatar"
                              sx={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                {req.user?.name || 'Member'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B' }}>
                                {req.user?.role} • Submitted on {new Date(req.createdAt).toLocaleString()}
                              </Typography>
                            </Box>
                          </Box>

                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              size="small"
                              icon={meta.icon}
                              label={meta.label}
                              sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700, fontSize: '11.5px' }}
                            />
                            {getStatusChip(req.status)}
                          </Stack>
                        </Box>

                        <Divider sx={{ my: 1.5 }} />

                        {/* Submission Content */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
                            {req.title}
                          </Typography>
                          {req.description && (
                            <Typography variant="body2" sx={{ color: '#475467', mb: 1.5 }}>
                              {req.description}
                            </Typography>
                          )}

                          {/* Specific Category Badges */}
                          {req.targetCategory === 'drive_links' && (
                            <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', mb: 2 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 0.5 }}>
                                GOOGLE DRIVE EVENT ALBUM
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', mb: 0.5 }}>
                                Category: {req.driveCategory} • Event Date: {req.driveEventDate ? new Date(req.driveEventDate).toLocaleDateString() : 'N/A'}
                              </Typography>
                              <Button
                                size="small"
                                variant="outlined"
                                component="a"
                                href={req.driveUrl}
                                target="_blank"
                                startIcon={<DriveIcon />}
                                endIcon={<OpenInNewIcon />}
                                sx={{ textTransform: 'none', fontWeight: 600, mt: 0.5 }}
                              >
                                Open Google Drive Folder
                              </Button>
                            </Box>
                          )}

                          {req.targetCategory === 'events' && req.eventDetails && (
                            <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', mb: 2 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 0.5 }}>
                                EVENT SPECIFICATIONS
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                                Date: {req.eventDetails.eventDate ? new Date(req.eventDetails.eventDate).toLocaleDateString() : 'N/A'} • {req.eventDetails.startTime} - {req.eventDetails.endTime}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#475467' }}>
                                Location: {req.eventDetails.location}
                              </Typography>
                            </Box>
                          )}

                          {/* Media Assets Grid */}
                          {req.media && req.media.length > 0 && (
                            <Box sx={{ mt: 1.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Submitted Media Assets ({req.media.length})
                              </Typography>
                              <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                                {req.media.map((m, i) => (
                                  <Grid size={{ xs: 6, sm: 3, md: 2 }} key={i}>
                                    <Box
                                      onClick={() => setPreviewMedia(m)}
                                      sx={{
                                        position: 'relative',
                                        height: 100,
                                        borderRadius: '10px',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        border: '1px solid #E2E8F0',
                                        '&:hover img': { transform: 'scale(1.05)' }
                                      }}
                                    >
                                      {m.resourceType === 'video' ? (
                                        <Box sx={{ width: '100%', height: '100%', bgcolor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                          <PlayIcon fontSize="medium" />
                                        </Box>
                                      ) : (
                                        <Box
                                          component="img"
                                          src={m.url}
                                          alt="Preview"
                                          sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.2s ease' }}
                                        />
                                      )}
                                      {m.caption && (
                                        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0,0,0,0.6)', p: 0.5 }}>
                                          <Typography variant="caption" sx={{ color: '#fff', fontSize: '10px', display: 'block' }} noWrap>
                                            {m.caption}
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          )}
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {/* Reviewer Actions */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleOpenDelete(req)}
                            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '12px' }}
                          >
                            Delete
                          </Button>

                          <Stack direction="row" spacing={1.5}>
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={() => handleOpenRejectDialog(req)}
                              disabled={reviewingId === req._id}
                              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                            >
                              Reject with Feedback
                            </Button>
                            <Button
                              variant="contained"
                              color="success"
                              startIcon={<ApprovedIcon />}
                              onClick={() => handleApprove(req)}
                              disabled={reviewingId === req._id}
                              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                            >
                              {reviewingId === req._id ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Approve & Publish'}
                            </Button>
                          </Stack>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Box>
        )}

        {/* ========================================================= */}
        {/* ADMIN / REVIEWER: TAB 2 - REQUEST ACCEPTED                */}
        {/* ========================================================= */}
        {isAdminOrReviewer && activeTab === 'request_accepted' && (
          <Box>
            {/* Header / Category Filter Toolbar */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ApprovedIcon sx={{ color: '#10b981' }} />
                  Request Accepted ({counts.approved})
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                  Approved and accepted memories that are now live in the community gallery, drive links, or events.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  select
                  size="small"
                  value={modCategoryFilter}
                  onChange={(e) => setModCategoryFilter(e.target.value)}
                  sx={{ width: 160, bgcolor: '#FFFFFF' }}
                >
                  <MenuItem value="ALL">All Categories</MenuItem>
                  <MenuItem value="gallery">Gallery</MenuItem>
                  <MenuItem value="drive_links">Drive Links</MenuItem>
                  <MenuItem value="events">Events</MenuItem>
                </TextField>
                <IconButton onClick={() => fetchModerationRequests('APPROVED')} size="small">
                  <RefreshIcon />
                </IconButton>
              </Stack>
            </Box>

            {loadingModeration ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : moderationList.length === 0 ? (
              <Card sx={{ borderRadius: '16px', p: 6, textAlign: 'center', border: '1px dashed #CBD5E1' }}>
                <CloudUploadIcon sx={{ fontSize: 52, color: '#94A3B8', mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155' }}>
                  No Accepted Requests Yet
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                  Accepted media requests will be displayed here once approved.
                </Typography>
              </Card>
            ) : (
              <Stack spacing={2.5}>
                {moderationList.map((req) => {
                  const meta = getCategoryMeta(req.targetCategory);
                  return (
                    <Card
                      key={req._id}
                      sx={{
                        borderRadius: '16px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                        border: '1px solid #E2E8F0',
                        overflow: 'hidden'
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        {/* Header: Submitter User Info + Category Pill + Status */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                              component="img"
                              src={req.user?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user?.name || 'User')}&background=0088ff&color=fff`}
                              alt="Avatar"
                              sx={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                {req.user?.name || 'Member'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B' }}>
                                {req.user?.role} • Submitted on {new Date(req.createdAt).toLocaleString()}
                              </Typography>
                            </Box>
                          </Box>

                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              size="small"
                              icon={meta.icon}
                              label={meta.label}
                              sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700, fontSize: '11.5px' }}
                            />
                            {getStatusChip(req.status)}
                          </Stack>
                        </Box>

                        <Divider sx={{ my: 1.5 }} />

                        {/* Submission Content */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
                            {req.title}
                          </Typography>
                          {req.description && (
                            <Typography variant="body2" sx={{ color: '#475467', mb: 1.5 }}>
                              {req.description}
                            </Typography>
                          )}

                          {/* Specific Category Badges */}
                          {req.targetCategory === 'drive_links' && (
                            <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', mb: 2 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 0.5 }}>
                                GOOGLE DRIVE EVENT ALBUM
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', mb: 0.5 }}>
                                Category: {req.driveCategory} • Event Date: {req.driveEventDate ? new Date(req.driveEventDate).toLocaleDateString() : 'N/A'}
                              </Typography>
                              <Button
                                size="small"
                                variant="outlined"
                                component="a"
                                href={req.driveUrl}
                                target="_blank"
                                startIcon={<DriveIcon />}
                                endIcon={<OpenInNewIcon />}
                                sx={{ textTransform: 'none', fontWeight: 600, mt: 0.5 }}
                              >
                                Open Google Drive Folder
                              </Button>
                            </Box>
                          )}

                          {req.targetCategory === 'events' && req.eventDetails && (
                            <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', mb: 2 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 0.5 }}>
                                EVENT SPECIFICATIONS
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                                Date: {req.eventDetails.eventDate ? new Date(req.eventDetails.eventDate).toLocaleDateString() : 'N/A'} • {req.eventDetails.startTime} - {req.eventDetails.endTime}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#475467' }}>
                                Location: {req.eventDetails.location}
                              </Typography>
                            </Box>
                          )}

                          {/* Media Assets Grid */}
                          {req.media && req.media.length > 0 && (
                            <Box sx={{ mt: 1.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Accepted Media Assets ({req.media.length})
                              </Typography>
                              <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                                {req.media.map((m, i) => (
                                  <Grid size={{ xs: 6, sm: 3, md: 2 }} key={i}>
                                    <Box
                                      onClick={() => setPreviewMedia(m)}
                                      sx={{
                                        position: 'relative',
                                        height: 100,
                                        borderRadius: '10px',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        border: '1px solid #E2E8F0',
                                        '&:hover img': { transform: 'scale(1.05)' }
                                      }}
                                    >
                                      {m.resourceType === 'video' ? (
                                        <Box sx={{ width: '100%', height: '100%', bgcolor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                          <PlayIcon fontSize="medium" />
                                        </Box>
                                      ) : (
                                        <Box
                                          component="img"
                                          src={m.url}
                                          alt="Preview"
                                          sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.2s ease' }}
                                        />
                                      )}
                                      {m.caption && (
                                        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0,0,0,0.6)', p: 0.5 }}>
                                          <Typography variant="caption" sx={{ color: '#fff', fontSize: '10px', display: 'block' }} noWrap>
                                            {m.caption}
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          )}
                        </Box>

                        {/* Reviewer Note */}
                        {req.reviewedBy && (
                          <Box sx={{ p: 1.5, bgcolor: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: '8px', mb: 2 }}>
                            <Typography variant="caption" sx={{ color: '#166534', display: 'block', fontWeight: 600 }}>
                              ✓ Accepted & Published by {req.reviewedBy.name} on {new Date(req.reviewedAt).toLocaleString()}
                            </Typography>
                          </Box>
                        )}

                        <Divider sx={{ my: 2 }} />

                        {/* Footer Shortcut to View Published */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleOpenDelete(req)}
                            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '12px' }}
                          >
                            Delete Record
                          </Button>

                          <Button
                            variant="contained"
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => {
                              if (req.targetCategory === 'gallery') navigate('/gallery');
                              else if (req.targetCategory === 'drive_links') navigate('/drive-links');
                              else if (req.targetCategory === 'events') navigate('/events');
                            }}
                            sx={{
                              borderRadius: '10px',
                              textTransform: 'none',
                              fontWeight: 700,
                              bgcolor: '#0088ff',
                              '&:hover': { bgcolor: '#0077ee' }
                            }}
                          >
                            View in {req.targetCategory === 'drive_links' ? 'Drive Links' : req.targetCategory.charAt(0).toUpperCase() + req.targetCategory.slice(1)}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Box>
        )}

        {/* ========================================================= */}
        {/* ADMIN / REVIEWER: TAB 3 - REQUEST REJECTED                */}
        {/* ========================================================= */}
        {isAdminOrReviewer && activeTab === 'request_rejected' && (
          <Box>
            {/* Header / Category Filter Toolbar */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RejectedIcon sx={{ color: '#ef4444' }} />
                  Request Rejected ({counts.rejected})
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                  Submissions that were rejected with feedback. You can re-review or approve them if revised.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  select
                  size="small"
                  value={modCategoryFilter}
                  onChange={(e) => setModCategoryFilter(e.target.value)}
                  sx={{ width: 160, bgcolor: '#FFFFFF' }}
                >
                  <MenuItem value="ALL">All Categories</MenuItem>
                  <MenuItem value="gallery">Gallery</MenuItem>
                  <MenuItem value="drive_links">Drive Links</MenuItem>
                  <MenuItem value="events">Events</MenuItem>
                </TextField>
                <IconButton onClick={() => fetchModerationRequests('REJECTED')} size="small">
                  <RefreshIcon />
                </IconButton>
              </Stack>
            </Box>

            {loadingModeration ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : moderationList.length === 0 ? (
              <Card sx={{ borderRadius: '16px', p: 6, textAlign: 'center', border: '1px dashed #CBD5E1' }}>
                <RejectedIcon sx={{ fontSize: 52, color: '#94A3B8', mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155' }}>
                  No Rejected Requests
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                  Submissions rejected during review will be listed here.
                </Typography>
              </Card>
            ) : (
              <Stack spacing={2.5}>
                {moderationList.map((req) => {
                  const meta = getCategoryMeta(req.targetCategory);
                  return (
                    <Card
                      key={req._id}
                      sx={{
                        borderRadius: '16px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                        border: '1px solid #E2E8F0',
                        overflow: 'hidden'
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        {/* Header: Submitter User Info + Category Pill + Status */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                              component="img"
                              src={req.user?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user?.name || 'User')}&background=0088ff&color=fff`}
                              alt="Avatar"
                              sx={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                                {req.user?.name || 'Member'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B' }}>
                                {req.user?.role} • Submitted on {new Date(req.createdAt).toLocaleString()}
                              </Typography>
                            </Box>
                          </Box>

                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              size="small"
                              icon={meta.icon}
                              label={meta.label}
                              sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700, fontSize: '11.5px' }}
                            />
                            {getStatusChip(req.status)}
                          </Stack>
                        </Box>

                        <Divider sx={{ my: 1.5 }} />

                        {/* Submission Content */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
                            {req.title}
                          </Typography>
                          {req.description && (
                            <Typography variant="body2" sx={{ color: '#475467', mb: 1.5 }}>
                              {req.description}
                            </Typography>
                          )}

                          {/* Rejection Feedback Note */}
                          {req.adminFeedback && (
                            <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                Reason for Rejection:
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.25 }}>
                                {req.adminFeedback}
                              </Typography>
                            </Alert>
                          )}

                          {/* Specific Category Badges */}
                          {req.targetCategory === 'drive_links' && (
                            <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', mb: 2 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 0.5 }}>
                                GOOGLE DRIVE EVENT ALBUM
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', mb: 0.5 }}>
                                Category: {req.driveCategory} • Event Date: {req.driveEventDate ? new Date(req.driveEventDate).toLocaleDateString() : 'N/A'}
                              </Typography>
                              <Button
                                size="small"
                                variant="outlined"
                                component="a"
                                href={req.driveUrl}
                                target="_blank"
                                startIcon={<DriveIcon />}
                                endIcon={<OpenInNewIcon />}
                                sx={{ textTransform: 'none', fontWeight: 600, mt: 0.5 }}
                              >
                                Open Google Drive Folder
                              </Button>
                            </Box>
                          )}

                          {req.targetCategory === 'events' && req.eventDetails && (
                            <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', mb: 2 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 0.5 }}>
                                EVENT SPECIFICATIONS
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                                Date: {req.eventDetails.eventDate ? new Date(req.eventDetails.eventDate).toLocaleDateString() : 'N/A'} • {req.eventDetails.startTime} - {req.eventDetails.endTime}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#475467' }}>
                                Location: {req.eventDetails.location}
                              </Typography>
                            </Box>
                          )}

                          {/* Media Assets Grid */}
                          {req.media && req.media.length > 0 && (
                            <Box sx={{ mt: 1.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Submitted Media Assets ({req.media.length})
                              </Typography>
                              <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                                {req.media.map((m, i) => (
                                  <Grid size={{ xs: 6, sm: 3, md: 2 }} key={i}>
                                    <Box
                                      onClick={() => setPreviewMedia(m)}
                                      sx={{
                                        position: 'relative',
                                        height: 100,
                                        borderRadius: '10px',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        border: '1px solid #E2E8F0',
                                        '&:hover img': { transform: 'scale(1.05)' }
                                      }}
                                    >
                                      {m.resourceType === 'video' ? (
                                        <Box sx={{ width: '100%', height: '100%', bgcolor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                          <PlayIcon fontSize="medium" />
                                        </Box>
                                      ) : (
                                        <Box
                                          component="img"
                                          src={m.url}
                                          alt="Preview"
                                          sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.2s ease' }}
                                        />
                                      )}
                                      {m.caption && (
                                        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'rgba(0,0,0,0.6)', p: 0.5 }}>
                                          <Typography variant="caption" sx={{ color: '#fff', fontSize: '10px', display: 'block' }} noWrap>
                                            {m.caption}
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          )}
                        </Box>

                        {/* Reviewer Note */}
                        {req.reviewedBy && (
                          <Box sx={{ p: 1.5, bgcolor: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '8px', mb: 2 }}>
                            <Typography variant="caption" sx={{ color: '#991B1B', display: 'block', fontWeight: 600 }}>
                              Rejected by {req.reviewedBy.name} on {new Date(req.reviewedAt).toLocaleString()}
                            </Typography>
                          </Box>
                        )}

                        <Divider sx={{ my: 2 }} />

                        {/* Reviewer Actions */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleOpenDelete(req)}
                            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '12px' }}
                          >
                            Delete Record
                          </Button>

                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<ApprovedIcon />}
                            onClick={() => handleApprove(req)}
                            disabled={reviewingId === req._id}
                            sx={{
                              borderRadius: '10px',
                              textTransform: 'none',
                              fontWeight: 700,
                              bgcolor: '#10b981',
                              '&:hover': { bgcolor: '#059669' }
                            }}
                          >
                            {reviewingId === req._id ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Re-Approve & Publish'}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Box>
        )}
      </Container>

      {/* ── Dialog: Reject with Feedback ── */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A' }}>
          Reject Upload Request
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
            Please provide constructive feedback or a reason to the user for why this submission was rejected.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason / Guidance"
            placeholder="e.g., Please provide higher quality photos, or the Google Drive link does not have public access."
            value={rejectionFeedback}
            onChange={(e) => setRejectionFeedback(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRejectDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmReject}
            disabled={reviewingId === selectedRequestForReview?._id}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Delete Confirmation ── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A' }}>
          Delete Request?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Are you sure you want to delete this upload request? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleting}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
          >
            {deleting ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Lightbox Media Preview ── */}
      <Dialog
        open={Boolean(previewMedia)}
        onClose={() => setPreviewMedia(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#000', borderRadius: '16px', overflow: 'hidden' } }}
      >
        <Box sx={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <IconButton
            onClick={() => setPreviewMedia(null)}
            sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' }, zIndex: 10 }}
          >
            <CloseIcon />
          </IconButton>
          {previewMedia?.resourceType === 'video' ? (
            <Box
              component="video"
              src={previewMedia.url}
              controls
              autoPlay
              sx={{ maxWidth: '100%', maxHeight: '75vh', width: '100%' }}
            />
          ) : (
            <Box
              component="img"
              src={previewMedia?.url}
              alt="Media Preview"
              sx={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }}
            />
          )}
        </Box>
        {previewMedia?.caption && (
          <Box sx={{ p: 2, bgcolor: '#1E293B', color: '#fff' }}>
            <Typography variant="body2">{previewMedia.caption}</Typography>
          </Box>
        )}
      </Dialog>
    </Box>
    </LocalizationProvider>
  );
}
