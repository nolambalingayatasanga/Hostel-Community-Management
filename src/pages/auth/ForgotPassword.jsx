import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import API from '../../api';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  CircularProgress,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  EmailOutlined as MailIcon,
  ArrowBack as ArrowBackIcon,
  VpnKeyOutlined as KeyIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

const ForgotPassword = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawIdentifier = loginIdentifier.trim();
    if (!rawIdentifier) {
      const valMsg = 'Please provide your email, phone, or Aadhaar number.';
      setError(valMsg);
      enqueueSnackbar(valMsg, { variant: 'warning' });
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    const cleanNoSpace = rawIdentifier.replace(/\s+/g, '');
    const isDigits = /^\d+$/.test(cleanNoSpace);
    const identifierToSend = isDigits ? cleanNoSpace : rawIdentifier;

    try {
      const clientUrl = typeof window !== 'undefined' && window.location ? window.location.origin : '';
      const res = await API.post(
        '/auth/forgot-password',
        { loginIdentifier: identifierToSend, clientUrl },
        { params: { clientUrl } }
      );
      setLoading(false);
      if (res.data?.success) {
        const msg = 'Password reset link sent! Check your inbox or notification.';
        setSuccess(msg);
        enqueueSnackbar(msg, { variant: 'success' });
      }
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Something went wrong. Please try again.';
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
      {/* ─── LEFT PANEL — Single Static Background Image (60%) without any text ─── */}
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
          flexShrink: 0,
          bgcolor: '#0A1224'
        }}
      >
        <Box
          component="img"
          src="/assets/ksh-login-bg.jpg"
          alt="Hostel Campus"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block'
          }}
        />
      </Box>

      {/* ─── RIGHT PANEL — Forgot Password Form (40%) ─── */}
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
        <Box sx={{ maxWidth: 440, width: '100%', mx: 'auto' }}>
          {/* Top Badge */}
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '14px',
                bgcolor: success ? '#ECFDF5' : '#EFF6FF',
                border: `1px solid ${success ? '#A7F3D0' : '#DBEAFE'}`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: success
                  ? '0 6px 16px rgba(16, 185, 129, 0.12)'
                  : '0 6px 16px rgba(24, 119, 242, 0.12)',
                transition: 'all 0.3s ease'
              }}
            >
              {success ? (
                <CheckIcon sx={{ color: '#10B981', fontSize: 26 }} />
              ) : (
                <KeyIcon sx={{ color: '#1877F2', fontSize: 26 }} />
              )}
            </Box>
          </Box>

          {/* Heading */}
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: { xs: '26px', sm: '30px' },
                color: '#0F172A',
                letterSpacing: '-0.5px',
                mb: 0.8
              }}
            >
              {success ? 'Link Sent!' : 'Forgot Password?'}
            </Typography>
            <Typography sx={{ color: '#64748B', fontSize: '14px', fontWeight: 400, lineHeight: 1.5 }}>
              {success
                ? 'Please check your email for the password reset instructions.'
                : 'Enter your email or phone to receive a password reset link.'}
            </Typography>
          </Box>

          {/* Alerts */}
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2.5, borderRadius: '10px', fontSize: '13px', fontWeight: 500 }}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert
              severity="success"
              sx={{ mb: 2.5, borderRadius: '10px', fontSize: '13px', fontWeight: 500 }}
            >
              {success}
            </Alert>
          )}

          {!success ? (
            <form onSubmit={handleSubmit}>
              <Box sx={{ mb: 2.5 }}>
                <Typography
                  component="label"
                  sx={{
                    display: 'block',
                    fontWeight: 600,
                    color: '#1E293B',
                    fontSize: '13px',
                    mb: 0.8
                  }}
                >
                  Email or Phone
                </Typography>
                <TextField
                  fullWidth
                  size="medium"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Enter email or phone"
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

              <Button
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.35,
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '15px',
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #1877F2 0%, #0D62D9 100%)',
                  boxShadow: '0 8px 20px rgba(24, 119, 242, 0.35)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0D62D9 0%, #0B57D0 100%)',
                    boxShadow: '0 10px 24px rgba(24, 119, 242, 0.45)'
                  },
                  '&.Mui-disabled': {
                    bgcolor: '#93C5FD'
                  }
                }}
              >
                {loading ? <CircularProgress size={22} sx={{ color: '#FFFFFF' }} /> : 'Send Reset Link'}
              </Button>
            </form>
          ) : (
            <Button
              fullWidth
              size="large"
              component={RouterLink}
              to="/login"
              variant="contained"
              sx={{
                py: 1.35,
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '15px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #1877F2 0%, #0D62D9 100%)',
                boxShadow: '0 8px 20px rgba(24, 119, 242, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0D62D9 0%, #0B57D0 100%)'
                }
              }}
            >
              Back to Sign In
            </Button>
          )}

          {/* Back to Sign In Link */}
          <Box sx={{ mt: 3.5, textAlign: 'center' }}>
            <Link
              component={RouterLink}
              to="/login"
              sx={{
                color: '#1877F2',
                fontWeight: 600,
                fontSize: '13.5px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.8,
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 17 }} /> Back to Sign In
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
