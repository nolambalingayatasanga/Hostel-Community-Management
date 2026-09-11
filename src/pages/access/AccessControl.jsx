import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
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
  IconButton,
  Tooltip,
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
  Save as SaveIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Security as SecurityIcon,
  Tune as TuneIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import API from '../../api';

// Page definitions with icons
const PAGE_DEFINITIONS = [
  { id: 'overview', label: 'Overview', icon: <DashboardIcon fontSize="small" /> },
  { id: 'users', label: 'Users', icon: <PeopleIcon fontSize="small" /> },
  { id: 'events', label: 'Events', icon: <EventIcon fontSize="small" /> },
  { id: 'gallery', label: 'Gallery', icon: <GalleryIcon fontSize="small" /> },
  { id: 'profile', label: 'Profile', icon: <ProfileIcon fontSize="small" /> },
  { id: 'access_control', label: 'Access Control', icon: <AdminIcon fontSize="small" /> },
];

// User roles definition
const ROLE_DEFINITIONS = [
  { id: 'ADMIN', label: 'ADMIN' },
  { id: 'WARDEN', label: 'WARDEN' },
  { id: 'STAFF', label: 'STAFF' },
  { id: 'ALUMNI', label: 'ALUMNI' },
  { id: 'STUDENT', label: 'STUDENT' },
  { id: 'MEMBER', label: 'MEMBER' },
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
  
  // Active selected page and role for the 2-row header control
  const [selectedPage, setSelectedPage] = useState('overview');
  const [selectedRole, setSelectedRole] = useState('ADMIN');

  // Matrix of permissions: { [pageId]: { [roleId]: { fullAccess, view, create, update, delete, noAccess, tabPermissions } } }
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Dynamic user tabs fetched from API (never hardcoded)
  const [userTabs, setUserTabs] = useState([]);
  const [loadingUserTabs, setLoadingUserTabs] = useState(false);

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
    // Default values if not yet configured
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

  // Save current active permissions or full matrix
  const handleSave = async () => {
    try {
      setSaving(true);
      // Flatten all updates to send to backend
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
        // Trigger event so sidebar and directory tabs immediately update dynamic tabs without page reload
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#0088ff' }} size={40} />
        <Typography variant="body2" sx={{ mt: 2, color: '#64748b' }}>
          Loading Access Control permissions...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, margin: '0 auto' }}>
      {/* Top Header Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              backgroundColor: 'rgba(0, 136, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0088ff'
            }}
          >
            <SecurityIcon fontSize="medium" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Access Control
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Configure role-based page and action privileges across all sidebar pages
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleResetDefaults}
            disabled={saving}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              borderColor: '#cbd5e1',
              color: '#475569',
              fontWeight: 600,
              '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' }
            }}
          >
            Reset Defaults
          </Button>

          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{
              backgroundColor: '#0088ff',
              color: '#fff',
              fontWeight: 600,
              borderRadius: '8px',
              textTransform: 'none',
              px: 3,
              boxShadow: '0 4px 12px rgba(0, 136, 255, 0.25)',
              '&:hover': {
                backgroundColor: '#0070d2'
              }
            }}
          >
            {saving ? 'Saving...' : 'Save Permissions'}
          </Button>
        </Stack>
      </Box>

      {hasUnsavedChanges && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: '8px' }}>
          You have unsaved permission changes. Click <strong>"Save Permissions"</strong> above to apply them.
        </Alert>
      )}

      {/* Main 2-Row Header Table Card */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          overflow: 'hidden',
          mb: 4
        }}
      >
        <Box sx={{ p: 2.5, backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
            <TuneIcon sx={{ color: '#0088ff', fontSize: 20 }} />
            Access Configuration Selector
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Select a sidebar page in the 1st row and a user role in the 2nd row to manage the 6 permission checkboxes.
          </Typography>
        </Box>

        {/* 2-ROW HEADER CONTAINER */}
        <Box sx={{ p: 2.5 }}>
          {/* ROW 1: Sidebar Pages */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#64748b', display: 'block', mb: 1.2 }}>
              Row 1: Sidebar Pages
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.2,
                backgroundColor: '#f1f5f9',
                p: 1,
                borderRadius: '10px'
              }}
            >
              {PAGE_DEFINITIONS.map(p => {
                const isActive = selectedPage === p.id;
                return (
                  <Button
                    key={p.id}
                    variant={isActive ? 'contained' : 'text'}
                    startIcon={p.icon}
                    onClick={() => setSelectedPage(p.id)}
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: isActive ? 700 : 500,
                      px: 2,
                      py: 1,
                      fontSize: '0.9rem',
                      backgroundColor: isActive ? '#0088ff' : 'transparent',
                      color: isActive ? '#ffffff' : '#334155',
                      boxShadow: isActive ? '0 2px 8px rgba(0, 136, 255, 0.3)' : 'none',
                      '&:hover': {
                        backgroundColor: isActive ? '#0070d2' : 'rgba(255, 255, 255, 0.7)',
                      }
                    }}
                  >
                    {p.label}
                  </Button>
                );
              })}
            </Box>
          </Box>

          {/* ROW 2: User Roles */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#64748b', display: 'block', mb: 1.2 }}>
              Row 2: User Types / Roles
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.2,
                backgroundColor: '#f8fafc',
                p: 1,
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}
            >
              {ROLE_DEFINITIONS.map(r => {
                const isActive = selectedRole === r.id;
                return (
                  <Button
                    key={r.id}
                    variant={isActive ? 'contained' : 'outlined'}
                    onClick={() => setSelectedRole(r.id)}
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: isActive ? 700 : 600,
                      px: 2.2,
                      py: 0.8,
                      fontSize: '0.875rem',
                      borderColor: isActive ? '#0f172a' : '#cbd5e1',
                      backgroundColor: isActive ? '#0f172a' : '#ffffff',
                      color: isActive ? '#ffffff' : '#475569',
                      boxShadow: isActive ? '0 2px 8px rgba(15, 23, 42, 0.25)' : 'none',
                      '&:hover': {
                        backgroundColor: isActive ? '#1e293b' : '#f1f5f9',
                        borderColor: isActive ? '#1e293b' : '#94a3b8'
                      }
                    }}
                  >
                    {r.label}
                  </Button>
                );
              })}
            </Box>
          </Box>

          <Divider sx={{ my: 2.5, borderColor: '#f1f5f9' }} />

          {/* ACTIVE TAB PERMISSION CHECKBOXES (6 OPTIONS) */}
          <Box
            sx={{
              p: 3,
              backgroundColor: '#fafcff',
              borderRadius: '12px',
              border: '1.5px solid #dbeafe'
            }}
          >
            {/* Header info badge for active combination */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#334155' }}>
                  Active Privileges for:
                </Typography>
                <Chip
                  label={getPageLabel(selectedPage)}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 700, backgroundColor: '#0088ff' }}
                />
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  →
                </Typography>
                <Chip
                  label={selectedRole}
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 700, borderColor: '#0f172a', color: '#0f172a' }}
                />
              </Box>

              {currentPermissions.noAccess ? (
                <Chip
                  icon={<BlockIcon sx={{ fontSize: '16px !important' }} />}
                  label="No Access"
                  color="error"
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              ) : currentPermissions.fullAccess ? (
                <Chip
                  icon={<CheckCircleIcon sx={{ fontSize: '16px !important' }} />}
                  label="Full Access Granted"
                  color="success"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              ) : (
                <Chip
                  label="Custom Access"
                  size="small"
                  sx={{ fontWeight: 600, backgroundColor: '#e0f2fe', color: '#0284c7' }}
                />
              )}
            </Box>

            {/* The 6 Checkboxes */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' },
                gap: 2
              }}
            >
              {/* 1. Full Access */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: '10px',
                  backgroundColor: currentPermissions.fullAccess ? 'rgba(0, 136, 255, 0.08)' : '#ffffff',
                  border: currentPermissions.fullAccess ? '2px solid #0088ff' : '1px solid #e2e8f0',
                  transition: 'all 0.15s ease'
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!currentPermissions.fullAccess}
                      onChange={(e) => handlePermissionChange('fullAccess', e.target.checked)}
                      sx={{ color: '#0088ff', '&.Mui-checked': { color: '#0088ff' } }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: currentPermissions.fullAccess ? '#0088ff' : '#1e293b' }}>
                        Full Access
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Grant all permissions
                      </Typography>
                    </Box>
                  }
                  sx={{ width: '100%', m: 0 }}
                />
              </Box>

              {/* 2. View */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: '10px',
                  backgroundColor: currentPermissions.view ? 'rgba(16, 185, 129, 0.08)' : '#ffffff',
                  border: currentPermissions.view ? '2px solid #10b981' : '1px solid #e2e8f0',
                  transition: 'all 0.15s ease'
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!currentPermissions.view}
                      onChange={(e) => handlePermissionChange('view', e.target.checked)}
                      sx={{ color: '#10b981', '&.Mui-checked': { color: '#10b981' } }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: currentPermissions.view ? '#059669' : '#1e293b' }}>
                        View
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Read-only visibility
                      </Typography>
                    </Box>
                  }
                  sx={{ width: '100%', m: 0 }}
                />
              </Box>

              {/* 3. Create */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: '10px',
                  backgroundColor: currentPermissions.create ? 'rgba(99, 102, 241, 0.08)' : '#ffffff',
                  border: currentPermissions.create ? '2px solid #6366f1' : '1px solid #e2e8f0',
                  transition: 'all 0.15s ease'
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!currentPermissions.create}
                      onChange={(e) => handlePermissionChange('create', e.target.checked)}
                      sx={{ color: '#6366f1', '&.Mui-checked': { color: '#6366f1' } }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: currentPermissions.create ? '#4f46e5' : '#1e293b' }}>
                        Create
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Add new entries
                      </Typography>
                    </Box>
                  }
                  sx={{ width: '100%', m: 0 }}
                />
              </Box>

              {/* 4. Update */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: '10px',
                  backgroundColor: currentPermissions.update ? 'rgba(245, 158, 11, 0.08)' : '#ffffff',
                  border: currentPermissions.update ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                  transition: 'all 0.15s ease'
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!currentPermissions.update}
                      onChange={(e) => handlePermissionChange('update', e.target.checked)}
                      sx={{ color: '#f59e0b', '&.Mui-checked': { color: '#f59e0b' } }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: currentPermissions.update ? '#d97706' : '#1e293b' }}>
                        Update
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Edit / modify data
                      </Typography>
                    </Box>
                  }
                  sx={{ width: '100%', m: 0 }}
                />
              </Box>

              {/* 5. Delete */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: '10px',
                  backgroundColor: currentPermissions.delete ? 'rgba(239, 68, 68, 0.08)' : '#ffffff',
                  border: currentPermissions.delete ? '2px solid #ef4444' : '1px solid #e2e8f0',
                  transition: 'all 0.15s ease'
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!currentPermissions.delete}
                      onChange={(e) => handlePermissionChange('delete', e.target.checked)}
                      sx={{ color: '#ef4444', '&.Mui-checked': { color: '#ef4444' } }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: currentPermissions.delete ? '#dc2626' : '#1e293b' }}>
                        Delete
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Remove records
                      </Typography>
                    </Box>
                  }
                  sx={{ width: '100%', m: 0 }}
                />
              </Box>

              {/* 6. No Access */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: '10px',
                  backgroundColor: currentPermissions.noAccess ? 'rgba(100, 116, 139, 0.12)' : '#ffffff',
                  border: currentPermissions.noAccess ? '2px solid #475569' : '1px solid #e2e8f0',
                  transition: 'all 0.15s ease'
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!currentPermissions.noAccess}
                      onChange={(e) => handlePermissionChange('noAccess', e.target.checked)}
                      sx={{ color: '#475569', '&.Mui-checked': { color: '#475569' } }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: currentPermissions.noAccess ? '#334155' : '#1e293b' }}>
                        No Access
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Block page & tab
                      </Typography>
                    </Box>
                  }
                  sx={{ width: '100%', m: 0 }}
                />
              </Box>
            </Box>
          </Box>

          {/* USERS SUB-TABS VISIBILITY (LIVE VIEW CHECKBOX CARDS FETCHED FROM API) */}
          {selectedPage === 'users' && (
            <Box
              sx={{
                mt: 3,
                p: 3,
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1.5px solid #e2e8f0'
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleIcon sx={{ color: '#0088ff', fontSize: 20 }} />
                  Users Sub-Tabs Visibility
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Manage which directory sub-tabs are visible for role <strong>{selectedRole}</strong> inside the Users page. (Fetched dynamically from API)
                </Typography>
              </Box>

              {loadingUserTabs ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
                  <CircularProgress size={20} sx={{ color: '#10b981' }} />
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
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
                        sx={{
                          p: 2,
                          borderRadius: '12px',
                          backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.08)' : '#ffffff',
                          border: isChecked ? '2px solid #10b981' : '1px solid #e2e8f0',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                            {tab.name}
                          </Typography>
                          {tab.isSystem && (
                            <Chip
                              label="System"
                              size="small"
                              sx={{ fontSize: '0.65rem', height: 18, backgroundColor: '#f1f5f9', color: '#64748b' }}
                            />
                          )}
                        </Box>

                        {/* Live View Checkbox Card matching user's Image 2 */}
                        <Box
                          sx={{
                            pt: 1,
                            borderTop: '1px dashed #e2e8f0'
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#059669', mb: 0.5 }}>
                            View
                          </Typography>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={isChecked}
                                onChange={(e) => handleTabPermissionToggle(tab.id, e.target.checked)}
                                sx={{
                                  color: '#10b981',
                                  '&.Mui-checked': { color: '#10b981' },
                                  p: 0.5
                                }}
                              />
                            }
                            label={
                              <Typography variant="body2" sx={{ color: '#475467', fontSize: '0.85rem' }}>
                                Read-only visibility
                              </Typography>
                            }
                            sx={{ m: 0 }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Card>

      {/* OVERVIEW PERMISSIONS MATRIX TABLE */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 2.5, backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
              Full Permissions Matrix
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Click any cell to immediately select and edit that page & user role combination above
            </Typography>
          </Box>
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, backgroundColor: '#f1f5f9', color: '#334155', minWidth: 160 }}>
                  Page
                </TableCell>
                {ROLE_DEFINITIONS.map(r => (
                  <TableCell
                    key={r.id}
                    align="center"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: selectedRole === r.id ? '#e2e8f0' : '#f1f5f9',
                      color: '#1e293b',
                      minWidth: 150
                    }}
                  >
                    {r.label}
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
                      backgroundColor: isRowActive ? 'rgba(0, 136, 255, 0.03)' : 'transparent',
                    }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: 600,
                        color: isRowActive ? '#0088ff' : '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      {p.icon}
                      {p.label}
                    </TableCell>

                    {ROLE_DEFINITIONS.map(r => {
                      const perms = matrix[p.id]?.[r.id] || DEFAULT_PERMISSIONS;
                      const isCellActive = selectedPage === p.id && selectedRole === r.id;

                      let cellBadge;
                      if (perms.noAccess) {
                        cellBadge = (
                          <Chip
                            label="No Access"
                            size="small"
                            sx={{
                              backgroundColor: '#fee2e2',
                              color: '#991b1b',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              height: 22
                            }}
                          />
                        );
                      } else if (perms.fullAccess) {
                        cellBadge = (
                          <Chip
                            label="Full Access"
                            size="small"
                            sx={{
                              backgroundColor: '#dcfce7',
                              color: '#166534',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              height: 22
                            }}
                          />
                        );
                      } else {
                        const activeList = [];
                        if (perms.view) activeList.push('V');
                        if (perms.create) activeList.push('C');
                        if (perms.update) activeList.push('U');
                        if (perms.delete) activeList.push('D');

                        cellBadge = (
                          <Chip
                            label={activeList.length ? activeList.join(', ') : 'None'}
                            size="small"
                            sx={{
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              height: 22
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
                            outline: isCellActive ? '2px solid #0088ff' : 'none',
                            outlineOffset: '-2px',
                            backgroundColor: isCellActive ? 'rgba(0, 136, 255, 0.08)' : 'inherit',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 136, 255, 0.05)'
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
