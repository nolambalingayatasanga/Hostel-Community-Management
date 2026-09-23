import React from 'react';
import { Box, Tabs, Tab, Chip } from '@mui/material';

export default function JobNavigationTabs({
  activeTab,
  onTabChange,
  openCount = 0,
  closedCount = 0,
  myAppsCount = 0,
  myPostedCount = 0,
  canApplyForJobs,
  canCreateOrganization
}) {
  return (
    <Box sx={{ borderBottom: 1, borderColor: '#E2E8F0', mb: 1.5, flexShrink: 0, maxWidth: '100%' }}>
      <Tabs
        value={activeTab}
        onChange={(_, val) => onTabChange(val)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          minHeight: 42,
          maxWidth: '100%',
          '& .MuiTabs-indicator': { bgcolor: '#0088ff', height: 3, borderRadius: '3px' },
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '13.5px',
            minHeight: 42,
            py: 0.75,
            whiteSpace: 'nowrap'
          },
          '& .MuiTabs-scrollButtons': {
            color: '#64748B',
            width: 28,
            '&.Mui-disabled': { opacity: 0.25 }
          }
        }}
      >
        <Tab
          value="explore"
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>Explore Openings</span>
              <Chip
                label={openCount}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '11px',
                  fontWeight: 700,
                  bgcolor: activeTab === 'explore' ? '#0088ff' : '#E2E8F0',
                  color: activeTab === 'explore' ? '#fff' : '#64748B'
                }}
              />
            </Box>
          }
        />
        <Tab
          value="closed"
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>Applications Closed</span>
              <Chip
                label={closedCount}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '11px',
                  fontWeight: 700,
                  bgcolor: activeTab === 'closed' ? '#0088ff' : '#E2E8F0',
                  color: activeTab === 'closed' ? '#fff' : '#64748B'
                }}
              />
            </Box>
          }
        />
        {canApplyForJobs && (
          <Tab
            value="my-applications"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>My Applications</span>
                <Chip
                  label={myAppsCount}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '11px',
                    fontWeight: 700,
                    bgcolor: activeTab === 'my-applications' ? '#0088ff' : '#E2E8F0',
                    color: activeTab === 'my-applications' ? '#fff' : '#64748B'
                  }}
                />
              </Box>
            }
          />
        )}
        {canCreateOrganization && (
          <Tab
            value="my-org"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>My Postings & Org</span>
                <Chip
                  label={myPostedCount}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '11px',
                    fontWeight: 700,
                    bgcolor: activeTab === 'my-org' ? '#0088ff' : '#E2E8F0',
                    color: activeTab === 'my-org' ? '#fff' : '#64748B'
                  }}
                />
              </Box>
            }
          />
        )}
      </Tabs>
    </Box>
  );
}
