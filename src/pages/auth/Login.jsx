import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
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
  IconButton,
  Divider,
  Stack,
  Chip
} from '@mui/material';
import {
  LockRounded as LockIcon,
  LockOutlined as LockOutlineIcon,
  EmailOutlined as MailIcon,
  BadgeOutlined as AadhaarIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Login as SignInIcon
} from '@mui/icons-material';

const Login = () => {
  const { login } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Detect if user is entering Aadhaar / numeric format
  const isAadhaarOrNumeric = /^[0-9\s]+$/.test(loginIdentifier.trim()) && loginIdentifier.trim().length > 0;

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

    // If Aadhaar or phone with spaces (e.g. '1111 2222 3333' or '98765 43210'), clean spaces
    const cleanNoSpace = rawIdentifier.replace(/\s+/g, '');
    const isDigits = /^\d+$/.test(cleanNoSpace);

    // Send without spaces for numeric/Aadhaar identifiers, or trimmed string for email
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
    <AuthLayout>
      <Card
        sx={{
          width: '100%',
          maxWidth: 450,
          bgcolor: '#FFFFFF',
          borderRadius: '24px',
          p: { xs: 3.5, sm: 4.5, md: 5 },
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          position: 'relative'
        }}
      >
        {/* Top Centered Lock Icon Badge */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: '#EBF3FF',
              border: '1px solid #DBEAFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(24, 119, 242, 0.12)'
            }}
          >
            <LockIcon sx={{ color: '#1877F2', fontSize: 32 }} />
          </Box>
        </Box>

        {/* Title & Subtitle */}
        <Box sx={{ textAlign: 'center', mb: 3.5 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: '#0F172A',
              fontSize: '25px',
              letterSpacing: '-0.4px',
              mb: 0.6
            }}
          >
            Welcome Back
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

        <form onSubmit={handleSubmit}>
          {/* Email or Phone or Aadhaar Field */}
          <Box sx={{ mb: 2.2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
          
              <Stack direction="row" spacing={0.5}>
                <Chip
                  label="Email"
                  size="small"
                  sx={{ height: 18, fontSize: '10px', fontWeight: 600, bgcolor: '#F1F5F9', color: '#64748B' }}
                />
                    <Typography
                component="label"
                sx={{
                  fontWeight: 600,
                  color: '#1E293B',
                  fontSize: '13px'
                }}
              >
               or
              </Typography>
                <Chip
                  label="Phone"
                  size="small"
                  sx={{ height: 18, fontSize: '10px', fontWeight: 600, bgcolor: '#F1F5F9', color: '#64748B' }}
                />
                    <Typography
                component="label"
                sx={{
                  fontWeight: 600,
                  color: '#1E293B',
                  fontSize: '13px'
                }}
              >
               or
              </Typography>
                <Chip
                  label="Adhaar"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '10px',
                    fontWeight: 700,
                    bgcolor: isAadhaarOrNumeric ? '#EFF6FF' : '#F1F5F9',
                    color: isAadhaarOrNumeric ? '#1877F2' : '#64748B',
                    border: isAadhaarOrNumeric ? '1px solid #BFDBFE' : 'none'
                  }}
                />
              </Stack>
            </Box>

            <TextField
              fullWidth
              size="small"
              value={loginIdentifier}
              onChange={(e) => setLoginIdentifier(e.target.value)}
              autoComplete="username"
              placeholder="Enter email, phone or Adhaar"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      {isAadhaarOrNumeric ? (
                        <AadhaarIcon sx={{ color: '#1877F2', fontSize: 19 }} />
                      ) : (
                        <MailIcon sx={{ color: '#94A3B8', fontSize: 19 }} />
                      )}
                    </InputAdornment>
                  ),
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  backgroundColor: '#FFFFFF',
                  fontSize: '14px',
                  height: '44px',
                  '& fieldset': { borderColor: '#E2E8F0' },
                  '&:hover fieldset': { borderColor: '#CBD5E1' },
                  '&.Mui-focused fieldset': { borderColor: '#1877F2', borderWidth: '1.5px' },
                }
              }}
            />
          </Box>

          {/* Password Field */}
          <Box sx={{ mb: 1.5 }}>
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
              Password
            </Typography>
            <TextField
              fullWidth
              size="small"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlineIcon sx={{ color: '#94A3B8', fontSize: 19 }} />
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
                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  backgroundColor: '#FFFFFF',
                  fontSize: '14px',
                  height: '44px',
                  '& fieldset': { borderColor: '#E2E8F0' },
                  '&:hover fieldset': { borderColor: '#CBD5E1' },
                  '&.Mui-focused fieldset': { borderColor: '#1877F2', borderWidth: '1.5px' },
                }
              }}
            />
          </Box>

          {/* Forgot Password link */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
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

          {/* Sign In Button */}
          <Button
            fullWidth
            size="large"
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={!loading && <SignInIcon sx={{ fontSize: '20px !important' }} />}
            sx={{
              py: 1.3,
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
            {loading ? <CircularProgress size={22} sx={{ color: '#FFFFFF' }} /> : 'Sign In'}
          </Button>
        </form>

        {/* OR Divider */}
        <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
          <Divider sx={{ flexGrow: 1, borderColor: '#F1F5F9' }} />
          <Typography
            variant="caption"
            sx={{
              px: 1.5,
              color: '#94A3B8',
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '1px'
            }}
          >
            OR
          </Typography>
          <Divider sx={{ flexGrow: 1, borderColor: '#F1F5F9' }} />
        </Box>

        {/* Register footer */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#64748B', fontSize: '13.5px' }}>
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
      </Card>
    </AuthLayout>
  );
};

export default Login;
