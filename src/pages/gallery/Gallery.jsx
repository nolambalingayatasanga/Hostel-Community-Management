import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
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
  Checkbox
} from '@mui/material';
import {
  AddPhotoAlternate as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  PhotoCamera as CameraIcon,
  CloudUpload as UploadIcon,
  Check as CheckIcon,
  PlayArrow as PlayArrowIcon,
  GetApp as DownloadIcon
} from '@mui/icons-material';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';

const Gallery = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Upload dialog state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null); // null means bulk delete
  const [uploading, setUploading] = useState(false);

  // Lightbox Modal state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null);

  const isAdminOrChairperson = ['ADMIN', 'CHAIRPERSON'].includes(user?.role);



  // Fetch photos
  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const res = await API.get('/gallery');
      if (res.data?.success) {
        setPhotos(res.data.data.photos);
      }
    } catch (err) {
      setError('Failed to fetch gallery photos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  // Handle file select (multiple files support)
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setFilePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  // Remove a file from the selected list
  const handleRemoveFileAt = (index) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== index));
    setFilePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, idx) => idx !== index);
    });
  };

  // Handle Photo Upload (multiple files in parallel)
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

      const uploadPromises = selectedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('photo', file);
        
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
          ? `Successfully uploaded ${successfulUploads.length} item(s). Failed to upload ${failedCount} item(s).`
          : `Successfully uploaded all ${successfulUploads.length} item(s) to the gallery!`;
        
        enqueueSnackbar(successMsg, { variant: 'success' });
        setPhotos(prev => [...successfulUploads, ...prev]);
        setUploadOpen(false);
        // Clear state
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

  // Trigger delete confirmation for a single photo
  const handleDeletePhoto = (id) => {
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  };

  // Trigger delete confirmation for all selected photos
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setDeleteTargetId(null);
    setDeleteConfirmOpen(true);
  };

  // Execute the delete operation (single or bulk)
  const executeDelete = async () => {
    setDeleteConfirmOpen(false);
    
    if (deleteTargetId) {
      // Single photo delete
      const id = deleteTargetId;
      try {
        setError('');
        const res = await API.delete(`/gallery/${id}`);
        if (res.data?.success) {
          enqueueSnackbar('Media item deleted successfully.', { variant: 'success' });
          setPhotos(prev => prev.filter(p => p._id !== id));
          setSelectedIds(prev => prev.filter(item => item !== id));
        }
      } catch (err) {
        setError('Failed to delete item.');
        enqueueSnackbar('Failed to delete media item.', { variant: 'error' });
      } finally {
        setDeleteTargetId(null);
      }
    } else {
      // Bulk delete
      if (selectedIds.length === 0) return;
      try {
        setError('');
        setLoading(true);
        
        const deletePromises = selectedIds.map(id => 
          API.delete(`/gallery/${id}`)
            .then(() => ({ id, success: true }))
            .catch(err => {
              return { id, success: false };
            })
        );
        
        const results = await Promise.all(deletePromises);
        const successfulIds = results.filter(r => r.success).map(r => r.id);
        const failedCount = results.length - successfulIds.length;

        if (successfulIds.length > 0) {
          setPhotos(prev => prev.filter(p => !successfulIds.includes(p._id)));
          setSelectedIds(prev => prev.filter(id => !successfulIds.includes(id)));
          
          if (failedCount > 0) {
            enqueueSnackbar(`Deleted ${successfulIds.length} items. Failed to delete ${failedCount} items.`, { variant: 'warning' });
          } else {
            enqueueSnackbar(`Successfully deleted ${successfulIds.length} media item(s).`, { variant: 'success' });
          }
        } else {
          enqueueSnackbar('Failed to delete selected media items.', { variant: 'error' });
        }
      } catch (err) {
        setError('Failed to delete selected items.');
        enqueueSnackbar('Failed to delete selected items.', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

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
      for (const id of selectedIds) {
        const photo = photos.find(p => p._id === id);
        if (!photo) continue;
        
        try {
          const response = await fetch(photo.url, { mode: 'cors' });
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const extension = photo.resourceType === 'video' ? 'mp4' : 'jpg';
          a.download = photo.caption ? `${photo.caption}.${extension}` : `gallery_${id}.${extension}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } catch (corsErr) {
          // Fallback if browser CORS rejects fetch: open url in new tab
          const a = document.createElement('a');
          a.href = photo.url;
          a.target = '_blank';
          a.download = photo.caption || `gallery_${id}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }
      setSuccess(`Triggered download for ${selectedIds.length} items.`);
      setSelectedIds([]);
    } catch (err) {
      setError('An error occurred during download.');
    }
  };

  const handleOpenLightbox = (photo) => {
    setActivePhoto(photo);
    setLightboxOpen(true);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header section */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 4 }}>
        
        {selectedIds.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mr: 2 }}>
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
              Download selected ({selectedIds.length})
            </Button>

            {isAdminOrChairperson && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteSelected}
                sx={{ borderRadius: '24px', textTransform: 'none', fontWeight: 600 }}
              >
                Delete selected ({selectedIds.length})
              </Button>
            )}
          </Box>
        )}

        {isAdminOrChairperson && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setUploadOpen(true)}
            sx={{
              background: '#0088ff',
              color: '#fff',
              borderRadius: '24px',
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
        )}
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Top action bar: Select All */}
      {photos.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Checkbox
            checked={photos.length > 0 && selectedIds.length === photos.length}
            indeterminate={selectedIds.length > 0 && selectedIds.length < photos.length}
            onChange={handleSelectAll}
            sx={{ color: '#667085', '&.Mui-checked': { color: '#0088ff' } }}
          />
          <Typography variant="body1" sx={{ fontWeight: 500, color: '#344054' }}>
            Select all
          </Typography>
        </Box>
      )}

      {/* Gallery Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: '#0088ff' }} />
        </Box>
      ) : photos.length === 0 ? (
        <Card
          sx={{
            p: 6,
            textAlign: 'center',
            backgroundColor: '#ffffff',
            border: '1px dashed #E2E8F0',
            borderRadius: '24px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            maxWidth: 600,
            mx: 'auto',
            my: 4,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '4px',
         
              opacity: 0,
              transition: 'opacity 0.3s ease',
            },
            '&:hover': {
              transform: 'translateY(-4px)',
      
              boxShadow: '0 12px 40px rgba(0, 136, 255, 0.08)',
              '&::before': {
                opacity: 1,
              },
              '& .illustration-container': {
                transform: 'scale(1.08) rotate(3deg)',
                borderColor: 'rgba(0, 136, 255, 0.25)',
              },
              '& .icon-glow': {
                filter: 'drop-shadow(0 0 12px rgba(0, 136, 255, 0.4))',
              }
            }
          }}
        >
          {/* Illustration Container */}
          <Box
            className="illustration-container"
            sx={{
              width: 100,
              height: 100,
              borderRadius: '28px',
              border: '2px solid #F1F5F9',
              background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              position: 'relative',
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Soft decorative background circles */}
            <Box
              sx={{
                position: 'absolute',
                width: 140,
                height: 140,
                borderRadius: '50%',
                border: '1px dashed rgba(0, 136, 255, 0.15)',
                animation: 'spin 20s linear infinite',
                pointerEvents: 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }}
            />
            
            {/* Secondary overlapping icon card for depth */}
            <Box
              sx={{
                position: 'absolute',
                bottom: -8,
                right: -8,
                width: 36,
                height: 36,
                borderRadius: '12px',
                bgcolor: '#0088ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 136, 255, 0.3)',
                color: '#fff',
              }}
            >
              <CameraIcon sx={{ fontSize: 18 }} />
            </Box>

            <AddIcon
              className="icon-glow"
              sx={{
                fontSize: 42,
                color: '#0088ff',
                transition: 'all 0.3s ease',
              }}
            />
          </Box>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#1E293B',
              mb: 1.5,
              letterSpacing: '-0.025em'
            }}
          >
            No Media Found
          </Typography>

         

          {isAdminOrChairperson && (
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => setUploadOpen(true)}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                fontSize: '15px',
                background: "#0088ff",
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: '#0077ee',
            
                  transform: 'translateY(-2px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                }
              }}
            >
              Upload  Media
            </Button>
          )}
        </Card>
      ) : (
        <Grid container spacing={3}>
          {photos.map((photo) => {
            const isSelected = selectedIds.includes(photo._id);
            return (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={photo._id}>
                <Box sx={{ width: '100%', position: 'relative', pb: '75%' /* 4:3 Aspect Ratio matching reference image */ }}>
                  <Card
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      overflow: 'hidden',
                      borderRadius: '12px', // Smoother rounded corners matching image
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
                        height: '100%',
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
                          {/* Centered Play Button Icon Overlay */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              width: 54,
                              height: 54,
                              borderRadius: '50%',
                              backgroundColor: 'rgba(0, 0, 0, 0.5)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FFFFFF',
                              backdropFilter: 'blur(2px)',
                              border: '1px solid rgba(255, 255, 255, 0.25)',
                              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <PlayArrowIcon sx={{ fontSize: 32 }} />
                          </Box>
                        </Box>
                      ) : (
                        <img
                          src={photo.url}
                          alt={photo.caption || 'Gallery item'}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                      )}
                    </Box>

                    {/* Hover Overlay: Uploader Name and Date */}
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
                      <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600, pointerEvents: 'none' }}>
                        {photo.uploadedBy?.name || 'Anonymous'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#ccc', mt: 0.5, pointerEvents: 'none' }}>
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
                          handleDeletePhoto(photo._id);
                        }}
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          zIndex: 2,
                          backgroundColor: 'rgba(0, 0, 0, 0.4)',
                          color: '#FFFFFF',
                          '&:hover': {
                            backgroundColor: 'rgba(211, 47, 47, 0.9)'
                          },
                          width: 32,
                          height: 32,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          transition: 'all 0.2s ease'
                        }}
                        size="small"
                      >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    )}

                    {/* Selection Circle indicator - Bottom Right (Matches reference image style) */}
                    <Box
                      onClick={(e) => handleToggleSelect(photo._id, e)}
                      sx={{
                        position: 'absolute',
                        bottom: 16,
                        right: 16,
                        zIndex: 2,
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: isSelected ? 'none' : '2px solid rgba(255, 255, 255, 0.8)',
                        backgroundColor: isSelected ? '#0088ff' : 'rgba(0, 0, 0, 0.2)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          borderColor: '#FFFFFF',
                          backgroundColor: isSelected ? '#0088ff' : 'rgba(0, 0, 0, 0.35)',
                        }
                      }}
                    >
                      {isSelected && (
                        <CheckIcon sx={{ color: '#FFFFFF', fontSize: 16 }} />
                      )}
                    </Box>
                  </Card>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Upload Dialog */}
      <Dialog
        open={uploadOpen}
        onClose={() => !uploading && setUploadOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            border: 'none',
            overflow: 'hidden'
          }
        }}
      >
        {/* Header with Title and Close button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, pt: 3, pb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}>
            Upload New Media
          </Typography>
          <IconButton 
            onClick={() => !uploading && setUploadOpen(false)}
            disabled={uploading}
            sx={{ 
              color: '#64748B', 
              bgcolor: '#F1F5F9',
              '&:hover': { bgcolor: '#E2E8F0', color: '#1E293B' },
              transition: 'all 0.2s'
            }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <form onSubmit={handleUploadSubmit}>
          <DialogContent sx={{ px: 3, py: 1 }}>
            
            {/* File Drag and Drop Box */}
            <Box
              sx={{
                display: 'block',
                border: '2px dashed #D0D5DD',
                borderRadius: '16px',
                p: 4,
                textAlign: 'center',
                backgroundColor: '#F8FAFC',
                mb: 3,
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
              <input type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={handleFileChange} disabled={uploading} />
              
              {filePreviews.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Grid / Row of Previews */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                      gap: 1.5,
                      maxHeight: '260px',
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
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            border: '1px solid #E2E8F0',
                            bgcolor: '#000',
                            '&:hover .remove-preview-btn': {
                              opacity: 1
                            }
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
                          {/* Close / Remove button on preview */}
                          <IconButton
                            className="remove-preview-btn"
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
                              backgroundColor: 'rgba(0,0,0,0.5)',
                              p: 0.5,
                              opacity: { xs: 1, sm: 0 },
                              transition: 'opacity 0.2s',
                              '&:hover': {
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      );
                    })}
                  </Box>

                  {/* Upload summary & Add More option */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                      {selectedFiles.length} file(s) selected
                    </Typography>
                    
                    <Button
                      variant="text"
                      size="small"
                      component="span"
                      sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
                    >
                      Add more files
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                  {/* Styled Icon Wrapper */}
                  <Box
                    className="upload-icon-box"
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      bgcolor: '#F1F5F9',
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    <UploadIcon sx={{ fontSize: 28 }} />
                  </Box>

                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#334155', mb: 0.5 }}>
                    Click to Upload Media
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                    Supports multiple files selection
                  </Typography>
                </Box>
              )}
            </Box>

          </DialogContent>

          {/* Dialog Actions / Buttons */}
          <DialogActions sx={{ p: 3, display: 'flex', gap: 1.5 }}>
            <Button 
              onClick={() => setUploadOpen(false)} 
              color="inherit" 
              disabled={uploading}
              sx={{ 
                textTransform: 'none', 
                fontWeight: 600, 
                borderRadius: '10px',
                px: 2.5,
                py: 1
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={uploading || selectedFiles.length === 0}
              sx={{
                background: 'linear-gradient(135deg, #0088ff 0%, #0066cc 100%)',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '10px',
                px: 3,
                py: 1,
                boxShadow: '0 4px 12px rgba(0, 136, 255, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0077ee 0%, #0055aa 100%)',
                  boxShadow: '0 6px 16px rgba(0, 136, 255, 0.3)',
                }
              }}
            >
              {uploading ? (
                <CircularProgress size={20} sx={{ color: '#fff' }} />
              ) : (
                'Upload Media'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            border: 'none',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em', pt: 3 }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="body1" sx={{ color: '#64748B', lineHeight: 1.5 }}>
            {deleteTargetId
              ? 'Are you sure you want to permanently delete this item from the gallery? This action cannot be undone.'
              : `Are you sure you want to permanently delete the ${selectedIds.length} selected items from the gallery? This action cannot be undone.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, display: 'flex', gap: 1.5 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            color="inherit"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '10px',
              px: 2.5,
              py: 1
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={executeDelete}
            variant="contained"
            color="error"
            sx={{
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '10px',
              px: 3,
              py: 1,
              boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(211, 47, 47, 0.3)',
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fullscreen Lightbox Modal */}
      <Modal
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          backdropFilter: 'blur(5px)'
        }}
      >
        <Box sx={{ position: 'relative', maxWidth: '95vw', maxHeight: '90vh', outline: 'none' }}>
          {/* Close button */}
          <IconButton
            onClick={() => setLightboxOpen(false)}
            sx={{
              position: 'absolute',
              top: -45,
              right: 0,
              color: '#fff',
              backgroundColor: 'rgba(255,255,255,0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>

          {activePhoto && (
            <Box>
              {activePhoto.resourceType === 'video' ? (
                <video
                  src={activePhoto.url}
                  controls
                  autoPlay
                  style={{
                    maxWidth: '95vw',
                    maxHeight: '90vh',
                    borderRadius: '8px',
                    display: 'block',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                />
              ) : (
                <img
                  src={activePhoto.url}
                  alt={activePhoto.caption || 'Lightbox'}
                  style={{
                    maxWidth: '95vw',
                    maxHeight: '90vh',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    display: 'block',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                />
              )}
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default Gallery;
