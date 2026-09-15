import React from 'react';
import { Box, Card, Typography, ToggleButton } from '@mui/material';
import { TuneRounded as TuneIcon } from '@mui/icons-material';
import { ACCESS_COLORS } from '../data/accessControlData';

const AccessConfigurationSelector = ({
  pageDefinitions,
  roleDefinitions,
  selectedPage,
  selectedRole,
  onSelectPage,
  onSelectRole
}) => {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: '14px',
        border: `1px solid ${ACCESS_COLORS.border}`,
        backgroundColor: '#FFFFFF',
        p: { xs: 2.5, md: 3 },
        mb: 3,
        boxShadow: 'none'
      }}
    >
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: '8px',
              backgroundColor: ACCESS_COLORS.background,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            color: ACCESS_COLORS.primaryAlt
            }}
          >
            <TuneIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: ACCESS_COLORS.primary, fontSize: '15.5px' }}>
            Access Configuration Selector
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, borderRadius: '8px', backgroundColor: ACCESS_COLORS.background, border: `1px solid ${ACCESS_COLORS.border}`, px: 1.5, py: 1.25 }}>
          <Typography sx={{ fontWeight: 700, color: ACCESS_COLORS.muted, fontSize: '13px', minWidth: { xs: 50, sm: 65 }, pl: 1 }}>
            Page
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, flexGrow: 1 }}>
            {pageDefinitions.map((p) => {
              const isActive = selectedPage === p.id;
              return (
                <ToggleButton
                  key={p.id}
                  value={p.id}
                  selected={isActive}
                  onClick={() => onSelectPage(p.id)}
                  startIcon={React.cloneElement(p.icon, {
                    sx: { fontSize: 18, color: isActive ? '#FFFFFF' : ACCESS_COLORS.muted }
                  })}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '8px',
                    px: 1.7,
                    py: 0.75,
                    fontWeight: isActive ? 700 : 600,
                    fontSize: '13px',
                    border: `1px solid ${isActive ? ACCESS_COLORS.primaryAlt : ACCESS_COLORS.border}`,
                    color: isActive ? '#FFFFFF' : ACCESS_COLORS.primary,
                    backgroundColor: isActive ? ACCESS_COLORS.primaryAlt : ACCESS_COLORS.surface,
                    transition: 'all 0.18s ease',
                    '&:hover': {
                      backgroundColor: isActive ? '#0D65D9' : '#EEF2FF',
                      borderColor: isActive ? '#0D65D9' : '#CBD5E1'
                    }
                  }}
                >
                  {p.label}
                </ToggleButton>
              );
            })}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, borderRadius: '8px', backgroundColor: ACCESS_COLORS.background, border: `1px solid ${ACCESS_COLORS.border}`, px: 1.5, py: 1.25 }}>
          <Typography sx={{ fontWeight: 700, color: '#475569', fontSize: '13px', minWidth: { xs: 50, sm: 65 }, pl: 1 }}>
            Role
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, flexGrow: 1 }}>
            {roleDefinitions.map((r) => {
              const isActive = selectedRole === r.id;
              return (
                <ToggleButton
                  key={r.id}
                  value={r.id}
                  selected={isActive}
                  onClick={() => onSelectRole(r.id)}
                  startIcon={React.cloneElement(r.icon, {
                    sx: { fontSize: 16, color: isActive ? '#FFFFFF' : ACCESS_COLORS.muted }
                  })}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '8px',
                    px: 2,
                    py: 0.75,
                    fontWeight: isActive ? 700 : 600,
                    fontSize: '13px',
                    backgroundColor: isActive ? ACCESS_COLORS.primary : ACCESS_COLORS.surface,
                    color: isActive ? '#FFFFFF' : '#475569',
                    border: `1px solid ${isActive ? ACCESS_COLORS.primary : ACCESS_COLORS.border}`,
                    boxShadow: 'none',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      backgroundColor: isActive ? '#0B1220' : '#EEF2FF',
                      borderColor: isActive ? ACCESS_COLORS.primary : '#CBD5E1'
                    }
                  }}
                >
                  {r.label}
                </ToggleButton>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default AccessConfigurationSelector;
