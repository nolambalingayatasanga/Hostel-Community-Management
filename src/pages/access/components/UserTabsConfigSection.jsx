import React from 'react';
import { Box, Typography, Chip, CircularProgress, Avatar } from '@mui/material';
import { People as PeopleIcon } from '@mui/icons-material';
import { ACCESS_COLORS } from '../data/accessControlData';
import { CheckRounded as CheckIcon } from '@mui/icons-material';

const UserTabsConfigSection = ({
  loadingUserTabs,
  userTabs,
  onGetTabPermission,
  onToggleTabPermission
}) => {
  return (
    <Box
      sx={{
        mt: 3.5,
        pt: 3,
        borderTop: `1px solid ${ACCESS_COLORS.border}`
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            color: ACCESS_COLORS.primary,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontSize: '15px',
            letterSpacing: '-0.01em'
          }}
        >
          <PeopleIcon sx={{ color: ACCESS_COLORS.primaryAlt, fontSize: 20 }} />
          Users Role Access Configuration
        </Typography>
        <Typography variant="caption" sx={{ color: ACCESS_COLORS.muted, mt: 0.4, display: 'block' }}>
          Toggle visibility for each users section for the selected role.
        </Typography>
      </Box>

      {loadingUserTabs ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, py: 2 }}>
          <CircularProgress size={20} sx={{ color: '#10B981' }} />
          <Typography variant="caption" sx={{ color: ACCESS_COLORS.muted }}>
            Loading dynamic tabs from API...
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 1.5
          }}
        >
          {userTabs.map((tab) => {
            const isChecked = onGetTabPermission(tab.id, tab.slug || tab.name.toLowerCase());
            return (
              <Box
                key={tab.id}
                onClick={() => onToggleTabPermission(tab.id, !isChecked)}
                sx={{
                  p: 1.6,
                  borderRadius: '12px',
                  backgroundColor: isChecked ? '#F0FDF4' : '#FFFFFF',
                  border: isChecked ? '1.8px solid #10B981' : `1px solid ${ACCESS_COLORS.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  '&:hover': {
                    borderColor: isChecked ? '#10B981' : ACCESS_COLORS.primaryAlt,
                    transform: 'translateY(-1px)',
                    boxShadow: isChecked ? '0 8px 18px rgba(16, 185, 129, 0.2)' : '0 6px 14px rgba(15,23,42,0.08)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: isChecked ? '#DCFCE7' : ACCESS_COLORS.background, color: isChecked ? '#16A34A' : ACCESS_COLORS.muted }}>
                      <PeopleIcon sx={{ fontSize: 14 }} />
                    </Avatar>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '13.8px' }}>
                      {tab.name}
                    </Typography>
                  </Box>
                  {tab.isSystem && (
                    <Chip
                      label="System"
                      size="small"
                      sx={{
                        fontSize: '0.64rem',
                        height: 18,
                        borderRadius: '999px',
                        backgroundColor: '#E2E8F0',
                        color: '#475569'
                      }}
                    />
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1, borderTop: `1px dashed ${ACCESS_COLORS.border}` }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#16A34A', fontSize: '12.8px' }}>
                      View Access
                    </Typography>
                    <Typography variant="caption" sx={{ color: ACCESS_COLORS.muted, fontSize: '11.5px' }}>
                      Read-only visibility
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 21,
                      height: 21,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isChecked ? '#16A34A' : 'transparent',
                      border: isChecked ? 'none' : '1.5px solid #CBD5E1',
                      color: '#FFFFFF'
                    }}
                  >
                    {isChecked && <CheckIcon sx={{ fontSize: 13, fontWeight: 800 }} />}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default UserTabsConfigSection;
