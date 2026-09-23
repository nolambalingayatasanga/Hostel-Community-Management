import React from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Collections as GalleryIcon,
  HourglassEmpty as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon
} from '@mui/icons-material';

export default function ShareMediaHeader({
  isAdminOrReviewer,
  activeTab,
  onTabChange,
  adminTabs,
  counts,
  myRequestsCount,
  canCreate
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', lg: 'center' },
        gap: 2,
        width: '100%'
      }}
    >
      {/* Title - Header Section */}
      <Box sx={{ flexShrink: 0 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: '#0F172A',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}
        >
          <CloudUploadIcon sx={{ color: '#0088ff', fontSize: { xs: 26, sm: 32 } }} />
          {isAdminOrReviewer ? 'Media Management' : 'Share Media'}
        </Typography>

        {/* Subtitle - Hidden on mobile viewports */}
        <Typography
          variant="body2"
          sx={{
            color: '#64748B',
            mt: 0.5,
            display: { xs: 'none', sm: 'block' },
            fontSize: { sm: '13px', md: '14px' }
          }}
        >
          {isAdminOrReviewer
            ? 'Review and moderate community uploaded photos, drive links, and event proposals.'
            : 'Contribute photos, videos, drive links, or event proposals to the community.'}
        </Typography>
      </Box>

      {/* Top Level Navigation Tabs */}
      {isAdminOrReviewer ? (
        <Box sx={{ minWidth: 0, maxWidth: '100%', width: { xs: '100%', lg: 'auto' }, overflow: 'hidden' }}>
          <Tabs
            value={adminTabs.includes(activeTab) ? activeTab : 'all_requests'}
            onChange={(_, val) => onTabChange(val)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              bgcolor: '#F1F5F9',
              p: '4px',
              borderRadius: '12px',
              minHeight: '40px',
              maxWidth: '100%',
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTabs-scroller': {
                overflowX: 'auto !important',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' }
              },
              '& .MuiTabs-flexContainer': {
                gap: 0.5,
                flexWrap: 'nowrap'
              },
              '& .MuiTabs-scrollButtons': {
                color: '#64748B',
                width: 28,
                '&.Mui-disabled': { opacity: 0.25 }
              }
            }}
          >
            <Tab
              value="all_requests"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <span>All Requests</span>
                  {counts.total > 0 && (
                    <Chip
                      size="small"
                      label={counts.total}
                      sx={{
                        height: 18,
                        fontSize: '10px',
                        fontWeight: 700,
                        bgcolor: activeTab === 'all_requests' ? '#2563EB' : '#E2E8F0',
                        color: activeTab === 'all_requests' ? '#fff' : '#64748B'
                      }}
                    />
                  )}
                </Box>
              }
              icon={<GalleryIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              sx={{
                minHeight: '32px',
                borderRadius: '9px',
                fontWeight: 600,
                fontSize: { xs: '12px', sm: '13px' },
                py: 0.5,
                px: { xs: 1.5, sm: 2 },
                textTransform: 'none',
                color: '#64748B',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                '&.Mui-selected': { bgcolor: '#FFFFFF', color: '#2563EB', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
              }}
            />
            <Tab
              value="request_queue"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <span>Request Queue</span>
                  {counts.pending > 0 && (
                    <Chip
                      size="small"
                      label={counts.pending}
                      sx={{
                        height: 18,
                        fontSize: '10px',
                        fontWeight: 700,
                        bgcolor: activeTab === 'request_queue' ? '#f59e0b' : '#E2E8F0',
                        color: activeTab === 'request_queue' ? '#fff' : '#64748B'
                      }}
                    />
                  )}
                </Box>
              }
              icon={<PendingIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              sx={{
                minHeight: '32px',
                borderRadius: '9px',
                fontWeight: 600,
                fontSize: { xs: '12px', sm: '13px' },
                py: 0.5,
                px: { xs: 1.5, sm: 2 },
                textTransform: 'none',
                color: '#64748B',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                '&.Mui-selected': { bgcolor: '#FFFFFF', color: '#f59e0b', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
              }}
            />
            <Tab
              value="request_accepted"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <span>Request Accepted</span>
                  {counts.approved > 0 && (
                    <Chip
                      size="small"
                      label={counts.approved}
                      sx={{
                        height: 18,
                        fontSize: '10px',
                        fontWeight: 700,
                        bgcolor: activeTab === 'request_accepted' ? '#10b981' : '#E2E8F0',
                        color: activeTab === 'request_accepted' ? '#fff' : '#64748B'
                      }}
                    />
                  )}
                </Box>
              }
              icon={<ApprovedIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              sx={{
                minHeight: '32px',
                borderRadius: '9px',
                fontWeight: 600,
                fontSize: { xs: '12px', sm: '13px' },
                py: 0.5,
                px: { xs: 1.5, sm: 2 },
                textTransform: 'none',
                color: '#64748B',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                '&.Mui-selected': { bgcolor: '#FFFFFF', color: '#10b981', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
              }}
            />
            <Tab
              value="request_rejected"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <span>Request Rejected</span>
                  {counts.rejected > 0 && (
                    <Chip
                      size="small"
                      label={counts.rejected}
                      sx={{
                        height: 18,
                        fontSize: '10px',
                        fontWeight: 700,
                        bgcolor: activeTab === 'request_rejected' ? '#ef4444' : '#E2E8F0',
                        color: activeTab === 'request_rejected' ? '#fff' : '#64748B'
                      }}
                    />
                  )}
                </Box>
              }
              icon={<RejectedIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              sx={{
                minHeight: '32px',
                borderRadius: '9px',
                fontWeight: 600,
                fontSize: { xs: '12px', sm: '13px' },
                py: 0.5,
                px: { xs: 1.5, sm: 2 },
                textTransform: 'none',
                color: '#64748B',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                '&.Mui-selected': { bgcolor: '#FFFFFF', color: '#ef4444', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
              }}
            />
          </Tabs>
        </Box>
      ) : (
        <Box sx={{ minWidth: 0, maxWidth: '100%', width: { xs: '100%', lg: 'auto' }, overflow: 'hidden' }}>
          <Tabs
            value={activeTab === 'my_requests' ? 'my_requests' : 'submit'}
            onChange={(_, val) => onTabChange(val)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              bgcolor: '#F1F5F9',
              p: '4px',
              borderRadius: '12px',
              minHeight: '40px',
              maxWidth: '100%',
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTabs-scroller': {
                overflowX: 'auto !important',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' }
              },
              '& .MuiTabs-flexContainer': {
                gap: 0.5,
                flexWrap: 'nowrap'
              },
              '& .MuiTabs-scrollButtons': {
                color: '#64748B',
                width: 28,
                '&.Mui-disabled': { opacity: 0.25 }
              }
            }}
          >
            {canCreate && (
              <Tab
                value="submit"
                label="Share Memories"
                icon={<CloudUploadIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                sx={{
                  minHeight: '32px',
                  borderRadius: '9px',
                  fontWeight: 600,
                  fontSize: { xs: '12px', sm: '13px' },
                  py: 0.5,
                  px: { xs: 1.5, sm: 2 },
                  textTransform: 'none',
                  color: '#64748B',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  '&.Mui-selected': { bgcolor: '#FFFFFF', color: '#0088ff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
                }}
              />
            )}
            <Tab
              value="my_requests"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <span>My Submissions</span>
                  {myRequestsCount > 0 && (
                    <Chip
                      size="small"
                      label={myRequestsCount}
                      sx={{
                        height: 18,
                        fontSize: '10px',
                        fontWeight: 700,
                        bgcolor: activeTab === 'my_requests' ? 'rgba(0,136,255,0.15)' : '#E2E8F0',
                        color: activeTab === 'my_requests' ? '#0088ff' : '#64748B'
                      }}
                    />
                  )}
                </Box>
              }
              sx={{
                minHeight: '32px',
                borderRadius: '9px',
                fontWeight: 600,
                fontSize: { xs: '12px', sm: '13px' },
                py: 0.5,
                px: { xs: 1.5, sm: 2 },
                textTransform: 'none',
                color: '#64748B',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                '&.Mui-selected': { bgcolor: '#FFFFFF', color: '#0088ff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
              }}
            />
          </Tabs>
        </Box>
      )}
    </Box>
  );
}
