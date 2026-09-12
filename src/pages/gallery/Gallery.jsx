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
  Skeleton,
  LinearProgress
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
import { useUploadQueue } from '../../context/UploadQueueContext';

const FOLDER_COLORS = [
  '#0F9D58', '#0088ff', '#EA4335', '#FBBC04',
  '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'
];

/**
 * Safely extracts parent folder ID whether populated as an object or stored as an ObjectId string
 */
const getParentId = (folder) => {
  if (!folder || !folder.parentFolder) return null;
  return typeof folder.parentFolder === 'object' ? folder.parentFolder._id : folder.parentFolder;
};

/**
 * Traverses upwards to compute the full breadcrumb trail from root down to activeFolder
 */
const getBreadcrumbs = (activeFolder, allFolders) => {
  if (!activeFolder) return [];
  const trail = [];
  let curr = activeFolder;
  const visited = new Set();
  while (curr && !visited.has(curr._id)) {
    visited.add(curr._id);
    trail.unshift(curr);
    const parentId = getParentId(curr);
    curr = parentId ? allFolders.find((f) => f._id === parentId) : null;
  }
  return trail;
};

/**
 * Builds a hierarchical list of folders with visual indentations for selection dropdowns
 */
const buildFolderTreeOptions = (allFolders) => {
  const root = allFolders.filter((f) => !getParentId(f));
  const options = [];

  const traverse = (folder, depth = 0, path = '') => {
    const currentPath = path ? `${path} / ${folder.name}` : folder.name;
    options.push({
      ...folder,
      depth,
      fullPath: currentPath,
    });
    const children = allFolders.filter((f) => getParentId(f) === folder._id);
    children.forEach((child) => traverse(child, depth + 1, currentPath));
  };

  root.forEach((r) => traverse(r, 0, ''));
  return options;
};

const Gallery = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const { enqueueFiles } = useUploadQueue();

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
  const [uploadProgress, setUploadProgress] = useState(0);

  // Folder Dialog State (Create / Edit)
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderDialogMode, setFolderDialogMode] = useState('create'); // 'create' | 'edit'
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState('#0F9D58');
  const [folderParentId, setFolderParentId] = useState(null);
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

  const isAdminOrWarden = ['ADMIN', 'WARDEN'].includes(user?.role);

  // Derived folder hierarchies
  const folderTrail = getBreadcrumbs(currentFolder, folders);
  const rootFolders = folders.filter((f) => !getParentId(f));
  const childFolders = currentFolder ? folders.filter((f) => getParentId(f) === currentFolder._id) : [];
  const folderTreeOptions = buildFolderTreeOptions(folders);

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

  // Real-time listener for background media uploads
  useEffect(() => {
    const handleMediaUploaded = (e) => {
      const { destinationType, destinationId, result } = e.detail || {};
      if (destinationType !== 'gallery') return;

      const newPhoto = result?.data?.photo;
      if (!newPhoto) return;

      const targetFolder = destinationId;
      const isCurrentFolderMatch =
        currentFolder && targetFolder && String(targetFolder) === String(currentFolder._id);

      if (activeTab === 'all' || (activeTab === 'folders' && isCurrentFolderMatch)) {
        setPhotos((prev) => [newPhoto, ...prev.filter((p) => p._id !== newPhoto._id)]);
        setTotalPhotos((prev) => prev + 1);
      }

      fetchFolders();
    };

    window.addEventListener('app:media-uploaded', handleMediaUploaded);
    return () => window.removeEventListener('app:media-uploaded', handleMediaUploaded);
  }, [activeTab, currentFolder, fetchFolders]);

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
    if (!currentFolder) return;
    const parentId = getParentId(currentFolder);
    if (parentId) {
      const parent = folders.find((f) => f._id === parentId);
      setCurrentFolder(parent || null);
    } else {
      setCurrentFolder(null);
    }
  };

  const handleTabChange = (event, newTab) => {
    setActiveTab(newTab);
    if (newTab === 'folders') {
      setCurrentFolder(null);
    }
  };

  // -------------------------------------------------------------
  // 5. Folder CRUD Dialog & Actions
  // -------------------------------------------------------------
  const handleOpenCreateFolderDialog = (parentId = null) => {
    setFolderDialogMode('create');
    setFolderName('');
    setFolderColor('#0F9D58');
    setEditingFolderId(null);
    setFolderParentId(parentId !== null ? parentId : (currentFolder ? currentFolder._id : null));
    setFolderDialogOpen(true);
  };

  const handleOpenCreateSubfolder = (folder) => {
    setFolderMenuAnchor(null);
    handleOpenCreateFolderDialog(folder._id);
  };

  const handleOpenEditFolderDialog = (folder) => {
    setFolderDialogMode('edit');
    setEditingFolderId(folder._id);
    setFolderName(folder.name || '');
    setFolderColor(folder.color || '#0F9D58');
    setFolderParentId(getParentId(folder));
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
        const payload = {
          name: folderName.trim(),
          color: folderColor
        };
        if (folderParentId) {
          payload.parentFolder = folderParentId;
        }

        const res = await API.post('/gallery/folders', payload);
        if (res.data?.success) {
          const createdFolder = res.data.data.folder;
          enqueueSnackbar(folderParentId ? 'Subfolder created successfully!' : 'Folder created successfully!', { variant: 'success' });
          setFolders((prev) => [createdFolder, ...prev]);

          // Update parent folder subfolderCount
          if (folderParentId) {
            setFolders((prev) =>
              prev.map((f) =>
                f._id === folderParentId ? { ...f, subfolderCount: (f.subfolderCount || 0) + 1 } : f
              )
            );
            if (currentFolder && currentFolder._id === folderParentId) {
              setCurrentFolder((prev) => ({ ...prev, subfolderCount: (prev.subfolderCount || 0) + 1 }));
            }
          }

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
          setFolders((prev) => prev.map((f) => (f._id === updated._id ? { ...f, ...updated } : f)));
          if (currentFolder && currentFolder._id === updated._id) {
            setCurrentFolder((prev) => ({ ...prev, ...updated }));
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
    setDeleteTarget({
      type: 'folder',
      id: folder._id,
      name: folder.name,
      count: folder.itemCount || 0,
      subfolderCount: folder.subfolderCount || 0
    });
    setDeleteConfirmOpen(true);
  };

  // -------------------------------------------------------------
  // 6. Media Uploading (Supports Folder Association)
  // -------------------------------------------------------------
  const handleOpenUpload = () => {
    setSelectedFiles([]);
    setFilePreviews([]);
    setUploadProgress(0);
    if (currentFolder) {
      setUploadFolderId(currentFolder._id);
    } else {
      setUploadFolderId('');
    }
    setUploadOpen(true);
  };

  const handleFileChange = (e) => {
    const rawFiles = Array.from(e.target.files);
    if (!rawFiles || rawFiles.length === 0) return;

    const MAX_IMAGE_SIZE = 9.8 * 1024 * 1024; // 9.8 MB (0.2 MB below Cloudinary's 10 MB limit)
    const MAX_VIDEO_SIZE = 99 * 1024 * 1024;  // 99 MB (within Cloudinary's 100 MB limit)

    const validFiles = [];
    for (const file of rawFiles) {
      const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|ogg)$/i);
      const isImage = file.type.startsWith('image/');

      if (!isImage && !isVideo) {
        enqueueSnackbar(`"${file.name}" is not a valid image or video.`, { variant: 'error' });
        continue;
      }
      if (isImage && file.size > MAX_IMAGE_SIZE) {
        enqueueSnackbar(
          `Image "${file.name}" exceeds 9.8 MB limit (kept 0.2 MB below Cloudinary's 10 MB limit). Selected size: ${(file.size / (1024 * 1024)).toFixed(2)} MB.`,
          { variant: 'error' }
        );
        continue;
      }
      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        enqueueSnackbar(
          `Video "${file.name}" exceeds 99 MB limit. Selected size: ${(file.size / (1024 * 1024)).toFixed(2)} MB.`,
          { variant: 'error' }
        );
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setFilePreviews(prev => [...prev, ...newPreviews]);
    }

    // Reset input value so same files can be re-selected if needed
    e.target.value = '';
  };

  const handleRemoveFileAt = (index) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== index));
    setFilePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      enqueueSnackbar('Please select at least one file to upload.', { variant: 'warning' });
      return;
    }

    const targetFolder = uploadFolderId || (currentFolder ? currentFolder._id : null);
    const destinationName = targetFolder
      ? `Folder: ${folders.find((f) => f._id === targetFolder)?.name || 'Selected'}`
      : 'General Gallery';

    const { queuedCount } = enqueueFiles(selectedFiles, {
      destinationType: 'gallery',
      destinationId: targetFolder,
      destinationName,
    });

    if (queuedCount > 0) {
      filePreviews.forEach((url) => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setFilePreviews([]);
      setUploadOpen(false);
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
          enqueueSnackbar('Folder, subfolders, and media deleted successfully.', { variant: 'success' });
          const deletedIds = res.data?.data?.deletedFolderIds || [deleteTarget.id];
          setFolders((prev) => prev.filter((f) => !deletedIds.includes(f._id)));
          if (currentFolder && deletedIds.includes(currentFolder._id)) {
            const parentId = getParentId(currentFolder);
            const parent = parentId && !deletedIds.includes(parentId) ? folders.find((f) => f._id === parentId) : null;
            setCurrentFolder(parent || null);
          }
          fetchFolders();
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
                onClick={() => setCurrentFolder(null)}
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
              {folderTrail.map((folderCrumb, idx) => {
                const isLast = idx === folderTrail.length - 1;
                if (isLast) {
                  return (
                    <Box key={folderCrumb._id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                            bgcolor: folderCrumb.color || '#0F9D58'
                          }}
                        />
                        {folderCrumb.name}
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
                  );
                }
                return (
                  <Link
                    key={folderCrumb._id}
                    component="button"
                    variant="h6"
                    onClick={() => setCurrentFolder(folderCrumb)}
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
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '3px',
                        bgcolor: folderCrumb.color || '#0F9D58'
                      }}
                    />
                    {folderCrumb.name}
                  </Link>
                );
              })}
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
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: '#D0D5DD',
                  color: '#344054',
                  '&:hover': { borderColor: '#D0D5DD', backgroundColor: '#F9FAFB' }
                }}
              >
                Download ({selectedIds.length})
              </Button>

              {isAdminOrWarden && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteSelectedPhotosClick}
                  sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                >
                  Delete ({selectedIds.length})
                </Button>
              )}
            </>
          )}

          {isAdminOrWarden && (
            <>
              {/* If on Folders tab, show "New folder" or "New subfolder" */}
              {activeTab === 'folders' && (
                <Button
                  variant="outlined"
                  startIcon={<CreateNewFolderIcon />}
                  onClick={() => handleOpenCreateFolderDialog(currentFolder ? currentFolder._id : null)}
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
                  {currentFolder ? 'New subfolder' : 'New folder'}
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
              {/* <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                Showing {photos.length} of {totalPhotos} media assets
              </Typography> */}
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
                isAdmin={isAdminOrWarden}
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
              ) : rootFolders.length === 0 ? (
                <EmptyGalleryCard
                  isAdmin={isAdminOrWarden}
                  onUpload={() => handleOpenCreateFolderDialog(null)}
                  buttonLabel="Create Folder"
                  title="No Folders Found"
                  subtitle="Organize your events and memories by creating folders."
                  icon={<FolderIcon sx={{ fontSize: 44, color: '#0F9D58' }} />}
                />
              ) : (
                <Grid container spacing={3}>
                  {rootFolders.map((folder) => renderFolderCard(folder))}
                </Grid>
              )}
            </Box>
          ) : (
            /* View 2B: Inside Folder View (Subfolders + Media) */
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {/* 1. Subfolders Section if any exist inside current folder */}
              {childFolders.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FolderIcon sx={{ fontSize: 20, color: '#64748B' }} />
                      Folders
                      <Chip label={childFolders.length} size="small" sx={{ height: 20, fontSize: '11px', fontWeight: 700, bgcolor: '#E2E8F0', color: '#475569' }} />
                    </Typography>
                    {isAdminOrWarden && (
                      <Button
                        size="small"
                        startIcon={<CreateNewFolderIcon fontSize="small" />}
                        onClick={() => handleOpenCreateFolderDialog(currentFolder._id)}
                        sx={{ textTransform: 'none', fontWeight: 600, color: '#0088ff' }}
                      >
                        New subfolder
                      </Button>
                    )}
                  </Box>
                  <Grid container spacing={3}>
                    {childFolders.map((folder) => renderFolderCard(folder))}
                  </Grid>
                </Box>
              )}

              {/* 2. Media Section inside this folder */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {childFolders.length > 0 && (photos.length > 0 || photosLoading) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CollectionsIcon sx={{ fontSize: 20, color: '#64748B' }} />
                      Media
                      {totalPhotos > 0 && (
                        <Chip label={totalPhotos} size="small" sx={{ height: 20, fontSize: '11px', fontWeight: 700, bgcolor: '#E2E8F0', color: '#475569' }} />
                      )}
                    </Typography>
                  </Box>
                )}

                {/* Photos selection bar */}
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

                {photosLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
                    <CircularProgress sx={{ color: '#0088ff' }} />
                  </Box>
                ) : photos.length === 0 ? (
                  childFolders.length > 0 ? (
                    <Box
                      sx={{
                        p: 4,
                        textAlign: 'center',
                        backgroundColor: '#F8FAFC',
                        border: '1px dashed #E2E8F0',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1.5,
                        my: 2
                      }}
                    >
                      <ImageIcon sx={{ fontSize: 36, color: '#94A3B8' }} />
                      <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
                        No media uploaded directly into this folder yet.
                      </Typography>
                      {isAdminOrWarden && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<UploadIcon />}
                          onClick={handleOpenUpload}
                          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', mt: 0.5 }}
                        >
                          Upload to this folder
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <EmptyGalleryCard
                      isAdmin={isAdminOrWarden}
                      onUpload={handleOpenUpload}
                      title="Folder is Empty"
                      // subtitle="Create subfolders to organize your events, or upload photos and videos directly here."
                      buttonLabel="Upload to Folder"
                      icon={<FolderOpenIcon sx={{ fontSize: 40, color: currentFolder.color || '#0F9D58' }} />}
                      secondaryButton={{
                        label: 'New Subfolder',
                        icon: <CreateNewFolderIcon />,
                        onClick: () => handleOpenCreateFolderDialog(currentFolder._id)
                      }}
                    />
                  )
                ) : (
                  <Grid container spacing={2.5}>
                    {photos.map((photo) => renderPhotoCard(photo))}
                  </Grid>
                )}

                {/* Infinite Scroll Sentinel inside Folder */}
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
            minWidth: 170
          }
        }}
      >
        <MenuItem
          onClick={() => {
            if (activeMenuFolder) handleOpenCreateSubfolder(activeMenuFolder);
          }}
        >
          <ListItemIcon>
            <CreateNewFolderIcon fontSize="small" sx={{ color: '#0088ff' }} />
          </ListItemIcon>
          <ListItemText primary="New Subfolder" />
        </MenuItem>
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
            {folderDialogMode === 'create' ? (folderParentId ? 'New Subfolder' : 'New Folder') : 'Edit Folder'}
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
            {folderDialogMode === 'create' && folderParentId && (
              <Box
                sx={{
                  mb: 2.5,
                  p: 1.5,
                  bgcolor: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <FolderIcon sx={{ color: '#64748B', fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                  Parent Folder:
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E293B' }}>
                  {folders.find((f) => f._id === folderParentId)?.name || 'Parent folder'}
                </Typography>
              </Box>
            )}

            <TextField
              label="Folder Name"
              fullWidth
              autoFocus
              required
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder={folderParentId ? "e.g. 2024 Photos" : "e.g. Events"}
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
                folderParentId ? 'Create Subfolder' : 'Create Folder'
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
        onClose={() => setUploadOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#ffffff',
            borderRadius: '12px',
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
            onClick={() => setUploadOpen(false)}
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
                {folderTreeOptions.map((f) => (
                  <MenuItem key={f._id} value={f._id} sx={{ pl: 2 + f.depth * 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: f.color || '#0F9D58', flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ fontWeight: f.depth === 0 ? 600 : 400 }}>
                        {f.depth > 0 ? `↳ ${f.name}` : f.name}
                      </Typography>
                      {f.depth > 0 && (
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '11px', ml: 0.5 }}>
                          ({f.fullPath})
                        </Typography>
                      )}
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
                      Selected {selectedFiles.length} file(s)
                    </Typography>
                    <Button
                      variant="text"
                      startIcon={<AddIcon />}
                      size="small"
                      component="span"
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Add more
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
                    Click to select multiple files
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                    Images (up to 9.8 MB) & Videos (up to 99 MB) • Any number of files
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Sequential Background Queue Info Banner */}
            <Box
              sx={{
                p: 1.8,
                bgcolor: '#F0FDF4',
                borderRadius: '12px',
                border: '1px solid #BBF7D0',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <UploadIcon sx={{ color: '#16A34A', fontSize: 22 }} />
              <Typography variant="caption" sx={{ color: '#166534', fontWeight: 500, lineHeight: 1.4 }}>
                Files upload 1-by-1 in a background queue. You can safely close this popup at any time and continue browsing!
              </Typography>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3, display: 'flex', gap: 1.5 }}>
            <Button
              onClick={() => setUploadOpen(false)}
              color="inherit"
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={selectedFiles.length === 0}
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
              {selectedFiles.length > 0 ? `Upload ${selectedFiles.length} item(s)` : 'Upload'}
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
              ? `Are you sure you want to delete folder "${deleteTarget.name}"? This folder${deleteTarget.subfolderCount ? `, all its ${deleteTarget.subfolderCount} subfolder(s),` : ''} and all ${deleteTarget.count || 0} media assets inside will be permanently deleted.`
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
  // Helper Component: Render Single Folder Card
  // -------------------------------------------------------------
  function renderFolderCard(folder) {
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
              {/* Selected Color Badge */}
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

            {isAdminOrWarden && (
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

          {/* 3. Footer: Avatar + Date Info + Item & Subfolder Counts */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 0.25, minHeight: '28px', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: 1 }}>
              <Avatar
                src={folder.createdBy?.profilePhoto?.url || ''}
                sx={{
                  width: 26,
                  height: 26,
                  fontSize: '11px',
                  fontWeight: 600,
                  bgcolor: folderColorHex,
                  color: '#FFFFFF',
                  flexShrink: 0
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

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
              {folder.subfolderCount > 0 && (
                <Tooltip title={`${folder.subfolderCount} subfolder${folder.subfolderCount > 1 ? 's' : ''}`}>
                  <Chip
                    icon={<FolderIcon sx={{ fontSize: '12px !important', color: `${folderColorHex} !important` }} />}
                    label={folder.subfolderCount}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '11px',
                      fontWeight: 600,
                      bgcolor: '#FFFFFF',
                      border: '1px solid rgba(0,0,0,0.08)'
                    }}
                  />
                </Tooltip>
              )}
              {folder.itemCount > 0 && (
                <Tooltip title={`${folder.itemCount} item${folder.itemCount > 1 ? 's' : ''}`}>
                  <Chip
                    icon={<ImageIcon sx={{ fontSize: '12px !important', color: '#64748B !important' }} />}
                    label={folder.itemCount}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '11px',
                      fontWeight: 600,
                      bgcolor: '#FFFFFF',
                      border: '1px solid rgba(0,0,0,0.08)'
                    }}
                  />
                </Tooltip>
              )}
            </Box>
          </Box>
        </Card>
      </Grid>
    );
  }

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
            {isAdminOrWarden && (
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
function EmptyGalleryCard({ isAdmin, onUpload, title, subtitle, buttonLabel = 'Upload Media', icon, secondaryButton = null }) {
  return (
    <Card
      sx={{
        p: 6,
        textAlign: 'center',
        backgroundColor: 'transparent',
        // borderRadius: '24px',
        border:"none",
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: "60vh",
        m: 'auto',
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '20px',
          border: '2px solid #d5d5d5ff',
          background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2.5
        }}
      >
        {icon || <CameraIcon sx={{ fontSize: 36, color: '#0088ff' }} />}
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', mb: 1 }}>
        {title}
      </Typography>

      <Typography variant="body2" sx={{ color: '#64748B', maxWidth: 440, mb: 3 }}>
        {subtitle}
      </Typography>

      {isAdmin && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {secondaryButton && (
            <Button
              variant="outlined"
              startIcon={secondaryButton.icon || <CreateNewFolderIcon />}
              onClick={secondaryButton.onClick}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1.1,
                fontSize: '14px',
                borderColor: '#0088ff',
                color: '#0088ff',
                '&:hover': {
                  borderColor: '#0077ee',
                  backgroundColor: 'rgba(0, 136, 255, 0.04)'
                }
              }}
            >
              {secondaryButton.label}
            </Button>
          )}

          {onUpload && (
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
        </Box>
      )}
    </Card>
  );
}

export default Gallery;
