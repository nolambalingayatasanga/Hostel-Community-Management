import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
  Modal,
  Checkbox,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Breadcrumbs,
  Link,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Avatar,
  Skeleton
} from '@mui/material';
import {
  AddPhotoAlternate as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  PhotoCamera as CameraIcon,
  CloudUpload as UploadIcon,
  Check as CheckIcon,
  PlayArrow as PlayArrowIcon,
  GetApp as DownloadIcon,
  Folder as FolderIcon,
  CreateNewFolder as CreateNewFolderIcon,
  MoreVert as MoreVertIcon,
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Collections as CollectionsIcon,
  Image as ImageIcon,
  FolderOpen as FolderOpenIcon
} from '@mui/icons-material';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

const FOLDER_COLORS = [
  '#0F9D58', '#0088ff', '#EA4335', '#FBBC04', 
  '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'
];

const Gallery = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // Tab State: 'all' | 'folders'
  const [activeTab, setActiveTab] = useState('all');
  
  // Active Folder State (null if viewing root folders list)
  const [currentFolder, setCurrentFolder] = useState(null);

  // Photos & Infinite Scroll Pagination State
  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photosLoadingMore, setPhotosLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPhotos, setTotalPhotos] = useState(0);

  // Folders State
  const [folders, setFolders] = useState([]);
  const [foldersLoading, setFoldersLoading] = useState(false);

  // Selection & UI State
  const [selectedIds, setSelectedIds] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Upload Dialog State
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [uploadFolderId, setUploadFolderId] = useState('');
  const [uploading, setUploading] = useState(false);

  // Folder Dialog State (Create / Edit) - No description input as requested
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderDialogMode, setFolderDialogMode] = useState('create'); // 'create' | 'edit'
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState('#0F9D58');
  const [folderSubmitting, setFolderSubmitting] = useState(false);

  // Folder Action Menu State
  const [folderMenuAnchor, setFolderMenuAnchor] = useState(null);
  const [activeMenuFolder, setActiveMenuFolder] = useState(null);

  // Delete Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'photo'|'bulk-photos'|'folder', id: string, name?: string }
  const [deleting, setDeleting] = useState(false);

  // Lightbox Modal State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null);

  // Sentinel for Infinite Scrolling
  const observerTarget = useRef(null);

  const isAdminOrChairperson = ['ADMIN', 'CHAIRPERSON'].includes(user?.role);

  // -------------------------------------------------------------
  // 1. Fetch Folders
  // -------------------------------------------------------------
  const fetchFolders = async () => {
    try {
      setFoldersLoading(true);
      const res = await API.get('/gallery/folders');
      if (res.data?.success) {
        setFolders(res.data.data.folders || []);
      }
    } catch (err) {
      enqueueSnackbar('Failed to fetch folders.', { variant: 'error' });
    } finally {
      setFoldersLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 2. Fetch Photos (with 30-item pagination & folder scoping)
  // -------------------------------------------------------------
  const fetchPhotos = useCallback(async (pageNum = 1, folderId = null, append = false) => {
    try {
      if (pageNum === 1) {
        setPhotosLoading(true);
      } else {
        setPhotosLoadingMore(true);
      }

      const params = {
        page: pageNum,
        limit: 30
      };

      if (folderId) {
        params.folderId = folderId;
      }

      const res = await API.get('/gallery', { params });
      if (res.data?.success) {
        const { photos: fetchedPhotos, pagination } = res.data.data;
        
        if (append) {
          setPhotos(prev => [...prev, ...fetchedPhotos]);
        } else {
          setPhotos(fetchedPhotos || []);
        }

        setPage(pagination.page);
        setHasMore(pagination.hasMore);
        setTotalPhotos(pagination.total);
      }
    } catch (err) {
      enqueueSnackbar('Failed to load gallery photos.', { variant: 'error' });
    } finally {
      setPhotosLoading(false);
      setPhotosLoadingMore(false);
    }
  }, [enqueueSnackbar]);

  // Initial load & Tab / Folder change triggers
  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    setSelectedIds([]);
    setPage(1);
    setHasMore(true);

    if (activeTab === 'all') {
      fetchPhotos(1, null, false);
    } else if (activeTab === 'folders') {
      if (currentFolder) {
        fetchPhotos(1, currentFolder._id, false);
      } else {
        fetchFolders();
      }
    }
  }, [activeTab, currentFolder, fetchPhotos]);

  // -------------------------------------------------------------
  // 3. Infinite Scroll Intersection Observer
  // -------------------------------------------------------------
  useEffect(() => {
    if (activeTab === 'folders' && !currentFolder) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !photosLoading && !photosLoadingMore) {
          const nextPage = page + 1;
          const targetFolderId = currentFolder ? currentFolder._id : null;
          fetchPhotos(nextPage, targetFolderId, true);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    const currentElem = observerTarget.current;
    if (currentElem) {
      observer.observe(currentElem);
    }

    return () => {
      if (currentElem) {
        observer.unobserve(currentElem);
      }
    };
  }, [hasMore, photosLoading, photosLoadingMore, page, activeTab, currentFolder, fetchPhotos]);

  // -------------------------------------------------------------
  // 4. Folder Navigation Handlers
  // -------------------------------------------------------------
  const handleOpenFolder = (folder) => {
    setCurrentFolder(folder);
  };

  const handleBackToFolders = () => {
    setCurrentFolder(null);
    fetchFolders();
  };

  const handleTabChange = (event, newTab) => {
    setActiveTab(newTab);
    if (newTab === 'folders') {
      setCurrentFolder(null);
    }
  };

  // -------------------------------------------------------------
  // 5. Folder CRUD Dialog & Actions (No description field)
  // -------------------------------------------------------------
  const handleOpenCreateFolderDialog = () => {
    setFolderDialogMode('create');
    setFolderName('');
    setFolderColor('#0F9D58');
    setEditingFolderId(null);
    setFolderDialogOpen(true);
  };

  const handleOpenEditFolderDialog = (folder) => {
    setFolderDialogMode('edit');
    setEditingFolderId(folder._id);
    setFolderName(folder.name || '');
    setFolderColor(folder.color || '#0F9D58');
    setFolderMenuAnchor(null);
    setFolderDialogOpen(true);
  };

  const handleFolderSubmit = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) {
      enqueueSnackbar('Please enter a folder name.', { variant: 'warning' });
      return;
    }

    try {
      setFolderSubmitting(true);
      if (folderDialogMode === 'create') {
        const res = await API.post('/gallery/folders', {
          name: folderName.trim(),
          color: folderColor
        });
        if (res.data?.success) {
          enqueueSnackbar('Folder created successfully!', { variant: 'success' });
          setFolders(prev => [res.data.data.folder, ...prev]);
          setFolderDialogOpen(false);
        }
      } else {
        const res = await API.put(`/gallery/folders/${editingFolderId}`, {
          name: folderName.trim(),
          color: folderColor
        });
        if (res.data?.success) {
          enqueueSnackbar('Folder updated successfully!', { variant: 'success' });
          const updated = res.data.data.folder;
          setFolders(prev => prev.map(f => (f._id === updated._id ? { ...f, ...updated } : f)));
          if (currentFolder && currentFolder._id === updated._id) {
            setCurrentFolder(prev => ({ ...prev, ...updated }));
          }
          setFolderDialogOpen(false);
        }
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to save folder.';
      enqueueSnackbar(errMsg, { variant: 'error' });
    } finally {
      setFolderSubmitting(false);
    }
  };

  const handleDeleteFolderClick = (folder) => {
    setFolderMenuAnchor(null);
    setDeleteTarget({ type: 'folder', id: folder._id, name: folder.name, count: folder.itemCount || 0 });
    setDeleteConfirmOpen(true);
  };

  // -------------------------------------------------------------
  // 6. Media Uploading (Supports Folder Association)
  // -------------------------------------------------------------
  const handleOpenUpload = () => {
    setSelectedFiles([]);
    setFilePreviews([]);
    if (currentFolder) {
      setUploadFolderId(currentFolder._id);
    } else {
      setUploadFolderId('');
    }
    setUploadOpen(true);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setFilePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveFileAt = (index) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== index));
    setFilePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      enqueueSnackbar('Please select at least one file to upload.', { variant: 'warning' });
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      const targetFolder = uploadFolderId || (currentFolder ? currentFolder._id : null);

      const uploadPromises = selectedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('photo', file);
        if (targetFolder) {
          formData.append('folderId', targetFolder);
        }
        
        const res = await API.post('/gallery', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(r => r?.success).map(r => r.data.photo);
      const failedCount = results.length - successfulUploads.length;

      if (successfulUploads.length > 0) {
        const successMsg = failedCount > 0
          ? `Uploaded ${successfulUploads.length} item(s). Failed: ${failedCount}.`
          : `Successfully uploaded all ${successfulUploads.length} item(s)!`;
        
        enqueueSnackbar(successMsg, { variant: 'success' });

        if (activeTab === 'all' || (activeTab === 'folders' && currentFolder && targetFolder === currentFolder._id)) {
          setPhotos(prev => [...successfulUploads, ...prev]);
          setTotalPhotos(prev => prev + successfulUploads.length);
        }

        fetchFolders();

        setUploadOpen(false);
        filePreviews.forEach(url => URL.revokeObjectURL(url));
        setSelectedFiles([]);
        setFilePreviews([]);
      } else {
        enqueueSnackbar('Failed to upload media. Please try again.', { variant: 'error' });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to upload media.';
      enqueueSnackbar(errMsg, { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  // -------------------------------------------------------------
  // 7. Media Deletion & Bulk Deletion
  // -------------------------------------------------------------
  const handleDeletePhotoClick = (id) => {
    setDeleteTarget({ type: 'photo', id });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteSelectedPhotosClick = () => {
    if (selectedIds.length === 0) return;
    setDeleteTarget({ type: 'bulk-photos', ids: selectedIds });
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      if (deleteTarget.type === 'folder') {
        const res = await API.delete(`/gallery/folders/${deleteTarget.id}`);
        if (res.data?.success) {
          enqueueSnackbar('Folder and its media deleted successfully.', { variant: 'success' });
          setFolders(prev => prev.filter(f => f._id !== deleteTarget.id));
          if (currentFolder && currentFolder._id === deleteTarget.id) {
            setCurrentFolder(null);
          }
        }
      } else if (deleteTarget.type === 'photo') {
        const res = await API.delete(`/gallery/${deleteTarget.id}`);
        if (res.data?.success) {
          enqueueSnackbar('Media item deleted successfully.', { variant: 'success' });
          setPhotos(prev => prev.filter(p => p._id !== deleteTarget.id));
          setSelectedIds(prev => prev.filter(id => id !== deleteTarget.id));
          setTotalPhotos(prev => Math.max(0, prev - 1));
          fetchFolders();
        }
      } else if (deleteTarget.type === 'bulk-photos') {
        const idsToDelete = deleteTarget.ids || [];
        const deletePromises = idsToDelete.map(id =>
          API.delete(`/gallery/${id}`)
            .then(() => ({ id, success: true }))
            .catch(() => ({ id, success: false }))
        );

        const results = await Promise.all(deletePromises);
        const successfulIds = results.filter(r => r.success).map(r => r.id);
        const failedCount = results.length - successfulIds.length;

        if (successfulIds.length > 0) {
          setPhotos(prev => prev.filter(p => !successfulIds.includes(p._id)));
          setSelectedIds(prev => prev.filter(id => !successfulIds.includes(id)));
          setTotalPhotos(prev => Math.max(0, prev - successfulIds.length));
          fetchFolders();

          if (failedCount > 0) {
            enqueueSnackbar(`Deleted ${successfulIds.length} items. Failed to delete ${failedCount} items.`, { variant: 'warning' });
          } else {
            enqueueSnackbar(`Successfully deleted ${successfulIds.length} media item(s).`, { variant: 'success' });
          }
        }
      }
      setDeleteConfirmOpen(false);
    } catch (err) {
      enqueueSnackbar('Failed to delete item(s).', { variant: 'error' });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // -------------------------------------------------------------
  // 8. Selection & Bulk Download
  // -------------------------------------------------------------
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(photos.map(p => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDownloadSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      let index = 1;
      for (const id of selectedIds) {
        const photo = photos.find(p => p._id === id);
        if (!photo) continue;

        const extension = photo.resourceType === 'video' ? 'mp4' : 'jpg';
        const filename = selectedIds.length > 1 ? `KSH_Gallery_${index}.${extension}` : `KSH_Gallery.${extension}`;
        index++;

        try {
          const response = await fetch(photo.url, { mode: 'cors' });
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } catch (corsErr) {
          const a = document.createElement('a');
          a.href = photo.url;
          a.target = '_blank';
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }
      enqueueSnackbar(`Downloaded ${selectedIds.length} item(s).`, { variant: 'success' });
      setSelectedIds([]);
    } catch (err) {
      enqueueSnackbar('An error occurred during download.', { variant: 'error' });
    }
  };

  const handleOpenLightbox = (photo) => {
    setActivePhoto(photo);
    setLightboxOpen(true);
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return 'Recent';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    });
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 120px)', pb: 4 }}>
      {/* ------------------------------------------------------------- */}
      {/* Top Header & Navigation Bar */}
      {/* ------------------------------------------------------------- */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          gap: 2,
          mb: 3 
        }}
      >
        {/* Left Side: Tabs or Folder Breadcrumbs */}
        {activeTab === 'folders' && currentFolder ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton 
              onClick={handleBackToFolders}
              sx={{ 
                bgcolor: '#F1F5F9', 
                color: '#1E293B',
                '&:hover': { bgcolor: '#E2E8F0' } 
              }}
              size="small"
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>

            <Breadcrumbs separator="/" aria-label="breadcrumb">
              <Link
                component="button"
                variant="h6"
                onClick={handleBackToFolders}
                underline="hover"
                sx={{ 
                  color: '#64748B', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <FolderIcon sx={{ fontSize: 20 }} />
                Folders
              </Link>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700, 
                    color: '#1E293B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75
                  }}
                >
                  <Box 
                    sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '4px', 
                      bgcolor: currentFolder.color || '#0F9D58' 
                    }} 
                  />
                  {currentFolder.name}
                </Typography>
                <Chip 
                  label={`${totalPhotos} items`} 
                  size="small" 
                  sx={{ 
                    fontWeight: 600, 
                    bgcolor: '#F1F5F9', 
                    color: '#475569',
                    fontSize: '12px' 
                  }} 
                />
              </Box>
            </Breadcrumbs>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                minHeight: '44px',
                bgcolor: '#F1F5F9',
                p: '4px',
                borderRadius: '16px',
                '& .MuiTabs-indicator': {
                  display: 'none'
                }
              }}
            >
              <Tab
                value="all"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CollectionsIcon sx={{ fontSize: 18 }} />
                    <span>All Media</span>
                  </Box>
                }
                sx={{
                  minHeight: '36px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '14px',
                  textTransform: 'none',
                  color: '#64748B',
                  px: 2.5,
                  transition: 'all 0.2s',
                  '&.Mui-selected': {
                    bgcolor: '#FFFFFF',
                    color: '#0088ff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }
                }}
              />
              <Tab
                value="folders"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FolderIcon sx={{ fontSize: 18 }} />
                    <span>Folders</span>
                    {folders.length > 0 && (
                      <Chip
                        label={folders.length}
                        size="small"
                        sx={{
                          height: '20px',
                          fontSize: '11px',
                          fontWeight: 700,
                          bgcolor: activeTab === 'folders' ? 'rgba(0, 136, 255, 0.1)' : '#E2E8F0',
                          color: activeTab === 'folders' ? '#0088ff' : '#64748B'
                        }}
                      />
                    )}
                  </Box>
                }
                sx={{
                  minHeight: '36px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '14px',
                  textTransform: 'none',
                  color: '#64748B',
                  px: 2.5,
                  transition: 'all 0.2s',
                  '&.Mui-selected': {
                    bgcolor: '#FFFFFF',
                    color: '#0088ff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }
                }}
              />
            </Tabs>
          </Box>
        )}

        {/* Right Side: Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {selectedIds.length > 0 && (
            <>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadSelected}
                sx={{
                  borderRadius: '24px',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: '#D0D5DD',
                  color: '#344054',
                  '&:hover': { borderColor: '#D0D5DD', backgroundColor: '#F9FAFB' }
                }}
              >
                Download ({selectedIds.length})
              </Button>

              {isAdminOrChairperson && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteSelectedPhotosClick}
                  sx={{ borderRadius: '24px', textTransform: 'none', fontWeight: 600 }}
                >
                  Delete ({selectedIds.length})
                </Button>
              )}
            </>
          )}

          {isAdminOrChairperson && (
            <>
              {/* If on Folders tab (root), show "New folder" */}
              {activeTab === 'folders' && !currentFolder && (
                <Button
                  variant="outlined"
                  startIcon={<CreateNewFolderIcon />}
                  onClick={handleOpenCreateFolderDialog}
                  sx={{
                    borderRadius: '8px',
                    borderColor: '#0088ff',
                    color: '#0088ff',
                    fontWeight: 600,
                    textTransform: 'none',
                    px: 2.5,
                    py: 0.9,
                    '&:hover': {
                      borderColor: '#0077ee',
                      backgroundColor: 'rgba(0, 136, 255, 0.04)'
                    }
                  }}
                >
                  New folder
                </Button>
              )}

              {/* Add photos button */}
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenUpload}
                sx={{
                  background: '#0088ff',
                  color: '#fff',
                  borderRadius: '8px',
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    background: '#0077ee',
                    boxShadow: 'none'
                  }
                }}
              >
Add photos
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: ALL MEDIA (Infinite Scroll Pagination: 30 items) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'all' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Top selection bar */}
          {photos.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Checkbox
                  checked={photos.length > 0 && selectedIds.length === photos.length}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < photos.length}
                  onChange={handleSelectAll}
                  sx={{ color: '#667085', '&.Mui-checked': { color: '#0088ff' } }}
                />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#344054' }}>
                  Select all ({photos.length})
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                Showing {photos.length} of {totalPhotos} media assets
              </Typography>
            </Box>
          )}

          {/* Photos Grid Container */}
          <Box sx={{ flex: 1 }}>
            {photosLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
                <CircularProgress sx={{ color: '#0088ff' }} />
              </Box>
            ) : photos.length === 0 ? (
              <EmptyGalleryCard 
                isAdmin={isAdminOrChairperson} 
                onUpload={handleOpenUpload} 
                title="No Media Found"
                subtitle="Upload media to share them with your community."
              />
            ) : (
              <Grid container spacing={2.5}>
                {photos.map((photo) => renderPhotoCard(photo))}
              </Grid>
            )}
          </Box>

          {/* Infinite Scroll Bottom Sentinel & Loader (Pushed to bottom of page) */}
          <Box ref={observerTarget} sx={{ mt: 'auto', pt: 6, pb: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            {photosLoadingMore && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#0088ff' }}>
                <CircularProgress size={22} color="inherit" />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Loading more assets...
                </Typography>
              </Box>
            )}
            {!hasMore && photos.length > 0 && !photosLoading && (
              <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500, textAlign: 'center' }}>
                You've reached the end of the gallery.
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: FOLDERS (Exact Google Drive Layout) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'folders' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* View 2A: Root Folders Grid */}
          {!currentFolder ? (
            <Box sx={{ flex: 1 }}>
              {foldersLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
                  <CircularProgress sx={{ color: '#0088ff' }} />
                </Box>
              ) : folders.length === 0 ? (
                <EmptyGalleryCard
                  isAdmin={isAdminOrChairperson}
                  onUpload={handleOpenCreateFolderDialog}
                  buttonLabel="Create Folder"
                  title="No Folders Found"
                  subtitle="Organize your events and memories by creating folders."
                  icon={<FolderIcon sx={{ fontSize: 44, color: '#0F9D58' }} />}
                />
              ) : (
                <Grid container spacing={3}>
                  {folders.map((folder) => {
                    const folderColorHex = folder.color || '#0F9D58';
                    const creatorName = folder.createdBy?.name || 'Administrator';
                    const isSelf = user?._id === folder.createdBy?._id;
                    const shortDateText = formatShortDate(folder.updatedAt || folder.createdAt);
                    const fullDateText = formatFullDate(folder.createdAt);

                    return (
                      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={folder._id}>
                        <Card
                          onClick={() => handleOpenFolder(folder)}
                          sx={{
                            p: 2,
                            borderRadius: '18px',
                            cursor: 'pointer',
                            backgroundColor: '#EFF4FA', // Google Drive exact card background
                            border: '1px solid rgba(0, 0, 0, 0.05)',
                            boxShadow: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                              backgroundColor: '#E7EEF8',
                              '& .preview-media-content': {
                                filter: 'blur(5px) brightness(0.85)',
                                transform: 'scale(1.05)'
                              },
                              '& .folder-preview-overlay': {
                                opacity: 1
                              }
                            }
                          }}
                        >
                          {/* 1. Header: Folder Color Badge + Title + 3-Dots Menu */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: 1 }}>
                              {/* Selected Color Badge instead of generic icon */}
                              <Box
                                sx={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: '6px',
                                  bgcolor: folderColorHex,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  boxShadow: `0 2px 6px ${folderColorHex}40`
                                }}
                              >
                                <FolderIcon sx={{ color: '#FFFFFF', fontSize: 16 }} />
                              </Box>

                              {/* Title */}
                              <Typography
                                variant="subtitle1"
                                noWrap
                                sx={{
                                  fontWeight: 600,
                                  color: '#1F1F1F',
                                  fontSize: '15px',
                                  letterSpacing: '-0.01em'
                                }}
                              >
                                {folder.name}
                              </Typography>
                            </Box>

                            {isAdminOrChairperson && (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuFolder(folder);
                                  setFolderMenuAnchor(e.currentTarget);
                                }}
                                sx={{
                                  color: '#444746',
                                  p: 0.5,
                                  ml: 0.5,
                                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.06)' }
                                }}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>

                          {/* 2. Middle Inset Preview Box with Hover Overlay */}
                          <Box
                            sx={{
                              width: '100%',
                              height: 155,
                              backgroundColor: '#FFFFFF',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              border: '1px solid rgba(0, 0, 0, 0.04)',
                              position: 'relative'
                            }}
                          >
                            {/* Inner Preview Content (Blurs on Hover) */}
                            <Box
                              className="preview-media-content"
                              sx={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                              }}
                            >
                              {folder.coverUrl ? (
                                folder.coverResourceType === 'video' ? (
                                  <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                                    <video
                                      src={folder.coverUrl}
                                      preload="metadata"
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block'
                                      }}
                                    />
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#FFFFFF'
                                      }}
                                    >
                                      <PlayArrowIcon sx={{ fontSize: 24 }} />
                                    </Box>
                                  </Box>
                                ) : (
                                  <img
                                    src={folder.coverUrl}
                                    alt={folder.name}
                                    loading="lazy"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      display: 'block'
                                    }}
                                  />
                                )
                              ) : (
                                /* Preload Skeleton of Media when no image uploaded */
                                <Box 
                                  sx={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    p: 2, 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    justifyContent: 'space-between',
                                    bgcolor: '#FAFAFA'
                                  }}
                                >
                                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                    <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: '8px', bgcolor: '#EBEFF5' }} />
                                    <Box sx={{ flex: 1 }}>
                                      <Skeleton variant="text" width="70%" height={16} sx={{ bgcolor: '#EBEFF5' }} />
                                      <Skeleton variant="text" width="40%" height={12} sx={{ bgcolor: '#F0F4F8' }} />
                                    </Box>
                                  </Box>
                                  
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Skeleton variant="rectangular" width="100%" height={8} sx={{ borderRadius: '4px', bgcolor: '#F0F4F8' }} />
                                    <Skeleton variant="rectangular" width="85%" height={8} sx={{ borderRadius: '4px', bgcolor: '#F0F4F8' }} />
                                    <Skeleton variant="rectangular" width="60%" height={8} sx={{ borderRadius: '4px', bgcolor: '#F0F4F8' }} />
                                  </Box>

                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Skeleton variant="text" width={50} height={12} sx={{ bgcolor: '#EBEFF5' }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.4 }}>
                                      <ImageIcon sx={{ fontSize: 16, color: folderColorHex }} />
                                      <Typography variant="caption" sx={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>
                                        Empty
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              )}
                            </Box>

                            {/* Hover Overlay Above Blurred Preview */}
                            <Box
                              className="folder-preview-overlay"
                              sx={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: 3,
                                bgcolor: 'rgba(15, 23, 42, 0.65)',
                                backdropFilter: 'blur(2px)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                p: 2,
                                textAlign: 'center',
                                opacity: 0,
                                transition: 'opacity 0.25s ease',
                                pointerEvents: 'none'
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: 700,
                                  color: '#FFFFFF',
                                  fontSize: '14px',
                                  textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                                  mb: 0.5,
                                  lineHeight: 1.3
                                }}
                              >
                                Created by {creatorName}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'rgba(255, 255, 255, 0.9)',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  textShadow: '0 1px 3px rgba(0,0,0,0.6)'
                                }}
                              >
                                {fullDateText}
                              </Typography>
                            </Box>
                          </Box>

                          {/* 3. Footer: Avatar + Date Info */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, pt: 0.25, minHeight: '28px' }}>
                            <Avatar
                              src={folder.createdBy?.profilePhoto?.url || ''}
                              sx={{
                                width: 26,
                                height: 26,
                                fontSize: '11px',
                                fontWeight: 600,
                                bgcolor: folderColorHex,
                                color: '#FFFFFF'
                              }}
                            >
                              {creatorName.charAt(0).toUpperCase()}
                            </Avatar>

                            <Typography
                              variant="body2"
                              noWrap
                              sx={{
                                fontSize: '13px',
                                color: '#444746',
                                fontWeight: 400
                              }}
                            >
                              {isSelf ? 'You opened' : creatorName} • {shortDateText}
                            </Typography>
                          </Box>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
          ) : (
            /* View 2B: Inside Folder Photos View */
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {photos.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Checkbox
                      checked={photos.length > 0 && selectedIds.length === photos.length}
                      indeterminate={selectedIds.length > 0 && selectedIds.length < photos.length}
                      onChange={handleSelectAll}
                      sx={{ color: '#667085', '&.Mui-checked': { color: '#0088ff' } }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#344054' }}>
                      Select all
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                    Showing {photos.length} of {totalPhotos} items
                  </Typography>
                </Box>
              )}

              {/* Photos Grid inside Folder */}
              <Box sx={{ flex: 1 }}>
                {photosLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
                    <CircularProgress sx={{ color: '#0088ff' }} />
                  </Box>
                ) : photos.length === 0 ? (
                  <EmptyGalleryCard
                    isAdmin={isAdminOrChairperson}
                    onUpload={handleOpenUpload}
                    title={`Folder "${currentFolder.name}" is Empty`}
                    subtitle="Add photos and videos directly into this folder."
                    buttonLabel="Upload to Folder"
                  />
                ) : (
                  <Grid container spacing={2.5}>
                    {photos.map((photo) => renderPhotoCard(photo))}
                  </Grid>
                )}
              </Box>

              {/* Infinite Scroll Sentinel inside Folder (Pushed to bottom of page) */}
              <Box ref={observerTarget} sx={{ mt: 'auto', pt: 6, pb: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                {photosLoadingMore && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#0088ff' }}>
                    <CircularProgress size={22} color="inherit" />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Loading more items in {currentFolder.name}...
                    </Typography>
                  </Box>
                )}
                {!hasMore && photos.length > 0 && !photosLoading && (
                  <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500, textAlign: 'center' }}>
                    All items in this folder loaded.
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Folder Action Context Menu */}
      {/* ------------------------------------------------------------- */}
      <Menu
        anchorEl={folderMenuAnchor}
        open={Boolean(folderMenuAnchor)}
        onClose={() => setFolderMenuAnchor(null)}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            minWidth: 160
          }
        }}
      >
        <MenuItem
          onClick={() => {
            if (activeMenuFolder) handleOpenEditFolderDialog(activeMenuFolder);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" sx={{ color: '#475569' }} />
          </ListItemIcon>
          <ListItemText primary="Edit Folder" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (activeMenuFolder) handleDeleteFolderClick(activeMenuFolder);
          }}
          sx={{ color: '#EF4444' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: '#EF4444' }} />
          </ListItemIcon>
          <ListItemText primary="Delete Folder" />
        </MenuItem>
      </Menu>

      {/* ------------------------------------------------------------- */}
      {/* Create / Edit Folder Dialog (No description input) */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        open={folderDialogOpen}
        onClose={() => !folderSubmitting && setFolderDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, pt: 3, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
            {folderDialogMode === 'create' ? 'New Folder' : 'Edit Folder'}
          </Typography>
          <IconButton 
            onClick={() => !folderSubmitting && setFolderDialogOpen(false)}
            size="small"
            sx={{ bgcolor: '#F1F5F9' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <form onSubmit={handleFolderSubmit}>
          <DialogContent sx={{ px: 3, py: 2 }}>
            <TextField
              label="Folder Name"
              fullWidth
              autoFocus
              required
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g. Side bar"
              sx={{ mb: 3 }}
            />

            <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', display: 'block', mb: 1.5 }}>
              Folder Color
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {FOLDER_COLORS.map((col) => (
                <Box
                  key={col}
                  onClick={() => setFolderColor(col)}
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: '8px',
                    bgcolor: col,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: folderColor === col ? '3px solid #1E293B' : '2px solid transparent',
                    boxShadow: folderColor === col ? `0 4px 10px ${col}60` : 'none',
                    transition: 'all 0.15s ease',
                    '&:hover': { transform: 'scale(1.15)' }
                  }}
                >
                  {folderColor === col && <CheckIcon sx={{ color: '#fff', fontSize: 18 }} />}
                </Box>
              ))}
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3, display: 'flex', gap: 1.5 }}>
            <Button
              onClick={() => setFolderDialogOpen(false)}
              color="inherit"
              disabled={folderSubmitting}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={folderSubmitting || !folderName.trim()}
              sx={{
                background: '#0088ff',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                px: 3,
                '&:hover': { background: '#0077ee' }
              }}
            >
              {folderSubmitting ? (
                <CircularProgress size={20} sx={{ color: '#fff' }} />
              ) : folderDialogMode === 'create' ? (
                'Create Folder'
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* Upload Media Dialog */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        open={uploadOpen}
        onClose={() => !uploading && setUploadOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, pt: 3, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
            Upload Media
          </Typography>
          <IconButton 
            onClick={() => !uploading && setUploadOpen(false)}
            disabled={uploading}
            size="small"
            sx={{ bgcolor: '#F1F5F9' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <form onSubmit={handleUploadSubmit}>
          <DialogContent sx={{ px: 3, py: 2 }}>
            {/* Target Folder Selector */}
            <FormControl fullWidth sx={{ mb: 2.5 }} size="small">
              <InputLabel id="upload-folder-select-label">Destination Folder</InputLabel>
              <Select
                labelId="upload-folder-select-label"
                value={uploadFolderId}
                label="Destination Folder"
                onChange={(e) => setUploadFolderId(e.target.value)}
              >
                <MenuItem value="">
                  <em>General Gallery (No specific folder)</em>
                </MenuItem>
                {folders.map((f) => (
                  <MenuItem key={f._id} value={f._id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: f.color || '#0F9D58' }} />
                      <span>{f.name}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* File Drag/Select Box */}
            <Box
              sx={{
                display: 'block',
                border: '2px dashed #D0D5DD',
                borderRadius: '16px',
                p: 3.5,
                textAlign: 'center',
                backgroundColor: '#F8FAFC',
                mb: 2,
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'rgba(0, 136, 255, 0.02)',
                  borderColor: '#0088ff',
                  '& .upload-icon-box': {
                    transform: 'scale(1.05) translateY(-2px)',
                    bgcolor: 'rgba(0, 136, 255, 0.1)',
                    color: '#0088ff'
                  }
                }
              }}
              component="label"
            >
              <input 
                type="file" 
                accept="image/*,video/*" 
                multiple 
                style={{ display: 'none' }} 
                onChange={handleFileChange} 
                disabled={uploading} 
              />
              
              {filePreviews.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                      gap: 1.5,
                      maxHeight: '240px',
                      overflowY: 'auto',
                      p: 1,
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      backgroundColor: '#F8FAFC'
                    }}
                  >
                    {selectedFiles.map((file, idx) => {
                      const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|ogg|mov)$/i);
                      return (
                        <Box
                          key={idx}
                          sx={{
                            position: 'relative',
                            width: '100%',
                            paddingBottom: '100%',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            bgcolor: '#000',
                            border: '1px solid #E2E8F0'
                          }}
                        >
                          {isVideo ? (
                            <video
                              src={filePreviews[idx]}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <img
                              src={filePreviews[idx]}
                              alt={`preview-${idx}`}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          )}
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveFileAt(idx);
                            }}
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              color: '#fff',
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              p: 0.5,
                              '&:hover': { backgroundColor: 'rgba(0,0,0,0.9)' }
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Box>
                      );
                    })}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                      {selectedFiles.length} file(s) selected
                    </Typography>
                    <Button
                      variant="text"
                      size="small"
                      component="span"
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      + Add more
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1.5 }}>
                  <Box
                    className="upload-icon-box"
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      bgcolor: '#F1F5F9',
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1.5,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <UploadIcon sx={{ fontSize: 26 }} />
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#334155', mb: 0.5 }}>
                    Click to select files
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                    Images & Videos (Supports bulk upload)
                  </Typography>
                </Box>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3, display: 'flex', gap: 1.5 }}>
            <Button 
              onClick={() => setUploadOpen(false)} 
              color="inherit" 
              disabled={uploading}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={uploading || selectedFiles.length === 0}
              sx={{
                background: '#0088ff',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '10px',
                px: 3,
                py: 1,
                '&:hover': { background: '#0077ee' }
              }}
            >
              {uploading ? (
                <CircularProgress size={20} sx={{ color: '#fff' }} />
              ) : (
                `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* Delete Confirmation Dialog */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !deleting && setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em', pt: 3 }}>
          {deleteTarget?.type === 'folder' ? 'Delete Folder?' : 'Confirm Delete'}
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="body1" sx={{ color: '#64748B', lineHeight: 1.5 }}>
            {deleteTarget?.type === 'folder'
              ? `Are you sure you want to delete folder "${deleteTarget.name}"? All ${deleteTarget.count || 0} media assets inside this folder will also be permanently deleted.`
              : deleteTarget?.type === 'bulk-photos'
              ? `Are you sure you want to delete the ${deleteTarget.ids?.length} selected media assets?`
              : 'Are you sure you want to permanently delete this media item? This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, display: 'flex', gap: 1.5 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            color="inherit"
            disabled={deleting}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={executeDelete}
            variant="contained"
            color="error"
            disabled={deleting}
            sx={{
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '10px',
              px: 3,
              minWidth: 80
            }}
          >
            {deleting ? (
              <CircularProgress size={20} sx={{ color: '#fff' }} />
            ) : (
              'Delete'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* Lightbox Modal with Fixed Top-Right Close Button */}
      {/* ------------------------------------------------------------- */}
      <Modal
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.94)',
          backdropFilter: 'blur(8px)',
          p: 2
        }}
      >
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', outline: 'none' }}>
          {/* Always Fixed in Top Right of Screen */}
          <IconButton
            onClick={() => setLightboxOpen(false)}
            sx={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 1600,
              color: '#FFFFFF',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              width: 44,
              height: 44,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                transform: 'scale(1.08)'
              }
            }}
          >
            <CloseIcon sx={{ fontSize: 24 }} />
          </IconButton>

          {activePhoto && (
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{
                maxWidth: '92vw',
                maxHeight: '88vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none'
              }}
            >
              {activePhoto.resourceType === 'video' ? (
                <video
                  src={activePhoto.url}
                  controls
                  autoPlay
                  style={{
                    maxWidth: '92vw',
                    maxHeight: '88vh',
                    borderRadius: '12px',
                    display: 'block',
                    boxShadow: '0 12px 48px rgba(0,0,0,0.6)'
                  }}
                />
              ) : (
                <img
                  src={activePhoto.url}
                  alt={activePhoto.caption || 'Lightbox'}
                  style={{
                    maxWidth: '92vw',
                    maxHeight: '88vh',
                    objectFit: 'contain',
                    borderRadius: '12px',
                    display: 'block',
                    boxShadow: '0 12px 48px rgba(0,0,0,0.6)'
                  }}
                />
              )}
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );

  // -------------------------------------------------------------
  // Helper Component: Render Single Photo Card
  // -------------------------------------------------------------
  function renderPhotoCard(photo) {
    const isSelected = selectedIds.includes(photo._id);
    return (
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={photo._id}>
        <Box sx={{ width: '100%', position: 'relative', pb: '75%' }}>
          <Card
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              borderRadius: '12px',
              cursor: 'pointer',
              backgroundColor: '#F8FAFC',
              border: '1px solid #EAECF0',
              boxShadow: '0 1px 3px rgba(16, 24, 40, 0.1)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: '0 10px 15px -3px rgba(16,24,40,0.1), 0 4px 6px -2px rgba(16,24,40,0.05)',
                '& .hover-overlay': { opacity: 1 }
              }
            }}
          >
            {/* Media Content */}
            <Box
              onClick={() => handleOpenLightbox(photo)}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
            >
              {photo.resourceType === 'video' ? (
                <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                  <video
                    src={photo.url}
                    preload="metadata"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 0, 0, 0.55)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      backdropFilter: 'blur(2px)',
                      border: '1px solid rgba(255, 255, 255, 0.25)'
                    }}
                  >
                    <PlayArrowIcon sx={{ fontSize: 28 }} />
                  </Box>
                </Box>
              ) : (
                <img
                  src={photo.url}
                  alt={photo.caption || 'Gallery item'}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              )}
            </Box>

            {/* Folder badge if in "All" view and photo belongs to a folder */}
            {activeTab === 'all' && photo.folder && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  zIndex: 2,
                  bgcolor: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(4px)',
                  color: '#fff',
                  px: 1,
                  py: 0.3,
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '11px',
                  fontWeight: 600,
                  pointerEvents: 'none'
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '2px',
                    bgcolor: photo.folder.color || '#0F9D58'
                  }}
                />
                <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {photo.folder.name}
                </span>
              </Box>
            )}

            {/* Hover Overlay: Date & Uploader */}
            <Box
              className="hover-overlay"
              onClick={() => handleOpenLightbox(photo)}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 60%)',
                opacity: 0,
                transition: 'opacity 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                p: 2,
                pointerEvents: 'none'
              }}
            >
              <Typography variant="caption" sx={{ color: '#ccc', pointerEvents: 'none' }}>
                {new Date(photo.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </Typography>
            </Box>

            {/* Delete button - Top Right */}
            {isAdminOrChairperson && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePhotoClick(photo._id);
                }}
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  zIndex: 2,
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  color: '#FFFFFF',
                  '&:hover': {
                    backgroundColor: 'rgba(211, 47, 47, 0.9)'
                  },
                  width: 30,
                  height: 30
                }}
                size="small"
              >
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}

            {/* Selection Circle indicator - Bottom Right */}
            <Box
              onClick={(e) => handleToggleSelect(photo._id, e)}
              sx={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                zIndex: 2,
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: isSelected ? 'none' : '2px solid rgba(255, 255, 255, 0.85)',
                backgroundColor: isSelected ? '#0088ff' : 'rgba(0, 0, 0, 0.25)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.15s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  borderColor: '#FFFFFF',
                  backgroundColor: isSelected ? '#0088ff' : 'rgba(0, 0, 0, 0.45)'
                }
              }}
            >
              {isSelected && <CheckIcon sx={{ color: '#FFFFFF', fontSize: 16 }} />}
            </Box>
          </Card>
        </Box>
      </Grid>
    );
  }
};

// -------------------------------------------------------------
// Helper Component: Empty State Card
// -------------------------------------------------------------
function EmptyGalleryCard({ isAdmin, onUpload, title, subtitle, buttonLabel = 'Upload Media', icon }) {
  return (
    <Card
      sx={{
        p: 6,
        textAlign: 'center',
        backgroundColor: '#ffffff',
        border: '1px dashed #E2E8F0',
        borderRadius: '24px',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight:"70vh",
        m: 'auto',
      }}
    >
      {/* <Box
        sx={{
          width: 88,
          height: 88,
          borderRadius: '24px',
          border: '2px solid #F1F5F9',
          background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2.5
        }}
      >
        {icon || <CameraIcon sx={{ fontSize: 38, color: '#0088ff' }} />}
      </Box> */}

      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', mb: 1 }}>
        {title}
      </Typography>

      <Typography variant="body2" sx={{ color: '#64748B', maxWidth: 400, mb: 3 }}>
        {subtitle}
      </Typography>

      {isAdmin && (
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={onUpload}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            px: 3.5,
            py: 1.2,
            fontSize: '14px',
            background: '#0088ff',
            '&:hover': {
              background: '#0077ee'
            }
          }}
        >
          {buttonLabel}
        </Button>
      )}
    </Card>
  );
}

export default Gallery;
