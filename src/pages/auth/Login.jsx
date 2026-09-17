import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  EmailOutlined as MailIcon,
  LockOutlined as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  East as ArrowIcon,
  HomeOutlined
} from '@mui/icons-material';
import AuthImageSlideshow from '../../components/auth/AuthImageSlideshow';

const Login = () => {
  const { login } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawIdentifier = loginIdentifier.trim();
    if (!rawIdentifier || !password.trim()) {
      const valMsg = 'Please fill in all fields.';
      setError(valMsg);
      enqueueSnackbar(valMsg, { variant: 'warning' });
      return;
    }
    setError('');
    setLoading(true);

    const cleanNoSpace = rawIdentifier.replace(/\s+/g, '');
    const isDigits = /^\d+$/.test(cleanNoSpace);
    const identifierToSend = isDigits ? cleanNoSpace : rawIdentifier;

    const result = await login(identifierToSend, password);
    setLoading(false);
    if (result?.success) {
      enqueueSnackbar('Login successful! Welcome back.', { variant: 'success' });
      navigate('/profile');
    } else {
      const errMsg = result?.message || 'Login failed. Please check your credentials.';
      setError(errMsg);
      enqueueSnackbar(errMsg, { variant: 'error' });
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        maxHeight: '100vh',
        width: '100vw',
        maxWidth: '100vw',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        overflow: 'hidden',
        fontFamily: '"Inter", "Roboto", sans-serif'
      }}
    >
        {/* ─── LEFT PANEL — Gallery Slideshow (60%) ─── */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            width: '60%',
            minWidth: '60%',
            maxWidth: '60%',
            height: '100vh',
            maxHeight: '100vh',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          <AuthImageSlideshow />
        </Box>

        {/* ─── RIGHT PANEL — Login Form ─── */}
        <Box
          sx={{
            flex: 1,
            width: { xs: '100%', md: '40%' },
            minWidth: { md: '40%' },
            maxWidth: { md: '40%' },
            height: '100vh',
            maxHeight: '100vh',
            overflowY: 'auto',
            bgcolor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            px: { xs: 3, sm: 6, lg: 8 },
            py: { xs: 4, sm: 5 }
          }}
        >
  


          {/* Heading */}
          <Box sx={{ mb: 3.5 }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: { xs: '26px', sm: '30px' },
                color: '#0F172A',
                letterSpacing: '-0.5px',
                mb: 0.5
              }}
            >
              Welcome Back
            </Typography>
            <Typography sx={{ color: '#64748B', fontSize: '14px', fontWeight: 400 }}>
              Sign in to continue
            </Typography>
          </Box>

          {/* Error */}
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2.5, borderRadius: '10px', fontSize: '13px', fontWeight: 500 }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email / Phone field */}
            <Box sx={{ mb: 2 }}>
              <TextField
                inputRef={emailInputRef}
                fullWidth
                size="medium"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    passwordInputRef.current?.focus();
                  }
                }}
                autoComplete="username"
                placeholder="Email or Phone"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailIcon sx={{ color: '#94A3B8', fontSize: 19 }} />
                      </InputAdornment>
                    )
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    fontSize: '14.5px',
                    bgcolor: '#FAFBFF',
                    '& fieldset': { borderColor: '#E2E8F0' },
                    '&:hover fieldset': { borderColor: '#93C5FD' },
                    '&.Mui-focused fieldset': { borderColor: '#1877F2', borderWidth: '1.5px' }
                  }
                }}
              />
            </Box>

            {/* Password field */}
            <Box sx={{ mb: 1.5 }}>
              <TextField
                inputRef={passwordInputRef}
                fullWidth
                size="medium"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                autoComplete="current-password"
                placeholder="Password"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#94A3B8', fontSize: 19 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#94A3B8' }}
                        >
                          {showPassword ? (
                            <VisibilityOffIcon fontSize="small" />
                          ) : (
                            <VisibilityIcon fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    fontSize: '14.5px',
                    bgcolor: '#FAFBFF',
                    '& fieldset': { borderColor: '#E2E8F0' },
                    '&:hover fieldset': { borderColor: '#93C5FD' },
                    '&.Mui-focused fieldset': { borderColor: '#1877F2', borderWidth: '1.5px' }
                  }
                }}
              />
            </Box>

            {/* Remember me + Forgot password */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    sx={{
                      color: '#CBD5E1',
                      '&.Mui-checked': { color: '#1877F2' },
                      p: 0.5
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
                    Remember me
                  </Typography>
                }
                sx={{ m: 0 }}
              />
              <Link
                component={RouterLink}
                to="/forgot-password"
                sx={{
                  color: '#1877F2',
                  fontWeight: 600,
                  fontSize: '13px',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Forgot password?
              </Link>
            </Box>

            {/* Sign In button */}
            <Button
              fullWidth
              size="large"
              type="submit"
              variant="contained"
              disabled={loading}
              endIcon={!loading && <ArrowIcon sx={{ fontSize: '20px !important' }} />}
              sx={{
                py: 1.5,
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '15.5px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #1877F2 0%, #0D62D9 100%)',
                boxShadow: '0 8px 24px rgba(24, 119, 242, 0.35)',
                letterSpacing: '0.2px',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0D62D9 0%, #0B57D0 100%)',
                  boxShadow: '0 10px 28px rgba(24, 119, 242, 0.45)'
                },
                '&.Mui-disabled': { bgcolor: '#93C5FD' }
              }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Sign In'}
            </Button>
          </form>

          {/* OR divider */}
          <Box sx={{ display: 'flex', alignItems: 'center', my: 2.8 }}>
            <Box sx={{ flex: 1, height: '1px', bgcolor: '#F1F5F9' }} />
            <Typography
              sx={{
                px: 2,
                color: '#94A3B8',
                fontWeight: 700,
                fontSize: '11px',
                letterSpacing: '1.5px'
              }}
            >
              OR
            </Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: '#F1F5F9' }} />
          </Box>

          {/* Register link */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ color: '#64748B', fontSize: '13.5px' }}>
              Don't have an account?{' '}
              <Link
                component={RouterLink}
                to="/register"
                sx={{
                  color: '#1877F2',
                  fontWeight: 700,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Register here
              </Link>
            </Typography>
          </Box>
        </Box>
    </Box>
  );
};

export default Login;
