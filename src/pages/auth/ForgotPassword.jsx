import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import API from '../../api';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  LockOutlined as LockIcon,
  ContentPaste as ContentPasteIcon
} from '@mui/icons-material';
import ForgotPasswordIllustration from '../../components/auth/ForgotPasswordIllustration';
import AuthVideoPanel from '../../components/auth/AuthVideoPanel';

const ForgotPassword = ({ isCardOnly = false, onSwitchMode }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();

  // Step state: 'EMAIL' | 'OTP' | 'NEW_PASSWORD' | 'SUCCESS'
  const [step, setStep] = useState('EMAIL');

  // Form states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Refs for OTP inputs
  const otpRefs = useRef([]);

  // Handle URL query parameters (e.g. from email link with ?email=...&otp=...)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const otpParam = searchParams.get('otp');
    if (emailParam) {
      setEmail(emailParam);
    }
    if (otpParam) {
      const digits = otpParam.replace(/\D/g, '').slice(0, 6).split('');
      if (digits.length > 0) {
        const newOtp = ['', '', '', '', '', ''];
        digits.forEach((d, i) => {
          if (i < 6) newOtp[i] = d;
        });
        setOtp(newOtp);
        setStep('OTP');
      }
    }
  }, [searchParams]);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first OTP input when transitioning to OTP step
  useEffect(() => {
    if (step === 'OTP') {
      setTimeout(() => {
        const firstEmpty = otp.findIndex((val) => !val);
        const targetIndex = firstEmpty !== -1 ? firstEmpty : 0;
        otpRefs.current[targetIndex]?.focus();
      }, 100);
    }
  }, [step]);

  // ─── Step 1: Request OTP & Reset Link ───
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    const rawEmail = email.trim();
    if (!rawEmail) {
      const valMsg = 'Please enter your email address.';
      setError(valMsg);
      enqueueSnackbar(valMsg, { variant: 'warning' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawEmail)) {
      const valMsg = 'Please enter a valid email address.';
      setError(valMsg);
      enqueueSnackbar(valMsg, { variant: 'warning' });
      return;
    }

    setError('');
    setLoading(true);

    try {
      const clientUrl = typeof window !== 'undefined' && window.location ? window.location.origin : '';
      const res = await API.post(
        '/auth/forgot-password',
        { loginIdentifier: rawEmail, email: rawEmail, clientUrl },
        { params: { clientUrl } }
      );
      setLoading(false);
      if (res.data?.success) {
        setStep('OTP');
        setResendCooldown(30);
        enqueueSnackbar('Verification code & reset link sent to your email!', { variant: 'success' });
      }
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(errMsg);
      enqueueSnackbar(errMsg, { variant: 'error' });
    }
  };

  // ─── Step 2: Handle OTP Input & Verification ───
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = (e.clipboardData || window.clipboardData)?.getData('text') || '';
    // Strip all whitespace, tabs (\t), newlines, and non-digit characters
    const digits = pasteData.replace(/\D/g, '').slice(0, 6).split('');
    if (digits.length > 0) {
      const newOtp = ['', '', '', '', '', ''];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(digits.length, 5);
      otpRefs.current[nextFocus]?.focus();
      enqueueSnackbar(`Pasted ${digits.length}-digit OTP code!`, { variant: 'success' });
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        enqueueSnackbar('Clipboard access not supported. Use Cmd+V or Ctrl+V to paste.', { variant: 'info' });
        return;
      }
      const text = await navigator.clipboard.readText();
      const digits = text.replace(/\D/g, '').slice(0, 6).split('');
      if (digits.length > 0) {
        const newOtp = ['', '', '', '', '', ''];
        digits.forEach((d, i) => {
          if (i < 6) newOtp[i] = d;
        });
        setOtp(newOtp);
        const nextFocus = Math.min(digits.length, 5);
        otpRefs.current[nextFocus]?.focus();
        enqueueSnackbar(`Pasted ${digits.length}-digit OTP code!`, { variant: 'success' });
      } else {
        enqueueSnackbar('No numbers found in clipboard.', { variant: 'warning' });
      }
    } catch (err) {
      enqueueSnackbar('Please press Cmd+V or Ctrl+V to paste your OTP code.', { variant: 'info' });
    }
  };

  const handleOtpChange = (index, value) => {
    // Strip non-digit characters
    const cleanDigits = value.replace(/\D/g, '');

    // Multi-digit entry (paste, autofill, etc.)
    if (cleanDigits.length > 1) {
      const digits = cleanDigits.slice(0, 6).split('');
      const newOtp = ['', '', '', '', '', ''];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(digits.length, 5);
      otpRefs.current[nextFocus]?.focus();
      return;
    }

    // Single digit input
    const newOtp = [...otp];
    newOtp[index] = cleanDigits.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next box if digit entered
    if (cleanDigits && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      } else if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      otpRefs.current[index + 1]?.focus();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      handleVerifyOtp();
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const fullOtp = otp.join('').trim();
    if (fullOtp.length !== 6) {
      const valMsg = 'Please enter the complete 6-digit OTP code.';
      setError(valMsg);
      enqueueSnackbar(valMsg, { variant: 'warning' });
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/verify-reset-otp', {
        email: email.trim(),
        otp: fullOtp
      });
      setLoading(false);
      if (res.data?.success && res.data?.resetToken) {
        setResetToken(res.data.resetToken);
        setStep('NEW_PASSWORD');
        enqueueSnackbar('Code verified! Please set your new password.', { variant: 'success' });
      }
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Invalid or expired OTP code.';
      setError(errMsg);
      enqueueSnackbar(errMsg, { variant: 'error' });
    }
  };

  // ─── Step 3: Set New Password ───
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      const valMsg = 'Please fill in both password fields.';
      setError(valMsg);
      enqueueSnackbar(valMsg, { variant: 'warning' });
      return;
    }

    if (newPassword.length < 6) {
      const valMsg = 'Password must be at least 6 characters long.';
      setError(valMsg);
      enqueueSnackbar(valMsg, { variant: 'warning' });
      return;
    }

    if (newPassword !== confirmPassword) {
      const valMsg = 'Passwords do not match.';
      setError(valMsg);
      enqueueSnackbar(valMsg, { variant: 'warning' });
      return;
    }

    setLoading(true);

    try {
      const res = await API.post(`/auth/reset-password/${resetToken}`, {
        password: newPassword,
        confirmPassword
      });
      setLoading(false);
      if (res.data?.success) {
        setStep('SUCCESS');
        enqueueSnackbar('Password reset successfully! Redirecting to login...', { variant: 'success' });
        setTimeout(() => {
          navigate('/login');
        }, 2500);
      }
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Failed to reset password. Please try again.';
      setError(errMsg);
      enqueueSnackbar(errMsg, { variant: 'error' });
    }
  };

  const rightPanel = (
    <Box
      sx={{
        flex: 1,
        width: { xs: '100%', md: '30%' },
        minWidth: { md: '30%' },
        maxWidth: { md: '30%' },
        height: '100vh',
        maxHeight: '100vh',
        overflowY: 'auto',
        bgcolor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: { xs: 3, sm: 4, md: 3, lg: 4 },
        py: { xs: 3, sm: 4, md: 4 }
      }}
    >
        {/* ─── Content Card (no border, no shadow) ─── */}
        <Box
          sx={{
            width: '100%',
            maxWidth: 440,
            bgcolor: '#FFFFFF',
            border: 'none',
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Top Illustration / Badge */}
          {step !== 'SUCCESS' ? (
            <ForgotPasswordIllustration />
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: '#ECFDF5',
                  border: '2px solid #A7F3D0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)'
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 48, color: '#10B981' }} />
              </Box>
            </Box>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 1: EMAIL INPUT
              ═══════════════════════════════════════════════════════════════ */}
          {step === 'EMAIL' && (
            <>
              {/* Heading */}
              <Typography
                component="h1"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '25px', sm: '28px' },
                  color: '#0F172A',
                  textAlign: 'center',
                  mb: 1,
                  letterSpacing: '-0.4px',
                  fontFamily: '"Outfit", "Inter", sans-serif'
                }}
              >
                Forgot Password?
              </Typography>

              {/* Subtitle */}
              <Typography
                sx={{
                  color: '#64748B',
                  fontSize: '14.5px',
                  lineHeight: 1.5,
                  fontWeight: 400,
                  textAlign: 'center',
                  maxWidth: 360,
                  mx: 'auto',
                  mb: 3.5,
                  fontFamily: '"Outfit", "Inter", sans-serif'
                }}
              >
                No worries! Enter your email and we’ll send you a verification code and link to reset your password.
              </Typography>

              {/* Error Alert */}
              {error && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px', fontSize: '13.5px' }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleRequestOtp} noValidate>
                {/* Email Field */}
                <Box sx={{ mb: 2.5 }}>
                  <Typography
                    component="label"
                    htmlFor="forgot-email"
                    sx={{
                      display: 'block',
                      fontWeight: 700,
                      color: '#0F172A',
                      fontSize: '14px',
                      mb: 1,
                      fontFamily: '"Outfit", "Inter", sans-serif'
                    }}
                  >
                    Email
                  </Typography>
                  <TextField
                    id="forgot-email"
                    fullWidth
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start" sx={{ mr: 1, ml: 0.5 }}>
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#94A3B8"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect x="2" y="4" width="20" height="16" rx="3" />
                              <path d="M22 7L13.03 12.7C12.4 13.1 11.6 13.1 10.97 12.7L2 7" />
                            </svg>
                          </InputAdornment>
                        )
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '14px',
                        fontSize: '14.5px',
                        bgcolor: '#FAFBFE',
                        fontFamily: '"Outfit", "Inter", sans-serif',
                        transition: 'all 0.2s ease',
                        '& fieldset': { borderColor: '#E2E8F0', borderWidth: '1.5px' },
                        '&:hover fieldset': { borderColor: '#93C5FD' },
                        '&.Mui-focused fieldset': {
                          borderColor: '#1877F2',
                          borderWidth: '1.5px',
                          boxShadow: '0 0 0 3.5px rgba(24, 119, 242, 0.12)'
                        },
                        '& input': {
                          py: '13.5px',
                          color: '#0F172A',
                          '&::placeholder': { color: '#94A3B8', opacity: 1 }
                        }
                      }
                    }}
                  />
                </Box>

                {/* Send Reset Link Button */}
                <Button
                  fullWidth
                  type="submit"
                  disabled={loading}
                  sx={{
                    py: 1.4,
                    borderRadius: '14px',
                    fontWeight: 700,
                    fontSize: '15px',
                    textTransform: 'none',
                    bgcolor: '#1877F2',
                    color: '#FFFFFF',
                    boxShadow: 'none',
                    transition: 'all 0.2s ease',
                    fontFamily: '"Outfit", "Inter", sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.2,
                  
                    '&.Mui-disabled': { bgcolor: '#93C5FD', color: '#FFFFFF' }
                  }}
                >
                  {loading ? (
                    <CircularProgress size={22} sx={{ color: '#FFFFFF' }} />
                  ) : (
                    <>
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      <span>Send Reset Link</span>
                    </>
                  )}
                </Button>
              </Box>

              {/* Divider */}
              <Box sx={{ display: 'flex', alignItems: 'center', my: 2.8, width: '100%' }}>
                <Box sx={{ flex: 1, height: '1px', bgcolor: '#E5E7EB' }} />
                <Typography
                  sx={{
                    px: 2,
                    color: '#9CA3AF',
                    fontSize: '13.5px',
                    fontWeight: 500,
                    fontFamily: '"Outfit", "Inter", sans-serif'
                  }}
                >
                  or
                </Typography>
                <Box sx={{ flex: 1, height: '1px', bgcolor: '#E5E7EB' }} />
              </Box>

              {/* Back to Sign In Link */}
              <Box sx={{ textAlign: 'center' }}>
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
                    color: '#1877F2',
                    fontWeight: 700,
                    fontSize: '14.5px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    fontFamily: '"Outfit", "Inter", sans-serif',
                    transition: 'opacity 0.2s ease',
                    '&:hover': { color: '#0D62D9', textDecoration: 'underline' }
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  <span>Back to Sign In</span>
                </Link>
              </Box>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 2: ENTER OTP
              ═══════════════════════════════════════════════════════════════ */}
          {step === 'OTP' && (
            <>
              {/* Heading */}
              <Typography
                component="h1"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '25px', sm: '28px' },
                  color: '#0F172A',
                  textAlign: 'center',
                  mb: 1,
                  letterSpacing: '-0.4px',
                  fontFamily: '"Outfit", "Inter", sans-serif'
                }}
              >
                Enter Verification Code
              </Typography>

              {/* Subtitle */}
              <Typography
                sx={{
                  color: '#64748B',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  fontWeight: 400,
                  textAlign: 'center',
                  maxWidth: 360,
                  mx: 'auto',
                  mb: 3,
                  fontFamily: '"Outfit", "Inter", sans-serif'
                }}
              >
                We sent a 6-digit code to{' '}
                <strong style={{ color: '#0F172A' }}>{email}</strong>
              </Typography>

              {/* Error Alert */}
              {error && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px', fontSize: '13.5px' }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleVerifyOtp} noValidate>
                {/* 6-box OTP Input */}
                <Box
                  onPaste={handleOtpPaste}
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: { xs: 1, sm: 1.5 },
                    mb: 2
                  }}
                >
                  {otp.map((digit, index) => (
                    <Box
                      key={index}
                      component="input"
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onPaste={handleOtpPaste}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      sx={{
                        width: { xs: 42, sm: 48 },
                        height: { xs: 50, sm: 54 },
                        borderRadius: '12px',
                        border: digit ? '2px solid #1877F2' : '1.5px solid #E2E8F0',
                        bgcolor: digit ? '#FFFFFF' : '#FAFBFE',
                        color: '#0F172A',
                        fontSize: { xs: '20px', sm: '22px' },
                        fontWeight: 700,
                        textAlign: 'center',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        fontFamily: '"Outfit", monospace',
                        '&:focus': {
                          border: '2px solid #1877F2',
                          boxShadow: '0 0 0 3.5px rgba(24, 119, 242, 0.15)',
                          bgcolor: '#FFFFFF'
                        }
                      }}
                    />
                  ))}
                </Box>

                {/* Paste from Clipboard & Clear Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, mb: 3 }}>
             
                  {otp.some((d) => d) && (
                    <Button
                      size="small"
                      onClick={() => {
                        setOtp(['', '', '', '', '', '']);
                        otpRefs.current[0]?.focus();
                      }}
                      sx={{
                        textTransform: 'none',
                        fontSize: '12.5px',
                        color: '#000',
                        fontWeight: 500,
                        borderRadius: '8px',
                        px: 1,
                        py: 0.5,
                        bgcolor: '#F1F5F9' ,
                        fontFamily: '"Outfit", "Inter", sans-serif',
                       
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </Box>

                {/* Verify OTP Button */}
                <Button
                  fullWidth
                  type="submit"
                  disabled={loading}
                  sx={{
                    py: 1.4,
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '15px',
                    textTransform: 'none',
                    bgcolor: '#1877F2',
                    width:"60%",
                    mx:"auto",
                    color: '#FFFFFF',
                    boxShadow: 'none',
                    transition: 'all 0.2s ease',
                    fontFamily: '"Outfit", "Inter", sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.2,
                
                    '&.Mui-disabled': { bgcolor: '#93C5FD', color: '#FFFFFF' }
                  }}
                >
                  {loading ? <CircularProgress size={22} sx={{ color: '#FFFFFF' }} /> : 'Verify Code'}
                </Button>
              </Box>

              {/* Resend & Change Email Actions */}
              <Box sx={{ mt: 2.5, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="text"
                  disabled={resendCooldown > 0 || loading}
                  onClick={() => handleRequestOtp()}
                  sx={{
                    color: resendCooldown > 0 ? '#94A3B8' : '#1877F2',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontFamily: '"Outfit", "Inter", sans-serif',
                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                  }}
                >
                  {resendCooldown > 0
                    ? `Didn’t receive code? Resend in ${resendCooldown}s`
                    : 'Didn’t receive code? Resend Code'}
                </Button>

                <Button
                  variant="text"
                  onClick={() => {
                    setStep('EMAIL');
                    setError('');
                  }}
                  sx={{
                    color: '#64748B',
                    fontSize: '13px',
                    fontWeight: 500,
                    textTransform: 'none',
                    fontFamily: '"Outfit", "Inter", sans-serif',
                    '&:hover': { color: '#0F172A', bgcolor: 'transparent' }
                  }}
                >
                  Change email address
                </Button>
              </Box>

              {/* Divider */}
              <Box sx={{ display: 'flex', alignItems: 'center', my: 2.5, width: '100%' }}>
                <Box sx={{ flex: 1, height: '1px', bgcolor: '#E5E7EB' }} />
                <Typography
                  sx={{
                    px: 2,
                    color: '#9CA3AF',
                    fontSize: '13.5px',
                    fontWeight: 500,
                    fontFamily: '"Outfit", "Inter", sans-serif'
                  }}
                >
                  or
                </Typography>
                <Box sx={{ flex: 1, height: '1px', bgcolor: '#E5E7EB' }} />
              </Box>

              {/* Back to Sign In Link */}
              <Box sx={{ textAlign: 'center' }}>
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: '#1877F2',
                    fontWeight: 700,
                    fontSize: '14.5px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    fontFamily: '"Outfit", "Inter", sans-serif',
                    transition: 'opacity 0.2s ease',
                    '&:hover': { color: '#0D62D9', textDecoration: 'underline' }
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  <span>Back to Sign In</span>
                </Link>
              </Box>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 3: NEW & CONFIRM PASSWORD
              ═══════════════════════════════════════════════════════════════ */}
          {step === 'NEW_PASSWORD' && (
            <>
              {/* Heading */}
              <Typography
                component="h1"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '25px', sm: '28px' },
                  color: '#0F172A',
                  textAlign: 'center',
                  mb: 1,
                  letterSpacing: '-0.4px',
                  fontFamily: '"Outfit", "Inter", sans-serif'
                }}
              >
                Create New Password
              </Typography>

              {/* Subtitle */}
              <Typography
                sx={{
                  color: '#64748B',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  fontWeight: 400,
                  textAlign: 'center',
                  maxWidth: 360,
                  mx: 'auto',
                  mb: 3,
                  fontFamily: '"Outfit", "Inter", sans-serif'
                }}
              >
                Your verification code is confirmed! Enter your new password below.
              </Typography>

              {/* Error Alert */}
              {error && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px', fontSize: '13.5px' }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleResetPassword} noValidate>
                {/* New Password Field */}
                <Box sx={{ mb: 2 }}>
                  <Typography
                    component="label"
                    htmlFor="reset-new-password"
                    sx={{
                      display: 'block',
                      fontWeight: 700,
                      color: '#0F172A',
                      fontSize: '14px',
                      mb: 1,
                      fontFamily: '"Outfit", "Inter", sans-serif'
                    }}
                  >
                    New Password
                  </Typography>
                  <TextField
                    id="reset-new-password"
                    fullWidth
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter new password (min. 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start" sx={{ mr: 1, ml: 0.5 }}>
                            <LockIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setShowNewPassword((prev) => !prev)}
                              edge="end"
                              sx={{ color: '#94A3B8' }}
                            >
                              {showNewPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '14px',
                        fontSize: '14.5px',
                        bgcolor: '#FAFBFE',
                        fontFamily: '"Outfit", "Inter", sans-serif',
                        '& fieldset': { borderColor: '#E2E8F0', borderWidth: '1.5px' },
                        '&:hover fieldset': { borderColor: '#93C5FD' },
                        '&.Mui-focused fieldset': {
                          borderColor: '#1877F2',
                          borderWidth: '1.5px',
                          boxShadow: '0 0 0 3.5px rgba(24, 119, 242, 0.12)'
                        },
                        '& input': { py: '13.5px', color: '#0F172A' }
                      }
                    }}
                  />
                </Box>

                {/* Confirm Password Field */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    component="label"
                    htmlFor="reset-confirm-password"
                    sx={{
                      display: 'block',
                      fontWeight: 700,
                      color: '#0F172A',
                      fontSize: '14px',
                      mb: 1,
                      fontFamily: '"Outfit", "Inter", sans-serif'
                    }}
                  >
                    Confirm Password
                  </Typography>
                  <TextField
                    id="reset-confirm-password"
                    fullWidth
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start" sx={{ mr: 1, ml: 0.5 }}>
                            <LockIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setShowConfirmPassword((prev) => !prev)}
                              edge="end"
                              sx={{ color: '#94A3B8' }}
                            >
                              {showConfirmPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '14px',
                        fontSize: '14.5px',
                        bgcolor: '#FAFBFE',
                        fontFamily: '"Outfit", "Inter", sans-serif',
                        '& fieldset': { borderColor: '#E2E8F0', borderWidth: '1.5px' },
                        '&:hover fieldset': { borderColor: '#93C5FD' },
                        '&.Mui-focused fieldset': {
                          borderColor: '#1877F2',
                          borderWidth: '1.5px',
                          boxShadow: '0 0 0 3.5px rgba(24, 119, 242, 0.12)'
                        },
                        '& input': { py: '13.5px', color: '#0F172A' }
                      }
                    }}
                  />
                </Box>

                {/* Reset Password Button */}
                <Button
                  fullWidth
                  type="submit"
                  disabled={loading}
                  sx={{
                    py: 1.4,
                    borderRadius: '14px',
                    fontWeight: 700,
                    fontSize: '15px',
                    textTransform: 'none',
                    bgcolor: '#1877F2',
                    color: '#FFFFFF',
                    boxShadow: '0 8px 22px rgba(24, 119, 242, 0.32)',
                    transition: 'all 0.2s ease',
                    fontFamily: '"Outfit", "Inter", sans-serif',
                    '&:hover': {
                      bgcolor: '#1565D8',
                      boxShadow: '0 10px 26px rgba(24, 119, 242, 0.45)'
                    },
                    '&.Mui-disabled': { bgcolor: '#93C5FD', color: '#FFFFFF' }
                  }}
                >
                  {loading ? <CircularProgress size={22} sx={{ color: '#FFFFFF' }} /> : 'Reset Password'}
                </Button>
              </Box>

              {/* Back to Sign In Link */}
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: '#1877F2',
                    fontWeight: 700,
                    fontSize: '14.5px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    fontFamily: '"Outfit", "Inter", sans-serif',
                    '&:hover': { color: '#0D62D9', textDecoration: 'underline' }
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  <span>Back to Sign In</span>
                </Link>
              </Box>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 4: SUCCESS
              ═══════════════════════════════════════════════════════════════ */}
          {step === 'SUCCESS' && (
            <>
              {/* Heading */}
              <Typography
                component="h1"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '25px', sm: '28px' },
                  color: '#0F172A',
                  textAlign: 'center',
                  mb: 1,
                  letterSpacing: '-0.4px',
                  fontFamily: '"Outfit", "Inter", sans-serif'
                }}
              >
                Password Reset Successful!
              </Typography>

              {/* Subtitle */}
              <Typography
                sx={{
                  color: '#64748B',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  fontWeight: 400,
                  textAlign: 'center',
                  maxWidth: 360,
                  mx: 'auto',
                  mb: 3.5,
                  fontFamily: '"Outfit", "Inter", sans-serif'
                }}
              >
                Your password has been changed successfully. You can now sign in with your new password.
              </Typography>

              <Button
                fullWidth
                component={RouterLink}
                to="/auth?auth=login"
                onClick={(e) => {
                  if (onSwitchMode) {
                    e.preventDefault();
                    onSwitchMode('login');
                  }
                }}
                sx={{
                  py: 1.4,
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '15px',
                  textTransform: 'none',
                  bgcolor: '#1877F2',
                  color: '#FFFFFF',
                  boxShadow: '0 8px 22px rgba(24, 119, 242, 0.32)',
                  fontFamily: '"Outfit", "Inter", sans-serif',
                  '&:hover': { bgcolor: '#1565D8' }
                }}
              >
                Sign In Now
              </Button>
            </>
          )}
        </Box>
      </Box>
  );

  if (isCardOnly) {
    return rightPanel;
  }

  return (
    <Box
      sx={{
        height: '100vh',
        maxHeight: '100vh',
        width: '100vw',
        maxWidth: '100vw',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        overflow: 'hidden',
        fontFamily: '"Outfit", "Inter", sans-serif'
      }}
    >
      <AuthVideoPanel />
      {rightPanel}
    </Box>
  );
};

export default ForgotPassword;
