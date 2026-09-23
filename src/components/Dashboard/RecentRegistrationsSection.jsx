import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import {
  Grid,
  Box,
  Typography,
  Card,
  Chip,
  Stack,
  Avatar,
  Skeleton
} from '@mui/material';
import { Schedule as ScheduleIcon } from '@mui/icons-material';
import { SectionHeader } from './DashboardShared';

export default function RecentRegistrationsSection() {
  const navigate = useNavigate();
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchRecentUsers = async () => {
      try {
        const res = await API.get('/users/dashboard/recent');
        if (isMounted && res.data?.success) {
          setRecentUsers(res.data.data.recentUsers || []);
        }
      } catch (err) {
        console.error('Error fetching recent registrations:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchRecentUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!loading && recentUsers.length === 0) return null;

  return (
    <Box sx={{ mt: 4.5 }}>
      <SectionHeader
        icon={<ScheduleIcon sx={{ fontSize: 20 }} />}
        title="Recent Member Registrations"
        actionText="View All Members"
        onAction={() => navigate('/users')}
      />

      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} key={idx}>
              <Card
                sx={{
                  borderRadius: '16px',
                  bgcolor: '#FFFFFF',
                  border: '1px solid #EBF0F5',
                  p: 2
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Skeleton variant="circular" width={44} height={44} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Skeleton variant="text" width="80%" height={20} />
                    <Skeleton variant="text" width="60%" height={16} />
                    <Skeleton variant="rounded" width={50} height={18} sx={{ mt: 0.5, borderRadius: '4px' }} />
                  </Box>
                </Stack>
              </Card>
            </Grid>
          ))
        ) : (
          recentUsers.map((u) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} key={u._id}>
              <Card
                onClick={() => navigate('/users')}
                sx={{
                  borderRadius: '16px',
                  bgcolor: '#FFFFFF',
                  border: '1px solid #EBF0F5',
                  p: 2,
                  cursor: 'pointer',
                  userSelect: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                    borderColor: '#BAE6FD'
                  }
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Avatar
                    src={u.profilePhoto?.url || ''}
                    sx={{ width: 44, height: 44, bgcolor: '#0284C7', fontWeight: 700, fontSize: '16px' }}
                  >
                    {u.name?.charAt(0) || ''}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.email || 'No email'}
                    </Typography>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.5 }}>
                      <Chip
                        size="small"
                        label={u.role}
                        sx={{
                          height: 18,
                          fontSize: '9.5px',
                          fontWeight: 700,
                          bgcolor: u.role === 'STUDENT' ? '#F5F3FF' : u.role === 'ALUMNI' ? '#EEF2FF' : '#F1F5F9',
                          color: u.role === 'STUDENT' ? '#7C3AED' : u.role === 'ALUMNI' ? '#4F46E5' : '#475569'
                        }}
                      />
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '10.5px' }}>
                        {new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
}
