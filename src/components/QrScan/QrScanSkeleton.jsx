import React from 'react';
import { Box, Card, CardContent, Grid, Skeleton, Stack } from '@mui/material';

export default function QrScanSkeleton() {
  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Grid key={`qr-card-skel-${i}`} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                borderRadius: '18px',
                border: '1px solid #EBF0F5',
                bgcolor: '#FFFFFF',
                minHeight: 180,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                p: 2.5
              }}
            >
              <CardContent sx={{ p: 0 }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                    <Skeleton variant="rounded" width={42} height={42} sx={{ borderRadius: '12px' }} />
                    <Skeleton variant="text" width={110} height={18} />
                  </Stack>
                  <Skeleton variant="rounded" width={28} height={28} sx={{ borderRadius: '8px' }} />
                </Stack>
                <Box sx={{ mt: 2.5 }}>
                  <Skeleton variant="text" width={80} height={44} />
                  <Skeleton variant="text" width={100} height={20} sx={{ mt: 0.5 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
