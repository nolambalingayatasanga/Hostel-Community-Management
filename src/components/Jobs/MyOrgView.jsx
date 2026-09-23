import React from 'react';
import {
  Paper,
  Box,
  Stack,
  Avatar,
  Typography,
  Button,
  Card,
  IconButton
} from '@mui/material';
import {
  Business as BusinessIcon,
  Edit as EditIcon,
  Work as WorkIcon,
  Add as AddIcon,
  People as ApplicantsIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

export default function MyOrgView({
  organization,
  myPostedJobs = [],
  onOpenOrgDialog,
  onOpenPostJob,
  onOpenApplicants,
  onOpenDeleteJob
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
      {/* Organization Profile Card */}
      <Box
        sx={{
          display: { xs: 'none', sm: 'block' },
          p: 2.5,
          mb: 3,
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          bgcolor: '#F8FAFC'
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={organization?.logo?.url || ''}
              sx={{ width: 56, height: 56, bgcolor: '#0088ff', fontSize: '20px', fontWeight: 700 }}
            >
              {organization?.name?.charAt(0) || <BusinessIcon />}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                {organization?.name || 'Your Organization Profile'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                {organization?.industry || 'Industry'} • Head Office: {organization?.headOfficeLocation || 'Not specified'}
              </Typography>
              {organization?.establishedYear && (
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  Established in {organization.establishedYear} ({organization.yearsOperating || 0} years in operation)
                </Typography>
              )}
            </Box>
          </Stack>

          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={onOpenOrgDialog}
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
              borderColor: '#CBD5E1'
            }}
          >
            Edit Company Profile
          </Button>
        </Stack>
      </Box>

      {myPostedJobs.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <WorkIcon sx={{ fontSize: 40, color: '#94A3B8', opacity: 0.5, mb: 1 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
            No active jobs posted yet under your organization
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => onOpenPostJob()}
            sx={{ mt: 1.5, borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            Post Your First Job Opening
          </Button>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {myPostedJobs.map((job) => (
            <Card
              key={job._id}
              sx={{
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                p: 2,
                boxShadow: 'none',
                '&:hover': { borderColor: '#94A3B8' }
              }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                    {job.jobRole}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>
                    {job.jobType} • {job.location} • {job.salaryRange} • {job.openingsCount} Openings
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                    Posted on {new Date(job.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ApplicantsIcon />}
                    onClick={() => onOpenApplicants(job)}
                    sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 700 }}
                  >
                    Applicants ({job.applicantsCount || 0})
                  </Button>
                  <IconButton size="small" onClick={() => onOpenPostJob(job)}>
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => onOpenDeleteJob(job)}>
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </Paper>
  );
}
