import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Stack,
  Box,
  Button
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  PhotoCamera as CameraIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

export default function PhotoSelectionDialog({
  open,
  onClose,
  onUploadClick,
  onCameraClick,
  onPreviewClick
}) {
  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      disableScrollLock
      PaperProps={{
        sx: {
          borderRadius: '16px',
          p: 1,
          boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, pt: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '1.1rem' }}>
          Update Profile Photo
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 2 }}>
        <Stack spacing={2}>
          {/* Option 1: Upload from Device */}
          <Box
            onClick={() => {
              onClose();
              if (onUploadClick) onUploadClick();
            }}
            sx={{
              p: 2,
              borderRadius: '12px',
              border: '1.5px solid #E2E8F0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#0088ff',
                bgcolor: '#F0F7FF',
                transform: 'translateY(-1px)'
              }
            }}
          >
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '10px',
                bgcolor: '#EBF5FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0088ff',
                flexShrink: 0
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                Update Profile Photo
              </Typography>
            </Box>
          </Box>

          {/* Option 2: Take Photo */}
          <Box
            onClick={() => {
              onClose();
              if (onCameraClick) onCameraClick();
            }}
            sx={{
              p: 2,
              borderRadius: '12px',
              border: '1.5px solid #E2E8F0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#0088ff',
                bgcolor: '#F0F7FF',
                transform: 'translateY(-1px)'
              }
            }}
          >
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '10px',
                bgcolor: '#F0FDF4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
                flexShrink: 0
              }}
            >
              <CameraIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                Take Profile Photo
              </Typography>
            </Box>
          </Box>

          {/* Option 3: View Preview */}
          <Box
            onClick={() => {
              onClose();
              if (onPreviewClick) onPreviewClick();
            }}
            sx={{
              p: 2,
              borderRadius: '12px',
              border: '1.5px solid #E2E8F0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#6366F1',
                bgcolor: '#F5F3FF',
                transform: 'translateY(-1px)'
              }
            }}
          >
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '10px',
                bgcolor: '#EEF2FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6366F1',
                flexShrink: 0
              }}
            >
              <VisibilityIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                View Profile Preview
              </Typography>
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          fullWidth
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            borderColor: '#E2E8F0',
            color: '#64748B'
          }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
