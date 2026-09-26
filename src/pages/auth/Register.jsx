import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);
import AuthVideoPanel from '../../components/auth/AuthVideoPanel';

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
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip
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
  HomeOutlined,
  PersonAddOutlined,
  Diversity3Outlined,
  ShieldOutlined,
  StarBorderOutlined,
  ApartmentOutlined as HostelIcon
} from '@mui/icons-material';

const DEFAULT_HOSTEL_LOCATIONS = [
  'Kambi sidrammana boys Hostel - Basaveshwara nagar',
  'Kambi sidrammana boys Hostel - Bashyam circle nagar',
  'Kambi sidrammana Girls Hostel -Rajaji nagar',
  'Sri Siddaramanna Boys Hostel - Tumkuru',
  'GM Siddaramanna Girls Hostel - Tumkuru'
];

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

const Register = ({ isCardOnly = false, onSwitchMode }) => {
  const { register } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  // Purge any stale draft from localStorage to ensure strictly clean inputs
  useEffect(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (err) {
      // ignore
    }
  }, []);

  // State initialization with strictly clean, empty default values
  const [step, setStep] = useState(2);
  const [role, setRole] = useState('STUDENT');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [adhaar, setAdhaar] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState(''); // stores YYYY-MM-DD
  const [dobDayjs, setDobDayjs] = useState(null);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Privacy Settings (Hide from members directory table, matching inside Profile)
  const [privacySettings, setPrivacySettings] = useState({
    maskPhone: false,
    maskEmail: false,
    maskAdhaar: false
  });

  // Student / Alumni specific mandatory fields (strictly empty defaults)
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('');
  const [startYear, setStartYear] = useState('');
  const [startYearDayjs, setStartYearDayjs] = useState(null);
  const [endYear, setEndYear] = useState('');
  const [endYearDayjs, setEndYearDayjs] = useState(null);

  // Hostel Location / Organization Selection
  const [hostelLocation, setHostelLocation] = useState(DEFAULT_HOSTEL_LOCATIONS[0]);
  const [hostelLocationsList, setHostelLocationsList] = useState(DEFAULT_HOSTEL_LOCATIONS);

  useEffect(() => {
    let isMounted = true;
    API.get('/organizations')
      .then((res) => {
        if (isMounted && res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          const names = res.data.data.map(o => o.name);
          setHostelLocationsList(names);
          if (!hostelLocation || !names.includes(hostelLocation)) {
            setHostelLocation(names[0]);
          }
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Email Deliverability & Existence Validation State
  const [emailValidation, setEmailValidation] = useState({
    status: null, // null | 'CHECKING' | 'EXISTS' | 'DOES_NOT_EXIST' | 'UNKNOWN' | 'ALREADY_REGISTERED'
    message: ''
  });
  const validationTimerRef = useRef(null);

  const EMAIL_SYNTAX_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  const VALID_TLD_REGEX = /\.(com|in|org|net|edu|gov|co\.in|ac\.in|res\.in|org\.in|edu\.in|net\.in|io|ai|me|info|biz|[a-z]{2,})$/i;

  const validateEmailClientFormat = (raw) => {
    if (!raw) return { valid: false, message: 'Please enter your email address.' };
    const em = raw.trim().toLowerCase();
    if (!em.includes('@')) {
      return { valid: false, message: "Email must contain an '@' symbol." };
    }
    const parts = em.split('@');
    if (parts.length !== 2) {
      return { valid: false, message: "Email can only contain one '@' symbol." };
    }
    const [userPart, domain] = parts;
    if (!userPart) {
      return { valid: false, message: 'Please enter the username part before @.' };
    }
    if (!domain || !domain.includes('.')) {
      return { valid: false, message: 'Please enter a valid domain ending with .com, .in, etc.' };
    }
    if (!EMAIL_SYNTAX_REGEX.test(em)) {
      return { valid: false, message: 'Please enter a valid email address format.' };
    }
    if (domain.includes('..') || userPart.includes('..')) {
      return { valid: false, message: 'Email cannot contain consecutive dots.' };
    }
    const domainLower = domain.toLowerCase();
    if (/^(gmial|gamil|gmaill|gmai)\./i.test(domainLower)) {
      return { valid: false, message: 'Invalid domain. Did you mean @gmail.com?' };
    }
    if (domainLower.startsWith('gmail.')) {
      if (domainLower !== 'gmail.com') {
        return { valid: false, message: 'Invalid Gmail address. Must end with @gmail.com' };
      }
    }
    if (!VALID_TLD_REGEX.test(domainLower)) {
      return { valid: false, message: 'Email must end with a valid domain (e.g. .com, .in, etc.).' };
    }
    return { valid: true, email: em };
  };

  const performEmailValidation = async (emailToVerify) => {
    const trimmed = (emailToVerify || '').trim().toLowerCase();
    if (!trimmed) {
      setEmailValidation({ status: null, message: '' });
      return null;
    }

    const check = validateEmailClientFormat(trimmed);
    if (!check.valid) {
      const res = { status: 'INVALID_FORMAT', message: check.message };
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

  const handleNextStep = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // step is always 2 now (role selection page is skipped)
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
    if (phone.trim().length !== 10) { notifyWarn('Phone Number must be exactly 10 digits.'); return; }

    if (!hostelLocation || !hostelLocation.trim()) {
      notifyWarn('Hostel location is mandatory.');
      return;
    }

    // Role-specific validations
    let eYearStr = '';
    const collegeValue = (college || collegeRef.current?.value || '').trim();
    if (collegeValue && college !== collegeValue) setCollege(collegeValue);

    if (role === 'STUDENT' || role === 'ALUMNI') {
      if (!collegeValue) { notifyWarn('College / University Name is mandatory.'); return; }
      if (!endYear) { notifyWarn('College Graduation Year is mandatory.'); return; }

      const gradYearNum = endYearDayjs?.isValid() ? endYearDayjs.year() : parseInt(endYear, 10);
      if (!gradYearNum || isNaN(gradYearNum) || gradYearNum < 1950 || gradYearNum > 2100) {
        notifyWarn('Please enter a valid 4-digit Graduation Year (e.g. 2026).');
        return;
      }
      eYearStr = String(gradYearNum);
    }

    // Password validation
    if (!password) { notifyWarn('Please create a password.'); return; }
    if (password.length < 6) {
      notifyWarn('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const result = await register({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      hostelLocation: hostelLocation.trim(),
      organization: hostelLocation.trim(),
      password,
      role,
      privacySettings: {
        maskPhone: Boolean(privacySettings.maskPhone),
        maskEmail: Boolean(privacySettings.maskEmail)
      },
      college: role === 'STUDENT' ? collegeValue : undefined,
      endYear: role === 'STUDENT' ? eYearStr : undefined,
      registrationNumber: role === 'MEMBER' ? registrationNumber?.trim() || undefined : undefined
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
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    boxSizing: 'border-box',
    '& .MuiOutlinedInput-root': {
      width: '100%',
      minWidth: 0,
      maxWidth: '100%',
      boxSizing: 'border-box',
      borderRadius: '10px',
      backgroundColor: '#F8FAFC',
      fontSize: '13.5px',
      height: '44px',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      '& fieldset': {
        borderColor: '#E2E8F0',
        borderWidth: '1px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      },
      '&:hover': {
        backgroundColor: '#F1F5F9',
        '& fieldset': { borderColor: '#CBD5E1' }
      },
      '&.Mui-focused': {
        backgroundColor: '#FFFFFF',
        boxShadow: '0 0 0 3px rgba(0, 136, 255, 0.12)',
        '& fieldset': { borderColor: '#0088ff', borderWidth: '1.5px' }
      },
      '& input': {
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        color: '#0F172A',
        fontWeight: 500,
        '&::placeholder': { color: '#94A3B8', opacity: 1, fontWeight: 400 }
      },
      '& .MuiSelect-select': {
        minWidth: 0,
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        display: 'block',
        pr: '32px !important'
      }
    }
  };

  const emailInputStyle = useMemo(() => {
    let borderColor = '#E2E8F0';
    let hoverBorderColor = '#CBD5E1';
    let focusBorderColor = '#0088ff';
    let focusShadow = '0 0 0 3px rgba(0, 136, 255, 0.12)';
    let bgColor = '#F8FAFC';

    if (emailValidation.status === 'EXISTS') {
      borderColor = '#16A34A';
      hoverBorderColor = '#15803D';
      focusBorderColor = '#16A34A';
      focusShadow = '0 0 0 3px rgba(22, 163, 74, 0.14)';
      bgColor = '#F0FDF4';
    } else if (emailValidation.status === 'DOES_NOT_EXIST' || emailValidation.status === 'INVALID_FORMAT' || emailValidation.status === 'ALREADY_REGISTERED') {
      borderColor = '#DC2626';
      hoverBorderColor = '#B91C1C';
      focusBorderColor = '#DC2626';
      focusShadow = '0 0 0 3px rgba(220, 38, 38, 0.14)';
      bgColor = '#FEF2F2';
    }

    return {
      width: '100%',
      minWidth: 0,
      maxWidth: '100%',
      boxSizing: 'border-box',
      '& .MuiOutlinedInput-root': {
        width: '100%',
        minWidth: 0,
        maxWidth: '100%',
        boxSizing: 'border-box',
        borderRadius: '10px',
        backgroundColor: bgColor,
        fontSize: '13.5px',
        height: '44px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '& fieldset': { borderColor, borderWidth: emailValidation.status ? '1.5px' : '1px' },
        '&:hover': {
          backgroundColor: emailValidation.status ? bgColor : '#F1F5F9',
          '& fieldset': { borderColor: hoverBorderColor }
        },
        '&.Mui-focused': {
          backgroundColor: '#FFFFFF',
          boxShadow: focusShadow,
          '& fieldset': { borderColor: focusBorderColor, borderWidth: '1.5px' }
        },
        '& input': {
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          color: '#0F172A',
          fontWeight: 500,
          '&::placeholder': { color: '#94A3B8', opacity: 1, fontWeight: 400 }
        }
      }
    };
  }, [emailValidation.status]);

  const rightPanel = (
    <Box
      sx={{
        flex: 1,
        width: { xs: '100%', md: '30%' },
        minWidth: { xs: '100%', md: '30%' },
        maxWidth: { xs: '100%', md: '30%' },
        minHeight: { xs: '100dvh', md: '100vh' },
        height: { xs: '100dvh', md: '100vh' },
        maxHeight: { xs: '100dvh', md: '100vh' },
        bgcolor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflowY: 'auto',
        overflowX: 'hidden',
        px: { xs: 2.5, sm: 3.5, md: 2.5, lg: 3.5 },
        py: { xs: 2.5, sm: 3.5, md: 3 },
        boxSizing: 'border-box',
        '&::-webkit-scrollbar': { width: '5px' },
        '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: '4px' },
        '&::-webkit-scrollbar-thumb:hover': { bgcolor: '#94A3B8' }
      }}
    >
      <Box
        component="form"
        id="register-form"
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(e);
        }}
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: 420, md: '100%' },
          minWidth: 0,
          mx: 'auto',
          my: 'auto',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}
      >
        {/* SINGLE COLUMN: ONE INPUT PER ROW */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: 2,
            width: '100%',
            minWidth: 0,
            boxSizing: 'border-box'
          }}
        >
          {/* 1. Full Name */}
          <Box sx={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.6, minHeight: '24px' }}>
              <Typography component="label" sx={{ fontWeight: 600, color: '#334155', fontSize: '13px' }}>
                Full Name <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
            </Box>
            <TextField
              fullWidth
              size="small"
              autoComplete="off"
              inputRef={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  emailRef.current?.focus();
                }
              }}
              placeholder="Enter your full name"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start" sx={{ minWidth: 'auto', mr: 1 }}>
                      <PersonIcon sx={{ color: '#94A3B8', fontSize: 19 }} />
                    </InputAdornment>
                  ),
                }
              }}
              sx={inputStyle}
            />
          </Box>

          {/* 2. Email Address */}
          <Box sx={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6, minHeight: '24px', width: '100%', minWidth: 0, gap: 1 }}>
              <Typography component="label" sx={{ fontWeight: 600, color: '#334155', fontSize: '13px', whiteSpace: 'nowrap' }}>
                Email Address <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <Tooltip title="When enabled, your email is hidden for other users.">
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={Boolean(privacySettings.maskEmail)}
                      onChange={(e) => setPrivacySettings(prev => ({ ...prev, maskEmail: e.target.checked }))}
                      sx={{
                        transform: 'scale(0.8)',
                        mr: -0.5,
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#0088ff' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#0088ff' }
                      }}
                    />
                  }
                  label={
                    <Typography variant="caption" sx={{ color: privacySettings.maskEmail ? '#0088ff' : '#64748B', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', gap: 0.4, whiteSpace: 'nowrap' }}>
                      <VisibilityOffIcon sx={{ fontSize: 13 }} /> Hide
                    </Typography>
                  }
                  sx={{ m: 0, flexShrink: 0 }}
                />
              </Tooltip>
            </Box>
            <TextField
              fullWidth
              size="small"
              type="email"
              autoComplete="off"
              inputRef={emailRef}
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  phoneRef.current?.focus();
                }
              }}
              placeholder="you@example.com"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start" sx={{ minWidth: 'auto', mr: 1 }}>
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
                  ❌ {emailValidation.message || 'Email is already in Use.'}
                </Typography>
              </Box>
            )}
          </Box>

          {/* 3. Phone Number */}
          <Box sx={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6, minHeight: '24px', width: '100%', minWidth: 0, gap: 1 }}>
              <Typography component="label" sx={{ fontWeight: 600, color: '#334155', fontSize: '13px', whiteSpace: 'nowrap' }}>
                Phone Number <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <Tooltip title="When enabled, your phone number is hidden for other users.">
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={Boolean(privacySettings.maskPhone)}
                      onChange={(e) => setPrivacySettings(prev => ({ ...prev, maskPhone: e.target.checked }))}
                      sx={{
                        transform: 'scale(0.8)',
                        mr: -0.5,
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#0088ff' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#0088ff' }
                      }}
                    />
                  }
                  label={
                    <Typography variant="caption" sx={{ color: privacySettings.maskPhone ? '#0088ff' : '#64748B', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', gap: 0.4, whiteSpace: 'nowrap' }}>
                      <VisibilityOffIcon sx={{ fontSize: 13 }} /> Hide
                    </Typography>
                  }
                  sx={{ m: 0, flexShrink: 0 }}
                />
              </Tooltip>
            </Box>
            <TextField
              fullWidth
              size="small"
              autoComplete="off"
              inputRef={phoneRef}
              value={phone}
              onChange={handlePhoneChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (role === 'STUDENT') {
                    collegeRef.current?.focus();
                  } else {
                    (regNoRef.current || passwordRef.current)?.focus();
                  }
                }
              }}
              placeholder="Enter Phone Number"
              slotProps={{
                htmlInput: { inputMode: 'numeric', maxLength: 10 },
                input: {
                  startAdornment: (
                    <InputAdornment position="start" sx={{ minWidth: 'auto', mr: 1 }}>
                      <PhoneIcon sx={{ color: '#94A3B8', fontSize: 19 }} />
                    </InputAdornment>
                  ),
                }
              }}
              sx={inputStyle}
            />
          </Box>

          {/* 4. Hostel Location Dropdown */}
          <Box sx={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.6, minHeight: '24px' }}>
              <Typography component="label" sx={{ fontWeight: 600, color: '#334155', fontSize: '13px' }}>
                Hostel location <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
            </Box>
            <TextField
              select
              fullWidth
              size="small"
              value={hostelLocation}
              onChange={(e) => setHostelLocation(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start" sx={{ minWidth: 'auto', mr: 1 }}>
                      <HostelIcon sx={{ color: '#94A3B8', fontSize: 19 }} />
                    </InputAdornment>
                  ),
                },
                select: {
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        maxHeight: 280,
                        borderRadius: '10px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
                        border: '1px solid #E2E8F0'
                      }
                    }
                  }
                }
              }}
              sx={inputStyle}
            >
              {hostelLocationsList.map((loc) => (
                <MenuItem key={loc} value={loc} sx={{ fontSize: '13px', py: 1, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                  {loc}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Student / Alumni Specific Fields (College & Graduation Year) */}
          {role === 'STUDENT' && (
            <>
              {/* 5. College / University Name */}
              <Box sx={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.6, minHeight: '24px' }}>
                  <Typography component="label" sx={{ fontWeight: 600, color: '#334155', fontSize: '13px' }}>
                    College / University Name <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                </Box>
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
                  sx={{ width: '100%', minWidth: 0 }}
                  renderInput={(params) => {
                    const { InputProps, inputProps: pInputProps, ...restParams } = params;
                    const { onKeyDown: origOnKeyDown, ref: origRef, ...otherInputProps } = pInputProps || {};
                    return (
                      <TextField
                        {...restParams}
                        fullWidth
                        size="small"
                        placeholder="Enter college name"
                        slotProps={{
                          htmlInput: {
                            ...otherInputProps,
                            ref: (node) => {
                              if (typeof origRef === 'function') {
                                origRef(node);
                              } else if (origRef && typeof origRef === 'object') {
                                origRef.current = node;
                              }
                              collegeRef.current = node;
                            },
                            onKeyDown: (e) => {
                              if (typeof origOnKeyDown === 'function') {
                                origOnKeyDown(e);
                              }
                              if (e.key === 'Enter' && !e.defaultPrevented) {
                                e.preventDefault();
                                endYearRef.current?.focus();
                              }
                            }
                          },
                          input: {
                            ...(InputProps || {}),
                            startAdornment: (
                              <>
                                <InputAdornment position="start" sx={{ minWidth: 'auto', mr: 1 }}>
                                  <CollegeIcon sx={{ color: '#94A3B8', fontSize: 19 }} />
                                </InputAdornment>
                                {InputProps?.startAdornment}
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

              {/* 6. College Graduation Year */}
              <Box sx={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.6, minHeight: '24px' }}>
                  <Typography component="label" sx={{ fontWeight: 600, color: '#334155', fontSize: '13px' }}>
                    College Graduation Year <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                </Box>
                <DatePicker
                  views={['year']}
                  openTo="year"
                  format="YYYY"
                  closeOnSelect={true}
                  value={endYearDayjs}
                  onChange={(newValue) => {
                    setEndYearDayjs(newValue);
                    if (!newValue) {
                      setEndYear('');
                    } else if (dayjs.isDayjs(newValue) && newValue.isValid()) {
                      setEndYear(String(newValue.year()));
                    }
                  }}
                  minDate={dayjs().subtract(60, 'year')}
                  maxDate={dayjs().add(15, 'year')}
                  sx={{ width: '100%', minWidth: 0 }}
                  slotProps={{
                    field: { clearable: true },
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      inputRef: endYearRef,
                      placeholder: 'YYYY (e.g. 2026)',
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
            <Box sx={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.6, minHeight: '24px' }}>
                <Typography component="label" sx={{ display: 'flex', alignItems: 'center', gap: 0.7, fontWeight: 600, color: '#334155', fontSize: '13px' }}>
                  Registration Number <span style={{ color: '#94A3B8', fontWeight: 400, fontSize: '12px' }}>(Optional)</span>
                </Typography>
              </Box>
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
                      <InputAdornment position="start" sx={{ minWidth: 'auto', mr: 1 }}>
                        <RegNoIcon sx={{ color: '#94A3B8', fontSize: 19 }} />
                      </InputAdornment>
                    ),
                  }
                }}
                sx={inputStyle}
              />
            </Box>
          )}

          {/* 7. Create Password */}
          <Box sx={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.6, minHeight: '24px' }}>
              <Typography component="label" sx={{ fontWeight: 600, color: '#334155', fontSize: '13px' }}>
                Create Password <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
            </Box>
            <TextField
              fullWidth
              size="small"
              autoComplete="new-password"
              inputRef={passwordRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Enter password (min 6 characters)"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start" sx={{ minWidth: 'auto', mr: 1 }}>
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
        </Box>

        {/* Submit Button */}
        <Box sx={{ mt: 2.8, width: '100%', minWidth: 0 }}>
          <Button
            fullWidth
            size="large"
            type="submit"
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            disabled={loading}
            sx={{
              width: '100%',
              py: 1.35,
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '15.5px',
              textTransform: 'none',
              bgcolor: '#0088ff',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#0077e6',
                boxShadow: 'none'
              },
              '&.Mui-disabled': {
                bgcolor: '#93C5FD'
              }
            }}
          >
            {loading ? <CircularProgress size={22} sx={{ color: '#FFFFFF' }} /> : 'Create Account'}
          </Button>
        </Box>

        {/* Divider OR */}
        <Box sx={{ display: 'flex', alignItems: 'center', my: 2, width: '100%' }}>
          <Box sx={{ flex: 1, height: '1px', bgcolor: '#F1F5F9' }} />
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
          <Box sx={{ flex: 1, height: '1px', bgcolor: '#F1F5F9' }} />
        </Box>

        {/* Login footer link */}
        <Box sx={{ textAlign: 'center', width: '100%' }}>
          <Typography variant="body2" sx={{ color: '#64748B', fontSize: '13.5px' }}>
            Already have an account?{' '}
            <Link
              component={RouterLink}
              to="/auth?auth=login"
              onClick={(e) => {
                if (onSwitchMode) {
                  e.preventDefault();
                  onSwitchMode('login');
                }
              }}
              sx={{
                color: '#2563EB',
                fontWeight: 700,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Log In
            </Link>
          </Typography>
        </Box>

      </Box>
    </Box>
  );

  if (isCardOnly) {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {rightPanel}
      </LocalizationProvider>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          minHeight: { xs: '100dvh', md: '100vh' },
          height: { xs: '100dvh', md: '100vh' },
          maxHeight: { xs: '100dvh', md: '100vh' },
          width: '100vw',
          maxWidth: '100vw',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          overflow: 'hidden',
          fontFamily: '"Inter", "Roboto", sans-serif',
          boxSizing: 'border-box'
        }}
      >
        <AuthVideoPanel />
        {rightPanel}
      </Box>
    </LocalizationProvider>
  );
};

export default Register;


