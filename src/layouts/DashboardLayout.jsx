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
  CloudQueue as CloudQueueIcon,
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  RateReview as FeedbackIcon,
  Work as WorkIcon,
  Code as CodeIcon,
  Apartment as ApartmentIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Domain as DomainIcon
} from '@mui/icons-material';
import NotFound from '../pages/common/NotFound';
import AuthRequired from '../pages/common/AuthRequired';

const drawerWidth = 256;

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [customHeader, setCustomHeader] = useState(null);

  useEffect(() => {
    setCustomHeader(null);
  }, [location.pathname]);

  const getPageTitle = () => {
    const path = location.pathname;

    if (path === '/dashboard') return 'Overview Dashboard';
    if (path === '/users' || path === '/members' || path.startsWith('/admin/users')) return 'Directory & Members';
    if (path.startsWith('/events/') && path !== '/events/new') return 'Event Details';
    if (path === '/events') return 'Community Events';
    if (path.startsWith('/gallery')) return 'Photo Gallery';
    if (path.startsWith('/drive-links')) return 'Drive & Documents';
    if (path.startsWith('/profile')) return 'My Profile';
    if (path.startsWith('/qr-scan-count')) return 'QR Analytics';
    if (path === '/access-control') return 'Access & Permissions';
    if (path.startsWith('/request-upload')) return 'Share Media';
    if (path.startsWith('/job-openings')) return 'Career & Job Board';
    if (path.startsWith('/projects')) return 'Showcase Projects';
    if (path.startsWith('/facilities')) return 'Hostel Facilities';
    if (path.startsWith('/enquiry')) return 'Enquiries & Support';
    if (path.startsWith('/organizations')) return 'Partner Organizations';
    if (path.startsWith('/feedback')) return 'Feedback & Ratings';

    return path.substring(1).charAt(0).toUpperCase() + path.substring(2).replace('/', ' · ');
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
    DashboardIcon: <DashboardIcon fontSize="small" />,
    PeopleIcon: <PeopleIcon fontSize="small" />,
    EventIcon: <EventIcon fontSize="small" />,
    GalleryIcon: <GalleryIcon fontSize="small" />,
    CloudQueueIcon: <CloudQueueIcon fontSize="small" />,
    CloudUploadIcon: <CloudUploadIcon fontSize="small" />,
    WorkIcon: <WorkIcon fontSize="small" />,
    CodeIcon: <CodeIcon fontSize="small" />,
    ApartmentIcon: <ApartmentIcon fontSize="small" />,
    QuestionAnswerIcon: <QuestionAnswerIcon fontSize="small" />,
    DomainIcon: <DomainIcon fontSize="small" />,
    FeedbackIcon: <FeedbackIcon fontSize="small" />,
    ProfileIcon: <ProfileIcon fontSize="small" />,
    QrCodeIcon: <QrCodeScannerIcon fontSize="small" />,
    AdminIcon: <AdminIcon fontSize="small" />
  };

  // Public pages that anyone can view without login
  const PUBLIC_PATHS = ['/facilities', '/enquiry', '/feedback'];
  const isPublicRoute = PUBLIC_PATHS.some(p => location.pathname === p || location.pathname.startsWith(`${p}/`));

  // Default standard community tabs shown to guest visitors
  const DEFAULT_GUEST_NAV_ITEMS = [
    { id: 'profile', text: 'Profile', path: '/profile', icon: 'ProfileIcon' },
    { id: 'users', text: 'Users', path: '/users', icon: 'PeopleIcon' },
    { id: 'events', text: 'Events', path: '/events', icon: 'EventIcon' },
    { id: 'gallery', text: 'Gallery', path: '/gallery', icon: 'GalleryIcon' },
    { id: 'drive_links', text: 'Drive Links', path: '/drive-links', icon: 'CloudQueueIcon' },
    { id: 'projects', text: 'Projects', path: '/projects', icon: 'CodeIcon' },
    { id: 'request_upload', text: 'Share Media', path: '/request-upload', icon: 'CloudUploadIcon' },
    { id: 'job_openings', text: 'Job Openings', path: '/job-openings', icon: 'WorkIcon' },
    { id: 'facilities', text: 'Facilities', path: '/facilities', icon: 'ApartmentIcon' },
    { id: 'enquiry', text: 'Enquiry', path: '/enquiry', icon: 'QuestionAnswerIcon' },
    { id: 'feedback', text: 'Feedback', path: '/feedback', icon: 'FeedbackIcon' }
  ];

  const [navItems, setNavItems] = useState(user ? [] : DEFAULT_GUEST_NAV_ITEMS);
  const [navLoading, setNavLoading] = useState(user ? true : false);

  const fetchNavigation = async () => {
    try {
      const res = await API.get('/access/navigation');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setNavItems(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load navigation items from backend:', err);
      if (!user) {
        setNavItems(DEFAULT_GUEST_NAV_ITEMS);
      }
    } finally {
      setNavLoading(false);
    }
  };

  useEffect(() => {
    fetchNavigation();

    const onPermissionsUpdated = () => {
      fetchNavigation();
    };
    window.addEventListener('access_permissions_updated', onPermissionsUpdated);
    return () => window.removeEventListener('access_permissions_updated', onPermissionsUpdated);
  }, [user]);

  const getPageIdForPath = (pathname) => {
    if (pathname === '/dashboard') return 'overview';
    if (pathname === '/users' || pathname === '/members' || pathname.startsWith('/admin/users')) return 'users';
    if (pathname.startsWith('/projects')) return 'projects';
    if (pathname.startsWith('/facilities')) return 'facilities';
    if (pathname.startsWith('/enquiry')) return 'enquiry';
    if (pathname.startsWith('/organizations')) return 'organizations';
    if (pathname.startsWith('/events')) return 'events';
    if (pathname.startsWith('/gallery')) return 'gallery';
    if (pathname.startsWith('/drive-links')) return 'drive_links';
    if (pathname.startsWith('/request-upload')) return 'request_upload';
    if (pathname.startsWith('/job-openings')) return 'job_openings';
    if (pathname.startsWith('/feedback')) return 'feedback';
    if (pathname.startsWith('/profile')) return 'profile';
    if (pathname.startsWith('/qr-scan-count')) return 'qr_scan_count';
    if (pathname === '/access-control') return 'access_control';
    return null;
  };

  const currentPageId = getPageIdForPath(location.pathname);
  const isPageAllowed = !currentPageId || navLoading || navItems.some(item => item.id === currentPageId);

  const handleNavClick = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', borderRight: '1px solid rgba(226, 232, 240, 0.85)' }}>
      {/* Brand logo bar */}
      <Box sx={{ p: 2.25, pb: 1.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box
          onClick={() => navigate(user ? '/dashboard' : '/facilities')}
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', textDecoration: 'none' }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '11px',
              backgroundColor: '#0088ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: 'none',
              fontWeight: 800,
              fontSize: '18px',
              fontFamily: '"Outfit", sans-serif'
            }}
          >
            H
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontSize: '16px',
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1.2,
                fontFamily: '"Outfit", sans-serif',
                letterSpacing: '-0.02em'
              }}
            >
              Hostel<span style={{ color: '#0088ff' }}>Hub</span>
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              Community Portal
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={() => setMobileOpen(false)}
          sx={{ display: { xs: 'flex', md: 'none' }, color: '#64748B', p: 0.5 }}
          aria-label="close drawer"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* User Status Card */}
      <Box sx={{ px: 2, pb: 1.5 }}>
        <Box
          sx={{
            p: 1.25,
            borderRadius: '12px',
            bgcolor: 'rgba(241, 245, 249, 0.65)',
            border: '1px solid rgba(226, 232, 240, 0.75)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'rgba(241, 245, 249, 0.95)',
              borderColor: 'rgba(0, 136, 255, 0.25)'
            }
          }}
        >
          <Avatar
            sx={{
              width: 34,
              height: 34,
              bgcolor: user ? '#0088ff' : '#64748B',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: 'none'
            }}
            src={user?.profilePhoto?.url || ''}
          >
            {user ? (user.name?.charAt(0) || 'U') : 'G'}
          </Avatar>
          <Box sx={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
              {user ? user.name : 'Guest Visitor'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: user ? '#10b981' : '#94a3b8' }} />
              <Typography variant="caption" sx={{ color: user ? '#0088ff' : '#64748B', fontWeight: 600, fontSize: '11px' }}>
                {user ? user.role : 'Public Portal'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(226, 232, 240, 0.75)' }} />

      {/* Nav List */}
      <List sx={{ px: 1.5, py: 1.5, flexGrow: 1, overflowY: 'auto' }}>
        {navItems.map((item) => {
          const isSelected =
            location.pathname === item.path ||
            (item.path === '/profile' && location.pathname.startsWith('/profile')) ||
            (item.path === '/events' && location.pathname.startsWith('/events')) ||
            (item.path === '/projects' && location.pathname.startsWith('/projects'));

          return (
            <ListItem key={item.id || item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavClick(item.path)}
                selected={isSelected}
                sx={{
                  borderRadius: '10px',
                  py: 1,
                  px: 1.25,
                  color: isSelected ? '#0088ff' : '#475569',
                  backgroundColor: isSelected ? 'rgba(0, 136, 255, 0.08)' : 'transparent',
                  position: 'relative',
                  transition: 'all 0.18s ease',
                  '&:hover': {
                    backgroundColor: isSelected ? 'rgba(0, 136, 255, 0.12)' : 'rgba(241, 245, 249, 0.85)',
                    color: isSelected ? '#0088ff' : '#0f172a',
                    transform: 'translateX(2px)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(0, 136, 255, 0.09)',
                    color: '#0088ff',
                    fontWeight: 700,
                    '&:hover': {
                      backgroundColor: 'rgba(0, 136, 255, 0.14)',
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: -8,
                      top: '18%',
                      bottom: '18%',
                      width: 4,
                      borderRadius: '0 4px 4px 0',
                      backgroundColor: '#0088ff',
                    }
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 34,
                    color: isSelected ? '#0088ff' : '#64748b',
                    transition: 'color 0.15s ease',
                  }}
                >
                  {iconMap[item.icon] || <DashboardIcon fontSize="small" />}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      sx={{
                        fontSize: '13.5px',
                        fontWeight: isSelected ? 700 : 500,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {item.id === 'request_upload' || item.text === 'Request Upload' || item.text === 'Upload Memories' ? 'Share Media' : item.text}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(226, 232, 240, 0.75)' }} />

      {/* Drawer bottom actions */}
      {user ? (
        <Box sx={{ p: 1.5 }}>
          <ListItemButton
            onClick={() => {
              setMobileOpen(false);
              handleLogoutClick();
            }}
            sx={{
              borderRadius: '10px',
              py: 0.9,
              color: '#f43f5e',
              transition: 'all 0.15s ease',
              '&:hover': {
                backgroundColor: 'rgba(244, 63, 94, 0.08)',
                color: '#e11d48'
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography sx={{ fontSize: '13.5px', fontWeight: 600 }}>
                  Sign Out
                </Typography>
              }
            />
          </ListItemButton>
        </Box>
      ) : (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              setMobileOpen(false);
              navigate('/login', { state: { from: location.pathname } });
            }}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '13.5px',
              py: 0.9,
            }}
          >
            Sign In
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              setMobileOpen(false);
              navigate('/register', { state: { from: location.pathname } });
            }}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '13.5px',
              py: 0.9,
            }}
          >
            Create Account
          </Button>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.85)',
          boxShadow: 'none',
          color: '#0f172a'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '64px', px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: { xs: 1, sm: 2 }, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            {customHeader ? (
              customHeader
            ) : location.pathname.startsWith('/events/') && location.pathname !== '/events/new' ? (
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
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '0.95rem', sm: '1.25rem' },
                  color: '#0F172A',
                  letterSpacing: '-0.01em',
                  display: 'block',
                  maxWidth: { xs: 220, sm: 'none' },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {getPageTitle()}
              </Typography>
            )}
          </Box>

          {/* Right side header actions & user profile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box id="dashboard-header-actions" sx={{ display: 'flex', alignItems: 'center', gap: 1 }} />
            {user ? (
              <>
                <IconButton
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  size="small"
                  sx={{
                    p: '3px',
                    border: '1.5px solid #E2E8F0',
                    bgcolor: '#F8FAFC',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: '#CBD5E1',
                      bgcolor: '#F1F5F9',
                      transform: 'scale(1.02)'
                    }
                  }}
                  aria-label="account settings"
                >
                  <Avatar
                    src={user?.profilePhoto?.url || ''}
                    alt={user?.name || 'User'}
                    sx={{
                      width: 34,
                      height: 34,
                      fontSize: '14px',
                      fontWeight: 700,
                      bgcolor: '#0088ff',
                      boxShadow: 'none'
                    }}
                  >
                    {user?.name?.charAt(0) || 'U'}
                  </Avatar>
                </IconButton>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      borderRadius: '16px',
                      mt: 1.25,
                      minWidth: 220,
                      p: '8px',
                      border: '1px solid rgba(226, 232, 240, 0.85)',
                      boxShadow: 'none'
                    }
                  }}
                >
                  {/* User summary header */}
                  <Box sx={{ px: 1.5, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Avatar
                      src={user?.profilePhoto?.url || ''}
                      alt={user?.name || 'User'}
                      sx={{ width: 36, height: 36, fontSize: '13px', fontWeight: 700, bgcolor: '#0088ff' }}
                    >
                      {user?.name?.charAt(0) || 'U'}
                    </Avatar>
                    <Box sx={{ overflow: 'hidden', minWidth: 0 }}>
                      <Typography sx={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.name || 'User'}
                      </Typography>
                      <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#0088ff', bgcolor: 'rgba(0, 136, 255, 0.08)', px: 1, py: 0.2, borderRadius: '6px', display: 'inline-block', mt: 0.3 }}>
                        {user?.role || 'MEMBER'}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 0.75, borderColor: 'rgba(226, 232, 240, 0.8)' }} />

                  <MenuItem
                    onClick={handleProfileClick}
                    sx={{
                      borderRadius: '10px',
                      py: 1,
                      px: 1.25,
                      gap: 1.25,
                      color: '#334155',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: 'rgba(2, 132, 199, 0.06)', color: '#0284c7' }
                    }}
                  >
                    <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'rgba(2, 132, 199, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                      <ProfileIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography sx={{ fontSize: '13.5px', fontWeight: 600 }}>My Profile</Typography>
                  </MenuItem>

                  <MenuItem
                    onClick={handleLogoutClick}
                    sx={{
                      borderRadius: '10px',
                      py: 1,
                      px: 1.25,
                      gap: 1.25,
                      color: '#f43f5e',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: 'rgba(244, 63, 94, 0.06)', color: '#e11d48' }
                    }}
                  >
                    <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'rgba(244, 63, 94, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e' }}>
                      <LogoutIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography sx={{ fontSize: '13.5px', fontWeight: 600 }}>Sign Out</Typography>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/login', { state: { from: location.pathname } })}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    borderColor: 'rgba(2, 132, 199, 0.4)',
                    color: '#0284c7',
                    borderRadius: '10px',
                    px: 2,
                    py: 0.6,
                    '&:hover': { borderColor: '#0284c7', bgcolor: 'rgba(2, 132, 199, 0.06)' }
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate('/register', { state: { from: location.pathname } })}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    bgcolor: '#0284c7',
                    color: '#ffffff',
                    borderRadius: '10px',
                    px: 2,
                    py: 0.6,
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                    '&:hover': { bgcolor: '#0369a1' }
                  }}
                >
                  Create Account
                </Button>
              </Box>
            )}
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
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid rgba(226, 232, 240, 0.85)' },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop permanent drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid rgba(226, 232, 240, 0.85)' },
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
          p: { xs: 1.5, sm: 2.5, md: 3 },
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          maxWidth: { xs: '100vw', md: '100%' },
          overflowX: 'clip',
          boxSizing: 'border-box',
          mt: { xs: 7, sm: 8 } // spacing for fixed Appbar
        }}
      >
        {navLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress sx={{ color: '#0088ff' }} size={36} />
          </Box>
        ) : !user ? (
          isPublicRoute ? (
            <Outlet context={{ customHeader, setCustomHeader }} />
          ) : (
            <AuthRequired />
          )
        ) : isPageAllowed ? (
          <Outlet context={{ customHeader, setCustomHeader }} />
        ) : (
          <NotFound
            message="Access Denied"
            customRedirectPath={navItems[0]?.path || '/facilities'}
          />
        )}
      </Box>
    </Box>
  );
};

export default DashboardLayout;
