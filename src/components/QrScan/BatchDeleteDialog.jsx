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

export default function BatchDeleteDialog({
  open,
  onClose,
  selectedCount,
  onConfirmBatchDelete,
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
        Delete Selected Records?
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          Are you sure you want to delete {selectedCount} selected activity {selectedCount === 1 ? 'record' : 'records'}? The overall scan and click counts will adjust accordingly.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={deleting} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirmBatchDelete}
          disabled={deleting}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {deleting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : `Delete (${selectedCount})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
