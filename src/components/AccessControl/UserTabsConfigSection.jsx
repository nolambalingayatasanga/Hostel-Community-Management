import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { People as PeopleIcon, CheckRounded as CheckIcon } from '@mui/icons-material';
import { ACCESS_COLORS } from '../../pages/access/data/accessControlData';

export default function UserTabsConfigSection({
  loadingUserTabs,
  userTabs,
  onGetTabPermission,
  onToggleTabPermission
}) {
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
            fontSize: { xs: '14px', sm: '15px' },
            letterSpacing: '-0.01em'
          }}
        >
          <PeopleIcon sx={{ color: ACCESS_COLORS.primaryAlt, fontSize: { xs: 18, sm: 20 } }} />
          Users Role Access Configuration
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: ACCESS_COLORS.muted,
            mt: 0.4,
            display: 'block',
            fontSize: { xs: '11px', sm: '12px' }
          }}
        >
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
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)'
            },
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
                  p: { xs: 1.25, sm: 1.5 },
                  borderRadius: '10px',
                  border: isChecked ? '2px solid #10B981' : `1.5px solid ${ACCESS_COLORS.border}`,
                  backgroundColor: isChecked ? '#F0FDF4' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: '#10B981',
                    backgroundColor: '#F0FDF4'
                  }
                }}
              >
                <Box sx={{ minWidth: 0, pr: 1 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      color: isChecked ? '#065F46' : ACCESS_COLORS.primary,
                      fontSize: { xs: '12.5px', sm: '13.5px' },
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {tab.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '11px',
                      color: isChecked ? '#047857' : ACCESS_COLORS.muted,
                      fontWeight: 500
                    }}
                  >
                    {isChecked ? 'Visible' : 'Hidden'}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isChecked ? '#10B981' : '#F1F5F9',
                    color: '#FFFFFF',
                    flexShrink: 0
                  }}
                >
                  {isChecked && <CheckIcon sx={{ fontSize: 16 }} />}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
