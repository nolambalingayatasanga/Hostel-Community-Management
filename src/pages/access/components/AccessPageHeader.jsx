import React from 'react';
import { Box, Typography, Chip, Avatar, Stack } from '@mui/material';
import { Security as SecurityIcon, GridViewRounded as GridViewIcon } from '@mui/icons-material';
import { ACCESS_COLORS } from '../data/accessControlData';

const AccessPageHeader = ({ pageCount, roleCount }) => {
  return (
    <Box sx={{ mb: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: ACCESS_COLORS.primary, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Access Control
          </Typography>

        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Chip
            icon={
              <Avatar sx={{ width: 18, height: 18, bgcolor: ACCESS_COLORS.primaryAlt }}>
                <GridViewIcon sx={{ color: '#fff', fontSize: 14 }} />
              </Avatar>
            }
            label={`${pageCount} Pages`}
            size="small"
            sx={{
              border: `1px solid ${ACCESS_COLORS.border}`,
              bgcolor: ACCESS_COLORS.surface,
              fontWeight: 600,
              color: ACCESS_COLORS.primary
            }}
          />
          <Chip
            icon={
              <Avatar sx={{ width: 18, height: 18, bgcolor: ACCESS_COLORS.primary }}>
                <SecurityIcon sx={{ color: '#fff', fontSize: 14 }} />
              </Avatar>
            }
            label={`${roleCount} Roles`}
            size="small"
            sx={{
              border: `1px solid ${ACCESS_COLORS.border}`,
              bgcolor: ACCESS_COLORS.surface,
              fontWeight: 600,
              color: ACCESS_COLORS.primary
            }}
          />
        </Stack>
      </Box>
    </Box>
  );
};

export default AccessPageHeader;
