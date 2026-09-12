import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../layouts/AuthLayout';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

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
  Chip,
  Autocomplete,
  MenuItem
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
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  AccountBalanceOutlined as CollegeIcon,
  WcOutlined as GenderIcon,
  MenuBookOutlined as CourseIcon,
  AssignmentIndOutlined as RegNoIcon
} from '@mui/icons-material';

const DRAFT_KEY = 'hostel_register_draft';

// Comprehensive list of prominent colleges & universities for suggestions
const POPULAR_COLLEGES = [
  'Rajiv Gandhi University of Health Sciences (RGUHS), Bangalore',
  'RV College of Engineering (RVCE), Bangalore',
  'BMS College of Engineering (BMSCE), Bangalore',
  'M.S. Ramaiah Institute of Technology (MSRIT), Bangalore',
  'PES University (Ring Road Campus), Bangalore',
  'PES University (Electronic City Campus), Bangalore',
  'Dayananda Sagar College of Engineering (DSCE), Bangalore',
  'Bangalore Institute of Technology (BIT), Bangalore',
  'University Visvesvaraya College of Engineering (UVCE), Bangalore',
  'Siddaganga Institute of Technology (SIT), Tumkur',
  'Bapuji Institute of Engineering and Technology (BIET), Davangere',
  'UBDT College of Engineering, Davangere',
  'Sri Jayachamarajendra College of Engineering (SJCE / JSS STU), Mysuru',
  'The National Institute of Engineering (NIE), Mysuru',
  'National Institute of Technology Karnataka (NITK), Surathkal',
  'Indian Institute of Technology (IIT), Dharwad',
  'Indian Institute of Science (IISc), Bangalore',
  'Manipal Institute of Technology (MIT), Manipal',
  'KLE Technological University (BVBCET), Hubballi',
  'Basaveshwar Engineering College (BEC), Bagalkot',
  "BLDE Association's VP Dr. PG Halakatti College of Engineering, Vijayapura",
  'SDM College of Engineering and Technology, Dharwad',
  'Malnad College of Engineering (MCE), Hassan',
  'PDA College of Engineering, Kalaburagi',
  'Sir M. Visvesvaraya Institute of Technology (SMVIT), Bangalore',
  'Nitte Meenakshi Institute of Technology (NMIT), Bangalore',
  'New Horizon College of Engineering, Bangalore',
  'CMR Institute of Technology (CMRIT), Bangalore',
  'Oxford College of Engineering, Bangalore',
  'R.N.S. Institute of Technology (RNSIT), Bangalore',
  'JSS Academy of Technical Education (JSSATE), Bangalore',
  'BMS Institute of Technology and Management (BMSIT), Bangalore',
  'Christ University, Bangalore',
  "St. Joseph's University, Bangalore",
  'Mount Carmel College, Bangalore',
  'Bangalore University (Jnana Bharathi Campus), Bangalore',
  'Visvesvaraya Technological University (VTU), Belagavi',
  'Karnatak University, Dharwad',
  'Mangalore University, Mangalore',
  'Mysore University (Manasagangotri), Mysuru',
  'Kuvempu University, Shivamogga',
  'Gulbarga University, Kalaburagi',
  'Davangere University, Davangere',
  'Rani Channamma University, Belagavi',
  'Bangalore Medical College and Research Institute (BMCRI), Bangalore',
  'MS Ramaiah Medical College, Bangalore',
  'Kempegowda Institute of Medical Sciences (KIMS), Bangalore',
  'St. John\'s Medical College, Bangalore',
  'JSS Medical College, Mysuru',
  'Kasturba Medical College (KMC), Manipal',
  'Kasturba Medical College (KMC), Mangalore',
  'JJM Medical College, Davangere',
  'SS Institute of Medical Sciences and Research Centre, Davangere',
  'SDM College of Medical Sciences, Dharwad',
  'S.N. Medical College, Bagalkot',
  'BLDE Shri B.M. Patil Medical College, Vijayapura',
  'Karnataka Institute of Medical Sciences (KIMS), Hubballi',
  'Mysore Medical College and Research Institute (MMCRI), Mysuru',
  'Vijayanagar Institute of Medical Sciences (VIMS), Ballari',
  'National Law School of India University (NLSIU), Bangalore',
  'Indian Institute of Management (IIM), Bangalore'
];

// Popular degree / course options for quick predictive completion
const POPULAR_COURSES = [
  'B.E. Computer Science and Engineering',
  'B.E. Information Science and Engineering',
  'B.E. Electronics and Communication',
  'B.E. Mechanical Engineering',
  'B.E. Civil Engineering',
  'B.E. Artificial Intelligence & Machine Learning',
  'B.E. Data Science',
  'B.Tech Electrical & Electronics Engineering',
  'B.Tech Biotechnology',
  'MBBS',
  'BDS',
  'B.Sc Nursing',
  'B.Pharm',
  'Pharm D',
  'BCA (Bachelor of Computer Applications)',
  'BBA (Bachelor of Business Administration)',
  'B.Com (Bachelor of Commerce)',
  'B.Sc (Bachelor of Science)',
  'BA (Bachelor of Arts)',
  'BA LLB / BBA LLB (Law)',
  'B.Arch (Architecture)',
  'MCA (Master of Computer Applications)',
  'MBA (Master of Business Administration)',
  'M.Tech Computer Science',
  'M.Tech VLSI & Embedded Systems',
  'M.Sc (Master of Science)',
  'M.Com (Master of Commerce)',
  'MD General Medicine',
  'MS General Surgery'
];

const Register = () => {
  const { register } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
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
  const [gender, setGender] = useState(initialDraft.gender || 'MALE');
  const [dob, setDob] = useState(initialDraft.dob || ''); // stores YYYY-MM-DD
  const [registrationNumber, setRegistrationNumber] = useState(initialDraft.registrationNumber || '');
  const [password, setPassword] = useState(initialDraft.password || '');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Student / Alumni specific mandatory fields
  const [college, setCollege] = useState(initialDraft.college || '');
  const [course, setCourse] = useState(initialDraft.course || '');
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
          gender,
          dob,
          registrationNumber,
          password,
          college,
          course,
          startYear,
          endYear
        })
      );
    } catch (err) {
      console.error('Failed to save register draft:', err);
    }
  }, [step, role, name, email, phone, adhaar, gender, dob, registrationNumber, password, college, course, startYear, endYear]);

  // Dynamic preview of assigned role for student/alumni based on graduation year
  const computedRole = useMemo(() => {
    if (role === 'MEMBER') return 'Community Member';
    if (!endYear) return 'Student / Alumni';
    const parsed = dayjs(endYear);
    const gradYearNum = parsed.isValid() ? parsed.year() : parseInt(endYear, 10);
    if (!gradYearNum || isNaN(gradYearNum)) return 'Student / Alumni';
    return gradYearNum < currentYear ? `Alumni (Graduated in ${gradYearNum})` : `Student (Expected in ${gradYearNum})`;
  }, [role, endYear, currentYear]);

  // Explicit element refs to guarantee seamless Enter-key navigation across all fields
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const genderRef = useRef(null);
  const regNoRef = useRef(null);
  const aadhaarRef = useRef(null);
  const phoneRef = useRef(null);
  const dobRef = useRef(null);
  const collegeRef = useRef(null);
  const courseRef = useRef(null);
  const startYearRef = useRef(null);
  const endYearRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  // Dynamic word-predictive filtering for college suggestions (only show when typing)
  const collegeSuggestions = useMemo(() => {
    const query = college.trim().toLowerCase();
    if (!query || query.length < 2) return [];
    
    return POPULAR_COLLEGES.filter((cName) => {
      const lower = cName.toLowerCase();
      const words = lower.split(/[\s,()/-]+/);
      return words.some((word) => word.startsWith(query)) || lower.includes(query);
    }).slice(0, 8);
  }, [college]);

  // Dynamic word-predictive filtering for course suggestions (only show when typing)
  const courseSuggestions = useMemo(() => {
    const query = course.trim().toLowerCase();
    if (!query || query.length < 1) return [];

    return POPULAR_COURSES.filter((cName) => {
      const lower = cName.toLowerCase();
      const words = lower.split(/[\s,()/-]+/);
      return words.some((word) => word.startsWith(query)) || lower.includes(query);
    }).slice(0, 8);
  }, [course]);

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
    if (e) e.preventDefault();
    setError('');
    const notifyWarn = (msg) => {
      setError(msg);
      enqueueSnackbar(msg, { variant: 'warning' });
    };

    // Common mandatory validations
    if (!name.trim()) { notifyWarn('Full Name is mandatory.'); return; }
    if (!email.trim()) { notifyWarn('Email Address is mandatory.'); return; }
    if (!phone.trim()) { notifyWarn('Phone Number is mandatory.'); return; }
    if (!gender) { notifyWarn('Gender is mandatory.'); return; }

    let cleanAdhaar = '';
    if (adhaar && adhaar.trim()) {
      cleanAdhaar = adhaar.replace(/\s+/g, '');
      if (cleanAdhaar.length !== 12 || !/^\d{12}$/.test(cleanAdhaar)) {
        notifyWarn('Aadhaar Number must be exactly 12 digits if provided.');
        return;
      }
    }

    if (dob && !dayjs(dob).isValid()) {
      notifyWarn('Please enter a valid Date of Birth (DD/MM/YYYY).');
      return;
    }

    // Role-specific validations
    let sYearStr = '';
    let eYearStr = '';

    const collegeValue = (college || collegeRef.current?.value || '').trim();
    const courseValue = (course || courseRef.current?.value || '').trim();

    // Ensure state stays synchronized
    if (collegeValue && college !== collegeValue) setCollege(collegeValue);
    if (courseValue && course !== courseValue) setCourse(courseValue);

    if (role === 'STUDENT' || role === 'ALUMNI') {
      if (!collegeValue) { notifyWarn('College / University Name is mandatory.'); return; }
      if (!courseValue) { notifyWarn('Course / Degree is mandatory.'); return; }
      if (!startYear) { notifyWarn('College Joining Date is mandatory (DD/MM/YYYY).'); return; }
      if (!endYear) { notifyWarn('Graduation Date is mandatory (DD/MM/YYYY).'); return; }

      const startParsed = dayjs(startYear);
      const endParsed = dayjs(endYear);

      if (!startParsed.isValid()) {
        notifyWarn('Please enter a valid Joining Date (DD/MM/YYYY).');
        return;
      }
      if (!endParsed.isValid()) {
        notifyWarn('Please enter a valid Graduation Date (DD/MM/YYYY).');
        return;
      }
      if (endParsed.isBefore(startParsed)) {
        notifyWarn('Graduation Date cannot be earlier than Joining Date.');
        return;
      }

      sYearStr = String(startParsed.year());
      eYearStr = String(endParsed.year());
    }

    if (role === 'MEMBER') {
      if (!registrationNumber.trim()) {
        notifyWarn('Registration Number is mandatory for Community Members.');
        return;
      }
    }

    // Password validations at the end
    if (!password) { notifyWarn('Password is mandatory.'); return; }
    if (password.length < 6) {
      notifyWarn('Password must be at least 6 characters.');
      return;
    }
    if (!confirmPassword) {
      notifyWarn('Please confirm your password.');
      return;
    }
    if (password !== confirmPassword) {
      notifyWarn('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await register({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      adhaar: cleanAdhaar || undefined,
      gender,
      dob: dob || undefined,
      registrationNumber: registrationNumber.trim(),
      password,
      role,
      college: collegeValue,
      course: courseValue,
      startYear: sYearStr,
      endYear: eYearStr
    });
    setLoading(false);

    if (result?.success) {
      enqueueSnackbar('Account created successfully! Welcome to the Hostel Community.', { variant: 'success' });
      // Clear draft on successful registration
      try { localStorage.removeItem(DRAFT_KEY); } catch (err) {}
      navigate('/profile');
    } else {
      const errMsg = result?.message || 'Registration failed. Please check your credentials.';
      setError(errMsg);
      enqueueSnackbar(errMsg, { variant: 'error' });
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
            maxWidth: { xs: '100%', sm: step === 1 ? 460 : 720, md: step === 1 ? 480 : 890 },
            bgcolor: '#FFFFFF',
            borderRadius: '24px',
            p: { xs: 3, sm: 4, md: 4.5 },
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            position: 'relative',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Title */}
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
            {role === 'MEMBER' ? 'Create Member Account' : 'Create Student/Alumni Account'}
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
            /* STEP 2: 3-COLUMN RESPONSIVE CSS GRID FORM WITH ENTER-KEY NAVIGATION */
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

              {/* Form Inputs Grid (3 Inputs Per Row on Desktop/Tablet) */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
                  gap: 2
                }}
              >
                {/* Row 1: Full Name, Email Address, Gender (3 fields) */}
                <Box>
                  <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                    Full Name <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    autoFocus
                    inputRef={nameRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        emailRef.current?.focus();
                      }
                    }}
                    placeholder="Enter Full Name"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon sx={{ color: '#94A3B8', fontSize: 19 }} />
                          </InputAdornment>
                        ),
                      }
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
                    inputRef={emailRef}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        genderRef.current?.focus();
                      }
                    }}
                    placeholder="Enter Email Address"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <MailIcon sx={{ color: '#94A3B8', fontSize: 19 }} />
                          </InputAdornment>
                        ),
                      }
                    }}
                    sx={inputStyle}
                  />
                </Box>

                <Box>
                  <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                    Gender <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    inputRef={genderRef}
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (role === 'MEMBER') {
                          regNoRef.current?.focus();
                        } else {
                          aadhaarRef.current?.focus();
                        }
                      }
                    }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <GenderIcon sx={{ color: '#94A3B8', fontSize: 19 }} />
                          </InputAdornment>
                        ),
                      }
                    }}
                    sx={inputStyle}
                  >
                    <MenuItem value="MALE">Male</MenuItem>
                    <MenuItem value="FEMALE">Female</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </TextField>
                </Box>

                {/* Community Member Specific Field: Registration Number right after Gender */}
                {role === 'MEMBER' && (
                  <Box>
                    <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                      Registration Number <span style={{ color: '#EF4444' }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      inputRef={regNoRef}
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          aadhaarRef.current?.focus();
                        }
                      }}
                      placeholder="Enter Reg Number"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <RegNoIcon sx={{ color: '#94A3B8', fontSize: 19 }} />
                            </InputAdornment>
                          ),
                        }
                      }}
                      sx={inputStyle}
                    />
                  </Box>
                )}

                {/* Common Fields: Aadhaar Number, Phone Number, Date of Birth */}
                <Box>
                  <Typography component="label" sx={{ display: 'flex', alignItems: 'center', gap: 0.7, fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                    Aadhaar Number <span style={{ color: '#94A3B8', fontWeight: 400, fontSize: '12px' }}>(Optional)</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    inputRef={aadhaarRef}
                    value={adhaar}
                    onChange={handleAadhaarChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        phoneRef.current?.focus();
                      }
                    }}
                    placeholder="XXXX XXXX XXXX"
                    slotProps={{
                      htmlInput: { inputMode: 'numeric', maxLength: 14 },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <AadhaarIcon sx={{ color: '#94A3B8', fontSize: 19 }} />
                          </InputAdornment>
                        ),
                      }
                    }}
                    sx={inputStyle}
                  />
                </Box>

                <Box>
                  <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                    Phone Number <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    inputRef={phoneRef}
                    value={phone}
                    onChange={handlePhoneChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        dobRef.current?.focus();
                      }
                    }}
                    placeholder="Enter 10-digit Phone Number"
                    slotProps={{
                      htmlInput: { inputMode: 'numeric', maxLength: 10 },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon sx={{ color: '#94A3B8', fontSize: 19 }} />
                          </InputAdornment>
                        ),
                      }
                    }}
                    sx={inputStyle}
                  />
                </Box>

                <Box>
                  <Typography component="label" sx={{ display: 'flex', alignItems: 'center', gap: 0.7, fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                    Date of Birth <span style={{ color: '#94A3B8', fontWeight: 400, fontSize: '12px' }}>(Optional)</span>
                  </Typography>
                  <DatePicker
                    format="DD/MM/YYYY"
                    views={['year', 'month', 'day']}
                    closeOnSelect={true}
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
                        inputRef: dobRef,
                        placeholder: 'DD/MM/YYYY',
                        onKeyDown: (e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (role === 'STUDENT' || role === 'ALUMNI') {
                              collegeRef.current?.focus();
                            } else {
                              passwordRef.current?.focus();
                            }
                          }
                        },
                        sx: inputStyle
                      }
                    }}
                  />
                </Box>

                {/* Student / Alumni Specific Fields (College, Course, Joining Date, Graduation Date) */}
                {(role === 'STUDENT' || role === 'ALUMNI') && (
                  <>
                    <Box>
                      <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                        College / University Name <span style={{ color: '#EF4444' }}>*</span>
                      </Typography>
                      <Autocomplete
                        freeSolo
                        clearOnBlur={false}
                        openOnFocus={false}
                        options={collegeSuggestions}
                        value={college}
                        onChange={(event, newValue) => {
                          setCollege(newValue || '');
                        }}
                        inputValue={college}
                        onInputChange={(event, newInputValue, reason) => {
                          if (reason === 'reset') return;
                          setCollege(newInputValue || '');
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            size="small"
                            inputRef={collegeRef}
                            onChange={(e) => {
                              setCollege(e.target.value);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                courseRef.current?.focus();
                              }
                            }}
                            placeholder="Enter college name"
                            slotProps={{
                              input: {
                                ...(params.InputProps || {}),
                                startAdornment: (
                                  <>
                                    <InputAdornment position="start">
                                      <CollegeIcon sx={{ color: '#94A3B8', fontSize: 19 }} />
                                    </InputAdornment>
                                    {params.InputProps?.startAdornment}
                                  </>
                                ),
                              }
                            }}
                            sx={inputStyle}
                          />
                        )}
                      />
                    </Box>

                    <Box>
                      <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                        Course / Degree <span style={{ color: '#EF4444' }}>*</span>
                      </Typography>
                      <Autocomplete
                        freeSolo
                        clearOnBlur={false}
                        openOnFocus={false}
                        options={courseSuggestions}
                        value={course}
                        onChange={(event, newValue) => {
                          setCourse(newValue || '');
                        }}
                        inputValue={course}
                        onInputChange={(event, newInputValue, reason) => {
                          if (reason === 'reset') return;
                          setCourse(newInputValue || '');
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            size="small"
                            inputRef={courseRef}
                            onChange={(e) => {
                              setCourse(e.target.value);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                startYearRef.current?.focus();
                              }
                            }}
                            placeholder="B.E., B.Tech., MBBS, BCA"
                            slotProps={{
                              input: {
                                ...(params.InputProps || {}),
                                startAdornment: (
                                  <>
                                    <InputAdornment position="start">
                                      <CourseIcon sx={{ color: '#94A3B8', fontSize: 19 }} />
                                    </InputAdornment>
                                    {params.InputProps?.startAdornment}
                                  </>
                                ),
                              }
                            }}
                            sx={inputStyle}
                          />
                        )}
                      />
                    </Box>

                    <Box>
                      <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                        College Joining Date <span style={{ color: '#EF4444' }}>*</span>
                      </Typography>
                      <DatePicker
                        format="DD/MM/YYYY"
                        views={['year', 'month', 'day']}
                        closeOnSelect={true}
                        value={startYear ? dayjs(startYear) : null}
                        onChange={(newValue) => {
                          const formatted = newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '';
                          setStartYear(formatted);
                        }}
                        maxDate={dayjs().add(5, 'year')}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                            inputRef: startYearRef,
                            placeholder: 'DD/MM/YYYY',
                            onKeyDown: (e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                endYearRef.current?.focus();
                              }
                            },
                            sx: inputStyle
                          }
                        }}
                      />
                    </Box>

                    <Box>
                      <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                        Graduation Date <span style={{ color: '#EF4444' }}>*</span>
                      </Typography>
                      <DatePicker
                        format="DD/MM/YYYY"
                        views={['year', 'month', 'day']}
                        closeOnSelect={true}
                        value={endYear ? dayjs(endYear) : null}
                        onChange={(newValue) => {
                          const formatted = newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '';
                          setEndYear(formatted);
                        }}
                        maxDate={dayjs().add(15, 'year')}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                            inputRef: endYearRef,
                            placeholder: 'DD/MM/YYYY',
                            onKeyDown: (e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                passwordRef.current?.focus();
                              }
                            },
                            sx: inputStyle
                          }
                        }}
                      />
                    </Box>
                  </>
                )}

                {/* Password & Confirm Password (Placed at the very end of the form) */}
                <Box>
                  <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                    Password <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    inputRef={passwordRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        confirmPasswordRef.current?.focus();
                      }
                    }}
                    placeholder="Enter Password"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ color: '#94A3B8', fontSize: 19 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              sx={{ color: '#64748B', p: 0.5 }}
                              title={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }
                    }}
                    sx={inputStyle}
                  />
                </Box>

                <Box>
                  <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                    Confirm Password <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    inputRef={confirmPasswordRef}
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSubmit(e);
                      }
                    }}
                    placeholder="Re-enter password"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ color: '#94A3B8', fontSize: 19 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                              sx={{ color: '#64748B', p: 0.5 }}
                              title={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                              {showConfirmPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }
                    }}
                    sx={inputStyle}
                  />
                </Box>
              </Box>

              {/* Submit Button */}
              <Button
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                endIcon={<ArrowForwardIcon />}
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
                {loading ? <CircularProgress size={22} sx={{ color: '#FFFFFF' }} /> : `Create`}
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


