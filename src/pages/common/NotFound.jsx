
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/LockOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const NotFound = ({ message, customRedirectPath }) => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        p: 3,
        textAlign: 'center'
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, sm: 6 },
          maxWidth: 540,
          width: '100%',
          backgroundColor: 'transparent',
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            mb: 3
          }}
        >
          <LockIcon sx={{ fontSize: 44 }} />
        </Box>

        {/* <Typography
          variant="h2"
          sx={{
            fontWeight: 900,
            color: '#0f172a',
            fontSize: { xs: '2.5rem', sm: '3.5rem' },
            letterSpacing: -1,
            mb: 1
          }}
        >
          404
        </Typography>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: '#1e293b',
            mb: 1.5
          }}
        >
          Page Not Found
        </Typography> */}

        <Typography
          variant="body1"
          sx={{
            color: '#64748b',
            maxWidth: 400,
            lineHeight: 1.6,
            mb: 4
          }}
        >
          {message || 'The page you are looking for does not exist or you do not have permission to access it.'}
        </Typography>

        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(customRedirectPath || '/profile')}
          sx={{
            backgroundColor: '#0088ff',
            color: '#ffffff',
            fontWeight: 700,
            textTransform: 'none',
            px: 4,
            py: 1.2,
            borderRadius: '10px',
            boxShadow: '',
            '&:hover': {
              backgroundColor: '#0070d2'
            }
          }}
        >
          Back to  Home
        </Button>
      </Paper>
    </Box>
  );
};

export default NotFound;
