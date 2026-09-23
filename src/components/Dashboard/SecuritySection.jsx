import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import {
  Grid,
  Box,
  Typography,
  Card,
  Chip,
  Stack
} from '@mui/material';
import {
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutlined as ErrorOutlineIcon,
  Feedback as FeedbackIcon,
  HourglassEmpty as HourglassIcon,
  LockReset as LockResetIcon
} from '@mui/icons-material';
import {
  SectionHeader,
  OverviewCard,
  OverviewCardsSkeleton
} from './DashboardShared';

export default function SecuritySection() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchSecurityData = async () => {
      try {
        const res = await API.get('/users/dashboard/security');
        if (isMounted && res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching security dashboard stats:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSecurityData();
    return () => {
      isMounted = false;
    };
  }, []);

  const passwordResetStats = data?.passwordResetStats || {};
  const feedbackStats = data?.feedbackStats || {};

  const totalResetUsage = (passwordResetStats?.usage?.otp || 0) + (passwordResetStats?.usage?.redirectLink || 0);
  const otpPercent = totalResetUsage > 0 ? Math.round(((passwordResetStats?.usage?.otp || 0) / totalResetUsage) * 100) : 0;
  const linkPercent = totalResetUsage > 0 ? 100 - otpPercent : 0;

  return (
    <Box sx={{ mb: 4.5 }}>
      <SectionHeader
        icon={<SecurityIcon sx={{ fontSize: 20 }} />}
        title="Platform Health & User Inquiries"
        actionText="Feedback Center"
        onAction={() => navigate('/feedback')}
      />

      {loading ? (
        <OverviewCardsSkeleton count={4} height={170} />
      ) : (
        <>
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 2.5 }}>
            {/* Successful Emails */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <OverviewCard
                title="Emails Sent"
                value={Number(passwordResetStats?.emails?.successful || 0).toLocaleString()}
                subtitle="Delivered to user inboxes"
                icon={<CheckCircleIcon sx={{ fontSize: 22 }} />}
                color="#16A34A"
                bgLight="#F0FDF4"
                height={170}
                onClick={() => navigate('/feedback')}
              />
            </Grid>

            {/* Failed Emails */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <OverviewCard
                title="Failed Emails"
                value={Number(passwordResetStats?.emails?.failed || 0).toLocaleString()}
                subtitle="Bounced or SMTP errors"
                icon={<ErrorOutlineIcon sx={{ fontSize: 22 }} />}
                color="#E11D48"
                bgLight="#FFF1F2"
                height={170}
                onClick={() => navigate('/feedback')}
              />
            </Grid>

            {/* Total Inquiries */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <OverviewCard
                title="Total Enquiries"
                value={Number(feedbackStats?.total || 0).toLocaleString()}
                subtitle="Community support tickets"
                icon={<FeedbackIcon sx={{ fontSize: 22 }} />}
                color="#0284C7"
                bgLight="#EFF8FF"
                height={170}
                onClick={() => navigate('/feedback')}
              />
            </Grid>

            {/* Pending Responses */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <OverviewCard
                title="Pending Tickets"
                value={Number(feedbackStats?.pending || 0).toLocaleString()}
                subtitle={`${feedbackStats?.resolved || 0} tickets resolved`}
                icon={<HourglassIcon sx={{ fontSize: 22 }} />}
                color="#CA8A04"
                bgLight="#FEF9C3"
                height={170}
                onClick={() => navigate('/feedback')}
              />
            </Grid>
          </Grid>

          {/* Verification Method Breakdown bar */}
          {totalResetUsage > 0 && (
            <Card
              sx={{
                borderRadius: '18px',
                bgcolor: '#FFFFFF',
                border: '1px solid #EBF0F5',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                p: { xs: 2, sm: 2.5 }
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5, mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: 'rgba(0,136,255,0.08)', color: '#0088ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LockResetIcon sx={{ fontSize: 20 }} />
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    Password Reset Verification Methods
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={`Total Resets: ${totalResetUsage}`}
                  sx={{ bgcolor: '#F8FAFC', fontWeight: 700, fontSize: '11px', border: '1px solid #E2E8F0' }}
                />
              </Box>

              <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.75 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2563EB' }} />
                  OTP Code: {passwordResetStats?.usage?.otp || 0} ({otpPercent}%)
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#7C3AED', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#7C3AED' }} />
                  Direct Link: {passwordResetStats?.usage?.redirectLink || 0} ({linkPercent}%)
                </Typography>
              </Stack>
              <Box sx={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', bgcolor: '#E2E8F0' }}>
                <Box sx={{ width: `${otpPercent}%`, bgcolor: '#2563EB', transition: 'width 0.4s ease' }} />
                <Box sx={{ width: `${linkPercent}%`, bgcolor: '#7C3AED', transition: 'width 0.4s ease' }} />
              </Box>
            </Card>
          )}
        </>
      )}
    </Box>
  );
}
