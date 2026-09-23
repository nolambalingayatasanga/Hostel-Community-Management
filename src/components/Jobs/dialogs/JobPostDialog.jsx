import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  Button,
  Typography,
  TextField,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  IconButton,
  CircularProgress,
  Switch,
  FormControlLabel,
  InputAdornment,
  Checkbox
} from '@mui/material';
import {
  Work as WorkIcon,
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  Link as LinkIcon,
  Map as MapIcon
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { JOB_TYPES, EDUCATION_DEGREES, REQUIRED_DOCUMENTS_OPTIONS } from '../../../constants/jobConstants';

export default function JobPostDialog({
  open,
  onClose,
  editingJob,
  jobForm,
  setJobForm,
  savingJob,
  onSaveJob,
  computeTimingSummary
}) {
  return (
    <Dialog
      open={open}
      onClose={() => !savingJob && onClose()}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
    >
      <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <WorkIcon sx={{ color: '#0088ff' }} />
          <span>{editingJob ? 'Edit Job Opening' : 'Post New Job Opening'}</span>
        </Stack>
        <IconButton size="small" onClick={() => !savingJob && onClose()}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box component="form" onSubmit={onSaveJob} sx={{ mt: 1 }}>
          <Stack spacing={2.5}>
            {/* Role & Type */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Job Role / Title <span style={{ color: '#EF4444' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  required
                  value={jobForm.jobRole}
                  onChange={(e) => setJobForm({ ...jobForm, jobRole: e.target.value })}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Job Type
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  displayEmpty
                  value={jobForm.jobType}
                  onChange={(e) => setJobForm({ ...jobForm, jobType: e.target.value })}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {JOB_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Stack>

            {/* Location & Salary */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Job Location <span style={{ color: '#EF4444' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  required
                  value={jobForm.location}
                  onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Salary Range
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={jobForm.salaryRange}
                  onChange={(e) => setJobForm({ ...jobForm, salaryRange: e.target.value })}
                />
              </Box>
            </Stack>

            {/* Experience & Education */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Experience Required <span style={{ color: '#EF4444' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  required
                  value={jobForm.experienceYears}
                  onChange={(e) => setJobForm({ ...jobForm, experienceYears: e.target.value })}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Education Qualification
                </Typography>
                <Autocomplete
                  freeSolo
                  fullWidth
                  options={EDUCATION_DEGREES}
                  value={jobForm.educationQualification}
                  onChange={(_, newValue) => setJobForm({ ...jobForm, educationQualification: newValue || '' })}
                  onInputChange={(_, newInputValue) => setJobForm({ ...jobForm, educationQualification: newInputValue })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                    />
                  )}
                />
              </Box>
            </Stack>

            {/* Number of Openings */}
            <Box sx={{ maxWidth: { sm: 260 } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                Number of Openings
              </Typography>
              <TextField
                fullWidth
                type="number"
                value={jobForm.openingsCount}
                onChange={(e) => setJobForm({ ...jobForm, openingsCount: e.target.value })}
                size="small"
              />
            </Box>

            {/* Interview Process & Timing Details */}
            <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon sx={{ fontSize: 18, color: '#0088ff' }} /> Interview Process & Timing Details
                </Typography>
                {jobForm.interviewTiming && (
                  <Chip
                    label={jobForm.interviewTiming}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600, fontSize: '11px' }}
                  />
                )}
              </Stack>

              <Stack spacing={2.5}>
                {/* Interview Mode Selector */}
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                    Interview Mode
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    displayEmpty
                    value={jobForm.interviewMode}
                    onChange={(e) => setJobForm({ ...jobForm, interviewMode: e.target.value })}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    <MenuItem value="Online">Online (Google Meet / Zoom / MS Teams / Video Call)</MenuItem>
                    <MenuItem value="Offline / In-person">Offline / In-person (Office / Venue Visit)</MenuItem>
                  </Select>
                </Box>

                {/* Timing Pickers: MUI Date range & Time picker */}
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Box sx={{ pt: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, display: 'block' }}>
                      Interview Timing & Availability (Date Range & Time Range):
                    </Typography>
                    <Stack spacing={2}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                            Interview Start Date
                          </Typography>
                          <DatePicker
                            format="DD/MM/YYYY"
                            value={jobForm.interviewStartDate ? dayjs(jobForm.interviewStartDate) : null}
                            onChange={(newValue) => {
                              const sDate = newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '';
                              const timing = computeTimingSummary(sDate, jobForm.interviewEndDate, jobForm.interviewStartTime, jobForm.interviewEndTime);
                              setJobForm({ ...jobForm, interviewStartDate: sDate, interviewTiming: timing });
                            }}
                            slotProps={{ textField: { size: 'small', fullWidth: true } }}
                          />
                        </Box>

                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                            Interview End Date
                          </Typography>
                          <DatePicker
                            format="DD/MM/YYYY"
                            value={jobForm.interviewEndDate ? dayjs(jobForm.interviewEndDate) : null}
                            onChange={(newValue) => {
                              const eDate = newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '';
                              const timing = computeTimingSummary(jobForm.interviewStartDate, eDate, jobForm.interviewStartTime, jobForm.interviewEndTime);
                              setJobForm({ ...jobForm, interviewEndDate: eDate, interviewTiming: timing });
                            }}
                            slotProps={{ textField: { size: 'small', fullWidth: true } }}
                          />
                        </Box>
                      </Stack>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                            Daily Start Time
                          </Typography>
                          <TimePicker
                            value={jobForm.interviewStartTime ? dayjs(`2000-01-01T${jobForm.interviewStartTime}`) : null}
                            onChange={(newValue) => {
                              const sTime = newValue && newValue.isValid() ? newValue.format('HH:mm') : '';
                              const timing = computeTimingSummary(jobForm.interviewStartDate, jobForm.interviewEndDate, sTime, jobForm.interviewEndTime);
                              setJobForm({ ...jobForm, interviewStartTime: sTime, interviewTiming: timing });
                            }}
                            slotProps={{ textField: { size: 'small', fullWidth: true } }}
                          />
                        </Box>

                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                            Daily End Time
                          </Typography>
                          <TimePicker
                            value={jobForm.interviewEndTime ? dayjs(`2000-01-01T${jobForm.interviewEndTime}`) : null}
                            onChange={(newValue) => {
                              const eTime = newValue && newValue.isValid() ? newValue.format('HH:mm') : '';
                              const timing = computeTimingSummary(jobForm.interviewStartDate, jobForm.interviewEndDate, jobForm.interviewStartTime, eTime);
                              setJobForm({ ...jobForm, interviewEndTime: eTime, interviewTiming: timing });
                            }}
                            slotProps={{ textField: { size: 'small', fullWidth: true } }}
                          />
                        </Box>
                      </Stack>
                    </Stack>
                  </Box>
                </LocalizationProvider>

                {/* Mode-Specific Fields: Online */}
                {jobForm.interviewMode === 'Online' && (
                  <Stack spacing={2} sx={{ pt: 1 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                        Meeting Link (Google Meet / Zoom / MS Teams) <span style={{ color: '#EF4444' }}>*</span>
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        value={jobForm.meetingLink || ''}
                        onChange={(e) => setJobForm({ ...jobForm, meetingLink: e.target.value })}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <LinkIcon sx={{ fontSize: 18, color: '#0088ff' }} />
                              </InputAdornment>
                            ),
                            endAdornment: jobForm.meetingLink ? (
                              <InputAdornment position="end">
                                <Button
                                  size="small"
                                  href={jobForm.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ textTransform: 'none', fontSize: '11px', py: 0.25 }}
                                >
                                  Test Link
                                </Button>
                              </InputAdornment>
                            ) : null
                          }
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                        Online Interview Instructions
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        value={jobForm.interviewLocation || ''}
                        onChange={(e) => setJobForm({ ...jobForm, interviewLocation: e.target.value })}
                      />
                    </Box>
                  </Stack>
                )}

                {/* Mode-Specific Fields: Offline / In-person */}
                {jobForm.interviewMode === 'Offline / In-person' && (
                  <Stack spacing={2} sx={{ pt: 1 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                        Google Maps Location Link <span style={{ color: '#EF4444' }}>*</span>
                      </Typography>
                      {(() => {
                        const val = jobForm.googleMapLink || '';
                        const isValidMapsUrl = (url) => {
                          if (!url.trim()) return null;
                          return /^https?:\/\/(maps\.google\.|google\.[a-z.]+\/maps|goo\.gl\/maps|maps\.app\.goo\.gl)/i.test(url.trim());
                        };
                        const valid = isValidMapsUrl(val);
                        const borderColor = valid === null ? '#E2E8F0' : valid ? '#16A34A' : '#DC2626';
                        const bgColor = valid === null ? '#F8FAFC' : valid ? '#F0FDF4' : '#FEF2F2';
                        return (
                          <>
                            <TextField
                              fullWidth
                              size="small"
                              value={val}
                              onChange={(e) => setJobForm({ ...jobForm, googleMapLink: e.target.value })}
                              error={valid === false}
                              slotProps={{
                                input: {
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <MapIcon sx={{ fontSize: 18, color: valid === false ? '#DC2626' : valid ? '#16A34A' : '#EA4335' }} />
                                    </InputAdornment>
                                  ),
                                  endAdornment: val ? (
                                    <InputAdornment position="end">
                                      <Button
                                        size="small"
                                        href={valid ? val : undefined}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        disabled={!valid}
                                        sx={{ textTransform: 'none', fontSize: '11px', py: 0.25 }}
                                      >
                                        Open Map
                                      </Button>
                                    </InputAdornment>
                                  ) : null
                                }
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '10px',
                                  bgcolor: bgColor,
                                  '& fieldset': { borderColor },
                                  '&:hover fieldset': { borderColor },
                                  '&.Mui-focused fieldset': { borderColor }
                                }
                              }}
                            />
                            {valid === false && (
                              <Typography variant="caption" sx={{ color: '#DC2626', mt: 0.5, display: 'block', fontWeight: 500 }}>
                                Please paste a valid Google Maps link (e.g. maps.google.com/... or goo.gl/maps/...)
                              </Typography>
                            )}
                          </>
                        );
                      })()}
                    </Box>

                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, mt: 0.5 }}>
                      Physical Venue & Address Details:
                    </Typography>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                          Building / Venue / Company Name
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={jobForm.offlineAddress?.venueName || ''}
                          onChange={(e) => setJobForm({
                            ...jobForm,
                            offlineAddress: { ...jobForm.offlineAddress, venueName: e.target.value }
                          })}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                          Street / Floor / Room No
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={jobForm.offlineAddress?.street || ''}
                          onChange={(e) => setJobForm({
                            ...jobForm,
                            offlineAddress: { ...jobForm.offlineAddress, street: e.target.value }
                          })}
                        />
                      </Box>
                    </Stack>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                          City
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={jobForm.offlineAddress?.city || ''}
                          onChange={(e) => setJobForm({
                            ...jobForm,
                            offlineAddress: { ...jobForm.offlineAddress, city: e.target.value }
                          })}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                          State
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={jobForm.offlineAddress?.state || ''}
                          onChange={(e) => setJobForm({
                            ...jobForm,
                            offlineAddress: { ...jobForm.offlineAddress, state: e.target.value }
                          })}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                          PIN Code
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={jobForm.offlineAddress?.pincode || ''}
                          onChange={(e) => setJobForm({
                            ...jobForm,
                            offlineAddress: { ...jobForm.offlineAddress, pincode: e.target.value }
                          })}
                        />
                      </Box>
                    </Stack>

                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                        Landmark
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        value={jobForm.offlineAddress?.landmark || ''}
                        onChange={(e) => setJobForm({
                          ...jobForm,
                          offlineAddress: { ...jobForm.offlineAddress, landmark: e.target.value }
                        })}
                      />
                    </Box>
                  </Stack>
                )}
              </Stack>
            </Box>

            {/* Application Documents Required (Multi-Select) */}
            <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 1.5 }}>
                Application Documents Required
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={jobForm.resumeRequired}
                    onChange={(e) => setJobForm({ ...jobForm, resumeRequired: e.target.checked })}
                    color="primary"
                  />
                }
                label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Require Resume / CV upload upon application</Typography>}
              />
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Documents to Carry / Submit (Multi-select)
                </Typography>
                <Autocomplete
                  multiple
                  freeSolo
                  options={REQUIRED_DOCUMENTS_OPTIONS}
                  value={Array.isArray(jobForm.documentsRequired) ? jobForm.documentsRequired : []}
                  onChange={(_, newValue) => setJobForm({ ...jobForm, documentsRequired: newValue })}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option}
                        label={option}
                        size="small"
                        sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, fontSize: '11px', m: 0.25 }}
                      />
                    ))
                  }
                  renderOption={(props, option, { selected }) => {
                    const { key, ...optionProps } = props;
                    return (
                      <li key={key} {...optionProps}>
                        <Checkbox size="small" checked={selected} sx={{ mr: 1, p: 0.5 }} />
                        <Typography variant="body2" sx={{ fontSize: '13px' }}>{option}</Typography>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                    />
                  )}
                />
              </Box>
            </Box>

            {/* Role Description */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                Job Description & Responsibilities
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                size="small"
                value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
              />
            </Box>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={savingJob} sx={{ textTransform: 'none', color: '#64748B' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSaveJob}
          disabled={savingJob || !jobForm.jobRole?.trim() || !jobForm.location?.trim()}
          startIcon={savingJob ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ borderRadius: '8px', px: 3, textTransform: 'none', fontWeight: 700, bgcolor: '#0088ff' }}
        >
          {savingJob ? 'Posting...' : editingJob ? 'Save Changes' : 'Publish Job Opening'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
