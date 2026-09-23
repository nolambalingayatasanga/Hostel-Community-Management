import React from 'react';
import { TableRow, TableCell, Skeleton, Box, Stack } from '@mui/material';

export default function FeedbackSkeleton({ rows = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, idx) => (
        <TableRow key={`skeleton-row-${idx}`} sx={{ '&:last-child td': { border: 0 } }}>
          {/* Index */}
          <TableCell sx={{ py: 1.75, px: 2 }}>
            <Skeleton variant="text" width={20} height={20} />
          </TableCell>

          {/* Member */}
          <TableCell sx={{ py: 1.75, px: 2 }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <Skeleton variant="circular" width={34} height={34} />
              <Box sx={{ minWidth: 100 }}>
                <Skeleton variant="text" width="80%" height={18} />
                <Skeleton variant="rounded" width={50} height={16} sx={{ borderRadius: '4px', mt: 0.5 }} />
              </Box>
            </Stack>
          </TableCell>

          {/* Content */}
          <TableCell sx={{ py: 1.75, px: 2 }}>
            <Skeleton variant="text" width="95%" height={18} />
            <Skeleton variant="text" width="65%" height={16} />
          </TableCell>

          {/* Status */}
          <TableCell sx={{ py: 1.75, px: 2 }}>
            <Skeleton variant="rounded" width={75} height={24} sx={{ borderRadius: '12px' }} />
          </TableCell>

          {/* Admin Reply */}
          <TableCell sx={{ py: 1.75, px: 2 }}>
            <Skeleton variant="rounded" width={110} height={26} sx={{ borderRadius: '8px' }} />
          </TableCell>

          {/* Liked */}
          <TableCell sx={{ py: 1.75, px: 2, textAlign: 'center' }}>
            <Skeleton variant="circular" width={24} height={24} sx={{ mx: 'auto' }} />
          </TableCell>

          {/* Date */}
          <TableCell sx={{ py: 1.75, px: 2 }}>
            <Skeleton variant="text" width={90} height={18} />
          </TableCell>

          {/* Actions */}
          <TableCell sx={{ py: 1.75, px: 2, textAlign: 'right' }}>
            <Stack direction="row" spacing={0.75} sx={{ justifyContent: 'flex-end', alignItems: 'center' }}>
              <Skeleton variant="circular" width={28} height={28} />
              <Skeleton variant="circular" width={28} height={28} />
            </Stack>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
