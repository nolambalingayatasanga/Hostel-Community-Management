import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  IconButton,
  Slider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  PlayArrowRounded,
  PauseRounded
} from '@mui/icons-material';

const VIDEO_URL = 'https://staging-storage-api.emovur.com/madhan/uploads/1790227111317_1.mp4';

export default function AuthVideoPanel() {
  const theme = useTheme();
  // Only render on desktop (md: 900px and up)
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const videoRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  useEffect(() => {
    if (!isDesktop) return;

    const video = videoRef.current;
    if (!video) return;

    video.volume = 1.0;
    video.muted = false;

    const startPlay = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.debug('Unmuted autoplay prevented by browser policy, fallback to muted autoplay:', err?.message);
            video.muted = true;
            video.play().catch(() => {});

            const unmuteHandler = () => {
              if (video) {
                video.muted = false;
                video.volume = 1.0;
                video.play().catch(() => {});
              }
              window.removeEventListener('click', unmuteHandler);
              window.removeEventListener('keydown', unmuteHandler);
              window.removeEventListener('touchstart', unmuteHandler);
            };

            window.addEventListener('click', unmuteHandler, { once: true });
            window.addEventListener('keydown', unmuteHandler, { once: true });
            window.addEventListener('touchstart', unmuteHandler, { once: true });
          });
      }
    };

    startPlay();
  }, [isDesktop]);

  const handleTimeUpdate = () => {
    if (!isSeeking && videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      setCurrentTime(videoRef.current.currentTime || 0);
    }
  };

  const handleTogglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleSeekChange = (_, value) => {
    setIsSeeking(true);
    setCurrentTime(value);
  };

  const handleSeekCommit = (_, value) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = value;
      setCurrentTime(value);
    }
    setIsSeeking(false);
  };

  if (!isDesktop) {
    return null;
  }

  return (
    <Box
      sx={{
        width: '70%',
        minWidth: '70%',
        maxWidth: '70%',
        height: '100vh',
        maxHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        bgcolor: '#000000',
        userSelect: 'none'
      }}
    >
      <video
        ref={videoRef}
        src={VIDEO_URL}
        autoPlay
        loop
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          imageRendering: '-webkit-optimize-contrast',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          willChange: 'transform'
        }}
      />

      {/* ─── SLEEK MINIMAL VIDEO CONTROLLER (Play/Pause at start + Progress Line) ─── */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 24,
          left: 28,
          right: 28,
          maxWidth: 580,
          mx: 'auto',
          bgcolor: 'rgba(15, 23, 42, 0.76)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '24px',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          px: 1.6,
          py: 0.8,
          display: 'flex',
          alignItems: 'center',
          gap: 1.6,
          zIndex: 10
        }}
      >
        {/* Play / Pause Icon at the start */}
        <IconButton
          size="small"
          onClick={handleTogglePlay}
          title={isPlaying ? "Pause" : "Play"}
          sx={{
            color: '#FFFFFF',
            bgcolor: '#0088ff',
            flexShrink: 0,
            p: 0.75,
            boxShadow: '0 4px 12px rgba(0, 136, 255, 0.4)',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: '#0077e6',
              transform: 'scale(1.06)'
            }
          }}
        >
          {isPlaying ? (
            <PauseRounded sx={{ fontSize: 20 }} />
          ) : (
            <PlayArrowRounded sx={{ fontSize: 20 }} />
          )}
        </IconButton>

        {/* Progress Line (Seek front & back) */}
        <Slider
          size="small"
          value={currentTime}
          min={0}
          max={duration > 0 ? duration : 100}
          step={0.1}
          onChange={handleSeekChange}
          onChangeCommitted={handleSeekCommit}
          sx={{
            flex: 1,
            color: '#0088ff',
            height: 4,
            p: '8px 0',
            '& .MuiSlider-thumb': {
              width: 12,
              height: 12,
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.15s ease',
              '&:hover, &.Mui-focusVisible, &.Mui-active': {
                width: 16,
                height: 16,
                boxShadow: '0 0 0 8px rgba(0, 136, 255, 0.28)'
              }
            },
            '& .MuiSlider-track': {
              border: 'none',
              bgcolor: '#0088ff'
            },
            '& .MuiSlider-rail': {
              opacity: 0.35,
              bgcolor: '#FFFFFF'
            }
          }}
        />
      </Box>
    </Box>
  );
}
