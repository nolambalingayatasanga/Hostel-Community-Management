import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import API from '../../api';
import AuthLayout from '../../layouts/AuthLayout';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Link,
  CircularProgress,
  Alert,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  EmailOutlined as MailIcon,
  ArrowBack as ArrowBackIcon,
  VpnKeyOutlined as KeyIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

const ForgotPassword = () => {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawIdentifier = loginIdentifier.trim();
    if (!rawIdentifier) {
      setError('Please provide your email, phone, or Aadhaar number.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    const cleanNoSpace = rawIdentifier.replace(/\s+/g, '');
    const isDigits = /^\d+$/.test(cleanNoSpace);
    const identifierToSend = isDigits ? cleanNoSpace : rawIdentifier;

    try {
      const res = await API.post('/auth/forgot-password', { loginIdentifier: identifierToSend });
      setLoading(false);
      if (res.data?.success) {
        setSuccess('Password reset link sent! Check your inbox or notification.');
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <AuthLayout>
      <Card
        sx={{
          width: '100%',
          maxWidth: 440,
          bgcolor: '#FFFFFF',
          borderRadius: '24px',
          p: { xs: 3.5, sm: 4.5 },
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          position: 'relative'
        }}
      >
        {/* Top Centered Badge */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: success ? '#ECFDF5' : '#EFF6FF',
              border: `1px solid ${success ? '#A7F3D0' : '#DBEAFE'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: success ? '0 6px 16px rgba(16, 185, 129, 0.12)' : '0 6px 16px rgba(37, 99, 235, 0.12)',
              transition: 'all 0.3s ease'
            }}
          >
            {success ? (
              <CheckIcon sx={{ color: '#10B981', fontSize: 30 }} />
            ) : (
              <KeyIcon sx={{ color: '#2563EB', fontSize: 30 }} />
            )}
          </Box>
        </Box>

        {/* Title & Subtitle */}
        <Box sx={{ textAlign: 'center', mb: 3.5 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: '#0F172A',
              fontSize: '24px',
              letterSpacing: '-0.3px',
              mb: 0.6
            }}
          >
            {success ? 'Link Sent!' : 'Forgot Password'}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#64748B',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            {success
              ? 'Please follow the instructions sent to your account.'
              : 'Enter your email to receive OTP or an reset link'}
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: 500
            }}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 3,
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: 500
            }}
          >
            {success}
          </Alert>
        )}

        {!success ? (
          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
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
                Email
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="Enter email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailIcon sx={{ color: '#94A3B8', fontSize: 19 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    backgroundColor: '#FFFFFF',
                    fontSize: '14px',
                    '& fieldset': { borderColor: '#E2E8F0' },
                    '&:hover fieldset': { borderColor: '#CBD5E1' },
                    '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: '1.5px' },
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
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
                  boxShadow: '0 10px 24px rgba(37, 99, 235, 0.45)'
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
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)'
              }
            }}
          >
            Back to Sign In
          </Button>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
          <Divider sx={{ flexGrow: 1, borderColor: '#F1F5F9' }} />
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Link
            component={RouterLink}
            to="/login"
            sx={{
              color: '#2563EB',
              fontWeight: 700,
              fontSize: '13.5px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.8,
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 18 }} /> Back to Sign In
          </Link>
        </Box>
      </Card>
    </AuthLayout>
  );
};

export default ForgotPassword;
