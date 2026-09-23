import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Avatar,
  Button
} from '@mui/material';
import { PhotoCamera as CameraIcon } from '@mui/icons-material';

export default function PhotoPreviewDialog({
  open,
  onClose,
  user,
  name,
  canEdit,
  onChangePhotoClick
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
          borderRadius: '20px',
          p: 2,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          textAlign: 'center'
        }
      }}
    >
      <DialogContent sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ position: 'relative', mb: 2.5 }}>
          <Avatar
            src={user?.profilePhoto?.url || ''}
            alt={user?.name || name}
            sx={{
              width: 250,
              height: 250,
              borderRadius: '50%',
              border: '3px dashed #0088FF',
              fontSize: '4rem',
              fontWeight: 700,
              '& .MuiAvatar-img': {
                borderRadius: '50%',
                objectFit: 'cover',
                width: '100%',
                height: '100%'
              }
            }}
          >
            {(user?.name || name)?.charAt(0)}
          </Avatar>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 1, pt: 0, justifyContent: 'center' }}>
        {canEdit && (
          <Button
            variant="outlined"
            startIcon={<CameraIcon />}
            onClick={() => {
              onClose();
              if (onChangePhotoClick) onChangePhotoClick();
            }}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#CBD5E1',
              color: '#334155',
              mr: 1
            }}
          >
            Change Photo
          </Button>
        )}
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            bgcolor: '#0088ff',
            boxShadow: 'none',
            '&:hover': { bgcolor: '#0066cc', boxShadow: 'none' }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
