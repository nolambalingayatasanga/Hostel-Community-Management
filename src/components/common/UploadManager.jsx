import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  LinearProgress,
  CircularProgress,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import {
  CloudUploadRounded as CloudUploadIcon,
  CheckCircleRounded as CheckCircleIcon,
  AccessTimeRounded as AccessTimeIcon,
  ErrorRounded as ErrorIcon,
  CloseRounded as CloseIcon,
  RefreshRounded as RefreshIcon,
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

  // Filtered queue (newest first by default)
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

    // Always sort newest first
    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return items;
  }, [queue, activeTab]);

  // Nothing in queue — render nothing (unconditionally after all hooks)
  if (queue.length === 0) return null;

  // ── 1. Minimized floating pill view (bottom-right) ───────────────────────────
  if (minimized) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          maxWidth: { xs: 'calc(100vw - 32px)', sm: 420 },
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: '#0F172A',
          color: '#FFFFFF',
          borderRadius: '30px',
          px: { xs: 1.8, sm: 2.2 },
          py: { xs: 1, sm: 1.2 },
          boxShadow: '0 12px 30px -5px rgba(15, 23, 42, 0.4)',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          '&:hover': {
            bgcolor: '#1E293B',
            transform: 'translateY(-2px)',
            boxShadow: '0 18px 35px -5px rgba(15, 23, 42, 0.5)',
          },
        }}
        onClick={() => setMinimized(false)}
      >
        {isUploading ? (
          <CircularProgress
            size={20}
            thickness={5}
            sx={{ color: '#38BDF8', flexShrink: 0 }}
            variant={activeItem?.progress ? 'determinate' : 'indeterminate'}
            value={activeItem?.progress || 0}
          />
        ) : stats.error > 0 ? (
          <ErrorIcon sx={{ color: '#F87171', fontSize: 20, flexShrink: 0 }} />
        ) : (
          <CheckCircleIcon sx={{ color: '#10B981', fontSize: 20, flexShrink: 0 }} />
        )}

        <Typography
          variant="body2"
          noWrap
          sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.85rem' } }}
        >
          {isUploading
            ? `Uploading (${stats.completed}/${stats.total}) • ${stats.overallPercent}%`
            : stats.error > 0
              ? `${stats.error} failed • ${stats.completed}/${stats.total} uploaded`
              : `All ${stats.completed} uploaded!`}
        </Typography>

        <IconButton
          size="small"
          sx={{ color: '#94A3B8', p: 0.3, flexShrink: 0, '&:hover': { color: '#FFFFFF' } }}
          onClick={(e) => {
            e.stopPropagation();
            setMinimized(false);
          }}
        >
          <ExpandLessIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  }

  // ── 2. Full Modern Dialog View ──────────────────────────────────────────────
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
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease-out',
          '@keyframes fadeIn': {
            from: { opacity: 0 },
            to: { opacity: 1 },
          },
        }}
      />

      {/* Main Container - Constant Height (never shrinks on empty tab) */}
      <Card
        elevation={0}
        sx={{
          position: 'fixed',
          zIndex: 9999,
          bottom: { xs: 0, sm: 'auto' },
          top: { xs: 'auto', sm: '50%' },
          left: { xs: 0, sm: '50%' },
          right: { xs: 0, sm: 'auto' },
          transform: { xs: 'none', sm: 'translate(-50%, -50%)' },
          width: { xs: '100%', sm: 580, md: 620 },
          height: { xs: '76vh', sm: 560 },
          maxHeight: { xs: '88vh', sm: '85vh' },
          minHeight: { xs: 420, sm: 500 },
          display: 'flex',
          flexDirection: 'column',
          borderRadius: { xs: '22px 22px 0 0', sm: '24px' },
          bgcolor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: {
            xs: '0 -10px 40px rgba(0, 0, 0, 0.2)',
            sm: '0 25px 60px -15px rgba(0, 0, 0, 0.22), 0 0 1px 1px rgba(0, 0, 0, 0.04)',
          },
          overflow: 'hidden',
          animation: {
            xs: 'sheetSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            sm: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          },
          '@keyframes sheetSlideUp': {
            from: { opacity: 0, transform: 'translateY(100%)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
          '@keyframes modalSlideUp': {
            from: { opacity: 0, transform: 'translate(-50%, -46%) scale(0.97)' },
            to: { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
          },
        }}
      >
        {/* Mobile Pull Handle Indicator */}
        <Box
          sx={{
            display: { xs: 'flex', sm: 'none' },
            justifyContent: 'center',
            pt: 1.2,
            pb: 0.2,
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 4.5,
              borderRadius: 3,
              bgcolor: '#CBD5E1',
            }}
          />
        </Box>

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

        {/* ── Top Header ── */}
        <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 1.5, sm: 2.5 }, pb: 2, position: 'relative' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
            }}
          >
            {/* Left: Icon + Title */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.2, sm: 1.8 }, minWidth: 0, flex: 1 }}>
              <Box
                sx={{
                  width: { xs: 42, sm: 50 },
                  height: { xs: 42, sm: 50 },
                  borderRadius: { xs: '12px', sm: '16px' },
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  flexShrink: 0,
                }}
              >
                <CloudUploadIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
              </Box>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  sx={{
                    fontWeight: 800,
                    color: '#0F172A',
                    fontSize: { xs: '0.96rem', sm: '1.2rem' },
                    lineHeight: 1.25,
                    letterSpacing: '-0.2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={isUploading ? 'Uploading Media' : stats.error > 0 ? 'Uploads Completed with Issues' : 'All Uploads Completed'}
                >
                  {isUploading
                    ? 'Uploading Media'
                    : stats.error > 0
                      ? 'Uploads Completed with Issues'
                      : 'All Uploads Completed'}
                </Typography>
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    color: '#94A3B8',
                    fontWeight: 500,
                    mt: 0.2,
                    fontSize: { xs: '0.78rem', sm: '0.85rem' },
                  }}
                >
                  {isUploading
                    ? `${stats.pending} remaining in queue`
                    : `${stats.completed} of ${stats.total} files completed`}
                </Typography>
              </Box>
            </Box>

            {/* Right: Actions (Cancel All & Close) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexShrink: 0 }}>
              <Button
                size="small"
                onClick={clearAll}
                startIcon={
                  (stats.pending > 0 || isUploading) ? (
                    <CloseIcon sx={{ fontSize: '14px !important', color: '#64748B' }} />
                  ) : undefined
                }
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.82rem' },
                  color: '#334155',
                  border: '1px solid #E2E8F0',
                  borderRadius: '20px',
                  px: { xs: 1.2, sm: 1.8 },
                  py: 0.45,
                  bgcolor: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  '&:hover': {
                    bgcolor: '#F8FAFC',
                    borderColor: '#CBD5E1',
                    color: '#0F172A',
                  },
                }}
              >
                {stats.pending > 0 || isUploading ? 'Cancel All' : 'Clear All'}
              </Button>

              <IconButton
                size="small"
                onClick={() => setMinimized(true)}
                title="Minimize"
                sx={{
                  color: '#94A3B8',
                  p: 0.6,
                  borderRadius: '50%',
                  '&:hover': { color: '#0F172A', bgcolor: 'rgba(241, 245, 249, 0.8)' },
                }}
              >
                <CloseIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Header Blue Progress Bar + Percentage */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.8, width: '100%' }}>
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
                textAlign: 'right',
                flexShrink: 0,
              }}
            >
              {stats.overallPercent}%
            </Typography>
          </Box>
        </Box>

        {/* ── Filter Pills Bar (Clean, no sort selector) ── */}
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: 1.2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            borderTop: '1px solid #F1F5F9',
            borderBottom: '1px solid #F1F5F9',
            bgcolor: '#FAFCFF',
          }}
        >
          {/* All */}
          <Box
            onClick={() => setActiveTab('all')}
            sx={{
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.8,
              px: { xs: 1.4, sm: 1.8 },
              py: 0.55,
              borderRadius: '20px',
              bgcolor: activeTab === 'all' ? '#2563EB' : '#FFFFFF',
              color: activeTab === 'all' ? '#FFFFFF' : '#475569',
              border: activeTab === 'all' ? '1px solid #2563EB' : '1px solid #E2E8F0',
              flexShrink: 0,
              transition: 'all 0.15s ease',
              '&:hover': { borderColor: '#2563EB' },
            }}
          >
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>All</Typography>
            <Box
              sx={{
                px: 0.75,
                py: 0.15,
                borderRadius: '10px',
                fontSize: '0.7rem',
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
              gap: 0.8,
              px: { xs: 1.4, sm: 1.8 },
              py: 0.55,
              borderRadius: '20px',
              bgcolor: activeTab === 'uploading' ? '#2563EB' : '#FFFFFF',
              color: activeTab === 'uploading' ? '#FFFFFF' : '#475569',
              border: activeTab === 'uploading' ? '1px solid #2563EB' : '1px solid #E2E8F0',
              flexShrink: 0,
              transition: 'all 0.15s ease',
              '&:hover': { borderColor: '#2563EB' },
            }}
          >
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Uploading</Typography>
            <Box
              sx={{
                px: 0.75,
                py: 0.15,
                borderRadius: '10px',
                fontSize: '0.7rem',
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
              gap: 0.8,
              px: { xs: 1.4, sm: 1.8 },
              py: 0.55,
              borderRadius: '20px',
              bgcolor: activeTab === 'completed' ? '#2563EB' : '#F0FDF4',
              color: activeTab === 'completed' ? '#FFFFFF' : '#16A34A',
              border: activeTab === 'completed' ? '1px solid #2563EB' : '1px solid #DCFCE7',
              flexShrink: 0,
              transition: 'all 0.15s ease',
              '&:hover': { borderColor: '#16A34A' },
            }}
          >
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Completed</Typography>
            <Box
              sx={{
                px: 0.75,
                py: 0.15,
                borderRadius: '10px',
                fontSize: '0.7rem',
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
              gap: 0.8,
              px: { xs: 1.4, sm: 1.8 },
              py: 0.55,
              borderRadius: '20px',
              bgcolor: activeTab === 'failed' ? '#2563EB' : '#FEF2F2',
              color: activeTab === 'failed' ? '#FFFFFF' : '#DC2626',
              border: activeTab === 'failed' ? '1px solid #2563EB' : '1px solid #FEE2E2',
              flexShrink: 0,
              transition: 'all 0.15s ease',
              '&:hover': { borderColor: '#DC2626' },
            }}
          >
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Failed</Typography>
            <Box
              sx={{
                px: 0.75,
                py: 0.15,
                borderRadius: '10px',
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: activeTab === 'failed' ? '#1D4ED8' : '#FEE2E2',
                color: activeTab === 'failed' ? '#FFFFFF' : '#DC2626',
              }}
            >
              {stats.error}
            </Box>
          </Box>
        </Box>

        {/* ── Scrollable Items List (Takes remaining height, never shrinks dialog) ── */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: { xs: 1.5, sm: 2.5 },
            display: 'flex',
            flexDirection: 'column',
            gap: 1.2,
            bgcolor: '#FFFFFF',
          }}
        >
          {displayQueue.length === 0 ? (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: '#94A3B8',
                py: 6,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                No uploads found matching this filter.
              </Typography>
            </Box>
          ) : (
            displayQueue.map((item) => {
              const isCurrent = item.status === 'uploading';
              const isDone = item.status === 'completed';
              const isFailed = item.status === 'error';
              const isQueued = item.status === 'pending';

              return (
                <Box
                  key={item.id}
                  sx={{
                    p: { xs: 1.2, sm: 1.5 },
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
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: { xs: 1.2, sm: 1.8 },
                    '&:hover': {
                      borderColor: isCurrent ? '#93C5FD' : isFailed ? '#FCA5A5' : '#E2E8F0',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  {/* Left part: Thumbnail + Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.2, sm: 1.5 }, minWidth: 0, flex: 1 }}>
                    {/* Thumbnail Preview */}
                    <Box
                      sx={{
                        width: { xs: 46, sm: 54 },
                        height: { xs: 46, sm: 54 },
                        borderRadius: '10px',
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
                              <PlayIcon sx={{ fontSize: 20, color: '#FFFFFF' }} />
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
                        <VideoIcon sx={{ color: '#6366F1', fontSize: 24 }} />
                      ) : (
                        <ImageIcon sx={{ color: '#0EA5E9', fontSize: 24 }} />
                      )}
                    </Box>

                    {/* File Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{
                          fontWeight: 700,
                          color: '#0F172A',
                          fontSize: { xs: '0.84rem', sm: '0.9rem' },
                          lineHeight: 1.25,
                        }}
                        title={item.name}
                      >
                        {item.name}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.3, minWidth: 0 }}>
                        <Typography
                          variant="caption"
                          sx={{ color: '#64748B', fontWeight: 500, fontSize: { xs: '0.72rem', sm: '0.78rem' }, flexShrink: 0 }}
                        >
                          {formatBytes(item.size)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#CBD5E1', fontSize: '0.75rem', flexShrink: 0 }}>
                          •
                        </Typography>
                        <Typography
                          variant="caption"
                          noWrap
                          sx={{
                            color: '#0284C7',
                            fontWeight: 600,
                            fontSize: { xs: '0.72rem', sm: '0.78rem' },
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.destinationName
                            ? (item.destinationName.startsWith('Folder:') ? item.destinationName : `Folder: ${item.destinationName}`)
                            : 'General Gallery'}
                        </Typography>
                      </Box>

                      {/* Error Message if Failed */}
                      {isFailed && (
                        <Typography
                          variant="caption"
                          noWrap
                          sx={{
                            color: '#DC2626',
                            display: 'block',
                            mt: 0.3,
                            fontSize: '0.72rem',
                            fontWeight: 600,
                          }}
                        >
                          {item.error || 'Upload failed. Click retry.'}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Right: Status Pill & Action Buttons */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      alignSelf: 'center',
                      gap: 0.8,
                      flexShrink: 0,
                    }}
                  >
                    {/* Completed State */}
                    {isDone && (
                      <>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: { xs: 1, sm: 1.4 },
                            height: 28,
                            borderRadius: '14px',
                            bgcolor: '#ECFDF5',
                            border: '1px solid #D1FAE5',
                            color: '#059669',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <CheckCircleIcon sx={{ fontSize: 15 }} />
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                            Uploaded
                          </Typography>
                        </Box>
                        <Tooltip title="Copy media link">
                          <IconButton
                            size="small"
                            onClick={() => handleCopyLink(item)}
                            sx={{
                              width: 28,
                              height: 28,
                              minWidth: 28,
                              minHeight: 28,
                              p: 0,
                              color: '#64748B',
                              border: '1px solid #E2E8F0',
                              borderRadius: '8px',
                              alignSelf: 'center',
                              '&:hover': { color: '#0F172A', bgcolor: '#F8FAFC', borderColor: '#CBD5E1' },
                            }}
                          >
                            <CopyIcon sx={{ fontSize: 15 }} />
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
                            gap: 0.6,
                            px: { xs: 1, sm: 1.4 },
                            height: 28,
                            borderRadius: '14px',
                            bgcolor: '#EFF6FF',
                            border: '1px solid #DBEAFE',
                            color: '#2563EB',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <CircularProgress size={13} thickness={5} sx={{ color: '#2563EB' }} />
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Uploading... </Box>
                            {item.progress || 0}%
                          </Typography>
                        </Box>
                        <Tooltip title="Cancel upload">
                          <IconButton
                            size="small"
                            onClick={() => cancelItem(item.id)}
                            sx={{
                              width: 28,
                              height: 28,
                              minWidth: 28,
                              minHeight: 28,
                              p: 0,
                              color: '#64748B',
                              border: '1px solid #E2E8F0',
                              borderRadius: '8px',
                              alignSelf: 'center',
                              '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2', borderColor: '#FECACA' },
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 15 }} />
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
                            gap: 0.5,
                            px: { xs: 1, sm: 1.4 },
                            height: 28,
                            borderRadius: '14px',
                            bgcolor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            color: '#64748B',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <AccessTimeIcon sx={{ fontSize: 15 }} />
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            Pending
                          </Typography>
                        </Box>
                        <Tooltip title="Cancel from queue">
                          <IconButton
                            size="small"
                            onClick={() => cancelItem(item.id)}
                            sx={{
                              width: 28,
                              height: 28,
                              minWidth: 28,
                              minHeight: 28,
                              p: 0,
                              color: '#94A3B8',
                              border: '1px solid #E2E8F0',
                              borderRadius: '8px',
                              alignSelf: 'center',
                              '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2', borderColor: '#FECACA' },
                            }}
                          >
                            <CloseIcon sx={{ fontSize: 15 }} />
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
                            gap: 0.5,
                            px: { xs: 1, sm: 1.4 },
                            height: 28,
                            borderRadius: '14px',
                            bgcolor: '#FEF2F2',
                            border: '1px solid #FEE2E2',
                            color: '#DC2626',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <ErrorIcon sx={{ fontSize: 15 }} />
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                            Failed
                          </Typography>
                        </Box>
                        <Tooltip title="Retry upload">
                          <IconButton
                            size="small"
                            onClick={() => retryItem(item.id)}
                            sx={{
                              width: 28,
                              height: 28,
                              minWidth: 28,
                              minHeight: 28,
                              p: 0,
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              borderRadius: '8px',
                              alignSelf: 'center',
                              '&:hover': { bgcolor: '#FEE2E2' },
                            }}
                          >
                            <RefreshIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </Box>
              );
            })
          )}
        </Box>

        {/* ── Footer ── */}
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: 1.4,
            borderTop: '1px solid #F1F5F9',
            bgcolor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            flexWrap: 'wrap',
            pb: { xs: 'calc(1.4rem + env(safe-area-inset-bottom, 0px))', sm: 1.4 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0 }}>
            <InfoIcon sx={{ fontSize: 16, color: '#94A3B8', flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
              {stats.total} total • {stats.uploading + stats.pending} in progress
            </Typography>
          </Box>

          {stats.completed > 0 && (
            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.8rem' }, whiteSpace: 'nowrap' }}>
              ✓ {stats.completed} uploaded
            </Typography>
          )}
        </Box>
      </Card>
    </>
  );
}
