import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  CircularProgress,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Avatar
} from '@mui/material';
import {
  EmailOutlined as MailIcon,
  LockOutlined as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  East as ArrowIcon,
  PeopleAltOutlined,
  PersonAddOutlined
} from '@mui/icons-material';
import AuthImageSlideshow from '../../components/auth/AuthImageSlideshow';
import AuthVideoPanel from '../../components/auth/AuthVideoPanel';
import ProfileIconImg from '../../assets/ProfileIcon.jpeg';

const Login = ({ isCardOnly = false, onSwitchMode }) => {
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

  const hasTrackedDirectRef = useRef(false);

  // Restore remembered login identifier if previously saved
  useEffect(() => {
    try {
      const savedIdentifier = localStorage.getItem('remembered_login_identifier');
      if (savedIdentifier) {
        setLoginIdentifier(savedIdentifier);
        setRememberMe(true);
      }
    } catch (err) {
      console.debug('Error reading remembered login:', err);
    }
  }, []);

  const handleRememberMeChange = (e) => {
    const checked = e.target.checked;
    setRememberMe(checked);
    if (!checked) {
      try {
        localStorage.removeItem('remembered_login_identifier');
      } catch (err) {
        console.debug('Error clearing remembered login:', err);
      }
    }
  };

  // Track direct portal hits on https://www.kambi-connect.in/login
  useEffect(() => {
    if (hasTrackedDirectRef.current) return;
    hasTrackedDirectRef.current = true;

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const fromParam = searchParams.get('from');
      const rParam = searchParams.get('r');

      // If redirected from QR scan or short link tracking, do not double-count
      if (fromParam === 'qr' || rParam === 'qr' || fromParam === 'tracked') {
        searchParams.delete('from');
        searchParams.delete('r');
        const newSearch = searchParams.toString();
        const cleanUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '');
        window.history.replaceState({}, '', cleanUrl);
        return;
      }

      // Record direct portal click
      API.post('/qr-scans/track-direct').catch((err) => {
        console.debug('Direct click track beacon:', err?.message);
      });
    } catch (e) {
      console.debug('Tracking error:', e);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawIdentifier = loginIdentifier.trim();
    if (!rawIdentifier || !password.trim()) {
      enqueueSnackbar('Please fill in all fields.', { variant: 'warning' });
      return;
    }
    setLoading(true);

    const cleanNoSpace = rawIdentifier.replace(/\s+/g, '');
    const isDigits = /^\d+$/.test(cleanNoSpace);
    const identifierToSend = isDigits ? cleanNoSpace : rawIdentifier;

    const result = await login(identifierToSend, password);
    setLoading(false);
    if (result?.success) {
      try {
        if (rememberMe) {
          localStorage.setItem('remembered_login_identifier', rawIdentifier);
        } else {
          localStorage.removeItem('remembered_login_identifier');
        }
      } catch (err) {
        console.debug('Error storing remembered login:', err);
      }
      enqueueSnackbar('Login successful! Welcome back.', { variant: 'success' });
      navigate('/profile');
    } else {
      const errMsg = result?.message || 'Login failed. Please Try Again.';
      enqueueSnackbar(errMsg, { variant: 'error' });
    }
  };

  const rightPanel = (
    <Box
      sx={{
        flex: 1,
        width: { xs: '100%', md: '30%' },
        minWidth: { md: '30%' },
        maxWidth: { md: '30%' },
        minHeight: { xs: '100dvh', md: '100vh' },
        height: { xs: '100dvh', md: '100vh' },
        maxHeight: { xs: '100dvh', md: '100vh' },
        overflowY: 'auto',
        bgcolor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: { xs: 3, sm: 4, md: 3, lg: 4 },
        py: { xs: 2, sm: 3, md: 4 },
        boxSizing: 'border-box'
      }}
    >
        <Box sx={{ width: '100%', maxWidth: 440, my: 'auto' }}>
          {/* Top Center Avatar */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 1.25, sm: 1.5, md: 2 } }}>
            <Avatar
              src={ProfileIconImg}
              alt="Kambi Connect"
              sx={{
                width: { xs: 68, sm: 76, md: 96 },
                height: { xs: 68, sm: 76, md: 96 },
                border: '3px solid #FFFFFF',
                boxShadow: '0 0 0 3px #BFDBFE, 0 10px 24px -4px rgba(59, 130, 246, 0.35)',
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'scale(1.05)' }
              }}
            />
          </Box>

          {/* Title: Kambi Connect */}
          <Typography
            component="h1"
            sx={{
              fontWeight: 900,
              fontSize: { xs: '24px', sm: '26px', md: '32px' },
              letterSpacing: '-0.5px',
              textAlign: 'center',
              color: '#0F172A',
              lineHeight: 1.2,
              mb: { xs: 0.5, sm: 0.6 }
            }}
          >
            Kambi{' '}
            <Box component="span" sx={{ color: '#2563EB' }}>
              Connect
            </Box>
          </Typography>

          {/* Divider: KMS HOSTEL */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              mb: { xs: 1.4, sm: 1.8, md: 2 }
            }}
          >
            <Box sx={{ width: 40, height: '1.5px', bgcolor: '#CBD5E1' }} />
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: { xs: '10.5px', sm: '11px' },
                letterSpacing: '2.5px',
                color: '#475569'
              }}
            >
              K M S &nbsp; H O S T E L
            </Typography>
            <Box sx={{ width: 40, height: '1.5px', bgcolor: '#CBD5E1' }} />
          </Box>

          {/* Community Info Box */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1.5, sm: 2 },
              p: { xs: 1.35, sm: 1.75, md: 2 },
              borderRadius: '14px',
              bgcolor: '#F0F6FF',
              mb: { xs: 1.8, sm: 2.2, md: 2.8 }
            }}
          >
            <Box
              sx={{
                width: { xs: 42, sm: 48 },
                height: { xs: 42, sm: 48 },
                minWidth: { xs: 42, sm: 48 },
                borderRadius: '50%',
                bgcolor: '#DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <PeopleAltOutlined sx={{ color: '#2563EB', fontSize: { xs: 20, sm: 22, md: 24 } }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '12.5px', sm: '13.5px', md: '14.5px' },
                  color: '#1E3A8A',
                  mb: 0.2
                }}
              >
                Learn &nbsp;•&nbsp; Connect &nbsp;•&nbsp; Grow
              </Typography>
              <Typography
                sx={{
                  color: '#64748B',
                  fontSize: { xs: '11px', sm: '12px', md: '12.5px' },
                  lineHeight: 1.35,
                  fontWeight: 400
                }}
              >
                Join with your hostel community, stay informed and be a part of something bigger.
              </Typography>
            </Box>
          </Box>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email / Phone field */}
            <Box sx={{ mb: { xs: 1.6, sm: 2 } }}>
              <TextField
                id="loginIdentifier"
                name="loginIdentifier"
                inputRef={emailInputRef}
                fullWidth
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
                        <MailIcon sx={{ color: '#94A3B8', fontSize: { xs: 20, sm: 20 } }} />
                      </InputAdornment>
                    )
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    fontSize: { xs: '15px', sm: '15px' },
                    bgcolor: '#FFFFFF',
                    '& fieldset': { borderColor: '#CBD5E1' },
                    '&:hover fieldset': { borderColor: '#93C5FD' },
                    '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: '1.5px' }
                  },
                  '& .MuiOutlinedInput-input': {
                    py: { xs: '13px', sm: '14px' }
                  }
                }}
              />
            </Box>

            {/* Password field */}
            <Box sx={{ mb: { xs: 1.35, sm: 1.5 } }}>
              <TextField
                id="password"
                name="password"
                inputRef={passwordInputRef}
                fullWidth
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
                        <LockIcon sx={{ color: '#94A3B8', fontSize: { xs: 20, sm: 20 } }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#94A3B8', p: 0.5 }}
                        >
                          {showPassword ? (
                            <VisibilityOffIcon sx={{ fontSize: 20 }} />
                          ) : (
                            <VisibilityIcon sx={{ fontSize: 20 }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    fontSize: { xs: '15px', sm: '15px' },
                    bgcolor: '#FFFFFF',
                    '& fieldset': { borderColor: '#CBD5E1' },
                    '&:hover fieldset': { borderColor: '#93C5FD' },
                    '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: '1.5px' }
                  },
                  '& .MuiOutlinedInput-input': {
                    py: { xs: '13px', sm: '14px' }
                  }
                }}
              />
            </Box>

            {/* Remember me + Forgot password */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 1.8, sm: 2.2 } }}>
              <FormControlLabel
                control={
                  <Checkbox
                    id="rememberMe"
                    name="rememberMe"
                    size="small"
                    checked={rememberMe}
                    onChange={handleRememberMeChange}
                    sx={{
                      color: '#CBD5E1',
                      '&.Mui-checked': { color: '#2563EB' },
                      p: 0.5
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: { xs: '13px', sm: '13.5px' }, color: '#475569', fontWeight: 500 }}>
                    Remember me
                  </Typography>
                }
                sx={{ m: 0 }}
              />
              <Link
                component={RouterLink}
                to="/auth?auth=forgot-password"
                onClick={(e) => {
                  if (onSwitchMode) {
                    e.preventDefault();
                    onSwitchMode('forgot-password');
                  }
                }}
                sx={{
                  color: '#2563EB',
                  fontWeight: 600,
                  fontSize: { xs: '13px', sm: '13.5px' },
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Forgot password?
              </Link>
            </Box>

            {/* LoginIn button */}
            <Button
              fullWidth
              size="large"
              type="submit"
              variant="contained"
              disabled={loading}
              endIcon={!loading && <ArrowIcon sx={{ fontSize: '20px !important' }} />}
              sx={{
                py: { xs: 1.3, sm: 1.35, md: 1.4 },
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: { xs: '15px', sm: '15.5px' },
                textTransform: 'none',
                bgcolor: '#0088ff',
                boxShadow: 'none',
                letterSpacing: '0.2px',
                '&:hover': {
                  bgcolor: '#0077e6',
                  boxShadow: 'none'
                },
                '&.Mui-disabled': { bgcolor: '#93C5FD' }
              }}
            >
              {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Login In'}
            </Button>
          </form>

          {/* OR divider */}
          <Box sx={{ display: 'flex', alignItems: 'center', my: { xs: 1.8, sm: 2, md: 2.2 } }}>
            <Box sx={{ flex: 1, height: '1px', bgcolor: '#E2E8F0' }} />
            <Typography
              sx={{
                px: 2,
                color: '#94A3B8',
                fontWeight: 700,
                fontSize: { xs: '11px', sm: '11px' },
                letterSpacing: '1.5px'
              }}
            >
              OR
            </Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: '#E2E8F0' }} />
          </Box>

          {/* Register link */}
          <Box sx={{ textAlign: 'center', mt: { xs: 0.8, sm: 1.5 }, mb: { xs: 0.8, sm: 1 } }}>
            <Typography sx={{ color: '#64748B', fontSize: { xs: '13px', sm: '13.5px' }, fontWeight: 500 }}>
              Don't have an account?
            </Typography>
          </Box>
          {/* Create an Account button */}
          <Button
            fullWidth
            component={RouterLink}
            to="/auth?auth=register"
            onClick={(e) => {
              if (onSwitchMode) {
                e.preventDefault();
                onSwitchMode('register');
              }
            }}
            variant="outlined"
            startIcon={<PersonAddOutlined sx={{ fontSize: '20px !important' }} />}
            sx={{
              py: { xs: 1.15, sm: 1.25, md: 1.3 },
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: { xs: '14px', sm: '14.5px' },
              textTransform: 'none',
              color: '#1877F2',
              borderColor: '#93C5FD',
              bgcolor: '#FFFFFF',
              mb: 0,
              '&:hover': {
                borderColor: '#1877F2',
                bgcolor: '#EFF6FF'
              }
            }}
          >
            Create an Account
          </Button>
        </Box>
      </Box>
  );

  if (isCardOnly) {
    return rightPanel;
  }

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
      <AuthVideoPanel />
      {rightPanel}
    </Box>
  );
};

export default Login;
