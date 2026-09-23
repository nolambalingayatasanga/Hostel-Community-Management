import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  Button
} from '@mui/material';
import {
  QrCode2 as QrCodeIcon,
  TrendingUp as TrendingUpIcon,
  TouchApp as ClickIcon,
  Today as TodayIcon,
  Devices as DevicesIcon,
  Link as LinkIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { BottomWave } from './qrHelpers.jsx';

export default function QrOverviewTab({ data, onNavigateDrive }) {
  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
        {/* 1. TOTAL SCANS */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            sx={{
              borderRadius: '18px',
              border: '1px solid #EBF0F5',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              bgcolor: '#FFFFFF',
              position: 'relative',
              overflow: 'hidden',
              minHeight: { xs: 140, sm: 180 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 }, position: 'relative', zIndex: 1 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: { xs: 36, sm: 42 },
                      height: { xs: 36, sm: 42 },
                      borderRadius: '12px',
                      bgcolor: '#EFF8FF',
                      color: '#0284C7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <QrCodeIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: '#475569',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                  >
                    TOTAL SCANS
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    bgcolor: '#F0F9FF',
                    color: '#0284C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 16 }} />
                </Box>
              </Stack>
              <Box sx={{ mt: { xs: 1.5, sm: 2 } }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 900,
                    color: '#0F172A',
                    lineHeight: 1,
                    fontSize: { xs: '1.8rem', sm: '2.5rem' }
                  }}
                >
                  {Number(data?.scanCount || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, mt: 0.75, fontSize: '0.85rem' }}>
                  QR scans
                </Typography>
              </Box>
            </CardContent>
            <BottomWave color="#0284C7" />
          </Card>
        </Grid>

        {/* 2. DIRECT CLICKS */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            sx={{
              borderRadius: '18px',
              border: '1px solid #EBF0F5',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              bgcolor: '#FFFFFF',
              position: 'relative',
              overflow: 'hidden',
              minHeight: { xs: 140, sm: 180 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 }, position: 'relative', zIndex: 1 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: { xs: 36, sm: 42 },
                      height: { xs: 36, sm: 42 },
                      borderRadius: '12px',
                      bgcolor: '#F0FDF4',
                      color: '#16A34A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ClickIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: '#475569',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                  >
                    DIRECT CLICKS
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    bgcolor: '#DCFCE7',
                    color: '#16A34A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 16 }} />
                </Box>
              </Stack>
              <Box sx={{ mt: { xs: 1.5, sm: 2 } }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 900,
                    color: '#0F172A',
                    lineHeight: 1,
                    fontSize: { xs: '1.8rem', sm: '2.5rem' }
                  }}
                >
                  {Number(data?.clickCount || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, mt: 0.75, fontSize: '0.85rem' }}>
                  Link opened directly
                </Typography>
              </Box>
            </CardContent>
            <BottomWave color="#16A34A" />
          </Card>
        </Grid>

        {/* 3. TODAY'S ACTIVITY */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            sx={{
              borderRadius: '18px',
              border: '1px solid #EBF0F5',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              bgcolor: '#FFFFFF',
              position: 'relative',
              overflow: 'hidden',
              minHeight: { xs: 140, sm: 180 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 }, position: 'relative', zIndex: 1 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: { xs: 36, sm: 42 },
                      height: { xs: 36, sm: 42 },
                      borderRadius: '12px',
                      bgcolor: '#FEF9C3',
                      color: '#CA8A04',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <TodayIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: '#475569',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                  >
                    TODAY'S ACTIVITY
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    bgcolor: '#FEF08A',
                    color: '#CA8A04',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 16 }} />
                </Box>
              </Stack>
              <Box sx={{ mt: { xs: 1.5, sm: 2 } }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 900,
                    color: '#0F172A',
                    lineHeight: 1,
                    fontSize: { xs: '1.8rem', sm: '2.5rem' }
                  }}
                >
                  {(Number(data?.todayScans || 0) + Number(data?.todayClicks || 0)).toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, mt: 0.75, fontSize: '0.85rem' }}>
                  Scans & clicks today
                </Typography>
              </Box>
            </CardContent>
            <BottomWave color="#EAB308" />
          </Card>
        </Grid>

        {/* 4. UNIQUE DEVICES */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            sx={{
              borderRadius: '18px',
              border: '1px solid #EBF0F5',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              bgcolor: '#FFFFFF',
              position: 'relative',
              overflow: 'hidden',
              minHeight: { xs: 140, sm: 180 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 }, position: 'relative', zIndex: 1 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: { xs: 36, sm: 42 },
                      height: { xs: 36, sm: 42 },
                      borderRadius: '12px',
                      bgcolor: '#F3E8FF',
                      color: '#7C3AED',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <DevicesIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: '#475569',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                  >
                    UNIQUE DEVICES
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    bgcolor: '#EDE9FE',
                    color: '#7C3AED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <DevicesIcon sx={{ fontSize: 16 }} />
                </Box>
              </Stack>
              <Box sx={{ mt: { xs: 1.5, sm: 2 } }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 900,
                    color: '#0F172A',
                    lineHeight: 1,
                    fontSize: { xs: '1.8rem', sm: '2.5rem' }
                  }}
                >
                  {Number(data?.uniqueDeviceCount || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, mt: 0.75, fontSize: '0.85rem' }}>
                  Distinct devices
                </Typography>
              </Box>
            </CardContent>
            <BottomWave color="#8B5CF6" />
          </Card>
        </Grid>

        {/* 5. TOTAL DRIVE LINKS */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            sx={{
              borderRadius: '18px',
              border: '1px solid #EBF0F5',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              bgcolor: '#FFFFFF',
              position: 'relative',
              overflow: 'hidden',
              minHeight: { xs: 140, sm: 180 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 }, position: 'relative', zIndex: 1 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: { xs: 36, sm: 42 },
                      height: { xs: 36, sm: 42 },
                      borderRadius: '12px',
                      bgcolor: '#FFE4E6',
                      color: '#E11D48',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <TrendingUpIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: '#475569',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }}
                  >
                    TOTAL DRIVE LINKS
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    bgcolor: '#FFE4E6',
                    color: '#E11D48',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 16 }} />
                </Box>
              </Stack>
              <Box sx={{ mt: { xs: 1.5, sm: 2 } }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 900,
                    color: '#0F172A',
                    lineHeight: 1,
                    fontSize: { xs: '1.8rem', sm: '2.5rem' }
                  }}
                >
                  {Number(data?.totalDriveLinks || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, mt: 0.75, fontSize: '0.85rem' }}>
                  Active drive links
                </Typography>
              </Box>
            </CardContent>
            <BottomWave color="#E11D48" />
          </Card>
        </Grid>

        {/* 6. SHARE YOUR LINKS */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            sx={{
              borderRadius: '18px',
              border: '1px solid #E0F2FE',
              bgcolor: '#F0F9FF',
              minHeight: { xs: 140, sm: 180 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    bgcolor: '#BAE6FD',
                    color: '#0284C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <LinkIcon sx={{ fontSize: 20 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0369A1', fontSize: '0.95rem' }}>
                  Share your links
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem', lineHeight: 1.4, mb: 2 }}>
                Create and share drive links with QR codes for easy access.
              </Typography>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                onClick={onNavigateDrive}
                sx={{
                  bgcolor: '#0284C7',
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  px: 2.5,
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                  '&:hover': { bgcolor: '#0369A1' }
                }}
              >
                Create New Link
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
