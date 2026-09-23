import React from 'react';
import {
  Card,
  Box,
  Typography,
  Stack,
  Tabs,
  Tab,
  Button,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  QrCodeScanner as QrScannerIcon,
  FiberManualRecord as DotIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

export default function QrNavSidebar({
  activeTab,
  onTabChange,
  navTabs,
  isMobile,
  loading,
  onRefresh
}) {
  return (
    <Card
      sx={{
        borderRadius: '18px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
        bgcolor: '#FFFFFF',
        p: { xs: 1.25, md: 2 }
      }}
    >
      {/* Sidebar Brand Header (Desktop) */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5, mb: 2.5, px: 1 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
          }}
        >
          <QrScannerIcon sx={{ fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.15, fontSize: '0.95rem' }}>
            QR Scanner
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ mt: 0.25, alignItems: 'center' }}>
            <DotIcon sx={{ fontSize: 9, color: '#16A34A' }} />
            <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 700, fontSize: '0.7rem' }}>
              Live Tracking
            </Typography>
          </Stack>
        </Box>
      </Box>

      {/* Desktop Vertical Tabs / Mobile Horizontal Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, val) => onTabChange(val)}
        orientation={isMobile ? 'horizontal' : 'vertical'}
        variant={isMobile ? 'scrollable' : 'standard'}
        scrollButtons={isMobile ? 'auto' : false}
        sx={{
          '& .MuiTabs-indicator': { display: 'none' },
          gap: 0.5,
          '& .MuiTab-root': {
            minHeight: { xs: 38, md: 44 },
            borderRadius: '12px',
            justifyContent: { xs: 'center', md: 'flex-start' },
            textAlign: 'left',
            px: { xs: 1.5, md: 2 },
            py: 1,
            mb: { xs: 0, md: 0.75 },
            mr: { xs: 0.75, md: 0 },
            textTransform: 'none',
            fontWeight: 600,
            fontSize: { xs: '0.8rem', md: '0.9rem' },
            color: '#64748B',
            transition: 'all 0.18s ease-in-out',
            '&:hover': {
              bgcolor: '#F8FAFC',
              color: '#0F172A'
            },
            '&.Mui-selected': {
              bgcolor: '#EFF8FF',
              color: '#0284C7',
              fontWeight: 800,
              boxShadow: '0 1px 4px rgba(2, 132, 199, 0.08)'
            }
          }
        }}
      >
        {navTabs.map((item, idx) => (
          <Tab
            key={item.label}
            icon={item.icon}
            iconPosition="start"
            label={item.label}
            id={`qr-tab-${idx}`}
          />
        ))}
      </Tabs>

      <Divider sx={{ my: { xs: 1, md: 2 } }} />

      {/* Quick Refresh Button */}
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 0.5, md: 1 }
        }}
      >
        <Button
          fullWidth
          size="small"
          variant="outlined"
          startIcon={loading ? <CircularProgress size={14} /> : <RefreshIcon sx={{ fontSize: 16 }} />}
          onClick={onRefresh}
          disabled={loading}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.78rem',
            borderColor: '#E2E8F0',
            color: '#475569',
            bgcolor: '#FFFFFF',
            py: 0.6,
            '&:hover': { bgcolor: '#F8FAFC' }
          }}
        >
          Refresh Data
        </Button>
      </Stack>
    </Card>
  );
}
