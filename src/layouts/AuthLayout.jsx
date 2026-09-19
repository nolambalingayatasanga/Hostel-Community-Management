import React from 'react';
import { Box, Container } from '@mui/material';

const AuthLayout = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflowY: 'auto',
        overflowX: 'hidden',
        py: { xs: 4, sm: 6 },
        px: { xs: 2, sm: 3 }
      }}
    >
      {/* Background Image with Dark Blue Gradient Overlay */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `linear-gradient(135deg, rgba(6, 20, 54, 0.84) 0%, rgba(3, 11, 30, 0.92) 100%), url('/assets/hostel-night-ill.jpg')`,
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          zIndex: 0
        }}
      />

      {/* Ambient glowing radial light effects */}
      <Box
        sx={{
          position: 'fixed',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60vw',
          height: '60vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(24, 119, 242, 0.2) 0%, rgba(6, 20, 54, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Centered Content Container */}
      <Container
        maxWidth="md"
        sx={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 1, sm: 2 }
        }}
      >
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          {children}
        </Box>
      </Container>
    </Box>
  );
};

export default AuthLayout;
