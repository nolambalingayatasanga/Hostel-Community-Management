import React from 'react';
import {
  Card,
  Typography,
  Box,
  Stack,
  Chip,
  Button,
  Divider,
  Skeleton,
  Grid
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';

export const COLORS = ['#005BEA', '#00C2A8', '#7C3AED', '#F59E0B', '#0EA5E9', '#F43F5E', '#10B981', '#F97316'];
export const DASHBOARD_BG = '#F8FAFC';

/**
 * BottomWave: Subtle background SVG wave
 */
export const BottomWave = ({ color }) => (
  <svg
    viewBox="0 0 500 120"
    preserveAspectRatio="none"
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '44px',
      pointerEvents: 'none',
      zIndex: 0
    }}
  >
    <path
      d="M0,40 C150,110 350,-20 500,50 L500,120 L0,120 Z"
      fill={color}
      opacity="0.12"
    />
  </svg>
);

/**
 * OverviewCard: Standardized card with design tokens,
 * pastel badge, tracking uppercase label, bold value, and bottom wave.
 */
export const OverviewCard = ({
  title,
  value,
  subtitle,
  icon,
  color = '#0284C7',
  bgLight = '#EFF8FF',
  rightIcon = null,
  height = 175,
  badge = null,
  badgeBg = '#FEE2E2',
  badgeColor = '#DC2626',
  onClick = null
}) => {
  return (
    <Card
      onClick={onClick}
      sx={{
        borderRadius: { xs: '14px', sm: '18px' },
        border: '1px solid #EBF0F5',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        bgcolor: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        minHeight: { xs: 110, sm: height },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        transition: 'all 0.2s ease',
        ...(onClick && {
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            borderColor: color
          }
        })
      }}
    >
      <Box sx={{ p: { xs: 1.75, sm: 2.5 }, position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Top row: Icon box + Title + Right indicator */}
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} sx={{ alignItems: 'center', minWidth: 0, flex: 1 }}>
            <Box
              sx={{
                width: { xs: 34, sm: 42 },
                height: { xs: 34, sm: 42 },
                borderRadius: { xs: '10px', sm: '12px' },
                bgcolor: bgLight,
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                '& .MuiSvgIcon-root': {
                  fontSize: { xs: 18, sm: 22 }
                }
              }}
            >
              {icon}
            </Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                color: '#475569',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontSize: { xs: '0.68rem', sm: '0.75rem' },
                lineHeight: 1.2
              }}
            >
              {title}
            </Typography>
          </Stack>

          <Box
            sx={{
              width: { xs: 24, sm: 28 },
              height: { xs: 24, sm: 28 },
              borderRadius: '8px',
              bgcolor: bgLight,
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              ml: 1
            }}
          >
            {rightIcon || <TrendingUpIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />}
          </Box>
        </Stack>

        {/* Value + Subtitle */}
        <Box sx={{ mt: { xs: 1.25, sm: 2 } }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                color: '#0F172A',
                lineHeight: 1,
                fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.1rem' },
                letterSpacing: '-0.02em'
              }}
            >
              {value}
            </Typography>
          </Stack>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                display: { xs: 'none', sm: 'block' },
                color: '#64748B',
                fontWeight: 500,
                mt: 0.75,
                fontSize: '0.85rem'
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      <BottomWave color={color} />
    </Card>
  );
};

/**
 * SectionHeader: Visual grouping with icon, title, optional badge, and navigation button
 */
export const SectionHeader = ({
  icon,
  title,
  extra = null,
  actionText = null,
  onAction = null
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 1.5,
      mb: { xs: 1.25, sm: 2 },
      mt: { xs: 0.5, sm: 1 }
    }}
  >
    <Stack direction="row" spacing={{ xs: 1, sm: 1.25 }} sx={{ alignItems: 'center', minWidth: 0, flex: 1, flexWrap: 'nowrap' }}>
      <Box
        sx={{
          width: { xs: 28, sm: 36 },
          height: { xs: 28, sm: 36 },
          borderRadius: { xs: '8px', sm: '10px' },
          bgcolor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          color: '#2563EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          flexShrink: 0,
          '& .MuiSvgIcon-root': {
            fontSize: { xs: 16, sm: 20 }
          }
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 800,
          color: '#0F172A',
          fontSize: { xs: '0.84rem', sm: '1.02rem', md: '1.15rem' },
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {title}
      </Typography>
      {extra}
    </Stack>

    {actionText && onAction && (
      <Button
        size="small"
        onClick={onAction}
        endIcon={<ArrowIcon sx={{ fontSize: 15 }} />}
        sx={{
          display: { xs: 'none', sm: 'inline-flex' },
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '0.8rem',
          color: '#2563EB',
          bgcolor: '#EFF6FF',
          border: '1px solid #DBEAFE',
          borderRadius: '8px',
          px: 1.5,
          py: 0.45,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          '&:hover': {
            bgcolor: '#DBEAFE',
            borderColor: '#BFDBFE'
          }
        }}
      >
        {actionText}
      </Button>
    )}
  </Box>
);

/**
 * ChartCard: Standard responsive chart container
 */
export const ChartCard = ({ title, icon, children, chartHeight = 280, action = null }) => (
  <Card
    sx={{
      borderRadius: '18px',
      bgcolor: '#FFFFFF',
      border: '1px solid #EBF0F5',
      boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
      p: { xs: 1.5, sm: 2.5 },
      overflow: 'hidden'
    }}
  >
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 1.25,
        mb: { xs: 1.25, sm: 2 }
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: '#0F172A',
          fontSize: { xs: '0.84rem', sm: '0.95rem' }
        }}
      >
        {icon} {title}
      </Typography>
      {action && <Box sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}>{action}</Box>}
    </Box>
    <Divider sx={{ mb: 2, borderColor: '#F1F5F9' }} />
    <Box sx={{ width: '100%', height: chartHeight, minWidth: 0, position: 'relative' }}>
      {children}
    </Box>
  </Card>
);

/**
 * OverviewCardsSkeleton: Sleek animated skeleton for 4 overview cards
 */
export const OverviewCardsSkeleton = ({ count = 4, height = 170 }) => (
  <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 2.5 }}>
    {Array.from({ length: count }).map((_, idx) => (
      <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
        <Card
          sx={{
            borderRadius: '18px',
            border: '1px solid #EBF0F5',
            bgcolor: '#FFFFFF',
            minHeight: height,
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Skeleton variant="rounded" width={42} height={42} sx={{ borderRadius: '12px' }} />
              <Skeleton variant="text" width={90} height={20} />
            </Stack>
            <Skeleton variant="rounded" width={28} height={28} sx={{ borderRadius: '8px' }} />
          </Stack>
          <Box sx={{ mt: 2 }}>
            <Skeleton variant="text" width={100} height={42} />
            <Skeleton variant="text" width={150} height={18} sx={{ mt: 0.5 }} />
          </Box>
        </Card>
      </Grid>
    ))}
  </Grid>
);

/**
 * ChartSkeleton: Sleek skeleton for ChartCard
 */
export const ChartSkeleton = ({ height = 270 }) => (
  <Card
    sx={{
      borderRadius: '18px',
      bgcolor: '#FFFFFF',
      border: '1px solid #EBF0F5',
      p: 2.5
    }}
  >
    <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
    <Divider sx={{ mb: 2 }} />
    <Skeleton variant="rounded" width="100%" height={height} sx={{ borderRadius: '12px' }} />
  </Card>
);
