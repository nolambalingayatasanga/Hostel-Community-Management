import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon
} from '@mui/icons-material';

const FALLBACK_MEDIA = [
  { url: '/assets/ksh-login-bg.jpg', caption: 'KSH Community', resourceType: 'image' }
];

const SLIDE_DURATION = 1500; // Slide display duration

const isVideoMedia = (item) => {
  if (!item) return false;
  if (item.resourceType === 'video') return true;
  if (typeof item.url === 'string') {
    return (
      item.url.includes('/video/upload/') ||
      /\.(mp4|webm|mov|ogg)($|\?)/i.test(item.url)
    );
  }
  return false;
};

const AuthImageSlideshow = () => {
  const [images, setImages] = useState(FALLBACK_MEDIA);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTabActive, setIsTabActive] = useState(!document.hidden);

  // Track tab visibility so timer and videos pause when tab is inactive and resume cleanly
  useEffect(() => {
    const handleVisibilityChange = () => {
      const active = !document.hidden;
      setIsTabActive(active);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Fetch all gallery items (images and videos) from public endpoint
  useEffect(() => {
    let isMounted = true;

    const fetchAllGalleryMedia = async () => {
      try {
        const response = await fetch('/api/gallery/public-previews');
        if (!response.ok) return;
        const result = await response.json();

        if (isMounted && result.success && Array.isArray(result.data) && result.data.length > 0) {
          const validMedia = result.data
            .filter((item) => item && item.url)
            .map((item) => ({
              url: item.url,
              caption: item.caption || '',
              resourceType: item.resourceType || (isVideoMedia(item) ? 'video' : 'image')
            }));

          if (validMedia.length > 0) {
            setImages(validMedia);
          }
        }
      } catch (err) {
        console.error('Failed to load gallery preview media:', err);
      }
    };

    fetchAllGalleryMedia();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle slide advance
  const handleNext = useCallback((e) => {
    if (e) {
      e.stopPropagation();
    }
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback((e) => {
    if (e) {
      e.stopPropagation();
    }
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Auto-play timer: only runs when tab is active and not hovered
  useEffect(() => {
    if (images.length <= 1 || isHovered || !isTabActive) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, SLIDE_DURATION);

    return () => {
      clearInterval(timer);
    };
  }, [images.length, isHovered, isTabActive]);

  // Performance optimization: only mount current, previous (crossfade exit), and next (preload)
  const visibleIndices = useMemo(() => {
    const total = images.length;
    if (total <= 3) return new Set(images.map((_, i) => i));
    return new Set([
      currentIndex,
      (currentIndex - 1 + total) % total,
      (currentIndex + 1) % total
    ]);
  }, [currentIndex, images]);

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        bgcolor: '#0A1224'
      }}
    >
      {/* Media Slides */}
      {images.map((item, idx) => {
        if (!visibleIndices.has(idx)) return null;

        const isActive = idx === currentIndex;
        const isVideo = isVideoMedia(item);

        return (
          <Box
            key={item.url + idx}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              overflow: 'hidden',
              opacity: isActive ? 1 : 0,
              transition: 'opacity 0.35s ease-in-out',
              zIndex: isActive ? 2 : 1,
              pointerEvents: isActive ? 'auto' : 'none'
            }}
          >
            {isVideo ? (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  overflow: 'hidden',
                  bgcolor: '#000000'
                }}
              >
                <video
                  ref={(videoEl) => {
                    if (videoEl) {
                      videoEl.muted = true;
                      videoEl.defaultMuted = true;
                      if (isActive && isTabActive) {
                        const playPromise = videoEl.play();
                        if (playPromise !== undefined) {
                          playPromise.catch(() => {});
                        }
                      } else {
                        videoEl.pause();
                      }
                    }
                  }}
                  src={item.url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block',
                    pointerEvents: 'none'
                  }}
                />
              </Box>
            ) : (
              <Box
                component="img"
                src={item.url}
                alt={item.caption || `Gallery slide ${idx + 1}`}
                onError={(e) => {
                  e.target.src = '/assets/ksh-login-bg.jpg';
                }}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block',
                  pointerEvents: 'none'
                }}
              />
            )}
          </Box>
        );
      })}

      {/* Subtle vignette gradient overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(8,16,36,0.18) 0%, rgba(8,16,36,0.04) 50%, rgba(6,12,28,0.60) 100%)',
          zIndex: 3,
          pointerEvents: 'none'
        }}
      />

      {/* Slide Navigation Controls at the bottom */}
      {images.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 0.8,
            borderRadius: '9999px',
            bgcolor: 'rgba(15, 23, 42, 0.70)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
            userSelect: 'none'
          }}
        >
          {/* Previous Button */}
          <IconButton
            onClick={handlePrev}
            size="small"
            aria-label="Previous slide"
            sx={{
              color: 'rgba(255, 255, 255, 0.85)',
              p: 0.5,
              transition: 'all 0.2s',
              '&:hover': {
                color: '#FFFFFF',
                bgcolor: 'rgba(255, 255, 255, 0.18)',
                transform: 'scale(1.1)'
              }
            }}
          >
            <PrevIcon sx={{ fontSize: 20 }} />
          </IconButton>

          {/* Slide Number Indicator */}
          <Typography
            sx={{
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.8px',
              fontFamily: 'monospace',
              px: 0.5,
              whiteSpace: 'nowrap'
            }}
          >
            {currentIndex + 1}
            <Box component="span" sx={{ color: 'rgba(255, 255, 255, 0.45)', mx: 0.6 }}>
              /
            </Box>
            {images.length}
          </Typography>

          {/* Next Button */}
          <IconButton
            onClick={handleNext}
            size="small"
            aria-label="Next slide"
            sx={{
              color: 'rgba(255, 255, 255, 0.85)',
              p: 0.5,
              transition: 'all 0.2s',
              '&:hover': {
                color: '#FFFFFF',
                bgcolor: 'rgba(255, 255, 255, 0.18)',
                transform: 'scale(1.1)'
              }
            }}
          >
            <NextIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      )}

      {/* Bottom Progress Bar indicator */}
      {images.length > 1 && !isHovered && isTabActive && (
        <Box
          key={currentIndex}
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '3px',
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 10,
            animation: `slideProgress ${SLIDE_DURATION}ms linear forwards`,
            '@keyframes slideProgress': {
              '0%': { width: '0%' },
              '100%': { width: '100%' }
            }
          }}
        />
      )}
    </Box>
  );
};

export default AuthImageSlideshow;
