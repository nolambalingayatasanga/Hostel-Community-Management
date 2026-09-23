import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Skeleton,
  Stack
} from '@mui/material';

export default function ProfileSkeleton({ isDialog = false }) {
  return (
    <Box sx={{ flexGrow: 1, maxWidth: 1200, mx: 'auto', p: isDialog ? { xs: 1.5, sm: 2.5 } : { xs: 1, sm: 2 } }}>
      <Grid container spacing={{ xs: 2.5, sm: 3, md: 4 }}>
        {/* LEFT COLUMN: FORM SKELETON */}
        <Grid size={{ xs: 12, md: 8 }} sx={{ order: { xs: 2, md: 1 } }}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Stack spacing={4}>
                {/* Section 1 */}
                <Box>
                  <Skeleton variant="text" width={180} height={28} sx={{ mb: 2 }} />
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Skeleton variant="text" width={90} height={18} sx={{ mb: 0.75 }} />
                      <Skeleton variant="rounded" width="100%" height={40} sx={{ borderRadius: '8px' }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Skeleton variant="text" width={110} height={18} sx={{ mb: 0.75 }} />
                      <Skeleton variant="rounded" width="100%" height={40} sx={{ borderRadius: '8px' }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Skeleton variant="text" width={100} height={18} sx={{ mb: 0.75 }} />
                      <Skeleton variant="rounded" width="100%" height={40} sx={{ borderRadius: '8px' }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Skeleton variant="text" width={70} height={18} sx={{ mb: 0.75 }} />
                      <Skeleton variant="rounded" width="100%" height={40} sx={{ borderRadius: '8px' }} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Skeleton variant="text" width={140} height={18} sx={{ mb: 0.75 }} />
                      <Skeleton variant="rounded" width="100%" height={80} sx={{ borderRadius: '8px' }} />
                    </Grid>
                  </Grid>
                </Box>

                {/* Section 2 */}
                <Box>
                  <Skeleton variant="text" width={160} height={28} sx={{ mb: 2 }} />
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Skeleton variant="rounded" width="100%" height={40} sx={{ borderRadius: '8px' }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Skeleton variant="rounded" width="100%" height={40} sx={{ borderRadius: '8px' }} />
                    </Grid>
                  </Grid>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT COLUMN: SIDEBAR SKELETON */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ order: { xs: 1, md: 2 } }}>
          <Card sx={{ borderRadius: '16px', border: '1px solid #EAECF0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Skeleton variant="circular" width={104} height={104} sx={{ mb: 3 }} />
              <Stack spacing={2} sx={{ width: '100%' }}>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <Stack key={idx} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <Skeleton variant="rounded" width={22} height={22} sx={{ borderRadius: '4px' }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Skeleton variant="text" width="40%" height={14} />
                      <Skeleton variant="text" width="70%" height={18} />
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
