import React, { memo } from 'react';
import {
  Card,
  Box,
  Stack,
  Avatar,
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Timelapse as ExperienceIcon,
  VideoCall as OnlineInterviewIcon,
  MeetingRoom as InPersonIcon,
  People as ApplicantsIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as AppliedCheckIcon
} from '@mui/icons-material';

function JobCardItemComponent({
  job,
  isCreator,
  isAdmin,
  canApplyForJobs,
  onViewDetails,
  onOpenApplicants,
  onToggleStatus,
  onEditJob,
  onDeleteJob,
  onApplyJob
}) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        bgcolor: '#FFFFFF',
        boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.05)',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5
      }}
    >
      {/* 1. Header: Avatar + Company + Job Type */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
          <Avatar
            src={job.organization?.logo?.url || ''}
            sx={{
              width: 44,
              height: 44,
              bgcolor: '#EFF6FF',
              color: '#0088ff',
              fontSize: '16px',
              fontWeight: 700,
              border: '1px solid #DBEAFE',
              borderRadius: '12px',
              flexShrink: 0
            }}
          >
            {job.organization?.name?.charAt(0) || <BusinessIcon sx={{ fontSize: 22 }} />}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', lineHeight: 1.25 }} noWrap>
              {job.organization?.name || 'Company'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '11.5px', mt: 0.25 }} noWrap>
              {job.organization?.industry || 'Industry'}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, flexShrink: 0 }}>
          <Chip
            label={job.jobType}
            size="small"
            sx={{
              height: 22,
              fontSize: '11px',
              fontWeight: 700,
              bgcolor: job.jobType === 'Full-time' ? '#ECFDF5' : job.jobType === 'Internship' ? '#F5F3FF' : '#EFF6FF',
              color: job.jobType === 'Full-time' ? '#059669' : job.jobType === 'Internship' ? '#7C3AED' : '#2563EB',
              borderRadius: '6px'
            }}
          />
          {job.status === 'Closed' && (
            <Chip
              label="Closed"
              size="small"
              sx={{ height: 20, fontSize: '10.5px', fontWeight: 700, bgcolor: '#FEE2E2', color: '#B91C1C', borderRadius: '5px' }}
            />
          )}
        </Box>
      </Box>

      {/* 2. Job Title */}
      <Box>
        <Typography
          variant="subtitle1"
          onClick={() => onViewDetails(job)}
          sx={{
            fontWeight: 800,
            color: '#0F172A',
            fontSize: '15.5px',
            cursor: 'pointer',
            lineHeight: 1.3,
            '&:hover': { color: '#0088ff', textDecoration: 'underline' }
          }}
        >
          {job.jobRole}
        </Typography>
      </Box>

      {/* 3. Key Specifications Pill Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 1,
          bgcolor: '#F8FAFC',
          p: 1.25,
          borderRadius: '10px',
          border: '1px solid #F1F5F9'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
          <LocationIcon sx={{ fontSize: 16, color: '#64748B', flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600, fontSize: '12px' }} noWrap>
            {job.location}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
          <MoneyIcon sx={{ fontSize: 16, color: '#16A34A', flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 700, fontSize: '12px' }} noWrap>
            {job.salaryRange}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
          <ExperienceIcon sx={{ fontSize: 15, color: '#64748B', flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, fontSize: '11.5px' }} noWrap>
            {job.experienceYears}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
          {job.interviewMode === 'Online' ? (
            <OnlineInterviewIcon sx={{ fontSize: 15, color: '#2563EB', flexShrink: 0 }} />
          ) : (
            <InPersonIcon sx={{ fontSize: 15, color: '#D97706', flexShrink: 0 }} />
          )}
          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, fontSize: '11.5px' }} noWrap>
            {job.interviewMode || 'Online'}
          </Typography>
        </Box>
      </Box>

      {/* 4. Education & Counts */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="caption" sx={{ color: '#64748B', maxWidth: 180 }} noWrap>
          🎓 {job.educationQualification || 'Any Graduate'}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            icon={<ApplicantsIcon sx={{ fontSize: '13px !important' }} />}
            label={`${job.applicantsCount || 0} applied`}
            size="small"
            sx={{
              height: 22,
              fontSize: '11px',
              fontWeight: 700,
              bgcolor: (job.applicantsCount || 0) > 0 ? '#EFF6FF' : '#F1F5F9',
              color: (job.applicantsCount || 0) > 0 ? '#1D4ED8' : '#64748B'
            }}
          />
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
            {job.openingsCount} {job.openingsCount === 1 ? 'pos' : 'positions'}
          </Typography>
        </Stack>
      </Box>

      {/* 5. Footer Actions */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          pt: 1.25,
          borderTop: '1px solid #F1F5F9'
        }}
      >
        <Button
          size="small"
          variant="outlined"
          startIcon={<ViewIcon sx={{ fontSize: 16 }} />}
          onClick={() => onViewDetails(job)}
          sx={{
            borderRadius: '8px',
            px: 1.5,
            py: 0.6,
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'none',
            color: '#334155',
            borderColor: '#CBD5E1',
            bgcolor: '#FFFFFF',
            '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' }
          }}
        >
          Details
        </Button>

        {/* Creator / Admin quick icons */}
        {(isCreator || isAdmin) && (
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Tooltip title={`Applicants (${job.applicantsCount || 0})`}>
              <IconButton
                size="small"
                onClick={() => onOpenApplicants(job)}
                sx={{ color: '#0088ff', bgcolor: '#EFF6FF', p: 0.75, borderRadius: '8px' }}
              >
                <Badge badgeContent={job.applicantsCount || 0} color="primary">
                  <ApplicantsIcon sx={{ fontSize: 17 }} />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title={job.status === 'Closed' ? 'Reopen' : 'Close'}>
              <IconButton
                size="small"
                onClick={() => onToggleStatus(job)}
                sx={{
                  color: job.status === 'Closed' ? '#16A34A' : '#D97706',
                  bgcolor: job.status === 'Closed' ? '#F0FDF4' : '#FFFBEB',
                  p: 0.75,
                  borderRadius: '8px'
                }}
              >
                {job.status === 'Closed' ? <RefreshIcon sx={{ fontSize: 17 }} /> : <CloseIcon sx={{ fontSize: 17 }} />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => onEditJob(job)}
                sx={{ color: '#64748B', bgcolor: '#F1F5F9', p: 0.75, borderRadius: '8px' }}
              >
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => onDeleteJob(job)}
                sx={{ color: '#EF4444', bgcolor: '#FEF2F2', p: 0.75, borderRadius: '8px' }}
              >
                <DeleteIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        )}

        {/* Apply / Status Button */}
        <Box sx={{ ml: 'auto' }}>
          {job.status === 'Closed' ? (
            job.hasApplied ? (
              <Chip
                icon={<AppliedCheckIcon sx={{ fontSize: '14px !important', color: '#059669 !important' }} />}
                label="Applied"
                size="small"
                sx={{ height: 32, px: 1, bgcolor: '#ECFDF5', color: '#059669', fontWeight: 700, fontSize: '12px' }}
              />
            ) : (
              <Chip
                label="Closed"
                size="small"
                sx={{ height: 32, px: 1.25, bgcolor: '#F1F5F9', color: '#64748B', fontWeight: 700, fontSize: '12px' }}
              />
            )
          ) : job.hasApplied ? (
            <Chip
              icon={<AppliedCheckIcon sx={{ fontSize: '14px !important', color: '#059669 !important' }} />}
              label="Applied"
              size="small"
              sx={{ height: 32, px: 1, bgcolor: '#ECFDF5', color: '#059669', fontWeight: 700, fontSize: '12px' }}
            />
          ) : canApplyForJobs ? (
            <Button
              variant="contained"
              size="small"
              onClick={() => onApplyJob(job)}
              sx={{
                borderRadius: '9px',
                px: 2.25,
                py: 0.65,
                fontSize: '12.5px',
                fontWeight: 700,
                textTransform: 'none',
                bgcolor: '#0088ff',
                boxShadow: '0 2px 8px rgba(0, 136, 255, 0.25)',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#0077ee', boxShadow: 'none' }
              }}
            >
              Apply Now
            </Button>
          ) : null}
        </Box>
      </Box>
    </Card>
  );
}

export const JobCardItem = memo(JobCardItemComponent);
