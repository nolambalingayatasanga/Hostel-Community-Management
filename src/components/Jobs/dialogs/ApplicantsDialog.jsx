import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Avatar,
  Box,
  Typography,
  Card,
  Button,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  People as ApplicantsIcon,
  Close as CloseIcon,
  Description as ResumeIcon
} from '@mui/icons-material';

export default function ApplicantsDialog({
  open,
  onClose,
  job,
  applicantsList = [],
  loading = false,
  onUpdateStatus
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
    >
      <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ApplicantsIcon sx={{ color: '#0088ff' }} />
          <span>Applicants for {job?.jobRole} ({applicantsList.length})</span>
        </Stack>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <CircularProgress size={32} sx={{ color: '#0088ff' }} />
          </Box>
        ) : applicantsList.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <ApplicantsIcon sx={{ fontSize: 44, color: '#94A3B8', opacity: 0.5, mb: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
              No applications submitted yet for this role
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
              When candidates apply, their resumes and contact info will appear here.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {applicantsList.map((app) => (
              <Card
                key={app._id}
                sx={{
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  p: 2,
                  boxShadow: 'none'
                }}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      src={app.applicant?.profilePhoto?.url || ''}
                      sx={{ width: 44, height: 44, bgcolor: '#0088ff', fontWeight: 700 }}
                    >
                      {app.applicantName?.charAt(0) || 'A'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {app.applicantName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748B', fontSize: '13px' }}>
                        {app.applicantEmail} • {app.applicantPhone || 'No Phone'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.25 }}>
                        Experience: {app.experience || 'Not specified'} | Education: {app.education || 'Not specified'}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1.5} alignItems="center">
                    {/* Resume download button */}
                    {app.resume?.url && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ResumeIcon />}
                        href={app.resume.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ textTransform: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}
                      >
                        View Resume
                      </Button>
                    )}

                    {/* Status selector */}
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <Select
                        value={app.status}
                        onChange={(e) => onUpdateStatus(app._id, e.target.value)}
                        sx={{ height: 32, fontSize: '12px', fontWeight: 700, borderRadius: '8px' }}
                      >
                        <MenuItem value="Applied">Applied</MenuItem>
                        <MenuItem value="Shortlisted">Shortlisted</MenuItem>
                        <MenuItem value="Interview Scheduled">Interview Scheduled</MenuItem>
                        <MenuItem value="Accepted">Accepted</MenuItem>
                        <MenuItem value="Rejected">Rejected</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                </Stack>

                {app.coverNote && (
                  <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#F8FAFC', borderRadius: '8px' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block' }}>
                      Candidate Note:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155', fontStyle: 'italic', fontSize: '12.5px' }}>
                      "{app.coverNote}"
                    </Typography>
                  </Box>
                )}
              </Card>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
