import React from 'react';
import {
  Box,
  Stack,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

export default function JobToolbar({
  stats,
  jobTypeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onClearSearch,
  loading,
  onRefresh
}) {
  return (
    <Box
      sx={{
        p: 2,
        bgcolor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', md: 'center' },
        gap: 1.5,
        flexShrink: 0
      }}
    >
      {/* Filter Chips */}
      <Stack
        direction="row"
        spacing={1}
        sx={{
          overflowX: 'auto',
          pb: { xs: 0.5, md: 0 },
          alignItems: 'center'
        }}
      >
        <Chip
          label={`All (${stats?.total || 0})`}
          onClick={() => onFilterChange('All')}
          color={jobTypeFilter === 'All' ? 'primary' : 'default'}
          variant={jobTypeFilter === 'All' ? 'filled' : 'outlined'}
          sx={{ fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}
        />
        <Chip
          label={`Full-time (${stats?.fullTime || 0})`}
          onClick={() => onFilterChange('Full-time')}
          color={jobTypeFilter === 'Full-time' ? 'primary' : 'default'}
          variant={jobTypeFilter === 'Full-time' ? 'filled' : 'outlined'}
          sx={{ fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}
        />
        <Chip
          label={`Internship (${stats?.internship || 0})`}
          onClick={() => onFilterChange('Internship')}
          color={jobTypeFilter === 'Internship' ? 'secondary' : 'default'}
          variant={jobTypeFilter === 'Internship' ? 'filled' : 'outlined'}
          sx={{ fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}
        />
        <Chip
          label={`Hybrid (${stats?.hybrid || 0})`}
          onClick={() => onFilterChange('Hybrid')}
          color={jobTypeFilter === 'Hybrid' ? 'info' : 'default'}
          variant={jobTypeFilter === 'Hybrid' ? 'filled' : 'outlined'}
          sx={{ fontWeight: 600, borderRadius: '8px', cursor: 'pointer' }}
        />
      </Stack>

      {/* Search and Refresh */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: { xs: '100%', md: 320 } }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search job title, company, location..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={onClearSearch} sx={{ p: 0.5 }}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              height: 38,
              fontSize: '13px'
            }
          }}
        />

        <Tooltip title="Refresh job listings">
          <IconButton
            onClick={onRefresh}
            disabled={loading}
            sx={{
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              bgcolor: '#FFFFFF',
              color: '#64748B',
              p: 0.9,
              flexShrink: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease',
              '&:hover': { bgcolor: '#F8FAFC', color: '#1E293B', borderColor: '#CBD5E1' }
            }}
          >
            <RefreshIcon
              sx={{
                fontSize: 20,
                animation: loading ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }}
            />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}
