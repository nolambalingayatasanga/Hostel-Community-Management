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
  AccessTime as AccessTimeIcon
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
  const { counts, recentUsers, charts } = stats || {};

  const profileStats = stats?.profileStats || {};
  const eventStats = stats?.eventStats || {};
  const galleryStats = stats?.galleryStats || {};

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
      subtitle: `${counts?.staff || 0} staff + ${counts?.chairpersons || 0} chairpersons`,
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
                onClick={() => navigate('/members')}
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
