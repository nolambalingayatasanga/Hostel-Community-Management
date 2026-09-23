import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  CircularProgress,
  Stack,
  Card,
  Select,
  MenuItem,
  Button,
  Avatar,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ViewIcon from '@mui/icons-material/VisibilityOutlined';
import ApproveIcon from '@mui/icons-material/CheckCircleOutlined';
import RedoIcon from '@mui/icons-material/RestartAlt';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import FeedbackIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VideoIcon from '@mui/icons-material/Videocam';
import PhotoIcon from '@mui/icons-material/PhotoCamera';
import ImageIcon from '@mui/icons-material/Image';
import DriveIcon from '@mui/icons-material/CloudQueue';
import EventIcon from '@mui/icons-material/Event';
import HourglassIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
const ClearIcon = CloseIcon;

/**
 * Determine display category meta (badge styling, icon, label)
 */
export const getCategoryDisplay = (req) => {
  // If target category is gallery, inspect media resourceType
  if (req.targetCategory === 'gallery') {
    const hasVideo = req.media && req.media.some((m) => m.resourceType === 'video');
    if (hasVideo) {
      return {
        key: 'video',
        label: 'Video',
        icon: <VideoIcon sx={{ fontSize: 15 }} />,
        color: '#2563EB',
        bg: '#EFF6FF',
        border: '#DBEAFE'
      };
    }
    return {
      key: 'image',
      label: 'Image',
      icon: <ImageIcon sx={{ fontSize: 15 }} />,
      color: '#0284C7',
      bg: '#F0F9FF',
      border: '#BAE6FD'
    };
  }

  if (req.targetCategory === 'drive_links') {
    return {
      key: 'drive',
      label: 'Drive Link',
      icon: <DriveIcon sx={{ fontSize: 15 }} />,
      color: '#059669',
      bg: '#ECFDF5',
      border: '#A7F3D0'
    };
  }

  if (req.targetCategory === 'events') {
    return {
      key: 'event',
      label: 'Event',
      icon: <EventIcon sx={{ fontSize: 15 }} />,
      color: '#7C3AED',
      bg: '#F5F3FF',
      border: '#DDD6FE'
    };
  }

  return {
    key: 'other',
    label: req.targetCategory || 'Media',
    icon: <PhotoIcon sx={{ fontSize: 15 }} />,
    color: '#4B5563',
    bg: '#F3F4F6',
    border: '#E5E7EB'
  };
};

/**
 * Helper to get preview thumbnail and whether it's video
 */
export const getMediaPreview = (req) => {
  if (req.status === 'REJECTED') {
    return {
      url: null,
      isVideo: false,
      totalCount: 0,
      isRejected: true
    };
  }
  if (req.media && req.media.length > 0) {
    const first = req.media[0];
    const isVid = first.resourceType === 'video' || /\.(mp4|mov|avi|webm|mkv)$/i.test(first.url);
    return {
      url: first.url,
      isVideo: isVid,
      totalCount: req.media.length,
      isRejected: false
    };
  }
  if (req.driveThumbnail) {
    return { url: req.driveThumbnail, isVideo: false, totalCount: 1, isRejected: false };
  }
  if (req.eventDetails?.coverImage?.url) {
    return { url: req.eventDetails.coverImage.url, isVideo: false, totalCount: 1, isRejected: false };
  }
  return {
    url: null,
    isVideo: false,
    totalCount: 0,
    isRejected: false
  };
};

/**
 * Format date & time into two separate lines
 */
export const formatSubmissionDateTime = (dateString) => {
  if (!dateString) return { date: '—', time: '—' };
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return { date: '—', time: '—' };

  const date = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const time = d.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return { date, time };
};

export default function UploadRequestsTable({
  requests = [],
  loading = false,
  isAdmin = false,
  currentUser = null,
  onViewDetails,
  onApprove,
  onReject,
  onDelete,
  onViewPublished,
  onViewFeedback,
  reviewingId = null,
  onRefresh = null,
  extraFilters = null,
  // Server-side pagination & filter controls
  serverPagination = false,
  page: controlledPage = 1,
  rowsPerPage: controlledRowsPerPage = 10,
  totalItems: controlledTotalItems = 0,
  totalPages: controlledTotalPages = 1,
  onPageChange = null,
  onRowsPerPageChange = null,
  searchQuery: controlledSearchQuery = '',
  onSearchQueryChange = null,
  categoryFilter: controlledCategoryFilter = 'ALL',
  onCategoryFilterChange = null
}) {
  // Local state fallbacks (used when serverPagination is false)
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [localCategoryFilter, setLocalCategoryFilter] = useState('ALL');
  const [localPage, setLocalPage] = useState(1);
  const [localRowsPerPage, setLocalRowsPerPage] = useState(10);

  const isServer = Boolean(serverPagination);

  const searchQuery = isServer ? controlledSearchQuery : localSearchQuery;
  const categoryFilter = isServer ? controlledCategoryFilter : localCategoryFilter;
  const currentPage = isServer ? controlledPage : localPage;
  const rowsPerPage = isServer ? controlledRowsPerPage : localRowsPerPage;

  const handleSearchChange = (val) => {
    if (isServer) {
      if (onSearchQueryChange) onSearchQueryChange(val);
    } else {
      setLocalSearchQuery(val);
      setLocalPage(1);
    }
  };

  const handleCategorySelect = (val) => {
    if (isServer) {
      if (onCategoryFilterChange) onCategoryFilterChange(val);
    } else {
      setLocalCategoryFilter(val);
      setLocalPage(1);
    }
  };

  const handlePageChange = (newPage) => {
    if (isServer) {
      if (onPageChange) onPageChange(newPage);
    } else {
      setLocalPage(newPage);
    }
  };

  const handleRowsPerPageChange = (newLimit) => {
    if (isServer) {
      if (onRowsPerPageChange) onRowsPerPageChange(newLimit);
    } else {
      setLocalRowsPerPage(newLimit);
      setLocalPage(1);
    }
  };

  // Filter requests (only needed if NOT server-side pagination)
  const filteredRequests = useMemo(() => {
    if (isServer) return requests;
    return requests.filter((req) => {
      // Category filter
      if (categoryFilter !== 'ALL') {
        const cat = getCategoryDisplay(req).key;
        if (categoryFilter === 'video' && cat !== 'video') return false;
        if (categoryFilter === 'image' && cat !== 'image') return false;
        if (categoryFilter === 'drive' && cat !== 'drive') return false;
        if (categoryFilter === 'event' && cat !== 'event') return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const memberName = (req.user?.name || currentUser?.name || '').toLowerCase();
        const memberRole = (req.user?.role || currentUser?.role || '').toLowerCase();
        const title = (req.title || '').toLowerCase();
        const description = (req.description || '').toLowerCase();
        const category = getCategoryDisplay(req).label.toLowerCase();
        const originalName = req.media?.map((m) => m.originalName || '').join(' ').toLowerCase() || '';

        const matches =
          memberName.includes(q) ||
          memberRole.includes(q) ||
          title.includes(q) ||
          description.includes(q) ||
          category.includes(q) ||
          originalName.includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [requests, categoryFilter, searchQuery, currentUser, isServer]);

  // Pagination calculations
  const totalItems = isServer ? controlledTotalItems : filteredRequests.length;
  const totalPages = isServer ? Math.max(1, controlledTotalPages) : Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const startIdx = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endIdx = Math.min(currentPage * rowsPerPage, totalItems);

  const paginatedRequests = useMemo(() => {
    if (isServer) return requests;
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRequests.slice(start, start + rowsPerPage);
  }, [filteredRequests, requests, currentPage, rowsPerPage, isServer]);

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'video':
        return 'Video';
      case 'image':
        return 'Image';
      case 'drive':
        return 'Drive Link';
      case 'event':
        return 'Event';
      default:
        return 'All Categories';
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  return (
    <Card
      elevation={0}
      sx={{
        width: '100%',
        height: { xs: 'auto', md: '100%' },
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #EBF0F5',
        boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
        overflow: { xs: 'visible', md: 'hidden' }
      }}
    >
      {/* ── Filter & Search Toolbar (All in one row) ── */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 1.5,
          px: { xs: 1.5, sm: 2.5 },
          py: 1.5,
          borderBottom: '1px solid #EEF2F6',
          flexShrink: 0
        }}
      >
        {/* Left: Extra Filters (e.g. Status Chips) + Category Tabs */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            minWidth: 0,
            maxWidth: '100%',
            overflowX: 'auto',
            py: 0.5,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' }
          }}
        >
          {extraFilters}

          <Box sx={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
            <Tabs
              value={['ALL', 'video', 'image', 'drive', 'event'].includes(categoryFilter) ? categoryFilter : 'ALL'}
              onChange={(_, val) => handleCategorySelect(val)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                bgcolor: '#F1F5F9',
                p: '4px',
                borderRadius: '12px',
                minHeight: '38px',
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
                  width: 24,
                  '&.Mui-disabled': { opacity: 0.25 }
                }
              }}
            >
              {[
                { key: 'ALL', label: 'All Categories', icon: <FilterListIcon sx={{ fontSize: 16 }} /> },
                { key: 'video', label: 'Video', icon: <VideoIcon sx={{ fontSize: 16 }} /> },
                { key: 'image', label: 'Image', icon: <ImageIcon sx={{ fontSize: 16 }} /> },
                { key: 'drive', label: 'Drive Link', icon: <DriveIcon sx={{ fontSize: 16 }} /> },
                { key: 'event', label: 'Event', icon: <EventIcon sx={{ fontSize: 16 }} /> }
              ].map((item) => (
                <Tab
                  key={item.key}
                  value={item.key}
                  label={item.label}
                  icon={item.icon}
                  iconPosition="start"
                  sx={{
                    minHeight: '30px',
                    borderRadius: '9px',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    py: 0.4,
                    px: 1.5,
                    textTransform: 'none',
                    color: '#64748B',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    '&.Mui-selected': {
                      bgcolor: '#FFFFFF',
                      color: '#2563EB',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                    }
                  }}
                />
              ))}
            </Tabs>
          </Box>
        </Box>

        {/* Right: Refresh Icon + Search Input (Show refresh icon just left to search field) */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            width: { xs: '100%', md: 'auto' },
            flexShrink: 0,
            minWidth: 0
          }}
        >
          {onRefresh && (
            <Tooltip title="Refresh requests">
              <IconButton
                onClick={onRefresh}
                size="small"
                disabled={loading}
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '10px',
                  bgcolor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  color: '#64748B',
                  flexShrink: 0,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: '#F8FAFC',
                    borderColor: '#CBD5E1',
                    color: '#2563EB'
                  }
                }}
              >
                {loading ? (
                  <CircularProgress size={16} sx={{ color: '#2563EB' }} />
                ) : (
                  <RefreshIcon sx={{ fontSize: 19 }} />
                )}
              </IconButton>
            </Tooltip>
          )}

          <Box sx={{ flex: 1, minWidth: 0, width: { xs: '100%', sm: 260, md: 320 } }}>
            <TextField
              fullWidth
              size="small"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by member, file name..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 19, color: '#94A3B8', ml: 0.5 }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => handleSearchChange('')}
                      sx={{ p: 0.5, color: '#94A3B8' }}
                    >
                      <ClearIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
                sx: {
                  borderRadius: '24px',
                  bgcolor: '#FFFFFF',
                  fontSize: '13.5px',
                  pl: 1,
                  pr: 1.5,
                  border: '1px solid #E2E8F0',
                  '& fieldset': { border: 'none' },
                  '&:hover': { border: '1px solid #CBD5E1' },
                  '&.Mui-focused': { border: '1px solid #2563EB', boxShadow: '0 0 0 3px rgba(37,99,235,0.1)' }
                }
              }}
            />
          </Box>
        </Stack>
      </Box>

      {/* ── Content: Mobile Cards Feed (< md) OR Desktop Table (>= md) ── */}
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
            <Box sx={{ py: 8, textAlign: 'center', bgcolor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <CircularProgress size={32} sx={{ color: '#2563EB', mb: 1.5 }} />
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
                Loading...
              </Typography>
            </Box>
          ) : paginatedRequests.length === 0 ? (
            <Box sx={{ py: 8, px: 2, textAlign: 'center', bgcolor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  bgcolor: '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1.5,
                  color: '#94A3B8'
                }}
              >
                <SearchIcon sx={{ fontSize: 26 }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#334155' }}>
                No requests found
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, maxWidth: 360, mx: 'auto' }}>
                {searchQuery && `No upload requests match "${searchQuery}". Try clearing search or filters.`}
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {paginatedRequests.map((req, index) => {
                const rowNumber = (currentPage - 1) * rowsPerPage + index + 1;
                const member = req.user || currentUser;
                const memberName = member?.name || 'Student Member';
                const memberRole = member?.role
                  ? member.role.charAt(0) + member.role.slice(1).toLowerCase()
                  : 'Student';
                const avatarUrl =
                  member?.profilePhoto ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(memberName)}&background=0088ff&color=fff`;

                const preview = getMediaPreview(req);
                const category = getCategoryDisplay(req);
                const { date, time } = formatSubmissionDateTime(req.createdAt);

                return (
                  <Card
                    key={req._id || index}
                    elevation={0}
                    sx={{
                      borderRadius: '16px',
                      border: '1px solid #E2E8F0',
                      bgcolor: '#FFFFFF',
                      boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.05)',
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5
                    }}
                  >
                    {/* Header: Member Avatar + Name + Role + Status Chip */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: 1 }}>
                        <Avatar
                          src={avatarUrl}
                          alt={memberName}
                          sx={{ width: 38, height: 38, border: '1px solid #EEF2F6', flexShrink: 0 }}
                        />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', lineHeight: 1.25 }} noWrap>
                            {memberName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.25 }} noWrap>
                            #{rowNumber} • {memberRole}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Status Badge */}
                      <Box sx={{ flexShrink: 0 }}>
                        {req.status === 'PENDING' && (
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              px: 1.25,
                              py: 0.4,
                              borderRadius: '20px',
                              bgcolor: '#FFFBEB',
                              color: '#D97706',
                              border: '1px solid #FDE68A',
                              fontSize: '11.5px',
                              fontWeight: 700
                            }}
                          >
                            <HourglassIcon sx={{ fontSize: 13, color: '#D97706' }} />
                            <span>Pending</span>
                          </Box>
                        )}
                        {req.status === 'APPROVED' && (
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              px: 1.25,
                              py: 0.4,
                              borderRadius: '20px',
                              bgcolor: '#ECFDF5',
                              color: '#059669',
                              border: '1px solid #A7F3D0',
                              fontSize: '11.5px',
                              fontWeight: 700
                            }}
                          >
                            <CheckCircleIcon sx={{ fontSize: 13, color: '#059669' }} />
                            <span>Approved</span>
                          </Box>
                        )}
                        {req.status === 'REJECTED' && (
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              px: 1.25,
                              py: 0.4,
                              borderRadius: '20px',
                              bgcolor: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              fontSize: '11.5px',
                              fontWeight: 700
                            }}
                          >
                            <CancelIcon sx={{ fontSize: 13, color: '#DC2626' }} />
                            <span>Rejected</span>
                          </Box>
                        )}
                      </Box>
                    </Box>

                    {/* Middle Section: Thumbnail + Info */}
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', bgcolor: '#F8FAFC', p: 1.25, borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                      {preview.url && req.status !== 'REJECTED' ? (
                        <Box
                          onClick={() => onViewDetails && onViewDetails(req)}
                          sx={{
                            position: 'relative',
                            width: 80,
                            height: 56,
                            borderRadius: '8px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            bgcolor: '#F1F5F9',
                            border: '1px solid #E2E8F0',
                            flexShrink: 0
                          }}
                        >
                          <Box
                            component="img"
                            src={preview.url}
                            alt="Thumbnail"
                            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                          {preview.isVideo && (
                            <Box
                              sx={{
                                position: 'absolute',
                                inset: 0,
                                bgcolor: 'rgba(0, 0, 0, 0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <PlayArrowIcon sx={{ fontSize: 18, color: '#FFFFFF' }} />
                            </Box>
                          )}
                          {preview.totalCount > 1 && (
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 2,
                                right: 2,
                                bgcolor: 'rgba(15, 23, 42, 0.75)',
                                color: '#FFFFFF',
                                fontSize: '10px',
                                fontWeight: 700,
                                borderRadius: '4px',
                                px: 0.5,
                                py: 0.1
                              }}
                            >
                              +{preview.totalCount}
                            </Box>
                          )}
                        </Box>
                      ) : (
                        <Box
                          onClick={() => onViewDetails && onViewDetails(req)}
                          sx={{
                            width: 80,
                            height: 56,
                            borderRadius: '8px',
                            bgcolor: req.status === 'REJECTED' ? '#FEF2F2' : '#F8FAFC',
                            border: req.status === 'REJECTED' ? '1px dashed #FECACA' : '1px dashed #CBD5E1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          <Typography sx={{ fontSize: '10.5px', fontWeight: 700, color: req.status === 'REJECTED' ? '#DC2626' : '#94A3B8' }}>
                            {req.status === 'REJECTED' ? 'Deleted' : 'No Media'}
                          </Typography>
                        </Box>
                      )}

                      {/* Details */}
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5, flexWrap: 'wrap' }}>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              px: 1,
                              py: 0.25,
                              borderRadius: '16px',
                              bgcolor: category.bg,
                              color: category.color,
                              border: `1px solid ${category.border}`,
                              fontSize: '11px',
                              fontWeight: 700
                            }}
                          >
                            {category.icon}
                            <span>{category.label}</span>
                          </Box>
                        </Box>

                        {req.title && (
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '13px', lineHeight: 1.25 }} noWrap>
                            {req.title}
                          </Typography>
                        )}

                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.25, fontSize: '11px' }}>
                          📅 {date} at {time}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Action Buttons Row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, pt: 1, borderTop: '1px solid #F1F5F9' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ViewIcon sx={{ fontSize: 16 }} />}
                        onClick={() => onViewDetails && onViewDetails(req)}
                        sx={{
                          borderRadius: '8px',
                          px: 1.5,
                          py: 0.6,
                          fontSize: '12px',
                          fontWeight: 700,
                          textTransform: 'none',
                          color: '#334155',
                          borderColor: '#CBD5E1',
                          bgcolor: '#FFFFFF',
                          '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' }
                        }}
                      >
                        Details
                      </Button>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
                        {isAdmin ? (
                          req.status === 'PENDING' ? (
                            <>
                              <Button
                                size="small"
                                variant="contained"
                                disabled={reviewingId === req._id}
                                onClick={() => onApprove && onApprove(req)}
                                startIcon={reviewingId === req._id ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <ApproveIcon sx={{ fontSize: 16 }} />}
                                sx={{
                                  bgcolor: '#059669',
                                  borderRadius: '8px',
                                  textTransform: 'none',
                                  fontWeight: 700,
                                  fontSize: '12px',
                                  px: 1.75,
                                  py: 0.6,
                                  boxShadow: 'none',
                                  '&:hover': { bgcolor: '#047857', boxShadow: 'none' }
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                disabled={reviewingId === req._id}
                                onClick={() => onReject && onReject(req)}
                                startIcon={<CloseIcon sx={{ fontSize: 15 }} />}
                                sx={{
                                  borderRadius: '8px',
                                  textTransform: 'none',
                                  fontWeight: 700,
                                  fontSize: '12px',
                                  px: 1.5,
                                  py: 0.6
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          ) : req.status === 'REJECTED' ? (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<RedoIcon sx={{ fontSize: 16 }} />}
                              onClick={() => (onReject ? onReject(req) : onViewDetails && onViewDetails(req))}
                              sx={{
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '12px',
                                color: '#2563EB',
                                borderColor: '#BFDBFE',
                                '&:hover': { bgcolor: '#EFF6FF' }
                              }}
                            >
                              Re-review
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<OpenInNewIcon sx={{ fontSize: 15 }} />}
                              onClick={() => onViewPublished && onViewPublished(req)}
                              sx={{
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '12px',
                                color: '#059669',
                                borderColor: '#A7F3D0',
                                '&:hover': { bgcolor: '#ECFDF5' }
                              }}
                            >
                              View Live
                            </Button>
                          )
                        ) : (
                          req.status === 'PENDING' ? (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<DeleteIcon sx={{ fontSize: 15 }} />}
                              onClick={() => onDelete && onDelete(req)}
                              sx={{
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '12px',
                                px: 1.5,
                                py: 0.6
                              }}
                            >
                              Cancel
                            </Button>
                          ) : req.status === 'APPROVED' ? (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<OpenInNewIcon sx={{ fontSize: 15 }} />}
                              onClick={() => onViewPublished && onViewPublished(req)}
                              sx={{
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '12px',
                                color: '#059669',
                                borderColor: '#A7F3D0',
                                '&:hover': { bgcolor: '#ECFDF5' }
                              }}
                            >
                              View in Gallery
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<FeedbackIcon sx={{ fontSize: 15 }} />}
                              onClick={() => onViewFeedback && onViewFeedback(req)}
                              sx={{
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '12px'
                              }}
                            >
                              Feedback
                            </Button>
                          )
                        )}

                        {isAdmin && onDelete && (
                          <IconButton
                            size="small"
                            onClick={() => onDelete(req)}
                            sx={{
                              color: '#DC2626',
                              bgcolor: '#FEF2F2',
                              borderRadius: '8px',
                              p: 0.75,
                              '&:hover': { bgcolor: '#FEE2E2' }
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  </Card>
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
          <Table stickyHeader sx={{ minWidth: 860 }}>
            {/* Table Header */}
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell
                  sx={{
                    py: 1.75,
                    px: 2.5,
                    fontWeight: 600,
                    fontSize: '13px',
                    color: '#64748B',
                    bgcolor: '#F8FAFC',
                    borderBottom: '1px solid #EEF2F6',
                    width: '50px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  #
                </TableCell>
                <TableCell
                  sx={{
                    py: 1.75,
                    px: 2,
                    fontWeight: 600,
                    fontSize: '13px',
                    color: '#64748B',
                    bgcolor: '#F8FAFC',
                    borderBottom: '1px solid #EEF2F6',
                    minWidth: 160,
                    whiteSpace: 'nowrap'
                  }}
                >
                  Member
                </TableCell>
                <TableCell
                  sx={{
                    py: 1.75,
                    px: 2,
                    fontWeight: 600,
                    fontSize: '13px',
                    color: '#64748B',
                    bgcolor: '#F8FAFC',
                    borderBottom: '1px solid #EEF2F6',
                    minWidth: 140,
                    whiteSpace: 'nowrap'
                  }}
                >
                  Media Preview
                </TableCell>
                <TableCell
                  sx={{
                    py: 1.75,
                    px: 2,
                    fontWeight: 600,
                    fontSize: '13px',
                    color: '#64748B',
                    bgcolor: '#F8FAFC',
                    borderBottom: '1px solid #EEF2F6',
                    minWidth: 120,
                    whiteSpace: 'nowrap'
                  }}
                >
                  Category
                </TableCell>
                <TableCell
                  sx={{
                    py: 1.75,
                    px: 2,
                    fontWeight: 600,
                    fontSize: '13px',
                    color: '#64748B',
                    bgcolor: '#F8FAFC',
                    borderBottom: '1px solid #EEF2F6',
                    minWidth: 130,
                    whiteSpace: 'nowrap'
                  }}
                >
                  Submitted On
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    py: 1.75,
                    px: 2,
                    fontWeight: 600,
                    fontSize: '13px',
                    color: '#64748B',
                    bgcolor: '#F8FAFC',
                    borderBottom: '1px solid #EEF2F6',
                    minWidth: 120,
                    whiteSpace: 'nowrap'
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    py: 1.75,
                    px: 2.5,
                    fontWeight: 600,
                    fontSize: '13px',
                    color: '#64748B',
                    bgcolor: '#F8FAFC',
                    borderBottom: '1px solid #EEF2F6',
                    width: '165px',
                    minWidth: '165px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            {/* Table Body */}
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center', borderBottom: 'none' }}>
                    <CircularProgress size={32} sx={{ color: '#2563EB', mb: 1.5 }} />
                    <Typography variant="body2" sx={{ color: '#64748B' }}>
                      Loading...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 8, textAlign: 'center', borderBottom: 'none' }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        bgcolor: '#F1F5F9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 1.5,
                        color: '#94A3B8'
                      }}
                    >
                      <SearchIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#334155' }}>
                      No requests found
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, maxWidth: 360, mx: 'auto' }}>
                      {searchQuery && `No upload requests match "${searchQuery}". Try clearing search or changing filters.`} 
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRequests.map((req, index) => {
                  const rowNumber = (currentPage - 1) * rowsPerPage + index + 1;
                  const member = req.user || currentUser;
                  const memberName = member?.name || 'Student Member';
                  const memberRole = member?.role
                    ? member.role.charAt(0) + member.role.slice(1).toLowerCase()
                    : 'Student';
                  const avatarUrl =
                    member?.profilePhoto ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      memberName
                    )}&background=0088ff&color=fff`;

                  const preview = getMediaPreview(req);
                  const category = getCategoryDisplay(req);
                  const { date, time } = formatSubmissionDateTime(req.createdAt);

                  return (
                    <TableRow
                      key={req._id || index}
                      sx={{
                        transition: 'background-color 0.15s ease',
                        '&:hover': { bgcolor: '#FBFDFF' },
                        '&:last-child td': { borderBottom: 'none' }
                      }}
                    >
                      {/* 1. Row Number */}
                      <TableCell
                        sx={{
                          py: 2,
                          px: 2.5,
                          fontSize: '13.5px',
                          fontWeight: 600,
                          color: '#0F172A',
                          borderBottom: '1px solid #F1F5F9'
                        }}
                      >
                        {rowNumber}
                      </TableCell>

                      {/* 2. Member */}
                      <TableCell sx={{ py: 2, px: 2, borderBottom: '1px solid #F1F5F9' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            component="img"
                            src={avatarUrl}
                            alt={memberName}
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                memberName
                              )}&background=0088ff&color=fff`;
                            }}
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1px solid #EEF2F6',
                              flexShrink: 0
                            }}
                          />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              noWrap
                              sx={{
                                fontSize: '13.5px',
                                fontWeight: 700,
                                color: '#0F172A',
                                lineHeight: 1.25
                              }}
                            >
                              {memberName}
                            </Typography>
                            <Typography
                              noWrap
                              sx={{
                                fontSize: '12px',
                                color: '#64748B',
                                mt: 0.25
                              }}
                            >
                              {memberRole}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* 3. Media Preview */}
                      <TableCell sx={{ py: 2, px: 2, borderBottom: '1px solid #F1F5F9' }}>
                        {preview.url && req.status !== 'REJECTED' ? (
                          <Box
                            onClick={() => onViewDetails && onViewDetails(req)}
                            sx={{
                              position: 'relative',
                              width: 84,
                              height: 48,
                              borderRadius: '8px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              bgcolor: '#F1F5F9',
                              border: '1px solid #E2E8F0',
                              flexShrink: 0,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                              '&:hover': {
                                transform: 'scale(1.03)',
                                boxShadow: '0 3px 8px rgba(0,0,0,0.08)'
                              }
                            }}
                          >
                            <Box
                              component="img"
                              src={preview.url}
                              alt="Thumbnail"
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block'
                              }}
                            />

                            {/* Video Play Overlay */}
                            {preview.isVideo && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  inset: 0,
                                  bgcolor: 'rgba(0, 0, 0, 0.35)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
                                  }}
                                >
                                  <PlayArrowIcon sx={{ fontSize: 15, color: '#0F172A', ml: 0.2 }} />
                                </Box>
                              </Box>
                            )}
                          </Box>
                        ) : (
                          <Box
                            onClick={() => onViewDetails && onViewDetails(req)}
                            sx={{
                              width: 84,
                              height: 48,
                              borderRadius: '8px',
                              bgcolor: req.status === 'REJECTED' ? '#FEF2F2' : '#F8FAFC',
                              border: req.status === 'REJECTED' ? '1px dashed #FECACA' : '1px dashed #CBD5E1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              flexShrink: 0,
                              transition: 'all 0.15s ease',
                              '&:hover': {
                                bgcolor: req.status === 'REJECTED' ? '#FEE2E2' : '#F1F5F9'
                              }
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: req.status === 'REJECTED' ? '#DC2626' : '#94A3B8',
                                letterSpacing: 0.3
                              }}
                            >
                              {req.status === 'REJECTED' ? 'Deleted' : 'No Media'}
                            </Typography>
                          </Box>
                        )}
                      </TableCell>

                      {/* 4. Category */}
                      <TableCell sx={{ py: 2, px: 2, borderBottom: '1px solid #F1F5F9' }}>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.75,
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '20px',
                            bgcolor: category.bg,
                            color: category.color,
                            border: `1px solid ${category.border}`,
                            fontSize: '12px',
                            fontWeight: 600,
                            lineHeight: 1
                          }}
                        >
                          {category.icon}
                          <span>{category.label}</span>
                        </Box>
                      </TableCell>

                      {/* 5. Submitted On */}
                      <TableCell sx={{ py: 2, px: 2, borderBottom: '1px solid #F1F5F9' }}>
                        <Typography
                          sx={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#475467',
                            lineHeight: 1.3
                          }}
                        >
                          {date}
                        </Typography>
                      </TableCell>

                      {/* 6. Status */}
                      <TableCell sx={{ py: 2, px: 2, borderBottom: '1px solid #F1F5F9' }}>
                        {req.status === 'PENDING' && (
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.6,
                              px: 1.6,
                              py: 0.55,
                              borderRadius: '20px',
                              bgcolor: '#FFFBEB',
                              color: '#D97706',
                              border: '1px solid #FDE68A',
                              fontSize: '12.5px',
                              fontWeight: 600,
                              lineHeight: 1
                            }}
                          >
                            <HourglassIcon sx={{ fontSize: 14, color: '#D97706' }} />
                            <span>Pending</span>
                          </Box>
                        )}

                        {req.status === 'APPROVED' && (
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.6,
                              px: 1.6,
                              py: 0.55,
                              borderRadius: '20px',
                              bgcolor: '#ECFDF5',
                              color: '#059669',
                              border: '1px solid #A7F3D0',
                              fontSize: '12.5px',
                              fontWeight: 600,
                              lineHeight: 1
                            }}
                          >
                            <CheckCircleIcon sx={{ fontSize: 14, color: '#059669' }} />
                            <span>Approved</span>
                          </Box>
                        )}

                        {req.status === 'REJECTED' && (
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.6,
                              px: 1.6,
                              py: 0.55,
                              borderRadius: '20px',
                              bgcolor: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              fontSize: '12.5px',
                              fontWeight: 600,
                              lineHeight: 1
                            }}
                          >
                            <CancelIcon sx={{ fontSize: 14, color: '#DC2626' }} />
                            <span>Rejected</span>
                          </Box>
                        )}
                      </TableCell>

                      {/* 7. Actions (Clean rounded square buttons matching reference) */}
                      <TableCell align="center" sx={{ py: 2, px: 1.5, borderBottom: '1px solid #F1F5F9', width: '165px', minWidth: '165px' }}>
                        <Stack direction="row" spacing={0.75} justifyContent="center" alignItems="center" flexWrap="nowrap">
                          {/* Action 1: Eye icon (View details & preview modal) */}
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => onViewDetails && onViewDetails(req)}
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: '8px',
                                border: '1px solid #E2E8F0',
                                bgcolor: '#FFFFFF',
                                color: '#64748B',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                  bgcolor: '#F8FAFC',
                                  borderColor: '#CBD5E1',
                                  color: '#0F172A'
                                }
                              }}
                            >
                              <ViewIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>

                          {/* Action 2: Dynamic based on role & status */}
                          {isAdmin ? (
                            // ADMIN ACTIONS
                            req.status === 'PENDING' ? (
                              <>
                                <Tooltip title="Approve & Publish">
                                  <IconButton
                                    size="small"
                                    onClick={() => onApprove && onApprove(req)}
                                    disabled={reviewingId === req._id}
                                    sx={{
                                      width: 34,
                                      height: 34,
                                      borderRadius: '8px',
                                      border: '1px solid #E2E8F0',
                                      bgcolor: '#FFFFFF',
                                      color: '#059669',
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                      transition: 'all 0.15s ease',
                                      '&:hover': {
                                        bgcolor: '#ECFDF5',
                                        borderColor: '#A7F3D0',
                                        color: '#047857'
                                      }
                                    }}
                                  >
                                    {reviewingId === req._id ? (
                                      <CircularProgress size={14} sx={{ color: '#059669' }} />
                                    ) : (
                                      <ApproveIcon sx={{ fontSize: 17 }} />
                                    )}
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Reject Submission">
                                  <IconButton
                                    size="small"
                                    onClick={() => onReject && onReject(req)}
                                    disabled={reviewingId === req._id}
                                    sx={{
                                      width: 34,
                                      height: 34,
                                      borderRadius: '8px',
                                      border: '1px solid #E2E8F0',
                                      bgcolor: '#FFFFFF',
                                      color: '#DC2626',
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                      transition: 'all 0.15s ease',
                                      '&:hover': {
                                        bgcolor: '#FEF2F2',
                                        borderColor: '#FECACA',
                                        color: '#B91C1C'
                                      }
                                    }}
                                  >
                                    {reviewingId === req._id ? (
                                      <CircularProgress size={14} sx={{ color: '#DC2626' }} />
                                    ) : (
                                      <CloseIcon sx={{ fontSize: 17 }} />
                                    )}
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : req.status === 'REJECTED' ? (
                              <Tooltip title="Re-review / Re-approve">
                                <IconButton
                                  size="small"
                                  onClick={() => (onReject ? onReject(req) : onViewDetails && onViewDetails(req))}
                                  sx={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: '8px',
                                    border: '1px solid #E2E8F0',
                                    bgcolor: '#FFFFFF',
                                    color: '#64748B',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                    transition: 'all 0.15s ease',
                                    '&:hover': {
                                      bgcolor: '#F8FAFC',
                                      borderColor: '#CBD5E1',
                                      color: '#2563EB'
                                    }
                                  }}
                                >
                                  <RedoIcon sx={{ fontSize: 17 }} />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              // Approved
                              <Tooltip title="View Published Destination">
                                <IconButton
                                  size="small"
                                  onClick={() => onViewPublished && onViewPublished(req)}
                                  sx={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: '8px',
                                    border: '1px solid #E2E8F0',
                                    bgcolor: '#FFFFFF',
                                    color: '#64748B',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                    transition: 'all 0.15s ease',
                                    '&:hover': {
                                      bgcolor: '#F8FAFC',
                                      borderColor: '#CBD5E1',
                                      color: '#059669'
                                    }
                                  }}
                                >
                                  <OpenInNewIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )
                          ) : (
                            // USER / PERSONAL REQUEST ACTIONS
                            req.status === 'PENDING' ? (
                              <Tooltip title="Cancel Request">
                                <IconButton
                                  size="small"
                                  onClick={() => onDelete && onDelete(req)}
                                  sx={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: '8px',
                                    border: '1px solid #E2E8F0',
                                    bgcolor: '#FFFFFF',
                                    color: '#DC2626',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                    transition: 'all 0.15s ease',
                                    '&:hover': {
                                      bgcolor: '#FEF2F2',
                                      borderColor: '#FECACA'
                                    }
                                  }}
                                >
                                  <DeleteIcon sx={{ fontSize: 17 }} />
                                </IconButton>
                              </Tooltip>
                            ) : req.status === 'APPROVED' ? (
                              <Tooltip title="View in Gallery / Live">
                                <IconButton
                                  size="small"
                                  onClick={() => onViewPublished && onViewPublished(req)}
                                  sx={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: '8px',
                                    border: '1px solid #E2E8F0',
                                    bgcolor: '#FFFFFF',
                                    color: '#059669',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                    transition: 'all 0.15s ease',
                                    '&:hover': {
                                      bgcolor: '#ECFDF5',
                                      borderColor: '#A7F3D0'
                                    }
                                  }}
                                >
                                  <OpenInNewIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              // Rejected
                              <Tooltip title="View Admin Feedback">
                                <IconButton
                                  size="small"
                                  onClick={() => onViewFeedback && onViewFeedback(req)}
                                  sx={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: '8px',
                                    border: '1px solid #E2E8F0',
                                    bgcolor: '#FFFFFF',
                                    color: '#DC2626',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                    transition: 'all 0.15s ease',
                                    '&:hover': {
                                      bgcolor: '#FEF2F2',
                                      borderColor: '#FECACA'
                                    }
                                  }}
                                >
                                  <FeedbackIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            )
                          )}

                          {/* Extra Admin Action: Delete full request from DB */}
                          {isAdmin && onDelete && (
                            <Tooltip title="Delete Request from Database">
                              <IconButton
                                size="small"
                                onClick={() => onDelete(req)}
                                sx={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: '8px',
                                  border: '1px solid #FEE2E2',
                                  bgcolor: '#FFFFFF',
                                  color: '#DC2626',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                  transition: 'all 0.15s ease',
                                  '&:hover': {
                                    bgcolor: '#FEF2F2',
                                    borderColor: '#FECACA',
                                    color: '#B91C1C'
                                  }
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Table Footer & Pagination (Pinned at bottom of card) ── */}
      <Box
        sx={{
          flexShrink: 0,
          borderTop: '1px solid #EEF2F6',
          px: { xs: 1.5, sm: 2.5 },
          py: 1.25,
          bgcolor: '#FFFFFF',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5
        }}
      >
        {/* Left: Summary Count */}
        <Box sx={{ width: { xs: '100%', sm: 'auto' }, textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography sx={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500 }}>
            {totalItems > 0 ? (
              <>
                Showing <strong style={{ color: '#0F172A' }}>{(currentPage - 1) * rowsPerPage + 1}</strong> to{' '}
                <strong style={{ color: '#0F172A' }}>{Math.min(currentPage * rowsPerPage, totalItems)}</strong> of{' '}
                <strong style={{ color: '#0F172A' }}>{totalItems}</strong> requests
              </>
            ) : (
              '0 requests'
            )}
          </Typography>
        </Box>

        {/* Right: Rows per page selector + Pagination Controls */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
          {/* Rows per page selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500, whiteSpace: 'nowrap' }}>
              Rows:
            </Typography>
            <Select
              size="small"
              value={rowsPerPage}
              onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
              sx={{
                height: 32,
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#334155',
                borderRadius: '8px',
                bgcolor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                '& fieldset': { border: 'none' },
                '& .MuiSelect-select': { py: 0.5, px: 1.25 }
              }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </Box>

          {/* Pagination Navigation: compact on mobile, numbers on desktop */}
          <Stack direction="row" spacing={0.5} alignItems="center">
            {/* Previous < */}
            <IconButton
              size="small"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                color: currentPage <= 1 ? '#CBD5E1' : '#64748B',
                '&:hover:not(:disabled)': {
                  bgcolor: '#F8FAFC',
                  borderColor: '#CBD5E1',
                  color: '#0F172A'
                }
              }}
            >
              <ChevronLeftIcon sx={{ fontSize: 18 }} />
            </IconButton>

            {isMobile ? (
              <Typography sx={{ px: 1, color: '#334155', fontSize: '12.5px', fontWeight: 700 }}>
                {currentPage} / {totalPages || 1}
              </Typography>
            ) : (
              getPageNumbers().map((pNum, idx) => {
                if (pNum === '...') {
                  return (
                    <Typography key={`ellipsis-${idx}`} sx={{ px: 0.5, color: '#94A3B8', fontSize: '12.5px' }}>
                      ...
                    </Typography>
                  );
                }
                const isActive = pNum === currentPage;
                return (
                  <Box
                    key={pNum}
                    onClick={() => handlePageChange(pNum)}
                    sx={{
                      minWidth: 32,
                      height: 32,
                      px: 0.75,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12.5px',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      bgcolor: isActive ? '#2563EB' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#64748B',
                      border: isActive ? '1px solid #2563EB' : '1px solid #E2E8F0',
                      transition: 'all 0.15s ease',
                      boxShadow: isActive ? '0 2px 6px rgba(37,99,235,0.25)' : 'none',
                      '&:hover': {
                        bgcolor: isActive ? '#1D4ED8' : '#F8FAFC',
                        color: isActive ? '#FFFFFF' : '#0F172A',
                        borderColor: isActive ? '#1D4ED8' : '#CBD5E1'
                      }
                    }}
                  >
                    {pNum}
                  </Box>
                );
              })
            )}

            {/* Next > */}
            <IconButton
              size="small"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                bgcolor: '#FFFFFF',
                color: currentPage >= totalPages ? '#CBD5E1' : '#64748B',
                '&:hover:not(:disabled)': {
                  bgcolor: '#F8FAFC',
                  borderColor: '#CBD5E1',
                  color: '#0F172A'
                }
              }}
            >
              <ChevronRightIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        </Stack>
      </Box>
    </Card>
  );
}
