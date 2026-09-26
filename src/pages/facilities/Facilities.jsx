import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  List,
  ListItem,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  AccessTime as AccessTimeIcon,
  Apartment as ApartmentIcon,
  Restaurant as FoodIcon,
  Wifi as WifiIcon,
  TwoWheeler as ParkingIcon,
  DirectionsCar as CarIcon,
  MenuBook as LibraryIcon,
  FitnessCenter as GymIcon,
  Security as SecurityIcon,
  LocalLaundryService as LaundryIcon,
  Category as CategoryIcon,
  Check as CheckIcon,
  ChevronRight as ChevronRightIcon,
  DeleteForever as DeleteForeverIcon,
  Spa as SpaIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';

// Category theme with custom badge colors and icons matching design
function getCategoryTheme(categoryName) {
  const name = (categoryName || '').toLowerCase();
  if (name.includes('food') || name.includes('dining') || name.includes('mess')) {
    return {
      badgeBg: '#F59E0B', // Amber
      iconBg: '#FFFBEB',
      iconColor: '#D97706',
      icon: <FoodIcon sx={{ fontSize: 16 }} />
    };
  }
  if (name.includes('wifi') || name.includes('internet')) {
    return {
      badgeBg: '#0088FF', // Blue
      iconBg: '#EFF6FF',
      iconColor: '#0088FF',
      icon: <WifiIcon sx={{ fontSize: 16 }} />
    };
  }
  if (name.includes('parking') || name.includes('vehicle') || name.includes('cycle')) {
    return {
      badgeBg: '#8B5CF6', // Purple
      iconBg: '#F5F3FF',
      iconColor: '#7C3AED',
      icon: <CarIcon sx={{ fontSize: 16 }} />
    };
  }
  if (name.includes('library') || name.includes('study') || name.includes('book')) {
    return {
      badgeBg: '#6366F1', // Indigo
      iconBg: '#EEF2FF',
      iconColor: '#4F46E5',
      icon: <LibraryIcon sx={{ fontSize: 16 }} />
    };
  }
  if (name.includes('security') || name.includes('safety') || name.includes('cctv') || name.includes('guard')) {
    return {
      badgeBg: '#0284C7', // Sky Blue
      iconBg: '#F0F9FF',
      iconColor: '#0284C7',
      icon: <SecurityIcon sx={{ fontSize: 16 }} />
    };
  }
  if (name.includes('gym') || name.includes('fitness') || name.includes('sport')) {
    return {
      badgeBg: '#EC4899', // Pink / Rose
      iconBg: '#FDF2F8',
      iconColor: '#DB2777',
      icon: <GymIcon sx={{ fontSize: 16 }} />
    };
  }
  if (name.includes('laundry') || name.includes('wash')) {
    return {
      badgeBg: '#06B6D4', // Cyan
      iconBg: '#ECFEFF',
      iconColor: '#0891B2',
      icon: <LaundryIcon sx={{ fontSize: 16 }} />
    };
  }
  return {
    badgeBg: '#0088FF', // Primary Blue
    iconBg: '#EFF6FF',
    iconColor: '#0088FF',
    icon: <ApartmentIcon sx={{ fontSize: 16 }} />
  };
}

// Fallback subtitle taglines matching the reference mockup
function getDefaultTagline(facilityName, category) {
  const name = (facilityName || '').toLowerCase();
  const cat = (category || '').toLowerCase();
  if (name.includes('mess') || name.includes('dining') || cat.includes('food')) {
    return 'Tasty & hygienic meals for a healthy you.';
  }
  if (name.includes('wi-fi') || name.includes('wifi') || name.includes('internet') || cat.includes('internet')) {
    return 'Stay connected, always.';
  }
  if (name.includes('parking') || cat.includes('parking')) {
    return 'Safe and secure parking for your vehicles.';
  }
  if (name.includes('library') || name.includes('study') || cat.includes('library')) {
    return 'Learn, read and grow.';
  }
  if (name.includes('security') || cat.includes('security')) {
    return 'Your safety is our priority.';
  }
  if (name.includes('gym') || name.includes('fitness')) {
    return 'Stay fit and active daily.';
  }
  if (name.includes('laundry')) {
    return 'Clean and efficient washing facilities.';
  }
  return 'Comfortable amenity for your stay.';
}

export default function Facilities() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef(null);

  // Access user check: only Admin, Administrator, or Warden can add, edit, or delete
  const isAccessUser = Boolean(
    user && ['ADMIN', 'ADMINISTRATOR', 'WARDEN'].includes(user.role)
  );

  const [facilities, setFacilities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal dialog states for Facility
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form states - Title, Tagline, Category, Timings, Photo
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState('');
  const [timings, setTimings] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  // Delete Facility Confirmation Dialog (Popup view)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Category Management Modal states (Admin / Warden)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // Delete Category Confirmation Dialog (Popup view - NO browser alerts!)
  const [categoryDeleteDialogOpen, setCategoryDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      const res = await API.get('/facilities/categories');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load facility categories:', err);
    }
  };

  // Fetch facilities
  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const res = await API.get('/facilities', {
        params: {
          search: search || undefined,
          category: selectedCategory !== 'ALL' ? selectedCategory : undefined
        }
      });
      if (res.data?.success) {
        setFacilities(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load facilities:', err);
      enqueueSnackbar('Failed to load facilities', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchFacilities();
  }, [selectedCategory, search]);

  // Compute category count map for badge counters
  const categoryCounts = useMemo(() => {
    const counts = { ALL: facilities.length };
    facilities.forEach((f) => {
      if (f.category) {
        counts[f.category] = (counts[f.category] || 0) + 1;
      }
    });
    return counts;
  }, [facilities]);

  const handleOpenCreate = () => {
    setEditingFacility(null);
    setName('');
    setTagline('');
    setCategory(categories[0]?.name || 'Food & Dining');
    setTimings('24/7 Available');
    setPhotoUrl('');
    setPhotoFile(null);
    setPhotoPreview('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingFacility(item);
    setName(item.name || '');
    setTagline(item.tagline || '');
    setCategory(item.category || categories[0]?.name || 'Food & Dining');
    setTimings(item.timings || '');
    setPhotoUrl(item.photo || '');
    setPhotoFile(null);
    setPhotoPreview(item.photo || '');
    setDialogOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e?.target?.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        enqueueSnackbar('Please select an image file (PNG, JPG, WEBP)', { variant: 'warning' });
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      enqueueSnackbar('Facility title is required', { variant: 'warning' });
      return;
    }
    if (!photoFile && !photoUrl && !photoPreview) {
      enqueueSnackbar('Facility photo is required', { variant: 'warning' });
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('tagline', tagline.trim());
      formData.append('category', category.trim() || 'Food & Dining');
      formData.append('timings', timings.trim());

      if (photoFile) {
        formData.append('photo', photoFile);
      } else if (photoUrl) {
        formData.append('photo', photoUrl.trim());
      }

      if (editingFacility) {
        await API.put(`/facilities/${editingFacility._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        enqueueSnackbar('Facility updated successfully!', { variant: 'success' });
      } else {
        await API.post('/facilities', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        enqueueSnackbar('Facility added successfully!', { variant: 'success' });
      }

      setDialogOpen(false);
      fetchFacilities();
    } catch (err) {
      console.error('Save facility error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to save facility', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFacility = async () => {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      await API.delete(`/facilities/${itemToDelete._id}`);
      enqueueSnackbar('Facility removed successfully', { variant: 'success' });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchFacilities();
    } catch (err) {
      console.error('Delete facility error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete facility', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleAddCategory = async (e) => {
    if (e) e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      setAddingCategory(true);
      const res = await API.post('/facilities/categories', {
        name: newCategoryName.trim()
      });
      if (res.data?.success) {
        enqueueSnackbar(`Category "${res.data.data.name}" added!`, { variant: 'success' });
        setNewCategoryName('');
        await fetchCategories();
      }
    } catch (err) {
      console.error('Add category error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to add category', { variant: 'error' });
    } finally {
      setAddingCategory(false);
    }
  };

  const handleUpdateCategory = async (catId) => {
    if (!editingCategoryName.trim()) return;

    try {
      const res = await API.put(`/facilities/categories/${catId}`, {
        name: editingCategoryName.trim()
      });
      if (res.data?.success) {
        enqueueSnackbar('Category renamed successfully', { variant: 'success' });
        setEditingCategoryId(null);
        setEditingCategoryName('');
        await fetchCategories();
        fetchFacilities();
      }
    } catch (err) {
      console.error('Update category error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to update category', { variant: 'error' });
    }
  };

  // Trigger custom confirmation popup for Category deletion (NEVER use window.confirm!)
  const handleRequestDeleteCategory = (cat) => {
    setCategoryToDelete(cat);
    setCategoryDeleteDialogOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      setDeletingCategory(true);
      const res = await API.delete(`/facilities/categories/${categoryToDelete._id}`);
      if (res.data?.success) {
        enqueueSnackbar('Category deleted successfully', { variant: 'success' });
        if (selectedCategory === categoryToDelete.name) {
          setSelectedCategory('ALL');
        }
        setCategoryDeleteDialogOpen(false);
        setCategoryToDelete(null);
        await fetchCategories();
        fetchFacilities();
      }
    } catch (err) {
      console.error('Delete category error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete category', { variant: 'error' });
    } finally {
      setDeletingCategory(false);
    }
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', pb: 8 }}>
      {/* ── Top Header Banner (Matches Application Theme) ── */}
      <Box
        sx={{
          bgcolor: '#FFFFFF',
          borderRadius: { xs: '16px', md: '20px' },
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
          p: { xs: 2.5, sm: 3, md: 3.5 },
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 52%, #EFF6FF 100%)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: { xs: 2.5, md: 3 }
        }}
      >
        {/* Left Side: Icon, Title, Subtitle */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
              borderRadius: '16px',
              bgcolor: '#DBEAFE',
              border: '1px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0088FF',
              boxShadow: '0 4px 12px rgba(0, 136, 255, 0.15)',
              flexShrink: 0
            }}
          >
            <ApartmentIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: '#0F172A',
                fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.1rem' },
                letterSpacing: '-0.025em',
                lineHeight: 1.2
              }}
            >
              Hostel Facilities & Amenities
            </Typography>
    
          </Box>
        </Box>

        {/* Right Side: Campus Stats & Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
            flexShrink: 0
          }}
        >
    

          {/* Action Buttons for Admin / Warden */}
          {isAccessUser && (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.25}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              <Button
                variant="outlined"
                startIcon={<CategoryIcon />}
                onClick={() => setCategoryModalOpen(true)}
                sx={{
                  color: '#0088FF',
                  borderColor: '#93C5FD',
                  borderWidth: '1.5px',
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: '10px',
                  px: 2,
                  py: 1.1,
                  fontSize: '13.5px',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    borderColor: '#0088FF',
                    borderWidth: '1.5px',
                    bgcolor: '#EFF6FF'
                  }
                }}
              >
                Manage Categories
              </Button>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
                sx={{
                  bgcolor: '#0088FF',
                  color: '#FFFFFF',
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: '10px',
                  px: 2.75,
                  py: 1.1,
                  fontSize: '14px',
                  boxShadow: '0 4px 14px rgba(0, 136, 255, 0.35)',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    bgcolor: '#0070D2',
                    boxShadow: '0 6px 18px rgba(0, 136, 255, 0.45)'
                  }
                }}
              >
                Add Facility
              </Button>
            </Stack>
          )}
        </Box>
      </Box>

      {/* ── Category Pill Tabs Strip & Search Input ── */}
      <Box
        sx={{
          bgcolor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          p: { xs: 1.25, sm: 1.5 },
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 1.5
        }}
      >
        {/* Horizontal Category Pill Strip with Smooth Touch Scrolling */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            overflowX: 'auto',
            py: 0.5,
            px: 0.25,
            flex: 1,
            minWidth: 0,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* All Facilities Tab */}
          <Box
            onClick={() => setSelectedCategory('ALL')}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 0.8,
              borderRadius: '24px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: '13px',
              fontWeight: 700,
              transition: 'all 0.18s ease',
              bgcolor: selectedCategory === 'ALL' ? '#0088FF' : '#F8FAFC',
              color: selectedCategory === 'ALL' ? '#FFFFFF' : '#334155',
              border: selectedCategory === 'ALL' ? '1px solid #0088FF' : '1px solid #E2E8F0',
              boxShadow: selectedCategory === 'ALL' ? '0 2px 8px rgba(0, 136, 255, 0.28)' : 'none',
              '&:hover': {
                bgcolor: selectedCategory === 'ALL' ? '#0088FF' : '#EFF6FF',
                borderColor: selectedCategory === 'ALL' ? '#0088FF' : '#BFDBFE',
                color: selectedCategory === 'ALL' ? '#FFFFFF' : '#0088FF'
              }
            }}
          >
            <ApartmentIcon sx={{ fontSize: 16 }} />
            <span>All Facilities</span>
            <Box
              sx={{
                bgcolor: selectedCategory === 'ALL' ? 'rgba(255, 255, 255, 0.28)' : '#E2E8F0',
                color: selectedCategory === 'ALL' ? '#FFFFFF' : '#475467',
                fontSize: '11px',
                fontWeight: 700,
                px: 0.85,
                py: 0.15,
                borderRadius: '12px',
                lineHeight: 1.2
              }}
            >
              {categoryCounts.ALL || 0}
            </Box>
          </Box>

          {/* Dynamic Category Tabs */}
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            const theme = getCategoryTheme(cat.name);
            const count = categoryCounts[cat.name] || 0;

            return (
              <Box
                key={cat._id || cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.75,
                  py: 0.8,
                  borderRadius: '24px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.18s ease',
                  bgcolor: isSelected ? '#0088FF' : '#F8FAFC',
                  color: isSelected ? '#FFFFFF' : '#334155',
                  border: isSelected ? '1px solid #0088FF' : '1px solid #E2E8F0',
                  boxShadow: isSelected ? '0 2px 8px rgba(0, 136, 255, 0.28)' : 'none',
                  '&:hover': {
                    bgcolor: isSelected ? '#0088FF' : '#EFF6FF',
                    borderColor: isSelected ? '#0088FF' : '#BFDBFE',
                    color: isSelected ? '#FFFFFF' : '#0088FF'
                  }
                }}
              >
                <Box sx={{ color: isSelected ? '#FFFFFF' : theme.iconColor, display: 'flex', alignItems: 'center' }}>
                  {theme.icon}
                </Box>
                <span>{cat.name}</span>
                <Box
                  sx={{
                    bgcolor: isSelected ? 'rgba(255, 255, 255, 0.28)' : '#E2E8F0',
                    color: isSelected ? '#FFFFFF' : '#475467',
                    fontSize: '11px',
                    fontWeight: 700,
                    px: 0.8,
                    py: 0.15,
                    borderRadius: '12px',
                    lineHeight: 1.2
                  }}
                >
                  {count}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Search Facilities Input */}
        <TextField
          size="small"
          placeholder="Search facilities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <IconButton size="small" onClick={() => setSearch('')} sx={{ p: 0.5 }}>
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            ) : null
          }}
          sx={{
            width: { xs: '100%', md: 240 },
            flexShrink: 0,
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              bgcolor: '#FFFFFF',
              fontSize: 13,
              '& fieldset': { borderColor: '#E2E8F0' },
              '&:hover fieldset': { borderColor: '#93C5FD' },
              '&.Mui-focused fieldset': { borderColor: '#0088FF', borderWidth: '1.5px' }
            }
          }}
        />
      </Box>

      {/* ── Content Grid: Facility Cards ── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress size={38} sx={{ color: '#0088FF' }} />
        </Box>
      ) : facilities.length === 0 ? (
        <Card sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', p: 6, textAlign: 'center', bgcolor: '#FFFFFF', boxShadow: 'none' }}>
          <ApartmentIcon sx={{ fontSize: 48, color: '#94A3B8', mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
            No facilities found {selectedCategory !== 'ALL' ? `for "${selectedCategory}"` : ''}
          </Typography>

          {isAccessUser && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              sx={{ bgcolor: '#0088FF', textTransform: 'none', fontWeight: 700, borderRadius: '10px', boxShadow: '0 4px 14px rgba(0, 136, 255, 0.35)', '&:hover': { bgcolor: '#0070D2' } }}
            >
              Add New Facility
            </Button>
          )}
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {facilities.map((item) => {
            const theme = getCategoryTheme(item.category);
            const taglineText = item.tagline || getDefaultTagline(item.name, item.category);

            return (
              <Grid key={item._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    bgcolor: '#FFFFFF',
                    overflow: 'hidden',
                    transition: 'all 0.22s ease-in-out',
                    height: '100%',
                    '&:hover': {
                      boxShadow: '0 12px 28px rgba(0, 136, 255, 0.09)',
                      borderColor: '#BFDBFE',
                      transform: 'translateY(-3px)'
                    }
                  }}
                >
                  {/* Photo with floating Category Pill on top right */}
                  <Box sx={{ width: '100%', height: 185, overflow: 'hidden', position: 'relative', bgcolor: '#0F172A' }}>
                    <CardMedia
                      component="img"
                      image={item.photo}
                      alt={item.name}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s ease',
                        '&:hover': { transform: 'scale(1.04)' }
                      }}
                    />

                    {/* Floating Category Badge (Top Right, matching image mockup) */}
                    <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.6,
                          bgcolor: theme.badgeBg,
                          color: '#FFFFFF',
                          borderRadius: '20px',
                          px: 1.5,
                          py: 0.45,
                          fontSize: '11px',
                          fontWeight: 700,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}
                      >
                        {theme.icon}
                        <span>{item.category}</span>
                      </Box>
                    </Box>

                    {/* Access User Actions: Edit / Delete (Top Left) */}
                    {isAccessUser && (
                      <Box sx={{ position: 'absolute', top: 10, left: 10, zIndex: 2, display: 'flex', gap: 0.75 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(item)}
                          sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.94)',
                            color: '#0088FF',
                            p: 0.6,
                            backdropFilter: 'blur(4px)',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                            '&:hover': { bgcolor: '#FFFFFF', transform: 'scale(1.06)' }
                          }}
                        >
                          <EditIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setItemToDelete(item);
                            setDeleteDialogOpen(true);
                          }}
                          sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.94)',
                            color: '#EF4444',
                            p: 0.6,
                            backdropFilter: 'blur(4px)',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                            '&:hover': { bgcolor: '#FFFFFF', transform: 'scale(1.06)' }
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Box>
                    )}
                  </Box>

                  {/* Card Content */}
                  <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {/* Title Row with Pastel Icon Badge and Chevron */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, minWidth: 0, flex: 1 }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '10px',
                              bgcolor: theme.iconBg,
                              color: theme.iconColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              mt: 0.25
                            }}
                          >
                            {theme.icon}
                          </Box>

                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontWeight: 800,
                                color: '#0F172A',
                                fontSize: '14.5px',
                                lineHeight: 1.3,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              title={item.name}
                            >
                              {item.name}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: '12px',
                                color: '#64748B',
                                fontWeight: 500,
                                mt: 0.25,
                                lineHeight: 1.35
                              }}
                              noWrap
                              title={taglineText}
                            >
                              {taglineText}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Chevron Icon Circle */}
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            bgcolor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#94A3B8',
                            flexShrink: 0,
                            mt: 0.5
                          }}
                        >
                          <ChevronRightIcon sx={{ fontSize: 16 }} />
                        </Box>
                      </Box>
                    </div>

                    {/* Bottom Metadata: Timings & Amenities */}
                    {item.timings && (
                      <Box
                        sx={{
                          pt: 1.25,
                          mt: 1.25,
                          borderTop: '1px solid #F1F5F9',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                          color: '#475467',
                          fontSize: '11.5px',
                          fontWeight: 600
                        }}
                      >
                        <Box sx={{ color: theme.iconColor, display: 'flex', alignItems: 'center' }}>
                          <AccessTimeIcon sx={{ fontSize: 15 }} />
                        </Box>
                        <Typography sx={{ fontSize: '11.5px', color: '#475467', fontWeight: 600 }} noWrap title={item.timings}>
                          {item.timings}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ── Add / Edit Facility Modal ── */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: '#0F172A', pb: 1 }}>
          {editingFacility ? 'Edit Facility' : 'Add Facility'}
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Facility Title"
              placeholder="e.g. Mess & Dining Hall"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            <TextField
              label="Tagline / Short Subtitle"
              placeholder="e.g. Tasty & hygienic meals for a healthy you."
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              fullWidth
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
                sx={{ borderRadius: '10px' }}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat._id || cat.name} value={cat.name}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Timings & Availability"
              placeholder="Breakfast: 7:30–9:30 AM | Lunch: 12:30–2:00 PM"
              value={timings}
              onChange={(e) => setTimings(e.target.value)}
              fullWidth
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />

            {/* Photo Upload Area */}
            <Box sx={{ border: '1px dashed #CBD5E1', borderRadius: '12px', p: 2, textAlign: 'center', bgcolor: '#F8FAFC' }}>
              {photoPreview ? (
                <Box sx={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                  <img
                    src={photoPreview}
                    alt="Preview"
                    style={{ maxHeight: 150, borderRadius: '8px', objectFit: 'cover' }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview('');
                      setPhotoUrl('');
                    }}
                    sx={{ position: 'absolute', top: -6, right: -6, bgcolor: '#EF4444', color: '#fff', '&:hover': { bgcolor: '#DC2626' } }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              ) : (
                <Box>
                  <CloudUploadIcon sx={{ fontSize: 32, color: '#94A3B8', mb: 0.5 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                    Upload Facility Photo
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1 }}>
                    High-resolution image (PNG, JPG, WEBP)
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ textTransform: 'none', borderRadius: '8px', color: '#0088FF', borderColor: '#93C5FD', fontWeight: 600, '&:hover': { bgcolor: '#EFF6FF', borderColor: '#0088FF' } }}
                  >
                    Browse Image
                  </Button>
                </Box>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
            <Button onClick={() => setDialogOpen(false)} disabled={saving} sx={{ textTransform: 'none', borderRadius: '8px' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{ bgcolor: '#0088FF', textTransform: 'none', fontWeight: 700, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 136, 255, 0.3)', '&:hover': { bgcolor: '#0070D2' } }}
            >
              {saving ? <CircularProgress size={20} color="inherit" /> : editingFacility ? 'Save Changes' : 'Add Facility'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Manage Categories Modal (Admin / Warden) ── */}
      <Dialog
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: '#0F172A', pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Manage Facility Category Tabs</span>
          <IconButton size="small" onClick={() => setCategoryModalOpen(false)}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          {/* Add Category Input */}
          <Box
            component="form"
            onSubmit={handleAddCategory}
            sx={{ display: 'flex', gap: 1, mb: 3 }}
          >
            <TextField
              size="small"
              placeholder="New category"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={addingCategory || !newCategoryName.trim()}
              startIcon={<AddIcon />}
              sx={{
                bgcolor: '#0088FF',
                color: '#fff',
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '10px',
                px: 2.5,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0, 136, 255, 0.3)',
                '&:hover': { bgcolor: '#0070D2' }
              }}
            >
              Add
            </Button>
          </Box>

          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', mb: 1 }}>
            Current Categories ({categories.length})
          </Typography>

          {/* Categories List with Edit and Custom Delete Trigger */}
          <Paper variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden' }}>
            <List disablePadding>
              {categories.map((cat, idx) => {
                const theme = getCategoryTheme(cat.name);
                return (
                  <ListItem
                    key={cat._id}
                    divider={idx < categories.length - 1}
                    sx={{
                      py: 1,
                      px: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    {editingCategoryId === cat._id ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, mr: 1 }}>
                        <TextField
                          size="small"
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          fullWidth
                          autoFocus
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleUpdateCategory(cat._id)}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingCategoryId(null);
                            setEditingCategoryName('');
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      <>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{ color: theme.iconColor, display: 'flex', alignItems: 'center' }}>
                            {theme.icon}
                          </Box>
                          <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>
                            {cat.name}
                          </Typography>
                        </Stack>

                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Rename Category">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingCategoryId(cat._id);
                                setEditingCategoryName(cat.name);
                              }}
                              sx={{ color: '#0088FF' }}
                            >
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Category">
                            <IconButton
                              size="small"
                              onClick={() => handleRequestDeleteCategory(cat)}
                              sx={{ color: '#EF4444' }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </>
                    )}
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCategoryModalOpen(false)} sx={{ textTransform: 'none', fontWeight: 700, color: '#0088FF' }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Custom Popup View for Category Deletion (NO browser alerts!) ── */}
      <Dialog
        open={categoryDeleteDialogOpen}
        onClose={() => !deletingCategory && setCategoryDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '18px',
            p: 1,
            boxShadow: 'none'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444',
              flexShrink: 0
            }}
          >
            <DeleteForeverIcon sx={{ fontSize: 22 }} />
          </Box>
          Delete Category Tab?
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.6 }}>
            Are you sure you want to delete the <strong>"{categoryToDelete?.name}"</strong> category tab?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setCategoryDeleteDialogOpen(false)}
            disabled={deletingCategory}
            sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 600, color: '#64748B', borderColor: '#E2E8F0' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDeleteCategory}
            disabled={deletingCategory}
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              bgcolor: '#EF4444',
              '&:hover': { bgcolor: '#DC2626' }
            }}
          >
            {deletingCategory ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Custom Popup View for Facility Deletion (NO browser alerts!) ── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '18px',
            p: 1,
            boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444',
              flexShrink: 0
            }}
          >
            <DeleteForeverIcon sx={{ fontSize: 22 }} />
          </Box>
          Remove Facility?
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.6 }}>
            Are you sure you want to remove <strong>"{itemToDelete?.name}"</strong> from hostel facilities?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 600, color: '#64748B', borderColor: '#E2E8F0' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteFacility}
            variant="contained"
            color="error"
            disabled={deleting}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '10px',
              bgcolor: '#EF4444',
              '&:hover': { bgcolor: '#DC2626' }
            }}
          >
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
