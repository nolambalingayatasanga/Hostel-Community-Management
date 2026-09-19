import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Slider,
  Stack,
  Chip,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Crop as CropIcon,
  RotateRight as RotateRightIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RestartAlt as ResetIcon,
  Check as CheckIcon
} from '@mui/icons-material';

const ASPECT_RATIOS = [
  { label: '16:9 (Card)', value: 16 / 9 },
  { label: '4:3', value: 4 / 3 },
  { label: '1:1 (Square)', value: 1 },
  { label: '3:2', value: 3 / 2 },
];

export default function ImageCropDialog({
  open,
  imageSrc,
  onClose,
  onCropComplete,
  title = 'Crop & Frame Thumbnail'
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [aspectRatio, setAspectRatio] = useState(16 / 9);
  const [applying, setApplying] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const viewportRef = useRef(null);

  // Reset adjustments whenever dialog opens or image changes
  useEffect(() => {
    if (open) {
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setAspectRatio(16 / 9);
    }
  }, [open, imageSrc]);

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch drag handlers for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { ...pan };
    }
  };

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.min(3, Math.max(1, +(prev + delta).toFixed(2))));
  };

  // Attach global mouseup/touchend
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Apply Crop and export high-res canvas Blob/File
  const handleApplyCrop = async () => {
    if (!imageSrc || !viewportRef.current) return;
    setApplying(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageSrc;
      });

      const viewportRect = viewportRef.current.getBoundingClientRect();
      const targetWidth = 1200;
      const targetHeight = Math.round(targetWidth / aspectRatio);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      const scale = targetWidth / viewportRect.width;

      ctx.save();
      // Translate to canvas center
      ctx.translate(targetWidth / 2, targetHeight / 2);
      // Pan
      ctx.translate(pan.x * scale, pan.y * scale);
      // Rotate
      ctx.rotate((rotation * Math.PI) / 180);
      // Zoom
      ctx.scale(zoom, zoom);

      // Dimensions inside viewport (contained)
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const vpAspect = aspectRatio;
      let baseW, baseH;
      if (imgAspect > vpAspect) {
        baseW = targetWidth;
        baseH = targetWidth / imgAspect;
      } else {
        baseH = targetHeight;
        baseW = targetHeight * imgAspect;
      }

      ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);
      ctx.restore();

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const fileName = `thumbnail_${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            const previewUrl = URL.createObjectURL(blob);
            onCropComplete(file, previewUrl);
            onClose();
          }
          setApplying(false);
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Failed to generate cropped image:', err);
      setApplying(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={applying ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          overflow: 'hidden',
          bgcolor: '#FFFFFF',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)'
        }
      }}
    >
      <DialogTitle
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #E2E8F0',
          bgcolor: '#F8FAFC'
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <CropIcon sx={{ color: '#2563EB', fontSize: 22 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: 17 }}>
            {title}
          </Typography>
        </Stack>
        <IconButton onClick={onClose} disabled={applying} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, bgcolor: '#FFFFFF' }}>
        {/* Aspect Ratio Selector */}
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.75 }}>
          {ASPECT_RATIOS.map((item) => (
            <Chip
              key={item.label}
              label={item.label}
              size="small"
              clickable
              onClick={() => setAspectRatio(item.value)}
              color={aspectRatio === item.value ? 'primary' : 'default'}
              variant={aspectRatio === item.value ? 'filled' : 'outlined'}
              sx={{
                fontWeight: 600,
                fontSize: 12,
                borderRadius: '8px',
                ...(aspectRatio === item.value
                  ? { bgcolor: '#2563EB', color: '#fff' }
                  : { borderColor: '#CBD5E1', color: '#475569' })
              }}
            />
          ))}
        </Stack>

        {/* Crop Viewport */}
        <Box
          ref={viewportRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onWheel={handleWheel}
          sx={{
            width: '100%',
            aspectRatio: aspectRatio,
            maxHeight: 320,
            bgcolor: '#0F172A',
            borderRadius: '14px',
            overflow: 'hidden',
            position: 'relative',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)',
            border: '2px solid #2563EB'
          }}
        >
          {/* Image */}
          {imageSrc && (
            <img
              src={imageSrc}
              alt="Crop preview"
              draggable={false}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }}
            />
          )}

          {/* Rule of Thirds Grid Overlay */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: 'repeat(3, 1fr)',
              border: '1px dashed rgba(255,255,255,0.4)'
            }}
          >
            {[...Array(9)].map((_, i) => (
              <Box key={i} sx={{ border: '0.5px dashed rgba(255,255,255,0.18)' }} />
            ))}
          </Box>

          {/* Drag instruction overlay */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: 'rgba(15, 23, 42, 0.75)',
              color: '#FFFFFF',
              px: 1.5,
              py: 0.35,
              borderRadius: '20px',
              fontSize: 11,
              fontWeight: 600,
              pointerEvents: 'none',
              backdropFilter: 'blur(4px)'
            }}
          >
            Drag to reposition • Scroll to zoom
          </Box>
        </Box>

        {/* Controls Bar: Zoom & Rotate & Reset */}
        <Box sx={{ mt: 2.5, p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <ZoomOutIcon sx={{ color: '#64748B', fontSize: 20 }} />
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.05}
              onChange={(_, val) => setZoom(val)}
              sx={{
                color: '#2563EB',
                '& .MuiSlider-thumb': {
                  width: 18,
                  height: 18,
                  bgcolor: '#FFFFFF',
                  border: '2px solid #2563EB',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }
              }}
            />
            <ZoomInIcon sx={{ color: '#64748B', fontSize: 20 }} />
            <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 700, minWidth: 38 }}>
              {Math.round(zoom * 100)}%
            </Typography>

            <Tooltip title="Rotate 90°">
              <IconButton size="small" onClick={handleRotate} sx={{ color: '#334155', border: '1px solid #CBD5E1', borderRadius: '8px' }}>
                <RotateRightIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Reset Framing">
              <IconButton size="small" onClick={handleReset} sx={{ color: '#334155', border: '1px solid #CBD5E1', borderRadius: '8px' }}>
                <ResetIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 2, borderTop: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
        <Button onClick={onClose} disabled={applying} sx={{ textTransform: 'none', fontWeight: 600, color: '#64748B' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleApplyCrop}
          disabled={applying}
          startIcon={applying ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <CheckIcon />}
          sx={{
            bgcolor: '#2563EB',
            color: '#FFFFFF',
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
            '&:hover': { bgcolor: '#1D4ED8', boxShadow: '0 6px 16px rgba(37,99,235,0.45)' }
          }}
        >
          {applying ? 'Cropping...' : 'Apply Crop'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
