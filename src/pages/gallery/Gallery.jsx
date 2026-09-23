import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import JSZip from 'jszip';
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
  FormControlLabel,
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
  LinearProgress,
  useTheme,
  useMediaQuery
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
  FolderOpen as FolderOpenIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionContext';
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
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { enqueueFiles } = useUploadQueue();
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State: 'all' | 'folders'
  const [activeTab, setActiveTab] = useState(() => {
    const folderParam = searchParams.get('folder') || searchParams.get('folderId');
    const tabParam = searchParams.get('tab');
    return folderParam || tabParam === 'folders' ? 'folders' : 'all';
  });

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
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgressText, setDownloadProgressText] = useState('');
  const [singleDownloading, setSingleDownloading] = useState(false);

  // Lightbox Modal State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null);

  // Sentinel for Infinite Scrolling
  const observerTarget = useRef(null);

  const { canCreate, canDelete, canUpdate } = usePermissions();
  const isAdminOrWarden = ['ADMIN', 'WARDEN'].includes(user?.role?.toUpperCase());

  // Dynamic upload permission from Access Control
  const canUpload = canCreate('gallery');

  // Can delete if admin/warden OR (has delete permission for gallery AND owns the photo)
  const canDeletePhoto = (photo) => {
    if (!user || !photo) return false;
    return canDelete('gallery', photo.uploadedBy);
  };

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
        const fetchedFolders = res.data.data.folders || [];
        setFolders(fetchedFolders);

        // Synchronize currentFolder on initial load/refresh if folder param exists in URL
        const targetFolderId = searchParams.get('folder') || searchParams.get('folderId');
        if (targetFolderId) {
          const matched = fetchedFolders.find((f) => String(f._id) === String(targetFolderId));
          if (matched) {
            setCurrentFolder(matched);
            setActiveTab('folders');
          }
        }
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
        // If there's a folder in the URL waiting to be matched, don't overwrite with root folders
        const targetFolderId = searchParams.get('folder') || searchParams.get('folderId');
        if (!targetFolderId) {
          fetchFolders();
        }
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

  // Synchronize folder and tab from URL search params on browser back/forward
  useEffect(() => {
    const targetFolderId = searchParams.get('folder') || searchParams.get('folderId');
    const tabParam = searchParams.get('tab');

    if (targetFolderId && folders.length > 0) {
      const matched = folders.find((f) => String(f._id) === String(targetFolderId));
      if (matched && (!currentFolder || String(currentFolder._id) !== String(matched._id))) {
        setCurrentFolder(matched);
        if (activeTab !== 'folders') {
          setActiveTab('folders');
        }
      }
    } else if (tabParam === 'folders' && !targetFolderId) {
      if (activeTab !== 'folders') {
        setActiveTab('folders');
      }
      if (currentFolder !== null) {
        setCurrentFolder(null);
      }
    } else if (tabParam === 'all' && !targetFolderId) {
      if (activeTab !== 'all') {
        setActiveTab('all');
      }
      if (currentFolder !== null) {
        setCurrentFolder(null);
      }
    }
  }, [searchParams, folders]);

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
  const navigateToFolder = (folder) => {
    setCurrentFolder(folder);
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'folders');
    if (folder && folder._id) {
      next.set('folder', String(folder._id));
    } else {
      next.delete('folder');
    }
    next.delete('folderId');
    setSearchParams(next, { replace: true });
  };

  const handleOpenFolder = (folder) => {
    navigateToFolder(folder);
  };

  const handleBackToFolders = () => {
    if (!currentFolder) return;
    const parentId = getParentId(currentFolder);
    const parent = parentId ? folders.find((f) => f._id === parentId) : null;
    navigateToFolder(parent || null);
  };

  const handleTabChange = (event, newTab) => {
    setActiveTab(newTab);
    setCurrentFolder(null);
    const next = new URLSearchParams(searchParams);
    next.set('tab', newTab);
    next.delete('folder');
    next.delete('folderId');
    setSearchParams(next, { replace: true });
  };

  // Sync folder name & back button into top header when inside a folder
  useEffect(() => {
    if (!outletContext?.setCustomHeader) return;

    if (activeTab === 'folders' && currentFolder) {
      outletContext.setCustomHeader(
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <IconButton
            onClick={handleBackToFolders}
            size="small"
            aria-label="Back to parent folder"
            sx={{
              width: 32,
              height: 32,
              bgcolor: '#F1F5F9',
              color: '#1E293B',
              borderRadius: '8px',
              flexShrink: 0,
              '&:hover': {
                bgcolor: '#E2E8F0',
                color: '#0F172A'
              },
              transition: 'all 0.15s'
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 18 }} />
          </IconButton>
          {currentFolder.color && (
            <Box
              component="span"
              sx={{
                width: 9,
                height: 9,
                borderRadius: '3px',
                bgcolor: currentFolder.color,
                display: 'inline-block',
                flexShrink: 0
              }}
            />
          )}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '0.95rem', sm: '1.25rem' },
              color: '#0F172A',
              letterSpacing: '-0.01em',
              maxWidth: { xs: 150, sm: 280, md: 450 },
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {currentFolder.name}
          </Typography>
          <Chip
            label={`${totalPhotos} items`}
            size="small"
            sx={{
              fontWeight: 600,
              bgcolor: '#F1F5F9',
              color: '#475569',
              fontSize: '11px',
              height: 20,
              flexShrink: 0,
              display: { xs: 'none', sm: 'inline-flex' }
            }}
          />
        </Box>
      );
    } else {
      outletContext.setCustomHeader(null);
    }

    return () => {
      outletContext.setCustomHeader?.(null);
    };
  }, [outletContext?.setCustomHeader, activeTab, currentFolder, totalPhotos, folders]);

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

    let duplicateCount = 0;
    const validFiles = [];

    // Helper to check if a file is already in an array
    const isDuplicateOf = (file, list) =>
      list.some(
        (existing) =>
          existing.name === file.name &&
          existing.size === file.size &&
          existing.lastModified === file.lastModified
      );

    for (const file of rawFiles) {
      const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|ogg)$/i);
      const isImage = file.type.startsWith('image/');

      if (!isImage && !isVideo) {
        enqueueSnackbar(`"${file.name}" is not a valid image or video.`, { variant: 'error' });
        continue;
      }

      // Check if duplicate of already selected files OR within the newly selected batch
      if (isDuplicateOf(file, selectedFiles) || isDuplicateOf(file, validFiles)) {
        duplicateCount++;
        continue;
      }

      validFiles.push(file);
    }

    if (duplicateCount > 0) {
      enqueueSnackbar(
        `${duplicateCount} duplicate file${duplicateCount > 1 ? 's were' : ' was'} skipped.`,
        { variant: 'info' }
      );
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
      setFilePreviews((prev) => [...prev, ...newPreviews]);
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
    if (deleting) return;
    if (sessionStorage.getItem('gallery_skip_delete_confirm') === 'true') {
      executeDelete({ type: 'photo', id });
      return;
    }
    setDontShowAgain(false);
    setDeleteTarget({ type: 'photo', id });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteSelectedPhotosClick = () => {
    if (deleting || selectedIds.length === 0) return;
    if (sessionStorage.getItem('gallery_skip_delete_confirm') === 'true') {
      executeDelete({ type: 'bulk-photos', ids: selectedIds });
      return;
    }
    setDontShowAgain(false);
    setDeleteTarget({ type: 'bulk-photos', ids: selectedIds });
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async (explicitTarget = null) => {
    // Prevent React synthetic event object from being treated as explicitTarget
    const isTargetValid =
      explicitTarget &&
      typeof explicitTarget === 'object' &&
      ('id' in explicitTarget || 'ids' in explicitTarget) &&
      !('nativeEvent' in explicitTarget);
    const target = isTargetValid ? explicitTarget : deleteTarget;
    if (!target) return;

    if (dontShowAgain && target.type !== 'folder') {
      sessionStorage.setItem('gallery_skip_delete_confirm', 'true');
    }

    try {
      setDeleting(true);
      if (target.type === 'folder') {
        enqueueSnackbar(`Deleting folder "${target.name || ''}"... Deletion process started.`, {
          variant: 'info',
          key: 'folder-deleting-snackbar',
          autoHideDuration: 6000
        });
        const res = await API.delete(`/gallery/folders/${target.id}`);
        closeSnackbar('folder-deleting-snackbar');
        if (res.data?.success) {
          enqueueSnackbar(`Folder "${target.name || ''}" deleted successfully. Deletion process completed.`, {
            variant: 'success'
          });
          const deletedIds = (res.data?.data?.deletedFolderIds || [target.id]).map(String);
          setFolders((prev) => prev.filter((f) => !deletedIds.includes(String(f._id))));
          if (currentFolder && deletedIds.includes(String(currentFolder._id))) {
            const parentId = getParentId(currentFolder);
            const parent = parentId && !deletedIds.includes(String(parentId)) ? folders.find((f) => String(f._id) === String(parentId)) : null;
            navigateToFolder(parent || null);
          }
          await fetchFolders();
        }
      } else if (target.type === 'photo') {
        const res = await API.delete(`/gallery/${target.id}`);
        if (res.data?.success) {
          enqueueSnackbar('Media item deleted successfully.', { variant: 'success' });
          setPhotos(prev => prev.filter(p => p._id !== target.id));
          setSelectedIds(prev => prev.filter(id => id !== target.id));
          setTotalPhotos(prev => Math.max(0, prev - 1));
          fetchFolders();
          if (activePhoto && activePhoto._id === target.id) {
            setLightboxOpen(false);
            setActivePhoto(null);
          }
        }
      } else if (target.type === 'bulk-photos') {
        const idsToDelete = target.ids || [];
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
      setDeleteTarget(null);
    } catch (err) {
      closeSnackbar('folder-deleting-snackbar');
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete item(s).', { variant: 'error' });
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  // -------------------------------------------------------------
  // 8. Selection & Bulk Download
  // -------------------------------------------------------------
  const handleSelectAll = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    // If all photos are currently selected, deselect all; otherwise select all photos in view
    if (photos.length > 0 && selectedIds.length === photos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(photos.map(p => p._id));
    }
  };

  // Count of selected IDs that the current user can actually delete
  const deletableSelectedCount = selectedIds.filter(id => {
    const photo = photos.find(p => p._id === id);
    return photo && canDeletePhoto(photo);
  }).length;

  const handleToggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDownloadSinglePhoto = async (photo) => {
    if (!photo || !photo.url || singleDownloading) return;
    setSingleDownloading(true);
    const extension = photo.resourceType === 'video' ? 'mp4' : 'jpg';
    const rawTitle = (photo.title || photo.caption || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = rawTitle ? `${rawTitle}.${extension}` : `KSH_Gallery_${Date.now()}.${extension}`;

    try {
      const response = await fetch(photo.url, { mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
      enqueueSnackbar('Download started.', { variant: 'success' });
    } catch (corsErr) {
      const a = document.createElement('a');
      a.href = photo.url;
      a.target = '_blank';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      enqueueSnackbar('Download opened.', { variant: 'info' });
    } finally {
      setSingleDownloading(false);
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedIds.length === 0 || downloading) return;
    setDownloading(true);
    setDownloadProgressText('Preparing...');

    try {
      const selectedPhotos = selectedIds
        .map(id => photos.find(p => p._id === id))
        .filter(Boolean);

      if (selectedPhotos.length === 0) {
        setDownloading(false);
        return;
      }

      // If only 1 file is selected, download directly as a single media file
      if (selectedPhotos.length === 1) {
        const photo = selectedPhotos[0];
        const extension = photo.resourceType === 'video' ? 'mp4' : 'jpg';
        const rawTitle = (photo.title || photo.caption || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = rawTitle ? `${rawTitle}.${extension}` : `KSH_Gallery_1.${extension}`;

        try {
          const response = await fetch(photo.url, { mode: 'cors' });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
        } catch (corsErr) {
          const a = document.createElement('a');
          a.href = photo.url;
          a.target = '_blank';
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }

        enqueueSnackbar('Downloaded 1 item.', { variant: 'success' });
        setSelectedIds([]);
        return;
      }

      // Multiple files: bundle into a ZIP archive to prevent browser throttling/dropping downloads
      const zip = new JSZip();
      let completed = 0;
      const total = selectedPhotos.length;
      const BATCH_SIZE = 4;

      for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = selectedPhotos.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (photo, batchIdx) => {
            const index = i + batchIdx + 1;
            const extension = photo.resourceType === 'video' ? 'mp4' : 'jpg';
            const rawTitle = (photo.title || photo.caption || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
            const filename = rawTitle
              ? `${String(index).padStart(2, '0')}_${rawTitle}.${extension}`
              : `KSH_Gallery_${String(index).padStart(2, '0')}.${extension}`;

            try {
              const res = await fetch(photo.url, { mode: 'cors' });
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const blob = await res.blob();
              zip.file(filename, blob);
            } catch (fetchErr) {
              console.warn(`Direct fetch failed for ${photo.url}, trying fallback:`, fetchErr);
              try {
                const res = await fetch(photo.url);
                const blob = await res.blob();
                zip.file(filename, blob);
              } catch (fallbackErr) {
                console.error(`Failed to download ${filename}:`, fallbackErr);
              }
            } finally {
              completed++;
              setDownloadProgressText(`${completed}/${total}`);
            }
          })
        );
      }

      setDownloadProgressText('Zipping...');
      const zipBlob = await zip.generateAsync(
        { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
        (meta) => {
          if (meta.percent) {
            setDownloadProgressText(`${Math.round(meta.percent)}%`);
          }
        }
      );

      const folderPart = currentFolder?.name ? currentFolder.name.trim().replace(/[^a-zA-Z0-9_-]/g, '_') : 'Media';
      const zipFilename = `KSH_Gallery_${folderPart}_${total}_items.zip`;

      const zipUrl = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = zipFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(zipUrl), 60000);

      enqueueSnackbar(`Successfully downloaded all ${completed} items in ${zipFilename}`, { variant: 'success' });
      setSelectedIds([]);
    } catch (err) {
      console.error('Bulk download error:', err);
      enqueueSnackbar('An error occurred during download.', { variant: 'error' });
    } finally {
      setDownloading(false);
      setDownloadProgressText('');
    }
  };

  const handleOpenLightbox = (photo) => {
    setActivePhoto(photo);
    setLightboxOpen(true);
  };

  const currentPhotoIndex = activePhoto ? photos.findIndex((p) => p._id === activePhoto._id) : -1;

  const handlePrevPhoto = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      if (!photos || photos.length <= 1 || currentPhotoIndex === -1) return;
      const prevIndex = currentPhotoIndex > 0 ? currentPhotoIndex - 1 : photos.length - 1;
      setActivePhoto(photos[prevIndex]);
    },
    [photos, currentPhotoIndex]
  );

  const handleNextPhoto = useCallback(
    (e) => {
      if (e) e.stopPropagation();
      if (!photos || photos.length <= 1 || currentPhotoIndex === -1) return;
      const nextIndex = currentPhotoIndex < photos.length - 1 ? currentPhotoIndex + 1 : 0;
      setActivePhoto(photos[nextIndex]);
    },
    [photos, currentPhotoIndex]
  );

  // Auto fetch more photos if navigating near the end in lightbox
  useEffect(() => {
    if (lightboxOpen && currentPhotoIndex >= photos.length - 2 && hasMore && !photosLoading && !photosLoadingMore) {
      const nextPage = page + 1;
      const targetFolderId = currentFolder ? currentFolder._id : null;
      fetchPhotos(nextPage, targetFolderId, true);
    }
  }, [lightboxOpen, currentPhotoIndex, photos.length, hasMore, photosLoading, photosLoadingMore, page, currentFolder, fetchPhotos]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrevPhoto();
      } else if (e.key === 'ArrowRight') {
        handleNextPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, handlePrevPhoto, handleNextPhoto]);

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
      {/* Top Header & Navigation Bar (Sticky on Mobile, Clean Single Row on Desktop) */}
      {/* ------------------------------------------------------------- */}
      <Box
        sx={{
          position: 'sticky',
          top: { xs: 56, sm: 64 },
          zIndex: 100,
          bgcolor: { xs: '#FFFFFF', md: 'rgba(248, 250, 252, 0.95)' },
          backdropFilter: 'blur(8px)',
          mx: { xs: -1.5, sm: -2.5, md: -3 },
          px: { xs: 1.5, sm: 2.5, md: 3 },
          mt: { xs: -1.5, sm: -2.5, md: -3 },
          pt: { xs: 1, sm: 1.25, md: 1.25 },
          pb: { xs: 1, sm: 1.25, md: 1.25 },
          mb: { xs: 1.5, sm: 2, md: 2.5 },
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 1, md: 1.5 }
        }}
      >
        {/* Main Row: On Desktop, single row with Tabs on Left (when at root) & Actions on Right */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: { md: activeTab === 'folders' && currentFolder ? 'flex-end' : 'space-between' },
            alignItems: { xs: 'stretch', md: 'center' },
            width: '100%',
            gap: { xs: 1, md: 2 }
          }}
        >
          {/* Left Side: Tabs (shown only when NOT inside a folder) */}
          {!(activeTab === 'folders' && currentFolder) && (
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant={isMobile ? 'fullWidth' : 'standard'}
              sx={{
                width: { xs: '100%', md: 'auto' },
                display: 'inline-flex',
                minHeight: '34px',
                bgcolor: '#F1F5F9',
                p: '3px',
                borderRadius: '12px',
                flexShrink: 0,
                '& .MuiTabs-indicator': {
                  display: 'none'
                }
              }}
            >
              <Tab
                value="all"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
                    <CollectionsIcon sx={{ fontSize: 16 }} />
                    <span>All Media</span>
                  </Box>
                }
                sx={{
                  flex: { xs: 1, md: 'none' },
                  minWidth: { md: 105 },
                  minHeight: '28px',
                  borderRadius: '9px',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  py: 0.5,
                  px: { xs: 1.5, md: 2 },
                  textTransform: 'none',
                  color: '#64748B',
                  transition: 'all 0.2s',
                  '&.Mui-selected': {
                    bgcolor: '#FFFFFF',
                    color: '#0088ff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                  }
                }}
              />
              <Tab
                value="folders"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
                    <FolderIcon sx={{ fontSize: 16 }} />
                    <span>Folders</span>
                    {folders.length > 0 && (
                      <Chip
                        label={folders.length}
                        size="small"
                        sx={{
                          height: '18px',
                          fontSize: '10px',
                          fontWeight: 700,
                          bgcolor: activeTab === 'folders' ? 'rgba(0, 136, 255, 0.1)' : '#E2E8F0',
                          color: activeTab === 'folders' ? '#0088ff' : '#64748B'
                        }}
                      />
                    )}
                  </Box>
                }
                sx={{
                  flex: { xs: 1, md: 'none' },
                  minWidth: { md: 105 },
                  minHeight: '28px',
                  borderRadius: '9px',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  py: 0.5,
                  px: { xs: 1.5, md: 2 },
                  textTransform: 'none',
                  color: '#64748B',
                  transition: 'all 0.2s',
                  '&.Mui-selected': {
                    bgcolor: '#FFFFFF',
                    color: '#0088ff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                  }
                }}
              />
            </Tabs>
          )}

          {/* Right Side: Action Buttons (Add photos, Select all, New folder / New subfolder) */}
          {(() => {
            const showSelectAll = (activeTab === 'all' || currentFolder) && photos.length > 0;
            const showFolderAction = isAdminOrWarden && activeTab === 'folders';
            const folderActionLabel = currentFolder ? 'New subfolder' : 'New folder';

            // Calculate grid columns on mobile
            let numButtons = 1; // Add photos / Share media
            if (showFolderAction) numButtons += 1;
            if (showSelectAll) numButtons += 1;

            return (
              <Box
                sx={{
                  display: { xs: 'grid', md: 'flex' },
                  gridTemplateColumns: {
                    xs: numButtons === 3 ? 'repeat(2, minmax(0, 1fr))' : (numButtons === 2 ? 'repeat(2, minmax(0, 1fr))' : '1fr'),
                    md: 'none'
                  },
                  alignItems: 'center',
                  justifyContent: { md: 'flex-end' },
                  width: { xs: '100%', md: 'auto' },
                  gap: 1
                }}
              >
                {/* Add photos (Admin / Authorized) */}
                {canUpload ? (
                  <Button
                    variant="contained"
                    size="small"
                    disabled={deleting}
                    startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
                    onClick={handleOpenUpload}
                    sx={{
                      width: { xs: '100%', md: 'auto' },
                      gridColumn: { xs: numButtons === 3 ? '1 / -1' : 'auto', md: 'auto' },
                      background: '#0088ff',
                      color: '#fff',
                      borderRadius: '9px',
                      px: { xs: 1.5, md: 2 },
                      py: 0.5,
                      height: 34,
                      fontSize: '12.5px',
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: 'none',
                      whiteSpace: 'nowrap',
                      justifyContent: 'center',
                      '&:hover': {
                        background: '#0077ee',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    Add photos
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    size="small"
                    disabled={deleting}
                    startIcon={<UploadIcon sx={{ fontSize: '16px !important' }} />}
                    onClick={() => navigate('/request-upload?tab=submit&category=gallery')}
                    sx={{
                      width: { xs: '100%', md: 'auto' },
                      gridColumn: { xs: numButtons === 3 ? '1 / -1' : 'auto', md: 'auto' },
                      background: '#0088ff',
                      color: '#fff',
                      borderRadius: '9px',
                      px: { xs: 1.5, md: 2 },
                      py: 0.5,
                      height: 34,
                      fontSize: '12.5px',
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: 'none',
                      whiteSpace: 'nowrap',
                      justifyContent: 'center',
                      '&:hover': {
                        background: '#0077ee',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    Share Media
                  </Button>
                )}

                {/* New folder (at root) or New subfolder (inside folder) */}
                {showFolderAction && (
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={deleting || folderSubmitting}
                    startIcon={folderSubmitting ? <CircularProgress size={14} color="inherit" /> : <CreateNewFolderIcon sx={{ fontSize: '16px !important' }} />}
                    onClick={() => handleOpenCreateFolderDialog(currentFolder ? currentFolder._id : null)}
                    sx={{
                      width: { xs: '100%', md: 'auto' },
                      borderRadius: '9px',
                      borderColor: '#0088ff',
                      color: '#0088ff',
                      fontWeight: 600,
                      textTransform: 'none',
                      px: { xs: 1.5, md: 2 },
                      py: 0.5,
                      height: 34,
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      justifyContent: 'center',
                      '&:hover': {
                        borderColor: '#0077ee',
                        backgroundColor: 'rgba(0, 136, 255, 0.04)'
                      }
                    }}
                  >
                    {folderSubmitting ? 'Creating...' : folderActionLabel}
                  </Button>
                )}

                {/* Select all */}
                {showSelectAll && (
                  <Box
                    onClick={deleting ? undefined : handleSelectAll}
                    sx={{
                      width: { xs: '100%', md: 'auto' },
                      height: 34,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.75,
                      borderRadius: '9px',
                      border: '1px solid #E2E8F0',
                      bgcolor: selectedIds.length > 0 ? 'rgba(0, 136, 255, 0.04)' : '#F8FAFC',
                      px: { xs: 1.5, md: 2 },
                      cursor: deleting ? 'not-allowed' : 'pointer',
                      opacity: deleting ? 0.6 : 1,
                      userSelect: 'none',
                      boxSizing: 'border-box',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: selectedIds.length > 0 ? 'rgba(0, 136, 255, 0.08)' : '#F1F5F9',
                        borderColor: '#CBD5E1'
                      }
                    }}
                  >
                    <Checkbox
                      size="small"
                      disabled={deleting}
                      checked={photos.length > 0 && selectedIds.length === photos.length}
                      indeterminate={selectedIds.length > 0 && selectedIds.length < photos.length}
                      onChange={handleSelectAll}
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        p: 0,
                        color: '#667085',
                        '&.Mui-checked': { color: '#0088ff' }
                      }}
                    />
                    <Typography
                      component="span"
                      sx={{
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: '#344054',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Select all ({photos.length})
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          })()}
        </Box>

        {/* Selection Actions: Download below tabs on left, Delete on opposite end (right) on desktop */}
        {selectedIds.length > 0 && (
          <Box
            sx={{
              display: { xs: 'grid', md: 'flex' },
              gridTemplateColumns: { xs: deletableSelectedCount > 0 ? 'repeat(2, minmax(0, 1fr))' : '1fr', md: 'none' },
              justifyContent: { md: 'space-between' },
              alignItems: 'center',
              gap: 1,
              width: '100%',
              pt: { xs: 0.25, md: 0.5 }
            }}
          >
            {/* Download on the left */}
            <Button
              variant="outlined"
              size="small"
              disabled={downloading || deleting}
              startIcon={downloading ? <CircularProgress size={13} color="inherit" /> : <DownloadIcon sx={{ fontSize: '15px !important' }} />}
              onClick={handleDownloadSelected}
              sx={{
                width: { xs: '100%', md: 'auto' },
                height: 32,
                px: 2,
                py: 0.5,
                fontSize: '12px',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#D0D5DD',
                color: '#344054',
                justifyContent: 'center',
                '&:hover': { borderColor: '#D0D5DD', backgroundColor: '#F9FAFB' }
              }}
            >
              {downloading ? (downloadProgressText ? `Downloading (${downloadProgressText})` : 'Downloading...') : `Download (${selectedIds.length})`}
            </Button>

            {/* Delete on the opposite end (right) */}
            {deletableSelectedCount > 0 && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                disabled={deleting || downloading}
                startIcon={deleting ? <CircularProgress size={13} color="inherit" /> : <DeleteIcon sx={{ fontSize: '15px !important' }} />}
                onClick={handleDeleteSelectedPhotosClick}
                sx={{
                  width: { xs: '100%', md: 'auto' },
                  height: 32,
                  px: 2,
                  py: 0.5,
                  fontSize: '12px',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  justifyContent: 'center'
                }}
              >
                {deleting ? 'Deleting...' : `Delete (${deletableSelectedCount})`}
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: ALL MEDIA (Infinite Scroll Pagination: 30 items) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'all' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>


          {/* Photos Grid Container */}
          <Box sx={{ flex: 1 }}>
            {photosLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
                <CircularProgress sx={{ color: '#0088ff' }} />
              </Box>
            ) : photos.length === 0 ? (
              <EmptyGalleryCard
                isAdmin={true}
                onUpload={canUpload ? handleOpenUpload : () => navigate('/request-upload?tab=submit&category=gallery')}
                buttonLabel={canUpload ? 'Add photos' : 'Share Media'}
                title="No Media Found"
                subtitle="Upload media or submit memories to share them with your community."
              />
            ) : (
              <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
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
              {/* 1. Subfolders Section */}
              {childFolders.length > 0 ? (
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
                        startIcon={folderSubmitting ? <CircularProgress size={14} color="inherit" /> : <CreateNewFolderIcon fontSize="small" />}
                        onClick={() => handleOpenCreateFolderDialog(currentFolder._id)}
                        disabled={folderSubmitting || deleting}
                        sx={{ textTransform: 'none', fontWeight: 600, color: '#0088ff' }}
                      >
                        {folderSubmitting ? 'Creating...' : 'New subfolder'}
                      </Button>
                    )}
                  </Box>
                  <Grid container spacing={3}>
                    {childFolders.map((folder) => renderFolderCard(folder))}
                  </Grid>
                </Box>
              ) : (
                isAdminOrWarden && photos.length > 0 && (
                 <></>
                )
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
                      {canUpload ? (
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={deleting}
                          startIcon={<UploadIcon />}
                          onClick={handleOpenUpload}
                          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', mt: 0.5 }}
                        >
                          Upload to this folder
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={deleting}
                          startIcon={<UploadIcon />}
                          onClick={() => navigate(`/request-upload?tab=submit&category=gallery`)}
                          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', mt: 0.5 }}
                        >
                          Share Media to this folder
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <EmptyGalleryCard
                      isAdmin={true}
                      onUpload={canUpload ? handleOpenUpload : () => navigate(`/request-upload?tab=submit&category=gallery`)}
                      title="Folder is Empty"
                      buttonLabel={canUpload ? 'Upload to Folder' : 'Share Media'}
                      icon={<FolderOpenIcon sx={{ fontSize: 40, color: currentFolder.color || '#0F9D58' }} />}
                      secondaryButton={isAdminOrWarden ? {
                        label: 'New Subfolder',
                        icon: <CreateNewFolderIcon />,
                        onClick: () => handleOpenCreateFolderDialog(currentFolder._id)
                      } : null}
                    />
                  )
                ) : (
                  <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
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
        slotProps={{
          paper: {
            sx: {
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              minWidth: 170
            }
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
            borderRadius: { xs: '16px', sm: '20px' },
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
            m: { xs: 2, sm: 3 },
            maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' }
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: { xs: 2.5, sm: 3 }, pt: { xs: 2.5, sm: 3 }, pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            Upload Media
          </Typography>
          <IconButton
            onClick={() => setUploadOpen(false)}
            size="small"
            sx={{ bgcolor: '#F1F5F9', '&:hover': { bgcolor: '#E2E8F0' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <form onSubmit={handleUploadSubmit}>
          <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, py: 1.5 }}>
            {/* Target Folder Selector */}
            <FormControl fullWidth sx={{ mb: 2 }} size="small">
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
                border: selectedFiles.length > 0 ? '1.5px solid #BFDBFE' : '2px dashed #D0D5DD',
                borderRadius: '16px',
                p: { xs: 2.5, sm: 3 },
                textAlign: 'center',
                backgroundColor: selectedFiles.length > 0 ? '#F0F7FF' : '#F8FAFC',
                mb: 1.5,
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: selectedFiles.length > 0 ? '#E0F2FE' : 'rgba(0, 136, 255, 0.02)',
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

              {selectedFiles.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 0.5 }}>
                  {/* Icon Badge */}
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: '#DBEAFE',
                      color: '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1.2,
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.12)'
                    }}
                  >
                    <CollectionsIcon sx={{ fontSize: 26 }} />
                  </Box>

                  {/* Title & Count */}
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.25 }}>
                    {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} selected
                  </Typography>

                  {/* Size info */}
                  <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, mt: 0.4, fontSize: '0.82rem' }}>
                    Total size: {(selectedFiles.reduce((acc, f) => acc + (f.size || 0), 0) / (1024 * 1024)).toFixed(1)} MB
                  </Typography>

                  {/* Actions (Add More / Clear) */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.8 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon sx={{ fontSize: '15px !important' }} />}
                      component="span"
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        borderRadius: '20px',
                        py: 0.4,
                        px: 1.8,
                        color: '#0088ff',
                        borderColor: '#93C5FD',
                        bgcolor: '#FFFFFF',
                        '&:hover': { bgcolor: '#EFF6FF', borderColor: '#0088ff' }
                      }}
                    >
                      Add more
                    </Button>

                    <Button
                      variant="text"
                      size="small"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedFiles([]);
                        filePreviews.forEach((url) => URL.revokeObjectURL(url));
                        setFilePreviews([]);
                      }}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        color: '#EF4444',
                        borderRadius: '20px',
                        py: 0.4,
                        px: 1.5,
                        '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' }
                      }}
                    >
                      Remove all
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1.5 }}>
                  <Box
                    className="upload-icon-box"
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: '#F1F5F9',
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1.2,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <UploadIcon sx={{ fontSize: 24 }} />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.3 }}>
                    Click to select multiple files
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                    Supports photos and videos
                  </Typography>
                </Box>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, pb: { xs: 2.5, sm: 3 }, pt: 1, display: 'flex', gap: 1.5 }}>
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
                py: 0.9,
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
        sx={{ zIndex: 1700 }}
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
        <DialogContent sx={{ pb: 1.5 }}>
          <Typography variant="body1" sx={{ color: '#64748B', lineHeight: 1.5 }}>
            {deleteTarget?.type === 'folder'
              ? `Are you sure you want to delete folder "${deleteTarget.name}"? This folder${deleteTarget.subfolderCount ? `, all its ${deleteTarget.subfolderCount} subfolder(s),` : ''} and all ${deleteTarget.count || 0} media assets inside will be permanently deleted.`
              : deleteTarget?.type === 'bulk-photos'
                ? `Are you sure you want to delete the ${deleteTarget.ids?.length} selected media assets?`
                : 'Are you sure you want to permanently delete this media item? This action cannot be undone.'}
          </Typography>
          {deleting && (
            <Box sx={{ mt: 2.5 }}>
              <LinearProgress color="error" sx={{ height: 6, borderRadius: 1.5 }} />
              <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 600, mt: 1, display: 'block' }}>
                Deletion in progress... Please wait.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1
          }}
        >
          {deleteTarget?.type !== 'folder' && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  size="small"
                  disabled={deleting}
                  sx={{
                    color: '#94A3B8',
                    p: 0.5,
                    mr: 0.5,
                    '&.Mui-checked': { color: '#EF4444' }
                  }}
                />
              }
              label={
                <Typography
                  variant="body2"
                  sx={{
                    color: '#64748B',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    userSelect: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Don't Show again
                </Typography>
              }
              sx={{ m: 0 }}
            />
          )}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', ml: 'auto' }}>
            <Button
              onClick={() => setDeleteConfirmOpen(false)}
              color="inherit"
              disabled={deleting}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => executeDelete()}
              variant="contained"
              color="error"
              disabled={deleting}
              startIcon={deleting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : null}
              sx={{
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '10px',
                px: 3,
                minWidth: 95
              }}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </Box>
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
          {/* Fixed Top Right Action Buttons: Download, Delete (if permitted), Close */}
          <Box
            sx={{
              position: 'fixed',
              top: { xs: 14, sm: 24 },
              right: { xs: 14, sm: 24 },
              zIndex: 1600,
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, sm: 1.5 }
            }}
          >
            {activePhoto && (
              <Tooltip title="Download Media" arrow>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadSinglePhoto(activePhoto);
                  }}
                  disabled={singleDownloading}
                  aria-label="Download media"
                  sx={{
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    width: { xs: 38, sm: 44 },
                    height: { xs: 38, sm: 44 },
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 136, 255, 0.85)',
                      borderColor: 'rgba(0, 136, 255, 0.95)',
                      transform: 'scale(1.08)'
                    }
                  }}
                >
                  {singleDownloading ? (
                    <CircularProgress size={18} sx={{ color: '#FFFFFF' }} />
                  ) : (
                    <DownloadIcon sx={{ fontSize: { xs: 19, sm: 22 } }} />
                  )}
                </IconButton>
              </Tooltip>
            )}

            {activePhoto && canDeletePhoto(activePhoto) && (
              <Tooltip title="Delete Media" arrow>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePhotoClick(activePhoto._id);
                  }}
                  disabled={deleting}
                  aria-label="Delete media"
                  sx={{
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(239, 68, 68, 0.65)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(239, 68, 68, 0.8)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    width: { xs: 38, sm: 44 },
                    height: { xs: 38, sm: 44 },
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(220, 38, 38, 0.95)',
                      transform: 'scale(1.08)'
                    }
                  }}
                >
                  {deleting && deleteTarget?.id === activePhoto?._id ? (
                    <CircularProgress size={20} sx={{ color: '#fff' }} />
                  ) : (
                    <DeleteIcon sx={{ fontSize: { xs: 19, sm: 22 } }} />
                  )}
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Close (Esc)" arrow>
              <IconButton
                onClick={() => setLightboxOpen(false)}
                aria-label="Close media preview"
                sx={{
                  color: '#FFFFFF',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  width: { xs: 38, sm: 44 },
                  height: { xs: 38, sm: 44 },
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    transform: 'scale(1.08)'
                  }
                }}
              >
                <CloseIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Navigation Button - Left End */}
          {photos.length > 1 && (
            <IconButton
              onClick={handlePrevPhoto}
              aria-label="Previous media"
              sx={{
                position: 'fixed',
                left: { xs: 6, sm: 24, md: 32 },
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1600,
                color: '#FFFFFF',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                width: { xs: 38, sm: 52 },
                height: { xs: 38, sm: 52 },
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  transform: 'translateY(-50%) scale(1.08)'
                }
              }}
            >
              <ChevronLeftIcon sx={{ fontSize: { xs: 24, sm: 36 } }} />
            </IconButton>
          )}

          {/* Navigation Button - Right End */}
          {photos.length > 1 && (
            <IconButton
              onClick={handleNextPhoto}
              aria-label="Next media"
              sx={{
                position: 'fixed',
                right: { xs: 6, sm: 24, md: 32 },
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1600,
                color: '#FFFFFF',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                width: { xs: 38, sm: 52 },
                height: { xs: 38, sm: 52 },
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  transform: 'translateY(-50%) scale(1.08)'
                }
              }}
            >
              <ChevronRightIcon sx={{ fontSize: { xs: 24, sm: 36 } }} />
            </IconButton>
          )}

          {/* Media Index Counter Badge at Top Left */}
          {photos.length > 1 && currentPhotoIndex !== -1 && (
            <Box
              sx={{
                position: 'fixed',
                top: { xs: 14, sm: 24 },
                left: { xs: 14, sm: 24 },
                zIndex: 1600,
                color: '#FFFFFF',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                borderRadius: '20px',
                px: { xs: 1.5, sm: 2 },
                py: { xs: 0.5, sm: 0.75 },
                fontSize: { xs: '12px', sm: '13px' },
                fontWeight: 600,
                letterSpacing: '0.5px'
              }}
            >
              {currentPhotoIndex + 1} / {totalPhotos || photos.length}
            </Box>
          )}

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
                  key={activePhoto._id || activePhoto.url}
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
                  key={activePhoto._id || activePhoto.url}
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
                disabled={deleting}
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
                {deleting && deleteTarget?.type === 'folder' && deleteTarget?.id === folder._id ? (
                  <CircularProgress size={16} sx={{ color: '#EF4444' }} />
                ) : (
                  <MoreVertIcon fontSize="small" />
                )}
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
      <Grid size={{ xs: 6, sm: 4, md: 4, lg: 3 }} key={photo._id}>
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
                background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0) 60%)',
                opacity: 0,
                transition: 'opacity 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                p: 2,
                pointerEvents: 'none'
              }}
            >
              {photo.uploadedBy?.name && (
                <Typography
                  variant="caption"
                  sx={{
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    pointerEvents: 'none',
                    lineHeight: 1.2,
                    mb: 0.3,
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)'
                  }}
                >
                  {photo.uploadedBy.name}
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: '#CBD5E1', pointerEvents: 'none', fontSize: '0.72rem', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                {photo.createdAt ? new Date(photo.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : ''}
              </Typography>
            </Box>

            {/* Delete button - Top Right: visible only to the uploader or admin */}
            {canDeletePhoto(photo) && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePhotoClick(photo._id);
                }}
                disabled={deleting}
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
                {deleting && deleteTarget?.id === photo._id ? (
                  <CircularProgress size={16} sx={{ color: '#fff' }} />
                ) : (
                  <DeleteIcon sx={{ fontSize: 16 }} />
                )}
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
