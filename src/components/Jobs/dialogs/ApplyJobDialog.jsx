import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  CloudUpload as UploadIcon,
  Description as ResumeIcon
} from '@mui/icons-material';

export default function ApplyJobDialog({
  open,
  onClose,
  applyingJob,
  applyForm,
  setApplyForm,
  resumeFile,
  setResumeFile,
  submittingApp,
  onSubmitApplication
}) {
  if (!applyingJob) return null;

  let docs = [];
  if (Array.isArray(applyingJob?.documentsRequired)) {
    docs = applyingJob.documentsRequired;
  } else if (typeof applyingJob?.documentsRequired === 'string' && applyingJob.documentsRequired.trim()) {
    docs = applyingJob.documentsRequired.split(',').map((s) => s.trim()).filter(Boolean);
  }

  return (
    <Dialog
      open={open}
      onClose={() => !submittingApp && onClose()}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
    >
      <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Apply for {applyingJob?.jobRole}</span>
        <IconButton size="small" onClick={() => !submittingApp && onClose()}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box component="form" onSubmit={onSubmitApplication} sx={{ mt: 1 }}>
          <Stack spacing={2.5}>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Applying to <strong>{applyingJob?.organization?.name}</strong> for the <strong>{applyingJob?.jobRole}</strong> position.
            </Typography>

            {/* Documents to Carry Checklist Notice */}
            {docs.length > 0 && (
              <Box sx={{ p: 2, bgcolor: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#166534', mb: 0.75, display: 'flex', alignItems: 'center', gap: 0.75, fontSize: '13px' }}>
                  <CheckIcon sx={{ fontSize: 16 }} /> Documents required for this interview / selection process:
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.75}>
                  {docs.map((d) => (
                    <Chip
                      key={d}
                      label={d}
                      size="small"
                      sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 600, fontSize: '11px' }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Applicant Name & Email */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Full Name <span style={{ color: '#EF4444' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  required
                  value={applyForm.applicantName}
                  onChange={(e) => setApplyForm({ ...applyForm, applicantName: e.target.value })}
                  size="small"
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Email Address <span style={{ color: '#EF4444' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  type="email"
                  required
                  value={applyForm.applicantEmail}
                  onChange={(e) => setApplyForm({ ...applyForm, applicantEmail: e.target.value })}
                  size="small"
                />
              </Box>
            </Stack>

            {/* Phone & Experience */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Phone Number
                </Typography>
                <TextField
                  fullWidth
                  value={applyForm.applicantPhone}
                  onChange={(e) => setApplyForm({ ...applyForm, applicantPhone: e.target.value })}
                  size="small"
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Your Experience
                </Typography>
                <TextField
                  fullWidth
                  value={applyForm.experience}
                  onChange={(e) => setApplyForm({ ...applyForm, experience: e.target.value })}
                  size="small"
                />
              </Box>
            </Stack>

            {/* Education */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                Education / Degree
              </Typography>
              <TextField
                fullWidth
                value={applyForm.education}
                onChange={(e) => setApplyForm({ ...applyForm, education: e.target.value })}
                size="small"
              />
            </Box>

            {/* Resume Upload */}
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
                Upload Resume / CV {applyingJob?.resumeRequired && <span style={{ color: '#EF4444' }}>*</span>}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                PDF, DOCX, or Image formats up to 20MB.
              </Typography>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  size="small"
                  sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
                >
                  Select Resume File
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setResumeFile(file);
                    }}
                  />
                </Button>

                {resumeFile && (
                  <Chip
                    icon={<ResumeIcon />}
                    label={`${resumeFile.name} (${Math.round(resumeFile.size / 1024)} KB)`}
                    onDelete={() => setResumeFile(null)}
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Stack>
            </Box>

            {/* Cover Note */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                Cover Note / Why should we hire you? (Optional)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={applyForm.coverNote}
                onChange={(e) => setApplyForm({ ...applyForm, coverNote: e.target.value })}
                size="small"
              />
            </Box>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submittingApp} sx={{ textTransform: 'none', color: '#64748B' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSubmitApplication}
          disabled={submittingApp || !applyForm.applicantName?.trim() || !applyForm.applicantEmail?.trim() || (applyingJob?.resumeRequired && !resumeFile)}
          startIcon={submittingApp ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ borderRadius: '8px', px: 3, textTransform: 'none', fontWeight: 700, bgcolor: '#0088ff' }}
        >
          {submittingApp ? 'Submitting Application...' : 'Submit Application'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
