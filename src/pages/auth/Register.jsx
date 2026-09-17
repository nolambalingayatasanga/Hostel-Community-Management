import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';
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
  AssignmentIndOutlined as RegNoIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  WarningAmber as WarningAmberIcon,
  HomeOutlined
} from '@mui/icons-material';
import AuthImageSlideshow from '../../components/auth/AuthImageSlideshow';

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
  const [dobDayjs, setDobDayjs] = useState(() => (initialDraft.dob && dayjs(initialDraft.dob).isValid() ? dayjs(initialDraft.dob) : null));
  const [registrationNumber, setRegistrationNumber] = useState(initialDraft.registrationNumber || '');
  const [password, setPassword] = useState(initialDraft.password || '');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Student / Alumni specific mandatory fields
  const [college, setCollege] = useState(initialDraft.college || '');
  const [course, setCourse] = useState(initialDraft.course || '');
  const [startYear, setStartYear] = useState(initialDraft.startYear || '');
  const [startYearDayjs, setStartYearDayjs] = useState(() => (initialDraft.startYear && dayjs(initialDraft.startYear).isValid() ? dayjs(initialDraft.startYear) : null));
  const [endYear, setEndYear] = useState(initialDraft.endYear || '');
  const [endYearDayjs, setEndYearDayjs] = useState(() => (initialDraft.endYear && dayjs(initialDraft.endYear).isValid() ? dayjs(initialDraft.endYear) : null));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Email Deliverability & Existence Validation State
  const [emailValidation, setEmailValidation] = useState({
    status: null, // null | 'CHECKING' | 'EXISTS' | 'DOES_NOT_EXIST' | 'UNKNOWN' | 'ALREADY_REGISTERED'
    message: ''
  });
  const validationTimerRef = useRef(null);

  const EMAIL_FORMAT_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  const performEmailValidation = async (emailToVerify) => {
    const trimmed = (emailToVerify || '').trim().toLowerCase();
    if (!trimmed) {
      setEmailValidation({ status: null, message: '' });
      return null;
    }

    if (!EMAIL_FORMAT_REGEX.test(trimmed)) {
      const res = { status: 'INVALID_FORMAT', message: 'Please enter a valid email address' };
      setEmailValidation(res);
      return res;
    }

    setEmailValidation({ status: 'CHECKING', message: 'Checking email availability...' });

    try {
      const res = await API.post('/auth/validate-email', { email: trimmed });
      const data = res.data;
      if (data.status === 'EXISTS') {
        const r = { status: 'EXISTS', message: 'Email is available' };
        setEmailValidation(r);
        return r;
      } else if (data.status === 'ALREADY_REGISTERED') {
        const r = { status: 'ALREADY_REGISTERED', message: data.message || 'This email is already registered. Please log in.' };
        setEmailValidation(r);
        return r;
      } else if (data.status === 'INVALID_FORMAT' || data.status === 'DOES_NOT_EXIST') {
        const r = { status: 'INVALID_FORMAT', message: data.message || 'Please enter a valid email address' };
        setEmailValidation(r);
        return r;
      } else {
        const r = { status: 'EXISTS', message: 'Email is available' };
        setEmailValidation(r);
        return r;
      }
    } catch (err) {
      console.error('Email validation error:', err);
      const r = { status: 'EXISTS', message: 'Email is available' };
      setEmailValidation(r);
      return r;
    }
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);

    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
    }

    const trimmed = val.trim();
    if (!trimmed) {
      setEmailValidation({ status: null, message: '' });
      return;
    }

    // Debounce backend check by 500ms
    validationTimerRef.current = setTimeout(() => {
      performEmailValidation(trimmed);
    }, 500);
  };

  const handleEmailBlur = () => {
    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
    }
    if (email.trim() && (!emailValidation.status || emailValidation.status === 'CHECKING')) {
      performEmailValidation(email.trim());
    }
  };

  useEffect(() => {
    return () => {
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }
    };
  }, []);

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

    // Database Existence Validation Guard
    let currentEmailStatus = emailValidation.status;
    if (currentEmailStatus !== 'EXISTS') {
      const verifyRes = await performEmailValidation(email.trim());
      currentEmailStatus = verifyRes?.status;
    }

    if (currentEmailStatus === 'DOES_NOT_EXIST' || currentEmailStatus === 'INVALID_FORMAT') {
      notifyWarn(emailValidation.message || 'Please enter a valid email address.');
      return;
    }
    if (currentEmailStatus === 'ALREADY_REGISTERED') {
      notifyWarn(emailValidation.message || 'This email is already registered. Please log in.');
      return;
    }

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

    // Password validations at the end
    if (!password) { notifyWarn('New Password is mandatory.'); return; }
    if (password.length < 6) {
      notifyWarn('New Password must be at least 6 characters.');
      return;
    }
    if (!confirmPassword) {
      notifyWarn('Please confirm your new password.');
      return;
    }
    if (password !== confirmPassword) {
      notifyWarn('New Password and Confirm New Password do not match.');
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
      registrationNumber: registrationNumber?.trim() || undefined,
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

  const emailInputStyle = useMemo(() => {
    let borderColor = '#E2E8F0';
    let hoverBorderColor = '#CBD5E1';
    let focusBorderColor = '#1877F2';
    let bgColor = '#FFFFFF';

    if (emailValidation.status === 'EXISTS') {
      borderColor = '#16A34A';
      hoverBorderColor = '#15803D';
      focusBorderColor = '#16A34A';
      bgColor = '#F0FDF4';
    } else if (emailValidation.status === 'DOES_NOT_EXIST' || emailValidation.status === 'INVALID_FORMAT' || emailValidation.status === 'ALREADY_REGISTERED') {
      borderColor = '#DC2626';
      hoverBorderColor = '#B91C1C';
      focusBorderColor = '#DC2626';
      bgColor = '#FEF2F2';
    }

    return {
      '& .MuiOutlinedInput-root': {
        borderRadius: '10px',
        backgroundColor: bgColor,
        fontSize: '14px',
        height: '44px',
        transition: 'all 0.2s ease',
        '& fieldset': { borderColor, borderWidth: emailValidation.status ? '1.5px' : '1px' },
        '&:hover fieldset': { borderColor: hoverBorderColor },
        '&.Mui-focused fieldset': { borderColor: focusBorderColor, borderWidth: '1.5px' },
      }
    };
  }, [emailValidation.status]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {/* Full-screen 50/50 split */}
      <Box
        sx={{
          height: '100vh',
          maxHeight: '100vh',
          width: '100vw',
          maxWidth: '100vw',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          overflow: 'hidden',
          fontFamily: '"Inter", "Roboto", sans-serif'
        }}
      >
        {/* ─── LEFT PANEL — Gallery Slideshow (60%) ─── */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            width: '60%',
            minWidth: '60%',
            maxWidth: '60%',
            height: '100vh',
            maxHeight: '100vh',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          <AuthImageSlideshow />
        </Box>

        {/* ─── RIGHT PANEL — Register Form (40%) ─── */}
        <Box
          sx={{
            width: { xs: '100%', md: '40%' },
            minWidth: { md: '40%' },
            maxWidth: { md: '40%' },
            height: '100vh',
            maxHeight: '100vh',
            bgcolor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* ─── FIXED HEADER ─── */}
          <Box
            sx={{
              flexShrink: 0,
              px: { xs: 3, sm: 4.5 },
              pt: { xs: 2.5, sm: 3 },
              pb: 2,
              borderBottom: '1px solid #F1F5F9',
              bgcolor: '#FFFFFF',
              zIndex: 5
            }}
          >
            {/* Mobile logo */}
        

            {/* Title */}
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: '#0F172A',
                fontSize: { xs: '20px', sm: '22px' },
                letterSpacing: '-0.4px',
                textAlign: 'center'
              }}
            >
              {role === 'MEMBER' ? 'Create Member Account' : 'Create Student/Alumni Account'}
            </Typography>

            {/* Step 2 Header Chips */}
            {step === 2 && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
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
                    fontSize: '12px',
                    py: 1.6
                  }}
                />
                <Button
                  size="small"
                  onClick={() => setStep(1)}
                  startIcon={<ArrowBackIcon sx={{ fontSize: 15 }} />}
                  sx={{ textTransform: 'none', color: '#64748B', fontWeight: 600, fontSize: '12px' }}
                >
                  Change Role
                </Button>
              </Box>
            )}

            {/* Error Alert */}
            {error && (
              <Alert
                severity="error"
                sx={{
                  mt: 1.5,
                  borderRadius: '10px',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  py: 0.5
                }}
              >
                {error}
              </Alert>
            )}
          </Box>

          {/* ─── SCROLLABLE MIDDLE (Fields) + FIXED FOOTER inside <form> ─── */}
          <Box
            component="form"
            id="register-form"
            onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNextStep(); } : handleSubmit}
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Scrollable Middle Container */}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                px: { xs: 3, sm: 4.5 },
                py: 2.5,
                '&::-webkit-scrollbar': { width: '5px' },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: '4px' },
                '&::-webkit-scrollbar-thumb:hover': { bgcolor: '#94A3B8' }
              }}
            >
              {step === 1 ? (
                /* STEP 1: CHOOSE ROLE */
                <Box sx={{ maxWidth: 440, mx: 'auto', py: 1 }}>
                  <Stack spacing={2} sx={{ mb: 2 }}>
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
                </Box>
              ) : (
                /* STEP 2: 2 INPUTS PER ROW RESPONSIVE GRID */
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                    gap: 2
                  }}
                >
                  {/* 1. Full Name */}
                  <Box>
                    <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                      Full Name <span style={{ color: '#EF4444' }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
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

                  {/* 2. Email Address */}
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
                      onChange={handleEmailChange}
                      onBlur={handleEmailBlur}
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
                          endAdornment: (
                            <InputAdornment position="end">
                              {emailValidation.status === 'CHECKING' && (
                                <CircularProgress size={18} sx={{ color: '#0088FF' }} />
                              )}
                              {emailValidation.status === 'EXISTS' && (
                                <CheckIcon sx={{ color: '#16A34A', fontSize: 20, fontWeight: 700 }} />
                              )}
                              {(emailValidation.status === 'DOES_NOT_EXIST' || emailValidation.status === 'INVALID_FORMAT' || emailValidation.status === 'ALREADY_REGISTERED') && (
                                <CancelIcon sx={{ color: '#DC2626', fontSize: 19 }} />
                              )}
                            </InputAdornment>
                          ),
                        }
                      }}
                      sx={emailInputStyle}
                    />

                    {/* Database Validation Feedback */}
                    {emailValidation.status === 'EXISTS' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.6 }}>
                        <CheckIcon sx={{ fontSize: 14, color: '#16A34A', fontWeight: 700 }} />
                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#16A34A' }}>
                          Email is available
                        </Typography>
                      </Box>
                    )}
                    {(emailValidation.status === 'DOES_NOT_EXIST' || emailValidation.status === 'INVALID_FORMAT') && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.6 }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#DC2626' }}>
                          ❌ {emailValidation.message || 'Please enter a valid email address'}
                        </Typography>
                      </Box>
                    )}
                    {emailValidation.status === 'ALREADY_REGISTERED' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.6 }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#DC2626' }}>
                          ❌ {emailValidation.message || 'This email is already registered. Please log in.'}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* 3. Gender */}
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

                  {/* 4. Phone Number */}
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
                          aadhaarRef.current?.focus();
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

                  {/* 5. Aadhaar Number (Optional) */}
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
                          dobRef.current?.focus();
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

                  {/* 6. Date of Birth (Optional) */}
                  <Box>
                    <Typography component="label" sx={{ display: 'flex', alignItems: 'center', gap: 0.7, fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                      Date of Birth <span style={{ color: '#94A3B8', fontWeight: 400, fontSize: '12px' }}>(Optional)</span>
                    </Typography>
                    <DatePicker
                      format="DD/MM/YYYY"
                      views={['year', 'month', 'day']}
                      closeOnSelect={true}
                      value={dobDayjs}
                      onChange={(newValue) => {
                        setDobDayjs(newValue);
                        if (!newValue) {
                          setDob('');
                        } else if (dayjs.isDayjs(newValue) && newValue.isValid()) {
                          setDob(newValue.format('YYYY-MM-DD'));
                        }
                      }}
                      maxDate={dayjs()}
                      slotProps={{
                        field: { clearable: true },
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
                                (regNoRef.current || passwordRef.current)?.focus();
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
                      {/* 7. College / University Name */}
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
                          renderInput={(params) => {
                            const { onKeyDown: origOnKeyDown, ...otherInputProps } = params.inputProps || {};
                            return (
                              <TextField
                                {...params}
                                fullWidth
                                size="small"
                                inputRef={collegeRef}
                                placeholder="Enter college name"
                                inputProps={{
                                  ...otherInputProps,
                                  onKeyDown: (e) => {
                                    if (typeof origOnKeyDown === 'function') {
                                      origOnKeyDown(e);
                                    }
                                    if (e.key === 'Enter' && !e.defaultPrevented) {
                                      e.preventDefault();
                                      courseRef.current?.focus();
                                    }
                                  }
                                }}
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
                            );
                          }}
                        />
                      </Box>

                      {/* 8. Course / Degree */}
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
                          renderInput={(params) => {
                            const { onKeyDown: origOnKeyDown, ...otherInputProps } = params.inputProps || {};
                            return (
                              <TextField
                                {...params}
                                fullWidth
                                size="small"
                                inputRef={courseRef}
                                placeholder="B.E., B.Tech., MBBS, BCA"
                                inputProps={{
                                  ...otherInputProps,
                                  onKeyDown: (e) => {
                                    if (typeof origOnKeyDown === 'function') {
                                      origOnKeyDown(e);
                                    }
                                    if (e.key === 'Enter' && !e.defaultPrevented) {
                                      e.preventDefault();
                                      startYearRef.current?.focus();
                                    }
                                  }
                                }}
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
                            );
                          }}
                        />
                      </Box>

                      {/* 9. College Joining Date */}
                      <Box>
                        <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                          College Joining Date <span style={{ color: '#EF4444' }}>*</span>
                        </Typography>
                        <DatePicker
                          format="DD/MM/YYYY"
                          views={['year', 'month', 'day']}
                          closeOnSelect={true}
                          value={startYearDayjs}
                          onChange={(newValue) => {
                            setStartYearDayjs(newValue);
                            if (!newValue) {
                              setStartYear('');
                            } else if (dayjs.isDayjs(newValue) && newValue.isValid()) {
                              setStartYear(newValue.format('YYYY-MM-DD'));
                            }
                          }}
                          maxDate={dayjs().add(5, 'year')}
                          slotProps={{
                            field: { clearable: true },
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

                      {/* 10. Graduation Date */}
                      <Box>
                        <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                          Graduation Date <span style={{ color: '#EF4444' }}>*</span>
                        </Typography>
                        <DatePicker
                          format="DD/MM/YYYY"
                          views={['year', 'month', 'day']}
                          closeOnSelect={true}
                          value={endYearDayjs}
                          onChange={(newValue) => {
                            setEndYearDayjs(newValue);
                            if (!newValue) {
                              setEndYear('');
                            } else if (dayjs.isDayjs(newValue) && newValue.isValid()) {
                              setEndYear(newValue.format('YYYY-MM-DD'));
                            }
                          }}
                          maxDate={dayjs().add(15, 'year')}
                          slotProps={{
                            field: { clearable: true },
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

                  {/* Community Member Specific Field: Registration Number */}
                  {role === 'MEMBER' && (
                    <Box sx={{ gridColumn: { sm: 'span 2' } }}>
                      <Typography component="label" sx={{ display: 'flex', alignItems: 'center', gap: 0.7, fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                        Registration Number <span style={{ color: '#94A3B8', fontWeight: 400, fontSize: '12px' }}>(Optional)</span>
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
                            passwordRef.current?.focus();
                          }
                        }}
                        placeholder="Enter Reg Number (Optional)"
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

                  {/* 11. New Password */}
                  <Box>
                    <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                      New Password <span style={{ color: '#EF4444' }}>*</span>
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
                      placeholder="Enter New Password"
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

                  {/* 12. Confirm New Password */}
                  <Box>
                    <Typography component="label" sx={{ display: 'block', fontWeight: 600, color: '#1E293B', fontSize: '13px', mb: 0.6 }}>
                      Confirm New Password <span style={{ color: '#EF4444' }}>*</span>
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
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                      placeholder="Re-enter New Password"
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
              )}
            </Box>

            {/* ─── FIXED FOOTER ─── */}
            <Box
              sx={{
                flexShrink: 0,
                px: { xs: 3, sm: 4.5 },
                py: 2,
                borderTop: '1px solid #F1F5F9',
                bgcolor: '#FFFFFF',
                boxShadow: '0 -4px 16px rgba(0,0,0,0.03)',
                zIndex: 5
              }}
            >
              {step === 1 ? (
                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  onClick={handleNextStep}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    py: 1.25,
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
              ) : (
                <Button
                  fullWidth
                  size="large"
                  type="submit"
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  disabled={loading}
                  sx={{
                    py: 1.25,
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
                  {loading ? <CircularProgress size={22} sx={{ color: '#FFFFFF' }} /> : 'Create'}
                </Button>
              )}

              {/* Divider */}
              <Box sx={{ display: 'flex', alignItems: 'center', my: 1.5 }}>
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

              {/* Login footer link */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#64748B', fontSize: '13px' }}>
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
            </Box>
          </Box>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default Register;


