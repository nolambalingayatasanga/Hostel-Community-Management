import React, { useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import NotFound from '../common/NotFound';

const CODE_PATTERN = /^[A-Za-z0-9]{6}(?:=qr)?$/;

export default function QrRedirect() {
  const { code } = useParams();
  const [searchParams] = useSearchParams();

  const parsed = useMemo(() => {
    const raw = String(code || '').trim();
    const fromPath = /=qr$/i.test(raw);
    const clean = raw.replace(/=qr$/i, '');
    const isValid = /^[A-Za-z0-9]{6}$/.test(clean);
    const isQr = fromPath || searchParams.get('r') === 'qr';
    return { raw, clean, isValid, isQr };
  }, [code, searchParams]);

  useEffect(() => {
    if (!parsed.isValid) return;
    const access = parsed.isQr ? 'qr' : 'direct';
    window.location.replace(`/api/qr-scans/t/${encodeURIComponent(parsed.clean)}?r=${access}`);
  }, [parsed]);

  if (!CODE_PATTERN.test(String(code || '').trim()) || !parsed.isValid) {
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
