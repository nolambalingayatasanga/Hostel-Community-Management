import React from 'react';
import {
  TableRow,
  TableCell,
  Skeleton,
  Stack,
  Box,
  Card
} from '@mui/material';

export function JobTableSkeleton({ rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <TableRow key={`skeleton-row-${index}`} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
          {/* # */}
          <TableCell sx={{ py: 1.75, px: 2 }}>
            <Skeleton variant="text" width={20} height={20} />
          </TableCell>

          {/* Company */}
          <TableCell sx={{ py: 1.75, px: 2 }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: '10px' }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width={110} height={18} />
                <Skeleton variant="text" width={70} height={14} />
              </Box>
            </Stack>
          </TableCell>

          {/* Role */}
          <TableCell sx={{ py: 1.75, px: 2 }}>
            <Skeleton variant="text" width={130} height={20} />
            <Skeleton variant="rounded" width={65} height={18} sx={{ borderRadius: '6px', mt: 0.5 }} />
          </TableCell>

          {/* Location */}
          <TableCell sx={{ py: 1.75, px: 2 }}>
            <Skeleton variant="text" width={90} height={18} />
          </TableCell>

          {/* Experience & Edu */}
          <TableCell sx={{ py: 1.75, px: 2 }}>
            <Skeleton variant="text" width={75} height={18} />
            <Skeleton variant="text" width={110} height={14} />
          </TableCell>

          {/* Salary */}
          <TableCell sx={{ py: 1.75, px: 2 }}>
            <Skeleton variant="text" width={80} height={18} />
          </TableCell>

          {/* Mode */}
          <TableCell sx={{ py: 1.75, px: 2 }}>
            <Skeleton variant="rounded" width={75} height={22} sx={{ borderRadius: '6px' }} />
          </TableCell>

          {/* Applied */}
          <TableCell sx={{ py: 1.75, px: 2, textAlign: 'center' }}>
            <Skeleton variant="rounded" width={70} height={24} sx={{ borderRadius: '6px', mx: 'auto' }} />
          </TableCell>

          {/* Openings */}
          <TableCell sx={{ py: 1.75, px: 2, textAlign: 'center' }}>
            <Skeleton variant="text" width={24} height={20} sx={{ mx: 'auto' }} />
          </TableCell>

          {/* Actions */}
          <TableCell sx={{ py: 1.75, px: 2, textAlign: 'right' }}>
            <Stack direction="row" spacing={0.75} justifyContent="flex-end" alignItems="center">
              <Skeleton variant="circular" width={28} height={28} />
              <Skeleton variant="rounded" width={55} height={28} sx={{ borderRadius: '8px' }} />
            </Stack>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function JobCardsSkeleton({ cards = 4 }) {
  return (
    <Stack spacing={2}>
      {Array.from({ length: cards }).map((_, index) => (
        <Card
          key={`skeleton-card-${index}`}
          elevation={0}
          sx={{
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: '12px' }} />
              <Box>
                <Skeleton variant="text" width={120} height={20} />
                <Skeleton variant="text" width={80} height={14} />
              </Box>
            </Stack>
            <Skeleton variant="rounded" width={65} height={22} sx={{ borderRadius: '6px' }} />
          </Box>

          {/* Title */}
          <Skeleton variant="text" width="70%" height={24} />

          {/* Spec Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 1,
              bgcolor: '#F8FAFC',
              p: 1.25,
              borderRadius: '10px'
            }}
          >
            <Skeleton variant="text" width="80%" height={16} />
            <Skeleton variant="text" width="70%" height={16} />
            <Skeleton variant="text" width="60%" height={16} />
            <Skeleton variant="text" width="65%" height={16} />
          </Box>

          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid #F1F5F9' }}>
            <Skeleton variant="rounded" width={70} height={30} sx={{ borderRadius: '8px' }} />
            <Skeleton variant="rounded" width={85} height={30} sx={{ borderRadius: '8px' }} />
          </Box>
        </Card>
      ))}
    </Stack>
  );
}
