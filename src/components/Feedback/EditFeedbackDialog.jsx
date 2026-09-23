import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Box,
  Button,
  CircularProgress
} from '@mui/material';

export default function EditFeedbackDialog({
  open,
  onClose,
  content,
  onContentChange,
  onSave,
  saving
}) {
  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: { sx: { borderRadius: '16px', p: 1 } }
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', pb: 1 }}>
        Edit Feedback
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
          Update your feedback below.
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={5}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          disabled={saving}
          inputProps={{ maxLength: 3000 }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              fontSize: '14px'
            }
          }}
        />
        <Box sx={{ mt: 1, textAlign: 'right' }}>
          <Typography
            variant="caption"
            sx={{ color: content.length > 2800 ? '#EF4444' : '#94A3B8' }}
          >
            {content.length} / 3000 characters
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{ textTransform: 'none', fontWeight: 600, color: '#64748B' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={saving || !content.trim()}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: '#0088ff',
            borderRadius: '10px',
            px: 3,
            '&:hover': { bgcolor: '#0077ee' }
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
