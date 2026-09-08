import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  CircularProgress,
  Alert,
  Container,
  Grid,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  School as StudentIcon,
  Work as AlumniIcon,
  SupervisorAccount as AgentIcon,
  Badge as StaffIcon,
  Security as MemberIcon
} from '@mui/icons-material';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Registration step state
  // Step 1: select role. Step 2: enter basic login details.
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('STUDENT');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleChange = (event, newRole) => {
    if (newRole !== null) {
      setRole(newRole);
    }
  };

  const handleNextStep = () => {
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!name || !email || !phone || !password || !confirmPassword) {
      setError('All fields are required.');
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
    const result = await register({
      name,
      email,
      phone,
      password,
      confirmPassword,
      role
    });
    setLoading(false);

    if (result?.success) {
      // Registration successful -> redirect to Complete Profile page
      navigate('/complete-profile');
    } else {
      setError(result?.message || 'Registration failed. Please check credentials.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        py: 6
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            backdropFilter: 'blur(16px) saturate(180%)',
            backgroundColor: 'rgba(255,255,255,0.95)',
            border: '1px solid rgba(0,136,255,0.1)',
            p: { xs: 2, sm: 4 },
            position: 'relative',
            overflow: 'visible',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              right: '-2px',
              bottom: '-2px',
              background: 'linear-gradient(135deg, #6366F1 0%, #0088ff 100%)',
              borderRadius: '18px',
              zIndex: -1,
              opacity: 0.15
            }
          }}
        >
          <CardContent>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  mb: 1,
                  background: 'linear-gradient(135deg, #0088ff 0%, #6366F1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Create Account
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Join the hostel community portal in seconds
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {step === 1 ? (
              // STEP 1: CHOOSE ROLE
              <Box>
                <Typography variant="subtitle1" align="center" sx={{ mb: 3, fontWeight: 600 }}>
                  What type of community member are you?
                </Typography>
                
                 <ToggleButtonGroup
                  value={role}
                  exclusive
                  onChange={handleRoleChange}
                  orientation="vertical"
                  fullWidth
                  sx={{ gap: 1.5, mb: 4 }}
                >
                  <ToggleButton
                    value="STUDENT"
                    sx={{
                      py: 2,
                      border: '1px solid rgba(0,136,255,0.1) !important',
                      borderRadius: '10px !important',
                      color: 'text.secondary',
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(0,136,255,0.08) !important',
                        color: '#0088ff',
                        borderColor: '#0088ff !important'
                      }
                    }}
                  >
                    <StudentIcon sx={{ mr: 2 }} />
                    Student / Alumni
                  </ToggleButton>

                  <ToggleButton
                    value="MEMBER"
                    sx={{
                      py: 2,
                      border: '1px solid rgba(0,136,255,0.1) !important',
                      borderRadius: '10px !important',
                      color: 'text.secondary',
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(0,136,255,0.08) !important',
                        color: '#0088ff',
                        borderColor: '#0088ff !important'
                      }
                    }}
                  >
                    <AgentIcon sx={{ mr: 2 }} />
                    Community Member / Parent Representative
                  </ToggleButton>

                </ToggleButtonGroup>

                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  onClick={handleNextStep}
                  sx={{ py: 1.5, mb: 3, fontWeight: 'bold' }}
                >
                  Continue
                </Button>
              </Box>
            ) : (
              // STEP 2: FORM DETAILS
              <form onSubmit={handleSubmit}>
                <Typography variant="subtitle2" sx={{ color: '#0088ff', mb: 2, fontWeight: 'bold' }}>
                  Registering as: {role === 'STUDENT' ? 'Student / Alumni' : 'Community Member / Parent Representative'}
                </Typography>

                <TextField
                  fullWidth
                  label="Full Name"
                  variant="outlined"
                  margin="normal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  variant="outlined"
                  margin="normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  fullWidth
                  label="Phone Number"
                  variant="outlined"
                  margin="normal"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  variant="outlined"
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="minimum 6 characters"
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  variant="outlined"
                  margin="normal"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="re-enter password"
                  InputLabelProps={{ shrink: true }}
                />

                <Grid container spacing={2} sx={{ mt: 3, mb: 2 }}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => setStep(1)}
                      sx={{ py: 1.5 }}
                    >
                      Back
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      sx={{ py: 1.5 }}
                    >
                      {loading ? <CircularProgress size={24} sx={{ color: '#111827' }} /> : 'Sign Up'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            )}

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Already have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: '#0088ff',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Log In
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Register;
