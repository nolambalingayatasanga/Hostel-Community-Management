import React from 'react';
import {
  Box,
  Grid,
  Card,
  Typography,
  Stack,
  Chip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  QrCode2 as QrCodeIcon,
  Link as LinkIcon,
  Devices as DevicesIcon,
  FiberManualRecord as DotIcon
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer
} from 'recharts';

export default function QrAnalyticsTab({ data }) {
  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={{ xs: 2, md: 2.5 }}>
        {/* Left: Weekly Area Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card
            sx={{
              borderRadius: '18px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              bgcolor: '#FFFFFF',
              p: { xs: 2, sm: 3 }
            }}
          >
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: '#EFF8FF',
                  px: 1.5,
                  py: 0.6,
                  borderRadius: '16px',
                  border: '1px solid #BAE6FD'
                }}
              >
                <TrendingUpIcon sx={{ fontSize: 16, color: '#0284C7' }} />
                <Typography sx={{ color: '#0284C7', fontWeight: 800, fontSize: '0.82rem' }}>
                  {data?.weekScans || 100} scans this week
                </Typography>
              </Box>
            </Stack>

            {/* Chart Container */}
            <Box sx={{ width: '100%', height: { xs: 240, sm: 320 }, mt: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="qrColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="clickColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="day" tickLine={false} axisLine={{ stroke: '#E2E8F0' }} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} />
                  <YAxis tickLine={false} axisLine={{ stroke: '#E2E8F0' }} tick={{ fill: '#64748B', fontSize: 12 }} allowDecimals={false} />
                  <ChartTooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}
                  />
                  <Area type="monotone" dataKey="scans" stroke="#0284C7" strokeWidth={3} fillOpacity={1} fill="url(#qrColor)" name="QR Scans" />
                  <Area type="monotone" dataKey="clicks" stroke="#16A34A" strokeWidth={3} fillOpacity={1} fill="url(#clickColor)" name="Direct Clicks" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>

            {/* Legend */}
            <Stack direction="row" spacing={3} sx={{ justifyContent: 'center', alignItems: 'center', mt: 2 }}>
              <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center' }}>
                <DotIcon sx={{ fontSize: 14, color: '#0284C7' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>QR Scans</Typography>
              </Stack>
              <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center' }}>
                <DotIcon sx={{ fontSize: 14, color: '#16A34A' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>Direct Clicks</Typography>
              </Stack>
            </Stack>
          </Card>
        </Grid>

        {/* Right: 3 Stacked Metric Cards */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2}>
            {/* Card 1: Total Scans */}
            <Card sx={{ borderRadius: '18px', border: '1px solid #E2E8F0', p: 2.5, bgcolor: '#FFFFFF' }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
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
                      justifyContent: 'center'
                    }}
                  >
                    <QrCodeIcon sx={{ fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.8rem' }}>
                      Total Scans
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A', lineHeight: 1.1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                      {Number(data?.scanCount || 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  label={`+${data?.scanGrowth ?? 78}% vs last week`}
                  size="small"
                  sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 800, fontSize: '0.72rem', height: 24 }}
                />
              </Stack>
            </Card>

            {/* Card 2: Total Clicks */}
            <Card sx={{ borderRadius: '18px', border: '1px solid #E2E8F0', p: 2.5, bgcolor: '#FFFFFF' }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
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
                  <Box>
                    <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.8rem' }}>
                      Total Clicks
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A', lineHeight: 1.1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                      {Number(data?.clickCount || 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  label={`${data?.clickGrowth ?? 0}% vs last week`}
                  size="small"
                  sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 800, fontSize: '0.72rem', height: 24 }}
                />
              </Stack>
            </Card>

            {/* Card 3: Unique Devices */}
            <Card sx={{ borderRadius: '18px', border: '1px solid #E2E8F0', p: 2.5, bgcolor: '#FFFFFF' }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      bgcolor: '#F3E8FF',
                      color: '#7C3AED',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <DevicesIcon sx={{ fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.8rem' }}>
                      Unique Devices
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#0F172A', lineHeight: 1.1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                      {Number(data?.uniqueDeviceCount || 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  label={`+${data?.deviceGrowth ?? 62}% vs last week`}
                  size="small"
                  sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 800, fontSize: '0.72rem', height: 24 }}
                />
              </Stack>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
