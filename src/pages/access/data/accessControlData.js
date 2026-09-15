import React from 'react';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Collections as GalleryIcon,
  AccountCircle as ProfileIcon,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  SchoolRounded as SchoolIcon
} from '@mui/icons-material';

export const PAGE_DEFINITIONS = [
  { id: 'overview', label: 'Overview', icon: React.createElement(DashboardIcon, { sx: { fontSize: 18 } }) },
  { id: 'users', label: 'Users', icon: React.createElement(PeopleIcon, { sx: { fontSize: 18 } }) },
  { id: 'events', label: 'Events', icon: React.createElement(EventIcon, { sx: { fontSize: 18 } }) },
  { id: 'gallery', label: 'Gallery', icon: React.createElement(GalleryIcon, { sx: { fontSize: 18 } }) },
  { id: 'profile', label: 'Profile', icon: React.createElement(ProfileIcon, { sx: { fontSize: 18 } }) },
  { id: 'access_control', label: 'Access Control', icon: React.createElement(AdminIcon, { sx: { fontSize: 18 } }) }
];

export const ROLE_DEFINITIONS = [
  { id: 'ADMIN', label: 'ADMIN', icon: React.createElement(AdminIcon, { sx: { fontSize: 16 } }) },
  { id: 'WARDEN', label: 'WARDEN', icon: React.createElement(SecurityIcon, { sx: { fontSize: 16 } }) },
  { id: 'STAFF', label: 'STAFF', icon: React.createElement(PeopleIcon, { sx: { fontSize: 16 } }) },
  { id: 'ALUMNI', label: 'ALUMNI', icon: React.createElement(SchoolIcon, { sx: { fontSize: 16 } }) },
  { id: 'STUDENT', label: 'STUDENT', icon: React.createElement(PeopleIcon, { sx: { fontSize: 16 } }) },
  { id: 'MEMBER', label: 'MEMBER', icon: React.createElement(PeopleIcon, { sx: { fontSize: 16 } }) }
];

export const DEFAULT_PERMISSIONS = {
  fullAccess: false,
  view: false,
  create: false,
  update: false,
  delete: false,
  noAccess: true
};

export const ACCESS_COLORS = {
  primary: '#0F172A',
  primaryAlt: '#1877F2',
  border: '#E2E8F0',
  surface: '#FFFFFF',
  muted: '#64748B',
  background: '#F8FAFC'
};

export const getPageLabel = (id) => PAGE_DEFINITIONS.find((p) => p.id === id)?.label || id;
