import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';
import API from '../../api';
import {
  Grid,
  Box,
  Typography,
  Chip,
  Stack
} from '@mui/material';
import {
  PhotoLibrary as GalleryIcon,
  Folder as FolderIcon,
  HourglassEmpty as HourglassIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import {
  SectionHeader,
  OverviewCard,
  ChartCard,
  OverviewCardsSkeleton,
  ChartSkeleton
} from './DashboardShared';

export default function GallerySection() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchGalleryData = async () => {
      try {
        const res = await API.get('/users/dashboard/gallery');
        if (isMounted && res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching gallery dashboard stats:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchGalleryData();
    return () => {
      isMounted = false;
    };
  }, []);

  const galleryStats = data?.galleryStats || {};
  const uploadRequestStats = data?.uploadRequestStats || {};
  const galleryTrend = galleryStats.uploadsByMonth || [];

  // ApexCharts Monthly Media Uploads Bar Chart
  const galleryCategories = galleryTrend.map((d) => d.period);
  const galleryValues = galleryTrend.map((d) => d.uploads);

  const galleryChartOptions = {
    chart: {
      type: 'bar',
      fontFamily: 'Inter, -apple-system, sans-serif',
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        borderRadiusApplication: 'top',
        columnWidth: '38%'
      }
    },
    colors: ['#EA580C'],
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: galleryCategories,
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
        formatter: (val) => `${val} uploads`
      }
    }
  };
  const gallerySeries = [{ name: 'Media Uploads', data: galleryValues }];

  return (
    <Box sx={{ mb: 4.5 }}>
      <SectionHeader
        icon={<GalleryIcon sx={{ fontSize: 20 }} />}
        title="Media Management & Gallery"
        actionText="Media Management"
        onAction={() => navigate('/request-upload')}
      />

      {loading ? (
        <>
          <OverviewCardsSkeleton count={4} height={170} />
          <Grid container spacing={{ xs: 2, md: 2.5 }}>
            <Grid size={{ xs: 12 }}>
              <ChartSkeleton height={240} />
            </Grid>
          </Grid>
        </>
      ) : (
        <>
          {/* Gallery Overview Cards - Clickable and redirect to relevant pages */}
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 2.5 }}>
            {/* Photos */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <OverviewCard
                title="Gallery Photos"
                value={Number(galleryStats?.totalPhotos || 0).toLocaleString()}
                subtitle="Curated community photos"
                icon={<GalleryIcon sx={{ fontSize: 22 }} />}
                color="#EA580C"
                bgLight="#FFF7ED"
                height={170}
                onClick={() => navigate('/gallery')}
              />
            </Grid>

            {/* Folders */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <OverviewCard
                title="Albums & Folders"
                value={Number(galleryStats?.totalFolders || 0).toLocaleString()}
                subtitle="Organized albums"
                icon={<FolderIcon sx={{ fontSize: 22 }} />}
                color="#D97706"
                bgLight="#FEF3C7"
                height={170}
                onClick={() => navigate('/gallery')}
              />
            </Grid>

            {/* Upload Queue Pending */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <OverviewCard
                title="Review Queue"
                value={Number(uploadRequestStats?.pending || 0).toLocaleString()}
                subtitle="Pending moderation"
                icon={<HourglassIcon sx={{ fontSize: 22 }} />}
                color="#CA8A04"
                bgLight="#FEF9C3"
                height={170}
                onClick={() => navigate('/request-upload')}
              />
            </Grid>

            {/* Approved Requests */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <OverviewCard
                title="Approved Media"
                value={Number(uploadRequestStats?.approved || 0).toLocaleString()}
                subtitle="Published to community"
                icon={<CheckCircleIcon sx={{ fontSize: 22 }} />}
                color="#16A34A"
                bgLight="#F0FDF4"
                height={170}
                onClick={() => navigate('/gallery')}
              />
            </Grid>
          </Grid>

          {/* Gallery Growth Chart (ApexCharts) */}
          <Grid container spacing={{ xs: 2, md: 2.5 }}>
            <Grid size={{ xs: 12 }}>
              <ChartCard
                title="Gallery Growth(by Month)"
                icon={<FolderIcon sx={{ color: '#EA580C', fontSize: 20 }} />}
                chartHeight={240}
                action={
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Chip size="small" label={`Total: ${uploadRequestStats?.total || 0}`} sx={{ bgcolor: '#F8FAFC', fontWeight: 600, fontSize: '11px', border: '1px solid #E2E8F0' }} />
                    <Chip size="small" label={`Rejected: ${uploadRequestStats?.rejected || 0}`} sx={{ bgcolor: '#FFF1F2', color: '#E11D48', fontWeight: 600, fontSize: '11px', border: '1px solid #FECDD3' }} />
                  </Stack>
                }
              >
                {galleryValues.length === 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>
                    <FolderIcon sx={{ fontSize: 36, opacity: 0.35, mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>No monthly media uploads recorded yet</Typography>
                  </Box>
                ) : (
                  <Chart options={galleryChartOptions} series={gallerySeries} type="bar" height={240} />
                )}
              </ChartCard>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
