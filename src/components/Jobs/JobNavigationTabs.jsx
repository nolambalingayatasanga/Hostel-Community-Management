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
    <Box sx={{ borderBottom: '1px solid rgba(226, 232, 240, 0.8)', mb: 2, flexShrink: 0, maxWidth: '100%' }}>
      <Tabs
        value={activeTab}
        onChange={(_, val) => onTabChange(val)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          minHeight: 46,
          maxWidth: '100%',
          '& .MuiTabs-indicator': {
            backgroundColor: '#0088ff',
            height: 3,
            borderRadius: '3px 3px 0 0'
          },
          '& .MuiTab-root': {
            textTransform: 'none',
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 600,
            fontSize: '14px',
            minHeight: 46,
            py: 1,
            px: 2,
            whiteSpace: 'nowrap',
            color: '#64748B',
            '&.Mui-selected': {
              color: '#0088ff',
              fontWeight: 700
            }
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
                  bgcolor: activeTab === 'explore' ? 'rgba(0, 136, 255, 0.12)' : '#F1F5F9',
                  color: activeTab === 'explore' ? '#0088ff' : '#64748B',
                  border: activeTab === 'explore' ? '1px solid rgba(0, 136, 255, 0.25)' : 'none'
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
                  bgcolor: activeTab === 'closed' ? 'rgba(0, 136, 255, 0.12)' : '#F1F5F9',
                  color: activeTab === 'closed' ? '#0088ff' : '#64748B',
                  border: activeTab === 'closed' ? '1px solid rgba(0, 136, 255, 0.25)' : 'none'
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
                    bgcolor: activeTab === 'my-applications' ? 'rgba(0, 136, 255, 0.12)' : '#F1F5F9',
                    color: activeTab === 'my-applications' ? '#0088ff' : '#64748B',
                    border: activeTab === 'my-applications' ? '1px solid rgba(0, 136, 255, 0.25)' : 'none'
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
                    bgcolor: activeTab === 'my-org' ? 'rgba(0, 136, 255, 0.12)' : '#F1F5F9',
                    color: activeTab === 'my-org' ? '#0088ff' : '#64748B',
                    border: activeTab === 'my-org' ? '1px solid rgba(0, 136, 255, 0.25)' : 'none'
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
