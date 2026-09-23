import React from 'react';
import { PhoneIphone as PhoneIcon, Computer as DesktopIcon, TabletMac as TabletIcon } from '@mui/icons-material';

export const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const DeviceIcon = ({ type }) => {
  if (type === 'mobile') return <PhoneIcon sx={{ fontSize: 18, color: '#0284C7' }} />;
  if (type === 'tablet') return <TabletIcon sx={{ fontSize: 18, color: '#7C3AED' }} />;
  return <DesktopIcon sx={{ fontSize: 18, color: '#475467' }} />;
};

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
