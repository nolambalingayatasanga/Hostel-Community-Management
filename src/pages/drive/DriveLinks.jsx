import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
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
  FolderSpecial as FolderIcon,
  Close as CloseIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Image as ImageIcon,
  DeleteOutlined as RemoveImageIcon
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
  const { canCreate } = usePermissions();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef(null);
  const quickThumbnailInputRef = useRef(null);

  const isAdmin = user?.role === 'ADMIN';
  const hasFullAccess = isAdmin || canCreate('drive_links');

  // State
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');

  // Quick Thumbnail Upload Modal State
  const [quickThumbItem, setQuickThumbItem] = useState(null);
  const [quickThumbDialogOpen, setQuickThumbDialogOpen] = useState(false);
  const [quickThumbFile, setQuickThumbFile] = useState(null);
  const [quickThumbUrl, setQuickThumbUrl] = useState('');
  const [quickThumbPreview, setQuickThumbPreview] = useState('');
  const [savingQuickThumb, setSavingQuickThumb] = useState(false);

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
          search: search || undefined
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
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDriveLinks();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingLink(null);
    setTitle('');
    setDescription('');
    setDriveUrl('');
    setEventDate(new Date().toISOString().split('T')[0]);
    setCategory('General');
    setThumbnailUrl('');
    setThumbnailFile(null);
    setThumbnailPreview('');
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
    setThumbnailUrl(item.thumbnail || '');
    setThumbnailFile(null);
    setThumbnailPreview(item.thumbnail || '');
    setDialogOpen(true);
    handleMenuClose();
  };

  // Open Quick Thumbnail Upload
  const handleOpenQuickThumbnail = (item) => {
    setQuickThumbItem(item);
    setQuickThumbUrl(item.thumbnail || '');
    setQuickThumbFile(null);
    setQuickThumbPreview(item.thumbnail || '');
    setQuickThumbDialogOpen(true);
    handleMenuClose();
  };

  // Handle Thumbnail File Selection
  const handleFileChange = (e, isQuick = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      enqueueSnackbar('Please select a valid image file (PNG, JPG, WEBP)', { variant: 'warning' });
      return;
    }

    const preview = URL.createObjectURL(file);
    if (isQuick) {
      setQuickThumbFile(file);
      setQuickThumbPreview(preview);
    } else {
      setThumbnailFile(file);
      setThumbnailPreview(preview);
    }
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
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('driveUrl', driveUrl.trim());
      formData.append('eventDate', eventDate);
      formData.append('category', category);

      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      } else {
        formData.append('thumbnail', thumbnailUrl.trim());
      }

      const headers = { 'Content-Type': 'multipart/form-data' };

      if (editingLink) {
        const res = await API.put(`/drive-links/${editingLink._id}`, formData, { headers });
        if (res.data?.success) {
          enqueueSnackbar('Google Drive link updated successfully', { variant: 'success' });
          setDialogOpen(false);
          fetchDriveLinks();
        }
      } else {
        const res = await API.post('/drive-links', formData, { headers });
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

  // Save Quick Thumbnail
  const handleSaveQuickThumbnail = async () => {
    if (!quickThumbItem) return;

    try {
      setSavingQuickThumb(true);
      const formData = new FormData();
      if (quickThumbFile) {
        formData.append('thumbnail', quickThumbFile);
      } else {
        formData.append('thumbnail', quickThumbUrl.trim());
      }

      const res = await API.put(`/drive-links/${quickThumbItem._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        enqueueSnackbar('Thumbnail updated successfully', { variant: 'success' });
        setQuickThumbDialogOpen(false);
        setQuickThumbItem(null);
        fetchDriveLinks();
      }
    } catch (err) {
      console.error('Error updating thumbnail:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to update thumbnail', { variant: 'error' });
    } finally {
      setSavingQuickThumb(false);
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
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header Bar */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
              flexShrink: 0
            }}
          >
            <CloudQueueIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              Google Drive Event Links
            </Typography>
    
          </Box>
        </Stack>

      </Stack>

      {/* Drive Links Cards Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={36} />
        </Box>
      ) : links.length === 0 ? (
        <Card sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', p: 6, textAlign: 'center', bgcolor: '#FFFFFF' }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: '#EFF8FF',
              color: '#0284C7',
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
            {search
              ? 'No events match your current search query.'
              : 'Google Drive folders containing high-resolution event media will appear here.'}
          </Typography>
          {hasFullAccess && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              sx={{ bgcolor: '#0284C7', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#0369A1' } }}
            >
              Add First Drive Link
            </Button>
          )}
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {links.map((item) => {
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
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    transition: 'all 0.22s ease-in-out',
                    bgcolor: '#FFFFFF',
                    overflow: 'hidden',
                    position: 'relative',
                    '&:hover': {
                      boxShadow: '0 10px 28px rgba(0,0,0,0.08)',
                      borderColor: '#CBD5E1',
                      transform: 'translateY(-3px)'
                    }
                  }}
                >
                  {/* Card Thumbnail / Header Banner */}
                  {item.thumbnail ? (
                    <Box sx={{ position: 'relative', width: '100%', height: 180, overflow: 'hidden', bgcolor: '#0F172A' }}>
                      <CardMedia
                        component="img"
                        image={item.thumbnail}
                        alt={item.title}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.4s ease',
                          '&:hover': { transform: 'scale(1.05)' }
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 50%, rgba(0,0,0,0.6) 100%)',
                          pointerEvents: 'none'
                        }}
                      />
                      {/* Category Chip Overlaid */}
                      <Chip
                        size="small"
                        icon={<FolderIcon sx={{ fontSize: '13px !important', color: '#FFFFFF !important' }} />}
                        label={item.category || 'Event Media'}
                        sx={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          bgcolor: 'rgba(15, 23, 42, 0.75)',
                          backdropFilter: 'blur(6px)',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: 11,
                          border: '1px solid rgba(255,255,255,0.25)'
                        }}
                      />

                      {/* Quick Thumbnail Option Button on Image for Admins */}
                      {hasFullAccess && (
                        <Tooltip title="Change Thumbnail">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenQuickThumbnail(item)}
                            sx={{
                              position: 'absolute',
                              bottom: 10,
                              right: 10,
                              bgcolor: 'rgba(15, 23, 42, 0.75)',
                              color: '#FFFFFF',
                              backdropFilter: 'blur(6px)',
                              p: 0.6,
                              '&:hover': { bgcolor: 'rgba(2, 132, 199, 0.9)' }
                            }}
                          >
                            <AddPhotoIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: 120,
                        background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
                        borderBottom: '1px solid #E0F2FE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 2.5,
                        position: 'relative'
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '12px',
                            bgcolor: '#FFFFFF',
                            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0284C7'
                          }}
                        >
                          <CloudQueueIcon sx={{ fontSize: 26 }} />
                        </Box>
                        <Chip
                          size="small"
                          label={item.category || 'Event Media'}
                          sx={{
                            bgcolor: '#FFFFFF',
                            color: '#0284C7',
                            fontWeight: 700,
                            fontSize: 11,
                            border: '1px solid #BAE6FD'
                          }}
                        />
                      </Stack>

                      {hasFullAccess && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<AddPhotoIcon sx={{ fontSize: 15 }} />}
                          onClick={() => handleOpenQuickThumbnail(item)}
                          sx={{
                            borderRadius: '7px',
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: 11,
                            bgcolor: '#FFFFFF',
                            borderColor: '#BAE6FD',
                            color: '#0369A1',
                            py: 0.4,
                            px: 1.2,
                            '&:hover': { bgcolor: '#F0F9FF', borderColor: '#7DD3FC' }
                          }}
                        >
                          Add Thumbnail
                        </Button>
                      )}
                    </Box>
                  )}

                  <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Header Row: Title & Action Menu */}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.75 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 800,
                          color: '#0F172A',
                          fontSize: 16,
                          lineHeight: 1.35,
                          flexGrow: 1,
                          mr: 1
                        }}
                      >
                        {item.title}
                      </Typography>

                      {hasFullAccess && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, item)}
                          sx={{ color: '#94A3B8', mt: -0.5, mr: -1, '&:hover': { color: '#0F172A' } }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>

                    {/* Event Date */}
                    <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 1.5 }}>
                      <CalendarIcon sx={{ fontSize: 15, color: '#64748B' }} />
                      <Typography variant="caption" sx={{ color: '#475467', fontWeight: 600 }}>
                        {formattedDate}
                      </Typography>
                    </Stack>

                    {/* Description */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#64748B',
                        fontSize: 13,
                        lineHeight: 1.55,
                        mb: 2,
                        flexGrow: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
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
                          bgcolor: '#0284C7',
                          color: '#FFFFFF',
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: 13,
                          borderRadius: '8px',
                          boxShadow: 'none',
                          py: 1,
                          '&:hover': { bgcolor: '#0369A1', boxShadow: 'none' }
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
                            '&:hover': { bgcolor: '#F8FAFC', color: '#0284C7' }
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
            minWidth: 160
          }
        }}
      >
        <MenuItem onClick={() => handleOpenEdit(activeItemForMenu)}>
          <ListItemIcon>
            <EditIcon fontSize="small" sx={{ color: '#0284C7' }} />
          </ListItemIcon>
          <ListItemText primary="Edit Link" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }} />
        </MenuItem>

        <MenuItem onClick={() => handleOpenQuickThumbnail(activeItemForMenu)}>
          <ListItemIcon>
            <AddPhotoIcon fontSize="small" sx={{ color: '#8B5CF6' }} />
          </ListItemIcon>
          <ListItemText primary="Change Thumbnail" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }} />
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

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

      {/* Quick Thumbnail Upload Dialog */}
      <Dialog
        open={quickThumbDialogOpen}
        onClose={() => !savingQuickThumb && setQuickThumbDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <ImageIcon sx={{ color: '#0284C7' }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Update Thumbnail
            </Typography>
          </Stack>
          <IconButton onClick={() => setQuickThumbDialogOpen(false)} disabled={savingQuickThumb}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2.5 }}>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
            Add an attractive preview image or cover photo to <strong>{quickThumbItem?.title}</strong>
          </Typography>

          {/* Live Preview */}
          {quickThumbPreview ? (
            <Box sx={{ position: 'relative', mb: 2, borderRadius: '12px', overflow: 'hidden', height: 160, border: '1px solid #E2E8F0' }}>
              <img src={quickThumbPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <IconButton
                size="small"
                onClick={() => {
                  setQuickThumbFile(null);
                  setQuickThumbPreview('');
                  setQuickThumbUrl('');
                }}
                sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(15, 23, 42, 0.75)', color: '#FFFFFF', '&:hover': { bgcolor: '#EF4444' } }}
              >
                <RemoveImageIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Box
              onClick={() => quickThumbnailInputRef.current?.click()}
              sx={{
                height: 120,
                borderRadius: '12px',
                border: '2px dashed #CBD5E1',
                bgcolor: '#F8FAFC',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                cursor: 'pointer',
                mb: 2,
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: '#0284C7', bgcolor: '#F0F9FF' }
              }}
            >
              <AddPhotoIcon sx={{ color: '#94A3B8', fontSize: 32 }} />
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                Click to upload thumbnail image
              </Typography>
            </Box>
          )}

          <input
            type="file"
            accept="image/*"
            ref={quickThumbnailInputRef}
            style={{ display: 'none' }}
            onChange={(e) => handleFileChange(e, true)}
          />

          <Divider sx={{ my: 2 }}>
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>OR ENTER IMAGE URL</Typography>
          </Divider>

          <TextField
            fullWidth
            size="small"
            label="Thumbnail Image URL"
            placeholder="https://example.com/image.jpg"
            value={quickThumbUrl}
            onChange={(e) => {
              setQuickThumbUrl(e.target.value);
              setQuickThumbPreview(e.target.value);
              setQuickThumbFile(null);
            }}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setQuickThumbDialogOpen(false)} disabled={savingQuickThumb} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveQuickThumbnail}
            disabled={savingQuickThumb}
            sx={{
              bgcolor: '#0284C7',
              textTransform: 'none',
              fontWeight: 700,
              px: 2.5,
              '&:hover': { bgcolor: '#0369A1' }
            }}
          >
            {savingQuickThumb ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Save Thumbnail'}
          </Button>
        </DialogActions>
      </Dialog>

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
            <CloudQueueIcon sx={{ color: '#0284C7' }} />
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

            </Grid>

            {/* Description */}
            <TextField
              fullWidth
              multiline
              rows={2.5}
              label="Event Description"
              placeholder="Brief description of the photos, highlights, or event details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ mb: 2.5 }}
            />

            {/* Thumbnail Upload Section */}
            <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <ImageIcon sx={{ fontSize: 18, color: '#0284C7' }} /> Card Thumbnail / Cover Photo
              </Typography>

              {thumbnailPreview ? (
                <Box sx={{ position: 'relative', height: 140, borderRadius: '10px', overflow: 'hidden', mb: 1.5, border: '1px solid #E2E8F0' }}>
                  <img src={thumbnailPreview} alt="Thumbnail Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <IconButton
                    size="small"
                    onClick={() => {
                      setThumbnailFile(null);
                      setThumbnailPreview('');
                      setThumbnailUrl('');
                    }}
                    sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(15, 23, 42, 0.75)', color: '#FFFFFF', '&:hover': { bgcolor: '#EF4444' } }}
                  >
                    <RemoveImageIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : null}

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddPhotoIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: '#CBD5E1',
                    color: '#334155',
                    bgcolor: '#FFFFFF',
                    '&:hover': { bgcolor: '#F1F5F9' }
                  }}
                >
                  Upload File
                </Button>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>or paste URL below</Typography>
              </Stack>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(e, false)}
              />

              <TextField
                fullWidth
                size="small"
                placeholder="https://example.com/thumbnail.jpg"
                value={thumbnailUrl}
                onChange={(e) => {
                  setThumbnailUrl(e.target.value);
                  setThumbnailPreview(e.target.value);
                  setThumbnailFile(null);
                }}
                sx={{ mt: 1.5, bgcolor: '#FFFFFF' }}
              />
            </Box>
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
                bgcolor: '#0284C7',
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                '&:hover': { bgcolor: '#0369A1' }
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
