import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Box, Typography } from '@mui/material';
import {
  DASHBOARD_BG,
  CommunitySection,
  EventsSection,
  GallerySection,
  JobsSection,
  QrDriveSection,
  SecuritySection,
  RecentRegistrationsSection
} from '../../components/Dashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const isAdminOrWarden = ['ADMIN', 'ADMINISTRATOR', 'WARDEN'].includes(user?.role);

  if (!isAdminOrWarden) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          You do not have permission to view the dashboard statistics.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        minHeight: '100%',
        bgcolor: DASHBOARD_BG,
        p: { xs: 1.5, sm: 2.5, md: 3 },
        pb: 5,
        overflowX: 'hidden'
      }}
    >
      {/* ── SECTION 1: COMMUNITY & MEMBERS OVERVIEW ── */}
      <CommunitySection />

      {/* ── SECTION 2: EVENTS & COMMUNITY CALENDAR ── */}
      <EventsSection />

      {/* ── SECTION 3: MEDIA MANAGEMENT & GALLERY ASSETS ── */}
      <GallerySection />

      {/* ── SECTION 4: CAREERS & JOB OPENINGS ── */}
      <JobsSection />

      {/* ── SECTION 5: QR ENGAGEMENT & DRIVE LINKS ── */}
      <QrDriveSection />

      {/* ── SECTION 6: PLATFORM SECURITY & FEEDBACK ── */}
      <SecuritySection />

      {/* ── SECTION 7: RECENT REGISTRATIONS ── */}
      <RecentRegistrationsSection />
    </Box>
  );
}
