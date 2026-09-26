import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import debounce from 'lodash/debounce';
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
  ButtonBase,
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
  PlayCircle as PlayIcon,
  Videocam as VideoIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import UploadRequestsTable, {
  getCategoryDisplay,
  getMediaPreview,
  formatSubmissionDateTime
} from './UploadRequestsTable';
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
    user?.role === 'ADMINISTRATOR' ||
    user?.role === 'ADMIN' ||
    user?.role === 'WARDEN' ||
    user?.role === 'CHAIRPERSON' ||
    pagePerms?.fullAccess ||
    pagePerms?.update
  );

  const canCreate = Boolean(
    user?.role === 'ADMINISTRATOR' ||
    user?.role === 'ADMIN' ||
    user?.role === 'WARDEN' ||
    user?.role === 'CHAIRPERSON' ||
    pagePerms?.fullAccess ||
    pagePerms?.create
  );

  const canDelete = Boolean(
    user?.role === 'ADMINISTRATOR' ||
    user?.role === 'ADMIN' ||
    user?.role === 'WARDEN' ||
    user?.role === 'CHAIRPERSON' ||
    pagePerms?.fullAccess ||
    pagePerms?.delete
  );

  const hasPageAccess = Boolean(
    user?.role === 'ADMINISTRATOR' ||
    user?.role === 'ADMIN' ||
    user?.role === 'WARDEN' ||
    user?.role === 'CHAIRPERSON' ||
    !pagePerms?.noAccess
  );

  const adminTabs = ['all_requests', 'request_queue', 'request_accepted', 'request_rejected'];
  const userTabs = canCreate ? ['submit', 'my_requests'] : ['my_requests'];

  // Active top-level tab
  const urlTab = searchParams.get('tab');
  const initialCategoryParam = searchParams.get('category');
  let normalizedInitialCategory = initialCategoryParam === 'drive' ? 'drive_links' : initialCategoryParam;
  if (normalizedInitialCategory === 'event') normalizedInitialCategory = 'events';

  const initialTab = isAdminOrReviewer
    ? (adminTabs.includes(urlTab) ? urlTab : 'all_requests')
    : (userTabs.includes(urlTab) ? urlTab : (normalizedInitialCategory ? 'submit' : (canCreate ? 'submit' : 'my_requests')));

  const [activeTab, setActiveTab] = useState(initialTab);

  // Synchronize tab if user role/permissions change
  useEffect(() => {
    if (isAdminOrReviewer) {
      if (!adminTabs.includes(activeTab)) {
        setActiveTab('all_requests');
      }
    } else {
      if (!userTabs.includes(activeTab)) {
        setActiveTab(canCreate ? 'submit' : 'my_requests');
      }
    }
  }, [isAdminOrReviewer, canCreate]);

  // ----------------------------------------------------
  // Form State (Normal User submission)
  // ----------------------------------------------------
  const [targetCategory, setTargetCategory] = useState(
    (normalizedInitialCategory && ['gallery', 'drive_links', 'events'].includes(normalizedInitialCategory))
      ? normalizedInitialCategory
      : 'gallery'
  );
  const [title, setTitle] = useState(searchParams.get('title') || '');
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
  const [eventDate, setEventDate] = useState(searchParams.get('eventDate') || '');
  const [startTime, setStartTime] = useState(searchParams.get('startTime') || '09:00');
  const [endTime, setEndTime] = useState(searchParams.get('endTime') || '17:00');
  const [eventLocation, setEventLocation] = useState(searchParams.get('location') || '');
  const [locationUrl, setLocationUrl] = useState(searchParams.get('locationUrl') || '');
  const [eventColor, setEventColor] = useState('#0088ff');
  const [eventCover, setEventCover] = useState({ url: '', publicId: '' });
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef(null);
  const [eventsList, setEventsList] = useState([]);
  const [eventContributionType, setEventContributionType] = useState('existing'); // 'existing' | 'new'
  const [selectedEventId, setSelectedEventId] = useState('');

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

  // Request Details Dialog & Feedback Dialog
  const [selectedRequestForDetails, setSelectedRequestForDetails] = useState(null);
  const [selectedFeedbackRequest, setSelectedFeedbackRequest] = useState(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  useEffect(() => {
    setActiveMediaIndex(0);
  }, [selectedRequestForDetails]);

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
    const fetchEvents = async () => {
      try {
        const res = await API.get('/events');
        if (res.data?.success) {
          setEventsList(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    };
    fetchFolders();
    fetchEvents();
  }, []);

  // Server-side pagination states for Admin
  const [adminPage, setAdminPage] = useState(1);
  const [adminRowsPerPage, setAdminRowsPerPage] = useState(10);
  const [adminTotal, setAdminTotal] = useState(0);
  const [adminTotalPages, setAdminTotalPages] = useState(1);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminCategory, setAdminCategory] = useState('ALL');

  // Server-side pagination states for User (my_requests)
  const [myPage, setMyPage] = useState(1);
  const [myRowsPerPage, setMyRowsPerPage] = useState(10);
  const [myTotal, setMyTotal] = useState(0);
  const [myTotalPages, setMyTotalPages] = useState(1);
  const [mySearch, setMySearch] = useState('');
  const [myCategory, setMyCategory] = useState('ALL');

  const fetchMyRequests = async (statusOverride = null, pageOverride = null, limitOverride = null, searchOverride = null, categoryOverride = null) => {
    try {
      setLoadingMyRequests(true);
      const statusToUse = statusOverride !== null ? statusOverride : myStatusFilter;
      const pageToUse = pageOverride !== null ? pageOverride : myPage;
      const limitToUse = limitOverride !== null ? limitOverride : myRowsPerPage;
      const searchToUse = searchOverride !== null ? searchOverride : mySearch;
      const categoryToUse = categoryOverride !== null ? categoryOverride : myCategory;

      const res = await API.get('/upload-requests/my-requests', {
        params: {
          status: statusToUse !== 'ALL' ? statusToUse : undefined,
          page: pageToUse,
          limit: limitToUse,
          search: searchToUse || undefined,
          category: categoryToUse !== 'ALL' ? categoryToUse : undefined
        }
      });
      if (res.data?.success) {
        setMyRequests(res.data.data || []);
        if (res.data.pagination) {
          setMyTotal(res.data.pagination.total || 0);
          setMyTotalPages(res.data.pagination.totalPages || 1);
        } else {
          setMyTotal(res.data.data?.length || 0);
          setMyTotalPages(1);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user upload requests:', err);
    } finally {
      setLoadingMyRequests(false);
    }
  };

  const fetchModerationRequests = async (statusOverride = null, pageOverride = null, limitOverride = null, searchOverride = null, categoryOverride = null) => {
    if (!isAdminOrReviewer) return;
    try {
      setLoadingModeration(true);
      let statusToFetch = statusOverride !== null ? statusOverride : activeTab;
      if (statusToFetch === 'all_requests') statusToFetch = 'ALL';
      else if (statusToFetch === 'request_accepted') statusToFetch = 'APPROVED';
      else if (statusToFetch === 'request_rejected') statusToFetch = 'REJECTED';
      else if (statusToFetch === 'request_queue') statusToFetch = 'PENDING';

      const pageToUse = pageOverride !== null ? pageOverride : adminPage;
      const limitToUse = limitOverride !== null ? limitOverride : adminRowsPerPage;
      const searchToUse = searchOverride !== null ? searchOverride : adminSearch;
      const categoryToUse = categoryOverride !== null ? categoryOverride : adminCategory;

      const res = await API.get('/upload-requests', {
        params: {
          status: statusToFetch,
          page: pageToUse,
          limit: limitToUse,
          search: searchToUse || undefined,
          category: categoryToUse !== 'ALL' ? categoryToUse : undefined
        }
      });
      if (res.data?.success) {
        setModerationList(res.data.data || []);
        if (res.data.pagination) {
          setAdminTotal(res.data.pagination.total || 0);
          setAdminTotalPages(res.data.pagination.totalPages || 1);
        } else {
          setAdminTotal(res.data.data?.length || 0);
          setAdminTotalPages(1);
        }
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

  const debouncedFetchAdminSearch = useRef(
    debounce((query, cat, tab, limit) => {
      let st = tab;
      if (st === 'all_requests') st = 'ALL';
      else if (st === 'request_accepted') st = 'APPROVED';
      else if (st === 'request_rejected') st = 'REJECTED';
      else if (st === 'request_queue') st = 'PENDING';
      fetchModerationRequests(st, 1, limit, query, cat);
    }, 400)
  ).current;

  const debouncedFetchMySearch = useRef(
    debounce((query, cat, st, limit) => {
      fetchMyRequests(st, 1, limit, query, cat);
    }, 400)
  ).current;

  useEffect(() => {
    return () => {
      debouncedFetchAdminSearch?.cancel?.();
      debouncedFetchMySearch?.cancel?.();
    };
  }, [debouncedFetchAdminSearch, debouncedFetchMySearch]);

  useEffect(() => {
    if (!isAdminOrReviewer) {
      if (activeTab === 'my_requests') {
        setMyPage(1);
        fetchMyRequests(myStatusFilter, 1);
      }
    } else {
      if (adminTabs.includes(activeTab)) {
        let st = 'ALL';
        if (activeTab === 'request_queue') st = 'PENDING';
        else if (activeTab === 'request_accepted') st = 'APPROVED';
        else if (activeTab === 'request_rejected') st = 'REJECTED';
        setAdminPage(1);
        fetchModerationRequests(st, 1);
      }
    }
  }, [activeTab, isAdminOrReviewer]);

  // Handle URL changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    const rawCat = searchParams.get('category');
    let cat = rawCat === 'drive' ? 'drive_links' : rawCat;
    if (cat === 'event') cat = 'events';

    if (isAdminOrReviewer) {
      if (tab && adminTabs.includes(tab)) {
        setActiveTab(tab);
      }
    } else {
      if (tab && userTabs.includes(tab)) {
        setActiveTab(tab);
      } else if (cat && userTabs.includes('submit')) {
        setActiveTab('submit');
      }
    }
    if (cat && ['gallery', 'drive_links', 'events'].includes(cat)) {
      setTargetCategory(cat);
    }
    if (searchParams.get('title')) setTitle(searchParams.get('title'));
    if (searchParams.get('eventDate')) setEventDate(searchParams.get('eventDate'));
    if (searchParams.get('location')) setEventLocation(searchParams.get('location'));
    if (searchParams.get('locationUrl')) setLocationUrl(searchParams.get('locationUrl'));
    if (searchParams.get('startTime')) setStartTime(searchParams.get('startTime'));
    if (searchParams.get('endTime')) setEndTime(searchParams.get('endTime'));
  }, [searchParams, isAdminOrReviewer, userTabs]);

  // ----------------------------------------------------
  // Storage & Upload Handlers (MinIO / S3 Unlimited)
  // ----------------------------------------------------

  // MinIO / S3 direct upload (unlimited size and uploading)
  const uploadToMinio = async (file, folder = 'uploads') => {
    try {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|avi|webm|mkv)$/i.test(file.name);
      const resourceType = isVideo ? 'video' : 'image';

      const presignedRes = await API.get('/gallery/presigned-url', {
        params: {
          filename: file.name,
          fileType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
          folder
        }
      });

      if (presignedRes.data?.success && presignedRes.data?.data) {
        const { uploadUrl, publicUrl, key } = presignedRes.data.data;
        await axios.put(uploadUrl, file, {
          headers: {
            'Content-Type': file.type || (isVideo ? 'video/mp4' : 'image/jpeg')
          }
        });

        return {
          url: publicUrl,
          publicId: key,
          storageProvider: 's3',
          resourceType,
          originalName: file.name,
          size: file.size
        };
      }
    } catch (directErr) {
      console.warn('Direct MinIO upload fallback to server route:', directErr.message);
    }

    // Fallback to server route
    const formData = new FormData();
    formData.append('media', file);
    formData.append('file', file);
    const res = await API.post('/upload-requests/upload-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data?.data;
  };

  const handleMediaFilesSelected = async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    try {
      setUploadingFiles(true);
      const newItems = [];

      for (const file of rawFiles) {
        const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|avi|webm|mkv)$/i.test(file.name);
        const isImage = file.type.startsWith('image/');

        if (!isImage && !isVideo) {
          enqueueSnackbar(`"${file.name}" is not a valid image or video format.`, { variant: 'error' });
          continue;
        }

        try {
          const uploaded = await uploadToMinio(file, 'uploads');
          if (uploaded) {
            newItems.push({
              url: uploaded.url,
              publicId: uploaded.publicId,
              storageProvider: 's3',
              resourceType: uploaded.resourceType || (isVideo ? 'video' : 'image'),
              originalName: uploaded.originalName || file.name,
              size: uploaded.size || file.size,
              caption: ''
            });
          }
        } catch (uploadErr) {
          enqueueSnackbar(`Failed to upload ${file.name}: ${uploadErr.response?.data?.message || uploadErr.message}`, {
            variant: 'error'
          });
        }
      }

      if (newItems.length > 0) {
        setUploadedMedia((prev) => [...prev, ...newItems]);
        enqueueSnackbar(`Successfully uploaded ${newItems.length} file(s) to MinIO!`, { variant: 'success' });
      }
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

    // Google Drive Album: ONLY allow image upload
    if (!file.type.startsWith('image/')) {
      enqueueSnackbar('Only image files (PNG, JPG, WEBP) are allowed for Google Drive album cover.', { variant: 'error' });
      if (thumbInputRef.current) thumbInputRef.current.value = '';
      return;
    }

    try {
      setUploadingThumb(true);
      const uploaded = await uploadToMinio(file, 'uploads');
      if (uploaded) {
        setDriveThumbnail(uploaded.url);
        enqueueSnackbar('Thumbnail uploaded to MinIO successfully!', { variant: 'success' });
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

    // Event Banner Cover: ONLY allow image upload
    if (!file.type.startsWith('image/')) {
      enqueueSnackbar('Only image files (PNG, JPG, WEBP) are allowed for Event banner cover.', { variant: 'error' });
      if (coverInputRef.current) coverInputRef.current.value = '';
      return;
    }

    try {
      setUploadingCover(true);
      const uploaded = await uploadToMinio(file, 'uploads');
      if (uploaded) {
        setEventCover({ url: uploaded.url, publicId: uploaded.publicId });
        enqueueSnackbar('Event cover uploaded to MinIO successfully!', { variant: 'success' });
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
      if (eventContributionType === 'existing') {
        if (!selectedEventId) {
          enqueueSnackbar('Please select an event to contribute media to.', { variant: 'warning' });
          return;
        }
        if (uploadedMedia.length === 0) {
          enqueueSnackbar('Please upload at least one photo or video for this event.', { variant: 'warning' });
          return;
        }
      } else {
        if (!eventDate || !startTime || !endTime || !eventLocation.trim()) {
          enqueueSnackbar('Please fill in date, start time, end time, and location for the event.', {
            variant: 'warning'
          });
          return;
        }
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
          existingEvent: eventContributionType === 'existing' ? selectedEventId : null,
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

  if (!hasPageAccess) {
    return (
      <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Alert severity="error" sx={{ borderRadius: '14px', p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Access Denied</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Your account role does not have permission to access the Share Media page. Please contact an administrator.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          height: { xs: 'auto', md: activeTab === 'submit' ? 'auto' : 'calc(100vh - 116px)' },
          minHeight: '100%',
          bgcolor: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          overflow: { xs: 'visible', md: activeTab === 'submit' ? 'auto' : 'hidden' },
          pb: { xs: 6, md: activeTab === 'submit' ? 8 : 0 }
        }}
      >
      {/* ── Page Header ── */}
      <Box sx={{ pt: { xs: 1.5, sm: 2.5 }, pb: 1.5, flexShrink: 0 }}>
        <Container maxWidth={activeTab === 'submit' ? 'lg' : false} sx={{ px: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', lg: 'center' },
              gap: 2
            }}
          >
            {isAdminOrReviewer && (
              <Box sx={{ flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CloudUploadIcon sx={{ color: '#0088ff', fontSize: 32 }} />
                    Media Management
                </Typography>
              </Box>
            )}
      

            {/* Top Level Tabs: All Requests, Request Queue, Request Accepted, Request Rejected for Admin/Reviewer */}
            {isAdminOrReviewer ? (
              <Box sx={{ minWidth: 0, maxWidth: '100%', width: { xs: '100%', lg: 'auto' }, overflow: 'hidden' }}>
                <Tabs
                  value={adminTabs.includes(activeTab) ? activeTab : 'all_requests'}
                  onChange={(_, val) => {
                    setActiveTab(val);
                    setSearchParams({ tab: val });
                  }}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{
                    bgcolor: '#F1F5F9',
                    p: '4px',
                    borderRadius: '12px',
                    minHeight: '40px',
                    maxWidth: '100%',
                    '& .MuiTabs-indicator': { display: 'none' },
                    '& .MuiTabs-scroller': {
                      overflowX: 'auto !important',
                      scrollbarWidth: 'none',
                      '&::-webkit-scrollbar': { display: 'none' }
                    },
                    '& .MuiTabs-flexContainer': {
                      gap: 0.5,
                      flexWrap: 'nowrap'
                    },
                    '& .MuiTabs-scrollButtons': {
                      color: '#64748B',
                      width: 28,
                      '&.Mui-disabled': { opacity: 0.25 }
                    }
                  }}
                >
                  <Tab
                    value="all_requests"
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <span>All Requests</span>
                        {counts.total > 0 && (
                          <Chip
                            size="small"
                            label={counts.total}
                            sx={{
                              height: 18,
                              fontSize: '10px',
                              fontWeight: 700,
                              bgcolor: activeTab === 'all_requests' ? '#2563EB' : '#E2E8F0',
                              color: activeTab === 'all_requests' ? '#fff' : '#64748B'
                            }}
                          />
                        )}
                      </Box>
                    }
                    icon={<GalleryIcon sx={{ fontSize: 18 }} />}
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
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      '&.Mui-selected': { bgcolor: '#FFFFFF', color: '#2563EB', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
                    }}
                  />
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
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
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
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
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
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      '&.Mui-selected': { bgcolor: '#FFFFFF', color: '#ef4444', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
                    }}
                  />
                </Tabs>
              </Box>
            ) : (
              <Box sx={{ minWidth: 0, maxWidth: '100%', width: { xs: '100%', lg: 'auto' }, overflow: 'hidden' }}>
                <Tabs
                  value={activeTab === 'my_requests' ? 'my_requests' : 'submit'}
                  onChange={(_, val) => {
                    setActiveTab(val);
                    setSearchParams({ tab: val });
                  }}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{
                    bgcolor: '#F1F5F9',
                    p: '4px',
                    borderRadius: '12px',
                    minHeight: '40px',
                    maxWidth: '100%',
                    '& .MuiTabs-indicator': { display: 'none' },
                    '& .MuiTabs-scroller': {
                      overflowX: 'auto !important',
                      scrollbarWidth: 'none',
                      '&::-webkit-scrollbar': { display: 'none' }
                    },
                    '& .MuiTabs-flexContainer': {
                      gap: 0.5,
                      flexWrap: 'nowrap'
                    },
                    '& .MuiTabs-scrollButtons': {
                      color: '#64748B',
                      width: 28,
                      '&.Mui-disabled': { opacity: 0.25 }
                    }
                  }}
                >
                  <Tab
                    value="submit"
                    label="Share Memories"
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
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
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
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      '&.Mui-selected': { bgcolor: '#FFFFFF', color: '#0088ff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
                    }}
                  />
                </Tabs>
              </Box>
            )}
          </Box>
        </Container>
      </Box>

      
      {!isAdminOrReviewer && activeTab === 'submit' && (
        <Container maxWidth="lg" sx={{ mt: 1, pb: 6 }}>
          <Box component="form" onSubmit={handleSubmitRequest}>
            <Grid container spacing={3} alignItems="flex-start">
              {/* Left Column: Form Details (Scrollable Cards) */}
              <Grid
                size={{ xs: 12, md: 7 }}
                sx={{
                  maxHeight: { md: 'calc(100vh - 210px)' },
                  overflowY: { md: 'auto' },
                  pr: { md: 1.5 },
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#CBD5E1 transparent',
                  '&::-webkit-scrollbar': {
                    width: '6px'
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'transparent'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#CBD5E1',
                    borderRadius: '6px'
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    backgroundColor: '#94A3B8'
                  }
                }}
              >
                {/* Step 1: Destination Selection (Simple 3 Tabs) */}
                <Card sx={{ borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0', mb: 1.5 }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box
                      sx={{
                        display: 'flex',
                        bgcolor: '#F1F5F9',
                        p: 0.5,
                        borderRadius: '10px',
                        gap: 0.75,
                        width: '100%'
                      }}
                    >
                      {[
                        { id: 'gallery', label: 'Gallery', icon: <GalleryIcon sx={{ fontSize: 18 }} />, color: '#0088ff' },
                        { id: 'events', label: 'Events', icon: <EventIcon sx={{ fontSize: 18 }} />, color: '#8b5cf6' },
                        { id: 'drive_links', label: 'Drive', icon: <DriveIcon sx={{ fontSize: 18 }} />, color: '#10b981' }
                      ].map((tab) => {
                        const isSelected = targetCategory === tab.id;
                        return (
                          <ButtonBase
                            key={tab.id}
                            onClick={() => setTargetCategory(tab.id)}
                            sx={{
                              flex: 1,
                              py: 0.9,
                              px: 1.5,
                              borderRadius: '8px',
                              bgcolor: isSelected ? '#FFFFFF' : 'transparent',
                              color: isSelected ? tab.color : '#64748B',
                              fontWeight: isSelected ? 800 : 600,
                              fontSize: '13.5px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 0.75,
                              boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                              border: isSelected ? `1.5px solid ${tab.color}` : '1.5px solid transparent',
                              transition: 'all 0.15s ease',
                              '&:hover': {
                                bgcolor: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.6)'
                              }
                            }}
                          >
                            {tab.icon}
                            <span>{tab.label}</span>
                          </ButtonBase>
                        );
                      })}
                    </Box>
                  </CardContent>
                </Card>

                {/* Step 2: Information & Details Form (Compact with External Labels) */}
                <Card sx={{ borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0', mb: 1.5 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 2, fontSize: '0.92rem' }}>
                      2. Memory & Asset Details
                    </Typography>

                    {/* Title */}
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, fontSize: '13px' }}>
                        Title  <span style={{ color: '#EF4444' }}>*</span>
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. Annual Sports Meet 2026"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </Box>

                    {/* Description */}
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, fontSize: '13px' }}>
                        Description <span style={{ color: '#64748B', fontWeight: 500, fontSize: '12px' }}>(Optional)</span>
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Brief background or highlights about this memory..."
                        multiline
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </Box>

                    {/* Category: GALLERY */}
                    {targetCategory === 'gallery' && (
                      <Box sx={{ mb: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, fontSize: '13px' }}>
Gallery Album <span style={{ color: '#64748B', fontWeight: 500, fontSize: '12px' }}>(Optional)</span>
                        </Typography>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          value={selectedFolder}
                          onChange={(e) => setSelectedFolder(e.target.value)}
                        >
                          <MenuItem value="">Main Gallery (Root)</MenuItem>
                          {folders.map((f) => (
                            <MenuItem key={f._id} value={f._id}>
                              📁 {f.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Box>
                    )}

                    {/* Category: DRIVE LINKS */}
                    {targetCategory === 'drive_links' && (
                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, fontSize: '13px' }}>
                            Google Drive Folder URL <span style={{ color: '#EF4444' }}>*</span>
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="https://drive.google.com/drive/folders/..."
                            value={driveUrl}
                            onChange={(e) => setDriveUrl(e.target.value)}
                            required
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, fontSize: '13px' }}>
                            Date of Event <span style={{ color: '#EF4444' }}>*</span>
                          </Typography>
                          <DatePicker
                            format="DD/MM/YYYY"
                            value={driveEventDate ? dayjs(driveEventDate) : null}
                            onChange={(newValue) => setDriveEventDate(newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '')}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                size: 'small',
                                required: true
                              }
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, fontSize: '13px' }}>
                            Category
                          </Typography>
                          <TextField
                            select
                            fullWidth
                            size="small"
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
                      <Box sx={{ mb: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, fontSize: '13px' }}>
                          Contribution Mode
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                          <Chip
                            size="small"
                            label="Contribute to Existing Event"
                            color={eventContributionType === 'existing' ? 'primary' : 'default'}
                            variant={eventContributionType === 'existing' ? 'filled' : 'outlined'}
                            onClick={() => setEventContributionType('existing')}
                            sx={{ fontWeight: 700, cursor: 'pointer' }}
                          />
                          <Chip
                            size="small"
                            label="Propose New Event"
                            color={eventContributionType === 'new' ? 'primary' : 'default'}
                            variant={eventContributionType === 'new' ? 'filled' : 'outlined'}
                            onClick={() => {
                              setEventContributionType('new');
                              setSelectedEventId('');
                            }}
                            sx={{ fontWeight: 700, cursor: 'pointer' }}
                          />
                        </Stack>

                        {eventContributionType === 'existing' && (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, fontSize: '13px' }}>
                              Select Existing Event <span style={{ color: '#EF4444' }}>*</span>
                            </Typography>
                            <TextField
                              select
                              fullWidth
                              size="small"
                              required
                              value={selectedEventId}
                              onChange={(e) => {
                                const evId = e.target.value;
                                setSelectedEventId(evId);
                                const found = eventsList.find((ev) => ev._id === evId);
                                if (found) {
                                  setTitle(found.title);
                                  setEventDate(found.startDate || found.eventDate ? dayjs(found.startDate || found.eventDate).format('YYYY-MM-DD') : '');
                                  setStartTime(found.startTime || '09:00');
                                  setEndTime(found.endTime || '17:00');
                                  setEventLocation(found.location || '');
                                  locationUrl && setLocationUrl(found.locationUrl || '');
                                }
                              }}
                            >
                              <MenuItem value="" disabled>-- Choose an Event --</MenuItem>
                              {eventsList.map((ev) => (
                                <MenuItem key={ev._id} value={ev._id}>
                                  📅 {ev.title} {ev.startDate || ev.eventDate ? `(${dayjs(ev.startDate || ev.eventDate).format('DD MMM YYYY')})` : ''}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Box>
                        )}

                        {eventContributionType === 'new' && (
                          <Grid container spacing={1.5}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, fontSize: '13px' }}>
                                Event Date <span style={{ color: '#EF4444' }}>*</span>
                              </Typography>
                              <DatePicker
                                format="DD/MM/YYYY"
                                required
                                value={eventDate ? dayjs(eventDate) : null}
                                onChange={(newValue) => setEventDate(newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '')}
                                slotProps={{
                                  textField: {
                                    fullWidth: true,
                                    size: 'small',
                                    required: true
                                  }
                                }}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, fontSize: '13px' }}>
                                Start Time <span style={{ color: '#EF4444' }}>*</span>
                              </Typography>
                              <TimePicker
                                required
                                value={startTime ? dayjs(`2000-01-01T${startTime}`) : null}
                                onChange={(newValue) => setStartTime(newValue && newValue.isValid() ? newValue.format('HH:mm') : '')}
                                slotProps={{
                                  textField: {
                                    fullWidth: true,
                                    size: 'small',
                                    required: true
                                  }
                                }}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, fontSize: '13px' }}>
                                End Time <span style={{ color: '#EF4444' }}>*</span>
                              </Typography>
                              <TimePicker
                                value={endTime ? dayjs(`2000-01-01T${endTime}`) : null}
                                onChange={(newValue) => setEndTime(newValue && newValue.isValid() ? newValue.format('HH:mm') : '')}
                                slotProps={{
                                  textField: {
                                    fullWidth: true,
                                    size: 'small',
                                    required: true
                                  }
                                }}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, fontSize: '13px' }}>
                                Event Location / Venue <span style={{ color: '#EF4444' }}>*</span>
                              </Typography>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="Hostel Auditorium, Main Ground..."
                                value={eventLocation}
                                onChange={(e) => setEventLocation(e.target.value)}
                                required
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, fontSize: '13px' }}>
                                Google Maps URL <span style={{ color: '#64748B', fontWeight: 500, fontSize: '12px' }}>(Optional)</span>
                              </Typography>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="https://maps.app.goo.gl/..."
                                value={locationUrl}
                                onChange={(e) => setLocationUrl(e.target.value)}
                              />
                            </Grid>
                          </Grid>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Right Column: Upload Cards & Actions (Fixed/Sticky) */}
              <Grid
                size={{ xs: 12, md: 5 }}
                sx={{
                  position: { md: 'sticky' },
                  top: { md: 24 },
                  alignSelf: { md: 'flex-start' },
                  maxHeight: { md: 'calc(100vh - 210px)' },
                  overflowY: { md: 'auto' },
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#CBD5E1 transparent',
                  '&::-webkit-scrollbar': {
                    width: '4px'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#CBD5E1',
                    borderRadius: '4px'
                  }
                }}
              >
                {/* Step 3: Media Upload Dropzone (for Gallery & Events) */}
                {targetCategory !== 'drive_links' && (
                  <Card sx={{ borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0', mb: 1.5 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>
                          Upload Media Assets {targetCategory === 'gallery' ? '(Required)' : '(Optional)'}
                        </Typography>
                      </Box>

                      {/* Dropzone Box */}
                      <Box
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                          border: '1.5px dashed #0088ff',
                          borderRadius: '12px',
                          bgcolor: 'rgba(0,136,255,0.02)',
                          p: { xs: 2, sm: 2.25 },
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
                        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'rgba(0,136,255,0.1)', color: '#0088ff', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
                          {uploadingFiles ? <CircularProgress size={20} sx={{ color: '#0088ff' }} /> : <CloudUploadIcon sx={{ fontSize: 22 }} />}
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '13px' }}>
                          {uploadingFiles ? 'Uploading assets...' : 'Click to select or drag and drop photos & videos'}
                        </Typography>
                      </Box>

                      {/* Uploaded Media Grid */}
                      {uploadedMedia.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>
                              {uploadedMedia.length} asset{uploadedMedia.length > 1 ? 's' : ''} uploaded
                            </Typography>
                            {uploadedMedia.length > 1 && (
                              <Button
                                size="small"
                                color="error"
                                onClick={() => setUploadedMedia([])}
                                sx={{ fontSize: '12px', textTransform: 'none', py: 0.25, px: 1, minWidth: 'auto', fontWeight: 600 }}
                              >
                                Remove All
                              </Button>
                            )}
                          </Box>

                          <Grid container spacing={1.5}>
                            {uploadedMedia.map((item, idx) => (
                              <Grid size={{ xs: 6 }} key={idx}>
                                <Paper
                                  elevation={0}
                                  sx={{
                                    position: 'relative',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: '1px solid #E2E8F0',
                                    bgcolor: '#0F172A',
                                    aspectRatio: '16/10',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                                      borderColor: '#CBD5E1',
                                      '& .media-preview-img': {
                                        transform: 'scale(1.04)'
                                      }
                                    }
                                  }}
                                >
                                  {/* Media Image / Video area with lightbox trigger */}
                                  <Box
                                    onClick={() => setPreviewMedia(item)}
                                    sx={{
                                      position: 'relative',
                                      width: '100%',
                                      height: '100%',
                                      cursor: 'pointer',
                                      overflow: 'hidden',
                                      bgcolor: '#0F172A'
                                    }}
                                  >
                                    {item.resourceType === 'video' ? (
                                      <Box
                                        sx={{
                                          width: '100%',
                                          height: '100%',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          bgcolor: '#0F172A',
                                          position: 'relative'
                                        }}
                                      >
                                        <Box
                                          component="video"
                                          src={item.url}
                                          className="media-preview-img"
                                          sx={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transition: 'transform 0.3s ease'
                                          }}
                                        />
                                        <Box
                                          sx={{
                                            position: 'absolute',
                                            width: 32,
                                            height: 32,
                                            borderRadius: '50%',
                                            bgcolor: 'rgba(255, 255, 255, 0.92)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                                            color: '#0F172A',
                                            zIndex: 2
                                          }}
                                        >
                                          <PlayIcon sx={{ fontSize: 18, ml: 0.2 }} />
                                        </Box>
                                      </Box>
                                    ) : (
                                      <Box
                                        component="img"
                                        src={item.url}
                                        alt={item.originalName || 'Asset preview'}
                                        className="media-preview-img"
                                        sx={{
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'cover',
                                          display: 'block',
                                          transition: 'transform 0.3s ease'
                                        }}
                                      />
                                    )}

                                    {/* Type Badge on Top-Left */}
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        top: 6,
                                        left: 6,
                                        bgcolor: 'rgba(15, 23, 42, 0.65)',
                                        backdropFilter: 'blur(6px)',
                                        color: '#FFFFFF',
                                        borderRadius: '5px',
                                        px: 0.75,
                                        py: 0.25,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        fontSize: '10.5px',
                                        fontWeight: 600,
                                        zIndex: 2
                                      }}
                                    >
                                      {item.resourceType === 'video' ? (
                                        <>
                                          <VideoIcon sx={{ fontSize: 12 }} />
                                          <span>Video</span>
                                        </>
                                      ) : (
                                        <>
                                          <ImageIcon sx={{ fontSize: 12 }} />
                                          <span>Photo</span>
                                        </>
                                      )}
                                    </Box>

                                    {/* Delete Button on Top-Right */}
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveMedia(idx);
                                      }}
                                      title="Remove asset"
                                      sx={{
                                        position: 'absolute',
                                        top: 6,
                                        right: 6,
                                        bgcolor: 'rgba(15, 23, 42, 0.65)',
                                        backdropFilter: 'blur(6px)',
                                        color: '#FFFFFF',
                                        width: 24,
                                        height: 24,
                                        zIndex: 3,
                                        transition: 'all 0.15s ease',
                                        '&:hover': {
                                          bgcolor: '#DC2626',
                                          color: '#FFFFFF',
                                          transform: 'scale(1.08)'
                                        }
                                      }}
                                    >
                                      <DeleteIcon sx={{ fontSize: 13 }} />
                                    </IconButton>

                                    {/* Bottom Info Bar Overlay with Filename and Size */}
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        background: 'linear-gradient(to top, rgba(15, 23, 42, 0.88) 0%, rgba(15, 23, 42, 0.45) 60%, transparent 100%)',
                                        pt: 2.5,
                                        pb: 0.75,
                                        px: 1,
                                        zIndex: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-end',
                                        gap: 0.5
                                      }}
                                    >
                                      <Typography
                                        sx={{
                                          color: '#FFFFFF',
                                          fontSize: '11px',
                                          fontWeight: 600,
                                          lineHeight: 1.2,
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          minWidth: 0
                                        }}
                                        title={item.originalName}
                                      >
                                        {item.originalName || `Asset #${idx + 1}`}
                                      </Typography>
                                      <Typography
                                        sx={{
                                          color: 'rgba(255, 255, 255, 0.75)',
                                          fontSize: '10px',
                                          fontWeight: 500,
                                          whiteSpace: 'nowrap',
                                          flexShrink: 0
                                        }}
                                      >
                                        {item.size ? (item.size / (1024 * 1024)).toFixed(1) + ' MB' : ''}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Specific thumbnail preview for Drive Links */}
                {targetCategory === 'drive_links' && (
                  <Card sx={{ borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0', mb: 1.5 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 1.5, fontSize: '0.92rem' }}>
                        Drive Album Cover Thumbnail
                      </Typography>

                      {driveThumbnail ? (
                        <Box sx={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', height: 140, mb: 1.5 }}>
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
                            border: '1.5px dashed #CBD5E1',
                            borderRadius: '10px',
                            p: 2,
                            textAlign: 'center',
                            cursor: 'pointer',
                            mb: 1.5,
                            '&:hover': { borderColor: '#10b981', bgcolor: 'rgba(16,185,129,0.02)' }
                          }}
                        >
                          <input type="file" accept="image/*" ref={thumbInputRef} style={{ display: 'none' }} onChange={handleThumbnailSelected} />
                          {uploadingThumb ? (
                            <CircularProgress size={20} sx={{ color: '#10b981' }} />
                          ) : (
                            <>
                              <PhotoCameraIcon sx={{ color: '#64748B', mb: 0.5, fontSize: 22 }} />
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

                {/* Moderation Workflow Notice */}
                <Card sx={{ borderRadius: '12px', bgcolor: '#F0F9FF', border: '1px solid #BAE6FD', mb: 2 }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <InfoIcon sx={{ color: '#0284C7', fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0369A1', fontSize: '13px' }}>
                        Review & Approval Policy
                      </Typography>
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
                    py: 1.25,
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '14.5px',
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #0088ff 0%, #0066cc 100%)',
                    boxShadow: '0 4px 14px rgba(0, 136, 255, 0.25)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0077ee 0%, #0055bb 100%)',
                      boxShadow: '0 6px 18px rgba(0, 136, 255, 0.35)'
                    }
                  }}
                >
                  {submitting ? (
                    <CircularProgress size={20} sx={{ color: '#fff' }} />
                  ) : (
                    'Submit for Review'
                  )}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Container>
      )}

      {/* ========================================================= */}
      {/* NORMAL USER: TAB 2 - MY SUBMISSIONS TABLE                */}
      {/* ========================================================= */}
      {!isAdminOrReviewer && activeTab === 'my_requests' && (
        <Container
          maxWidth={false}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            px: { xs: 1.5, sm: 2.5, md: 3 },
            py: { xs: 1.5, sm: 2 },
            overflow: { xs: 'visible', md: 'hidden' }
          }}
        >
          <UploadRequestsTable
            requests={myRequests}
            loading={loadingMyRequests}
            isAdmin={false}
            currentUser={user}
            onRefresh={() => fetchMyRequests(myStatusFilter, myPage, myRowsPerPage, mySearch, myCategory)}
            extraFilters={
              <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', py: 0.5, flexWrap: 'nowrap' }}>
                {['PENDING', 'APPROVED', 'REJECTED'].map((st) => (
                  <Chip
                    key={st}
                    label={st.charAt(0) + st.slice(1).toLowerCase()}
                    clickable
                    onClick={() => {
                      setMyStatusFilter(st);
                      setMyPage(1);
                      fetchMyRequests(st, 1, myRowsPerPage, mySearch, myCategory);
                    }}
                    variant={myStatusFilter === st ? 'filled' : 'outlined'}
                    color={myStatusFilter === st ? 'primary' : 'default'}
                    sx={{
                      fontWeight: 600,
                      fontSize: '12.5px',
                      borderRadius: '8px',
                      height: '30px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      bgcolor: myStatusFilter === st ? '#0088ff' : '#FFFFFF',
                      borderColor: myStatusFilter === st ? '#0088ff' : '#E2E8F0',
                      color: myStatusFilter === st ? '#FFFFFF' : '#64748B',
                      '&:hover': {
                        bgcolor: myStatusFilter === st ? '#0077ee' : '#F8FAFC'
                      }
                    }}
                  />
                ))}
              </Stack>
            }
            onViewDetails={(req) => setSelectedRequestForDetails(req)}
            onDelete={(req) => handleOpenDelete(req)}
            onViewPublished={(req) => {
              if (req.targetCategory === 'gallery') navigate('/gallery');
              else if (req.targetCategory === 'drive_links') navigate('/drive-links');
              else if (req.targetCategory === 'events') navigate('/events');
            }}
            onViewFeedback={(req) => setSelectedFeedbackRequest(req)}
            serverPagination={true}
            page={myPage}
            rowsPerPage={myRowsPerPage}
            totalItems={myTotal}
            totalPages={myTotalPages}
            onPageChange={(newPage) => {
              setMyPage(newPage);
              fetchMyRequests(myStatusFilter, newPage, myRowsPerPage, mySearch, myCategory);
            }}
            onRowsPerPageChange={(newLimit) => {
              setMyRowsPerPage(newLimit);
              setMyPage(1);
              fetchMyRequests(myStatusFilter, 1, newLimit, mySearch, myCategory);
            }}
            searchQuery={mySearch}
            onSearchQueryChange={(query) => {
              setMySearch(query);
              setMyPage(1);
              debouncedFetchMySearch(query, myCategory, myStatusFilter, myRowsPerPage);
            }}
            categoryFilter={myCategory}
            onCategoryFilterChange={(cat) => {
              setMyCategory(cat);
              setMyPage(1);
              fetchMyRequests(myStatusFilter, 1, myRowsPerPage, mySearch, cat);
            }}
          />
        </Container>
      )}

      {/* ========================================================= */}
      {/* ADMIN / REVIEWER: MODERATION TABLE                        */}
      {/* ========================================================= */}
      {isAdminOrReviewer && adminTabs.includes(activeTab) && (
        <Container
          maxWidth={false}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            px: { xs: 1.5, sm: 2.5, md: 3 },
            py: { xs: 1.5, sm: 2 },
            overflow: { xs: 'visible', md: 'hidden' }
          }}
        >
          <UploadRequestsTable
            requests={moderationList}
            loading={loadingModeration}
            isAdmin={true}
            currentUser={user}
            onRefresh={() => fetchModerationRequests(undefined, adminPage, adminRowsPerPage, adminSearch, adminCategory)}
            onViewDetails={(req) => setSelectedRequestForDetails(req)}
            onApprove={(req) => handleApprove(req)}
            onReject={(req) => handleOpenRejectDialog(req)}
            onDelete={(req) => handleOpenDelete(req)}
            onViewPublished={(req) => {
              if (req.targetCategory === 'gallery') navigate('/gallery');
              else if (req.targetCategory === 'drive_links') navigate('/drive-links');
              else if (req.targetCategory === 'events') navigate('/events');
            }}
            reviewingId={reviewingId}
            serverPagination={true}
            page={adminPage}
            rowsPerPage={adminRowsPerPage}
            totalItems={adminTotal}
            totalPages={adminTotalPages}
            onPageChange={(newPage) => {
              setAdminPage(newPage);
              fetchModerationRequests(undefined, newPage, adminRowsPerPage, adminSearch, adminCategory);
            }}
            onRowsPerPageChange={(newLimit) => {
              setAdminRowsPerPage(newLimit);
              setAdminPage(1);
              fetchModerationRequests(undefined, 1, newLimit, adminSearch, adminCategory);
            }}
            searchQuery={adminSearch}
            onSearchQueryChange={(query) => {
              setAdminSearch(query);
              setAdminPage(1);
              debouncedFetchAdminSearch(query, adminCategory, activeTab, adminRowsPerPage);
            }}
            categoryFilter={adminCategory}
            onCategoryFilterChange={(cat) => {
              setAdminCategory(cat);
              setAdminPage(1);
              fetchModerationRequests(undefined, 1, adminRowsPerPage, adminSearch, cat);
            }}
          />
        </Container>
      )}

      {/* ── Dialog: Reject with Feedback ── */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A' }}>
          Reject Upload Request
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
            You can optionally provide feedback or guidance to the member explaining why this submission was rejected.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason / Feedback (Optional)"
            placeholder="e.g., Please provide higher quality photos, or leave blank to reject without feedback."
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
        {previewMedia?.originalName && (
          <Box sx={{ p: 2, bgcolor: '#1E293B', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{previewMedia.originalName}</Typography>
            {previewMedia.size ? (
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                {(previewMedia.size / (1024 * 1024)).toFixed(1)} MB
              </Typography>
            ) : null}
          </Box>
        )}
      </Dialog>

      {/* ── Dialog: Request Media Preview & Actions ── */}
      <Dialog
        open={Boolean(selectedRequestForDetails)}
        onClose={() => setSelectedRequestForDetails(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            bgcolor: '#FFFFFF',
            p: 2.5
          }
        }}
      >
        {selectedRequestForDetails && (() => {
          const req = selectedRequestForDetails;
          const mediaItems = req.media || [];
          const activeMedia = mediaItems[activeMediaIndex] || mediaItems[0];

          return (
            <Box>
              {/* Media Preview Box */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  minHeight: 340,
                  maxHeight: 520,
                  bgcolor: '#000000',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* Floating Close X button */}
                <IconButton
                  onClick={() => setSelectedRequestForDetails(null)}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    bgcolor: 'rgba(0,0,0,0.5)',
                    color: '#ffffff',
                    zIndex: 2,
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' }
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>

                {req.status === 'REJECTED' ? (
                  <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        bgcolor: 'rgba(220, 38, 38, 0.15)',
                        color: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 1.5
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 26 }} />
                    </Box>
                    <Typography sx={{ color: '#F1F5F9', fontWeight: 700, fontSize: '15px' }}>
                      Media Asset Deleted
                    </Typography>
                    <Typography sx={{ color: '#94A3B8', fontSize: '13px', mt: 0.5, maxWidth: 360, mx: 'auto' }}>
                      The media asset has been permanently deleted from storage and database upon rejection.
                    </Typography>
                  </Box>
                ) : activeMedia ? (
                  activeMedia.resourceType === 'video' || /\.(mp4|mov|avi|webm|mkv)$/i.test(activeMedia.url) ? (
                    <Box
                      component="video"
                      controls
                      autoPlay={false}
                      src={activeMedia.url}
                      sx={{ width: '100%', maxHeight: 520, objectFit: 'contain' }}
                    />
                  ) : (
                    <Box
                      component="img"
                      src={activeMedia.url}
                      alt="Media Preview"
                      sx={{ maxWidth: '100%', maxHeight: 520, objectFit: 'contain' }}
                    />
                  )
                ) : req.driveThumbnail ? (
                  <Box
                    component="img"
                    src={req.driveThumbnail}
                    alt="Drive Thumbnail"
                    sx={{ maxWidth: '100%', maxHeight: 520, objectFit: 'contain' }}
                  />
                ) : req.eventDetails?.coverImage?.url ? (
                  <Box
                    component="img"
                    src={req.eventDetails.coverImage.url}
                    alt="Event Cover"
                    sx={{ maxWidth: '100%', maxHeight: 520, objectFit: 'contain' }}
                  />
                ) : (
                  <Typography sx={{ color: '#94A3B8', py: 8 }}>No preview available</Typography>
                )}
              </Box>

              {/* Multiple Media Thumbnails if any */}
              {req.status !== 'REJECTED' && mediaItems.length > 1 && (
                <Stack direction="row" spacing={1} sx={{ mt: 1.5, overflowX: 'auto', py: 0.5 }}>
                  {mediaItems.map((m, idx) => (
                    <Box
                      key={idx}
                      onClick={() => setActiveMediaIndex(idx)}
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: activeMediaIndex === idx ? '2px solid #2563EB' : '1px solid #CBD5E1',
                        opacity: activeMediaIndex === idx ? 1 : 0.65,
                        transition: 'all 0.15s ease',
                        flexShrink: 0
                      }}
                    >
                      <Box
                        component="img"
                        src={m.url}
                        alt={`Thumb ${idx + 1}`}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}

              {/* Action Buttons Below the Preview */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 1.5,
                  mt: 2.5
                }}
              >
                <Button
                  onClick={() => setSelectedRequestForDetails(null)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    color: '#64748B',
                    px: 2.5
                  }}
                >
                  Close
                </Button>

                {isAdminOrReviewer ? (
                  <>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        setSelectedRequestForDetails(null);
                        handleOpenDelete(req);
                      }}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: '8px',
                        px: 2.5
                      }}
                    >
                      Delete Request
                    </Button>

                    {req.status === 'PENDING' && (
                      <>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleOpenRejectDialog(req)}
                          disabled={reviewingId === req._id}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: '8px',
                            px: 2.5
                          }}
                        >
                          Reject with Feedback
                        </Button>

                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<ApprovedIcon />}
                          onClick={() => handleApprove(req)}
                          disabled={reviewingId === req._id}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: '8px',
                            bgcolor: '#10b981',
                            px: 2.5,
                            '&:hover': { bgcolor: '#059669' }
                          }}
                        >
                          {reviewingId === req._id ? (
                            <CircularProgress size={18} sx={{ color: '#fff' }} />
                          ) : (
                            'Approve & Publish'
                          )}
                        </Button>
                      </>
                    )}

                    {req.status === 'REJECTED' && (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<ApprovedIcon />}
                        onClick={() => handleApprove(req)}
                        disabled={reviewingId === req._id}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          borderRadius: '8px',
                          bgcolor: '#10b981',
                          px: 2.5,
                          '&:hover': { bgcolor: '#059669' }
                        }}
                      >
                        {reviewingId === req._id ? (
                          <CircularProgress size={18} sx={{ color: '#fff' }} />
                        ) : (
                          'Re-approve'
                        )}
                      </Button>
                    )}
                  </>
                ) : (
                  req.status === 'PENDING' && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        setSelectedRequestForDetails(null);
                        handleOpenDelete(req);
                      }}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: '8px',
                        px: 2.5
                      }}
                    >
                      Cancel Request
                    </Button>
                  )
                )}
              </Box>
            </Box>
          );
        })()}
      </Dialog>

      {/* ── Dialog: User View Admin Feedback ── */}
      <Dialog
        open={Boolean(selectedFeedbackRequest)}
        onClose={() => setSelectedFeedbackRequest(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A' }}>
          Admin Feedback
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
            Submission: {selectedFeedbackRequest?.title}
          </Typography>
          <Alert severity="error" sx={{ borderRadius: '10px', mt: 1 }}>
            <Typography variant="body2">
              {selectedFeedbackRequest?.adminFeedback || 'No specific feedback was provided.'}
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setSelectedFeedbackRequest(null)}
            variant="contained"
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </LocalizationProvider>
  );
}
