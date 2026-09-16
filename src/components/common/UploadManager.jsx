import React, { useState } from 'react';
import {
  Box,
  Card,
  Stack,
  Typography,
  LinearProgress,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CloudUploadRounded as CloudUploadIcon,
  CloudDoneRounded as CloudDoneIcon,
  CheckCircleRounded as CheckCircleIcon,
  ErrorRounded as ErrorIcon,
  CloseRounded as CloseIcon,
  KeyboardArrowUpRounded as ExpandLessIcon,
  KeyboardArrowDownRounded as ExpandMoreIcon,
  RefreshRounded as RefreshIcon,
  VideocamRounded as VideoIcon,
  ImageRounded as ImageIcon,
} from '@mui/icons-material';
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

  const [minimized, setMinimized] = useState(false);

  // Nothing in queue — render nothing
  if (queue.length === 0) return null;

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // ── Minimized pill (bottom-right) ──────────────────────────────────────────
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
          bgcolor: '#1E293B',
          color: '#FFFFFF',
          borderRadius: '28px',
          px: 2.2,
          py: 1,
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
          '&:hover': { bgcolor: '#0F172A', transform: 'translateY(-2px)' },
        }}
        onClick={() => setMinimized(false)}
      >
        {isUploading ? (
          <CircularProgress
            size={20}
            thickness={5}
            sx={{ color: '#38BDF8' }}
            variant={activeItem?.progress ? 'determinate' : 'indeterminate'}
            value={activeItem?.progress || 0}
          />
        ) : stats.error > 0 ? (
          <ErrorIcon sx={{ color: '#F87171', fontSize: 20 }} />
        ) : (
          <CheckCircleIcon sx={{ color: '#4ADE80', fontSize: 20 }} />
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

  // ── Centered modal view ─────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          bgcolor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Centered Card */}
      <Card
        elevation={8}
        sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          width: { xs: 'calc(100vw - 32px)', sm: 440 },
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          bgcolor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
          overflow: 'hidden',
          animation: 'fadeInScale 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          '@keyframes fadeInScale': {
            from: { opacity: 0, transform: 'translate(-50%, -50%) scale(0.94)' },
            to:   { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2.5,
            py: 1.8,
            bgcolor: '#0F172A',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: '8px',
                bgcolor: 'rgba(56, 189, 248, 0.15)',
                color: '#38BDF8',
              }}
            >
              {isUploading
                ? <CloudUploadIcon fontSize="small" sx={{ animation: 'pulse 1.5s infinite' }} />
                : <CloudDoneIcon fontSize="small" />}
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {isUploading
                  ? `Uploading ${stats.completed + 1} of ${stats.total}...`
                  : 'Upload Manager'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>
                {isUploading
                  ? `${stats.pending} remaining in queue`
                  : `${stats.completed} completed${stats.error > 0 ? `, ${stats.error} failed` : ''}`}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title="Minimize">
              <IconButton
                size="small"
                sx={{ color: '#94A3B8', '&:hover': { color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' } }}
                onClick={() => setMinimized(true)}
              >
                <ExpandMoreIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {!isUploading && (
              <Tooltip title="Close">
                <IconButton
                  size="small"
                  sx={{ color: '#94A3B8', '&:hover': { color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.1)' } }}
                  onClick={clearAll}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Box>

        {/* Overall progress bar */}
        <Box sx={{ width: '100%', bgcolor: '#E2E8F0', height: 4 }}>
          <LinearProgress
            variant="determinate"
            value={stats.overallPercent}
            sx={{
              height: 4,
              bgcolor: 'transparent',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #38BDF8 0%, #6366F1 50%, #10B981 100%)',
              },
            }}
          />
        </Box>

        {/* Queue item list */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: 400,
            p: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            bgcolor: '#F8FAFC',
          }}
        >
          {queue.map((item) => {
            const isCurrent = item.status === 'uploading';
            const isDone    = item.status === 'completed';
            const isFailed  = item.status === 'error';
            const isQueued  = item.status === 'pending';

            return (
              <Box
                key={item.id}
                sx={{
                  p: 1.5,
                  borderRadius: '10px',
                  bgcolor: isCurrent ? '#EFF6FF' : '#FFFFFF',
                  border: isCurrent
                    ? '1px solid #93C5FD'
                    : isFailed
                    ? '1px solid #FECACA'
                    : '1px solid #E2E8F0',
                  transition: 'all 0.2s',
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  {/* Thumbnail */}
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      bgcolor: '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.previewUrl ? (
                      item.type === 'video' ? (
                        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                          <video src={item.previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <Box
                            sx={{
                              position: 'absolute', inset: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              bgcolor: 'rgba(0,0,0,0.3)',
                            }}
                          >
                            <VideoIcon sx={{ fontSize: 16, color: '#FFFFFF' }} />
                          </Box>
                        </Box>
                      ) : (
                        <img src={item.previewUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )
                    ) : item.type === 'video' ? (
                      <VideoIcon sx={{ color: '#6366F1' }} />
                    ) : (
                      <ImageIcon sx={{ color: '#0EA5E9' }} />
                    )}
                  </Box>

                  {/* File info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{ fontWeight: 600, color: '#1E293B', fontSize: '0.84rem' }}
                      title={item.name}
                    >
                      {item.name}
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.3 }}>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        {formatBytes(item.size)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#CBD5E1' }}>•</Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: item.destinationType === 'gallery' ? '#0284C7' : '#7C3AED', fontWeight: 500 }}
                      >
                        {item.destinationName}
                      </Typography>
                    </Stack>

                    {/* Per-item upload progress */}
                    {isCurrent && (
                      <Box sx={{ mt: 0.8 }}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
                          <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 600 }}>
                            Uploading...
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 700 }}>
                            {item.progress}%
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={item.progress}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            bgcolor: '#DBEAFE',
                            '& .MuiLinearProgress-bar': { bgcolor: '#2563EB' },
                          }}
                        />
                      </Box>
                    )}

                    {isFailed && (
                      <Typography
                        variant="caption"
                        sx={{ color: '#DC2626', display: 'block', mt: 0.5, fontSize: '0.75rem', fontWeight: 500 }}
                      >
                        {item.error || 'Upload failed'}
                      </Typography>
                    )}
                  </Box>

                  {/* Status / action */}
                  <Box sx={{ flexShrink: 0 }}>
                    {isDone && <CheckCircleIcon sx={{ color: '#16A34A', fontSize: 20 }} />}
                    {isCurrent && <CircularProgress size={18} sx={{ color: '#2563EB' }} />}
                    {isQueued && (
                      <Tooltip title="Cancel from queue">
                        <IconButton
                          size="small"
                          onClick={() => cancelItem(item.id)}
                          sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444' } }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {isFailed && (
                      <Tooltip title="Retry upload">
                        <IconButton
                          size="small"
                          onClick={() => retryItem(item.id)}
                          sx={{ color: '#DC2626', '&:hover': { bgcolor: '#FEE2E2' } }}
                        >
                          <RefreshIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Card>
    </>
  );
}
