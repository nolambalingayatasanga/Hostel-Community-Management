import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

export default function DeleteFeedbackDialog({
  open,
  onClose,
  item,
  onConfirmDelete,
  deleting
}) {
  return (
    <Dialog
      open={open}
      onClose={() => !deleting && onClose()}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: { sx: { borderRadius: '16px', p: 1 } }
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 800,
          color: '#0F172A',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <DeleteIcon sx={{ color: '#EF4444' }} />
        <span>Delete Feedback</span>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Are you sure you want to delete this feedback? This action cannot be undone.
        </Typography>
        {item && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              bgcolor: '#F8FAFC',
              borderRadius: '10px',
              borderLeft: '3px solid #EF4444'
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
              From: {item.user?.name || 'User'}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#334155',
                mt: 0.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              "{item.content}"
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          disabled={deleting}
          sx={{ textTransform: 'none', fontWeight: 600, color: '#64748B' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirmDelete}
          disabled={deleting}
          startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon sx={{ fontSize: 18 }} />}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '10px',
            px: 2.5
          }}
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
