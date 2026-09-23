import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';
import API from '../../api';
import {
  Grid,
  Box,
  Typography,
  LinearProgress,
  Stack
} from '@mui/material';
import {
  People as PeopleIcon,
  Badge as BadgeIcon,
  School as StudentIcon,
  AccountCircle as ProfileCircleIcon,
  Verified as VerifiedIcon,
  Security as SecurityIcon,
  SupervisorAccount as SupervisorAccountIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  PersonOff as PersonOffIcon
} from '@mui/icons-material';
import {
  COLORS,
  SectionHeader,
  OverviewCard,
  ChartCard,
  OverviewCardsSkeleton,
  ChartSkeleton
} from './DashboardShared';

export default function CommunitySection() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCommunityData = async () => {
      try {
        const res = await API.get('/users/dashboard/community');
        if (isMounted && res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching community dashboard stats:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchCommunityData();
    return () => {
      isMounted = false;
    };
  }, []);

  const counts = data?.counts || {};
  const charts = data?.charts || {};
  const profileStats = data?.profileStats || {};

  const roleChartData = charts?.rolesDistribution || [];
  const accountStatusData = charts?.accountStatusDistribution || [];

  const profileBars = profileStats?.dimensions?.map((item) => ({
    metric: item.label,
    value: profileStats.total ? Math.round((item.value / profileStats.total) * 100) : 0,
    count: item.value
  })) || [];

  const profileCompletion = profileStats?.completePercent ?? 0;
  const totalProfiles = profileStats?.total || counts?.total || 0;
  const completeProfiles = profileStats?.complete || 0;

  // 1. Role Mix Donut Chart (ApexCharts)
  const roleLabels = roleChartData.map((d) => d._id || 'Unknown');
  const roleSeries = roleChartData.map((d) => d.value || 0);

  const roleDonutOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'Inter, -apple-system, sans-serif',
      toolbar: { show: false }
    },
    labels: roleLabels,
    colors: COLORS,
    stroke: { width: 2, colors: ['#ffffff'] },
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Users',
              fontSize: '12px',
              fontWeight: 700,
              color: '#64748B',
              formatter: () => totalProfiles.toLocaleString()
            },
            value: {
              fontSize: '20px',
              fontWeight: 900,
              color: '#0F172A'
            }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    legend: {
      position: 'bottom',
      fontSize: '11px',
      fontWeight: 600,
      markers: { radius: 12 },
      itemMargin: { horizontal: 8, vertical: 3 }
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} users`
      }
    }
  };

  // 2. Profile Completion Horizontal Bar Chart (ApexCharts)
  const profileCategories = profileBars.map((d) => d.metric);
  const profileValues = profileBars.map((d) => d.value);

  const profileChartOptions = {
    chart: {
      type: 'bar',
      fontFamily: 'Inter, -apple-system, sans-serif',
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 5,
        borderRadiusApplication: 'end',
        barHeight: '52%',
        distributed: true
      }
    },
    colors: ['#7C3AED', '#0284C7', '#00C2A8', '#F59E0B', '#0EA5E9', '#10B981', '#EC4899'],
    dataLabels: {
      enabled: true,
      textAnchor: 'start',
      style: { colors: ['#0F172A'], fontSize: '10.5px', fontWeight: 700 },
      formatter: (val) => `${val}%`,
      offsetX: 6
    },
    xaxis: {
      categories: profileCategories,
      max: 100,
      labels: {
        style: { fontSize: '10px', colors: '#64748B' },
        formatter: (val) => `${val}%`
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { fontSize: '11px', fontWeight: 600, colors: '#475569' }
      }
    },
    grid: {
      borderColor: '#F1F5F9',
      xaxis: { lines: { show: true } }
    },
    legend: { show: false },
    tooltip: {
      y: {
        formatter: (val, { dataPointIndex }) =>
          `${val}% completed (${profileBars[dataPointIndex]?.count || 0} members)`
      }
    }
  };
  const profileSeries = [{ name: 'Completion', data: profileValues }];

  // 3. Account Status Column Chart (ApexCharts)
  const statusLabels = accountStatusData.map((d) => d._id || 'ACTIVE');
  const statusValues = accountStatusData.map((d) => d.value || 0);

  const statusChartOptions = {
    chart: {
      type: 'bar',
      fontFamily: 'Inter, -apple-system, sans-serif',
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        borderRadiusApplication: 'top',
        columnWidth: '42%',
        distributed: true
      }
    },
    colors: ['#10B981', '#F59E0B', '#EF4444', '#6366F1'],
    dataLabels: {
      enabled: true,
      style: { fontSize: '11px', fontWeight: 700, colors: ['#FFFFFF'] }
    },
    xaxis: {
      categories: statusLabels,
      labels: {
        style: { fontSize: '11px', fontWeight: 700, colors: '#475569' }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { fontSize: '11px', colors: '#64748B' }
      }
    },
    grid: {
      borderColor: '#F1F5F9'
    },
    legend: { show: false },
    tooltip: {
      y: {
        formatter: (val) => `${val} accounts`
      }
    }
  };
  const statusSeries = [{ name: 'Accounts', data: statusValues }];

  return (
    <Box sx={{ mb: 4.5 }}>
      <SectionHeader
        icon={<PeopleIcon sx={{ fontSize: 20 }} />}
        title="Community & Directory Overview"
        actionText="View Full Directory"
        onAction={() => navigate('/users')}
      />

      {loading ? (
        <>
          <OverviewCardsSkeleton count={8} height={170} />
          <Grid container spacing={{ xs: 2, md: 2.5 }}>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <ChartSkeleton height={270} />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <ChartSkeleton height={270} />
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <ChartSkeleton height={270} />
            </Grid>
          </Grid>
        </>
      ) : (
        <>
          {/* Member Category Cards - Single Card for Every Role Data */}
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 2.5 }}>
            {/* 1. Members */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <OverviewCard
                title="Members"
                value={Number(counts?.members || 0).toLocaleString()}
                subtitle="Registered community members"
                icon={<PeopleIcon sx={{ fontSize: 22 }} />}
                color="#005BEA"
                bgLight="#EFF6FF"
                height={170}
                onClick={() => navigate('/users?tab=members')}
              />
            </Grid>

            {/* 2. Students */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <OverviewCard
                title="Students"
                value={Number(counts?.students || 0).toLocaleString()}
                subtitle="Enrolled community students"
                icon={<StudentIcon sx={{ fontSize: 22 }} />}
                color="#7C3AED"
                bgLight="#F5F3FF"
                height={170}
                onClick={() => navigate('/users?tab=students')}
              />
            </Grid>

            {/* 3. Alumni Network */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <OverviewCard
                title="Alumni Network"
                value={Number(counts?.alumni || 0).toLocaleString()}
                subtitle="Graduated member network"
                icon={<VerifiedIcon sx={{ fontSize: 22 }} />}
                color="#4F46E5"
                bgLight="#EEF2FF"
                height={170}
                onClick={() => navigate('/users?tab=alumni')}
              />
            </Grid>

            {/* 4. Staff */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <OverviewCard
                title="Staff"
                value={Number(counts?.staff || 0).toLocaleString()}
                subtitle="Hostel operations & staff"
                icon={<BadgeIcon sx={{ fontSize: 22 }} />}
                color="#0D9488"
                bgLight="#F0FDFA"
                height={170}
                onClick={() => navigate('/users?tab=staff')}
              />
            </Grid>

            {/* 5. Wardens */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <OverviewCard
                title="Wardens"
                value={Number(counts?.wardens || 0).toLocaleString()}
                subtitle="Hostel administrative wardens"
                icon={<SupervisorAccountIcon sx={{ fontSize: 22 }} />}
                color="#CA8A04"
                bgLight="#FEF9C3"
                height={170}
                onClick={() => navigate('/users?tab=warden')}
              />
            </Grid>

            {/* 6. Admin */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <OverviewCard
                title="Admin"
                value={Number(counts?.admins || 0).toLocaleString()}
                subtitle="Hostel system admins"
                icon={<SecurityIcon sx={{ fontSize: 22 }} />}
                color="#0284C7"
                bgLight="#EFF8FF"
                height={170}
                onClick={() => navigate('/users?tab=admin')}
              />
            </Grid>

            {/* 7. Administrator */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <OverviewCard
                title="Administrator"
                value={Number(counts?.administrators || 0).toLocaleString()}
                subtitle="Platform executive management"
                icon={<AdminPanelSettingsIcon sx={{ fontSize: 22 }} />}
                color="#6366F1"
                bgLight="#EEF2FF"
                height={170}
                onClick={() => navigate('/users?tab=admin')}
              />
            </Grid>

            {/* 8. Dropped Members */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <OverviewCard
                title="Dropped Members"
                value={Number(counts?.droppedTotal || 0).toLocaleString()}
                subtitle="Archived & dropped profiles"
                icon={<PersonOffIcon sx={{ fontSize: 22 }} />}
                color="#DC2626"
                bgLight="#FEF2F2"
                height={170}
                onClick={() => navigate('/users?tab=dropped')}
              />
            </Grid>
          </Grid>

          {/* Community Charts & Breakdowns (ApexCharts) */}
          <Grid container spacing={{ xs: 2, md: 2.5 }}>
            {/* Role Mix Donut */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <ChartCard title="User Mix by Role" icon={<PeopleIcon sx={{ color: '#005BEA', fontSize: 20 }} />} chartHeight={270}>
                {roleSeries.length === 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>
                    <PeopleIcon sx={{ fontSize: 36, opacity: 0.35, mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>No role data recorded yet</Typography>
                  </Box>
                ) : (
                  <Chart options={roleDonutOptions} series={roleSeries} type="donut" height={270} />
                )}
              </ChartCard>
            </Grid>

            {/* Profile Completion Dimensions */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <ChartCard title="Profile Completion Score" icon={<ProfileCircleIcon sx={{ color: '#7C3AED', fontSize: 20 }} />} chartHeight={270}>
                <Stack spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#64748B', fontSize: '12px' }}>
                    <strong>{profileCompletion}%</strong> of member profiles are complete ({completeProfiles}/{totalProfiles || 0} members).
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={profileCompletion}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: '#F1F5F9',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(90deg, #7C3AED, #0284C7)'
                      }
                    }}
                  />
                </Stack>
                <Chart options={profileChartOptions} series={profileSeries} type="bar" height={215} />
              </ChartCard>
            </Grid>

            {/* Account Status Distribution */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <ChartCard title="Account Verification Status" icon={<BadgeIcon sx={{ color: '#10B981', fontSize: 20 }} />} chartHeight={270}>
                {statusSeries[0]?.data?.length === 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>
                    <BadgeIcon sx={{ fontSize: 36, opacity: 0.35, mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>No status data recorded yet</Typography>
                  </Box>
                ) : (
                  <Chart options={statusChartOptions} series={statusSeries} type="bar" height={270} />
                )}
              </ChartCard>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
