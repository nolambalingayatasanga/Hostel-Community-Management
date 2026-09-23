import React from 'react';
import { Box, Card, Skeleton, Stack, Grid } from '@mui/material';

export default function ShareMediaSkeleton({ isForm = false }) {
  if (isForm) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={2.5}>
              <Card sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <Skeleton variant="text" width={180} height={28} />
                <Skeleton variant="text" width={260} height={18} sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  {[1, 2, 3].map((i) => (
                    <Grid key={i} size={{ xs: 12, sm: 4 }}>
                      <Skeleton variant="rounded" height={100} sx={{ borderRadius: '12px' }} />
                    </Grid>
                  ))}
                </Grid>
              </Card>

              <Card sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <Skeleton variant="text" width={160} height={26} />
                <Skeleton variant="rounded" height={50} sx={{ borderRadius: '10px', my: 2 }} />
                <Skeleton variant="rounded" height={140} sx={{ borderRadius: '12px' }} />
              </Card>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <Skeleton variant="text" width={140} height={24} />
              <Skeleton variant="rounded" height={44} sx={{ borderRadius: '10px', my: 2 }} />
              <Skeleton variant="rounded" height={80} sx={{ borderRadius: '10px', mb: 2 }} />
              <Skeleton variant="rounded" height={42} sx={{ borderRadius: '10px' }} />
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Card sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Skeleton variant="rounded" width={80} height={32} sx={{ borderRadius: '8px' }} />
            <Skeleton variant="rounded" width={80} height={32} sx={{ borderRadius: '8px' }} />
            <Skeleton variant="rounded" width={80} height={32} sx={{ borderRadius: '8px' }} />
          </Stack>
          <Skeleton variant="rounded" width={220} height={36} sx={{ borderRadius: '10px' }} />
        </Stack>

        <Stack spacing={1.5}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={`req-row-${i}`} variant="rounded" height={52} sx={{ borderRadius: '8px' }} />
          ))}
        </Stack>
      </Card>
    </Box>
  );
}
