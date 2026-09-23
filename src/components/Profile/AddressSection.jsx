import React from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField
} from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

export default function AddressSection({
  address,
  handleAddressChange,
  canEdit
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
        <HomeIcon sx={{ color: '#3b82f6', fontSize: 20 }} /> Address Configuration
      </Typography>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            Street
          </Typography>
          <TextField
            fullWidth
            size="small"
            disabled={!canEdit}
            value={address.street || ''}
            onChange={(e) => handleAddressChange('street', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            Area
          </Typography>
          <TextField
            fullWidth
            size="small"
            disabled={!canEdit}
            value={address.area || ''}
            onChange={(e) => handleAddressChange('area', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            Landmark
          </Typography>
          <TextField
            fullWidth
            size="small"
            disabled={!canEdit}
            value={address.landmark || ''}
            onChange={(e) => handleAddressChange('landmark', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            Location / City / Landmark
          </Typography>
          <TextField
            fullWidth
            size="small"
            disabled={!canEdit}
            value={address.location || ''}
            onChange={(e) => handleAddressChange('location', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            City
          </Typography>
          <TextField
            fullWidth
            size="small"
            disabled={!canEdit}
            value={address.city || ''}
            onChange={(e) => handleAddressChange('city', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            District
          </Typography>
          <TextField
            fullWidth
            size="small"
            disabled={!canEdit}
            value={address.district || ''}
            onChange={(e) => handleAddressChange('district', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            Taluk
          </Typography>
          <TextField
            fullWidth
            size="small"
            disabled={!canEdit}
            value={address.taluk || ''}
            onChange={(e) => handleAddressChange('taluk', e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            Pincode
          </Typography>
          <TextField
            fullWidth
            size="small"
            disabled={!canEdit}
            value={address.pincode || ''}
            onChange={(e) => handleAddressChange('pincode', e.target.value)}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
