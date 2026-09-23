import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';

export default function StudentTransitionDialog({
  open,
  onClose,
  gradYear,
  setGradYear,
  transEmpStatus,
  setTransEmpStatus,
  transOccupation,
  setTransOccupation,
  transCompany,
  setTransCompany,
  transitionSubmitting,
  handleTransitionSubmit
}) {
  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} disableScrollLock>
      <DialogTitle sx={{ fontWeight: 'bold' }}>Transition to Alumni Profile</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Congratulations on completing your graduation! Transitioning your profile to Alumni will
          update your status and preserve your educational history while allowing you to maintain your
          career records.
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <DatePicker
              views={['year']}
              openTo="year"
              label="Graduation Year"
              value={gradYear ? dayjs().year(Number(gradYear)) : null}
              onChange={(newValue) => {
                const yr = newValue && newValue.isValid() ? newValue.year() : '';
                setGradYear(yr);
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  placeholder: 'YYYY'
                },
                dialog: {
                  disableScrollLock: true
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Employment</InputLabel>
              <Select
                value={transEmpStatus}
                label="Employment"
                onChange={(e) => setTransEmpStatus(e.target.value)}
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
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              label="Current Occupation / Job Title"
              value={transOccupation}
              onChange={(e) => setTransOccupation(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              label="Company / Organization"
              value={transCompany}
              onChange={(e) => setTransCompany(e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined" disabled={transitionSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleTransitionSubmit}
          variant="contained"
          color="secondary"
          disabled={transitionSubmitting}
          startIcon={transitionSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {transitionSubmitting ? 'Transitioning...' : 'Complete Transition'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
