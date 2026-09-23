import React, { memo } from 'react';
import {
  TableRow,
  TableCell,
  Stack,
  Avatar,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Badge,
  Button
} from '@mui/material';
import {
  Business as BusinessIcon,
  LocationOn as LocationIcon,
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

function JobTableRowComponent({
  job,
  rowNumber,
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
    <TableRow
      hover
      sx={{
        bgcolor: '#FFFFFF',
        transition: 'background-color 0.15s ease',
        '&:last-child td, &:last-child th': { border: 0 }
      }}
    >
      {/* # */}
      <TableCell sx={{ py: 1.5, px: 2, fontSize: '13px', color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap' }}>
        {rowNumber}
      </TableCell>

      {/* Company / Organization */}
      <TableCell sx={{ py: 1.5, px: 2, whiteSpace: 'nowrap' }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Avatar
            src={job.organization?.logo?.url || ''}
            sx={{ width: 36, height: 36, bgcolor: '#EFF6FF', color: '#0088ff', fontSize: '13px', fontWeight: 700, border: '1px solid #E2E8F0' }}
          >
            {job.organization?.name?.charAt(0) || <BusinessIcon sx={{ fontSize: 18 }} />}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
              {job.organization?.name || 'Company'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
              {job.organization?.industry || 'Industry'}
            </Typography>
          </Box>
        </Stack>
      </TableCell>

      {/* Job Role & Type */}
      <TableCell sx={{ py: 1.5, px: 2, whiteSpace: 'nowrap' }}>
        <Box>
          <Typography
            variant="body2"
            onClick={() => onViewDetails(job)}
            sx={{ fontWeight: 700, color: '#0088ff', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
          >
            {job.jobRole}
          </Typography>
          <Chip
            label={job.jobType}
            size="small"
            sx={{
              height: 20,
              fontSize: '10.5px',
              fontWeight: 700,
              mt: 0.5,
              bgcolor: job.jobType === 'Full-time' ? '#ECFDF5' : job.jobType === 'Internship' ? '#F5F3FF' : '#EFF6FF',
              color: job.jobType === 'Full-time' ? '#059669' : job.jobType === 'Internship' ? '#7C3AED' : '#2563EB'
            }}
          />
        </Box>
      </TableCell>

      {/* Location */}
      <TableCell sx={{ py: 1.5, px: 2, whiteSpace: 'nowrap' }}>
        <Typography variant="body2" sx={{ color: '#334155', display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '13px' }}>
          <LocationIcon sx={{ fontSize: 15, color: '#64748B' }} />
          {job.location}
        </Typography>
      </TableCell>

      {/* Experience & Edu */}
      <TableCell sx={{ py: 1.5, px: 2, whiteSpace: 'nowrap' }}>
        <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 600, fontSize: '12.5px' }}>
          {job.experienceYears}
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', maxWidth: 160, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {job.educationQualification || 'Any Graduate'}
        </Typography>
      </TableCell>

      {/* Salary */}
      <TableCell sx={{ py: 1.5, px: 2, whiteSpace: 'nowrap' }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A', fontSize: '13px' }}>
          {job.salaryRange}
        </Typography>
      </TableCell>

      {/* Interview Mode */}
      <TableCell sx={{ py: 1.5, px: 2, whiteSpace: 'nowrap' }}>
        <Chip
          icon={job.interviewMode === 'Online' ? <OnlineInterviewIcon sx={{ fontSize: '13px !important' }} /> : <InPersonIcon sx={{ fontSize: '13px !important' }} />}
          label={job.interviewMode || 'Online'}
          size="small"
          sx={{
            height: 22,
            fontSize: '11px',
            fontWeight: 600,
            bgcolor: job.interviewMode === 'Online' ? '#EFF6FF' : '#FEF3C7',
            color: job.interviewMode === 'Online' ? '#1D4ED8' : '#B45309'
          }}
        />
      </TableCell>

      {/* People Applied Count */}
      <TableCell sx={{ py: 1.5, px: 2, textAlign: 'center', whiteSpace: 'nowrap' }}>
        <Chip
          icon={<ApplicantsIcon sx={{ fontSize: '14px !important' }} />}
          label={`${job.applicantsCount || 0} applied`}
          size="small"
          sx={{
            height: 24,
            fontSize: '11px',
            fontWeight: 700,
            bgcolor: (job.applicantsCount || 0) > 0 ? '#EFF6FF' : '#F8FAFC',
            color: (job.applicantsCount || 0) > 0 ? '#1D4ED8' : '#64748B',
            border: '1px solid',
            borderColor: (job.applicantsCount || 0) > 0 ? '#BFDBFE' : '#E2E8F0'
          }}
        />
      </TableCell>

      {/* Openings Count */}
      <TableCell sx={{ py: 1.5, px: 2, textAlign: 'center', whiteSpace: 'nowrap' }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>
          {job.openingsCount}
        </Typography>
      </TableCell>

      {/* Action Buttons */}
      <TableCell sx={{ py: 1.5, px: 2, textAlign: 'right', whiteSpace: 'nowrap' }}>
        <Stack direction="row" spacing={0.75} justifyContent="flex-end" alignItems="center">
          {/* View Details */}
          <Tooltip title="View job description & details">
            <IconButton
              size="small"
              onClick={() => onViewDetails(job)}
              sx={{ color: '#64748B', '&:hover': { color: '#0088ff', bgcolor: '#F0F9FF' } }}
            >
              <ViewIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          {/* Creator or Admin controls */}
          {(isCreator || isAdmin) && (
            <>
              <Tooltip title={`View applicants (${job.applicantsCount || 0})`}>
                <IconButton
                  size="small"
                  onClick={() => onOpenApplicants(job)}
                  sx={{ color: '#0088ff', '&:hover': { bgcolor: '#EFF6FF' } }}
                >
                  <Badge badgeContent={job.applicantsCount || 0} color="primary">
                    <ApplicantsIcon sx={{ fontSize: 18 }} />
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* Toggle Open / Closed Status */}
              <Tooltip title={job.status === 'Closed' ? 'Reopen job applications' : 'Close applications'}>
                <IconButton
                  size="small"
                  onClick={() => onToggleStatus(job)}
                  sx={{
                    color: job.status === 'Closed' ? '#16A34A' : '#D97706',
                    '&:hover': { bgcolor: job.status === 'Closed' ? '#F0FDF4' : '#FFFBEB' }
                  }}
                >
                  {job.status === 'Closed' ? <RefreshIcon sx={{ fontSize: 17 }} /> : <CloseIcon sx={{ fontSize: 17 }} />}
                </IconButton>
              </Tooltip>

              <Tooltip title="Edit job opening">
                <IconButton
                  size="small"
                  onClick={() => onEditJob(job)}
                  sx={{ color: '#64748B', '&:hover': { bgcolor: '#F1F5F9' } }}
                >
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete job opening">
                <IconButton
                  size="small"
                  onClick={() => onDeleteJob(job)}
                  sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEF2F2' } }}
                >
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </>
          )}

          {/* Apply Button or Closed Status */}
          {job.status === 'Closed' ? (
            job.hasApplied ? (
              <Chip
                icon={<AppliedCheckIcon sx={{ fontSize: '14px !important', color: '#059669 !important' }} />}
                label="Applied"
                size="small"
                sx={{ height: 28, px: 0.5, bgcolor: '#ECFDF5', color: '#059669', fontWeight: 700, fontSize: '11.5px', whiteSpace: 'nowrap' }}
              />
            ) : (
              <Chip
                label="Closed"
                size="small"
                sx={{ height: 28, px: 1, bgcolor: '#F1F5F9', color: '#64748B', fontWeight: 700, fontSize: '11.5px', border: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}
              />
            )
          ) : job.hasApplied ? (
            <Chip
              icon={<AppliedCheckIcon sx={{ fontSize: '14px !important', color: '#059669 !important' }} />}
              label="Applied"
              size="small"
              sx={{ height: 28, px: 0.5, bgcolor: '#ECFDF5', color: '#059669', fontWeight: 700, fontSize: '11.5px', whiteSpace: 'nowrap' }}
            />
          ) : canApplyForJobs ? (
            <Button
              variant="contained"
              size="small"
              onClick={() => onApplyJob(job)}
              sx={{
                borderRadius: '8px',
                px: 1.75,
                py: 0.4,
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'none',
                bgcolor: '#0088ff',
                boxShadow: 'none',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#0077ee', boxShadow: 'none' }
              }}
            >
              Apply
            </Button>
          ) : null}
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export const JobTableRow = memo(JobTableRowComponent);
