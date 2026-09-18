import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
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
  Button,
  CircularProgress,
  Menu,
  MenuItem
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
  ArrowBack as ArrowBackIcon,
  QrCodeScanner as QrCodeScannerIcon,
} from '@mui/icons-material';
import NotFound from '../pages/common/NotFound';

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

    // QR Scan Count page check
    if (path.startsWith('/qr-scan-count')) {
      return 'QR Scan Count';
    }

    // Access Control page check
    if (path === '/access-control') {
      return 'Access Control';
    }

    // Default formatting logic
    return path.substring(1).charAt(0).toUpperCase() + path.substring(2).replace('/', ' / ');
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
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

  // Icon mapping for backend navigation items
  const iconMap = {
    DashboardIcon: <DashboardIcon />,
    PeopleIcon: <PeopleIcon />,
    EventIcon: <EventIcon />,
    GalleryIcon: <GalleryIcon />,
    ProfileIcon: <ProfileIcon />,
    QrCodeIcon: <QrCodeScannerIcon />,
    AdminIcon: <AdminIcon />
  };

  // State to hold dynamic navigation tabs sent by backend based on logged-in user's role
  const [navItems, setNavItems] = useState([]);
  const [navLoading, setNavLoading] = useState(true);

  // Fetch permitted tabs from backend
  const fetchNavigation = async () => {
    try {
      const res = await API.get('/access/navigation');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setNavItems(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load navigation items from backend:', err);
    } finally {
      setNavLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNavigation();
    }

    const onPermissionsUpdated = () => {
      fetchNavigation();
    };
    window.addEventListener('access_permissions_updated', onPermissionsUpdated);
    return () => window.removeEventListener('access_permissions_updated', onPermissionsUpdated);
  }, [user]);

  // Map route path to access control page ID
  const getPageIdForPath = (pathname) => {
    if (pathname === '/dashboard') return 'overview';
    if (pathname === '/members') return 'users';
    if (pathname.startsWith('/events')) return 'events';
    if (pathname.startsWith('/gallery')) return 'gallery';
    if (pathname.startsWith('/profile')) return 'profile';
    if (pathname.startsWith('/qr-scan-count')) return 'qr_scan_count';
    if (pathname === '/access-control') return 'access_control';
    return null;
  };

  const currentPageId = getPageIdForPath(location.pathname);
  // An accessible page must be present in the backend-returned navItems
  const isPageAllowed = !currentPageId || navLoading || navItems.some(item => item.id === currentPageId);




  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0' }}>

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
        {navItems.map((item) => (
          <ListItem key={item.id || item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={
                location.pathname === item.path ||
                (item.path === '/profile' && location.pathname.startsWith('/profile')) ||
                (item.path === '/events' && location.pathname.startsWith('/events'))
              }
              sx={{
                borderRadius: "10px",
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
                {iconMap[item.icon] || <DashboardIcon />}
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

          {/* Right side header actions & user profile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box id="dashboard-header-actions" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }} />
         
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                elevation: 3,
                sx: { borderRadius: '12px', mt: 1, minWidth: 160 }
              }}
            >
              <MenuItem onClick={handleProfileClick}>
                <ListItemIcon><ProfileIcon fontSize="small" /></ListItemIcon>
                Profile
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogoutClick} sx={{ color: 'error.main' }}>
                <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
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
        {navLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress sx={{ color: '#0088ff' }} size={36} />
          </Box>
        ) : isPageAllowed ? (
          <Outlet />
        ) : (
          <NotFound
            message="Access Denied"
            customRedirectPath={navItems[0]?.path || '/profile'}
          />
        )}
      </Box>
    </Box>
  );
};

export default DashboardLayout;
