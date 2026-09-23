import React, { useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  PhotoCamera as CameraIcon,
  SwitchCamera as SwitchCameraIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  VideocamOff as CameraOffIcon
} from '@mui/icons-material';

export default function CameraCaptureDialog({
  open,
  onClose,
  cameraError,
  cameraLoading,
  cameraStream,
  facingMode,
  capturedImage,
  startCamera,
  toggleCameraFacingMode,
  capturePhoto,
  retakePhoto,
  uploadCapturedPhoto,
  photoUploading,
  handlePhotoUpload,
  videoRef,
  canvasRef
}) {
  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableScrollLock
      PaperProps={{
        sx: {
          backgroundColor: '#ffffff',
          border: '1px solid #EAECF0',
          borderRadius: 3,
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)'
        }
      }}
    >
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300
        }}
      >
        {cameraError ? (
          <Box sx={{ py: 3, px: 2, textAlign: 'center', width: '100%' }}>
            <CameraOffIcon sx={{ fontSize: 48, color: '#EF4444', mb: 1.5 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 0.5 }}>
              Camera Unavailable
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', maxWidth: 360, mx: 'auto', mb: 3 }}>
              {cameraError}
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => startCamera(facingMode)}
                sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#CBD5E1', color: '#334155' }}
              >
                Try Again
              </Button>
              <Button
                variant="contained"
                component="label"
                startIcon={<CameraIcon />}
                sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#0088ff', color: '#fff' }}
              >
                Snap Photo with Device
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  hidden
                  onChange={(e) => {
                    onClose();
                    handlePhotoUpload(e);
                  }}
                />
              </Button>
            </Stack>
          </Box>
        ) : (
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4/3',
              borderRadius: 2,
              overflow: 'hidden',
              border: '2px solid rgba(0, 136, 255, 0.3)',
              backgroundColor: '#0F172A',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 2
            }}
          >
            {cameraLoading && !cameraStream && (
              <Box
                sx={{
                  position: 'absolute',
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <CircularProgress size={36} sx={{ color: '#0088ff' }} />
                <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                  Accessing camera...
                </Typography>
              </Box>
            )}

            {!capturedImage ? (
              <video
                ref={(el) => {
                  if (videoRef) videoRef.current = el;
                  if (el && cameraStream && el.srcObject !== cameraStream) {
                    el.srcObject = cameraStream;
                    el.play().catch(() => {});
                  }
                }}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
                }}
              />
            ) : (
              <img
                src={capturedImage}
                alt="Captured profile preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            )}

            {/* Hidden canvas for snapshot capture */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </Box>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          justifyContent: 'space-between',
          borderTop: '1px solid #EAECF0',
          pt: 2
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ color: 'text.secondary', borderColor: '#D0D5DD' }}
        >
          Cancel
        </Button>

        {!cameraError && (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {!capturedImage ? (
              <>
                <Button
                  onClick={toggleCameraFacingMode}
                  variant="outlined"
                  startIcon={<SwitchCameraIcon />}
                  sx={{ borderColor: 'rgba(0, 136, 255, 0.3)', color: '#0088ff' }}
                >
                  Switch Camera
                </Button>
                <Button
                  onClick={capturePhoto}
                  variant="contained"
                  disabled={cameraLoading || !cameraStream}
                  startIcon={<CameraIcon />}
                  sx={{ background: '#0088ff', color: '#fff', fontWeight: 'bold' }}
                >
                  Capture
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={retakePhoto}
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  sx={{ borderColor: '#D0D5DD', color: 'text.secondary' }}
                >
                  Retake
                </Button>
                <Button
                  onClick={uploadCapturedPhoto}
                  disabled={photoUploading}
                  variant="contained"
                  startIcon={
                    photoUploading ? (
                      <CircularProgress size={16} sx={{ color: '#fff' }} />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  sx={{
                    background: '#0088ff',
                    color: '#fff',
                    fontWeight: 'bold',
                    '&:hover': { background: '#0077EE' }
                  }}
                >
                  {photoUploading ? 'Uploading...' : 'Save & Upload'}
                </Button>
              </>
            )}
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
}
