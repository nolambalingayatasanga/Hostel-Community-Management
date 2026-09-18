import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CloudQueue as CloudQueueIcon,
  Add as AddIcon,
  Search as SearchIcon,
  OpenInNew as OpenInNewIcon,
  ContentCopy as ContentCopyIcon,
  CalendarMonth as CalendarIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  FolderSpecial as FolderIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionContext';
import API from '../../api';

const CATEGORIES = [
  'General',
  'Annual Day',
  'Sports Meet',
  'Cultural Fest',
  'Freshers Day',
  'Graduation / Farewell',
  'Alumni Gathering',
  'Celebration / Festival'
];

export default function DriveLinks() {
  const { user } = useAuth();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const { enqueueSnackbar } = useSnackbar();

  const isAdmin = user?.role === 'ADMIN';
  const hasFullAccess = isAdmin || canCreate('drive_links');

  // State
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [category, setCategory] = useState('General');

  // Menu State
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [activeItemForMenu, setActiveItemForMenu] = useState(null);

  // Delete Confirm Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Drive Links
  const fetchDriveLinks = async () => {
    try {
      setLoading(true);
      const res = await API.get('/drive-links', {
        params: {
          search: search || undefined,
          year: selectedYear !== 'ALL' ? selectedYear : undefined,
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined
        }
      });
      if (res.data?.success) {
        setLinks(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load drive links:', err);
      enqueueSnackbar('Failed to retrieve drive links', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriveLinks();
  }, [selectedYear, selectedCategory]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDriveLinks();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Extract unique event years from links
  const availableYears = useMemo(() => {
    const yearsSet = new Set();
    links.forEach(l => {
      if (l.eventDate) {
        const y = new Date(l.eventDate).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [links]);

  // Sorted links
  const sortedLinks = useMemo(() => {
    return [...links].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.eventDate) - new Date(a.eventDate);
      }
      if (sortBy === 'oldest') {
        return new Date(a.eventDate) - new Date(b.eventDate);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [links, sortBy]);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingLink(null);
    setTitle('');
    setDescription('');
    setDriveUrl('');
    setEventDate(new Date().toISOString().split('T')[0]);
    setCategory('General');
    setDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (item) => {
    setEditingLink(item);
    setTitle(item.title || '');
    setDescription(item.description || '');
    setDriveUrl(item.driveUrl || '');
    setEventDate(item.eventDate ? new Date(item.eventDate).toISOString().split('T')[0] : '');
    setCategory(item.category || 'General');
    setDialogOpen(true);
    handleMenuClose();
  };

  // Submit Create or Edit
  const handleSave = async (e) => {
    e?.preventDefault();
    if (!title.trim() || !driveUrl.trim() || !eventDate) {
      enqueueSnackbar('Please fill in Title, Google Drive URL, and Date of Event', { variant: 'warning' });
      return;
    }

    try {
      setSaving(true);
      if (editingLink) {
        // Update
        const res = await API.put(`/drive-links/${editingLink._id}`, {
          title: title.trim(),
          description: description.trim(),
          driveUrl: driveUrl.trim(),
          eventDate,
          category
        });
        if (res.data?.success) {
          enqueueSnackbar('Google Drive link updated successfully', { variant: 'success' });
          setDialogOpen(false);
          fetchDriveLinks();
        }
      } else {
        // Create
        const res = await API.post('/drive-links', {
          title: title.trim(),
          description: description.trim(),
          driveUrl: driveUrl.trim(),
          eventDate,
          category
        });
        if (res.data?.success) {
          enqueueSnackbar('Google Drive link added successfully', { variant: 'success' });
          setDialogOpen(false);
          fetchDriveLinks();
        }
      }
    } catch (err) {
      console.error('Error saving drive link:', err);
      const errMsg = err.response?.data?.message || 'Failed to save Google Drive link';
      enqueueSnackbar(errMsg, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      const res = await API.delete(`/drive-links/${itemToDelete._id}`);
      if (res.data?.success) {
        enqueueSnackbar('Drive link deleted successfully', { variant: 'info' });
        setDeleteDialogOpen(false);
        setItemToDelete(null);
        fetchDriveLinks();
      }
    } catch (err) {
      console.error('Error deleting drive link:', err);
      enqueueSnackbar('Failed to delete drive link', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // Copy URL to Clipboard
  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    enqueueSnackbar('Google Drive link copied to clipboard', { variant: 'success' });
  };

  const handleMenuOpen = (event, item) => {
    setMenuAnchorEl(event.currentTarget);
    setActiveItemForMenu(item);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveItemForMenu(null);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header Bar */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(29, 78, 216, 0.25)'
            }}
          >
            <CloudQueueIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Google Drive Event Links
            </Typography>
          
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5}
         justifyContent={'end'}>


          {hasFullAccess && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              sx={{
                borderRadius: '9px',
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: '#0088FF',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(0, 136, 255, 0.3)',
                px: 2.5,
                '&:hover': { bgcolor: '#0070D4' }
              }}
            >
              Add Drive Link
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Filter & Search Toolbar Card */}
      <Card sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: 'none', mb: 3, p: 2, bgcolor: '#FFFFFF' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
          <TextField
            size="small"
            placeholder="Search events by title, description or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94A3B8' }} />
                  </InputAdornment>
                )
              }
            }}
            sx={{ width: { xs: '100%', md: 360 } }}
          />

          {/* Filters */}
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ width: { xs: '100%', md: 'auto' } }}>
            {/* Category Filter */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="ALL">All Categories</MenuItem>
                {CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Year Filter */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Event Year</InputLabel>
              <Select
                value={selectedYear}
                label="Event Year"
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <MenuItem value="ALL">All Years</MenuItem>
                {availableYears.map((y) => (
                  <MenuItem key={y} value={String(y)}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Sort Filter */}
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="newest">Newest Events</MenuItem>
                <MenuItem value="oldest">Oldest Events</MenuItem>
                <MenuItem value="title">Title (A-Z)</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </Card>

      {/* Drive Links Cards Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={36} />
        </Box>
      ) : sortedLinks.length === 0 ? (
        <Card sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', p: 6, textAlign: 'center', bgcolor: '#FFFFFF' }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: '#EFF8FF',
              color: '#0088FF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2
            }}
          >
            <CloudQueueIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
            No Google Drive event links found
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', maxWidth: 440, mx: 'auto', mb: 3 }}>
            {search || selectedCategory !== 'ALL' || selectedYear !== 'ALL'
              ? 'No events match your current filter criteria. Try resetting the filters.'
              : 'Google Drive folders containing high-resolution event media will appear here.'}
          </Typography>
          {hasFullAccess && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              sx={{ bgcolor: '#0088FF', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#0070D4' } }}
            >
              Add First Drive Link
            </Button>
          )}
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {sortedLinks.map((item) => {
            const formattedDate = item.eventDate
              ? new Date(item.eventDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              : 'Date N/A';

            return (
              <Grid key={item._id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease-in-out',
                    bgcolor: '#FFFFFF',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      borderColor: '#CBD5E1',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Header Row: Folder Tag + Menu */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                      <Chip
                        size="small"
                        icon={<FolderIcon sx={{ fontSize: '14px !important', color: '#0088FF !important' }} />}
                        label={item.category || 'Event Media'}
                        sx={{
                          bgcolor: '#EFF8FF',
                          color: '#0088FF',
                          fontWeight: 700,
                          fontSize: 11,
                          border: '1px solid #B2DDFF'
                        }}
                      />

                      {hasFullAccess && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, item)}
                          sx={{ color: '#94A3B8', '&:hover': { color: '#0F172A' } }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>

                    {/* Event Title */}
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 800,
                        color: '#0F172A',
                        fontSize: 17,
                        lineHeight: 1.35,
                        mb: 1
                      }}
                    >
                      {item.title}
                    </Typography>

                    {/* Event Date */}
                    <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 1.5 }}>
                      <CalendarIcon sx={{ fontSize: 16, color: '#64748B' }} />
                      <Typography variant="caption" sx={{ color: '#475467', fontWeight: 600 }}>
                        {formattedDate}
                      </Typography>
                    </Stack>

                    {/* Description */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#64748B',
                        fontSize: 13.5,
                        lineHeight: 1.55,
                        mb: 2,
                        flexGrow: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {item.description || 'No additional description provided for this collection.'}
                    </Typography>

                    <Divider sx={{ my: 1.5, borderColor: '#F1F5F9' }} />

                    {/* Action Buttons */}
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button
                        variant="contained"
                        fullWidth
                        href={item.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                        sx={{
                          bgcolor: '#0088FF',
                          color: '#FFFFFF',
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: 13,
                          borderRadius: '8px',
                          boxShadow: 'none',
                          py: 1,
                          '&:hover': { bgcolor: '#0070D4', boxShadow: 'none' }
                        }}
                      >
                        Open in Google Drive
                      </Button>

                      <Tooltip title="Copy Drive URL">
                        <IconButton
                          size="small"
                          onClick={() => handleCopyUrl(item.driveUrl)}
                          sx={{
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px',
                            color: '#64748B',
                            p: 0.9,
                            '&:hover': { bgcolor: '#F8FAFC', color: '#0088FF' }
                          }}
                        >
                          <ContentCopyIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Admin Options Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            minWidth: 140
          }
        }}
      >
        <MenuItem onClick={() => handleOpenEdit(activeItemForMenu)}>
          <ListItemIcon>
            <EditIcon fontSize="small" sx={{ color: '#0088FF' }} />
          </ListItemIcon>
          <ListItemText primary="Edit Link" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }} />
        </MenuItem>
        <MenuItem
          onClick={() => {
            setItemToDelete(activeItemForMenu);
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}
          sx={{ color: '#EF4444' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: '#EF4444' }} />
          </ListItemIcon>
          <ListItemText primary="Delete" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }} />
        </MenuItem>
      </Menu>

      {/* Add / Edit Drive Link Dialog (Admin only) */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CloudQueueIcon sx={{ color: '#0088FF' }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {editingLink ? 'Edit Google Drive Link' : 'Add Google Drive Event Link'}
            </Typography>
          </Stack>
          <IconButton onClick={() => setDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSave}>
          <DialogContent dividers sx={{ p: 3 }}>
            {/* Event Name / Title */}
            <TextField
              fullWidth
              label="Event Name / Title"
              placeholder="e.g. 75th Annual Sports Meet 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 2.5 }}
              required
            />

            {/* Google Drive URL */}
            <TextField
              fullWidth
              label="Google Drive Link"
              placeholder="https://drive.google.com/drive/folders/..."
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              helperText="Paste the shareable Google Drive folder, album, or file URL"
              sx={{ mb: 2.5 }}
              required
            />

            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              {/* Event Date */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date of Event"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  required
                />
              </Grid>

              {/* Category */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={category}
                    label="Category"
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Description */}
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Event Description"
              placeholder="Brief description of the photos, highlights, or event details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </DialogContent>

          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{
                bgcolor: '#0088FF',
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                '&:hover': { bgcolor: '#0070D4' }
              }}
            >
              {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : editingLink ? 'Update Link' : 'Add Link'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A' }}>
          Delete Google Drive Link?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to remove <strong>"{itemToDelete?.title}"</strong>? This will remove the link from the community directory.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleting}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {deleting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
