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
  Divider,
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
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  RateReview as FeedbackIcon,
  Send as SendIcon,
  Edit as EditIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as PendingIcon,
  Reply as ReplyIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Security as AdminBadgeIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';

export default function Feedback() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const isAdminOrWarden = user?.role === 'ADMIN' || user?.role === 'WARDEN' || user?.role === 'CHAIRPERSON';

  // Feedbacks state
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // New feedback submission modal state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // User Edit Modal state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Delete Modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Admin Reply Modal state
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyingItem, setReplyingItem] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySaving, setReplySaving] = useState(false);

  // View Details Modal state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);

  // Filter, Search & Pagination state
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'accepted' | 'replied' | 'liked'
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch feedbacks from API
  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/feedback');
      if (res.data?.success) {
        setFeedbacks(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load feedbacks', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // Submit new feedback
  const handleCreateFeedback = async (e) => {
    if (e) e.preventDefault();
    const trimmed = newContent.trim();
    if (!trimmed) {
      enqueueSnackbar('Please enter your feedback before submitting', { variant: 'warning' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await API.post('/feedback', { content: trimmed });
      if (res.data?.success) {
        enqueueSnackbar('Feedback submitted successfully! Thank you for sharing.', { variant: 'success' });
        setNewContent('');
        setCreateDialogOpen(false);
        setFeedbacks(prev => [res.data.data, ...prev]);
        setPage(0);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to submit feedback', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Open edit dialog
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditContent(item.content);
    setEditDialogOpen(true);
  };

  // Save edited feedback
  const handleSaveEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed) {
      enqueueSnackbar('Feedback cannot be empty', { variant: 'warning' });
      return;
    }

    try {
      setEditSaving(true);
      const res = await API.put(`/feedback/${editingItem._id}`, { content: trimmed });
      if (res.data?.success) {
        enqueueSnackbar('Feedback updated successfully', { variant: 'success' });
        setFeedbacks(prev => prev.map(f => f._id === editingItem._id ? res.data.data : f));
        if (viewingItem && viewingItem._id === editingItem._id) {
          setViewingItem(res.data.data);
        }
        setEditDialogOpen(false);
        setEditingItem(null);
      }
    } catch (err) {
      console.error('Error updating feedback:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to update feedback', { variant: 'error' });
    } finally {
      setEditSaving(false);
    }
  };

  // Open delete dialog
  const handleOpenDelete = (item) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  // Confirm delete feedback
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      setDeleting(true);
      const res = await API.delete(`/feedback/${deletingItem._id}`);
      if (res.data?.success) {
        enqueueSnackbar('Feedback deleted successfully', { variant: 'success' });
        setFeedbacks(prev => prev.filter(f => f._id !== deletingItem._id));
        if (viewingItem && viewingItem._id === deletingItem._id) {
          setViewDialogOpen(false);
          setViewingItem(null);
        }
        setDeleteDialogOpen(false);
        setDeletingItem(null);
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete feedback', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // Admin: Toggle accept status
  const handleToggleStatus = async (item) => {
    if (!isAdminOrWarden) return;
    const newStatus = item.status === 'accepted' ? 'pending' : 'accepted';
    try {
      const res = await API.patch(`/feedback/${item._id}/status`, { status: newStatus });
      if (res.data?.success) {
        enqueueSnackbar(`Marked feedback as ${newStatus}`, { variant: 'success' });
        setFeedbacks(prev => prev.map(f => f._id === item._id ? res.data.data : f));
        if (viewingItem && viewingItem._id === item._id) {
          setViewingItem(res.data.data);
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to update status', { variant: 'error' });
    }
  };

  // Admin: Toggle like
  const handleToggleLike = async (item) => {
    if (!isAdminOrWarden) return;
    try {
      const res = await API.post(`/feedback/${item._id}/like`);
      if (res.data?.success) {
        setFeedbacks(prev => prev.map(f => f._id === item._id ? res.data.data : f));
        if (viewingItem && viewingItem._id === item._id) {
          setViewingItem(res.data.data);
        }
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to like feedback', { variant: 'error' });
    }
  };

  // Admin: Open reply dialog
  const handleOpenReply = (item) => {
    setReplyingItem(item);
    setReplyText(item.adminReply || '');
    setReplyDialogOpen(true);
  };

  // Admin: Save reply
  const handleSaveReply = async () => {
    try {
      setReplySaving(true);
      const res = await API.post(`/feedback/${replyingItem._id}/reply`, { reply: replyText });
      if (res.data?.success) {
        enqueueSnackbar(replyText.trim() ? 'Reply saved successfully' : 'Reply removed', { variant: 'success' });
        setFeedbacks(prev => prev.map(f => f._id === replyingItem._id ? res.data.data : f));
        if (viewingItem && viewingItem._id === replyingItem._id) {
          setViewingItem(res.data.data);
        }
        setReplyDialogOpen(false);
        setReplyingItem(null);
      }
    } catch (err) {
      console.error('Error saving reply:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to save reply', { variant: 'error' });
    } finally {
      setReplySaving(false);
    }
  };

  // View details modal
  const handleOpenView = (item) => {
    setViewingItem(item);
    setViewDialogOpen(true);
  };

  // Filtered feedbacks
  const filteredFeedbacks = useMemo(() => {
    let list = feedbacks;

    if (statusFilter === 'pending') {
      list = list.filter(f => f.status === 'pending');
    } else if (statusFilter === 'accepted') {
      list = list.filter(f => f.status === 'accepted');
    } else if (statusFilter === 'replied') {
      list = list.filter(f => Boolean(f.adminReply && f.adminReply.trim()));
    } else if (statusFilter === 'liked') {
      list = list.filter(f => f.isLiked);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(f =>
        (f.content || '').toLowerCase().includes(q) ||
        (f.user?.name || '').toLowerCase().includes(q) ||
        (f.adminReply || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [feedbacks, statusFilter, searchQuery]);

  // Paginated list
  const paginatedFeedbacks = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredFeedbacks.slice(start, start + rowsPerPage);
  }, [filteredFeedbacks, page, rowsPerPage]);

  // Statistics
  const stats = useMemo(() => {
    const total = feedbacks.length;
    const pending = feedbacks.filter(f => f.status === 'pending').length;
    const accepted = feedbacks.filter(f => f.status === 'accepted').length;
    const replied = feedbacks.filter(f => Boolean(f.adminReply && f.adminReply.trim())).length;
    const liked = feedbacks.filter(f => f.isLiked).length;
    return { total, pending, accepted, replied, liked };
  }, [feedbacks]);

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
      {/* Top Header with Title, Subtitle, and Add Feedback Button at top right */}
      <Box
        sx={{
          mb: 2,
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
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
            <FeedbackIcon sx={{ color: '#0088ff' }} />
            Feedback & Suggestions
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
            Share your thoughts, suggestions, or concerns directly with the Kambi Connect Team.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexShrink: 0, ml: { sm: 'auto' } }}>

          {/* Add Feedback Button at Top Right Corner */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setNewContent('');
              setCreateDialogOpen(true);
            }}
            sx={{
              borderRadius: '10px',
              px: 2.5,
              py: 1,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '13.5px',
              bgcolor: '#0088ff',
              boxShadow: '0 2px 8px rgba(0, 136, 255, 0.25)',
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: '#0077ee', boxShadow: 'none' }
            }}
          >
            Add Feedback
          </Button>
        </Stack>
      </Box>

      {/* ── Table Component View (Full viewport height & scrollable rows) ── */}
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
        {/* Table Top Toolbar: Filters, Search & Refresh Button */}
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
          {/* Left: Filter Chips */}
          <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: { xs: 0.5, md: 0 }, alignItems: 'center' }}>
            <Chip
              label={`All (${stats.total})`}
              onClick={() => { setStatusFilter('all'); setPage(0); }}
              color={statusFilter === 'all' ? 'primary' : 'default'}
              variant={statusFilter === 'all' ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}
            />
            <Chip
              icon={<PendingIcon sx={{ fontSize: 14 }} />}
              label={`Pending (${stats.pending})`}
              onClick={() => { setStatusFilter('pending'); setPage(0); }}
              color={statusFilter === 'pending' ? 'warning' : 'default'}
              variant={statusFilter === 'pending' ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}
            />
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
              label={`Accepted (${stats.accepted})`}
              onClick={() => { setStatusFilter('accepted'); setPage(0); }}
              color={statusFilter === 'accepted' ? 'success' : 'default'}
              variant={statusFilter === 'accepted' ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}
            />
            <Chip
              icon={<ReplyIcon sx={{ fontSize: 14, transform: 'scaleX(-1)' }} />}
              label={`Replied (${stats.replied})`}
              onClick={() => { setStatusFilter('replied'); setPage(0); }}
              color={statusFilter === 'replied' ? 'info' : 'default'}
              variant={statusFilter === 'replied' ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}
            />
            <Chip
              icon={<FavoriteIcon sx={{ fontSize: 14, color: statusFilter === 'liked' ? '#fff' : '#EF4444' }} />}
              label={`Liked (${stats.liked})`}
              onClick={() => { setStatusFilter('liked'); setPage(0); }}
              color={statusFilter === 'liked' ? 'error' : 'default'}
              variant={statusFilter === 'liked' ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}
            />
          </Stack>

          {/* Right: Search Input & Refresh Button */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: { xs: '100%', md: 320 } }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search feedback or submitter..."
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

            {/* Refresh Button in table header toolbar */}
            <Tooltip title="Refresh feedbacks">
              <IconButton
                onClick={fetchFeedbacks}
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

        {/* Table Content (Rows scrollable inside with sticky header) */}
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
          <Table stickyHeader sx={{ minWidth: 850 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ py: 1.75, px: 2, fontWeight: 700, fontSize: '13px', color: '#64748B', bgcolor: '#F8FAFC', width: 50, borderBottom: '1px solid #EEF2F6', zIndex: 2 }}>
                  #
                </TableCell>
                <TableCell sx={{ py: 1.75, px: 2, fontWeight: 700, fontSize: '13px', color: '#64748B', bgcolor: '#F8FAFC', minWidth: 160, borderBottom: '1px solid #EEF2F6', zIndex: 2 }}>
                  Member
                </TableCell>
                <TableCell sx={{ py: 1.75, px: 2, fontWeight: 700, fontSize: '13px', color: '#64748B', bgcolor: '#F8FAFC', minWidth: 260, borderBottom: '1px solid #EEF2F6', zIndex: 2 }}>
                  Feedback
                </TableCell>
                <TableCell sx={{ py: 1.75, px: 2, fontWeight: 700, fontSize: '13px', color: '#64748B', bgcolor: '#F8FAFC', minWidth: 120, borderBottom: '1px solid #EEF2F6', zIndex: 2 }}>
                  Status
                </TableCell>
                <TableCell sx={{ py: 1.75, px: 2, fontWeight: 700, fontSize: '13px', color: '#64748B', bgcolor: '#F8FAFC', minWidth: 160, borderBottom: '1px solid #EEF2F6', zIndex: 2 }}>
                  Admin Reply
                </TableCell>
                <TableCell sx={{ py: 1.75, px: 2, fontWeight: 700, fontSize: '13px', color: '#64748B', bgcolor: '#F8FAFC', minWidth: 80, borderBottom: '1px solid #EEF2F6', textAlign: 'center', zIndex: 2 }}>
                  Liked
                </TableCell>
                <TableCell sx={{ py: 1.75, px: 2, fontWeight: 700, fontSize: '13px', color: '#64748B', bgcolor: '#F8FAFC', minWidth: 140, borderBottom: '1px solid #EEF2F6', zIndex: 2 }}>
                  Submitted On
                </TableCell>
                <TableCell sx={{ py: 1.75, px: 2, fontWeight: 700, fontSize: '13px', color: '#64748B', bgcolor: '#F8FAFC', minWidth: 150, borderBottom: '1px solid #EEF2F6', textAlign: 'right', zIndex: 2 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ py: 8, textAlign: 'center' }}>
                    <CircularProgress size={36} sx={{ color: '#0088ff' }} />
                  </TableCell>
                </TableRow>
              ) : paginatedFeedbacks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ py: 8, textAlign: 'center' }}>
                    <FeedbackIcon sx={{ fontSize: 44, color: '#94A3B8', mb: 1, opacity: 0.6 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                      No feedbacks found
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                      {searchQuery || statusFilter !== 'all'
                        ? 'Try clearing the search query or status filter.'
                        : 'No feedback submissions available.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedFeedbacks.map((item, idx) => {
                  const isOwner = String(item.user?._id || item.user) === String(user?._id || user?.id);
                  const isAccepted = item.status === 'accepted';
                  const rowNumber = page * rowsPerPage + idx + 1;
                  const createdDate = new Date(item.createdAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  });

                  return (
                    <TableRow
                      key={item._id}
                      hover
                      sx={{
                        bgcolor: isAccepted ? 'rgba(240, 253, 244, 0.4)' : '#FFFFFF',
                        transition: 'background-color 0.15s ease',
                        '&:last-child td, &:last-child th': { border: 0 }
                      }}
                    >
                      {/* # Index */}
                      <TableCell sx={{ py: 1.5, px: 2, fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                        {rowNumber}
                      </TableCell>

                      {/* Member Info */}
                      <TableCell sx={{ py: 1.5, px: 2 }}>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Avatar
                            src={item.user?.profilePhoto?.url || ''}
                            sx={{ width: 34, height: 34, bgcolor: '#0088ff', fontSize: '13px', fontWeight: 700 }}
                          >
                            {item.user?.name?.charAt(0) || <PersonIcon sx={{ fontSize: 18 }} />}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                              {item.user?.name || 'User'} {isOwner ? '(You)' : ''}
                            </Typography>
                            {item.user?.role && (
                              <Chip
                                label={item.user.role}
                                size="small"
                                sx={{ height: 18, fontSize: '10px', fontWeight: 700, bgcolor: '#F1F5F9', color: '#475569', mt: 0.25 }}
                              />
                            )}
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Feedback Text Content */}
                      <TableCell sx={{ py: 1.5, px: 2, maxWidth: 320 }}>
                        <Box
                          onClick={() => handleOpenView(item)}
                          sx={{
                            cursor: 'pointer',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            fontSize: '13.5px',
                            color: '#1E293B',
                            lineHeight: 1.4,
                            '&:hover': { color: '#0088ff' }
                          }}
                        >
                          {item.content}
                        </Box>
                        {item.isEdited && (
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontStyle: 'italic', display: 'block', mt: 0.25 }}>
                            (edited)
                          </Typography>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={{ py: 1.5, px: 2 }}>
                        <Chip
                          icon={
                            isAccepted
                              ? <CheckCircleIcon sx={{ fontSize: '14px !important', color: '#059669 !important' }} />
                              : <PendingIcon sx={{ fontSize: '14px !important', color: '#D97706 !important' }} />
                          }
                          label={isAccepted ? 'Accepted' : 'Pending'}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: '11px',
                            fontWeight: 700,
                            bgcolor: isAccepted ? '#D1FAE5' : '#FEF3C7',
                            color: isAccepted ? '#065F46' : '#92400E',
                            border: '1px solid',
                            borderColor: isAccepted ? '#6EE7B7' : '#FCD34D'
                          }}
                        />
                      </TableCell>

                      {/* Admin Reply */}
                      <TableCell sx={{ py: 1.5, px: 2, maxWidth: 220 }}>
                        {item.adminReply ? (
                          <Box
                            onClick={() => handleOpenView(item)}
                            sx={{
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              p: 0.75,
                              bgcolor: '#F0F9FF',
                              border: '1px solid #BAE6FD',
                              borderRadius: '8px',
                              fontSize: '12px',
                              color: '#0284C7',
                              fontWeight: 600,
                              maxWidth: '100%',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            <ReplyIcon sx={{ fontSize: 14, transform: 'scaleX(-1)', flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.adminReply}</span>
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                            —
                          </Typography>
                        )}
                      </TableCell>

                      {/* Liked */}
                      <TableCell sx={{ py: 1.5, px: 2, textAlign: 'center' }}>
                        {isAdminOrWarden ? (
                          <Tooltip title={item.isLiked ? 'Unlike' : 'Like'}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleLike(item)}
                              sx={{
                                color: item.isLiked ? '#EF4444' : '#94A3B8',
                                p: 0.5,
                                '&:hover': { bgcolor: '#FEE2E2', color: '#EF4444' }
                              }}
                            >
                              {item.isLiked ? <FavoriteIcon sx={{ fontSize: 18 }} /> : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
                            </IconButton>
                          </Tooltip>
                        ) : item.isLiked ? (
                          <Tooltip title="Liked by Administration">
                            <FavoriteIcon sx={{ fontSize: 18, color: '#EF4444' }} />
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>—</Typography>
                        )}
                      </TableCell>

                      {/* Submitted Date */}
                      <TableCell sx={{ py: 1.5, px: 2, fontSize: '12.5px', color: '#64748B', whiteSpace: 'nowrap' }}>
                        {createdDate}
                      </TableCell>

                      {/* Actions */}
                      <TableCell sx={{ py: 1.5, px: 2, textAlign: 'right' }}>
                        <Stack direction="row" spacing={0.75} justifyContent="flex-end" alignItems="center">
                          {/* View Details */}
                          <Tooltip title="View details">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenView(item)}
                              sx={{ color: '#64748B', '&:hover': { color: '#0088ff', bgcolor: '#F0F9FF' } }}
                            >
                              <ViewIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>

                          {/* Owner: Edit Feedback */}
                          {isOwner && (
                            <Tooltip title="Edit your feedback">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEdit(item)}
                                sx={{ color: '#0088ff', '&:hover': { bgcolor: 'rgba(0, 136, 255, 0.1)' } }}
                              >
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Admin: Accept / Status */}
                          {isAdminOrWarden && (
                            <Tooltip title={isAccepted ? 'Mark pending' : 'Mark accepted'}>
                              <IconButton
                                size="small"
                                onClick={() => handleToggleStatus(item)}
                                sx={{
                                  color: isAccepted ? '#059669' : '#D97706',
                                  '&:hover': { bgcolor: isAccepted ? '#D1FAE5' : '#FEF3C7' }
                                }}
                              >
                                <CheckCircleIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Admin: Reply */}
                          {isAdminOrWarden && (
                            <Tooltip title={item.adminReply ? 'Edit reply' : 'Reply'}>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenReply(item)}
                                sx={{ color: '#0088ff', '&:hover': { bgcolor: '#F0F9FF' } }}
                              >
                                <ReplyIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Delete: Available for Admin and Owner */}
                          {(isOwner || isAdminOrWarden) && (
                            <Tooltip title={isOwner ? 'Delete your feedback' : 'Delete feedback'}>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDelete(item)}
                                sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEF2F2' } }}
                              >
                                <DeleteIcon sx={{ fontSize: 18 }} />
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

        {/* Table Pagination Footer */}
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
              {filteredFeedbacks.length === 0
                ? '0 of 0'
                : `${page * rowsPerPage + 1}–${Math.min((page + 1) * rowsPerPage, filteredFeedbacks.length)} of ${filteredFeedbacks.length}`}
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
                disabled={(page + 1) * rowsPerPage >= filteredFeedbacks.length}
                sx={{ border: '1px solid #E2E8F0', borderRadius: '8px', p: 0.5 }}
              >
                <ChevronRightIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
      </Paper>

      {/* ADD FEEDBACK MODAL DIALOG */}
      <Dialog
        open={createDialogOpen}
        onClose={() => !submitting && setCreateDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <FeedbackIcon sx={{ color: '#0088ff', fontSize: 22 }} />
            <span>Add Feedback</span>
          </Stack>
          <IconButton
            size="small"
            onClick={() => !submitting && setCreateDialogOpen(false)}
            sx={{ color: '#94A3B8' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
            Share your thoughts, suggestions, appreciation, or concerns directly with the administration.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={5}
            placeholder="Write your feedback, suggestion, appreciation, or concern here..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            disabled={submitting}
            maxLength={3000}
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                fontSize: '14px',
                backgroundColor: '#FAFAFA',
                '&:hover': { backgroundColor: '#FFFFFF' },
                '&.Mui-focused': { backgroundColor: '#FFFFFF', borderColor: '#0088ff' }
              }
            }}
          />
          <Box sx={{ mt: 1, textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: newContent.length > 2800 ? '#EF4444' : '#94A3B8' }}>
              {newContent.length} / 3000 characters
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setCreateDialogOpen(false)}
            disabled={submitting}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#64748B' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateFeedback}
            disabled={submitting || !newContent.trim()}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon sx={{ fontSize: 16 }} />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#0088ff',
              borderRadius: '10px',
              px: 3,
              boxShadow: '0 2px 8px rgba(0, 136, 255, 0.25)',
              '&:hover': { bgcolor: '#0077ee', boxShadow: 'none' }
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW DETAILS DIALOG */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Feedback Details</span>
          <IconButton size="small" onClick={() => setViewDialogOpen(false)}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: '#F1F5F9' }}>
          {viewingItem && (
            <Stack spacing={2.5}>
              {/* Submitter Info Header */}
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  src={viewingItem.user?.profilePhoto?.url || ''}
                  sx={{ width: 44, height: 44, bgcolor: '#0088ff', fontWeight: 700 }}
                >
                  {viewingItem.user?.name?.charAt(0) || <PersonIcon />}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                    {viewingItem.user?.name || 'User'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    {viewingItem.user?.email || viewingItem.user?.phone || 'Community Member'} • Role: {viewingItem.user?.role || 'MEMBER'}
                  </Typography>
                </Box>

                <Chip
                  icon={viewingItem.status === 'accepted' ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : <PendingIcon sx={{ fontSize: 14 }} />}
                  label={viewingItem.status === 'accepted' ? 'Accepted' : 'Pending'}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: viewingItem.status === 'accepted' ? '#D1FAE5' : '#FEF3C7',
                    color: viewingItem.status === 'accepted' ? '#065F46' : '#92400E'
                  }}
                />
              </Stack>

              {/* Feedback Content */}
              <Box sx={{ bgcolor: '#F8FAFC', p: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 0.75 }}>
                  Feedback Content:
                </Typography>
                <Typography variant="body1" sx={{ color: '#1E293B', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {viewingItem.content}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8', mt: 1.5, display: 'block' }}>
                  Submitted on {new Date(viewingItem.createdAt).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
                  {viewingItem.isEdited && ' • (edited)'}
                </Typography>
              </Box>

              {/* Admin Like Status */}
              {viewingItem.isLiked && (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ color: '#B91C1C', bgcolor: '#FEE2E2', p: 1.25, borderRadius: '8px' }}>
                  <FavoriteIcon sx={{ fontSize: 18 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    Liked by Administration {viewingItem.likedAt ? `on ${new Date(viewingItem.likedAt).toLocaleDateString()}` : ''}
                  </Typography>
                </Stack>
              )}

              {/* Admin Reply */}
              {viewingItem.adminReply && (
                <Box sx={{ bgcolor: '#F0F9FF', p: 2, borderRadius: '12px', borderLeft: '4px solid #0088ff' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#0088ff', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
                    <ReplyIcon sx={{ fontSize: 16, transform: 'scaleX(-1)' }} />
                    Official Admin Reply {viewingItem.repliedBy?.name ? `(${viewingItem.repliedBy.name})` : ''}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#1E293B', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {viewingItem.adminReply}
                  </Typography>
                  {viewingItem.repliedAt && (
                    <Typography variant="caption" sx={{ color: '#94A3B8', mt: 1, display: 'block' }}>
                      Replied on {new Date(viewingItem.repliedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </Typography>
                  )}
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          {/* Owner can edit */}
          {viewingItem && String(viewingItem.user?._id || viewingItem.user) === String(user?._id || user?.id) && (
            <Button
              startIcon={<EditIcon />}
              onClick={() => {
                setViewDialogOpen(false);
                handleOpenEdit(viewingItem);
              }}
              sx={{ textTransform: 'none', fontWeight: 600, color: '#0088ff' }}
            >
              Edit Feedback
            </Button>
          )}

          {/* Admin can reply */}
          {isAdminOrWarden && viewingItem && (
            <Button
              startIcon={<ReplyIcon />}
              onClick={() => {
                setViewDialogOpen(false);
                handleOpenReply(viewingItem);
              }}
              sx={{ textTransform: 'none', fontWeight: 600, color: '#0088ff' }}
            >
              {viewingItem.adminReply ? 'Edit Reply' : 'Send Reply'}
            </Button>
          )}

          {/* Delete: Owner and Admin */}
          {viewingItem && (String(viewingItem.user?._id || viewingItem.user) === String(user?._id || user?.id) || isAdminOrWarden) && (
            <Button
              startIcon={<DeleteIcon />}
              onClick={() => handleOpenDelete(viewingItem)}
              color="error"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Delete
            </Button>
          )}

          <Button onClick={() => setViewDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600, color: '#64748B' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* USER EDIT MODAL */}
      <Dialog
        open={editDialogOpen}
        onClose={() => !editSaving && setEditDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', pb: 1 }}>
          Edit Feedback
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
            Update your feedback below.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={5}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            disabled={editSaving}
            maxLength={3000}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                fontSize: '14px'
              }
            }}
          />
          <Box sx={{ mt: 1, textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
              {editContent.length} / 3000 characters
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            disabled={editSaving}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#64748B' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={editSaving || !editContent.trim()}
            startIcon={editSaving ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#0088ff',
              borderRadius: '10px',
              px: 3,
              '&:hover': { bgcolor: '#0077ee' }
            }}
          >
            {editSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ADMIN REPLY MODAL */}
      <Dialog
        open={replyDialogOpen}
        onClose={() => !replySaving && setReplyDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', pb: 1 }}>
          {replyingItem?.adminReply ? 'Edit Admin Reply' : 'Send Admin Reply'}
        </DialogTitle>
        <DialogContent>
          {replyingItem && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#F8FAFC', borderRadius: '10px', borderLeft: '3px solid #CBD5E1' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
                User Feedback from {replyingItem.user?.name || 'User'}:
              </Typography>
              <Typography variant="body2" sx={{ color: '#334155', mt: 0.5, fontStyle: 'italic' }}>
                "{replyingItem.content}"
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Type your official reply to the user..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            disabled={replySaving}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                fontSize: '14px'
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setReplyDialogOpen(false)}
            disabled={replySaving}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#64748B' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveReply}
            disabled={replySaving}
            startIcon={replySaving ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#0088ff',
              borderRadius: '10px',
              px: 3,
              '&:hover': { bgcolor: '#0077ee' }
            }}
          >
            {replySaving ? 'Saving...' : 'Send Reply'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRMATION MODAL */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon sx={{ color: '#EF4444' }} />
          <span>Delete Feedback</span>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Are you sure you want to delete this feedback? This action cannot be undone.
          </Typography>
          {deletingItem && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: '#F8FAFC', borderRadius: '10px', borderLeft: '3px solid #EF4444' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
                From: {deletingItem.user?.name || 'User'}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#334155',
                  mt: 0.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                "{deletingItem.content}"
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#64748B' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon sx={{ fontSize: 18 }} />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '10px',
              px: 2.5
            }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
