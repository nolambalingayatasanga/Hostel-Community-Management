import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api';
import { useAuth } from './AuthContext';

const PermissionContext = createContext(null);

export const PermissionProvider = ({ children }) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setPermissions({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await API.get('/access/my-permissions');
      if (res.data?.success && res.data?.data) {
        setPermissions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load user permissions:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPermissions();

    const handleUpdated = () => {
      fetchPermissions();
    };

    window.addEventListener('access_permissions_updated', handleUpdated);
    return () => window.removeEventListener('access_permissions_updated', handleUpdated);
  }, [fetchPermissions]);

  const isAdminOrWarden = user?.role === 'ADMIN' || user?.role === 'WARDEN' || user?.role === 'CHAIRPERSON';

  /**
   * Get raw permission object for a page
   */
  const getPagePermissions = useCallback((pageId) => {
    if (isAdminOrWarden) {
      return { fullAccess: true, view: true, create: true, update: true, delete: true, noAccess: false };
    }
    return permissions[pageId] || { fullAccess: false, view: false, create: false, update: false, delete: false, noAccess: true };
  }, [isAdminOrWarden, permissions]);

  /**
   * Check if user can create on a page
   */
  const canCreate = useCallback((pageId) => {
    if (isAdminOrWarden) return true;
    if (!user) return false;
    const pagePerms = permissions[pageId];
    if (!pagePerms || pagePerms.noAccess) return false;
    return !!(pagePerms.fullAccess || pagePerms.create);
  }, [isAdminOrWarden, user, permissions]);

  /**
   * Check if user can update on a page (and optionally owns the item)
   */
  const canUpdate = useCallback((pageId, itemOwnerId = null) => {
    if (isAdminOrWarden) return true;
    if (!user) return false;
    const pagePerms = permissions[pageId];
    if (!pagePerms || pagePerms.noAccess) return false;
    const hasPerm = !!(pagePerms.fullAccess || pagePerms.update);
    if (!hasPerm) return false;
    if (itemOwnerId) {
      const ownerId = typeof itemOwnerId === 'object' ? (itemOwnerId?._id || itemOwnerId?.id) : itemOwnerId;
      return String(ownerId) === String(user._id);
    }
    return true;
  }, [isAdminOrWarden, user, permissions]);

  /**
   * Check if user can delete on a page (and optionally owns the item)
   */
  const canDelete = useCallback((pageId, itemOwnerId = null) => {
    if (isAdminOrWarden) return true;
    if (!user) return false;
    const pagePerms = permissions[pageId];
    if (!pagePerms || pagePerms.noAccess) return false;
    const hasPerm = !!(pagePerms.fullAccess || pagePerms.delete);
    if (!hasPerm) return false;
    if (itemOwnerId) {
      const ownerId = typeof itemOwnerId === 'object' ? (itemOwnerId?._id || itemOwnerId?.id) : itemOwnerId;
      return String(ownerId) === String(user._id);
    }
    return true;
  }, [isAdminOrWarden, user, permissions]);

  /**
   * Check if user can view a page
   */
  const canView = useCallback((pageId) => {
    if (isAdminOrWarden) return true;
    if (!user) return false;
    const pagePerms = permissions[pageId];
    if (!pagePerms || pagePerms.noAccess) return false;
    return !!(pagePerms.fullAccess || pagePerms.view);
  }, [isAdminOrWarden, user, permissions]);

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        loading,
        getPagePermissions,
        canCreate,
        canUpdate,
        canDelete,
        canView,
        refetchPermissions: fetchPermissions
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};
