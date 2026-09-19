import React, { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Divider,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Button,
  LinearProgress,
  Stack
} from '@mui/material';
import {
  People as PeopleIcon,
  Badge as BadgeIcon,
  School as StudentIcon,
  Event as EventIcon,
  ArrowForward as ArrowIcon,
  AccountCircle as ProfileCircleIcon,
  PhotoLibrary as GalleryIcon,
  Folder as FolderIcon,
  Verified as VerifiedIcon,
  BarChart as BarChartIcon,
  Schedule as ScheduleIcon,
  TaskAlt as TaskAltIcon,
  AccessTime as AccessTimeIcon,
  LockReset as LockResetIcon,
  ErrorOutlined as ErrorOutlineIcon,
  VpnKey as VpnKeyIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
  , AreaChart,
  Area
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#005BEA', '#00C2A8', '#7C3AED', '#F59E0B', '#0EA5E9', '#F43F5E', '#10B981', '#F97316'];
const DASHBOARD_BG = '#F4F8FF';
const CARD_BORDER = '1px solid #E6ECFF';
const PRIMARY = '#0088ff';
const PRIMARY_SOFT = '#EAF3FF';

const Dashboard = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  const isAdminOrWarden = ['ADMIN', 'WARDEN'].includes(user?.role);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        if (isAdminOrWarden) {
          const res = await API.get('/users/dashboard/stats');
          if (res.data?.success) {
            setStats(res.data.data);
          }
        }
        
        // Fetch upcoming events for all roles
        const eventsRes = await API.get('/events?filter=upcoming');
        if (eventsRes.data?.success) {
          setUpcomingEvents(eventsRes.data.data.slice(0, 3));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        const errMsg = 'Could not load dashboard statistics.';
        setError(errMsg);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAdminOrWarden]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: '#0088ff' }} />
      </Box>
    );
  }

  // 1. NON-PRIVILEGED VIEW (Student, Alumni, Staff, Member)
  if (!isAdminOrWarden) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        {/* Welcome Banner */}
        <Card
          sx={{
            p: 3,
            mb: 4,
            background: 'linear-gradient(135deg, rgba(0,136,255,0.06) 0%, rgba(99,102,241,0.06) 100%)',
            border: '1px solid rgba(0,136,255,0.15)'
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                src={user?.profilePhoto?.url || ''}
                sx={{ width: 80, height: 80, border: '3px solid #0088ff' }}
              >
                {user?.name?.charAt(0)}
              </Avatar>
            </Grid>
            <Grid item xs={12} sm>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                Welcome back, {user?.name}!
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                You are registered as a <span style={{ color: '#0088ff', fontWeight: 'bold' }}>{user?.role}</span> in the Hostel Community.
              </Typography>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                onClick={() => navigate('/profile')}
                endIcon={<ArrowIcon />}
              >
                My Profile
              </Button>
            </Grid>
          </Grid>
        </Card>

        <Grid container spacing={4}>
          {/* Quick Info Card */}
          <Grid item xs={12} md={7}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BarChartIcon sx={{ color: '#0088ff' }} /> Community Notice
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                  Welcome to the centralized Hostel Community Portal. This system helps bridge connection between current Students, our senior Alumni network, Hostel Wardens/Staff, and parent representatives.
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                  Please ensure your address details, education history, and current employment/business profiles are fully completed and updated so peers can discover and connect with you.
                </Typography>
                
                {user?.role === 'STUDENT' && (
                  <Box sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(0,136,255,0.04)', border: '1px solid rgba(0,136,255,0.12)' }}>
                    <Typography variant="subtitle2" sx={{ color: '#0088ff', fontWeight: 700, mb: 1 }}>
                      Student Status
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#374151' }}>
                      College: {user?.education?.college || 'Not Completed'} <br />
                      Course: {user?.education?.course || 'Not Completed'} <br />
                      Graduation Year: {user?.education?.endYear || 'Not Completed'}
                    </Typography>
                  </Box>
                )}

                {user?.role === 'ALUMNI' && (
                  <Box sx={{ p: 2, borderRadius: 2, backgroundColor: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)' }}>
                    <Typography variant="subtitle2" sx={{ color: '#6366F1', fontWeight: 700, mb: 1 }}>
                      Alumni Status
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#374151' }}>
                      Occupation: {user?.employment?.occupation || 'Not Completed'} <br />
                      Company: {user?.employment?.organization || 'Not Completed'} <br />
                      Graduation Year: {user?.education?.endYear || 'Not Completed'}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Upcoming Events */}
          <Grid item xs={12} md={5}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EventIcon sx={{ color: '#0088ff' }} /> Upcoming Events
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {upcomingEvents.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', py: 4, textAlign: 'center' }}>
                    No upcoming events scheduled. Check back later!
                  </Typography>
                ) : (
                  <List>
                    {upcomingEvents.map((evt) => (
                      <ListItem
                        key={evt._id}
                        alignItems="flex-start"
                        secondaryAction={
                          <IconButton edge="end" onClick={() => navigate(`/events/${evt._id}`)}>
                            <ArrowIcon sx={{ color: '#0088ff' }} />
                          </IconButton>
                        }
                        sx={{ px: 0 }}
                      >
                        <ListItemAvatar>
                          <Avatar src={evt.coverImage?.url || ''} variant="rounded" sx={{ width: 48, height: 48 }}>
                            <EventIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={evt.title}
                          secondary={
                            <>
                              <Typography component="span" variant="caption" sx={{ color: '#0088ff', display: 'block', mt: 0.5 }}>
                                {new Date(evt.eventDate).toLocaleDateString(undefined, { dateStyle: 'medium' })} | {evt.startTime}
                              </Typography>
                              <Typography component="span" variant="caption" sx={{ color: 'text.disabled' }}>
                                Location: {evt.location}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
                
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/events')}
                  sx={{ mt: 2 }}
                >
                  View All Events
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // 2. PRIVILEGED ADMIN/MEMBER DASHBOARD VIEW
  const { counts, recentUsers, charts, passwordResetStats } = stats || {};

  const profileStats = stats?.profileStats || {};
  const eventStats = stats?.eventStats || {};
  const galleryStats = stats?.galleryStats || {};
  const resetStats = stats?.passwordResetStats || passwordResetStats || {
    emails: { successful: 0, failed: 0, total: 0 },
    usage: { otp: 0, redirectLink: 0, total: 0 }
  };
  const totalResetUsage = (resetStats.usage?.otp || 0) + (resetStats.usage?.redirectLink || 0);
  const otpPercent = totalResetUsage > 0 ? Math.round(((resetStats.usage?.otp || 0) / totalResetUsage) * 100) : 0;
  const linkPercent = totalResetUsage > 0 ? (100 - otpPercent) : 0;

  // Formatted data for Pie chart
  const roleChartData = charts?.rolesDistribution?.map(item => ({
    name: item._id,
    value: item.value
  })) || [];

  const accountStatusData = charts?.accountStatusDistribution?.map((item) => ({
    name: item._id || 'UNSPECIFIED',
    value: item.value
  })) || [];

  const profileBars = profileStats?.dimensions?.map((item) => ({
    metric: item.label,
    value: profileStats.total ? Math.round((item.value / profileStats.total) * 100) : 0,
    count: item.value
  })) || [];

  const eventTrend = eventStats.trend || charts?.eventTrend || [];
  const galleryTrend = galleryStats.uploadsByMonth || charts?.galleryUploadsByMonth || [];

  const profileCompletion = profileStats?.completePercent ?? 0;
  const totalProfiles = profileStats?.total || counts?.total || 0;
  const completeProfiles = profileStats?.complete || 0;

  const keyTiles = [
    {
      title: 'Total People',
      value: counts?.total || 0,
      subtitle: `${counts?.students || 0} students + ${counts?.alumni || 0} alumni`,
      icon: <PeopleIcon />,
      iconColor: '#005BEA',
      accent: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)'
    },
    {
      title: 'Student Community',
      value: counts?.students || 0,
      subtitle: `${counts?.alumni || 0} alumni`,
      icon: <StudentIcon />,
      iconColor: '#7C3AED',
      accent: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)'
    },
    {
      title: 'Events',
      value: eventStats?.total ?? counts?.upcomingEvents ?? 0,
      subtitle: `${eventStats?.upcoming ?? counts?.upcomingEvents ?? 0} upcoming • ${eventStats?.past || 0} completed`,
      icon: <EventIcon />,
      iconColor: '#0EA5E9',
      accent: 'linear-gradient(135deg, #ECFEFF, #D9F9FE)'
    },
    {
      title: 'Gallery Assets',
      value: galleryStats?.totalPhotos || 0,
      subtitle: `${galleryStats?.totalFolders || 0} folders`,
      icon: <GalleryIcon />,
      iconColor: '#F97316',
      accent: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)'
    },
    {
      title: 'Profile Completion',
      value: `${profileCompletion}%`,
      subtitle: `${completeProfiles}/${totalProfiles || 0} complete`,
      icon: <TaskAltIcon />,
      iconColor: '#10B981',
      accent: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)'
    },
    {
      title: 'Active Roles',
      value: counts?.admins || 0,
      subtitle: `${counts?.staff || 0} staff + ${counts?.wardens || counts?.chairpersons || 0} wardens`,
      icon: <VerifiedIcon />,
      iconColor: '#F59E0B',
      accent: 'linear-gradient(135deg, #FEF3C7, #FEF9C3)'
    }
  ];

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100%', backgroundColor: DASHBOARD_BG, p: { xs: 2, md: 2.5 }, pb: 3 }}>
      <Box
        sx={{
          mb: 3,
          p: { xs: 2.25, md: 3 },
          borderRadius: 3,
          background: 'linear-gradient(135deg, #0088ff 0%, #005BEA 50%, #5B21B6 100%)',
          border: '1px solid rgba(14, 165, 233, 0.35)',
          boxShadow: '0 22px 45px rgba(15, 23, 42, 0.24)'
        }}
      >
        <Grid container alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#FFFFFF', mb: 0.75, letterSpacing: '-0.015em' }}>
              Executive Overview
            </Typography>
            <Typography variant="body1" sx={{ color: '#D7E2FF', maxWidth: 760, lineHeight: 1.65 }}>
              Central dashboard for profile, member, gallery, and event health with real-time visibility into completion rates and activity.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack spacing={1} direction="row" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap" sx={{ rowGap: 1, columnGap: 1 }}>
              <Button
                variant="contained"
                onClick={() => navigate('/users')}
                startIcon={<PeopleIcon />}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 2, backgroundColor: '#fff', color: '#1D4ED8', '&:hover': { backgroundColor: '#EAF2FF' } }}
              >
                Open Members
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/events')}
                startIcon={<EventIcon />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  borderColor: 'rgba(255,255,255,0.7)',
                  px: 2,
                  '&:hover': { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.12)' }
                }}
              >
                Open Events
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {keyTiles.map((tile) => (
          <Grid item xs={12} sm={6} md={4} lg={4} key={tile.title}>
            <Card
              sx={{
                borderRadius: 2.5,
                minHeight: 144,
                background: tile.accent,
                border: CARD_BORDER,
                transition: 'all 220ms ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 14px 28px rgba(15, 23, 42, 0.16)'
                }
              }}
            >
              <CardContent sx={{ height: '100%' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.04em', fontWeight: 700 }}>
                      {tile.title}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', mt: 1.25, mb: 0.5 }}>
                      {tile.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tile.subtitle}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: '16px',
                      display: 'grid',
                      placeItems: 'center',
                      color: tile.iconColor,
                      background: `${tile.iconColor}18`,
                      border: `1px solid ${tile.iconColor}3A`
                    }}
                  >
                    {tile.icon}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ─── Password Reset Activity & Method Analytics ─── */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 2.75,
          background: '#FFFFFF',
          border: CARD_BORDER,
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
          overflow: 'hidden'
        }}
      >
        <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            gap={1.5}
            sx={{ mb: 2.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: '14px',
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'rgba(0, 136, 255, 0.1)',
                  color: '#0088ff',
                  border: '1px solid rgba(0, 136, 255, 0.2)'
                }}
              >
                <LockResetIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: { xs: '16px', sm: '18px' }, lineHeight: 1.2 }}>
                  Password Reset & Authentication Activity
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px', mt: 0.25 }}>
                  Real-time metrics for reset emails delivery and OTP vs Direct Link completion
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                bgcolor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                px: 1.8,
                py: 0.6,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                Total Emails Triggered:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                {resetStats.emails?.total || 0}
              </Typography>
            </Box>
          </Stack>

          {/* ROW 1: SUCCESSFUL vs FAILED EMAILS */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="overline" sx={{ fontWeight: 800, color: '#475569', letterSpacing: '0.06em', mb: 1.5, display: 'block', fontSize: '11.5px' }}>
              Reset Password Emails Sent
            </Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    p: 2.25,
                    borderRadius: 2.5,
                    background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                    border: '1.5px solid #BBF7D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 10px rgba(22, 101, 52, 0.05)'
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Successful Emails
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#14532D', my: 0.5, fontSize: { xs: '28px', sm: '34px' } }}>
                      {resetStats.emails?.successful || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#15803D', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TaskAltIcon sx={{ fontSize: 15 }} /> Delivered to user inboxes
                    </Typography>
                  </Box>
                  <Box sx={{ width: 48, height: 48, borderRadius: '16px', bgcolor: 'rgba(22, 101, 52, 0.12)', color: '#166534', display: 'grid', placeItems: 'center' }}>
                    <TaskAltIcon sx={{ fontSize: 28 }} />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    p: 2.25,
                    borderRadius: 2.5,
                    background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)',
                    border: '1.5px solid #FECDD3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 10px rgba(159, 18, 57, 0.05)'
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#9F1239', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Failed Emails
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#881337', my: 0.5, fontSize: { xs: '28px', sm: '34px' } }}>
                      {resetStats.emails?.failed || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#BE123C', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ErrorOutlineIcon sx={{ fontSize: 15 }} /> Delivery bounced or SMTP error
                    </Typography>
                  </Box>
                  <Box sx={{ width: 48, height: 48, borderRadius: '16px', bgcolor: 'rgba(159, 18, 57, 0.12)', color: '#9F1239', display: 'grid', placeItems: 'center' }}>
                    <ErrorOutlineIcon sx={{ fontSize: 28 }} />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2.5, borderColor: '#F1F5F9' }} />

          {/* ROW 2: OTP USAGE vs REDIRECT LINK USAGE */}
          <Box>
            <Typography variant="overline" sx={{ fontWeight: 800, color: '#475569', letterSpacing: '0.06em', mb: 1.5, display: 'block', fontSize: '11.5px' }}>
              Password Reset Method Usage
            </Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    p: 2.25,
                    borderRadius: 2.5,
                    background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                    border: '1.5px solid #BFDBFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 10px rgba(30, 64, 175, 0.05)'
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      OTP Code Usage
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#1E3A8A', my: 0.5, fontSize: { xs: '28px', sm: '34px' } }}>
                      {resetStats.usage?.otp || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 600 }}>
                      Completed via 6-digit OTP verification ({otpPercent}% of resets)
                    </Typography>
                  </Box>
                  <Box sx={{ width: 48, height: 48, borderRadius: '16px', bgcolor: 'rgba(30, 64, 175, 0.12)', color: '#1E40AF', display: 'grid', placeItems: 'center' }}>
                    <VpnKeyIcon sx={{ fontSize: 26 }} />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    p: 2.25,
                    borderRadius: 2.5,
                    background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
                    border: '1.5px solid #DDD6FE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 10px rgba(91, 33, 182, 0.05)'
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#5B21B6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Redirect Link Usage
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#4C1D95', my: 0.5, fontSize: { xs: '28px', sm: '34px' } }}>
                      {resetStats.usage?.redirectLink || 0}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#6D28D9', fontWeight: 600 }}>
                      Completed directly via email redirect link ({linkPercent}% of resets)
                    </Typography>
                  </Box>
                  <Box sx={{ width: 48, height: 48, borderRadius: '16px', bgcolor: 'rgba(91, 33, 182, 0.12)', color: '#5B21B6', display: 'grid', placeItems: 'center' }}>
                    <LinkIcon sx={{ fontSize: 26 }} />
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Segmented Comparison Bar */}
            {totalResetUsage > 0 && (
              <Box sx={{ mt: 2.5, p: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#1877F2' }} />
                    OTP Verification: {resetStats.usage?.otp || 0} ({otpPercent}%)
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#5B21B6', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#7C3AED' }} />
                    Redirect Link: {resetStats.usage?.redirectLink || 0} ({linkPercent}%)
                  </Typography>
                </Stack>
                <Box sx={{ height: 10, borderRadius: 5, overflow: 'hidden', display: 'flex', bgcolor: '#E2E8F0' }}>
                  <Box sx={{ width: `${otpPercent}%`, bgcolor: '#1877F2', transition: 'width 0.4s ease' }} />
                  <Box sx={{ width: `${linkPercent}%`, bgcolor: '#7C3AED', transition: 'width 0.4s ease' }} />
                </Box>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={4}>
          <ChartCard title="User Mix by Role" icon={<PeopleIcon sx={{ color: '#005BEA' }} />}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleChartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={98}
                  innerRadius={38}
                  paddingAngle={3}
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {roleChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={28} iconType="circle" />
                <ChartTooltip
                  contentStyle={{ borderRadius: 10, fontSize: 12, borderColor: '#D0D5DD' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        <Grid item xs={12} lg={4}>
          <ChartCard title="Profile Completion Score" icon={<ProfileCircleIcon sx={{ color: '#7C3AED' }} />}>
            <Stack spacing={1.4} sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {profileCompletion}% of profiles are complete across total members.
              </Typography>
              <LinearProgress
                variant="determinate"
                value={profileCompletion}
                sx={{
                  height: 9,
                  borderRadius: 6,
                  '& .MuiLinearProgress-bar': {
                    background: `linear-gradient(90deg, #7C3AED, #3B82F6)`
                  }
                }}
              />
            </Stack>
            <Box sx={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                data={profileBars}
                  layout="vertical"
                  margin={{ top: 0, right: 12, left: 48, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6ECF7" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis
                    type="category"
                    dataKey="metric"
                    width={112}
                    tick={{ fontSize: 11, fill: '#344054' }}
                  />
                  <ChartTooltip />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={14} fill={PRIMARY}>
                    {profileBars.map((_, index) => (
                      <Cell key={`profile-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </ChartCard>
        </Grid>

        <Grid item xs={12} lg={4}>
          <ChartCard title="Account Status Distribution" icon={<BadgeIcon sx={{ color: '#10B981' }} />}>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={accountStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6ECF7" />
                  <XAxis dataKey="name" tick={{ fill: '#344054', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#344054', fontSize: 12 }} />
                  <ChartTooltip cursor={{ fill: `${PRIMARY_SOFT}` }} />
                  <Bar dataKey="value" barSize={32} radius={[10, 10, 0, 0]} fill="url(#statusGradient)">
                    {accountStatusData.map((entry, index) => (
                      <Cell key={`status-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Bar>
                  <defs>
                    <linearGradient id="statusGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0.45} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </ChartCard>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={6}>
          <ChartCard title="Event Trends (Last 6 months)" icon={<AccessTimeIcon sx={{ color: '#0EA5E9' }} />} chartHeight={316}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={eventTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6ECF7" />
                <XAxis dataKey="period" tick={{ fill: '#344054' }} />
                <YAxis tick={{ fill: '#344054' }} />
                <ChartTooltip
                  contentStyle={{ borderRadius: 10, borderColor: '#D0D5DD' }}
                  formatter={(value) => [`${value} events`, 'Events']}
                />
                <Area
                  type="monotone"
                  dataKey="events"
                  stroke="#0066FF"
                  fill="url(#eventGradient)"
                  fillOpacity={0.85}
                />
                <defs>
                  <linearGradient id="eventGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0066FF" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0066FF" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        <Grid item xs={12} lg={6}>
          <ChartCard title="Gallery Growth (Last 6 months)" icon={<FolderIcon sx={{ color: '#F97316' }} />} chartHeight={316}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={galleryTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6ECF7" />
                <XAxis dataKey="period" tick={{ fill: '#344054' }} />
                <YAxis tick={{ fill: '#344054' }} />
                <ChartTooltip cursor={{ fill: 'rgba(249,115,22,0.08)' }} />
                <Bar dataKey="uploads" fill="url(#galleryGradient)" barSize={28} radius={[10, 10, 0, 0]} />
                <defs>
                  <linearGradient id="galleryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F97316" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#FDBA74" stopOpacity={0.35} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ChartCard title="Recent Registrations" icon={<ScheduleIcon sx={{ color: '#6366F1' }} />} chartHeight={276}>
            <List sx={{ pt: 1 }}>
              {recentUsers?.map((u) => (
                <ListItem
                  key={u._id}
                  onClick={() => navigate(`/profile/${u._id}`)}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 2,
                    mb: 1,
                    border: CARD_BORDER,
                    transition: 'all 180ms ease',
                    '&:hover': {
                      backgroundColor: PRIMARY_SOFT,
                      transform: 'translateX(2px)'
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={u.profilePhoto?.url || ''}>{u.name?.charAt(0) || ''}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={u.name}
                    secondary={`${u.email || 'No Email'} • ${u.role}`}
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </ChartCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <ChartCard title={`Upcoming Community Events (${eventStats?.upcoming || counts?.upcomingEvents || 0})`} icon={<BarChartIcon sx={{ color: '#10B981' }} />} chartHeight={276}>
            <List sx={{ pt: 1 }}>
              {upcomingEvents.map((evt) => (
                <ListItem key={evt._id} disableGutters sx={{ py: 1, borderRadius: 2 }}>
                  <ListItemText
                    primary={evt.title}
                    secondary={`${new Date(evt.eventDate).toLocaleDateString()} • ${evt.location}`}
                  />
                </ListItem>
              ))}
            </List>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/events')}
              sx={{ mt: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Manage Events Calendar
            </Button>
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
};

const ChartCard = ({ title, icon, children, chartHeight = 300 }) => (
  <Card
    sx={{
      borderRadius: 2.75,
      background: '#FFFFFF',
      border: CARD_BORDER,
      minHeight: chartHeight + 76,
      height: '100%',
      boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)',
      overflow: 'hidden'
    }}
  >
    <CardContent sx={{ height: '100%', px: 2, py: 2.25 }}>
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 800,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: '#111827'
        }}
      >
        {icon} {title}
      </Typography>
      <Divider sx={{ mb: 2, opacity: 0.7 }} />
      <Box sx={{ height: chartHeight }}>{children}</Box>
    </CardContent>
  </Card>
);

export default Dashboard;
