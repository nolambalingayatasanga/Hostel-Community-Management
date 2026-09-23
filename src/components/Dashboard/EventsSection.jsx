import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';
import API from '../../api';
import {
  Grid,
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar
} from '@mui/material';
import {
  Event as EventIcon,
  Today as TodayIcon,
  TaskAlt as TaskAltIcon,
  AccessTime as AccessTimeIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import {
  SectionHeader,
  OverviewCard,
  ChartCard,
  OverviewCardsSkeleton,
  ChartSkeleton
} from './DashboardShared';

export default function EventsSection() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchEventsData = async () => {
      try {
        const res = await API.get('/users/dashboard/events');
        if (isMounted && res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching events dashboard stats:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchEventsData();
    return () => {
      isMounted = false;
    };
  }, []);

  const eventStats = data?.eventStats || {};
  const upcomingEvents = data?.upcomingEvents || [];
  const eventTrend = eventStats.trend || [];

  // ApexCharts 6-Month Spline Area Chart
  const eventCategories = eventTrend.map((d) => d.period);
  const eventValues = eventTrend.map((d) => d.events);

  const eventChartOptions = {
    chart: {
      type: 'area',
      fontFamily: 'Inter, -apple-system, sans-serif',
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    stroke: {
      curve: 'smooth',
      width: 3,
      colors: ['#0284C7']
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 95, 100],
        colorStops: [
          { offset: 0, color: '#0284C7', opacity: 0.45 },
          { offset: 100, color: '#0284C7', opacity: 0.02 }
        ]
      }
    },
    markers: {
      size: 4,
      colors: ['#0284C7'],
      strokeColors: '#ffffff',
      strokeWidth: 2,
      hover: { size: 6 }
    },
    xaxis: {
      categories: eventCategories,
      labels: {
        style: { fontSize: '11px', colors: '#64748B', fontWeight: 600 }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { fontSize: '11px', colors: '#64748B' },
        formatter: (val) => Math.round(val)
      }
    },
    grid: {
      borderColor: '#F1F5F9',
      strokeDashArray: 3
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} events`
      }
    }
  };
  const eventSeries = [{ name: 'Events', data: eventValues }];

  return (
    <Box sx={{ mb: 4.5 }}>
      <SectionHeader
        icon={<EventIcon sx={{ fontSize: 20 }} />}
        title="Events & Activities"
        actionText="Manage Events"
        onAction={() => navigate('/events')}
      />

      {loading ? (
        <>
          <OverviewCardsSkeleton count={4} height={170} />
          <Grid container spacing={{ xs: 2, md: 2.5 }}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <ChartSkeleton height={260} />
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <ChartSkeleton height={260} />
            </Grid>
          </Grid>
        </>
      ) : (
        <>
          {/* Events Overview Cards - Clickable and redirect to /events */}
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 2.5 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <OverviewCard
                title="Total Events"
                value={Number(eventStats?.total || 0).toLocaleString()}
                subtitle="Community events held"
                icon={<EventIcon sx={{ fontSize: 22 }} />}
                color="#0284C7"
                bgLight="#EFF8FF"
                height={170}
                onClick={() => navigate('/events')}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <OverviewCard
                title="Upcoming Events"
                value={Number(eventStats?.upcoming || 0).toLocaleString()}
                subtitle="Scheduled gatherings"
                icon={<TodayIcon sx={{ fontSize: 22 }} />}
                color="#16A34A"
                bgLight="#F0FDF4"
                height={170}
                onClick={() => navigate('/events')}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <OverviewCard
                title="Past Events"
                value={Number(eventStats?.past || 0).toLocaleString()}
                subtitle="Completed community events"
                icon={<TaskAltIcon sx={{ fontSize: 22 }} />}
                color="#7C3AED"
                bgLight="#F5F3FF"
                height={170}
                onClick={() => navigate('/events')}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <OverviewCard
                title="Event Horizon"
                value={`${eventTrend?.length || 6} Months`}
                subtitle="Trend tracking window"
                icon={<AccessTimeIcon sx={{ fontSize: 22 }} />}
                color="#EA580C"
                bgLight="#FFF7ED"
                height={170}
                onClick={() => navigate('/events')}
              />
            </Grid>
          </Grid>

          <Grid container spacing={{ xs: 2, md: 2.5 }}>
            {/* 6-Month Event Trend (ApexCharts) */}
            <Grid size={{ xs: 12, lg: 7 }}>
              <ChartCard title="Event Trends (Last 6 Months)" icon={<AccessTimeIcon sx={{ color: '#0EA5E9', fontSize: 20 }} />} chartHeight={260}>
                {eventValues.length === 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>
                    <AccessTimeIcon sx={{ fontSize: 36, opacity: 0.35, mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>No event trend data recorded yet</Typography>
                  </Box>
                ) : (
                  <Chart options={eventChartOptions} series={eventSeries} type="area" height={260} />
                )}
              </ChartCard>
            </Grid>

            {/* Upcoming Events Preview */}
            <Grid size={{ xs: 12, lg: 5 }}>
              <ChartCard
                title={`Upcoming Events (${upcomingEvents.length})`}
                icon={<EventIcon sx={{ color: '#16A34A', fontSize: 20 }} />}
                chartHeight={260}
                action={
                  <Button size="small" onClick={() => navigate('/events')} sx={{ textTransform: 'none', fontWeight: 600, fontSize: '12px' }}>
                    View All
                  </Button>
                }
              >
                {upcomingEvents.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <EventIcon sx={{ fontSize: 36, color: '#CBD5E1', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: '#64748B' }}>
                      No upcoming events scheduled.
                    </Typography>
                  </Box>
                ) : (
                  <List disablePadding sx={{ overflowY: 'auto', maxHeight: 250 }}>
                    {upcomingEvents.map((evt) => (
                      <ListItem
                        key={evt._id}
                        onClick={() => navigate(`/events/${evt._id}`)}
                        sx={{
                          px: 1.5,
                          py: 1.25,
                          borderRadius: '12px',
                          mb: 1,
                          bgcolor: '#F8FAFC',
                          border: '1px solid #EEF2F6',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          '&:hover': { bgcolor: '#F0F9FF', borderColor: '#BAE6FD' }
                        }}
                        secondaryAction={<ArrowIcon sx={{ fontSize: 16, color: '#94A3B8' }} />}
                      >
                        <ListItemAvatar sx={{ minWidth: 46 }}>
                          <Avatar src={evt.coverImage?.url || ''} variant="rounded" sx={{ width: 36, height: 36, bgcolor: '#E0F2FE', color: '#0284C7' }}>
                            <EventIcon sx={{ fontSize: 18 }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: { xs: 180, sm: 240 } }}>
                              {evt.title}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" sx={{ color: '#0284C7', fontWeight: 600, display: 'block' }}>
                              {new Date(evt.startDate || evt.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              {evt.location ? ` • ${evt.location}` : ''}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </ChartCard>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
