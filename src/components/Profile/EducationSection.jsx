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
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { School as EducationIcon } from '@mui/icons-material';
import { months } from './profileHelpers';

export default function EducationSection({
  education,
  handleEducationChange,
  canEdit,
  isStudent
}) {
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
        <EducationIcon sx={{ color: '#6366F1', fontSize: 20 }} /> Education History
      </Typography>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            College Name
          </Typography>
          <TextField
            fullWidth
            size="small"
            disabled={!canEdit}
            value={education.college || ''}
            onChange={(e) => handleEducationChange('college', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            Course/Major
          </Typography>
          <TextField
            fullWidth
            size="small"
            disabled={!canEdit}
            value={education.course || ''}
            onChange={(e) => handleEducationChange('course', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            Start Month
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={education.startMonth || ''}
              disabled={!canEdit}
              onChange={(e) => handleEducationChange('startMonth', e.target.value)}
              MenuProps={{ disableScrollLock: true }}
            >
              {months.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            Start Year
          </Typography>
          <DatePicker
            views={['year']}
            openTo="year"
            disabled={!canEdit}
            value={education.startYear ? dayjs().year(Number(education.startYear)) : null}
            onChange={(newValue) => {
              const yr = newValue && newValue.isValid() ? newValue.year() : '';
              handleEducationChange('startYear', yr);
            }}
            slotProps={{
              textField: {
                fullWidth: true,
                size: 'small',
                disabled: !canEdit,
                placeholder: 'YYYY'
              },
              dialog: {
                disableScrollLock: true
              }
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            End Month
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={education.endMonth || ''}
              disabled={!canEdit}
              onChange={(e) => handleEducationChange('endMonth', e.target.value)}
              MenuProps={{ disableScrollLock: true }}
            >
              {months.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            Graduation Year
          </Typography>
          <DatePicker
            views={['year']}
            openTo="year"
            disabled={!canEdit}
            value={education.endYear ? dayjs().year(Number(education.endYear)) : null}
            onChange={(newValue) => {
              const yr = newValue && newValue.isValid() ? newValue.year() : '';
              handleEducationChange('endYear', yr);
            }}
            slotProps={{
              textField: {
                fullWidth: true,
                size: 'small',
                disabled: !canEdit,
                placeholder: 'YYYY'
              },
              dialog: {
                disableScrollLock: true
              }
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
