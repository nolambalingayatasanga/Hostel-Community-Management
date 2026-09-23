import React from 'react';
import {
  Box,
  Stack,
  Typography,
  Select,
  MenuItem,
  IconButton
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';

export default function FeedbackPagination({
  page,
  rowsPerPage,
  totalItems,
  onPageChange,
  onRowsPerPageChange
}) {
  const startItem = totalItems === 0 ? 0 : page * rowsPerPage + 1;
  const endItem = Math.min((page + 1) * rowsPerPage, totalItems);

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderTop: '1px solid #EEF2F6',
        bgcolor: '#FFFFFF',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1.5,
        flexShrink: 0
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography
          variant="body2"
          sx={{ fontSize: { xs: '12px', sm: '13px' }, color: '#64748B' }}
        >
          Rows per page:
        </Typography>
        <Select
          size="small"
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
          sx={{
            height: 32,
            fontSize: { xs: '12px', sm: '13px' },
            borderRadius: '8px',
            '& .MuiSelect-select': { py: 0.5, px: 1.25 }
          }}
        >
          {[10, 25, 50, 100].map((num) => (
            <MenuItem key={num} value={num} sx={{ fontSize: '13px' }}>
              {num}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Typography
          variant="body2"
          sx={{ fontSize: { xs: '12px', sm: '13px' }, color: '#64748B' }}
        >
          {totalItems === 0 ? '0 of 0' : `${startItem}–${endItem} of ${totalItems}`}
        </Typography>

        <Stack direction="row" spacing={0.5}>
          <IconButton
            size="small"
            onClick={() => onPageChange(Math.max(0, page - 1))}
            disabled={page === 0}
            sx={{
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              p: 0.5,
              '&:disabled': { opacity: 0.4 }
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onPageChange(page + 1)}
            disabled={(page + 1) * rowsPerPage >= totalItems}
            sx={{
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              p: 0.5,
              '&:disabled': { opacity: 0.4 }
            }}
          >
            <ChevronRightIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
}
