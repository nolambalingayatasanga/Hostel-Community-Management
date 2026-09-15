import React, { useState, useEffect } from 'react';
import { Box, Alert, CircularProgress, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import API from '../../api';
import AccessPageHeader from './components/AccessPageHeader';
import AccessHeaderActions from './components/AccessHeaderActions';
import AccessConfigurationSelector from './components/AccessConfigurationSelector';
import ActivePrivilegesCard from './components/ActivePrivilegesCard';
import PermissionMatrix from './components/PermissionMatrix';
import {
  PAGE_DEFINITIONS,
  ROLE_DEFINITIONS,
  DEFAULT_PERMISSIONS,
  ACCESS_COLORS
} from './data/accessControlData';

const AccessControl = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [selectedPage, setSelectedPage] = useState('overview');
  const [selectedRole, setSelectedRole] = useState('ADMIN');
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [userTabs, setUserTabs] = useState([]);
  const [loadingUserTabs, setLoadingUserTabs] = useState(false);
  const [portalNode, setPortalNode] = useState(null);

  useEffect(() => {
    const el = document.getElementById('dashboard-header-actions');
    if (el) {
      setPortalNode(el);
    }
  }, []);

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

  const currentPermissions = matrix[selectedPage]?.[selectedRole] || DEFAULT_PERMISSIONS;
  const selectedPageData = PAGE_DEFINITIONS.find((p) => p.id === selectedPage);
  const selectedRoleData = ROLE_DEFINITIONS.find((r) => r.id === selectedRole);

  const handlePermissionChange = (field, checked) => {
    setMatrix((prev) => {
      const current = { ...(prev[selectedPage]?.[selectedRole] || DEFAULT_PERMISSIONS) };

      if (field === 'fullAccess') {
        if (checked) {
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
        current[field] = checked;
        if (checked) {
          current.noAccess = false;
        }
        if (current.view && current.create && current.update && current.delete) {
          current.fullAccess = true;
        } else {
          current.fullAccess = false;
        }
        if (!current.view && !current.create && !current.update && !current.delete && !current.fullAccess) {
          current.noAccess = true;
        }
      }

      return {
        ...prev,
        [selectedPage]: {
          ...(prev[selectedPage] || {}),
          [selectedRole]: current
        }
      };
    });

    setHasUnsavedChanges(true);
  };

  const getTabPermission = (tabId, tabSlug) => {
    const roleTabPerms = matrix.users?.[selectedRole]?.tabPermissions;
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

  const handleTabPermissionToggle = (tabId, checked) => {
    setMatrix((prev) => {
      const usersData = prev.users || {};
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

  const handleSave = async () => {
    try {
      setSaving(true);
      const updates = [];
      PAGE_DEFINITIONS.forEach((p) => {
        ROLE_DEFINITIONS.forEach((r) => {
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

  const handleSelectCell = (pageId, roleId) => {
    setSelectedPage(pageId);
    setSelectedRole(roleId);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: ACCESS_COLORS.primaryAlt }} size={42} />
        <Typography variant="body2" sx={{ mt: 2, color: ACCESS_COLORS.muted, fontWeight: 500 }}>
          Loading Access Control permissions...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, maxWidth: 1440, margin: '0 auto' }}>
      <AccessHeaderActions
        portalNode={portalNode}
        saving={saving}
        onResetDefaults={handleResetDefaults}
        onSave={handleSave}
      />

      <AccessPageHeader
        pageCount={PAGE_DEFINITIONS.length}
        roleCount={ROLE_DEFINITIONS.length}
      />

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
          You have unsaved permission changes. Click <strong>"Save Configuration"</strong> in the header to apply them.
        </Alert>
      )}

      <AccessConfigurationSelector
        pageDefinitions={PAGE_DEFINITIONS}
        roleDefinitions={ROLE_DEFINITIONS}
        selectedPage={selectedPage}
        selectedRole={selectedRole}
        onSelectPage={setSelectedPage}
        onSelectRole={setSelectedRole}
      />

      <ActivePrivilegesCard
        selectedPageData={selectedPageData}
        selectedRoleData={selectedRoleData}
        currentPermissions={currentPermissions}
        selectedPage={selectedPage}
        selectedRoleName={selectedRole}
        onPermissionChange={handlePermissionChange}
        userTabsSectionProps={{
          loadingUserTabs,
          userTabs,
          onGetTabPermission: getTabPermission,
          onToggleTabPermission: handleTabPermissionToggle
        }}
      />

      <PermissionMatrix
        pageDefinitions={PAGE_DEFINITIONS}
        roleDefinitions={ROLE_DEFINITIONS}
        matrix={matrix}
        selectedPage={selectedPage}
        selectedRole={selectedRole}
        onSelectCell={handleSelectCell}
      />
    </Box>
  );
};

export default AccessControl;
