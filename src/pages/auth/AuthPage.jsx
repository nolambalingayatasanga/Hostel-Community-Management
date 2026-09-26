import React, { useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import AuthVideoPanel from '../../components/auth/AuthVideoPanel';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';

export default function AuthPage({ initialMode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Resolve active auth mode: 'login' | 'register' | 'forgot-password'
  const mode = useMemo(() => {
    // 1. Standard search parameter: ?auth=...
    const authVal = searchParams.get('auth');
    if (authVal) {
      const lower = authVal.toLowerCase();
      if (lower.includes('register') || lower.includes('signup')) return 'register';
      if (lower.includes('forgot') || lower.includes('reset')) return 'forgot-password';
      if (lower.includes('login') || lower.includes('signin')) return 'login';
    }

    // 2. Syntax like "auth?=register" or raw query string
    const rawSearch = (location.search || '').toLowerCase();
    if (rawSearch.includes('register') || rawSearch.includes('signup')) return 'register';
    if (rawSearch.includes('forgot') || rawSearch.includes('reset')) return 'forgot-password';
    if (rawSearch.includes('login') || rawSearch.includes('signin')) return 'login';

    // 3. Fallback from initialMode prop or pathname
    if (initialMode) return initialMode;
    if (location.pathname.includes('register')) return 'register';
    if (location.pathname.includes('forgot-password')) return 'forgot-password';

    return 'login';
  }, [searchParams, location.search, location.pathname, initialMode]);

  // Switch mode without full page reload so video playback on left continues seamlessly
  const handleSwitchMode = (nextMode) => {
    setSearchParams({ auth: nextMode });
  };

  return (
    <Box
      sx={{
        minHeight: { xs: '100dvh', md: '100vh' },
        height: { xs: '100dvh', md: '100vh' },
        maxHeight: { xs: '100dvh', md: '100vh' },
        width: '100vw',
        maxWidth: '100vw',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        overflow: 'hidden',
        fontFamily: '"Outfit", "Inter", sans-serif',
        bgcolor: '#FFFFFF'
      }}
    >
      {/* ─── LEFT PANEL: Autoplay looping video with volume and controls disabled (Desktop only) ─── */}
      <AuthVideoPanel />

      {/* ─── RIGHT PANEL: Dynamic Auth Card based on query parameter ─── */}
      {mode === 'register' && (
        <Register isCardOnly={true} onSwitchMode={handleSwitchMode} />
      )}
      {mode === 'forgot-password' && (
        <ForgotPassword isCardOnly={true} onSwitchMode={handleSwitchMode} />
      )}
      {mode !== 'register' && mode !== 'forgot-password' && (
        <Login isCardOnly={true} onSwitchMode={handleSwitchMode} />
      )}
    </Box>
  );
}
