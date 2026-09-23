import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  IconButton,
  Typography,
  TextField,
  Box,
  Button,
  CircularProgress
} from '@mui/material';
import {
  RateReview as FeedbackIcon,
  Close as CloseIcon,
  Send as SendIcon
} from '@mui/icons-material';

export default function CreateFeedbackDialog({
  open,
  onClose,
  content,
  onContentChange,
  onSubmit,
  submitting
}) {
  return (
    <Dialog
      open={open}
      onClose={() => !submitting && onClose()}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: { sx: { borderRadius: '16px', p: 1 } }
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 800,
          color: '#0F172A',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <FeedbackIcon sx={{ color: '#0088ff', fontSize: 22 }} />
          <span>Add Feedback</span>
        </Stack>
        <IconButton
          size="small"
          onClick={() => !submitting && onClose()}
          sx={{ color: '#94A3B8' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
          Share your thoughts, suggestions, appreciation, or concerns directly with the administration.
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={5}
          placeholder="Write your feedback, suggestion, appreciation, or concern here..."
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          disabled={submitting}
          inputProps={{ maxLength: 3000 }}
          autoFocus
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              fontSize: '14px',
              backgroundColor: '#FAFAFA',
              '&:hover': { backgroundColor: '#FFFFFF' },
              '&.Mui-focused': { backgroundColor: '#FFFFFF', borderColor: '#0088ff' }
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
          disabled={submitting}
          sx={{ textTransform: 'none', fontWeight: 600, color: '#64748B' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={submitting || !content.trim()}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon sx={{ fontSize: 16 }} />}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: '#0088ff',
            borderRadius: '10px',
            px: 3,
            boxShadow: '0 2px 8px rgba(0, 136, 255, 0.25)',
            '&:hover': { bgcolor: '#0077ee', boxShadow: 'none' }
          }}
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
