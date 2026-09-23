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

export default function DeleteRecordDialog({
  open,
  onClose,
  target,
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
        paper: { sx: { borderRadius: '16px' } }
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, color: '#0F172A' }}>
        Delete Activity Record?
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          Are you sure you want to delete this scan entry from {target?.ip || 'unknown IP'}? The overall scan count will adjust accordingly.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={deleting} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirmDelete}
          disabled={deleting}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {deleting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
