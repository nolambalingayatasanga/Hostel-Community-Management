import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Link, CircularProgress, Alert,
  Container, InputAdornment, IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, Email } from '@mui/icons-material';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginIdentifier || !password) { setError('Please fill in all fields.'); return; }
    setError(''); setLoading(true);
    const result = await login(loginIdentifier, password);
    setLoading(false);
    if (result?.success) { navigate('/dashboard'); }
    else { setError(result?.message || 'Login failed. Please check your credentials.'); }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#111827',
        py: 4,
      }}
    >
      <Container maxWidth="xs">
        {/* Logo / Brand */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 56, height: 56, borderRadius: '14px',
              bgcolor: '#0088ff', display: 'flex', alignItems: 'center',
              justifyContent: 'center', mx: 'auto', mb: 2,
              boxShadow: '0 8px 24px rgba(0,136,255,0.3)',
            }}
          >
            <Lock sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827', mb: 0.5 }}>
            Welcome Back
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>
            Hostel Community Management Portal
          </Typography>
        </Box>

        <Card sx={{ p: 3, borderRadius: '16px', border: '1px solid #EAECF0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <CardContent sx={{ p: 0 }}>
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', mb: 0.5, display: 'block' }}>
                Email or Phone Number
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                autoComplete="username"
                placeholder="Enter email or mobile number"
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#9CA3AF', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Typography variant="caption" sx={{ fontWeight: 600, color: '#374151', mb: 0.5, display: 'block' }}>
                Password
              </Typography>
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                size="small"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                sx={{ mb: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#9CA3AF', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  variant="caption"
                  sx={{ color: '#0088ff', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  Forgot password?
                </Link>
              </Box>

              <Button
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.25, borderRadius: '10px', fontWeight: 700, fontSize: '15px',
                  bgcolor: '#0088ff', boxShadow: '0 4px 12px rgba(0,136,255,0.3)',
                  '&:hover': { bgcolor: '#0077EE', boxShadow: '0 6px 16px rgba(0,136,255,0.35)' },
                }}
              >
                {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Sign In'}
              </Button>
            </form>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                Don't have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  sx={{ color: '#0088ff', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  Register here
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;
