import React from 'react';
import {
  TableRow,
  TableCell,
  Stack,
  Avatar,
  Box,
  Typography,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as PendingIcon,
  Reply as ReplyIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

export default function FeedbackRow({
  item,
  index,
  page,
  rowsPerPage,
  currentUser,
  isAdminOrWarden,
  onOpenView,
  onOpenEdit,
  onOpenDelete,
  onOpenReply,
  onToggleStatus,
  onToggleLike
}) {
  const isOwner = String(item.user?._id || item.user) === String(currentUser?._id || currentUser?.id);
  const isAccepted = item.status === 'accepted';
  const rowNumber = page * rowsPerPage + index + 1;
  const createdDate = new Date(item.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    <TableRow
      hover
      sx={{
        bgcolor: isAccepted ? 'rgba(240, 253, 244, 0.4)' : '#FFFFFF',
        transition: 'background-color 0.15s ease',
        '&:last-child td, &:last-child th': { border: 0 }
      }}
    >
      {/* # Index */}
      <TableCell
        sx={{
          py: { xs: 1, sm: 1.5 },
          px: { xs: 1, sm: 2 },
          fontSize: { xs: '11.5px', sm: '13px' },
          color: '#64748B',
          fontWeight: 600
        }}
      >
        {rowNumber}
      </TableCell>

      {/* Member Info */}
      <TableCell sx={{ py: { xs: 1, sm: 1.5 }, px: { xs: 1, sm: 2 } }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Avatar
            src={item.user?.profilePhoto?.url || ''}
            sx={{
              width: { xs: 28, sm: 34 },
              height: { xs: 28, sm: 34 },
              bgcolor: '#0088ff',
              fontSize: { xs: '11px', sm: '13px' },
              fontWeight: 700
            }}
          >
            {item.user?.name?.charAt(0) || <PersonIcon sx={{ fontSize: { xs: 14, sm: 18 } }} />}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: '#0F172A',
                whiteSpace: 'nowrap',
                fontSize: { xs: '12px', sm: '13.5px' }
              }}
            >
              {item.user?.name || 'User'} {isOwner ? '(You)' : ''}
            </Typography>
            {item.user?.role && (
              <Chip
                label={item.user.role}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '9.5px',
                  fontWeight: 700,
                  bgcolor: '#F1F5F9',
                  color: '#475569',
                  mt: 0.25
                }}
              />
            )}
          </Box>
        </Stack>
      </TableCell>

      {/* Feedback Text Content */}
      <TableCell sx={{ py: { xs: 1, sm: 1.5 }, px: { xs: 1, sm: 2 }, maxWidth: 320 }}>
        <Box
          onClick={() => onOpenView(item)}
          sx={{
            cursor: 'pointer',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: { xs: '12px', sm: '13.5px' },
            color: '#1E293B',
            lineHeight: 1.4,
            '&:hover': { color: '#0088ff' }
          }}
        >
          {item.content}
        </Box>
        {item.isEdited && (
          <Typography
            variant="caption"
            sx={{
              color: '#94A3B8',
              fontStyle: 'italic',
              display: 'block',
              mt: 0.25,
              fontSize: '11px'
            }}
          >
            (edited)
          </Typography>
        )}
      </TableCell>

      {/* Status */}
      <TableCell sx={{ py: { xs: 1, sm: 1.5 }, px: { xs: 1, sm: 2 } }}>
        <Chip
          icon={
            isAccepted
              ? <CheckCircleIcon sx={{ fontSize: '13px !important', color: '#059669 !important' }} />
              : <PendingIcon sx={{ fontSize: '13px !important', color: '#D97706 !important' }} />
          }
          label={isAccepted ? 'Accepted' : 'Pending'}
          size="small"
          sx={{
            height: 24,
            fontSize: '11px',
            fontWeight: 700,
            bgcolor: isAccepted ? '#D1FAE5' : '#FEF3C7',
            color: isAccepted ? '#065F46' : '#92400E',
            border: '1px solid',
            borderColor: isAccepted ? '#6EE7B7' : '#FCD34D'
          }}
        />
      </TableCell>

      {/* Admin Reply */}
      <TableCell sx={{ py: { xs: 1, sm: 1.5 }, px: { xs: 1, sm: 2 }, maxWidth: 220 }}>
        {item.adminReply ? (
          <Box
            onClick={() => onOpenView(item)}
            sx={{
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              p: 0.75,
              bgcolor: '#F0F9FF',
              border: '1px solid #BAE6FD',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#0284C7',
              fontWeight: 600,
              maxWidth: '100%',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis'
            }}
          >
            <ReplyIcon sx={{ fontSize: 14, transform: 'scaleX(-1)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.adminReply}</span>
          </Box>
        ) : (
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
            —
          </Typography>
        )}
      </TableCell>

      {/* Liked */}
      <TableCell sx={{ py: { xs: 1, sm: 1.5 }, px: { xs: 1, sm: 2 }, textAlign: 'center' }}>
        {isAdminOrWarden ? (
          <Tooltip title={item.isLiked ? 'Unlike' : 'Like'}>
            <IconButton
              size="small"
              onClick={() => onToggleLike(item)}
              sx={{
                color: item.isLiked ? '#EF4444' : '#94A3B8',
                p: 0.5,
                '&:hover': { bgcolor: '#FEE2E2', color: '#EF4444' }
              }}
            >
              {item.isLiked ? <FavoriteIcon sx={{ fontSize: 18 }} /> : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
        ) : item.isLiked ? (
          <Tooltip title="Liked by Administration">
            <FavoriteIcon sx={{ fontSize: 18, color: '#EF4444' }} />
          </Tooltip>
        ) : (
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>—</Typography>
        )}
      </TableCell>

      {/* Submitted Date */}
      <TableCell
        sx={{
          py: { xs: 1, sm: 1.5 },
          px: { xs: 1, sm: 2 },
          fontSize: { xs: '11.5px', sm: '12.5px' },
          color: '#64748B',
          whiteSpace: 'nowrap'
        }}
      >
        {createdDate}
      </TableCell>

      {/* Actions */}
      <TableCell sx={{ py: { xs: 1, sm: 1.5 }, px: { xs: 1, sm: 2 }, textAlign: 'right' }}>
        <Stack
          direction="row"
          spacing={0.75}
          sx={{
            justifyContent: 'flex-end',
            alignItems: 'center'
          }}
        >
          {/* View Details: Hidden on mobile devices per user constraint */}
          <Tooltip title="View details">
            <IconButton
              size="small"
              onClick={() => onOpenView(item)}
              sx={{
                color: '#64748B',
                display: { xs: 'none', sm: 'inline-flex' },
                '&:hover': { color: '#0088ff', bgcolor: '#F0F9FF' }
              }}
            >
              <ViewIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          {/* Owner: Edit Feedback */}
          {isOwner && (
            <Tooltip title="Edit your feedback">
              <IconButton
                size="small"
                onClick={() => onOpenEdit(item)}
                sx={{
                  color: '#0088ff',
                  p: { xs: 0.5, sm: 0.75 },
                  '&:hover': { bgcolor: 'rgba(0, 136, 255, 0.1)' }
                }}
              >
                <EditIcon sx={{ fontSize: { xs: 15, sm: 16 } }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Admin: Accept / Status */}
          {isAdminOrWarden && (
            <Tooltip title={isAccepted ? 'Mark pending' : 'Mark accepted'}>
              <IconButton
                size="small"
                onClick={() => onToggleStatus(item)}
                sx={{
                  color: isAccepted ? '#059669' : '#D97706',
                  p: { xs: 0.5, sm: 0.75 },
                  '&:hover': { bgcolor: isAccepted ? '#D1FAE5' : '#FEF3C7' }
                }}
              >
                <CheckCircleIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Admin: Reply */}
          {isAdminOrWarden && (
            <Tooltip title={item.adminReply ? 'Edit reply' : 'Reply'}>
              <IconButton
                size="small"
                onClick={() => onOpenReply(item)}
                sx={{
                  color: '#0088ff',
                  p: { xs: 0.5, sm: 0.75 },
                  '&:hover': { bgcolor: '#F0F9FF' }
                }}
              >
                <ReplyIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Delete: Available for Admin and Owner */}
          {(isOwner || isAdminOrWarden) && (
            <Tooltip title={isOwner ? 'Delete your feedback' : 'Delete feedback'}>
              <IconButton
                size="small"
                onClick={() => onOpenDelete(item)}
                sx={{
                  color: '#EF4444',
                  p: { xs: 0.5, sm: 0.75 },
                  '&:hover': { bgcolor: '#FEF2F2' }
                }}
              >
                <DeleteIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
}
