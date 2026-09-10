import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Button
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Event as EventIcon,
  AccountCircle as ProfileIcon,
  ExitToApp as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  Collections as GalleryIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

const drawerWidth = 240;

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const getPageTitle = () => {
    const path = location.pathname;
    
    // Event details page check
    if (path.startsWith('/events/') && path !== '/events/new') {
      return 'Event Details';
    }

    // Events / Calendar page check
    if (path === '/events') {
      return 'Event Calendar';
    }
    
    // Profile page check
    if (path.startsWith('/profile')) {
      return 'Profile';
    }

    // Default formatting logic
    return path.substring(1).charAt(0).toUpperCase() + path.substring(2).replace('/', ' / ');
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleLogoutClick = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  // Nav menu items mapping
  const isStudentAlumniStaff = ['STUDENT', 'ALUMNI', 'STAFF'].includes(user?.role);
  const menuItems = [
    isStudentAlumniStaff
      ? { text: 'Profile', icon: <ProfileIcon />, path: '/profile', roles: ['STUDENT', 'ALUMNI', 'STAFF'] }
      : { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['ADMIN', 'CHAIRPERSON', 'MEMBER'] },
    { text: 'Members', icon: <PeopleIcon />, path: '/members', roles: ['ADMIN', 'CHAIRPERSON', 'MEMBER', 'STAFF', 'STUDENT', 'ALUMNI'] },
    { text: 'Events Calendar', icon: <EventIcon />, path: '/events', roles: ['ADMIN', 'CHAIRPERSON', 'MEMBER', 'STAFF', 'STUDENT', 'ALUMNI'] },
    { text: 'Gallery', icon: <GalleryIcon />, path: '/gallery', roles: ['ADMIN', 'CHAIRPERSON', 'MEMBER', 'STAFF', 'STUDENT', 'ALUMNI'] },
  ];




  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', background: 'linear-gradient(135deg, #0088ff 0%, #0055cc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Hostel Community
        </Typography>
      </Toolbar>
      
      <Divider sx={{ borderColor: '#f1f5f9' }} />
      
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          src={user?.profilePhoto?.url || ''}
          alt={user?.name || 'User'}
          sx={{ width: 48, height: 48, border: '2px solid #0088ff' }}
        >
          {user?.name?.charAt(0)}
        </Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 'bold', color: '#1e293b' }}>
            {user?.name}
          </Typography>
          <Typography variant="caption" sx={{ color: '#0088ff', fontWeight: 'bold' }}>
            {user?.role}
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ borderColor: '#f1f5f9' }} />

      <List sx={{ px: 1, flexGrow: 1 }}>
        {menuItems
          .filter(item => item.roles.includes(user?.role))
          .map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={location.pathname === item.path}
                sx={{
                  borderRadius: 2,
                  color: '#475467',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(0, 136, 255, 0.08)',
                    color: '#0088ff',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 136, 255, 0.12)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: '#0088ff',
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: location.pathname === item.path ? '#0088ff' : '#475467' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ fontSize: 14, fontWeight: location.pathname === item.path ? 600 : 500 }}>
                      {item.text}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}


      </List>

      <Divider sx={{ borderColor: '#f1f5f9' }} />
      
      <List sx={{ p: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogoutClick}
            sx={{ borderRadius: 2, color: 'error.main', '&:hover': { backgroundColor: 'rgba(244, 63, 94, 0.1)' } }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                  Logout
                </Typography>
              }
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: 'none',
          color: '#1e293b'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            
            {location.pathname.startsWith('/events/') && location.pathname !== '/events/new' ? (
              <Button
                startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                onClick={() => navigate('/events')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  color: '#64748B',
                  bgcolor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  px: 2,
                  py: 0.75,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  '&:hover': {
                    bgcolor: '#F8FAFC',
                    color: '#1E293B',
                    borderColor: '#CBD5E1',
                  },
                }}
              >
                Back to Events
              </Button>
            ) : (
              <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
                {getPageTitle()}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Account settings">
              <IconButton onClick={handleMenuOpen} size="small" sx={{ ml: 2 }}>
                <Avatar
                  src={user?.profilePhoto?.url || ''}
                  alt={user?.name || 'User'}
                  sx={{ width: 36, height: 36, border: '1px solid #0088ff' }}
                >
                  {user?.name?.charAt(0)}
                </Avatar>
              </IconButton>
            </Tooltip>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  minWidth: 160,
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  boxShadow: '0px 10px 20px rgba(0,0,0,0.05)',
                  borderRadius: 2
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleProfileClick} sx={{ fontSize: 14, color: '#1e293b' }}>
                <ListItemIcon sx={{ minWidth: '32px !important' }}>
                  <ProfileIcon fontSize="small" sx={{ color: '#0088ff' }} />
                </ListItemIcon>
                My Profile
              </MenuItem>
              <Divider sx={{ my: '4px !important', borderColor: '#f1f5f9' }} />
              <MenuItem onClick={handleLogoutClick} sx={{ fontSize: 14, color: 'error.main' }}>
                <ListItemIcon sx={{ minWidth: '32px !important', color: 'error.main' }}>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid #e2e8f0' },
          }}
        >
          {drawerContent}
        </Drawer>
        
        {/* Desktop permanent drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid #e2e8f0' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main viewport */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8 // spacing for fixed Appbar
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
