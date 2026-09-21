import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ListItemText,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  OpenInNew as OpenInNewIcon,
  ContentCopy as ContentCopyIcon,
  CalendarMonth as CalendarIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Image as ImageIcon,
  DeleteOutlined as RemoveImageIcon,
  CloudUpload as CloudUploadIcon,
  Crop as CropIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionContext';
import API from '../../api';
import ImageCropDialog from '../../components/common/ImageCropDialog';

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

const FOCUS_OPTIONS = [
  { value: 'center', label: 'Center' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
];

// Google Drive colorful triangle logo SVG
function GoogleDriveLogo({ size = 40 }) {
  return (
    <img
      src="https://ssl.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png"
      alt="Google Drive"
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block' }}
    />
  );
}

export default function DriveLinks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canCreate } = usePermissions();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef(null);
  const quickThumbnailInputRef = useRef(null);

  const isAdmin = user?.role === 'ADMIN';
  const hasFullAccess = isAdmin || canCreate('drive_links');

  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const filteredLinks = useMemo(() => {
    if (selectedCategory === 'ALL') return links;
    return links.filter((l) => (l.category || 'General') === selectedCategory);
  }, [links, selectedCategory]);

  const availableCategories = useMemo(() => {
    const list = [...CATEGORIES];
    links.forEach((l) => {
      if (l.category && !list.includes(l.category)) {
        list.push(l.category);
      }
    });
    return list;
  }, [links]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [category, setCategory] = useState('General');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [thumbnailFocus, setThumbnailFocus] = useState('center');

  const [quickThumbItem, setQuickThumbItem] = useState(null);
  const [quickThumbDialogOpen, setQuickThumbDialogOpen] = useState(false);
  const [quickThumbFile, setQuickThumbFile] = useState(null);
  const [quickThumbUrl, setQuickThumbUrl] = useState('');
  const [quickThumbPreview, setQuickThumbPreview] = useState('');
  const [quickThumbFocus, setQuickThumbFocus] = useState('center');
  const [savingQuickThumb, setSavingQuickThumb] = useState(false);

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState('');
  const [cropTargetMode, setCropTargetMode] = useState('main'); // 'main' | 'quick'

  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [activeItemForMenu, setActiveItemForMenu] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const lastFetchRef = useRef({ time: 0, search: null });
  const previousSearchRef = useRef(search);

  const fetchDriveLinks = async (searchTerm = search, force = false) => {
    const now = Date.now();
    if (
      !force &&
      lastFetchRef.current.search === searchTerm &&
      now - lastFetchRef.current.time < 1200
    ) {
      return;
    }
    lastFetchRef.current = { time: now, search: searchTerm };

    try {
      setLoading(true);
      const res = await API.get('/drive-links', { params: { search: searchTerm || undefined } });
      if (res.data?.success) setLinks(res.data.data || []);
    } catch (err) {
      console.error('Failed to load drive links:', err);
      enqueueSnackbar('Failed to retrieve drive links', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 1. Initial page load (runs once on mount, deduplicated against StrictMode double-mounting)
  useEffect(() => {
    fetchDriveLinks(search);
  }, []);

  // 2. Search effect (strictly triggers only when the search query value actually changes)
  useEffect(() => {
    if (previousSearchRef.current === search) {
      return;
    }
    previousSearchRef.current = search;

    const timer = setTimeout(() => {
      fetchDriveLinks(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenCreate = () => {
    setEditingLink(null);
    setTitle(''); setDescription(''); setDriveUrl('');
    setEventDate(new Date().toISOString().split('T')[0]);
    setCategory('General'); setThumbnailUrl(''); setThumbnailFile(null); setThumbnailPreview('');
    setThumbnailFocus('center');
    setDialogOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingLink(item);
    setTitle(item.title || ''); setDescription(item.description || '');
    setDriveUrl(item.driveUrl || '');
    setEventDate(item.eventDate ? new Date(item.eventDate).toISOString().split('T')[0] : '');
    setCategory(item.category || 'General');
    setThumbnailUrl(item.thumbnail || ''); setThumbnailFile(null); setThumbnailPreview(item.thumbnail || '');
    setThumbnailFocus(item.thumbnailFocus || 'center');
    setDialogOpen(true); handleMenuClose();
  };

  const handleOpenQuickThumbnail = (item) => {
    setQuickThumbItem(item); setQuickThumbUrl(item.thumbnail || '');
    setQuickThumbFile(null); setQuickThumbPreview(item.thumbnail || '');
    setQuickThumbFocus(item.thumbnailFocus || 'center');
    setQuickThumbDialogOpen(true); handleMenuClose();
  };

  const handleProcessFile = (file, isQuick = false) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      enqueueSnackbar('Please select a valid image file (PNG, JPG, WEBP)', { variant: 'warning' });
      return;
    }
    const preview = URL.createObjectURL(file);
    if (isQuick) { setQuickThumbFile(file); setQuickThumbPreview(preview); }
    else { setThumbnailFile(file); setThumbnailPreview(preview); }
  };

  const handleFileChange = (e, isQuick = false) => {
    const file = e?.target?.files?.[0];
    if (file) handleProcessFile(file, isQuick);
  };

  const handleOpenCrop = (imageSrc, mode = 'main') => {
    if (!imageSrc) return;
    setImageToCrop(imageSrc);
    setCropTargetMode(mode);
    setCropDialogOpen(true);
  };

  const handleCropComplete = (croppedFile, croppedPreviewUrl) => {
    if (cropTargetMode === 'quick') {
      setQuickThumbFile(croppedFile);
      setQuickThumbPreview(croppedPreviewUrl);
      setQuickThumbUrl('');
    } else {
      setThumbnailFile(croppedFile);
      setThumbnailPreview(croppedPreviewUrl);
      setThumbnailUrl('');
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!title.trim() || !driveUrl.trim() || !eventDate) {
      enqueueSnackbar('Please fill in Title, Google Drive URL, and Date of Event', { variant: 'warning' });
      return;
    }
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('title', title.trim()); formData.append('description', description.trim());
      formData.append('driveUrl', driveUrl.trim()); formData.append('eventDate', eventDate);
      formData.append('category', category);
      formData.append('thumbnailFocus', thumbnailFocus);
      if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
      else formData.append('thumbnail', thumbnailUrl.trim());
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (editingLink) {
        const res = await API.put(`/drive-links/${editingLink._id}`, formData, { headers });
        if (res.data?.success) { enqueueSnackbar('Google Drive link updated successfully', { variant: 'success' }); setDialogOpen(false); fetchDriveLinks(search, true); }
      } else {
        const res = await API.post('/drive-links', formData, { headers });
        if (res.data?.success) { enqueueSnackbar('Google Drive link added successfully', { variant: 'success' }); setDialogOpen(false); fetchDriveLinks(search, true); }
      }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to save Google Drive link', { variant: 'error' });
    } finally { setSaving(false); }
  };

  const handleSaveQuickThumbnail = async () => {
    if (!quickThumbItem) return;
    try {
      setSavingQuickThumb(true);
      const formData = new FormData();
      formData.append('thumbnailFocus', quickThumbFocus);
      if (quickThumbFile) formData.append('thumbnail', quickThumbFile);
      else formData.append('thumbnail', quickThumbUrl.trim());
      const res = await API.put(`/drive-links/${quickThumbItem._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data?.success) { enqueueSnackbar('Thumbnail updated successfully', { variant: 'success' }); setQuickThumbDialogOpen(false); setQuickThumbItem(null); fetchDriveLinks(search, true); }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to update thumbnail', { variant: 'error' });
    } finally { setSavingQuickThumb(false); }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      const res = await API.delete(`/drive-links/${itemToDelete._id}`);
      if (res.data?.success) { enqueueSnackbar('Drive link deleted successfully', { variant: 'info' }); setDeleteDialogOpen(false); setItemToDelete(null); fetchDriveLinks(search, true); }
    } catch (err) {
      enqueueSnackbar('Failed to delete drive link', { variant: 'error' });
    } finally { setDeleting(false); }
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    enqueueSnackbar('Google Drive link copied to clipboard', { variant: 'success' });
  };

  const handleMenuOpen = (event, item) => { setMenuAnchorEl(event.currentTarget); setActiveItemForMenu(item); };
  const handleMenuClose = () => { setMenuAnchorEl(null); setActiveItemForMenu(null); };

  return (
    <Box sx={{ p: 0 }}>
      {/* ── Full-Width Header Banner ── */}
      <Box
        sx={{
          width: '100%',
          borderRadius:"14px",
          background: 'linear-gradient(135deg, #EBF4FF 0%, #DBEAFE 55%, #EDE9FE 100%)',
   
          px: { xs: 2.5, sm: 4, md: 5 },
          py: { xs: 2.5, sm: 3, md: 3.5 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative background icon */}
        <Box sx={{ position: 'absolute', right: { xs: -30, sm: 16, md: 60 }, top: '50%', transform: 'translateY(-50%)', opacity: 0.15, pointerEvents: 'none' }}>
          <CloudUploadIcon sx={{ fontSize: { xs: 100, sm: 120, md: 140 }, color: '#3B82F6' }} />
        </Box>

        {/* Left: logo + title */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 },
              borderRadius: '14px', bgcolor: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'none', flexShrink: 0, p: 0.8
            }}
          >
            <GoogleDriveLogo size={34} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E3A5F', fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.75rem' }, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Drive Links
            </Typography>
            <Typography variant="body2" sx={{ color: '#4B6A8A', fontWeight: 500, fontSize: { xs: 12, sm: 13 } }}>
              Access event photos & videos resources with ease
            </Typography>
          </Box>
        </Stack>

        {/* Right: Add button / Upload Drive button */}
        {hasFullAccess ? (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{
              bgcolor: '#2563EB', color: '#FFFFFF', textTransform: 'none', fontWeight: 700,
              borderRadius: '10px', px: { xs: 2, sm: 2.5 }, py: 1, fontSize: { xs: 12, sm: 13 },
              boxShadow: '0 4px 14px rgba(37,99,235,0.35)', flexShrink: 0, zIndex: 1,
              '&:hover': { bgcolor: '#1D4ED8', boxShadow: '0 6px 18px rgba(37,99,235,0.45)' }
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Add Drive Link</Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Add</Box>
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={() => navigate('/request-upload?tab=submit&category=drive_links')}
            sx={{
              bgcolor: '#2563EB', color: '#FFFFFF', textTransform: 'none', fontWeight: 700,
              borderRadius: '10px', px: { xs: 2, sm: 2.5 }, py: 1, fontSize: { xs: 12, sm: 13 },
              boxShadow: '0 4px 14px rgba(37,99,235,0.35)', flexShrink: 0, zIndex: 1,
              '&:hover': { bgcolor: '#1D4ED8', boxShadow: '0 6px 18px rgba(37,99,235,0.45)' }
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Upload Drive</Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Upload</Box>
          </Button>
        )}
      </Box>

      {/* ── Content Area ── */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, sm: 2.5 } }}>
        {/* Category Tabs & Search Bar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', md: 'center' },
            gap: 2,
            mb: 3
          }}
        >
          <Tabs
            value={selectedCategory}
            onChange={(_, val) => setSelectedCategory(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: '34px',
              bgcolor: '#F1F5F9',
              p: '3px',
              borderRadius: '12px',
              maxWidth: { xs: '100%', md: 'calc(100% - 280px)' },
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTabs-scrollButtons': {
                color: '#64748B',
                '&.Mui-disabled': { opacity: 0.3 }
              }
            }}
          >
            <Tab
              value="ALL"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <span>All</span>
                  <Chip
                    label={links.length}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '10.5px',
                      fontWeight: 700,
                      bgcolor: selectedCategory === 'ALL' ? 'rgba(37, 99, 235, 0.12)' : '#E2E8F0',
                      color: selectedCategory === 'ALL' ? '#2563EB' : '#64748B',
                      transition: 'all 0.15s ease'
                    }}
                  />
                </Box>
              }
              sx={{
                minHeight: '28px',
                borderRadius: '9px',
                fontWeight: 600,
                fontSize: '12.5px',
                py: 0.5,
                px: 1.75,
                textTransform: 'none',
                color: '#64748B',
                transition: 'all 0.15s ease',
                '&.Mui-selected': {
                  bgcolor: '#FFFFFF',
                  color: '#2563EB',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                }
              }}
            />
            {availableCategories.map((cat) => {
              const count = links.filter((l) => (l.category || 'General') === cat).length;
              return (
                <Tab
                  key={cat}
                  value={cat}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <span>{cat}</span>
                      {count > 0 && (
                        <Chip
                          label={count}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '10.5px',
                            fontWeight: 700,
                            bgcolor: selectedCategory === cat ? 'rgba(37, 99, 235, 0.12)' : '#E2E8F0',
                            color: selectedCategory === cat ? '#2563EB' : '#64748B',
                            transition: 'all 0.15s ease'
                          }}
                        />
                      )}
                    </Box>
                  }
                  sx={{
                    minHeight: '28px',
                    borderRadius: '9px',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    py: 0.5,
                    px: 1.75,
                    textTransform: 'none',
                    color: '#64748B',
                    transition: 'all 0.15s ease',
                    '&.Mui-selected': {
                      bgcolor: '#FFFFFF',
                      color: '#2563EB',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                    }
                  }}
                />
              );
            })}
          </Tabs>

          <TextField
            size="small"
            placeholder="Search drive links..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                </InputAdornment>
              )
            }}
            sx={{
              width: { xs: '100%', md: 260 },
              flexShrink: 0,
              '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#FFFFFF', fontSize: 13 }
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={36} /></Box>
        ) : filteredLinks.length === 0 ? (
          <Card sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', p: 6, textAlign: 'center', bgcolor: '#FFFFFF' }}>
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#EFF8FF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <CloudUploadIcon sx={{ fontSize: 36, color: '#3B82F6' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
              No Google Drive links found {selectedCategory !== 'ALL' ? `for "${selectedCategory}"` : ''}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', maxWidth: 440, mx: 'auto', mb: 3 }}>
              {search
                ? 'No events match your current search query.'
                : selectedCategory !== 'ALL'
                ? ``
                : 'Google Drive folders containing high-resolution event media will appear here.'}
            </Typography>
     
            {hasFullAccess ? (
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}
                sx={{ bgcolor: '#2563EB', textTransform: 'none', fontWeight: 600, borderRadius: '8px', '&:hover': { bgcolor: '#1D4ED8' } }}>
                Add Drive Link
              </Button>
            ) : (
              <Button variant="contained" startIcon={<CloudUploadIcon />} onClick={() => navigate('/request-upload?tab=submit&category=drive_links')}
                sx={{ bgcolor: '#2563EB', textTransform: 'none', fontWeight: 600, borderRadius: '8px', '&:hover': { bgcolor: '#1D4ED8' } }}>
                Upload Drive
              </Button>
            )}
          </Card>
        ) : (
          <Grid container spacing={2}>
            {filteredLinks.map((item) => {
              const formattedDate = item.eventDate
                ? new Date(item.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Date N/A';
              return (
                <Grid key={item._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <Card
                    sx={{
                      height: 320,
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '16px',
                      border: '1px solid #E8EDF3',
                      boxShadow: 'none',
                      bgcolor: '#FFFFFF',
                      overflow: 'hidden',
                      transition: 'all 0.22s ease-in-out',
                      '&:hover': {
                        boxShadow: '0 12px 32px rgba(0,0,0,0.09)',
                        borderColor: '#C7D7F0',
                        transform: 'translateY(-3px)'
                      }
                    }}
                  >
                    {/* Thumbnail — exactly 60% height */}
                    {item.thumbnail ? (
                      <Box sx={{ width: '100%', height: '60%', overflow: 'hidden', bgcolor: '#0F172A', position: 'relative', flexShrink: 0 }}>
                        <CardMedia
                          component="img"
                          image={item.thumbnail}
                          alt={item.title}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: item.thumbnailFocus || 'center',
                            transition: 'transform 0.4s ease',
                            '&:hover': { transform: 'scale(1.05)' }
                          }}
                        />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: '60%',
                          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                          borderBottom: '1px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: '#FFFFFF', boxShadow: '0 2px 8px rgba(37,99,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0.6 }}>
                          <GoogleDriveLogo size={28} />
                        </Box>
                      </Box>
                    )}

                    {/* Content — remaining 40% height */}
                    <CardContent
                      sx={{
                        height: '40%',
                        p: 1.75,
                        pb: '12px !important',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxSizing: 'border-box'
                      }}
                    >
                      <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.25 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 800,
                              color: '#0F172A',
                              fontSize: 14,
                              lineHeight: 1.25,
                              flexGrow: 1,
                              mr: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={item.title}
                          >
                            {item.title}
                          </Typography>
                          {hasFullAccess && (
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, item)}
                              sx={{ color: '#94A3B8', mt: -0.5, mr: -0.75, p: 0.25, '&:hover': { color: '#0F172A' } }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Stack>

                        <Stack direction="row" spacing={0.6} alignItems="center">
                          <CalendarIcon sx={{ fontSize: 13, color: '#94A3B8' }} />
                          <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600, fontSize: 11.5 }}>
                            {formattedDate}
                          </Typography>
                        </Stack>
                      </Box>

                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 'auto', pt: 0.75 }}>
                        <Button
                          variant="contained"
                          fullWidth
                          href={item.driveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          startIcon={<GoogleDriveLogo size={15} />}
                          endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}
                          sx={{
                            bgcolor: '#2563EB',
                            color: '#FFFFFF',
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: 12,
                            borderRadius: '8px',
                            boxShadow: 'none',
                            py: 0.7,
                            px: 1,
                            whiteSpace: 'nowrap',
                            minWidth: 0,
                            '&:hover': { bgcolor: '#1D4ED8', boxShadow: 'none' }
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
                              p: 0.7,
                              flexShrink: 0,
                              '&:hover': { bgcolor: '#F8FAFC', color: '#2563EB' }
                            }}
                          >
                            <ContentCopyIcon sx={{ fontSize: 16 }} />
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
      </Box>

      {/* ── Admin Context Menu ── */}
      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}
        PaperProps={{ sx: { borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 160 } }}>
        <MenuItem onClick={() => handleOpenEdit(activeItemForMenu)}>
          <ListItemIcon><EditIcon fontSize="small" sx={{ color: '#2563EB' }} /></ListItemIcon>
          <ListItemText primary="Edit Drive" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }} />
        </MenuItem>
        <MenuItem onClick={() => handleOpenQuickThumbnail(activeItemForMenu)}>
          <ListItemIcon><AddPhotoIcon fontSize="small" sx={{ color: '#8B5CF6' }} /></ListItemIcon>
          <ListItemText primary="Update Photo" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }} />
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={() => { setItemToDelete(activeItemForMenu); setDeleteDialogOpen(true); handleMenuClose(); }} sx={{ color: '#EF4444' }}>
          <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: '#EF4444' }} /></ListItemIcon>
          <ListItemText primary="Delete" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }} />
        </MenuItem>
      </Menu>

      {/* ── Quick Thumbnail Dialog ── */}
      <Dialog open={quickThumbDialogOpen} onClose={() => !savingQuickThumb && setQuickThumbDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1} sx={{alignItems:"center"}}>
            <ImageIcon sx={{ color: '#2563EB' }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Update Thumbnail</Typography>
          </Stack>
          <IconButton onClick={() => setQuickThumbDialogOpen(false)} disabled={savingQuickThumb}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2.5 }}>
     
          {quickThumbPreview ? (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', height: 160, border: '1px solid #E2E8F0' }}>
                <img
                  src={quickThumbPreview}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: quickThumbFocus }}
                />
                <Tooltip title="Crop & Adjust Frame">
                  <IconButton size="small" onClick={() => handleOpenCrop(quickThumbPreview, 'quick')}
                    sx={{ position: 'absolute', top: 8, right: 44, bgcolor: 'rgba(15,23,42,0.75)', color: '#FFFFFF', '&:hover': { bgcolor: '#2563EB' } }}>
                    <CropIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Remove Image">
                  <IconButton size="small" onClick={() => { setQuickThumbFile(null); setQuickThumbPreview(''); setQuickThumbUrl(''); }}
                    sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(15,23,42,0.75)', color: '#FFFFFF', '&:hover': { bgcolor: '#EF4444' } }}>
                    <RemoveImageIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Crop action button + Focus Position Selector */}
              <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <Stack direction="row"  alignItems="center" sx={{ mb: 1 ,justifyContent:"space-between"}}>
                  <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700 }}>
                    Focus Portion Alignment
                  </Typography>
           
                </Stack>
                <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                  {FOCUS_OPTIONS.map((opt) => {
                    const isSelected = quickThumbFocus === opt.value;
                    return (
                      <Button
                        key={opt.value}
                        size="small"
                        variant={isSelected ? 'contained' : 'outlined'}
                        onClick={() => setQuickThumbFocus(opt.value)}
                        sx={{
                          textTransform: 'none',
                          fontSize: '12px',
                          fontWeight: 600,
                          py: 0.4,
                          px: 1.5,
                          borderRadius: '8px',
                          borderColor: isSelected ? '#2563EB' : '#CBD5E1',
                          bgcolor: isSelected ? '#2563EB' : '#FFFFFF',
                          color: isSelected ? '#FFFFFF' : '#334155',
                          boxShadow: 'none',
                          '&:hover': {
                            bgcolor: isSelected ? '#1D4ED8' : '#F1F5F9',
                            boxShadow: 'none'
                          }
                        }}
                      >
                        {opt.label}
                      </Button>
                    );
                  })}
                </Stack>
              </Box>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddPhotoIcon />}
                    onClick={() => quickThumbnailInputRef.current?.click()}
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
                    Change Thumbnail Image 
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CropIcon />}
                    onClick={() => handleOpenCrop(quickThumbPreview, 'quick')}
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: '#2563EB',
                      color: '#2563EB',
                      bgcolor: '#EFF6FF',
                      '&:hover': { bgcolor: '#DBEAFE' }
                    }}
                  >
                    Crop & Frame
                  </Button>
                </Stack>
              </Box>
            ) : (
            <Box
              onClick={() => quickThumbnailInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) handleProcessFile(dropped, true);
              }}
              sx={{
                height: 130,
                borderRadius: '14px',
                border: '2px dashed #93C5FD',
                bgcolor: '#F0F7FF',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                cursor: 'pointer',
                textAlign: 'center',
                px: 3,
                mb: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: '#2563EB',
                  bgcolor: '#E0EFFF',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  bgcolor: '#FFFFFF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.15)'
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 24 }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>
                Click to upload cover photo or drag and drop
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                PNG, JPG, or WEBP (recommended 16:9 ratio)
              </Typography>
            </Box>
          )}
          <input type="file" accept="image/*" ref={quickThumbnailInputRef} style={{ display: 'none' }} onChange={(e) => handleFileChange(e, true)} />

        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setQuickThumbDialogOpen(false)} disabled={savingQuickThumb} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveQuickThumbnail} disabled={savingQuickThumb}
            sx={{ bgcolor: '#2563EB', textTransform: 'none', fontWeight: 700, px: 2.5, '&:hover': { bgcolor: '#1D4ED8' } }}>
            {savingQuickThumb ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Save Thumbnail'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add / Edit Drive Link Dialog ── */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ p: 0.5 }}><GoogleDriveLogo size={24} /></Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {editingLink ? 'Edit Google Drive Link' : 'Add Google Drive Event Link'}
            </Typography>
          </Stack>
          <IconButton onClick={() => setDialogOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent dividers sx={{ p: 3 }}>
            <TextField fullWidth label="Event Name / Title" placeholder="Enter event name here"
              value={title} onChange={(e) => setTitle(e.target.value)} sx={{ mb: 2.5 }} required />
            <TextField fullWidth label="Google Drive Link" placeholder="https://drive.google.com/drive/folders/..."
              value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)}
              helperText="Paste the shareable Google Drive folder URL / Link" sx={{ mb: 2.5 }} required />
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Date of Event *"
                  format="DD/MM/YYYY"
                  value={eventDate ? dayjs(eventDate) : null}
                  onChange={(newValue) => setEventDate(newValue && newValue.isValid() ? newValue.format("YYYY-MM-DD") : "")}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)}>
                    {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TextField fullWidth multiline rows={2.5} label="Event Description"
              placeholder="Brief description of the photos, highlights, or event details..."
              value={description} onChange={(e) => setDescription(e.target.value)} sx={{ mb: 2.5 }} />
            <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <ImageIcon sx={{ fontSize: 18, color: '#2563EB' }} /> Cover Photo
              </Typography>
              {thumbnailPreview ? (
                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ position: 'relative', height: 140, borderRadius: '10px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: thumbnailFocus }}
                    />
                    <Tooltip title="Crop & Adjust Frame">
                      <IconButton size="small" type="button" onClick={() => handleOpenCrop(thumbnailPreview, 'main')}
                        sx={{ position: 'absolute', top: 6, right: 42, bgcolor: 'rgba(15,23,42,0.75)', color: '#FFFFFF', '&:hover': { bgcolor: '#2563EB' } }}>
                        <CropIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove Image">
                      <IconButton size="small" onClick={() => { setThumbnailFile(null); setThumbnailPreview(''); setThumbnailUrl(''); }}
                        sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(15,23,42,0.75)', color: '#FFFFFF', '&:hover': { bgcolor: '#EF4444' } }}>
                        <RemoveImageIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Focus Position Selector */}
                  <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <Stack direction="row" alignItems="center" sx={{ mb: 1 ,justifyContent:"space-between" }}>
                      <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700 }}>
                        Focus Portion Alignment
                      </Typography>
                      <Button
                        size="small"
                        type="button"
                        variant="text"
                        startIcon={<CropIcon sx={{ fontSize: '15px !important' }} />}
                        onClick={() => handleOpenCrop(thumbnailPreview, 'main')}
                        sx={{ textTransform: 'none', fontWeight: 700, fontSize: 11.5, color: '#2563EB', p: 0 }}
                      >
                        Crop Image
                      </Button>
                    </Stack>
                    <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                      {FOCUS_OPTIONS.map((opt) => {
                        const isSelected = thumbnailFocus === opt.value;
                        return (
                          <Button
                            key={opt.value}
                            size="small"
                            type="button"
                            variant={isSelected ? 'contained' : 'outlined'}
                            onClick={() => setThumbnailFocus(opt.value)}
                            sx={{
                              textTransform: 'none',
                              fontSize: '12px',
                              fontWeight: 600,
                              py: 0.4,
                              px: 1.5,
                              borderRadius: '8px',
                              borderColor: isSelected ? '#2563EB' : '#CBD5E1',
                              bgcolor: isSelected ? '#2563EB' : '#FFFFFF',
                              color: isSelected ? '#FFFFFF' : '#334155',
                              boxShadow: 'none',
                              '&:hover': {
                                bgcolor: isSelected ? '#1D4ED8' : '#F1F5F9',
                                boxShadow: 'none'
                              }
                            }}
                          >
                            {opt.label}
                          </Button>
                        );
                      })}
                    </Stack>
                  </Box>
                  {/* Action Bar below preview */}
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5 }}>
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
                      Change Image
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<CropIcon />}
                      onClick={() => handleOpenCrop(thumbnailPreview, 'main')}
                      sx={{
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 600,
                        borderColor: '#2563EB',
                        color: '#2563EB',
                        bgcolor: '#EFF6FF',
                        '&:hover': { bgcolor: '#DBEAFE' }
                      }}
                    >
                      Crop & Frame
                    </Button>
                  </Stack>
                </Box>
              ) : (
                /* Uploader Dropzone UI */
                <Box
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const dropped = e.dataTransfer.files?.[0];
                    if (dropped) handleProcessFile(dropped, false);
                  }}
                  sx={{
                    height: 130,
                    borderRadius: '14px',
                    border: '2px dashed #93C5FD',
                    bgcolor: '#F0F7FF',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    textAlign: 'center',
                    px: 3,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: '#2563EB',
                      bgcolor: '#E0EFFF',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      bgcolor: '#FFFFFF',
                      color: '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(37,99,235,0.15)'
                    }}
                  >
                    <CloudUploadIcon sx={{ fontSize: 24 }} />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>
                    Click to upload cover photo or drag and drop
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    PNG, JPG, or WEBP (recommended 16:9 ratio)
                  </Typography>
                </Box>
              )}

              <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => handleFileChange(e, false)} />
          
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}
              sx={{ bgcolor: '#2563EB', textTransform: 'none', fontWeight: 700, px: 3, '&:hover': { bgcolor: '#1D4ED8' } }}>
              {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : editingLink ? 'Update Drive' : 'Add Drive'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      </LocalizationProvider>

      {/* ── Delete Confirmation ── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A' }}>Delete Google Drive Link?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to remove <strong>"{itemToDelete?.title}"</strong>? This will remove the link from the community directory.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete} disabled={deleting} sx={{ textTransform: 'none', fontWeight: 700 }}>
            {deleting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Image Crop Dialog ── */}
      <ImageCropDialog
        open={cropDialogOpen}
        imageSrc={imageToCrop}
        onClose={() => setCropDialogOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </Box>
  );
}
