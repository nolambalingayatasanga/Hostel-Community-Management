import React from 'react';
import { Box, Typography, Button, Paper, Stack } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ApartmentIcon from '@mui/icons-material/Apartment';

const AuthRequired = ({ title, message }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = () => {
    navigate('/login', { state: { from: location.pathname } });
  };

  const handleRegister = () => {
    navigate('/register', { state: { from: location.pathname } });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '68vh',
        p: { xs: 2, sm: 4 },
        textAlign: 'center'
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3.5, sm: 5 },
          maxWidth: 520,
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid #E2E8F0',
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Box
          sx={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 136, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0088ff',
            mb: 2.5
          }}
        >
          <LockOutlinedIcon sx={{ fontSize: 40 }} />
        </Box>

        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.02em',
            mb: 1
          }}
        >
          {title || 'Create Account or Login to View'}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: '#64748B',
            maxWidth: 420,
            fontSize: '14.5px',
            lineHeight: 1.6,
            mb: 3.5
          }}
        >
          {message || ''} </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: '100%', justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<LoginIcon />}
            onClick={handleLogin}
            sx={{
              backgroundColor: '#0088ff',
              color: '#ffffff',
              fontWeight: 700,
              textTransform: 'none',
              px: 3.5,
              py: 1.25,
              borderRadius: '10px',
              fontSize: '14.5px',
              boxShadow: 'none)',
              '&:hover': {
                backgroundColor: '#0070d2',
                boxShadow: 'none'
              }
            }}
          >
            Login
          </Button>

          <Button
            variant="outlined"
            startIcon={<PersonAddIcon />}
            onClick={handleRegister}
            sx={{
              borderColor: '#0088ff',
              color: '#0088ff',
              fontWeight: 700,
              textTransform: 'none',
              px: 3,
              py: 1.25,
              borderRadius: '10px',
              fontSize: '14.5px',
              borderWidth: '1.5px',
              '&:hover': {
                borderWidth: '1.5px',
                borderColor: '#0070d2',
                backgroundColor: 'rgba(0, 136, 255, 0.05)'
              }
            }}
          >
            Create Account
          </Button>
        </Stack>

        <Button
          variant="text"
          startIcon={<ApartmentIcon />}
          onClick={() => navigate('/facilities')}
          sx={{
            mt: 2.5,
            color: '#0088ff',
            textTransform: 'none',
            fontSize: '13.5px',
            fontWeight: 600,
            textDecoration: "underline",
            '&:hover': {
              color: '#0F172A',
              backgroundColor: 'transparent'
            }
          }}
        >
          Explore Public Facilities
        </Button>
      </Paper>
    </Box>
  );
};

export default AuthRequired;
