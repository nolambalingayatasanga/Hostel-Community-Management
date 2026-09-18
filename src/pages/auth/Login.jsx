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
import ProfileIconImg from '../../assets/ProfileIcon.jpeg';

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
      enqueueSnackbar('Login successful! Welcome back.', { variant: 'success' });
      navigate('/profile');
    } else {
      const errMsg = result?.message || 'Login failed. Please check your credentials.';
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
        fontFamily: '"Outfit", "Inter", sans-serif'
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

      {/* ─── RIGHT PANEL — Full 40% Width Available (No outer shadow/border-radius) ─── */}
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
          alignItems: 'center',
          px: { xs: 3, sm: 5, md: 6, lg: 7 },
          py: { xs: 4, sm: 5 }
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 440 }}>
          {/* Top Center Avatar */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Avatar
              src={ProfileIconImg}
              alt="Kambi Connect"
              sx={{
                width: 96,
                height: 96,
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
              fontSize: { xs: '28px', sm: '32px' },
              letterSpacing: '-0.5px',
              textAlign: 'center',
              color: '#0F172A',
              lineHeight: 1.2,
              mb: 0.8
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
              mb: 0.8
            }}
          >
            <Box sx={{ width: 45, height: '1.5px', bgcolor: '#CBD5E1' }} />
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '11px',
                letterSpacing: '3px',
                color: '#475569'
              }}
            >
              K M S &nbsp; H O S T E L
            </Typography>
            <Box sx={{ width: 45, height: '1.5px', bgcolor: '#CBD5E1' }} />
          </Box>

          {/* Subtitle */}
          <Typography
            sx={{
              textAlign: 'center',
              color: '#64748B',
              fontSize: '14px',
              fontWeight: 500,
              mb: 2.8
            }}
          >
            Bridging Students, Alumni & Our Hostel Community Members
          </Typography>

          {/* Community Info Box */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderRadius: '16px',
              bgcolor: '#F0F6FF',
              mb: 2.8
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                minWidth: 48,
                borderRadius: '50%',
                bgcolor: '#DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <PeopleAltOutlined sx={{ color: '#2563EB', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: '14.5px',
                  color: '#1E3A8A',
                  mb: 0.3
                }}
              >
                Learn &nbsp;•&nbsp; Connect &nbsp;•&nbsp; Grow
              </Typography>
              <Typography
                sx={{
                  color: '#64748B',
                  fontSize: '12.5px',
                  lineHeight: 1.45,
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
                        <MailIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                      </InputAdornment>
                    )
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    fontSize: '14.5px',
                    bgcolor: '#FFFFFF',
                    '& fieldset': { borderColor: '#CBD5E1' },
                    '&:hover fieldset': { borderColor: '#93C5FD' },
                    '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: '1.5px' }
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
                        <LockIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
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
                    bgcolor: '#FFFFFF',
                    '& fieldset': { borderColor: '#CBD5E1' },
                    '&:hover fieldset': { borderColor: '#93C5FD' },
                    '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: '1.5px' }
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
                      '&.Mui-checked': { color: '#2563EB' },
                      p: 0.5
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: '13.5px', color: '#475569', fontWeight: 500 }}>
                    Remember me
                  </Typography>
                }
                sx={{ m: 0 }}
              />
              <Link
                component={RouterLink}
                to="/forgot-password"
                sx={{
                  color: '#2563EB',
                  fontWeight: 600,
                  fontSize: '13.5px',
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
                py: 1.4,
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '15.5px',
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
              {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Login In'}
            </Button>
          </form>

          {/* OR divider */}
          <Box sx={{ display: 'flex', alignItems: 'center', my: 2.5 }}>
            <Box sx={{ flex: 1, height: '1px', bgcolor: '#E2E8F0' }} />
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
            <Box sx={{ flex: 1, height: '1px', bgcolor: '#E2E8F0' }} />
          </Box>

          {/* Register link */}
          <Box sx={{ textAlign: 'center', mt: 2.8 }}>
            <Typography sx={{ color: '#64748B', fontSize: '13.5px' }}>
              Don't have an account?{' '}
           
            </Typography>
          </Box>
          {/* Create an Account button */}
          <Button
            fullWidth
            size="large"
            component={RouterLink}
            to="/register"
            variant="outlined"
            startIcon={<PersonAddOutlined sx={{ fontSize: '20px !important' }} />}
            sx={{
              py: 1.3,
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '14.5px',
              textTransform: 'none',
              color: '#1877F2',
              borderColor: '#93C5FD',
              bgcolor: '#FFFFFF',
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
    </Box>
  );
};

export default Login;
