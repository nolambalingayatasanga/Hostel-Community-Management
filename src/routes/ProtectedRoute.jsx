import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box, Typography, Button } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          bgcolor: '#F8FAFC',
        }}
      >
        <CircularProgress sx={{ color: '#0088ff' }} size={36} />
        <Typography variant="body2" sx={{ mt: 2, color: '#6B7280', fontWeight: 500 }}>
          Restoring session...
        </Typography>
      </Box>
    );
  }

  // If not logged in
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // ADMINISTRATOR role has all access to every page and control by default
  if (user.role === 'ADMINISTRATOR') {
    return <Outlet />;
  }

  // If user role is not allowed for this route
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          bgcolor: '#F8FAFC',
          textAlign: 'center',
          px: 3,
        }}
      >
        <Box
          sx={{
            width: 72, height: 72, borderRadius: '18px',
            bgcolor: 'rgba(239,68,68,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mb: 3,
          }}
        >
          <LockOutlined sx={{ fontSize: 36, color: '#EF4444' }} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', mb: 1 }}>
          403 — Access Denied
        </Typography>
        <Typography variant="body1" sx={{ color: '#6B7280', mb: 4, maxWidth: 400 }}>
          You do not have the required permissions to access this page.
        </Typography>
        <Navigate to="/profile" replace />
      </Box>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
