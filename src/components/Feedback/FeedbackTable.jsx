import React from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography
} from '@mui/material';
import { RateReview as FeedbackIcon } from '@mui/icons-material';
import FeedbackSkeleton from './FeedbackSkeleton.jsx';
import FeedbackRow from './FeedbackRow.jsx';

export default function FeedbackTable({
  loading,
  paginatedFeedbacks,
  page,
  rowsPerPage,
  currentUser,
  isAdminOrWarden,
  searchQuery,
  statusFilter,
  onOpenView,
  onOpenEdit,
  onOpenDelete,
  onOpenReply,
  onToggleStatus,
  onToggleLike
}) {
  return (
    <TableContainer
      sx={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'auto',
        bgcolor: '#FFFFFF',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <Table stickyHeader sx={{ minWidth: 850 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: '#F8FAFC' }}>
            <TableCell
              sx={{
                py: 1.75,
                px: 2,
                fontWeight: 700,
                fontSize: '13px',
                color: '#64748B',
                bgcolor: '#F8FAFC',
                width: 50,
                borderBottom: '1px solid #EEF2F6',
                zIndex: 2
              }}
            >
              #
            </TableCell>
            <TableCell
              sx={{
                py: 1.75,
                px: 2,
                fontWeight: 700,
                fontSize: '13px',
                color: '#64748B',
                bgcolor: '#F8FAFC',
                minWidth: 160,
                borderBottom: '1px solid #EEF2F6',
                zIndex: 2
              }}
            >
              Member
            </TableCell>
            <TableCell
              sx={{
                py: 1.75,
                px: 2,
                fontWeight: 700,
                fontSize: '13px',
                color: '#64748B',
                bgcolor: '#F8FAFC',
                minWidth: 260,
                borderBottom: '1px solid #EEF2F6',
                zIndex: 2
              }}
            >
              Feedback
            </TableCell>
            <TableCell
              sx={{
                py: 1.75,
                px: 2,
                fontWeight: 700,
                fontSize: '13px',
                color: '#64748B',
                bgcolor: '#F8FAFC',
                minWidth: 120,
                borderBottom: '1px solid #EEF2F6',
                zIndex: 2
              }}
            >
              Status
            </TableCell>
            <TableCell
              sx={{
                py: 1.75,
                px: 2,
                fontWeight: 700,
                fontSize: '13px',
                color: '#64748B',
                bgcolor: '#F8FAFC',
                minWidth: 160,
                borderBottom: '1px solid #EEF2F6',
                zIndex: 2
              }}
            >
              Admin Reply
            </TableCell>
            <TableCell
              sx={{
                py: 1.75,
                px: 2,
                fontWeight: 700,
                fontSize: '13px',
                color: '#64748B',
                bgcolor: '#F8FAFC',
                minWidth: 80,
                borderBottom: '1px solid #EEF2F6',
                textAlign: 'center',
                zIndex: 2
              }}
            >
              Liked
            </TableCell>
            <TableCell
              sx={{
                py: 1.75,
                px: 2,
                fontWeight: 700,
                fontSize: '13px',
                color: '#64748B',
                bgcolor: '#F8FAFC',
                minWidth: 140,
                borderBottom: '1px solid #EEF2F6',
                zIndex: 2
              }}
            >
              Submitted On
            </TableCell>
            <TableCell
              sx={{
                py: 1.75,
                px: 2,
                fontWeight: 700,
                fontSize: '13px',
                color: '#64748B',
                bgcolor: '#F8FAFC',
                minWidth: 150,
                borderBottom: '1px solid #EEF2F6',
                textAlign: 'right',
                zIndex: 2
              }}
            >
              Actions
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {loading ? (
            <FeedbackSkeleton rows={rowsPerPage > 10 ? 10 : rowsPerPage} />
          ) : paginatedFeedbacks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} sx={{ py: 8, textAlign: 'center' }}>
                <FeedbackIcon sx={{ fontSize: 44, color: '#94A3B8', mb: 1, opacity: 0.6 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                  No feedbacks found
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try clearing the search query or status filter.'
                    : 'No feedback submissions available.'}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            paginatedFeedbacks.map((item, idx) => (
              <FeedbackRow
                key={item._id}
                item={item}
                index={idx}
                page={page}
                rowsPerPage={rowsPerPage}
                currentUser={currentUser}
                isAdminOrWarden={isAdminOrWarden}
                onOpenView={onOpenView}
                onOpenEdit={onOpenEdit}
                onOpenDelete={onOpenDelete}
                onOpenReply={onOpenReply}
                onToggleStatus={onToggleStatus}
                onToggleLike={onToggleLike}
              />
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
