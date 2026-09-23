import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  CircularProgress
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

export default function DeleteJobDialog({
  open,
  onClose,
  job,
  deleting = false,
  onConfirmDelete
}) {
  return (
    <Dialog
      open={open}
      onClose={() => !deleting && onClose()}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
    >
      <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
        <DeleteIcon sx={{ color: '#EF4444' }} />
        <span>Delete Job Opening</span>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Are you sure you want to delete this job opening for <strong>{job?.jobRole}</strong>? All submitted applications for this role will also be removed.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={deleting} sx={{ textTransform: 'none', color: '#64748B' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirmDelete}
          disabled={deleting}
          startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ borderRadius: '8px', px: 2.5, textTransform: 'none', fontWeight: 700 }}
        >
          {deleting ? 'Deleting...' : 'Delete Job'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
