import React from 'react';
import { Box, Card, Typography, Tabs, Tab } from '@mui/material';
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
        p: { xs: 1.5, sm: 2.5, md: 3 },
        mb: { xs: 2, sm: 3 },
        boxShadow: 'none',
        maxWidth: '100%',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ mb: 2 }}>
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

      <Box sx={{ display: 'grid', gap: { xs: 2, sm: 2.5 }, minWidth: 0, width: '100%', maxWidth: '100%' }}>
        {/* Page Selector */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            gap: { xs: 1.25, md: 2 },
            borderRadius: '10px',
            backgroundColor: ACCESS_COLORS.background,
            border: `1px solid ${ACCESS_COLORS.border}`,
            p: { xs: 1.5, sm: 1.75 },
            minWidth: 0,
            maxWidth: '100%',
            width: '100%',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: { md: 65 }, flexShrink: 0, pl: { xs: 0.5, md: 1 } }}>
            <Typography sx={{ fontWeight: 700, color: ACCESS_COLORS.muted, fontSize: { xs: '12px', sm: '13px' }, textTransform: { xs: 'uppercase', md: 'none' }, letterSpacing: { xs: '0.5px', md: 'normal' } }}>
              Page
            </Typography>
            <Typography sx={{ fontWeight: 600, color: ACCESS_COLORS.primaryAlt, fontSize: '11.5px', display: { xs: 'block', md: 'none' } }}>
              {pageDefinitions.find((p) => p.id === selectedPage)?.label}
            </Typography>
          </Box>

          <Box sx={{ minWidth: 0, width: '100%', maxWidth: '100%', overflow: 'hidden', flexGrow: 1 }}>
            <Tabs
              value={pageDefinitions.some((p) => p.id === selectedPage) ? selectedPage : false}
              onChange={(_, val) => {
                if (val) onSelectPage(val);
              }}
              variant="scrollable"
              scrollButtons={false}
              sx={{
                minHeight: 40,
                maxWidth: '100%',
                width: '100%',
                '& .MuiTabs-indicator': { display: 'none' },
                '& .MuiTabs-flexContainer': {
                  gap: { xs: '12px !important', sm: '14px !important' },
                  px: 0.5,
                  py: 0.5
                },
                '& .MuiTab-root': {
                  mr: { xs: '12px !important', sm: '14px !important' },
                  '&:last-of-type': {
                    mr: '0 !important'
                  }
                },
                '& .MuiTabs-scroller': {
                  overflowX: 'auto !important',
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-x pan-y',
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': { display: 'none' }
                },
                '& .MuiTabScrollButton-root': {
                  display: 'none !important'
                }
              }}
            >
              {pageDefinitions.map((p) => {
                const isActive = selectedPage === p.id;
                return (
                  <Tab
                    key={p.id}
                    value={p.id}
                    label={p.label}
                    icon={
                      React.isValidElement(p.icon)
                        ? React.cloneElement(p.icon, {
                            sx: {
                              fontSize: 16,
                              color: isActive ? '#FFFFFF' : ACCESS_COLORS.muted,
                              transition: 'color 0.15s ease'
                            }
                          })
                        : null
                    }
                    iconPosition="start"
                    disableRipple
                    sx={{
                      minHeight: 36,
                      height: 36,
                      minWidth: 'auto',
                      maxWidth: 'none',
                      textTransform: 'none',
                      borderRadius: '8px',
                      px: { xs: 1.6, sm: 2 },
                      py: 0.6,
                      mr: { xs: '12px !important', sm: '14px !important' },
                      '&:last-of-type': {
                        mr: '0 !important'
                      },
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                      fontWeight: isActive ? 700 : 600,
                      fontSize: { xs: '12.5px', sm: '13px' },
                      opacity: 1,
                      touchAction: 'pan-x pan-y',
                      border: `1px solid ${isActive ? ACCESS_COLORS.primaryAlt : ACCESS_COLORS.border}`,
                      color: isActive ? '#FFFFFF !important' : `${ACCESS_COLORS.primary} !important`,
                      backgroundColor: isActive ? ACCESS_COLORS.primaryAlt : ACCESS_COLORS.surface,
                      transition: 'all 0.18s ease',
                      '&:hover': {
                        backgroundColor: isActive ? '#0D65D9' : '#EEF2FF',
                        borderColor: isActive ? '#0D65D9' : '#CBD5E1'
                      }
                    }}
                  />
                );
              })}
            </Tabs>
          </Box>
        </Box>

        {/* Role Selector */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            gap: { xs: 1.25, md: 2 },
            borderRadius: '10px',
            backgroundColor: ACCESS_COLORS.background,
            border: `1px solid ${ACCESS_COLORS.border}`,
            p: { xs: 1.5, sm: 1.75 },
            minWidth: 0,
            maxWidth: '100%',
            width: '100%',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: { md: 65 }, flexShrink: 0, pl: { xs: 0.5, md: 1 } }}>
            <Typography sx={{ fontWeight: 700, color: '#475569', fontSize: { xs: '12px', sm: '13px' }, textTransform: { xs: 'uppercase', md: 'none' }, letterSpacing: { xs: '0.5px', md: 'normal' } }}>
              Role
            </Typography>
            <Typography sx={{ fontWeight: 600, color: ACCESS_COLORS.primary, fontSize: '11.5px', display: { xs: 'block', md: 'none' } }}>
              {roleDefinitions.find((r) => r.id === selectedRole)?.label}
            </Typography>
          </Box>

          <Box sx={{ minWidth: 0, width: '100%', maxWidth: '100%', overflow: 'hidden', flexGrow: 1 }}>
            <Tabs
              value={roleDefinitions.some((r) => r.id === selectedRole) ? selectedRole : false}
              onChange={(_, val) => {
                if (val) onSelectRole(val);
              }}
              variant="scrollable"
              scrollButtons={false}
              sx={{
                minHeight: 40,
                maxWidth: '100%',
                width: '100%',
                '& .MuiTabs-indicator': { display: 'none' },
                '& .MuiTabs-flexContainer': {
                  gap: { xs: '12px !important', sm: '14px !important' },
                  px: 0.5,
                  py: 0.5
                },
                '& .MuiTab-root': {
                  mr: { xs: '12px !important', sm: '14px !important' },
                  '&:last-of-type': {
                    mr: '0 !important'
                  }
                },
                '& .MuiTabs-scroller': {
                  overflowX: 'auto !important',
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-x pan-y',
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': { display: 'none' }
                },
                '& .MuiTabScrollButton-root': {
                  display: 'none !important'
                }
              }}
            >
              {roleDefinitions.map((r) => {
                const isActive = selectedRole === r.id;
                return (
                  <Tab
                    key={r.id}
                    value={r.id}
                    label={r.label}
                    icon={
                      React.isValidElement(r.icon)
                        ? React.cloneElement(r.icon, {
                            sx: {
                              fontSize: 15,
                              color: isActive ? '#FFFFFF' : ACCESS_COLORS.muted,
                              transition: 'color 0.15s ease'
                            }
                          })
                        : null
                    }
                    iconPosition="start"
                    disableRipple
                    sx={{
                      minHeight: 36,
                      height: 36,
                      minWidth: 'auto',
                      maxWidth: 'none',
                      textTransform: 'none',
                      borderRadius: '8px',
                      px: { xs: 1.6, sm: 2.2 },
                      py: 0.6,
                      mr: { xs: '12px !important', sm: '14px !important' },
                      '&:last-of-type': {
                        mr: '0 !important'
                      },
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                      fontWeight: isActive ? 700 : 600,
                      fontSize: { xs: '12.5px', sm: '13px' },
                      opacity: 1,
                      touchAction: 'pan-x pan-y',
                      backgroundColor: isActive ? ACCESS_COLORS.primary : ACCESS_COLORS.surface,
                      color: isActive ? '#FFFFFF !important' : '#475569 !important',
                      border: `1px solid ${isActive ? ACCESS_COLORS.primary : ACCESS_COLORS.border}`,
                      boxShadow: 'none',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: isActive ? '#0B1220' : '#EEF2FF',
                        borderColor: ACCESS_COLORS.primary
                      }
                    }}
                  />
                );
              })}
            </Tabs>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default AccessConfigurationSelector;
