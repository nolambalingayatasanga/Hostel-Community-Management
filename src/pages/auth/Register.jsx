import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../layouts/AuthLayout';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
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
  PersonOutlined as PersonIcon,
  EmailOutlined as MailIcon,
  PhoneOutlined as PhoneIcon,
  BadgeOutlined as AadhaarIcon,
  CalendarTodayOutlined as DateIcon,
  LockOutlined as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  SchoolOutlined as StudentIcon,
  SupervisorAccountOutlined as MemberIcon,
  PersonAddOutlined as RegisterIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  AccountBalanceOutlined as CollegeIcon
} from '@mui/icons-material';

const DRAFT_KEY = 'hostel_register_draft';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Load initial draft from localStorage to prevent loss on refresh
  const getSavedDraft = () => {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    } catch {
      return {};
    }
  };

  const initialDraft = getSavedDraft();

  // State initialization with localStorage fallback
  const [step, setStep] = useState(initialDraft.step || 1);
  const [role, setRole] = useState(initialDraft.role || 'STUDENT');

  const [name, setName] = useState(initialDraft.name || '');
  const [email, setEmail] = useState(initialDraft.email || '');
  const [phone, setPhone] = useState(initialDraft.phone || '');
  const [adhaar, setAdhaar] = useState(initialDraft.adhaar || '');
  const [dob, setDob] = useState(initialDraft.dob || '');
  const [password, setPassword] = useState(initialDraft.password || '');
  const [showPassword, setShowPassword] = useState(false);

  // Student / Alumni specific mandatory fields
  const [college, setCollege] = useState(initialDraft.college || '');
  const [startYear, setStartYear] = useState(initialDraft.startYear || '');
  const [endYear, setEndYear] = useState(initialDraft.endYear || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentYear = new Date().getFullYear();

  // Sync to localStorage whenever fields change
  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          step,
          role,
          name,
          email,
          phone,
          adhaar,
          dob,
          password,
          college,
          startYear,
          endYear
        })
      );
    } catch (err) {
      console.error('Failed to save register draft:', err);
    }
  }, [step, role, name, email, phone, adhaar, dob, password, college, startYear, endYear]);

  // Dynamic preview of assigned role for student/alumni based on graduation year
  const computedRole = useMemo(() => {
    if (role === 'MEMBER') return 'Community Member';
    if (!endYear || isNaN(parseInt(endYear, 10))) return 'Student / Alumni';
    const gradYearNum = parseInt(endYear, 10);
    return gradYearNum < currentYear ? `Alumni (Class of ${gradYearNum})` : `Student (Expected ${gradYearNum})`;
  }, [role, endYear, currentYear]);

  // Handle Phone input (prevent negative values & non-digits)
  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
  };

  // Format Aadhaar with spaces as user types (XXXX XXXX XXXX) & reject negative/non-digits
  const handleAadhaarChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
    let formatted = raw;
    if (raw.length > 4 && raw.length <= 8) {
      formatted = `${raw.slice(0, 4)} ${raw.slice(4)}`;
    } else if (raw.length > 8) {
      formatted = `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8)}`;
    }
    setAdhaar(formatted);
  };

  const handleNextStep = () => {
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Common mandatory validations
    if (!name.trim()) { setError('Full Name is mandatory.'); return; }
    if (!email.trim()) { setError('Email Address is mandatory.'); return; }
    if (!phone.trim()) { setError('Phone Number is mandatory.'); return; }
    if (!adhaar.trim()) { setError('Aadhaar Number is mandatory.'); return; }
    if (!dob) { setError('Date of Birth is mandatory.'); return; }
    if (!password) { setError('Password is mandatory.'); return; }

    const cleanAdhaar = adhaar.replace(/\s+/g, '');
    if (cleanAdhaar.length !== 12 || !/^\d{12}$/.test(cleanAdhaar)) {
      setError('Aadhaar Number must be exactly 12 digits.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    // Role-specific validations
    if (role === 'STUDENT' || role === 'ALUMNI') {
      if (!college.trim()) { setError('College / University Name is mandatory.'); return; }
      if (!startYear) { setError('College Joining Year is mandatory.'); return; }
      if (!endYear) { setError('College Graduation Year is mandatory.'); return; }

      const sYear = parseInt(startYear, 10);
      const eYear = parseInt(endYear, 10);

      if (isNaN(sYear) || sYear < 1950) {
        setError('Please enter a valid Joining Year.');
        return;
      }
      if (isNaN(eYear) || eYear < 1950) {
        setError('Please enter a valid Graduation Year.');
        return;
      }
      if (eYear < sYear) {
        setError('Graduation Year cannot be earlier than Joining Year.');
        return;
      }
    }

    setLoading(true);
    const result = await register({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      adhaar: cleanAdhaar,
      dob,
      password,
      role,
      college: college.trim(),
      startYear: String(startYear),
      endYear: String(endYear)
    });
    setLoading(false);

    if (result?.success) {
      // Clear draft on successful registration
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
      navigate('/profile');
    } else {
      setError(result?.message || 'Registration failed. Please check your credentials.');
    }
  };

  const inputStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px',
      backgroundColor: '#FFFFFF',
      fontSize: '14px',
      height: '44px',
      '& fieldset': { borderColor: '#E2E8F0' },
      '&:hover fieldset': { borderColor: '#CBD5E1' },
      '&.Mui-focused fieldset': { borderColor: '#1877F2', borderWidth: '1.5px' },
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <AuthLayout>
        <Card
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', sm: step === 1 ? 460 : 660, md: step === 1 ? 480 : 720 },
            bgcolor: '#FFFFFF',
            borderRadius: '24px',
            p: { xs: 3, sm: 4, md: 4.5 },
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            position: 'relative',
            transition: 'all 0.3s ease'
          }}
        >
   

          {/* Title & Subtitle */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#0F172A',
                fontSize: '24px',
                letterSpacing: '-0.4px',
                mb: 0.5
              }}
            >
              Create Account
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

          {step === 1 ? (
            /* STEP 1: CHOOSE ROLE */
            <Box>
              <Typography
                sx={{
                  fontWeight: 600,
                  color: '#1E293B',
                  fontSize: '13.5px',
                  mb: 2,
                  textAlign: 'center'
                }}
              >
                What type of member are you?
              </Typography>

              <Stack spacing={2} sx={{ mb: 3.5 }}>
                {/* Option 1: Student / Alumni */}
                <Box
                  onClick={() => setRole('STUDENT')}
                  sx={{
                    p: 2.2,
                    borderRadius: '14px',
                    border: '2px solid',
                    borderColor: role === 'STUDENT' ? '#1877F2' : '#E2E8F0',
                    bgcolor: role === 'STUDENT' ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#93C5FD',
                      bgcolor: role === 'STUDENT' ? '#EFF6FF' : '#F8FAFC'
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '10px',
                      bgcolor: role === 'STUDENT' ? '#1877F2' : '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <StudentIcon sx={{ color: role === 'STUDENT' ? '#FFFFFF' : '#64748B', fontSize: 24 }} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '15px' }}>
                      Student / Alumni
                    </Typography>
                    <Typography sx={{ color: '#64748B', fontSize: '12.5px' }}>
                      Current residents or graduated hostel seniors
                    </Typography>
                  </Box>
                </Box>

                {/* Option 2: Community Member */}
                <Box
                  onClick={() => setRole('MEMBER')}
                  sx={{
                    p: 2.2,
                    borderRadius: '14px',
                    border: '2px solid',
                    borderColor: role === 'MEMBER' ? '#1877F2' : '#E2E8F0',
                    bgcolor: role === 'MEMBER' ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#93C5FD',
                      bgcolor: role === 'MEMBER' ? '#EFF6FF' : '#F8FAFC'
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '10px',
                      bgcolor: role === 'MEMBER' ? '#1877F2' : '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <MemberIcon sx={{ color: role === 'MEMBER' ? '#FFFFFF' : '#64748B', fontSize: 24 }} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '15px' }}>
                      Community Member
                    </Typography>
                    <Typography sx={{ color: '#64748B', fontSize: '12.5px' }}>
                      Trust board, parent representative, or patron
                    </Typography>
                  </Box>
                </Box>
              </Stack>

              <Button
                fullWidth
                size="large"
                variant="contained"
                onClick={handleNextStep}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  py: 1.3,
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '15px',
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #1877F2 0%, #0D62D9 100%)',
                  boxShadow: '0 8px 20px rgba(24, 119, 242, 0.35)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0D62D9 0%, #0B57D0 100%)'
                  }
                }}
              >
                Continue
              </Button>
            </Box>
          ) : (
            /* STEP 2: 2-COLUMN BALANCED CSS GRID FORM */
            <form onSubmit={handleSubmit}>
              {/* Header with Selected Role & Change Role Action */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Chip
                  label={`Assigned Role: ${computedRole}`}
                  color="primary"
                  size="small"
                  sx={{
                    borderRadius: '6px',
                    fontWeight: 700,
                    bgcolor: '#EFF6FF',
                    color: '#1877F2',
                    border: '1px solid #BFDBFE',
                    fontSize: '12.5px',
                    py: 1.8
                  }}
                />
                <Button
                  size="small"
                  onClick={() => setStep(1)}
                  startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
                  sx={{ textTransform: 'none', color: '#64748B', fontWeight: 600, fontSize: '12.5px' }}
                >
                  Change Role
                </Button>
              </Box>

              {/* Form Inputs Grid (2 Inputs Per Row) */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2
                }}
              >
                {/* Row 1: Full Name (Left) & Email Address (Right) */}
                <Box>
                  <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                    Full Name <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter Full Name"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: '#94A3B8', fontSize: 19 }} /></InputAdornment>,
                    }}
                    sx={inputStyle}
                  />
                </Box>

                <Box>
                  <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                    Email Address <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Email Address"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><MailIcon sx={{ color: '#94A3B8', fontSize: 19 }} /></InputAdornment>,
                    }}
                    sx={inputStyle}
                  />
                </Box>

                {/* Row 2: Phone Number (Left) & Aadhaar Number (Right) */}
                <Box>
                  <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                    Phone Number <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="Enter Phone Number"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ color: '#94A3B8', fontSize: 19 }} /></InputAdornment>,
                    }}
                    sx={inputStyle}
                  />
                </Box>

                <Box>
                  <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                    Aadhaar Number <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={adhaar}
                    onChange={handleAadhaarChange}
                    placeholder="Enter Aadhaar Number"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><AadhaarIcon sx={{ color: '#94A3B8', fontSize: 19 }} /></InputAdornment>,
                    }}
                    sx={inputStyle}
                  />
                </Box>

                {/* Row 3: Date of Birth (MUI DatePicker) & Password */}
                <Box>
                  <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                    Date of Birth <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <DatePicker
                    value={dob ? dayjs(dob) : null}
                    onChange={(newValue) => {
                      const formatted = newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '';
                      setDob(formatted);
                    }}
                    maxDate={dayjs()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        placeholder: 'Enter Date of Birth',
                        sx: inputStyle,
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <DateIcon sx={{ color: '#94A3B8', fontSize: 19 }} />
                            </InputAdornment>
                          ),
                        }
                      }
                    }}
                  />
                </Box>

                <Box>
                  <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                    Password <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Minimum 6 characters"
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
                    sx={inputStyle}
                  />
                </Box>

                {/* Student / Alumni Specific Fields */}
                {(role === 'STUDENT' || role === 'ALUMNI') && (
                  <>
                    {/* Row 4: College Name (Full Width spanning 2 columns) */}
                    <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
                      <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                        College / University Name <span style={{ color: '#EF4444' }}>*</span>
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        placeholder="Enter College / University Name"
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><CollegeIcon sx={{ color: '#94A3B8', fontSize: 19 }} /></InputAdornment>,
                        }}
                        sx={inputStyle}
                      />
                    </Box>

                    {/* Row 5: Joining Year & Graduation Year (MUI DatePicker Year Views) */}
                    <Box>
                      <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                        College Joining Year <span style={{ color: '#EF4444' }}>*</span>
                      </Typography>
                      <DatePicker
                        views={['year']}
                        format="YYYY"
                        value={startYear ? dayjs(`${startYear}-01-01`) : null}
                        onChange={(newValue) => {
                          const y = newValue && newValue.isValid() ? newValue.format('YYYY') : '';
                          setStartYear(y);
                        }}
                        minDate={dayjs('1950-01-01')}
                        maxDate={dayjs().add(5, 'year')}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                            placeholder: 'e.g. 2022',
                            sx: inputStyle
                          }
                        }}
                      />
                    </Box>

                    <Box>
                      <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                        Graduation Year <span style={{ color: '#EF4444' }}>*</span>
                      </Typography>
                      <DatePicker
                        views={['year']}
                        format="YYYY"
                        value={endYear ? dayjs(`${endYear}-01-01`) : null}
                        onChange={(newValue) => {
                          const y = newValue && newValue.isValid() ? newValue.format('YYYY') : '';
                          setEndYear(y);
                        }}
                        minDate={dayjs('1950-01-01')}
                        maxDate={dayjs().add(15, 'year')}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                            placeholder: 'e.g. 2026',
                            sx: inputStyle
                          }
                        }}
                      />
                    </Box>
                  </>
                )}
              </Box>

              {/* Submit Button */}
              <Button
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 3.5,
                  py: 1.35,
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
                {loading ? <CircularProgress size={22} sx={{ color: '#FFFFFF' }} /> : 'Create Account'}
              </Button>
            </form>
          )}

          {/* Divider */}
          <Box sx={{ display: 'flex', alignItems: 'center', my: 2.5 }}>
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

          {/* Login footer */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '13.5px' }}>
              Already have an account?{' '}
              <Link
                component={RouterLink}
                to="/login"
                sx={{
                  color: '#1877F2',
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
    </LocalizationProvider>
  );
};

export default Register;
