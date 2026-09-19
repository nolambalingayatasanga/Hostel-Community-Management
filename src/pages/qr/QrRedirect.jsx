import React, { useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import NotFound from '../common/NotFound';

const FALLBACK_LOGIN = 'https://www.kambi-connect.in/login';

export default function QrRedirect() {
  const { code } = useParams();
  const [searchParams] = useSearchParams();

  const parsed = useMemo(() => {
    const raw = String(code || '').trim();
    const fromPath = /=qr$/i.test(raw);
    const clean = raw.replace(/=qr$/i, '');
    const isValid = /^[A-Za-z0-9_-]{3,64}$/.test(clean);
    const isQr = fromPath || searchParams.get('r') === 'qr';
    return { raw, clean, isValid, isQr };
  }, [code, searchParams]);

  useEffect(() => {
    if (!parsed.isValid) return;
    const access = parsed.isQr ? 'qr' : 'direct';
    const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
    const trackingUrl = `${apiBase}/qr-scans/t/${encodeURIComponent(parsed.clean)}?r=${access}`;

    // Redirect to tracking URL which will 302 redirect to https://www.kambi-connect.in/login
    window.location.replace(trackingUrl);

    // Fallback safety redirect in case server redirect hangs
    const safetyTimer = setTimeout(() => {
      window.location.replace(FALLBACK_LOGIN);
    }, 2800);

    return () => clearTimeout(safetyTimer);
  }, [parsed]);

  if (!parsed.isValid) {
    return <NotFound />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        bgcolor: '#F8FAFC'
      }}
    >
      <CircularProgress />
      <Typography sx={{ fontWeight: 600, color: '#334155' }}>
        Redirecting to Kambi Connect...
      </Typography>
    </Box>
  );
}
