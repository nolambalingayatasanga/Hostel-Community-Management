import React from 'react';
import {
  Paper,
  Typography,
  Box,
  CircularProgress,
  Button,
  Stack,
  Card,
  Chip
} from '@mui/material';
import {
  Description as ResumeIcon,
  People as ApplicantsIcon
} from '@mui/icons-material';

export default function MyApplicationsView({
  myApplications = [],
  loading = false,
  onBrowseJobs
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        flex: 1,
        minHeight: 0,
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        overflow: 'auto',
        p: { xs: 2, sm: 3 },
        bgcolor: '#FFFFFF'
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 2 }}>
        My Submitted Applications
      </Typography>

      {loading ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress size={32} sx={{ color: '#0088ff' }} />
        </Box>
      ) : myApplications.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <ResumeIcon sx={{ fontSize: 44, color: '#94A3B8', mb: 1, opacity: 0.6 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
            You haven't applied to any jobs yet
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
            Switch to the "Explore Openings" tab to find opportunities matching your profile.
          </Typography>
          <Button
            variant="outlined"
            onClick={onBrowseJobs}
            sx={{ mt: 2, borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            Browse Job Openings
          </Button>
        </Box>
      ) : (
        <Stack spacing={2}>
          {myApplications.map((app) => (
            <Card
              key={app._id}
              sx={{
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                p: 2
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1.5}
              >
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                    {app.job?.jobRole || 'Role Title'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>
                    {app.job?.organization?.name} • {app.job?.location}
                  </Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.75, flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip
                      icon={<ApplicantsIcon sx={{ fontSize: '14px !important' }} />}
                      label={`${app.job?.applicantsCount || 1} people applied`}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '11px',
                        fontWeight: 700,
                        bgcolor: '#EFF6FF',
                        color: '#1D4ED8',
                        border: '1px solid #BFDBFE'
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      Applied on {new Date(app.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </Typography>
                    {app.job?.status === 'Closed' && (
                      <Chip
                        label="Applications Closed"
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '10.5px',
                          fontWeight: 700,
                          bgcolor: '#FEE2E2',
                          color: '#B91C1C'
                        }}
                      />
                    )}
                  </Stack>
                </Box>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Chip
                    label={app.status}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '11px',
                      bgcolor:
                        app.status === 'Accepted' || app.status === 'Shortlisted'
                          ? '#DCFCE7'
                          : app.status === 'Rejected'
                            ? '#FEE2E2'
                            : '#EFF6FF',
                      color:
                        app.status === 'Accepted' || app.status === 'Shortlisted'
                          ? '#15803D'
                          : app.status === 'Rejected'
                            ? '#B91C1C'
                            : '#1D4ED8'
                    }}
                  />

                  {app.resume?.url && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ResumeIcon />}
                      href={app.resume.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ textTransform: 'none', borderRadius: '8px', fontSize: '12px' }}
                    >
                      View Resume
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </Paper>
  );
}
