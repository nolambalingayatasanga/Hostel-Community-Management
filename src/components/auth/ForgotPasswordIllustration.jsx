import React from 'react';
import { Box } from '@mui/material';

const ForgotPasswordIllustration = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        mb: 2
      }}
    >
      <svg
        width="220"
        height="170"
        viewBox="0 0 220 170"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Subtle soft shadow for the document card */}
          <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1E3A8A" floodOpacity="0.08" />
          </filter>
          {/* Linear gradient for the envelope front flap */}
          <linearGradient id="envGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          {/* Linear gradient for the lock badge */}
          <linearGradient id="lockBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E70EB" />
            <stop offset="100%" stopColor="#0D59D1" />
          </linearGradient>
        </defs>

        {/* ─── 1. Organic Light Blue Cloud Blob ─── */}
        <path
          d="M 52 116
             C 36 102 38 74 58 58
             C 74 46 98 48 110 56
             C 122 42 150 42 164 56
             C 180 70 182 94 171 112
             C 184 128 172 152 148 154
             C 132 156 118 148 106 150
             C 90 154 72 150 62 138
             C 50 132 46 124 52 116 Z"
          fill="#EEF6FF"
        />

        {/* ─── 2. Accent Sparkle (✦) on Bottom Left ─── */}
        <path
          d="M 54 105
             Q 54 113 46 113
             Q 54 113 54 121
             Q 54 113 62 113
             Q 54 113 54 105 Z"
          fill="#93C5FD"
        />

        {/* ─── 3. Top Radiating Rays ─── */}
        <line x1="110" y1="32" x2="110" y2="24" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="100" y1="34" x2="94" y2="27" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="120" y1="34" x2="126" y2="27" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />

        {/* ─── 4. Paper Card emerging from Envelope ─── */}
        <g filter="url(#cardShadow)">
          <rect
            x="76"
            y="44"
            width="68"
            height="70"
            rx="9"
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth="1.2"
          />

          {/* Faint document lines */}
          <line x1="87" y1="56" x2="97" y2="56" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
          <line x1="123" y1="56" x2="133" y2="56" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />

          {/* Blue Circular Lock Badge */}
          <circle cx="110" cy="72" r="14.5" fill="url(#lockBadgeGrad)" />

          {/* White Padlock Icon inside Circle */}
          {/* Shackle */}
          <path
            d="M 105.5 70 V 66 C 105.5 63.5 107.5 61.5 110 61.5 C 112.5 61.5 114.5 63.5 114.5 66 V 70"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Lock Body */}
          <rect x="104" y="69" width="12" height="9.5" rx="2" fill="#FFFFFF" />
          {/* Keyhole */}
          <circle cx="110" cy="73.2" r="1.1" fill="#1877F2" />
          <path d="M 109.4 73.8 L 110.6 73.8 L 110.9 76.2 L 109.1 76.2 Z" fill="#1877F2" />
        </g>

        {/* ─── 5. Open Blue Envelope ─── */}
        {/* Envelope Back Wall */}
        <path
          d="M 64 74 L 110 102 L 156 74 L 156 128 C 156 130 154 132 152 132 L 68 132 C 66 132 64 130 64 128 Z"
          fill="#1D4ED8"
        />

        {/* Envelope Left Side Flap */}
        <path
          d="M 64 75 L 110 107 L 64 132 Z"
          fill="#2563EB"
        />

        {/* Envelope Right Side Flap */}
        <path
          d="M 156 75 L 110 107 L 156 132 Z"
          fill="#1D4ED8"
        />

        {/* Envelope Bottom Front Flap */}
        <path
          d="M 64 132 L 110 97 L 156 132 Z"
          fill="url(#envGrad)"
        />

        {/* ─── 6. Dotted Arc to Paper Plane ─── */}
        <path
          d="M 148 102 C 166 102 178 92 182 76"
          fill="none"
          stroke="#93C5FD"
          strokeWidth="2"
          strokeDasharray="3 4"
          strokeLinecap="round"
        />

        {/* ─── 7. Flying Blue Paper Airplane ─── */}
        <g transform="translate(182, 54) rotate(-10)">
          {/* Main Body / Left Wing */}
          <path
            d="M 22 0 L 0 8 L 8 18 Z"
            fill="#3B82F6"
          />
          {/* Right Wing Fold */}
          <path
            d="M 22 0 L 8 18 L 14 15 Z"
            fill="#1D4ED8"
          />
          {/* Underside / Keel */}
          <path
            d="M 8 18 L 9 22 L 13 18 Z"
            fill="#1E40AF"
          />
        </g>
      </svg>
    </Box>
  );
};

export default ForgotPasswordIllustration;
