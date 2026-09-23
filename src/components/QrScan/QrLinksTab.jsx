import React from 'react';
import {
  Box,
  Grid,
  Card,
  Typography,
  Stack,
  Button,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  QrCode2 as QrCodeIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Link as LinkIcon,
  PlayArrow as PlayArrowIcon,
  FiberManualRecord as DotIcon,
  OpenInNew as OpenInNewIcon,
  Edit as EditIcon
} from '@mui/icons-material';

export default function QrLinksTab({
  data,
  qrCanvasRef,
  copiedCode,
  copiedDirect,
  copiedAccess,
  downloading,
  testingClick,
  directLinkUrl,
  onCopyText,
  onDownloadQr,
  onTestDirectClick,
  onOpenUpdateDialog
}) {
  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={{ xs: 2, md: 2.5 }}>
        {/* Left Card: QR CODE */}
        <Grid size={{ xs: 12, md: 5.5 }}>
          <Card
            sx={{
              borderRadius: '18px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              bgcolor: '#FFFFFF',
              p: { xs: 2, sm: 3 },
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Box>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    bgcolor: '#EFF8FF',
                    color: '#0284C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <QrCodeIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1E293B', letterSpacing: '0.04em' }}>
                  QR CODE
                </Typography>
              </Stack>

              {/* QR Canvas Container */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 1 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '16px',
                    bgcolor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    display: 'inline-flex'
                  }}
                >
                  <canvas ref={qrCanvasRef} style={{ display: 'block' }} />
                </Box>

                {/* Code badge with copy */}
                {data?.code && (
                  <Box
                    sx={{
                      mt: 2,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      bgcolor: '#EFF8FF',
                      px: 2,
                      py: 0.75,
                      borderRadius: '20px',
                      border: '1px solid #BAE6FD'
                    }}
                  >
                    <Typography sx={{ color: '#0284C7', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'monospace' }}>
                      Code: {data.code}
                    </Typography>
                    <Tooltip title="Copy Code">
                      <IconButton
                        size="small"
                        onClick={() => onCopyText(data.code, 'code', 'Code')}
                        sx={{ color: '#0284C7', p: 0.25 }}
                      >
                        {copiedCode ? <CheckIcon sx={{ fontSize: 15 }} /> : <CopyIcon sx={{ fontSize: 15 }} />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Download Buttons */}
            <Stack direction="row" spacing={1.5} sx={{ mt: 3, alignItems: 'center' }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={downloading ? <CircularProgress size={16} /> : <DownloadIcon />}
                onClick={() => onDownloadQr('png')}
                disabled={downloading}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, borderColor: '#CBD5E1', color: '#334155' }}
              >
                Download PNG
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => onDownloadQr('svg')}
                disabled={downloading}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, borderColor: '#CBD5E1', color: '#334155' }}
              >
                Download SVG
              </Button>
            </Stack>
          </Card>
        </Grid>

        {/* Right Card: DIRECT PORTAL LINK (TRACKS CLICKS) */}
        <Grid size={{ xs: 12, md: 6.5 }}>
          <Card
            sx={{
              borderRadius: '18px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              bgcolor: '#FFFFFF',
              p: { xs: 2, sm: 3 },
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Box>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    bgcolor: '#F0FDF4',
                    color: '#16A34A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <LinkIcon sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1E293B', letterSpacing: '0.04em' }}>
                  TRACKS DIRECT PORTAL LINK CLICKS
                </Typography>
              </Stack>

              {/* URL Box */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  bgcolor: '#FFFFFF',
                  mb: 2
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: { xs: '0.8rem', sm: '0.88rem' },
                    fontWeight: 600,
                    color: '#1E293B',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    pr: 1
                  }}
                >
                  {directLinkUrl}
                </Typography>
                <Tooltip title="Copy Direct Link">
                  <IconButton
                    size="small"
                    onClick={() => onCopyText(directLinkUrl, 'direct', 'Direct portal link')}
                    sx={{ color: '#64748B' }}
                  >
                    {copiedDirect ? <CheckIcon sx={{ fontSize: 18, color: '#16A34A' }} /> : <CopyIcon sx={{ fontSize: 18 }} />}
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Action Buttons */}
              <Stack direction="row" spacing={1.5} sx={{ mb: 2.5, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={testingClick ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon sx={{ fontSize: 18 }} />}
                  onClick={onTestDirectClick}
                  disabled={testingClick}
                  sx={{
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 700,
                    color: '#16A34A',
                    borderColor: '#86EFAC',
                    bgcolor: '#FFFFFF',
                    py: 1,
                    '&:hover': { bgcolor: '#F0FDF4', borderColor: '#4ADE80' }
                  }}
                >
                  Test Direct Click
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={copiedDirect ? <CheckIcon sx={{ fontSize: 18 }} /> : <CopyIcon sx={{ fontSize: 18 }} />}
                  onClick={() => onCopyText(directLinkUrl, 'direct', 'Direct portal link')}
                  sx={{
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 700,
                    bgcolor: '#16A34A',
                    py: 1,
                    boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                    '&:hover': { bgcolor: '#15803D' }
                  }}
                >
                  {copiedDirect ? 'Copied' : 'Copy Link'}
                </Button>
              </Stack>
            </Box>

            {/* Status Box */}
            <Box sx={{ p: 2, borderRadius: '12px', bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <DotIcon sx={{ fontSize: 16, color: '#16A34A' }} />
              <Box>
                <Typography sx={{ fontWeight: 800, color: '#15803D', fontSize: '0.85rem' }}>
                  Link is active
                </Typography>
                <Typography variant="caption" sx={{ color: '#4B7C59', fontWeight: 500 }}>
                  Clicks are being tracked & added to total analytics
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Bottom Card: Login Access Link + UPDATE LINK OPTION */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ borderRadius: '18px', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', bgcolor: '#FFFFFF', p: { xs: 2, sm: 2.5 } }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              sx={{
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' }
              }}
              spacing={2}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    bgcolor: '#EFF8FF',
                    color: '#0284C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <QrCodeIcon sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                    Login Access Link
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.82rem' }}>
                    Redirects to <strong>{data?.redirectUrl || 'https://www.kambi-connect.in/login'}</strong>
                  </Typography>
                </Box>
              </Stack>

              <Stack
                direction="row"
                spacing={1.25}
                sx={{
                  alignItems: 'center',
                  width: { xs: '100%', sm: 'auto' },
                  justifyContent: 'flex-end',
                  flexWrap: 'wrap',
                  gap: 1
                }}
              >
                <Tooltip title="Copy destination URL">
                  <IconButton
                    size="small"
                    onClick={() => onCopyText(data?.redirectUrl || 'https://www.kambi-connect.in/login', 'access', 'Access link')}
                    sx={{ border: '1px solid #E2E8F0', borderRadius: '9px' }}
                  >
                    {copiedAccess ? <CheckIcon sx={{ fontSize: 18, color: '#16A34A' }} /> : <CopyIcon sx={{ fontSize: 18, color: '#64748B' }} />}
                  </IconButton>
                </Tooltip>
                <Button
                  variant="outlined"
                  size="small"
                  endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                  onClick={() => window.open(data?.redirectUrl || 'https://www.kambi-connect.in/login', '_blank', 'noopener,noreferrer')}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', borderColor: '#CBD5E1', color: '#0284C7' }}
                >
                  Open Link
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                  onClick={onOpenUpdateDialog}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: '10px',
                    bgcolor: '#0284C7',
                    '&:hover': { bgcolor: '#0369A1' }
                  }}
                >
                  Update Link
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
