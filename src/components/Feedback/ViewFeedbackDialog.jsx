import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Avatar,
  Box,
  Typography,
  Chip,
  Button,
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as PendingIcon,
  Favorite as FavoriteIcon,
  Reply as ReplyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';

export default function ViewFeedbackDialog({
  open,
  onClose,
  item,
  currentUser,
  isAdminOrWarden,
  onOpenEdit,
  onOpenReply,
  onOpenDelete
}) {
  if (!item) return null;

  const isOwner = String(item.user?._id || item.user) === String(currentUser?._id || currentUser?.id);

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
          alignItems: 'center'
        }}
      >
        <span>Feedback Details</span>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: '#F1F5F9' }}>
        <Stack spacing={2.5}>
          {/* Submitter Info Header */}
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Avatar
              src={item.user?.profilePhoto?.url || ''}
              sx={{ width: 44, height: 44, bgcolor: '#0088ff', fontWeight: 700 }}
            >
              {item.user?.name?.charAt(0) || <PersonIcon />}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                {item.user?.name || 'User'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                {item.user?.email || item.user?.phone || 'Community Member'} • Role: {item.user?.role || 'MEMBER'}
              </Typography>
            </Box>

            <Chip
              icon={item.status === 'accepted' ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : <PendingIcon sx={{ fontSize: 14 }} />}
              label={item.status === 'accepted' ? 'Accepted' : 'Pending'}
              size="small"
              sx={{
                fontWeight: 700,
                bgcolor: item.status === 'accepted' ? '#D1FAE5' : '#FEF3C7',
                color: item.status === 'accepted' ? '#065F46' : '#92400E'
              }}
            />
          </Stack>

          {/* Feedback Content */}
          <Box sx={{ bgcolor: '#F8FAFC', p: 2, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 0.75 }}>
              Feedback Content:
            </Typography>
            <Typography variant="body1" sx={{ color: '#1E293B', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {item.content}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', mt: 1.5, display: 'block' }}>
              Submitted on {new Date(item.createdAt).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
              {item.isEdited && ' • (edited)'}
            </Typography>
          </Box>

          {/* Admin Like Status */}
          {item.isLiked && (
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: 'center',
                color: '#B91C1C',
                bgcolor: '#FEE2E2',
                p: 1.25,
                borderRadius: '8px'
              }}
            >
              <FavoriteIcon sx={{ fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                Liked by Administration {item.likedAt ? `on ${new Date(item.likedAt).toLocaleDateString()}` : ''}
              </Typography>
            </Stack>
          )}

          {/* Admin Reply */}
          {item.adminReply && (
            <Box sx={{ bgcolor: '#F0F9FF', p: 2, borderRadius: '12px', borderLeft: '4px solid #0088ff' }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: '#0088ff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  mb: 0.75
                }}
              >
                <ReplyIcon sx={{ fontSize: 16, transform: 'scaleX(-1)' }} />
                Official Admin Reply {item.repliedBy?.name ? `(${item.repliedBy.name})` : ''}
              </Typography>
              <Typography variant="body2" sx={{ color: '#1E293B', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {item.adminReply}
              </Typography>
              {item.repliedAt && (
                <Typography variant="caption" sx={{ color: '#94A3B8', mt: 1, display: 'block' }}>
                  Replied on {new Date(item.repliedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </Typography>
              )}
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        {/* Owner can edit */}
        {isOwner && (
          <Button
            startIcon={<EditIcon />}
            onClick={() => {
              onClose();
              onOpenEdit(item);
            }}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#0088ff' }}
          >
            Edit Feedback
          </Button>
        )}

        {/* Admin can reply */}
        {isAdminOrWarden && (
          <Button
            startIcon={<ReplyIcon />}
            onClick={() => {
              onClose();
              onOpenReply(item);
            }}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#0088ff' }}
          >
            {item.adminReply ? 'Edit Reply' : 'Send Reply'}
          </Button>
        )}

        {/* Delete: Owner and Admin */}
        {(isOwner || isAdminOrWarden) && (
          <Button
            startIcon={<DeleteIcon />}
            onClick={() => onOpenDelete(item)}
            color="error"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Delete
          </Button>
        )}

        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600, color: '#64748B' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
