import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Stack,
  Typography,
  LinearProgress,
  CircularProgress,
  IconButton,
  Tooltip,
  Button,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  CloudUploadRounded as CloudUploadIcon,
  CheckCircleRounded as CheckCircleIcon,
  AccessTimeRounded as AccessTimeIcon,
  ErrorRounded as ErrorIcon,
  CloseRounded as CloseIcon,
  RefreshRounded as RefreshIcon,
  TuneRounded as TuneIcon,
  KeyboardArrowDownRounded as ArrowDownIcon,
  ContentCopyRounded as CopyIcon,
  PlayArrowRounded as PlayIcon,
  InfoOutlined as InfoIcon,
  ExpandLessRounded as ExpandLessIcon,
  VideocamRounded as VideoIcon,
  ImageRounded as ImageIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useUploadQueue } from '../../context/UploadQueueContext';

export default function UploadManager() {
  const {
    queue,
    stats,
    isUploading,
    activeItem,
    cancelItem,
    retryItem,
    clearAll,
  } = useUploadQueue();

  const { enqueueSnackbar } = useSnackbar();

  // Dialog state: full modal vs minimized floating pill
  const [minimized, setMinimized] = useState(false);

  // Active filter tab: 'all' | 'uploading' | 'completed' | 'failed'
  const [activeTab, setActiveTab] = useState('all');

  // Sort order: 'newest' | 'oldest' | 'name' | 'size'
  const [sortBy, setSortBy] = useState('newest');
  const [sortAnchorEl, setSortAnchorEl] = useState(null);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Copy link handler
  const handleCopyLink = (item) => {
    const url = item.result?.data?.photo?.url || item.result?.data?.url || item.previewUrl;
    if (url) {
      navigator.clipboard.writeText(url);
      enqueueSnackbar('Asset URL copied to clipboard!', { variant: 'success' });
    } else {
      enqueueSnackbar('Media URL not available yet.', { variant: 'info' });
    }
  };

  // Filtered & sorted queue
  const displayQueue = useMemo(() => {
    let items = [...queue];

    // Filter
    if (activeTab === 'uploading') {
      items = items.filter((i) => i.status === 'uploading');
    } else if (activeTab === 'completed') {
      items = items.filter((i) => i.status === 'completed');
    } else if (activeTab === 'failed') {
      items = items.filter((i) => i.status === 'error');
    }

    // Sort
    if (sortBy === 'newest') {
      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'name') {
      items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'size') {
      items.sort((a, b) => (b.size || 0) - (a.size || 0));
    }

    return items;
  }, [queue, activeTab, sortBy]);

  const getSortLabel = () => {
    switch (sortBy) {
      case 'newest': return 'Newest First';
      case 'oldest': return 'Oldest First';
      case 'name': return 'Name A-Z';
      case 'size': return 'File Size';
      default: return 'Newest First';
    }
  };

  // Nothing in queue — render nothing (unconditionally after all hooks)
  if (queue.length === 0) return null;

  // ── 1. Minimized floating pill view (bottom-right) ───────────────────────────
  if (minimized) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: '#0F172A',
          color: '#FFFFFF',
          borderRadius: '30px',
          px: 2.2,
          py: 1.2,
          boxShadow: '0 12px 30px -5px rgba(15, 23, 42, 0.4)',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          '&:hover': {
            bgcolor: '#1E293B',
            transform: 'translateY(-2px)',
            boxShadow: '0 18px 35px -5px rgba(15, 23, 42, 0.5)'
          },
        }}
        onClick={() => setMinimized(false)}
      >
        {isUploading ? (
          <CircularProgress
            size={22}
            thickness={5}
            sx={{ color: '#38BDF8' }}
            variant={activeItem?.progress ? 'determinate' : 'indeterminate'}
            value={activeItem?.progress || 0}
          />
        ) : stats.error > 0 ? (
          <ErrorIcon sx={{ color: '#F87171', fontSize: 22 }} />
        ) : (
          <CheckCircleIcon sx={{ color: '#10B981', fontSize: 22 }} />
        )}

        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
          {isUploading
            ? `Uploading (${stats.completed}/${stats.total}) • ${stats.overallPercent}%`
            : stats.error > 0
            ? `${stats.error} failed • ${stats.completed}/${stats.total} uploaded`
            : `All ${stats.completed} uploaded!`}
        </Typography>

        <IconButton
          size="small"
          sx={{ color: '#94A3B8', p: 0.3, '&:hover': { color: '#FFFFFF' } }}
          onClick={(e) => { e.stopPropagation(); setMinimized(false); }}
        >
          <ExpandLessIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  }

  // ── 2. Full Modern Dialog View (Exact Match to Design) ──────────────────────
  return (
    <>
      {/* Soft Blurred Backdrop */}
      <Box
        onClick={() => setMinimized(true)}
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          bgcolor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.2s ease-out',
          '@keyframes fadeIn': {
            from: { opacity: 0 },
            to: { opacity: 1 }
          }
        }}
      />

      {/* Main Centered Card */}
      <Card
        elevation={0}
        sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          width: { xs: 'calc(100vw - 32px)', sm: 580, md: 620 },
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          bgcolor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.22), 0 0 1px 1px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          '@keyframes modalSlideUp': {
            from: { opacity: 0, transform: 'translate(-50%, -46%) scale(0.97)' },
            to:   { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
          },
        }}
      >
        {/* Decorative soft cloud in top-right background */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 220,
            height: 120,
            pointerEvents: 'none',
            opacity: 0.5,
            background: 'radial-gradient(circle at 100% 0%, #E0F2FE 0%, transparent 70%)',
          }}
        />

        {/* Top-Right Absolute Close Button */}
        <IconButton
          size="small"
          onClick={() => setMinimized(true)}
          sx={{
            position: 'absolute',
            top: 18,
            right: 20,
            color: '#94A3B8',
            p: 0.6,
            zIndex: 2,
            '&:hover': { color: '#0F172A', bgcolor: 'rgba(241, 245, 249, 0.8)' },
          }}
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>

        {/* ── Top Header ── */}
        <Box sx={{ p: { xs: 2.5, sm: 3 }, pb: 2, position: 'relative' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ pr: 5 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
              {/* Cloud Icon Badge */}
              <Box
                sx={{
                  width: 54,
                  height: 54,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 30 }} />
              </Box>

              {/* Title & Subtitle */}
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: '#0F172A',
                    fontSize: '1.25rem',
                    lineHeight: 1.25,
                    letterSpacing: '-0.3px',
                  }}
                >
                  {isUploading ? 'Uploading Media' : stats.error > 0 ? 'Uploads Completed with Issues' : 'All Uploads Completed'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#94A3B8',
                    fontWeight: 500,
                    mt: 0.4,
                    fontSize: '0.875rem'
                  }}
                >
                  {isUploading
                    ? `${stats.pending} remaining in queue`
                    : `${stats.completed} of ${stats.total} files completed`}
                </Typography>
              </Box>
            </Stack>

            {/* Cancel All / Clear All Pill Button */}
            <Box sx={{ flexShrink: 0 }}>
              {stats.pending > 0 || isUploading ? (
                <Button
                  onClick={clearAll}
                  startIcon={<CloseIcon sx={{ fontSize: '15px !important', color: '#64748B' }} />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    color: '#334155',
                    border: '1px solid #E2E8F0',
                    borderRadius: '24px',
                    px: 2,
                    py: 0.6,
                    bgcolor: '#FFFFFF',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    '&:hover': {
                      bgcolor: '#F8FAFC',
                      borderColor: '#CBD5E1',
                      color: '#0F172A',
                    },
                  }}
                >
                  Cancel All
                </Button>
              ) : (
                <Button
                  onClick={clearAll}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    color: '#475569',
                    border: '1px solid #E2E8F0',
                    borderRadius: '24px',
                    px: 2,
                    py: 0.6,
                    bgcolor: '#FFFFFF',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    '&:hover': {
                      bgcolor: '#F8FAFC',
                      borderColor: '#CBD5E1',
                    },
                  }}
                >
                  Clear All
                </Button>
              )}
            </Box>
          </Stack>

          {/* Header Blue Progress Bar + Percentage */}
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2, width: { xs: '100%', sm: '85%' } }}>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={stats.overallPercent}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: '#E2E8F0',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#2563EB',
                    borderRadius: 3,
                    transition: 'transform 0.2s linear',
                  },
                }}
              />
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: '#475569',
                fontSize: '0.8rem',
                minWidth: 32,
                textAlign: 'right'
              }}
            >
              {stats.overallPercent}%
            </Typography>
          </Stack>
        </Box>

        {/* ── Filter Pills & Sort Bar ── */}
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap',
            borderTop: '1px solid #F1F5F9',
            borderBottom: '1px solid #F1F5F9',
            bgcolor: '#FAFCFF',
          }}
        >
          {/* Filter Pills */}
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: { xs: 0.5, sm: 0 } }}>
            {/* All */}
            <Box
              onClick={() => setActiveTab('all')}
              sx={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 1.8,
                py: 0.6,
                borderRadius: '24px',
                bgcolor: activeTab === 'all' ? '#2563EB' : '#FFFFFF',
                color: activeTab === 'all' ? '#FFFFFF' : '#475569',
                border: activeTab === 'all' ? '1px solid #2563EB' : '1px solid #E2E8F0',
                transition: 'all 0.15s ease',
                '&:hover': { borderColor: '#2563EB' }
              }}
            >
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700 }}>All</Typography>
              <Box
                sx={{
                  px: 0.85,
                  py: 0.15,
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  bgcolor: activeTab === 'all' ? '#1D4ED8' : '#F1F5F9',
                  color: activeTab === 'all' ? '#FFFFFF' : '#475569',
                }}
              >
                {stats.total}
              </Box>
            </Box>

            {/* Uploading */}
            <Box
              onClick={() => setActiveTab('uploading')}
              sx={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 1.8,
                py: 0.6,
                borderRadius: '24px',
                bgcolor: activeTab === 'uploading' ? '#2563EB' : '#FFFFFF',
                color: activeTab === 'uploading' ? '#FFFFFF' : '#475569',
                border: activeTab === 'uploading' ? '1px solid #2563EB' : '1px solid #E2E8F0',
                transition: 'all 0.15s ease',
                '&:hover': { borderColor: '#2563EB' }
              }}
            >
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>Uploading</Typography>
              <Box
                sx={{
                  px: 0.85,
                  py: 0.15,
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  bgcolor: activeTab === 'uploading' ? '#1D4ED8' : '#EFF6FF',
                  color: activeTab === 'uploading' ? '#FFFFFF' : '#2563EB',
                }}
              >
                {stats.uploading + stats.pending}
              </Box>
            </Box>

            {/* Completed */}
            <Box
              onClick={() => setActiveTab('completed')}
              sx={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 1.8,
                py: 0.6,
                borderRadius: '24px',
                bgcolor: activeTab === 'completed' ? '#2563EB' : '#F0FDF4',
                color: activeTab === 'completed' ? '#FFFFFF' : '#16A34A',
                border: activeTab === 'completed' ? '1px solid #2563EB' : '1px solid #DCFCE7',
                transition: 'all 0.15s ease',
                '&:hover': { borderColor: '#16A34A' }
              }}
            >
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>Completed</Typography>
              <Box
                sx={{
                  px: 0.85,
                  py: 0.15,
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  bgcolor: activeTab === 'completed' ? '#1D4ED8' : '#DCFCE7',
                  color: activeTab === 'completed' ? '#FFFFFF' : '#16A34A',
                }}
              >
                {stats.completed}
              </Box>
            </Box>

            {/* Failed */}
            <Box
              onClick={() => setActiveTab('failed')}
              sx={{
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 1.8,
                py: 0.6,
                borderRadius: '24px',
                bgcolor: activeTab === 'failed' ? '#2563EB' : '#FEF2F2',
                color: activeTab === 'failed' ? '#FFFFFF' : '#DC2626',
                border: activeTab === 'failed' ? '1px solid #2563EB' : '1px solid #FEE2E2',
                transition: 'all 0.15s ease',
                '&:hover': { borderColor: '#DC2626' }
              }}
            >
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>Failed</Typography>
              <Box
                sx={{
                  px: 0.85,
                  py: 0.15,
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  bgcolor: activeTab === 'failed' ? '#1D4ED8' : '#FEE2E2',
                  color: activeTab === 'failed' ? '#FFFFFF' : '#DC2626',
                }}
              >
                {stats.error}
              </Box>
            </Box>
          </Stack>

          {/* Sort Dropdown */}
          <Box>
            <Button
              size="small"
              onClick={(e) => setSortAnchorEl(e.currentTarget)}
              startIcon={<TuneIcon sx={{ fontSize: '16px !important', color: '#475569' }} />}
              endIcon={<ArrowDownIcon sx={{ fontSize: '18px !important', color: '#64748B' }} />}
              sx={{
                textTransform: 'none',
                color: '#334155',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                px: 1.4,
                py: 0.5,
                bgcolor: '#FFFFFF',
                '&:hover': { bgcolor: '#F8FAFC', borderColor: '#CBD5E1' }
              }}
            >
              {getSortLabel()}
            </Button>
      
          </Box>
        </Box>

        {/* ── Scrollable Items List ── */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: 440,
            p: { xs: 2, sm: 2.5 },
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            bgcolor: '#FFFFFF',
          }}
        >
          {displayQueue.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center', color: '#94A3B8' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                No uploads found matching this filter.
              </Typography>
            </Box>
          ) : (
            displayQueue.map((item) => {
              const isCurrent = item.status === 'uploading';
              const isDone    = item.status === 'completed';
              const isFailed  = item.status === 'error';
              const isQueued  = item.status === 'pending';

              return (
                <Box
                  key={item.id}
                  sx={{
                    p: 1.6,
                    borderRadius: '16px',
                    bgcolor: isCurrent ? 'rgba(239, 246, 255, 0.6)' : '#FFFFFF',
                    border: isCurrent
                      ? '1.5px solid #BFDBFE'
                      : isFailed
                      ? '1px solid #FEE2E2'
                      : '1px solid #F1F5F9',
                    boxShadow: isCurrent
                      ? '0 4px 12px rgba(37, 99, 235, 0.08)'
                      : '0 1px 3px rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: isCurrent ? '#93C5FD' : isFailed ? '#FCA5A5' : '#E2E8F0',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                    }
                  }}
                >
                  <Stack direction="row" spacing={1.8} alignItems="center">
                    {/* Thumbnail Preview */}
                    <Box
                      sx={{
                        width: 58,
                        height: 58,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        bgcolor: '#0F172A',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      {item.previewUrl ? (
                        item.type === 'video' ? (
                          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                            <video
                              src={item.previewUrl}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {/* Dark play icon overlay matching screenshot */}
                            <Box
                              sx={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'rgba(0,0,0,0.3)',
                              }}
                            >
                              <PlayIcon sx={{ fontSize: 22, color: '#FFFFFF' }} />
                            </Box>
                          </Box>
                        ) : (
                          <img
                            src={item.previewUrl}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )
                      ) : item.type === 'video' ? (
                        <VideoIcon sx={{ color: '#6366F1', fontSize: 26 }} />
                      ) : (
                        <ImageIcon sx={{ color: '#0EA5E9', fontSize: 26 }} />
                      )}
                    </Box>

                    {/* File Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body1"
                        noWrap
                        sx={{
                          fontWeight: 700,
                          color: '#0F172A',
                          fontSize: '0.92rem',
                          lineHeight: 1.3,
                        }}
                        title={item.name}
                      >
                        {item.name}
                      </Typography>

                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.4, flexWrap: 'wrap' }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.78rem' }}>
                          {formatBytes(item.size)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#CBD5E1', fontSize: '0.75rem' }}>•</Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#0284C7',
                            fontWeight: 600,
                            fontSize: '0.78rem',
                          }}
                        >
                          {item.destinationName
                            ? (item.destinationName.startsWith('Folder:') ? item.destinationName : `Folder: ${item.destinationName}`)
                            : 'General Gallery'}
                        </Typography>
                      </Stack>

                      {/* Error Message if Failed */}
                      {isFailed && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#DC2626',
                            display: 'block',
                            mt: 0.4,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          {item.error || 'Upload failed. Click retry to try again.'}
                        </Typography>
                      )}
                    </Box>

                    {/* Status Pill & Action Buttons (Right) */}
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                      {/* Completed State */}
                      {isDone && (
                        <>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.6,
                              px: 1.5,
                              py: 0.5,
                              borderRadius: '20px',
                              bgcolor: '#ECFDF5',
                              border: '1px solid #D1FAE5',
                              color: '#059669',
                            }}
                          >
                            <CheckCircleIcon sx={{ fontSize: 16 }} />
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                              Uploaded
                            </Typography>
                          </Box>
                          <Tooltip title="Copy media link">
                            <IconButton
                              size="small"
                              onClick={() => handleCopyLink(item)}
                              sx={{
                                color: '#64748B',
                                border: '1px solid #E2E8F0',
                                borderRadius: '10px',
                                p: 0.7,
                                '&:hover': { color: '#0F172A', bgcolor: '#F8FAFC', borderColor: '#CBD5E1' }
                              }}
                            >
                              <CopyIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}

                      {/* Currently Uploading State */}
                      {isCurrent && (
                        <>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.8,
                              px: 1.5,
                              py: 0.5,
                              borderRadius: '20px',
                              bgcolor: '#EFF6FF',
                              border: '1px solid #DBEAFE',
                              color: '#2563EB',
                            }}
                          >
                            <CircularProgress size={14} thickness={5} sx={{ color: '#2563EB' }} />
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                              Uploading... {item.progress || 0}%
                            </Typography>
                          </Box>
                          <Tooltip title="Cancel upload">
                            <IconButton
                              size="small"
                              onClick={() => cancelItem(item.id)}
                              sx={{
                                color: '#64748B',
                                border: '1px solid #E2E8F0',
                                borderRadius: '10px',
                                p: 0.7,
                                '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2', borderColor: '#FECACA' }
                              }}
                            >
                              <CloseIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}

                      {/* Pending State */}
                      {isQueued && (
                        <>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.6,
                              px: 1.5,
                              py: 0.5,
                              borderRadius: '20px',
                              bgcolor: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              color: '#64748B',
                            }}
                          >
                            <AccessTimeIcon sx={{ fontSize: 16 }} />
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              Pending
                            </Typography>
                          </Box>
                          <Tooltip title="Cancel from queue">
                            <IconButton
                              size="small"
                              onClick={() => cancelItem(item.id)}
                              sx={{
                                color: '#94A3B8',
                                border: '1px solid #E2E8F0',
                                borderRadius: '10px',
                                p: 0.7,
                                '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2', borderColor: '#FECACA' }
                              }}
                            >
                              <CloseIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}

                      {/* Failed State */}
                      {isFailed && (
                        <>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.6,
                              px: 1.5,
                              py: 0.5,
                              borderRadius: '20px',
                              bgcolor: '#FEF2F2',
                              border: '1px solid #FEE2E2',
                              color: '#DC2626',
                            }}
                          >
                            <ErrorIcon sx={{ fontSize: 16 }} />
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                              Failed
                            </Typography>
                          </Box>
                          <Tooltip title="Retry upload">
                            <IconButton
                              size="small"
                              onClick={() => retryItem(item.id)}
                              sx={{
                                color: '#DC2626',
                                border: '1px solid #FECACA',
                                borderRadius: '10px',
                                p: 0.7,
                                '&:hover': { bgcolor: '#FEE2E2' }
                              }}
                            >
                              <RefreshIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              );
            })
          )}
        </Box>

        {/* ── Footer ── */}
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: 1.8,
            borderTop: '1px solid #F1F5F9',
            bgcolor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <InfoIcon sx={{ fontSize: 17, color: '#94A3B8' }} />
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.8rem' }}>
              {stats.total} files in total  •  {stats.uploading + stats.pending} uploading
            </Typography>
          </Stack>

          {stats.completed > 0 && (
            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600, fontSize: '0.8rem' }}>
              ✓ {stats.completed} successfully uploaded
            </Typography>
          )}
        </Box>
      </Card>
    </>
  );
}
