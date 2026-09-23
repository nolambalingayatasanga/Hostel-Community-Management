import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import {
  Grid,
  Box
} from '@mui/material';
import {
  Work as WorkIcon,
  Badge as BadgeIcon,
  TaskAlt as TaskAltIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import {
  SectionHeader,
  OverviewCard,
  OverviewCardsSkeleton
} from './DashboardShared';

export default function JobsSection() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchJobsData = async () => {
      try {
        const res = await API.get('/users/dashboard/jobs');
        if (isMounted && res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching jobs dashboard stats:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchJobsData();
    return () => {
      isMounted = false;
    };
  }, []);

  const jobStats = data?.jobStats || {};

  return (
    <Box sx={{ mb: 4.5 }}>
      <SectionHeader
        icon={<WorkIcon sx={{ fontSize: 20 }} />}
        title="Careers & Job Openings"
        actionText="Explore Jobs"
        onAction={() => navigate('/job-openings')}
      />

      {loading ? (
        <OverviewCardsSkeleton count={4} height={170} />
      ) : (
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
          {/* Active Openings */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <OverviewCard
              title="Active Openings"
              value={Number(jobStats?.active || 0).toLocaleString()}
              subtitle="Open for applications"
              icon={<WorkIcon sx={{ fontSize: 22 }} />}
              color="#16A34A"
              bgLight="#F0FDF4"
              height={170}
              onClick={() => navigate('/job-openings')}
            />
          </Grid>

          {/* Total Job Postings */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <OverviewCard
              title="Total Postings"
              value={Number(jobStats?.total || 0).toLocaleString()}
              subtitle={`${jobStats?.closed || 0} closed / filled`}
              icon={<BadgeIcon sx={{ fontSize: 22 }} />}
              color="#7C3AED"
              bgLight="#F3E8FF"
              height={170}
              onClick={() => navigate('/job-openings')}
            />
          </Grid>

          {/* Applications */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <OverviewCard
              title="Applications"
              value={Number(jobStats?.totalApplications || 0).toLocaleString()}
              subtitle="Student & alumni resumes"
              icon={<TaskAltIcon sx={{ fontSize: 22 }} />}
              color="#0284C7"
              bgLight="#EFF8FF"
              height={170}
              onClick={() => navigate('/job-openings')}
            />
          </Grid>

          {/* Partner Organizations */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <OverviewCard
              title="Partner Organizations"
              value={Number(jobStats?.totalOrganizations || 0).toLocaleString()}
              subtitle="Companies posting jobs"
              icon={<BusinessIcon sx={{ fontSize: 22 }} />}
              color="#4F46E5"
              bgLight="#EEF2FF"
              height={170}
              onClick={() => navigate('/job-openings')}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
