import React, { useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Link, CircularProgress, Alert, Container,
  InputAdornment, IconButton
} from '@mui/material';
import { Lock, Visibility, VisibilityOff, CheckCircle } from '@mui/icons-material';

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
    if (!password || !confirmPassword) { setError('Please fill in all fields.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

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
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#111827', py: 4 }}>
      <Container maxWidth="xs">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 56, height: 56, borderRadius: '14px',
              bgcolor: success ? '#10B981' : '#0088ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2,
              boxShadow: success ? '0 8px 24px rgba(16,185,129,0.3)' : '0 8px 24px rgba(0,136,255,0.3)',
              transition: 'all 0.3s ease',
            }}
          >
            {success ? <CheckCircle sx={{ color: '#fff', fontSize: 28 }} /> : <Lock sx={{ color: '#fff', fontSize: 28 }} />}
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827', mb: 0.5 }}>
            {success ? 'Password Updated!' : 'Set New Password'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>
            {success ? 'Redirecting you to the dashboard...' : 'Create a strong password to secure your account'}
          </Typography>
        </Box>

        <Card sx={{ p: 3, borderRadius: '16px', border: '1px solid #EAECF0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <CardContent sx={{ p: 0 }}>
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3, borderRadius: '10px' }}>Password changed successfully! Redirecting...</Alert>}

            {!success && (
              <form onSubmit={handleSubmit}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', mb: 0.5, display: 'block' }}>New Password</Typography>
                <TextField
                  fullWidth size="small" type={showPassword ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters" sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#9CA3AF', fontSize: 18 }} /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', mb: 0.5, display: 'block' }}>Confirm New Password</Typography>
                <TextField
                  fullWidth size="small" type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password" sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#9CA3AF', fontSize: 18 }} /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowConfirm(!showConfirm)}>
                          {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  fullWidth size="large" type="submit" variant="contained" disabled={loading}
                  sx={{
                    py: 1.25, borderRadius: '10px', fontWeight: 700,
                    bgcolor: '#0088ff', boxShadow: '0 4px 12px rgba(0,136,255,0.3)',
                    '&:hover': { bgcolor: '#0077EE' },
                  }}
                >
                  {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Update Password'}
                </Button>
              </form>
            )}

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                Need help?{' '}
                <Link component={RouterLink} to="/login" sx={{ color: '#0088ff', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  Contact Support
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ResetPassword;
