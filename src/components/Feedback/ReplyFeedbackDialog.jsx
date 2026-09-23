import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress
} from '@mui/material';

export default function ReplyFeedbackDialog({
  open,
  onClose,
  item,
  replyText,
  onReplyTextChange,
  onSaveReply,
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
        {item?.adminReply ? 'Edit Admin Reply' : 'Send Admin Reply'}
      </DialogTitle>
      <DialogContent>
        {item && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              bgcolor: '#F8FAFC',
              borderRadius: '10px',
              borderLeft: '3px solid #CBD5E1'
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>
              User Feedback from {item.user?.name || 'User'}:
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155', mt: 0.5, fontStyle: 'italic' }}>
              "{item.content}"
            </Typography>
          </Box>
        )}
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="Type your official reply to the user..."
          value={replyText}
          onChange={(e) => onReplyTextChange(e.target.value)}
          disabled={saving}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              fontSize: '14px'
            }
          }}
        />
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
          onClick={onSaveReply}
          disabled={saving}
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
          {saving ? 'Saving...' : 'Send Reply'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
