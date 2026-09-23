import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  Avatar,
  Typography,
  Chip,
  Button,
  IconButton
} from '@mui/material';
import {
  Business as BusinessIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
  CalendarMonth as CalendarIcon,
  Link as LinkIcon,
  Map as MapIcon,
  Language as WebsiteIcon,
  Email as EmailIcon
} from '@mui/icons-material';

export default function JobDetailsDialog({
  open,
  onClose,
  job,
  canApplyForJobs,
  onOpenApply
}) {
  if (!job) return null;

  let docs = [];
  if (Array.isArray(job.documentsRequired)) {
    docs = job.documentsRequired;
  } else if (typeof job.documentsRequired === 'string' && job.documentsRequired.trim()) {
    docs = job.documentsRequired.split(',').map((s) => s.trim()).filter(Boolean);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
    >
      <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Job Opening Overview</span>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Header Box */}
          <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={job.organization?.logo?.url || ''}
                  sx={{ width: 54, height: 54, bgcolor: '#0088ff', fontWeight: 700, fontSize: '18px' }}
                >
                  {job.organization?.name?.charAt(0) || <BusinessIcon />}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    {job.jobRole}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
                    {job.organization?.name} • {job.organization?.industry}
                  </Typography>
                </Box>
              </Stack>

              <Chip
                label={job.jobType}
                color="primary"
                sx={{ fontWeight: 700, borderRadius: '8px' }}
              />
            </Stack>

            {/* Key Metrics */}
            <Stack direction="row" flexWrap="wrap" gap={2.5} sx={{ mt: 2.5, pt: 2, borderTop: '1px solid #E2E8F0' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Location</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationIcon sx={{ fontSize: 16, color: '#0088ff' }} /> {job.location}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Salary Range</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
                  {job.salaryRange}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Experience</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  {job.experienceYears}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Openings</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  {job.openingsCount} Vacancies
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Education & Description */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
              Education Qualification Required:
            </Typography>
            <Typography variant="body2" sx={{ color: '#334155' }}>
              {job.educationQualification || 'Any Graduate / Equivalent Degree'}
            </Typography>
          </Box>

          {job.description && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
                Job Description & Responsibilities:
              </Typography>
              <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {job.description}
              </Typography>
            </Box>
          )}

          {/* Interview Process & Schedule Info */}
          <Box sx={{ p: 2.5, bgcolor: '#F0F9FF', borderRadius: '12px', borderLeft: '4px solid #0088ff' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0088ff', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon sx={{ fontSize: 18 }} /> Interview Schedule & Process ({job.interviewMode})
            </Typography>

            {job.interviewTiming && (
              <Typography variant="body2" sx={{ color: '#334155', mb: 1 }}>
                <strong>Timing & Availability:</strong> {job.interviewTiming}
              </Typography>
            )}

            {job.interviewMode === 'Online' ? (
              <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#FFFFFF', borderRadius: '8px', border: '1px solid #BAE6FD' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0284C7', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                  Online Meeting Link
                </Typography>
                {job.meetingLink ? (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#0F172A', wordBreak: 'break-all', fontWeight: 600 }}>
                      {job.meetingLink}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<LinkIcon />}
                      href={job.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ textTransform: 'none', bgcolor: '#0088ff', borderRadius: '6px', fontSize: '12px', whiteSpace: 'nowrap' }}
                    >
                      Join Meeting
                    </Button>
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ color: '#64748B' }}>
                    Meeting link will be shared via email upon shortlist.
                  </Typography>
                )}
                {job.interviewLocation && (
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1 }}>
                    <strong>Instructions:</strong> {job.interviewLocation}
                  </Typography>
                )}
              </Box>
            ) : (
              <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#FFFFFF', borderRadius: '8px', border: '1px solid #BAE6FD' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0284C7', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                  In-Person Venue & Physical Address
                </Typography>

                {job.googleMapLink && (
                  <Box sx={{ mb: 1.5 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<MapIcon />}
                      href={job.googleMapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        textTransform: 'none',
                        bgcolor: '#EA4335',
                        '&:hover': { bgcolor: '#DC2626' },
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700
                      }}
                    >
                      Navigate via Google Maps
                    </Button>
                  </Box>
                )}

                {job.offlineAddress?.venueName ? (
                  <Stack spacing={0.5}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                      🏢 {job.offlineAddress.venueName}
                    </Typography>
                    {job.offlineAddress.street && (
                      <Typography variant="body2" sx={{ color: '#334155' }}>
                        📍 {job.offlineAddress.street}
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ color: '#334155' }}>
                      {[job.offlineAddress.city, job.offlineAddress.state, job.offlineAddress.pincode].filter(Boolean).join(', ')}
                    </Typography>
                    {job.offlineAddress.landmark && (
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        <strong>Landmark:</strong> {job.offlineAddress.landmark}
                      </Typography>
                    )}
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ color: '#334155' }}>
                    {job.interviewLocation || job.location}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* Documents to Carry & Requirements */}
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
              Documents to Carry / Submit:
            </Typography>
            {docs.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Updated Resume / CV and valid Government Photo ID Proof.
              </Typography>
            ) : (
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {docs.map((d) => (
                  <Chip
                    key={d}
                    label={d}
                    size="small"
                    sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, fontSize: '11px' }}
                  />
                ))}
              </Stack>
            )}

            {job.resumeRequired && (
              <Chip
                label="Resume / CV Upload is Mandatory upon Application"
                color="primary"
                variant="outlined"
                size="small"
                sx={{ mt: 1.5, fontWeight: 700, fontSize: '11px' }}
              />
            )}
          </Box>

          {/* Company Info Box */}
          {job.organization && (
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
                About {job.organization.name}
              </Typography>
              {job.organization.description && (
                <Typography variant="body2" sx={{ color: '#64748B', mb: 1.5, lineHeight: 1.5 }}>
                  {job.organization.description}
                </Typography>
              )}
              <Stack direction="row" spacing={2} flexWrap="wrap">
                {job.organization.website && (
                  <Button
                    size="small"
                    startIcon={<WebsiteIcon />}
                    href={job.organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ textTransform: 'none', fontSize: '12px' }}
                  >
                    Visit Website
                  </Button>
                )}
                {job.organization.contactEmail && (
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EmailIcon sx={{ fontSize: 14 }} /> {job.organization.contactEmail}
                  </Typography>
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#64748B' }}>
          Close
        </Button>
        {job && !job.hasApplied && job.status !== 'Closed' && canApplyForJobs && (
          <Button
            variant="contained"
            onClick={() => {
              onClose();
              onOpenApply(job);
            }}
            sx={{ borderRadius: '8px', px: 3, textTransform: 'none', fontWeight: 700, bgcolor: '#0088ff' }}
          >
            Apply for this Role
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
