import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Box,
  Card,
  Typography,
  Checkbox,
  FormControlLabel,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Stack
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Collections as GalleryIcon,
  AccountCircle as ProfileIcon,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  TuneRounded as TuneIcon,
  GridViewRounded as GridViewIcon,
  CheckCircleRounded as CheckCircleIcon,
  CheckRounded as CheckIcon,
  BlockRounded as BlockIcon,
  RemoveRedEyeOutlined as FullAccessIcon,
  VisibilityOutlined as ViewIcon,
  AddRounded as CreateIcon,
  EditOutlined as UpdateIcon,
  EditRounded as EditIcon,
  DeleteOutlineRounded as DeleteIcon,
  AssignmentIndRounded as PrivilegesIcon,
  PersonRounded as PersonIcon,
  SchoolRounded as SchoolIcon,
  GroupsRounded as GroupsIcon,
  RestartAltRounded as ResetIcon,
  LockRounded as LockIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import API from '../../api';

// Page definitions with icons (matching sidebar)
const PAGE_DEFINITIONS = [
  { id: 'overview', label: 'Overview', icon: <DashboardIcon sx={{ fontSize: 18 }} /> },
  { id: 'users', label: 'Users', icon: <GroupsIcon sx={{ fontSize: 18 }} /> },
  { id: 'events', label: 'Events', icon: <EventIcon sx={{ fontSize: 18 }} /> },
  { id: 'gallery', label: 'Gallery', icon: <GalleryIcon sx={{ fontSize: 18 }} /> },
  { id: 'profile', label: 'Profile', icon: <ProfileIcon sx={{ fontSize: 18 }} /> },
  { id: 'access_control', label: 'Access Control', icon: <AdminIcon sx={{ fontSize: 18 }} /> },
];

// User roles definition with icons
const ROLE_DEFINITIONS = [
  { id: 'ADMIN', label: 'ADMIN', icon: <AdminIcon sx={{ fontSize: 16 }} /> },
  { id: 'WARDEN', label: 'WARDEN', icon: <SecurityIcon sx={{ fontSize: 16 }} /> },
  { id: 'STAFF', label: 'STAFF', icon: <PeopleIcon sx={{ fontSize: 16 }} /> },
  { id: 'ALUMNI', label: 'ALUMNI', icon: <SchoolIcon sx={{ fontSize: 16 }} /> },
  { id: 'STUDENT', label: 'STUDENT', icon: <PersonIcon sx={{ fontSize: 16 }} /> },
  { id: 'MEMBER', label: 'MEMBER', icon: <PeopleIcon sx={{ fontSize: 16 }} /> },
];

const DEFAULT_PERMISSIONS = {
  fullAccess: false,
  view: false,
  create: false,
  update: false,
  delete: false,
  noAccess: true
};

const AccessControl = () => {
  const { enqueueSnackbar } = useSnackbar();

  // Active selected page and role
  const [selectedPage, setSelectedPage] = useState('overview');
  const [selectedRole, setSelectedRole] = useState('ADMIN');

  // Matrix of permissions: { [pageId]: { [roleId]: { fullAccess, view, create, update, delete, noAccess, tabPermissions } } }
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Dynamic user tabs fetched from API
  const [userTabs, setUserTabs] = useState([]);
  const [loadingUserTabs, setLoadingUserTabs] = useState(false);

  // Target portal node in top AppBar header
  const [portalNode, setPortalNode] = useState(null);

  useEffect(() => {
    const el = document.getElementById('dashboard-header-actions');
    if (el) setPortalNode(el);
  }, []);

  // Fetch dynamic user tabs from API
  const fetchUserTabs = async () => {
    try {
      setLoadingUserTabs(true);
      const res = await API.get('/access/user-tabs');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setUserTabs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load user tabs from API:', err);
    } finally {
      setLoadingUserTabs(false);
    }
  };

  // Fetch access matrix from backend
  const fetchMatrix = async () => {
    try {
      setLoading(true);
      const res = await API.get('/access/matrix');
      if (res.data?.success && res.data?.data?.matrix) {
        setMatrix(res.data.data.matrix);
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error('Failed to load access matrix:', err);
      enqueueSnackbar('Failed to load access control permissions', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
    fetchUserTabs();
  }, []);

  // Get current permissions for active selection
  const currentPermissions = (matrix[selectedPage] && matrix[selectedPage][selectedRole]) || DEFAULT_PERMISSIONS;

  // Checkbox interlocking handler
  const handlePermissionChange = (field, checked) => {
    setMatrix(prev => {
      const current = { ...(prev[selectedPage]?.[selectedRole] || DEFAULT_PERMISSIONS) };

      if (field === 'fullAccess') {
        if (checked) {
          // Checking Full Access turns on View, Create, Update, Delete and turns off No Access
          current.fullAccess = true;
          current.view = true;
          current.create = true;
          current.update = true;
          current.delete = true;
          current.noAccess = false;
        } else {
          current.fullAccess = false;
        }
      } else if (field === 'noAccess') {
        if (checked) {
          // Checking No Access turns off everything else
          current.noAccess = true;
          current.fullAccess = false;
          current.view = false;
          current.create = false;
          current.update = false;
          current.delete = false;
        } else {
          current.noAccess = false;
        }
      } else {
        // Individual permission: view, create, update, delete
        current[field] = checked;

        if (checked) {
          // If any access granted, turn off No Access
          current.noAccess = false;
        }

        // Check if all 4 individual are checked
        if (current.view && current.create && current.update && current.delete) {
          current.fullAccess = true;
        } else {
          current.fullAccess = false;
        }

        // If all 4 are unchecked and not fullAccess, automatically check noAccess
        if (!current.view && !current.create && !current.update && !current.delete && !current.fullAccess) {
          current.noAccess = true;
        }
      }

      return {
        ...prev,
        [selectedPage]: {
          ...prev[selectedPage],
          [selectedRole]: current
        }
      };
    });

    setHasUnsavedChanges(true);
  };

  // Helper to determine if a specific Users tab is checked for the selectedRole
  const getTabPermission = (tabId, tabSlug) => {
    const roleTabPerms = matrix['users']?.[selectedRole]?.tabPermissions;
    if (roleTabPerms && roleTabPerms[tabId] !== undefined) {
      return !!roleTabPerms[tabId];
    }
    if (roleTabPerms && tabSlug && roleTabPerms[tabSlug] !== undefined) {
      return !!roleTabPerms[tabSlug];
    }
    if (selectedRole === 'ADMIN' || selectedRole === 'WARDEN') {
      return true;
    }
    const nameLower = tabSlug || '';
    if (nameLower === 'chairperson' || nameLower === 'inquiry' || tabId === 'dropped' || tabId === 'all') {
      return false;
    }
    if (nameLower === 'staff') {
      return selectedRole === 'STAFF';
    }
    return nameLower === 'students' || nameLower === 'alumni';
  };

  // Toggle permission for a specific Users sub-tab
  const handleTabPermissionToggle = (tabId, checked) => {
    setMatrix(prev => {
      const usersData = prev['users'] || {};
      const roleData = usersData[selectedRole] || { ...DEFAULT_PERMISSIONS, tabPermissions: {} };
      const currentTabPerms = { ...(roleData.tabPermissions || {}) };
      currentTabPerms[tabId] = checked;

      return {
        ...prev,
        users: {
          ...usersData,
          [selectedRole]: {
            ...roleData,
            tabPermissions: currentTabPerms
          }
        }
      };
    });
    setHasUnsavedChanges(true);
  };

  // Save permissions
  const handleSave = async () => {
    try {
      setSaving(true);
      const updates = [];
      PAGE_DEFINITIONS.forEach(p => {
        ROLE_DEFINITIONS.forEach(r => {
          if (matrix[p.id]?.[r.id]) {
            const entry = matrix[p.id][r.id];
            updates.push({
              page: p.id,
              role: r.id,
              permissions: {
                fullAccess: !!entry.fullAccess,
                view: !!entry.view,
                create: !!entry.create,
                update: !!entry.update,
                delete: !!entry.delete,
                noAccess: !!entry.noAccess
              },
              tabPermissions: entry.tabPermissions || {}
            });
          }
        });
      });

      const res = await API.put('/access/matrix', { updates });
      if (res.data?.success) {
        enqueueSnackbar('Access permissions saved successfully!', { variant: 'success' });
        setHasUnsavedChanges(false);
        window.dispatchEvent(new Event('access_permissions_updated'));
      }
    } catch (err) {
      console.error('Failed to save access permissions:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to save permissions', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Reset to default permissions
  const handleResetDefaults = async () => {
    if (!window.confirm('Are you sure you want to reset all permissions to default?')) {
      return;
    }
    try {
      setSaving(true);
      const res = await API.post('/access/reset');
      if (res.data?.success) {
        enqueueSnackbar('Permissions reset to defaults', { variant: 'info' });
        await fetchMatrix();
        window.dispatchEvent(new Event('access_permissions_updated'));
      }
    } catch (err) {
      console.error('Failed to reset permissions:', err);
      enqueueSnackbar('Failed to reset permissions', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const getPageLabel = (id) => PAGE_DEFINITIONS.find(p => p.id === id)?.label || id;

  // Header Action Buttons component (rendered in Topbar via portal & fallback in page header)
  const headerActionButtons = (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Button
        variant="outlined"
        startIcon={<ResetIcon sx={{ fontSize: 18 }} />}
        onClick={handleResetDefaults}
        disabled={saving}
        sx={{
          textTransform: 'none',
          borderRadius: '10px',
          borderColor: '#E2E8F0',
          backgroundColor: '#FFFFFF',
          color: '#475569',
          fontWeight: 600,
          fontSize: '13.5px',
          px: 2,
          py: 0.8,
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          transition: 'all 0.15s ease',
          '&:hover': {
            borderColor: '#CBD5E1',
            backgroundColor: '#F8FAFC',
            color: '#1E293B'
          }
        }}
      >
        Reset Defaults
      </Button>

      <Button
        variant="contained"
        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <LockIcon sx={{ fontSize: 17 }} />}
        onClick={handleSave}
        disabled={saving}
        sx={{
          backgroundColor: '#0088ff',
          color: '#FFFFFF',
          fontWeight: 700,
          fontSize: '13.5px',
          borderRadius: '10px',
          textTransform: 'none',
          px: 2.5,
          py: 0.8,
          boxShadow: 'none',
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: '#1465D0',
            boxShadow: '0 6px 18px rgba(24, 119, 242, 0.45)'
          }
        }}
      >
        {saving ? 'Saving Config...' : 'Save Configuration'}
      </Button>
    </Stack>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#1877F2' }} size={42} />
        <Typography variant="body2" sx={{ mt: 2, color: '#64748B', fontWeight: 500 }}>
          Loading Access Control permissions...
        </Typography>
      </Box>
    );
  }

  // Privilege card configurations
  const PRIVILEGE_CARDS = [
    {
      key: 'fullAccess',
      title: 'Full Access',
      subtitle: 'Grant all permissions',
      icon: <FullAccessIcon sx={{ fontSize: 24 }} />,
      themeColor: '#1877F2',
      activeBg: '#EFF6FF',
      activeBorder: '#1877F2',
      isActive: !!currentPermissions.fullAccess,
      toggle: () => handlePermissionChange('fullAccess', !currentPermissions.fullAccess)
    },
    {
      key: 'view',
      title: 'View',
      subtitle: 'Read-only visibility',
      icon: <ViewIcon sx={{ fontSize: 24 }} />,
      themeColor: '#10B981',
      activeBg: '#F0FDF4',
      activeBorder: '#10B981',
      isActive: !!currentPermissions.view,
      toggle: () => handlePermissionChange('view', !currentPermissions.view)
    },
    {
      key: 'create',
      title: 'Create',
      subtitle: 'Add new entries',
      icon: <CreateIcon sx={{ fontSize: 24 }} />,
      themeColor: '#8B5CF6',
      activeBg: '#FAF5FF',
      activeBorder: '#8B5CF6',
      isActive: !!currentPermissions.create,
      toggle: () => handlePermissionChange('create', !currentPermissions.create)
    },
    {
      key: 'update',
      title: 'Update',
      subtitle: 'Edit / modify data',
      icon: <UpdateIcon sx={{ fontSize: 24 }} />,
      themeColor: '#F59E0B',
      activeBg: '#FFFBEB',
      activeBorder: '#F59E0B',
      isActive: !!currentPermissions.update,
      toggle: () => handlePermissionChange('update', !currentPermissions.update)
    },
    {
      key: 'delete',
      title: 'Delete',
      subtitle: 'Remove records',
      icon: <DeleteIcon sx={{ fontSize: 24 }} />,
      themeColor: '#EF4444',
      activeBg: '#FEF2F2',
      activeBorder: '#EF4444',
      isActive: !!currentPermissions.delete,
      toggle: () => handlePermissionChange('delete', !currentPermissions.delete)
    },
    {
      key: 'noAccess',
      title: 'No Access',
      subtitle: 'Block page & tab',
      icon: <BlockIcon sx={{ fontSize: 24 }} />,
      themeColor: '#475569',
      activeBg: '#F8FAFC',
      activeBorder: '#64748B',
      isActive: !!currentPermissions.noAccess,
      toggle: () => handlePermissionChange('noAccess', !currentPermissions.noAccess)
    }
  ];

  return (
    <Box sx={{ p: 2, maxWidth: 1440, margin: '0 auto' }}>
      {/* Portal buttons into DashboardLayout AppBar Header */}
      {portalNode && ReactDOM.createPortal(headerActionButtons, portalNode)}



      {hasUnsavedChanges && (
        <Alert
          severity="warning"
          sx={{
            mb: 3,
            borderRadius: '12px',
            fontWeight: 500,
            border: '1px solid #FDE68A',
            backgroundColor: '#FFFBEB',
            color: '#92400E'
          }}
        >
          You have unsaved permission changes. Click <strong>"Save Permissions"</strong> in the header to apply them.
        </Alert>
      )}

      {/* CARD 1: Access Configuration Selector */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          p: { xs: 2.5, md: 3 },
          mb: 3,
          boxShadow: 'none'
        }}
      >
        {/* Card Header */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1877F2'
              }}
            >
              <TuneIcon sx={{ fontSize: 18 }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '15.5px' }}>
              Access Configuration Selector
            </Typography>
          </Box>
        </Box>

        {/* 2-ROW SELECTOR */}
        <Stack spacing={2}>
          {/* Row 1: Page */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: '6px 10px',
              borderRadius: '8px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0'
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                color: '#475569',
                fontSize: '13px',
                minWidth: { xs: 50, sm: 65 },
                pl: 1
              }}
            >
              Page
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, flexGrow: 1 }}>
              {PAGE_DEFINITIONS.map(p => {
                const isActive = selectedPage === p.id;
                return (
                  <Button
                    key={p.id}
                    onClick={() => setSelectedPage(p.id)}
                    startIcon={React.cloneElement(p.icon, {
                      sx: { fontSize: 18, color: isActive ? '#FFFFFF' : '#64748B' }
                    })}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '8px',
                      px: 2,
                      py: 0.75,
                      fontWeight: isActive ? 700 : 600,
                      fontSize: '13px',
                      backgroundColor: isActive ? '#0088ff' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#475569',
                      border: isActive ? '1px solid #0088ff' : '1px solid #E2E8F0',
                      boxShadow: "none",
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: isActive ? '#0066cc' : '#F1F5F9',
                        borderColor: isActive ? '#0066cc' : '#CBD5E1'
                      }
                    }}
                  >
                    {p.label}
                  </Button>
                );
              })}
            </Box>
          </Box>

          {/* Row 2: Role */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: '6px 10px',
              borderRadius: '8px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0'
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                color: '#475569',
                fontSize: '13px',
                minWidth: { xs: 50, sm: 65 },
                pl: 1
              }}
            >
              Role
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, flexGrow: 1 }}>
              {ROLE_DEFINITIONS.map(r => {
                const isActive = selectedRole === r.id;
                return (
                  <Button
                    key={r.id}
                    onClick={() => setSelectedRole(r.id)}
                    startIcon={React.cloneElement(r.icon, {
                      sx: { fontSize: 16, color: isActive ? '#FFFFFF' : '#64748B' }
                    })}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '8px',
                      px: 2,
                      py: 0.75,
                      fontWeight: isActive ? 700 : 600,
                      fontSize: '13px',
                      backgroundColor: isActive ? '#0F172A' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#475569',
                      border: isActive ? '1px solid #0F172A' : '1px solid #E2E8F0',
                      boxShadow: 'none',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: isActive ? '#1E293B' : '#F1F5F9',
                        borderColor: isActive ? '#1E293B' : '#CBD5E1'
                      }
                    }}
                  >
                    {r.label}
                  </Button>
                );
              })}
            </Box>
          </Box>
        </Stack>
      </Card>

      {/* CARD 2: Active Privileges */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          p: { xs: 2.5, md: 3 },
          mb: 3,
          boxShadow: 'none'
        }}
      >
        {/* Header of Active Privileges Card */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
            <Chip
              icon={React.cloneElement(PAGE_DEFINITIONS.find(p => p.id === selectedPage)?.icon || <DashboardIcon />, {
                sx: { fontSize: '15px !important', color: '#FFFFFF !important' }
              })}
              label={getPageLabel(selectedPage)}
              sx={{
                backgroundColor: '#0088ff',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '13px',
                borderRadius: '6px',
                height: 28
              }}
            />
            <Typography sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '14px' }}>
              →
            </Typography>
            <Chip
              icon={React.cloneElement(ROLE_DEFINITIONS.find(r => r.id === selectedRole)?.icon || <PersonIcon />, {
                sx: { fontSize: '15px !important', color: '#FFFFFF !important' }
              })}
              label={selectedRole}
              sx={{
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '13px',
                borderRadius: '6px',
                height: 28
              }}
            />
          </Box>

          {/* Right Status Badge */}
          {currentPermissions.noAccess ? (
            <Chip
              icon={<BlockIcon sx={{ fontSize: '16px !important', color: '#DC2626 !important' }} />}
              label="No Access"
              sx={{
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                border: '1px solid #FCA5A5',
                fontWeight: 700,
                fontSize: '12.5px',
                borderRadius: '6px',
                height: 28
              }}
            />
          ) : currentPermissions.fullAccess ? (
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: '16px !important', color: '#16A34A !important' }} />}
              label="Full Access Granted"
              sx={{
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                border: '1px solid #86EFAC',
                fontWeight: 700,
                fontSize: '12.5px',
                borderRadius: '6px',
                height: 28
              }}
            />
          ) : (
            <Chip
              label="Custom Access"
              sx={{
                backgroundColor: '#E0F2FE',
                color: '#0284C7',
                border: '1px solid #BAE6FD',
                fontWeight: 700,
                fontSize: '12.5px',
                borderRadius: '6px',
                height: 28
              }}
            />
          )}
        </Box>

        {/* 6 Privilege Checkbox Cards in a responsive Row/Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(6, 1fr)'
            },
            gap: 2
          }}
        >
          {PRIVILEGE_CARDS.map((item) => (
            <Box
              key={item.key}
              onClick={item.toggle}
              sx={{
                p: 2.2,
                borderRadius: '8px',
                border: item.isActive ? `2px solid ${item.activeBorder}` : '1.5px solid #E2E8F0',
                backgroundColor: item.isActive ? item.activeBg : '#FFFFFF',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: item.isActive ? `0 4px 12px ${item.themeColor}15` : '0 1px 3px rgba(0,0,0,0.02)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 16px ${item.themeColor}20`,
                  borderColor: item.themeColor
                }
              }}
            >
              {/* Top-Right Indicator Circle */}
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
                  backgroundColor: item.isActive ? item.themeColor : 'transparent',
                  border: item.isActive ? 'none' : '1.5px solid #CBD5E1',
                  color: '#FFFFFF'
                }}
              >
                {item.isActive && <CheckIcon sx={{ fontSize: 13, fontWeight: 800 }} />}
              </Box>

              {/* Theme Icon in round squircle */}
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '10px',
                  backgroundColor: `${item.themeColor}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: item.themeColor,
                  mb: 1.5
                }}
              >
                {item.icon}
              </Box>

              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  fontSize: '15px',
                  color: item.isActive ? item.themeColor : '#0F172A',
                  mb: 0.3
                }}
              >
                {item.title}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '12px', display: 'block' }}>
                {item.subtitle}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Dynamic Users Sub-Tabs Visibility (kept when selectedPage === 'users') */}
        {selectedPage === 'users' && (
          <Box
            sx={{
              mt: 3.5,
              pt: 3,
              borderTop: '1px dashed #E2E8F0'
            }}
          >
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1, fontSize: '15px' }}>
                <GroupsIcon sx={{ color: '#0088ff', fontSize: 20 }} />
                Users Role Access Configuration
              </Typography>
            </Box>

            {loadingUserTabs ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
                <CircularProgress size={20} sx={{ color: '#10B981' }} />
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Loading dynamic tabs from API...
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
                  gap: 2
                }}
              >
                {userTabs.map(tab => {
                  const isChecked = getTabPermission(tab.id, tab.slug || tab.name.toLowerCase());
                  return (
                    <Box
                      key={tab.id}
                      onClick={() => handleTabPermissionToggle(tab.id, !isChecked)}
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        backgroundColor: isChecked ? '#F0FDF4' : '#FFFFFF',
                        border: isChecked ? '2px solid #10B981' : '1.5px solid #E2E8F0',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        '&:hover': {
                          borderColor: '#10B981',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '14px' }}>
                          {tab.name}
                        </Typography>
                        {tab.isSystem && (
                          <Chip
                            label="System"
                            size="small"
                            sx={{ fontSize: '0.65rem', height: 18, backgroundColor: '#F1F5F9', color: '#64748B' }}
                          />
                        )}
                      </Box>

                      <Box sx={{ pt: 1, borderTop: '1px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#059669', fontSize: '13px' }}>
                            View
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '11.5px' }}>
                            Read-only visibility
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isChecked ? '#10B981' : 'transparent',
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
        )}
      </Card>

      {/* CARD 3: Full Permissions Matrix */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          overflow: 'hidden',
          boxShadow: 'none'
        }}
      >
   

        {/* Matrix Table */}
        <TableContainer component={Paper} elevation={0}>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700, color: '#334155', fontSize: '13.5px', py: 1.8, px: 3, minWidth: 160, borderBottom: '1px solid #E2E8F0' }}>
                  Page
                </TableCell>
                {ROLE_DEFINITIONS.map(r => (
                  <TableCell
                    key={r.id}
                    align="center"
                    sx={{
                      fontWeight: 700,
                      color: selectedRole === r.id ? '#1877F2' : '#334155',
                      fontSize: '13px',
                      py: 1.8,
                      minWidth: 140,
                      borderBottom: '1px solid #E2E8F0'
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
              {PAGE_DEFINITIONS.map(p => {
                const isRowActive = selectedPage === p.id;
                return (
                  <TableRow
                    key={p.id}
                    hover
                    sx={{
                      backgroundColor: isRowActive ? 'rgba(24, 119, 242, 0.02)' : 'transparent',
                      transition: 'background-color 0.12s ease'
                    }}
                  >
                    {/* Page Name Cell */}
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: isRowActive ? '#1877F2' : '#1E293B',
                        fontSize: '13.5px',
                        py: 1.8,
                        px: 3,
                        borderBottom: '1px solid #F1F5F9'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        {React.cloneElement(p.icon, {
                          sx: { fontSize: 18, color: isRowActive ? '#1877F2' : '#64748B' }
                        })}
                        {p.label}
                      </Box>
                    </TableCell>

                    {/* Role Permission Cells */}
                    {ROLE_DEFINITIONS.map(r => {
                      const perms = matrix[p.id]?.[r.id] || DEFAULT_PERMISSIONS;
                      const isCellActive = selectedPage === p.id && selectedRole === r.id;

                      let cellBadge;
                      if (perms.noAccess) {
                        cellBadge = (
                          <Chip
                            icon={<BlockIcon sx={{ fontSize: '13px !important', color: '#DC2626 !important' }} />}
                            label="No Access"
                            size="small"
                            sx={{
                              backgroundColor: '#FEE2E2',
                              color: '#DC2626',
                              fontSize: '12px',
                              fontWeight: 700,
                              height: 26,
                              borderRadius: '13px',
                              px: 0.5,
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        );
                      } else if (perms.fullAccess) {
                        cellBadge = (
                          <Chip
                            icon={<CheckIcon sx={{ fontSize: '14px !important', color: '#16A34A !important', fontWeight: 800 }} />}
                            label="Full Access"
                            size="small"
                            sx={{
                              backgroundColor: '#DCFCE7',
                              color: '#15803D',
                              fontSize: '12px',
                              fontWeight: 700,
                              height: 26,
                              borderRadius: '13px',
                              px: 0.5,
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        );
                      } else if (perms.view && perms.update && !perms.create && !perms.delete) {
                        cellBadge = (
                          <Chip
                            icon={<EditIcon sx={{ fontSize: '13px !important', color: '#D97706 !important' }} />}
                            label="View, Update"
                            size="small"
                            sx={{
                              backgroundColor: '#FEF3C7',
                              color: '#D97706',
                              fontSize: '12px',
                              fontWeight: 700,
                              height: 26,
                              borderRadius: '13px',
                              px: 0.5,
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        );
                      } else if (perms.view && !perms.create && !perms.update && !perms.delete) {
                        cellBadge = (
                          <Chip
                            icon={<ViewIcon sx={{ fontSize: '13px !important', color: '#0284C7 !important' }} />}
                            label="View"
                            size="small"
                            sx={{
                              backgroundColor: '#E0F2FE',
                              color: '#0284C7',
                              fontSize: '12px',
                              fontWeight: 700,
                              height: 26,
                              borderRadius: '13px',
                              px: 0.5,
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        );
                      } else {
                        const activeList = [];
                        if (perms.view) activeList.push('View');
                        if (perms.create) activeList.push('Create');
                        if (perms.update) activeList.push('Update');
                        if (perms.delete) activeList.push('Delete');

                        cellBadge = (
                          <Chip
                            label={activeList.length ? activeList.join(', ') : 'No Access'}
                            size="small"
                            sx={{
                              backgroundColor: '#EFF6FF',
                              color: '#1D4ED8',
                              fontSize: '12px',
                              fontWeight: 700,
                              height: 26,
                              borderRadius: '13px',
                              px: 0.5,
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        );
                      }

                      return (
                        <TableCell
                          key={r.id}
                          align="center"
                          onClick={() => {
                            setSelectedPage(p.id);
                            setSelectedRole(r.id);
                          }}
                          sx={{
                            cursor: 'pointer',
                            py: 1.8,
                            borderBottom: '1px solid #F1F5F9',
                            outline: isCellActive ? '2px solid #1877F2' : 'none',
                            outlineOffset: '-2px',
                            backgroundColor: isCellActive ? 'rgba(24, 119, 242, 0.05)' : 'transparent',
                            transition: 'all 0.12s ease',
                            '&:hover': {
                              backgroundColor: 'rgba(24, 119, 242, 0.08)'
                            }
                          }}
                        >
                          {cellBadge}
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
    </Box>
  );
};

export default AccessControl;
