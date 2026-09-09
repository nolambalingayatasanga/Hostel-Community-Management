import React, { useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import API from '../../api';
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
  Divider
} from '@mui/material';
import {
  LockOutlined as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  VpnKeyOutlined as KeyIcon
} from '@mui/icons-material';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await API.post(`/auth/reset-password/${token}`, { password, confirmPassword });
      setLoading(false);
      if (res.data?.success) {
        setSuccess(true);
        const { token: jwtToken, data } = res.data;
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        updateUser(data.user);
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Password reset failed. Token may be invalid or expired.');
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
              <CheckCircleIcon sx={{ color: '#10B981', fontSize: 30 }} />
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
            {success ? 'Password Reset!' : 'Set New Password'}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#64748B',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            {success ? 'Redirecting to your dashboard...' : 'Create a strong password to secure your account'}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px', fontSize: '13.5px', fontWeight: 500 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: '12px', fontSize: '13.5px', fontWeight: 500 }}>
            Password changed successfully! Redirecting...
          </Alert>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 2 }}>
              <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.8 }}>
                New Password
              </Typography>
              <TextField
                fullWidth size="small" type={showPassword ? 'text' : 'password'}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: '#94A3B8', fontSize: 19 }} /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#94A3B8' }}>
                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px', backgroundColor: '#FFFFFF', fontSize: '14px',
                    '& fieldset': { borderColor: '#E2E8F0' },
                    '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: '1.5px' },
                  }
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.8 }}>
                Confirm New Password
              </Typography>
              <TextField
                fullWidth size="small" type={showConfirm ? 'text' : 'password'}
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: '#94A3B8', fontSize: 19 }} /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowConfirm(!showConfirm)} edge="end" sx={{ color: '#94A3B8' }}>
                        {showConfirm ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px', backgroundColor: '#FFFFFF', fontSize: '14px',
                    '& fieldset': { borderColor: '#E2E8F0' },
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
                  background: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)'
                }
              }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: '#FFFFFF' }} /> : 'Update Password'}
            </Button>
          </form>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
          <Divider sx={{ flexGrow: 1, borderColor: '#F1F5F9' }} />
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#64748B', fontSize: '13.5px' }}>
            Remembered your password?{' '}
            <Link
              component={RouterLink}
              to="/login"
              sx={{
                color: '#2563EB',
                fontWeight: 700,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Sign In
            </Link>
          </Typography>
        </Box>
      </Card>
    </AuthLayout>
  );
};

export default ResetPassword;
