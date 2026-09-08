import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import API from '../../api';
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Link, CircularProgress, Alert, Container, InputAdornment
} from '@mui/material';
import { Email, ArrowBack } from '@mui/icons-material';

const ForgotPassword = () => {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginIdentifier) { setError('Please provide an email or phone number.'); return; }
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await API.post('/auth/forgot-password', { loginIdentifier });
      setLoading(false);
      if (res.data?.success) setSuccess('Reset link sent! Check your email or server logs.');
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#111827', py: 4 }}>
      <Container maxWidth="xs">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 56, height: 56, borderRadius: '14px', bgcolor: '#0088ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2, boxShadow: '0 8px 24px rgba(0,136,255,0.3)',
            }}
          >
            <Email sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827', mb: 0.5 }}>Forgot Password?</Typography>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>Enter your email or phone to receive a reset link</Typography>
        </Box>

        <Card sx={{ p: 3, borderRadius: '16px', border: '1px solid #EAECF0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <CardContent sx={{ p: 0 }}>
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3, borderRadius: '10px' }}>{success}</Alert>}

            {!success ? (
              <form onSubmit={handleSubmit}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', mb: 0.5, display: 'block' }}>
                  Email or Phone Number
                </Typography>
                <TextField
                  fullWidth size="small"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Enter email or mobile number"
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: '#9CA3AF', fontSize: 18 }} />
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
                  {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Send Reset Link'}
                </Button>
              </form>
            ) : (
              <Button
                fullWidth size="large" component={RouterLink} to="/login" variant="contained"
                sx={{ py: 1.25, borderRadius: '10px', bgcolor: '#0088ff', '&:hover': { bgcolor: '#0077EE' } }}
              >
                Back to Login
              </Button>
            )}

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Link
                component={RouterLink} to="/login"
                sx={{ color: '#0088ff', fontWeight: 600, fontSize: '14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 0.5, '&:hover': { textDecoration: 'underline' } }}
              >
                <ArrowBack fontSize="small" /> Back to Login
              </Link>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ForgotPassword;
