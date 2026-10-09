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
          sx={{
            fontWeight: 700,
            borderRadius: '10px',
            cursor: 'pointer',
            fontFamily: '"Outfit", sans-serif',
            bgcolor: jobTypeFilter === 'All' ? '#0088ff' : '#F1F5F9',
            color: jobTypeFilter === 'All' ? '#FFFFFF' : '#475569',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: jobTypeFilter === 'All' ? '#0077ee' : '#E2E8F0'
            }
          }}
        />
        <Chip
          label={`Full-time (${stats?.fullTime || 0})`}
          onClick={() => onFilterChange('Full-time')}
          sx={{
            fontWeight: 700,
            borderRadius: '10px',
            cursor: 'pointer',
            fontFamily: '"Outfit", sans-serif',
            bgcolor: jobTypeFilter === 'Full-time' ? '#0088ff' : '#F1F5F9',
            color: jobTypeFilter === 'Full-time' ? '#FFFFFF' : '#475569',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: jobTypeFilter === 'Full-time' ? '#0077ee' : '#E2E8F0'
            }
          }}
        />
        <Chip
          label={`Internship (${stats?.internship || 0})`}
          onClick={() => onFilterChange('Internship')}
          sx={{
            fontWeight: 700,
            borderRadius: '10px',
            cursor: 'pointer',
            fontFamily: '"Outfit", sans-serif',
            bgcolor: jobTypeFilter === 'Internship' ? '#6366f1' : '#F1F5F9',
            color: jobTypeFilter === 'Internship' ? '#FFFFFF' : '#475569',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: jobTypeFilter === 'Internship' ? '#4f46e5' : '#E2E8F0'
            }
          }}
        />
        <Chip
          label={`Hybrid (${stats?.hybrid || 0})`}
          onClick={() => onFilterChange('Hybrid')}
          sx={{
            fontWeight: 700,
            borderRadius: '10px',
            cursor: 'pointer',
            fontFamily: '"Outfit", sans-serif',
            bgcolor: jobTypeFilter === 'Hybrid' ? '#0ea5e9' : '#F1F5F9',
            color: jobTypeFilter === 'Hybrid' ? '#FFFFFF' : '#475569',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: jobTypeFilter === 'Hybrid' ? '#0284c7' : '#E2E8F0'
            }
          }}
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
              boxShadow: 'none',
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
