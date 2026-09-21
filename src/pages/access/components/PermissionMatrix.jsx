import React from 'react';
import {
  Card,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography
} from '@mui/material';
import { TuneRounded as TuneIcon, BlockRounded as BlockIcon, VisibilityOutlined as ViewIcon, EditRounded as EditIcon, CheckRounded as CheckIcon } from '@mui/icons-material';
import { ACCESS_COLORS } from '../data/accessControlData';

const PermissionMatrix = ({
  pageDefinitions,
  roleDefinitions,
  matrix,
  selectedPage,
  selectedRole,
  onSelectCell
}) => {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: '14px',
        border: `1px solid ${ACCESS_COLORS.border}`,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        boxShadow: 'none'
      }}
    >
      <Box sx={{ px: { xs: 2, sm: 2.5 }, pt: 2, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TuneIcon sx={{ color: ACCESS_COLORS.primaryAlt, fontSize: 20 }} />
          <Box component="span" sx={{ ml: 1, fontWeight: 800, color: ACCESS_COLORS.primary }}>
            Permission Matrix Overview
          </Box>
        </Box>
        <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '11px', display: { xs: 'block', sm: 'none' }, fontWeight: 500 }}>
          Swipe horizontally to view all roles →
        </Typography>
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          backgroundColor: '#FFFFFF',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          '& .MuiTable-root': { minWidth: 780 }
        }}
      >
        <Table size="small" sx={{ minWidth: 860 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
              <TableCell sx={{ fontWeight: 700, color: '#334155', fontSize: '13px', py: 1.55, px: 2.2, minWidth: 170, borderBottom: `1px solid ${ACCESS_COLORS.border}` }}>
                Page
              </TableCell>
              {roleDefinitions.map((r) => (
                <TableCell
                  key={r.id}
                  align="center"
                  sx={{
                    fontWeight: 700,
                    color: selectedRole === r.id ? '#1877F2' : '#334155',
                    fontSize: '13px',
                    py: 1.55,
                    minWidth: 140,
                    borderBottom: `1px solid ${ACCESS_COLORS.border}`
                  }}
                >
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6 }}>
                    {React.cloneElement(r.icon, {
                      sx: { fontSize: 16, color: selectedRole === r.id ? '#1877F2' : '#64748B' }
                    })}
                    {r.label}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {pageDefinitions.map((p) => {
              const isRowActive = selectedPage === p.id;
              return (
                <TableRow
                  key={p.id}
                  hover
                  sx={{
                    backgroundColor: isRowActive ? 'rgba(24, 119, 242, 0.04)' : 'transparent',
                    transition: 'background-color 0.12s ease'
                  }}
                >
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: isRowActive ? '#1877F2' : '#1E293B',
                      fontSize: '13px',
                      py: 1.35,
                      px: 2.2,
                      borderBottom: `1px solid ${ACCESS_COLORS.border}`
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                      {React.cloneElement(p.icon, {
                        sx: { fontSize: 18, color: isRowActive ? '#1877F2' : '#64748B' }
                      })}
                      {p.label}
                    </Box>
                  </TableCell>

                  {roleDefinitions.map((r) => {
                    const perms = matrix[p.id]?.[r.id] || {};
                    const isCellActive = selectedPage === p.id && selectedRole === r.id;
                    let chipProps;

                    if (perms.noAccess) {
                      chipProps = {
                        icon: <BlockIcon sx={{ fontSize: '13px !important', color: '#DC2626 !important' }} />,
                        label: 'No Access',
                        sx: {
                          backgroundColor: '#FEE2E2',
                          color: '#DC2626',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          height: 24,
                          borderRadius: '999px',
                          px: 0.5,
                          '& .MuiChip-label': { px: 1 }
                        }
                      };
                    } else if (perms.fullAccess) {
                      chipProps = {
                        icon: <CheckIcon sx={{ fontSize: '14px !important', color: '#16A34A !important', fontWeight: 800 }} />,
                        label: 'Full Access',
                        sx: {
                          backgroundColor: '#DCFCE7',
                          color: '#15803D',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          height: 24,
                          borderRadius: '999px',
                          px: 0.5,
                          '& .MuiChip-label': { px: 1 }
                        }
                      };
                    } else if (perms.view && perms.update && !perms.create && !perms.delete) {
                      chipProps = {
                        icon: <EditIcon sx={{ fontSize: '13px !important', color: '#D97706 !important' }} />,
                        label: 'View, Update',
                        sx: {
                          backgroundColor: '#FEF3C7',
                          color: '#D97706',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          height: 24,
                          borderRadius: '999px',
                          px: 0.5,
                          '& .MuiChip-label': { px: 1 }
                        }
                      };
                    } else if (perms.view && !perms.create && !perms.update && !perms.delete) {
                      chipProps = {
                        icon: <ViewIcon sx={{ fontSize: '13px !important', color: '#0284C7 !important' }} />,
                        label: 'View',
                        sx: {
                          backgroundColor: '#E0F2FE',
                          color: '#0284C7',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          height: 24,
                          borderRadius: '999px',
                          px: 0.5,
                          '& .MuiChip-label': { px: 1 }
                        }
                      };
                    } else if (p.id === 'gallery' && perms.view && perms.create && perms.delete && !perms.update && r.id !== 'ADMIN' && r.id !== 'WARDEN') {
                      chipProps = {
                        icon: <ViewIcon sx={{ fontSize: '13px !important', color: '#7C3AED !important' }} />,
                        label: 'Upload, Delete Own',
                        sx: {
                          backgroundColor: '#F5F3FF',
                          color: '#7C3AED',
                          border: '1px solid #DDD6FE',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          height: 24,
                          borderRadius: '999px',
                          px: 0.5,
                          '& .MuiChip-label': { px: 1 }
                        }
                      };
                    } else {
                      const activeList = [];
                      if (perms.view) activeList.push('View');
                      if (perms.create) activeList.push(p.id === 'gallery' ? 'Upload' : 'Create');
                      if (perms.update) activeList.push('Update');
                      if (perms.delete) activeList.push(p.id === 'gallery' && r.id !== 'ADMIN' && r.id !== 'WARDEN' ? 'Delete Own' : 'Delete');
                      chipProps = {
                        label: activeList.length ? activeList.join(', ') : 'No Access',
                        sx: {
                          backgroundColor: '#EFF6FF',
                          color: '#1D4ED8',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          height: 24,
                          borderRadius: '999px',
                          px: 0.5,
                          '& .MuiChip-label': { px: 1 }
                        }
                      };
                    }

                    return (
                      <TableCell
                        key={r.id}
                        align="center"
                        onClick={() => onSelectCell(p.id, r.id)}
                        sx={{
                          cursor: 'pointer',
                          py: 1.35,
                          borderBottom: `1px solid ${ACCESS_COLORS.border}`,
                          outline: isCellActive ? '2px solid #1877F2' : 'none',
                          outlineOffset: '-2px',
                          backgroundColor: isCellActive ? 'rgba(24, 119, 242, 0.05)' : 'transparent',
                          transition: 'all 0.12s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(24, 119, 242, 0.08)',
                            boxShadow: 'inset 0 0 0 1px rgba(24, 119, 242, 0.2)'
                          }
                        }}
                      >
                        <Chip {...chipProps} size="small" />
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default PermissionMatrix;
