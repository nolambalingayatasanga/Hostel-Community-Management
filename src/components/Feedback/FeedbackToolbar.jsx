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
  Pending as PendingIcon,
  CheckCircle as CheckCircleIcon,
  Reply as ReplyIcon,
  Favorite as FavoriteIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

export default function FeedbackToolbar({
  stats,
  statusFilter,
  onStatusChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  loading
}) {
  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2 },
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
      {/* Left: Filter Chips */}
      <Stack
        direction="row"
        spacing={1}
        sx={{
          overflowX: 'auto',
          pb: { xs: 0.5, md: 0 },
          alignItems: 'center',
          '&::-webkit-scrollbar': { height: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 2 }
        }}
      >
        <Chip
          label={`All (${stats.total})`}
          onClick={() => onStatusChange('all')}
          color={statusFilter === 'all' ? 'primary' : 'default'}
          variant={statusFilter === 'all' ? 'filled' : 'outlined'}
          sx={{
            fontWeight: 600,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: { xs: '11.5px', sm: '12.5px' },
            height: { xs: 28, sm: 32 }
          }}
        />
        <Chip
          icon={<PendingIcon sx={{ fontSize: '13px !important' }} />}
          label={`Pending (${stats.pending})`}
          onClick={() => onStatusChange('pending')}
          color={statusFilter === 'pending' ? 'warning' : 'default'}
          variant={statusFilter === 'pending' ? 'filled' : 'outlined'}
          sx={{
            fontWeight: 600,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: { xs: '11.5px', sm: '12.5px' },
            height: { xs: 28, sm: 32 }
          }}
        />
        <Chip
          icon={<CheckCircleIcon sx={{ fontSize: '13px !important' }} />}
          label={`Accepted (${stats.accepted})`}
          onClick={() => onStatusChange('accepted')}
          color={statusFilter === 'accepted' ? 'success' : 'default'}
          variant={statusFilter === 'accepted' ? 'filled' : 'outlined'}
          sx={{
            fontWeight: 600,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: { xs: '11.5px', sm: '12.5px' },
            height: { xs: 28, sm: 32 }
          }}
        />
        <Chip
          icon={<ReplyIcon sx={{ fontSize: '13px !important', transform: 'scaleX(-1)' }} />}
          label={`Replied (${stats.replied})`}
          onClick={() => onStatusChange('replied')}
          color={statusFilter === 'replied' ? 'info' : 'default'}
          variant={statusFilter === 'replied' ? 'filled' : 'outlined'}
          sx={{
            fontWeight: 600,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: { xs: '11.5px', sm: '12.5px' },
            height: { xs: 28, sm: 32 }
          }}
        />
        <Chip
          icon={<FavoriteIcon sx={{ fontSize: '13px !important', color: statusFilter === 'liked' ? '#fff' : '#EF4444' }} />}
          label={`Liked (${stats.liked})`}
          onClick={() => onStatusChange('liked')}
          color={statusFilter === 'liked' ? 'error' : 'default'}
          variant={statusFilter === 'liked' ? 'filled' : 'outlined'}
          sx={{
            fontWeight: 600,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: { xs: '11.5px', sm: '12.5px' },
            height: { xs: 28, sm: 32 }
          }}
        />
      </Stack>

      {/* Right: Search Input & Refresh Button */}
      <Stack
        direction="row"
        spacing={1}
        sx={{
          minWidth: { xs: '100%', md: 320 },
          alignItems: 'center'
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Search feedback or submitter..."
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
                  <IconButton
                    size="small"
                    onClick={() => onSearchChange('')}
                    sx={{ p: 0.5 }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              height: { xs: 34, sm: 38 },
              fontSize: { xs: '12px', sm: '13px' }
            }
          }}
        />

        {/* Refresh Button */}
        <Tooltip title="Refresh feedbacks">
          <IconButton
            onClick={onRefresh}
            disabled={loading}
            sx={{
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              bgcolor: '#FFFFFF',
              color: '#64748B',
              p: { xs: 0.75, sm: 0.9 },
              flexShrink: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease',
              '&:hover': { bgcolor: '#F8FAFC', color: '#1E293B', borderColor: '#CBD5E1' }
            }}
          >
            <RefreshIcon
              sx={{
                fontSize: { xs: 18, sm: 20 },
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
