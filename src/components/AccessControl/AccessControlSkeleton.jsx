import React from 'react';
import { Box, Card, Skeleton, Stack } from '@mui/material';

export default function AccessControlSkeleton() {
  return (
    <Box sx={{ width: '100%', maxWidth: 1440, margin: '0 auto', p: { xs: 1.5, sm: 2.5 } }}>
      {/* Header Skeleton */}
      <Box sx={{ mb: { xs: 2, sm: 3 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Skeleton variant="text" width={220} height={38} />
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Skeleton variant="rounded" width={85} height={28} sx={{ borderRadius: '16px' }} />
          <Skeleton variant="rounded" width={80} height={28} sx={{ borderRadius: '16px' }} />
          <Skeleton variant="rounded" width={120} height={36} sx={{ borderRadius: '10px' }} />
        </Stack>
      </Box>

      {/* Selector Card Skeleton */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          p: { xs: 1.5, sm: 2.5 },
          mb: { xs: 2, sm: 3 }
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <Skeleton variant="rounded" width={30} height={30} sx={{ borderRadius: '8px' }} />
          <Skeleton variant="text" width={180} height={24} />
        </Stack>
        <Stack spacing={2}>
          <Skeleton variant="rounded" width="100%" height={56} sx={{ borderRadius: '10px' }} />
          <Skeleton variant="rounded" width="100%" height={56} sx={{ borderRadius: '10px' }} />
        </Stack>
      </Card>

      {/* Active Privileges Card Skeleton */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          p: { xs: 1.5, sm: 2.5 },
          mb: { xs: 2, sm: 3 }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Skeleton variant="rounded" width={110} height={28} sx={{ borderRadius: '6px' }} />
            <Skeleton variant="text" width={20} height={20} />
            <Skeleton variant="rounded" width={90} height={28} sx={{ borderRadius: '6px' }} />
          </Stack>
          <Skeleton variant="rounded" width={120} height={28} sx={{ borderRadius: '6px' }} />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' },
            gap: 2
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={`priv-skel-${i}`} variant="rounded" height={105} sx={{ borderRadius: '12px' }} />
          ))}
        </Box>
      </Card>

      {/* Matrix Card Skeleton */}
      <Card
        elevation={0}
        sx={{
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          p: { xs: 1.5, sm: 2.5 }
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <Skeleton variant="rounded" width={24} height={24} sx={{ borderRadius: '6px' }} />
          <Skeleton variant="text" width={200} height={24} />
        </Stack>
        <Skeleton variant="rounded" width="100%" height={260} sx={{ borderRadius: '10px' }} />
      </Card>
    </Box>
  );
}
