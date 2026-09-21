import React from 'react';
import {
  Card,
  Box,
  Chip,
  Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  PersonRounded as PersonIcon,
  CheckCircleRounded as CheckCircleIcon,
  CheckRounded as CheckIcon,
  BlockRounded as BlockIcon,
  RemoveRedEyeOutlined as FullAccessIcon,
  VisibilityOutlined as ViewIcon,
  AddRounded as CreateIcon,
  EditOutlined as UpdateIcon,
  DeleteOutlineRounded as DeleteIcon
} from '@mui/icons-material';
import { ACCESS_COLORS } from '../data/accessControlData';
import UserTabsConfigSection from './UserTabsConfigSection';

const PERMISSION_CARDS = [
  {
    key: 'fullAccess',
    title: 'Full Access',
    subtitle: 'Grant all permissions',
    icon: <FullAccessIcon sx={{ fontSize: 24 }} />,
    themeColor: '#1877F2',
    activeBg: '#EFF6FF',
    activeBorder: '#1877F2'
  },
  {
    key: 'view',
    title: 'View',
    subtitle: 'Read-only visibility',
    icon: <ViewIcon sx={{ fontSize: 24 }} />,
    themeColor: '#10B981',
    activeBg: '#F0FDF4',
    activeBorder: '#10B981'
  },
  {
    key: 'create',
    title: 'Create',
    subtitle: 'Add new entries',
    icon: <CreateIcon sx={{ fontSize: 24 }} />,
    themeColor: '#8B5CF6',
    activeBg: '#FAF5FF',
    activeBorder: '#8B5CF6'
  },
  {
    key: 'update',
    title: 'Update',
    subtitle: 'Edit / modify data',
    icon: <UpdateIcon sx={{ fontSize: 24 }} />,
    themeColor: '#F59E0B',
    activeBg: '#FFFBEB',
    activeBorder: '#F59E0B'
  },
  {
    key: 'delete',
    title: 'Delete',
    subtitle: 'Remove records',
    icon: <DeleteIcon sx={{ fontSize: 24 }} />,
    themeColor: '#EF4444',
    activeBg: '#FEF2F2',
    activeBorder: '#EF4444'
  },
  {
    key: 'noAccess',
    title: 'No Access',
    subtitle: 'Block page & tab',
    icon: <BlockIcon sx={{ fontSize: 24 }} />,
    themeColor: '#475569',
    activeBg: '#F8FAFC',
    activeBorder: '#64748B'
  }
];

const ActivePrivilegesCard = ({
  selectedPageData,
  selectedRoleData,
  currentPermissions,
  selectedPage,
  onPermissionChange,
  selectedRoleName,
  userTabsSectionProps
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
        boxShadow: 'none'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
          <Chip
            icon={React.cloneElement(selectedPageData?.icon || <DashboardIcon />, {
              sx: { fontSize: '15px !important', color: '#FFFFFF !important' }
            })}
            label={selectedPageData?.label || selectedPage}
            sx={{
              backgroundColor: ACCESS_COLORS.primaryAlt,
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '13px',
              borderRadius: '6px',
              height: 28
            }}
          />
          <Typography sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '14px' }}>→</Typography>
          <Chip
            icon={React.cloneElement(selectedRoleData?.icon || <PersonIcon />, {
              sx: { fontSize: '15px !important', color: '#FFFFFF !important' }
            })}
            label={selectedRoleName}
            sx={{
              backgroundColor: ACCESS_COLORS.primary,
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '13px',
              borderRadius: '6px',
              height: 28
            }}
          />
        </Box>

        {currentPermissions.noAccess ? (
          <Chip
            icon={<BlockIcon sx={{ fontSize: '16px !important', color: '#DC2626 !important' }} />}
            label="No Access"
            sx={{ backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5', fontWeight: 700, fontSize: '12.5px', borderRadius: '6px', height: 28 }}
          />
        ) : currentPermissions.fullAccess ? (
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: '16px !important', color: '#16A34A !important' }} />}
            label="Full Access Granted"
            sx={{ backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', fontWeight: 700, fontSize: '12.5px', borderRadius: '6px', height: 28 }}
          />
        ) : (
          <Chip
            label="Custom Access"
            sx={{ backgroundColor: '#E0F2FE', color: '#0284C7', border: '1px solid #BAE6FD', fontWeight: 700, fontSize: '12.5px', borderRadius: '6px', height: 28 }}
          />
        )}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            lg: 'repeat(6, 1fr)'
          },
          gap: { xs: 1.25, sm: 2 }
        }}
      >
        {PERMISSION_CARDS.map((item) => {
          const isActive = !!currentPermissions[item.key];
          return (
            <Box
              key={item.key}
              onClick={() => onPermissionChange(item.key, !currentPermissions[item.key])}
              sx={{
                p: { xs: 1.5, sm: 2.05 },
                borderRadius: '12px',
                border: isActive ? `2px solid ${item.activeBorder}` : `1.2px solid ${ACCESS_COLORS.border}`,
                backgroundColor: isActive ? item.activeBg : '#FFFFFF',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive ? `0 8px 22px ${item.themeColor}16` : '0 1px 3px rgba(15,23,42,0.08)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 16px ${item.themeColor}20`,
                  borderColor: item.themeColor
                }
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isActive ? item.themeColor : 'transparent',
                  border: isActive ? 'none' : '1.5px solid #CBD5E1',
                  color: '#FFFFFF'
                }}
              >
                {isActive && <CheckIcon sx={{ fontSize: 13, fontWeight: 800 }} />}
              </Box>

              <Box
                sx={{
                  width: { xs: 32, sm: 38 },
                  height: { xs: 32, sm: 38 },
                  borderRadius: '10px',
                  backgroundColor: `${item.themeColor}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: item.themeColor,
                  mb: 1.2
                }}
              >
                {React.cloneElement(item.icon, { sx: { fontSize: { xs: 20, sm: 24 } } })}
              </Box>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: { xs: '13.5px', sm: '15px' }, color: isActive ? item.themeColor : '#0F172A', mb: 0.3 }}>
                {(() => {
                  if (selectedPage === 'gallery') {
                    if (item.key === 'create') return 'Upload Media';
                    if (item.key === 'delete') {
                      return (selectedRoleName === 'ADMIN' || selectedRoleName === 'WARDEN')
                        ? 'Delete (All)'
                        : 'Delete (Own)';
                    }
                  }
                  return item.title;
                })()}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '12px', display: 'block' }}>
                {(() => {
                  if (selectedPage === 'gallery') {
                    if (item.key === 'create') return 'Upload photos & videos';
                    if (item.key === 'delete') {
                      return (selectedRoleName === 'ADMIN' || selectedRoleName === 'WARDEN')
                        ? 'Remove any media & folders'
                        : 'Delete own uploaded media';
                    }
                    if (item.key === 'update') {
                      return (selectedRoleName === 'ADMIN' || selectedRoleName === 'WARDEN')
                        ? 'Edit / rename folders & media'
                        : 'Edit own media details';
                    }
                  }
                  return item.subtitle;
                })()}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {selectedPage === 'gallery' && (
        <Box
          sx={{
            mt: 2.5,
            p: 2,
            borderRadius: '12px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5
          }}
        >
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '8px',
              backgroundColor: '#EFF6FF',
              color: '#1877F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <CreateIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '13px', mb: 0.3 }}>
              Gallery Media Access & Ownership Control
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '12.5px', lineHeight: 1.5 }}>
              Users with <strong>Create</strong> permission can upload photos and videos to existing gallery folders. Users with <strong>Delete (Own)</strong> can remove only the media assets they personally uploaded.
            </Typography>
          </Box>
        </Box>
      )}

      {selectedPage === 'users' && (
        <UserTabsConfigSection {...userTabsSectionProps} />
      )}
    </Card>
  );
};

export default ActivePrivilegesCard;
