import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  Avatar,
  Button,
  Typography,
  TextField,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Business as BusinessIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { INDUSTRIES, INDIA_LOCATIONS } from '../../../constants/jobConstants';

export default function OrganizationDialog({
  open,
  onClose,
  organization,
  orgForm,
  setOrgForm,
  orgLogoFile,
  setOrgLogoFile,
  orgLogoPreview,
  setOrgLogoPreview,
  savingOrg,
  onSaveOrganization
}) {
  return (
    <Dialog
      open={open}
      onClose={() => !savingOrg && onClose()}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
    >
      <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <BusinessIcon sx={{ color: '#0088ff' }} />
          <span>{organization ? 'Edit Organization Profile' : 'Create Organization Profile'}</span>
        </Stack>
        <IconButton size="small" onClick={() => !savingOrg && onClose()}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box component="form" onSubmit={onSaveOrganization} sx={{ mt: 1 }}>
          <Stack spacing={2.5}>
            {/* Logo / Photo */}
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Avatar
                src={orgLogoPreview}
                sx={{ width: 64, height: 64, bgcolor: '#EFF6FF', color: '#0088ff', border: '1px solid #CBD5E1' }}
              >
                <BusinessIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  size="small"
                  sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
                >
                  Upload Company Logo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setOrgLogoFile(file);
                        setOrgLogoPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </Button>
              </Box>
            </Stack>

            {/* Row 1: Name & Industry */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Company / Organization Name <span style={{ color: '#EF4444' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  required
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Industry
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  displayEmpty
                  value={orgForm.industry}
                  onChange={(e) => setOrgForm({ ...orgForm, industry: e.target.value })}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {INDUSTRIES.map((ind) => (
                    <MenuItem key={ind} value={ind}>
                      {ind}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Stack>

            {/* Row 2: Head Office & Operating Locations */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Main Head Office Location <span style={{ color: '#EF4444' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  required
                  value={orgForm.headOfficeLocation}
                  onChange={(e) => setOrgForm({ ...orgForm, headOfficeLocation: e.target.value })}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Operating Locations List
                </Typography>
                <Autocomplete
                  multiple
                  freeSolo
                  options={INDIA_LOCATIONS}
                  value={Array.isArray(orgForm.operatingLocations) ? orgForm.operatingLocations : []}
                  onChange={(_, newValue) => setOrgForm({ ...orgForm, operatingLocations: newValue })}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          label={option}
                          size="small"
                          {...tagProps}
                          sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, fontSize: '11px' }}
                        />
                      );
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder={orgForm.operatingLocations?.length ? '' : 'Search or type a city...'}
                    />
                  )}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F8FAFC', fontSize: '13px' }
                  }}
                />
              </Box>
            </Stack>

            {/* Row 3: Established Year & Operating Years */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Established Year
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={orgForm.establishedYear}
                  onChange={(e) => {
                    const year = e.target.value;
                    const diff = year ? Math.max(0, new Date().getFullYear() - parseInt(year, 10)) : '';
                    setOrgForm({ ...orgForm, establishedYear: year, yearsOperating: diff });
                  }}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Number of Years Since Operating
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={orgForm.yearsOperating}
                  onChange={(e) => setOrgForm({ ...orgForm, yearsOperating: e.target.value })}
                />
              </Box>
            </Stack>

            {/* Row 4: Website, Email, Phone */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Website
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={orgForm.website}
                  onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Contact Email
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="email"
                  value={orgForm.contactEmail}
                  onChange={(e) => setOrgForm({ ...orgForm, contactEmail: e.target.value })}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                  Contact Phone
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={orgForm.contactPhone}
                  onChange={(e) => setOrgForm({ ...orgForm, contactPhone: e.target.value })}
                />
              </Box>
            </Stack>

            {/* About / Description */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                About the Organization / Overview
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                value={orgForm.description}
                onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
              />
            </Box>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={savingOrg} sx={{ textTransform: 'none', color: '#64748B' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSaveOrganization}
          disabled={savingOrg || !orgForm.name?.trim() || !orgForm.headOfficeLocation?.trim()}
          startIcon={savingOrg ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ borderRadius: '8px', px: 3, textTransform: 'none', fontWeight: 700, bgcolor: '#0088ff' }}
        >
          {savingOrg ? 'Saving...' : 'Save Organization Profile'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
