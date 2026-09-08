import React, { useEffect, useState } from 'react';
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
  Button
} from '@mui/material';
import {
  School as StudentIcon,
  Work as AlumniIcon,
  SupervisorAccount as AgentIcon,
  Badge as StaffIcon,
  Security as MemberIcon,
  Event as EventIcon,
  TrendingUp as TrendIcon,
  ArrowForward as ArrowIcon
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
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0088ff', '#6366F1', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  const isStudentAlumniStaff = ['STUDENT', 'ALUMNI', 'STAFF'].includes(user?.role);

  useEffect(() => {
    if (isStudentAlumniStaff) {
      navigate('/profile');
    }
  }, [isStudentAlumniStaff, navigate]);

  const isAdminOrChairperson = ['ADMIN', 'CHAIRPERSON'].includes(user?.role);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        if (isAdminOrChairperson) {
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
        setError('Could not load dashboard statistics.');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, isAdminOrChairperson]);

  if (isStudentAlumniStaff) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: '#0088ff' }} />
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: '#0088ff' }} />
      </Box>
    );
  }

  // 1. NON-PRIVILEGED VIEW (Student, Alumni, Staff, Member)
  if (!isAdminOrChairperson) {
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
                  <TrendIcon sx={{ color: '#0088ff' }} /> Community Notice
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

  // Formatted data for Pie chart
  const roleChartData = charts?.rolesDistribution?.map(item => ({
    name: item._id,
    value: item.value
  })) || [];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: '#111827' }}>
        Administrator Portal
      </Typography>

      {/* Grid of Count Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card sx={{ textAlign: 'center', p: 1 }}>
            <CardContent>
              <StudentIcon sx={{ fontSize: 32, color: '#0088ff', mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{counts?.students}</Typography>
              <Typography variant="caption" color="text.secondary">Students</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card sx={{ textAlign: 'center', p: 1 }}>
            <CardContent>
              <AlumniIcon sx={{ fontSize: 32, color: '#6366F1', mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{counts?.alumni}</Typography>
              <Typography variant="caption" color="text.secondary">Alumni</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card sx={{ textAlign: 'center', p: 1 }}>
            <CardContent>
              <AgentIcon sx={{ fontSize: 32, color: '#10B981', mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{counts?.members}</Typography>
              <Typography variant="caption" color="text.secondary">Community Members</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={2.4}>
          <Card sx={{ textAlign: 'center', p: 1 }}>
            <CardContent>
              <StaffIcon sx={{ fontSize: 32, color: '#F59E0B', mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{counts?.staff}</Typography>
              <Typography variant="caption" color="text.secondary">Staff Members</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ textAlign: 'center', p: 1, border: '1px solid rgba(0,136,255,0.25)' }}>
            <CardContent>
              <MemberIcon sx={{ fontSize: 32, color: '#0088ff', mb: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#0088ff' }}>{counts?.chairpersons}</Typography>
              <Typography variant="caption" color="text.secondary">Board Chairpersons</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Panels */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {/* Role Distribution (Pie) */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: 400 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Users by Role
              </Typography>
              <Box sx={{ flexGrow: 1, minHeight: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {roleChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Age Groups Distribution */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: 400 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Age Distribution (Demographics)
              </Typography>
              <Box sx={{ flexGrow: 1, minHeight: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.ageDistribution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <ChartTooltip cursor={{ fill: 'rgba(0,136,255,0.04)' }} />
                    <Bar dataKey="count" fill="#0088ff" radius={[4, 4, 0, 0]}>
                      {(charts?.ageDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Second Row Charts */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {/* Students by College */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 350 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Students by College
              </Typography>
              <Box sx={{ flexGrow: 1, minHeight: 240 }}>
                {charts?.studentsByCollege?.length === 0 ? (
                  <Typography align="center" color="text.secondary" sx={{ pt: 10 }}>No college data found.</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts?.studentsByCollege || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="_id" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <ChartTooltip cursor={{ fill: 'rgba(0,136,255,0.04)' }} />
                      <Bar dataKey="count" fill="#0088ff" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Alumni by Company */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 350 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Alumni by Company
              </Typography>
              <Box sx={{ flexGrow: 1, minHeight: 240 }}>
                {charts?.alumniByCompany?.length === 0 ? (
                  <Typography align="center" color="text.secondary" sx={{ pt: 10 }}>No alumni company data found.</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts?.alumniByCompany || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="_id" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <ChartTooltip cursor={{ fill: 'rgba(0,136,255,0.04)' }} />
                      <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Registrations & Quick Actions */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Recent Registrations
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                {recentUsers?.map((u) => (
                  <ListItem
                    key={u._id}
                    onClick={() => navigate(`/profile/${u._id}`)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 2,
                      mb: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(0,136,255,0.04)'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={u.profilePhoto?.url || ''}>
                        {u.name?.charAt(0) || ''}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={u.name}
                      secondary={`${u.email} | Role: ${u.role}`}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Upcoming Community Events ({counts?.upcomingEvents || 0})
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                {upcomingEvents.map((evt) => (
                  <ListItem key={evt._id} disableGutters sx={{ py: 1 }}>
                    <ListItemText
                      primary={evt.title}
                      secondary={`${new Date(evt.eventDate).toLocaleDateString()} | Location: ${evt.location}`}
                    />
                  </ListItem>
                ))}
              </List>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/events')}
                sx={{ mt: 2 }}
              >
                Manage Events Calendar
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
