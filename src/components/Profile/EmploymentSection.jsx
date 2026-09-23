import React from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import { Work as WorkIcon } from '@mui/icons-material';

export default function EmploymentSection({
  employment,
  handleEmploymentChange,
  canEdit,
  isAlumni,
  isStaffOrMemberOrWarden
}) {
  if (!isAlumni && !isStaffOrMemberOrWarden) return null;

  return (
    <Box>
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 700,
          color: '#1E293B',
          mb: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <WorkIcon sx={{ color: '#10b981', fontSize: 20 }} /> Employment & Career
      </Typography>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            Occupation / Job Title
          </Typography>
          <TextField
            fullWidth
            size="small"
            disabled={!canEdit}
            value={employment.occupation || ''}
            onChange={(e) => handleEmploymentChange('occupation', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            Organization / Company
          </Typography>
          <TextField
            fullWidth
            size="small"
            disabled={!canEdit}
            value={employment.organization || ''}
            onChange={(e) => handleEmploymentChange('organization', e.target.value)}
          />
        </Grid>

        {isAlumni && (
          <>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                Employment Status
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={employment.employmentStatus || 'Employed'}
                  disabled={!canEdit}
                  onChange={(e) => handleEmploymentChange('employmentStatus', e.target.value)}
                  MenuProps={{ disableScrollLock: true }}
                >
                  <MenuItem value="Student">Student</MenuItem>
                  <MenuItem value="Intern">Intern</MenuItem>
                  <MenuItem value="Employed">Employed</MenuItem>
                  <MenuItem value="Business Owner">Business Owner</MenuItem>
                  <MenuItem value="Entrepreneur">Entrepreneur</MenuItem>
                  <MenuItem value="Higher Studies">Higher Studies</MenuItem>
                  <MenuItem value="Government Service">Government Service</MenuItem>
                  <MenuItem value="Retired">Retired</MenuItem>
                  <MenuItem value="Unemployed">Unemployed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                Industry
              </Typography>
              <TextField
                fullWidth
                size="small"
                disabled={!canEdit}
                value={employment.industry || ''}
                onChange={(e) => handleEmploymentChange('industry', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                Work Location
              </Typography>
              <TextField
                fullWidth
                size="small"
                disabled={!canEdit}
                value={employment.workLocation || ''}
                onChange={(e) => handleEmploymentChange('workLocation', e.target.value)}
              />
            </Grid>

            {['Business Owner', 'Self-Employed', 'Entrepreneur'].includes(employment.employmentStatus) && (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                    Business Name
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    disabled={!canEdit}
                    value={employment.businessName || ''}
                    onChange={(e) => handleEmploymentChange('businessName', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                    Business Type
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    disabled={!canEdit}
                    value={employment.businessType || ''}
                    onChange={(e) => handleEmploymentChange('businessType', e.target.value)}
                  />
                </Grid>
              </>
            )}
          </>
        )}
      </Grid>
    </Box>
  );
}
