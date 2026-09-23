import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import {
  Grid,
  Box
} from '@mui/material';
import {
  QrCode2 as QrCodeIcon,
  AdsClick as ClickIcon,
  Today as TodayIcon,
  Devices as DevicesIcon
} from '@mui/icons-material';
import {
  SectionHeader,
  OverviewCard,
  OverviewCardsSkeleton
} from './DashboardShared';

export default function QrDriveSection() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchQrData = async () => {
      try {
        const res = await API.get('/users/dashboard/qr');
        if (isMounted && res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching QR dashboard stats:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchQrData();
    return () => {
      isMounted = false;
    };
  }, []);

  const qrStats = data?.qrStats || {};
  const driveStats = data?.driveStats || {};

  return (
    <Box sx={{ mb: 4.5 }}>
      <SectionHeader
        icon={<QrCodeIcon sx={{ fontSize: 20 }} />}
        title="QR Portal Engagement & Drive Links"
        actionText="View QR Analytics"
        onAction={() => navigate('/qr-scan-count')}
      />

      {loading ? (
        <OverviewCardsSkeleton count={4} height={170} />
      ) : (
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
          {/* Total Scans */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <OverviewCard
              title="Total QR Scans"
              value={Number(qrStats?.scanCount || 0).toLocaleString()}
              subtitle="Scanned via camera"
              icon={<QrCodeIcon sx={{ fontSize: 22 }} />}
              color="#0284C7"
              bgLight="#EFF8FF"
              height={170}
              onClick={() => navigate('/qr-scan-count')}
            />
          </Grid>

          {/* Direct Clicks */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <OverviewCard
              title="Direct Clicks"
              value={Number(qrStats?.clickCount || 0).toLocaleString()}
              subtitle="Links opened directly"
              icon={<ClickIcon sx={{ fontSize: 22 }} />}
              color="#16A34A"
              bgLight="#F0FDF4"
              height={170}
              onClick={() => navigate('/qr-scan-count')}
            />
          </Grid>

          {/* Today Activity */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <OverviewCard
              title="Today's Activity"
              value={Number(qrStats?.todayActivity || 0).toLocaleString()}
              subtitle={`${qrStats?.todayScans || 0} scans • ${qrStats?.todayClicks || 0} clicks`}
              icon={<TodayIcon sx={{ fontSize: 22 }} />}
              color="#CA8A04"
              bgLight="#FEF9C3"
              height={170}
              onClick={() => navigate('/qr-scan-count')}
            />
          </Grid>

          {/* Unique Devices & Drive Links */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <OverviewCard
              title="Unique Devices"
              value={Number(qrStats?.uniqueDeviceCount || 0).toLocaleString()}
              subtitle={`${driveStats?.total || 0} active drive links`}
              icon={<DevicesIcon sx={{ fontSize: 22 }} />}
              color="#7C3AED"
              bgLight="#F3E8FF"
              height={170}
              onClick={() => navigate('/drive-links')}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
