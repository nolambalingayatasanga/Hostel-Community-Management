import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  Stack,
  Chip,
  CircularProgress,
  InputAdornment,
  Collapse,
  IconButton
} from '@mui/material';
import {
  PersonOutlineRounded as PersonIcon,
  MailOutlineRounded as MailIcon,
  PhoneOutlined as PhoneIcon,
  LayersOutlined as LayersIcon,
  LocalOfferOutlined as TagIcon,
  ChatBubbleOutlineRounded as ChatIcon,
  CloudUploadOutlined as CloudUploadIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  VerifiedUserOutlined as ShieldIcon,
  SendRounded as SendIcon,
  SecurityOutlined as SafeIcon,
  BedOutlined as BedIcon,
  RestaurantOutlined as FoodIcon,
  WifiOutlined as WifiIcon,
  GroupsOutlined as CommunityIcon,
  LocationOnOutlined as LocationIcon,
  SupportAgentRounded as SupportIcon,
  CheckCircleRounded as CheckCircleIcon,
  AccessTimeRounded as PendingIcon,
  HourglassTopRounded as ProgressIcon,
  ExpandMoreRounded as ExpandMoreIcon,
  ExpandLessRounded as ExpandLessIcon,
  DownloadRounded as DownloadIcon,
  HomeWorkOutlined as HomeIcon,
  ParkOutlined as LeafIcon,
  LockOutlined as LockIcon,
  LoginRounded as LoginIcon,
  PersonAddRounded as RegisterIcon,
  HistoryRounded as HistoryIcon,
  ArrowBackRounded as ArrowBackIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';

const ENQUIRY_CATEGORIES = [
  'Room Admission & Availability',
  'Hostel Facilities & Amenities',
  'Fee Structure & Payments',
  'Mess & Food Services',
  'Maintenance & Housekeeping',
  'General Enquiry'
];

export default function Enquiry() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef(null);

  // View state: 'form' | 'submissions'
  const [activeTab, setActiveTab] = useState('form');

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [category, setCategory] = useState('Room Admission & Availability');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // My enquiries history
  const [myEnquiries, setMyEnquiries] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Auto-fill user information if authenticated
  useEffect(() => {
    if (user) {
      if (!name) setName(user.name || '');
      if (!email) setEmail(user.email || '');
      if (!phone) setPhone(user.phone || '');
    }
  }, [user]);

  const fetchMyEnquiries = async () => {
    try {
      setLoadingHistory(true);
      const res = await API.get('/enquiries', { params: { my: 'true' } });
      if (res.data?.success) {
        setMyEnquiries(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load enquiries history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyEnquiries();
    }
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      enqueueSnackbar('Only PDF, JPG, and PNG files are supported', { variant: 'warning' });
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      enqueueSnackbar('Please enter your full name', { variant: 'warning' });
      return;
    }
    if (!phone.trim()) {
      enqueueSnackbar('Please enter your phone number', { variant: 'warning' });
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('phone', phone.trim());
      if (email.trim()) formData.append('email', email.trim().toLowerCase());
      if (category) formData.append('category', category);
      if (subject.trim()) formData.append('subject', subject.trim());
      if (message.trim()) formData.append('message', message.trim());
      if (selectedFile) {
        formData.append('document', selectedFile);
      }

      const res = await API.post('/enquiries', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data?.success) {
        enqueueSnackbar('Your enquiry has been submitted successfully! We will get back to you shortly.', {
          variant: 'success'
        });
        setSubject('');
        setMessage('');
        handleRemoveFile();
        if (user) {
          fetchMyEnquiries();
          setActiveTab('submissions');
        }
      }
    } catch (err) {
      console.error('Enquiry submission error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to submit enquiry', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', pb: 6, bgcolor: '#FAFBFD' }}>
      {/* ── Hidden File Input ── */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.png,.jpg,.jpeg"
        style={{ display: 'none' }}
      />

      {/* ── Main Layout: Form (Left) & Info Cards (Right) ── */}
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: { xs: 2, md: 2.5 } }}>
        <Grid container spacing={3}>
          {/* ══════════════ LEFT COLUMN: ENQUIRY FORM / SUBMISSIONS ══════════════ */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card
              sx={{
                bgcolor: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #EAECF0',
                boxShadow: '0 4px 20px -2px rgba(16, 24, 40, 0.05)',
                p: { xs: 2.5, sm: 3 },
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Card Header with Tab Switcher */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 2,
                  mb: 2.5,
                  pb: 2,
                  borderBottom: '1px solid #F1F5F9'
                }}
              >
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      bgcolor: '#EFF8FF',
                      color: '#0088FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {activeTab === 'form' ? (
                      <MailIcon sx={{ fontSize: 26 }} />
                    ) : (
                      <HistoryIcon sx={{ fontSize: 26 }} />
                    )}
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 800,
                        color: '#0F172A',
                        fontSize: { xs: '1.25rem', sm: '1.35rem' },
                        letterSpacing: '-0.02em'
                      }}
                    >
                      {activeTab === 'form' ? 'Send an Enquiry' : 'My Submitted Enquiries'}
                    </Typography>

                  </Box>
                </Stack>

                {/* Tab Pill Switcher */}
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    bgcolor: '#F1F5F9',
                    p: 0.5,
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    alignSelf: { xs: 'stretch', sm: 'auto' },
                    justifyContent: { xs: 'center', sm: 'flex-start' }
                  }}
                >
                  <Button
                    size="small"
                    onClick={() => setActiveTab('form')}
                    startIcon={<SendIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      borderRadius: '9px',
                      px: 2,
                      py: 0.7,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      bgcolor: activeTab === 'form' ? '#FFFFFF' : 'transparent',
                      color: activeTab === 'form' ? '#0088FF' : '#64748B',
                      boxShadow: activeTab === 'form' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      '&:hover': {
                        bgcolor: activeTab === 'form' ? '#FFFFFF' : 'rgba(0,0,0,0.04)'
                      }
                    }}
                  >
                    New Enquiry
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setActiveTab('submissions')}
                    sx={{
                      borderRadius: '9px',
                      px: 2,
                      py: 0.7,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      bgcolor: activeTab === 'submissions' ? '#FFFFFF' : 'transparent',
                      color: activeTab === 'submissions' ? '#0088FF' : '#64748B',
                      boxShadow: activeTab === 'submissions' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      '&:hover': {
                        bgcolor: activeTab === 'submissions' ? '#FFFFFF' : 'rgba(0,0,0,0.04)'
                      }
                    }}
                  >
                    My Submissions {user && myEnquiries.length > 0 ? `(${myEnquiries.length})` : ''}
                  </Button>
                </Box>
              </Box>

              {/* ── TAB 1: FORM ── */}
              {activeTab === 'form' && (
                <form onSubmit={handleSubmit}>
                  <Stack spacing={2}>
                    {/* Row 1: Full Name & Phone Number (Required) */}
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#344054', mb: 0.75 }}>
                          Full Name <span style={{ color: '#EF4444' }}>*</span>
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Enter your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonIcon sx={{ color: '#98A2B3', fontSize: 18 }} />
                              </InputAdornment>
                            )
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '10px',
                              bgcolor: '#FFFFFF',
                              '& fieldset': { borderColor: '#D0D5DD' },
                              '&:hover fieldset': { borderColor: '#98A2B3' },
                              '&.Mui-focused fieldset': { borderColor: '#0088FF', borderWidth: '1.5px' }
                            }
                          }}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#344054', mb: 0.75 }}>
                          Phone Number <span style={{ color: '#EF4444' }}>*</span>
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="+91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PhoneIcon sx={{ color: '#98A2B3', fontSize: 18 }} />
                              </InputAdornment>
                            )
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '10px',
                              bgcolor: '#FFFFFF',
                              '& fieldset': { borderColor: '#D0D5DD' },
                              '&:hover fieldset': { borderColor: '#98A2B3' },
                              '&.Mui-focused fieldset': { borderColor: '#0088FF', borderWidth: '1.5px' }
                            }
                          }}
                        />
                      </Grid>
                    </Grid>

                    {/* Row 2: Email Address & Category (Optional) */}
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#344054', mb: 0.75 }}>
                          Email Address <span style={{ color: '#94A3B8', fontWeight: 500, fontSize: '0.78rem' }}>(Optional)</span>
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          type="email"
                          placeholder="Enter your email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <MailIcon sx={{ color: '#98A2B3', fontSize: 18 }} />
                              </InputAdornment>
                            )
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '10px',
                              bgcolor: '#FFFFFF',
                              '& fieldset': { borderColor: '#D0D5DD' },
                              '&:hover fieldset': { borderColor: '#98A2B3' },
                              '&.Mui-focused fieldset': { borderColor: '#0088FF', borderWidth: '1.5px' }
                            }
                          }}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#344054', mb: 0.75 }}>
                          Enquiry Category <span style={{ color: '#94A3B8', fontWeight: 500, fontSize: '0.78rem' }}>(Optional)</span>
                        </Typography>
                        <Select
                          fullWidth
                          size="small"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          startAdornment={
                            <InputAdornment position="start">
                              <LayersIcon sx={{ color: '#98A2B3', fontSize: 18 }} />
                            </InputAdornment>
                          }
                          sx={{
                            borderRadius: '10px',
                            bgcolor: '#FFFFFF',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#D0D5DD' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#98A2B3' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#0088FF',
                              borderWidth: '1.5px'
                            }
                          }}
                        >
                          {ENQUIRY_CATEGORIES.map((cat) => (
                            <MenuItem key={cat} value={cat}>
                              {cat}
                            </MenuItem>
                          ))}
                        </Select>
                      </Grid>
                    </Grid>

                    {/* Row 3: Subject / Headline (Optional) */}
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#344054', mb: 0.75 }}>
                        Subject / Headline <span style={{ color: '#94A3B8', fontWeight: 500, fontSize: '0.78rem' }}>(Optional)</span>
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="E.g. Room availability, fees, admission process, etc."
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <TagIcon sx={{ color: '#98A2B3', fontSize: 18 }} />
                            </InputAdornment>
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '10px',
                            bgcolor: '#FFFFFF',
                            '& fieldset': { borderColor: '#D0D5DD' },
                            '&:hover fieldset': { borderColor: '#98A2B3' },
                            '&.Mui-focused fieldset': { borderColor: '#0088FF', borderWidth: '1.5px' }
                          }
                        }}
                      />
                    </Box>

                    {/* Row 4: Enquiry Details (Optional) */}
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#344054', mb: 0.75 }}>
                        Enquiry Details <span style={{ color: '#94A3B8', fontWeight: 500, fontSize: '0.78rem' }}>(Optional)</span>
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Please provide details about your enquiry..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                              <ChatIcon sx={{ color: '#98A2B3', fontSize: 18 }} />
                            </InputAdornment>
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '10px',
                            bgcolor: '#FFFFFF',
                            '& fieldset': { borderColor: '#D0D5DD' },
                            '&:hover fieldset': { borderColor: '#98A2B3' },
                            '&.Mui-focused fieldset': { borderColor: '#0088FF', borderWidth: '1.5px' }
                          }
                        }}
                      />
                    </Box>

                    {/* Row 5: Action Button Row */}
                    <Box sx={{ pt: 1.5, borderTop: '1px solid #F1F5F9' }}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        justifyContent="flex-end"
                      >
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={submitting}
                          endIcon={
                            submitting ? (
                              <CircularProgress size={16} sx={{ color: '#fff' }} />
                            ) : (
                              <SendIcon sx={{ fontSize: 18 }} />
                            )
                          }
                          sx={{
                            borderRadius: '10px',
                            bgcolor: '#0088FF',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '0.92rem',
                            textTransform: 'none',
                            py: 1.1,
                            px: 3.5,
                            minWidth: { xs: '100%', sm: 170 },
                            boxShadow: '0 4px 12px rgba(0, 136, 255, 0.25)',
                            '&:hover': {
                              bgcolor: '#0070D2',
                              boxShadow: '0 6px 16px rgba(0, 136, 255, 0.35)'
                            }
                          }}
                        >
                          {submitting ? 'Submitting...' : 'Submit Enquiry'}
                        </Button>
                      </Stack>
                    </Box>
                  </Stack>
                </form>
              )}

              {/* ── TAB 2: MY SUBMISSIONS ── */}
              {activeTab === 'submissions' && (
                <Box sx={{ minHeight: 320 }}>
                  {!user ? (
                    /* Unauthenticated view: Login or Create Account prompt */
                    <Box
                      sx={{
                        py: 6,
                        px: 2,
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: '16px',
                          bgcolor: '#EFF8FF',
                          color: '#0088FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                          boxShadow: '0 4px 14px rgba(0, 136, 255, 0.15)'
                        }}
                      >
                        <LockIcon sx={{ fontSize: 32 }} />
                      </Box>
                      <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#0F172A', mb: 1 }}>
                        Sign In to View Your Submissions
                      </Typography>
                      <Typography sx={{ fontSize: '0.88rem', color: '#64748B', maxWidth: 440, mb: 3.5, lineHeight: 1.6 }}>
                        Please log in to your account or create one to view and track your submitted enquiries, check statuses, and read administrator replies.
                      </Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                        <Button
                          component={RouterLink}
                          to="/auth?auth=login"
                          variant="contained"
                          startIcon={<LoginIcon sx={{ fontSize: 18 }} />}
                          sx={{
                            borderRadius: '10px',
                            bgcolor: '#0088FF',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            px: 3.5,
                            py: 1.1,
                            textTransform: 'none',
                            boxShadow: '0 4px 12px rgba(0, 136, 255, 0.25)',
                            '&:hover': { bgcolor: '#0070D2' }
                          }}
                        >
                          Log In
                        </Button>
                        <Button
                          component={RouterLink}
                          to="/auth?auth=register"
                          variant="outlined"
                          startIcon={<RegisterIcon sx={{ fontSize: 18 }} />}
                          sx={{
                            borderRadius: '10px',
                            borderColor: '#CBD5E1',
                            color: '#344054',
                            fontWeight: 700,
                            px: 3.5,
                            py: 1.1,
                            textTransform: 'none',
                            bgcolor: '#FFFFFF',
                            '&:hover': { borderColor: '#0088FF', color: '#0088FF', bgcolor: '#F8FAFC' }
                          }}
                        >
                          Create Account
                        </Button>
                      </Stack>
                      <Button
                        onClick={() => setActiveTab('form')}
                        startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
                        sx={{
                          mt: 3.5,
                          textTransform: 'none',
                          color: '#64748B',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                          '&:hover': { color: '#0088FF' }
                        }}
                      >
                        Back to Enquiry Form
                      </Button>
                    </Box>
                  ) : loadingHistory ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                      <CircularProgress size={32} sx={{ color: '#0088FF' }} />
                    </Box>
                  ) : myEnquiries.length === 0 ? (
                    <Box
                      sx={{
                        py: 6,
                        px: 3,
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: '16px',
                          bgcolor: '#F1F5F9',
                          color: '#64748B',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2
                        }}
                      >
                        <HistoryIcon sx={{ fontSize: 28 }} />
                      </Box>
                      <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#0F172A', mb: 0.5 }}>
                        No Enquiries Submitted Yet
                      </Typography>
                  

                    </Box>
                  ) : (
                    <Stack spacing={2.5}>
                      {myEnquiries.map((enq) => {
                        const statusColor =
                          enq.status === 'Resolved'
                            ? { bg: '#ECFDF5', text: '#059669', icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> }
                            : enq.status === 'In Progress'
                              ? { bg: '#EFF8FF', text: '#0284C7', icon: <ProgressIcon sx={{ fontSize: 14 }} /> }
                              : { bg: '#FFFBEB', text: '#D97706', icon: <PendingIcon sx={{ fontSize: 14 }} /> };

                        return (
                          <Card
                            key={enq._id}
                            sx={{
                              borderRadius: '14px',
                              border: '1px solid #EAECF0',
                              p: 2.5,
                              bgcolor: '#FFFFFF',
                              boxShadow: '0 2px 8px rgba(16, 24, 40, 0.04)'
                            }}
                          >
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              spacing={1.5}
                              justifyContent="space-between"
                              alignItems={{ xs: 'flex-start', sm: 'center' }}
                              sx={{ mb: 1.5 }}
                            >
                              <Box>
                                <Typography sx={{ fontWeight: 800, fontSize: '0.98rem', color: '#0F172A' }}>
                                  {enq.subject || enq.category}
                                </Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: '#64748B', mt: 0.25 }}>
                                  Category: {enq.category} &bull; Submitted on{' '}
                                  {new Date(enq.createdAt).toLocaleDateString()}
                                </Typography>
                              </Box>

                              <Chip
                                icon={statusColor.icon}
                                label={enq.status}
                                size="small"
                                sx={{
                                  bgcolor: statusColor.bg,
                                  color: statusColor.text,
                                  fontWeight: 700,
                                  fontSize: '0.75rem'
                                }}
                              />
                            </Stack>

                            <Typography
                              sx={{
                                fontSize: '0.85rem',
                                color: '#344054',
                                bgcolor: '#F8FAFC',
                                p: 2,
                                borderRadius: '8px',
                                border: '1px solid #F2F4F7'
                              }}
                            >
                              {enq.message}
                            </Typography>

                            {enq.attachmentUrl && (
                              <Box sx={{ mt: 1.5 }}>
                                <Button
                                  component="a"
                                  href={enq.attachmentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  size="small"
                                  startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                                  sx={{
                                    borderRadius: '6px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.8rem',
                                    color: '#0088FF',
                                    bgcolor: '#EFF8FF',
                                    '&:hover': { bgcolor: '#E0F2FE' }
                                  }}
                                >
                                  View Attachment: {enq.attachmentName || 'Document'}
                                </Button>
                              </Box>
                            )}

                            {enq.adminNotes && (
                              <Box
                                sx={{
                                  mt: 1.5,
                                  p: 1.5,
                                  bgcolor: '#F0FDF4',
                                  borderRadius: '8px',
                                  border: '1px solid #BBF7D0'
                                }}
                              >
                                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534' }}>
                                  Admin Response:
                                </Typography>
                                <Typography sx={{ fontSize: '0.82rem', color: '#15803D', mt: 0.5 }}>
                                  {enq.adminNotes}
                                </Typography>
                              </Box>
                            )}
                          </Card>
                        );
                      })}
                    </Stack>
                  )}
                </Box>
              )}
            </Card>
          </Grid>

          {/* ══════════════ RIGHT COLUMN: STICKY INFO & ACTIONS ══════════════ */}
          <Grid size={{ xs: 12, lg: 4 }} sx={{ alignSelf: 'flex-start' }}>
            <Box
              sx={{
                position: { lg: 'sticky' },
                top: { lg: 24 },
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5
              }}
            >
              {/* Card 1: Document Uploader Card */}
              <Card
                sx={{
                  bgcolor: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid #EAECF0',
                  boxShadow: '0 4px 20px -2px rgba(16, 24, 40, 0.05)',
                  p: { xs: 2.5, sm: 3 }
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ mb: 2,alignItems:"center"  }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      bgcolor: '#EFF8FF',
                      color: '#0088FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <CloudUploadIcon sx={{ fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.98rem', color: '#0F172A' }}>
                      Attach Documents
                    </Typography>
                 
                  </Box>
                </Stack>

                <Box
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    border: '1.5px dashed #CBD5E1',
                    borderRadius: '14px',
                    p: 2.5,
                    bgcolor: '#F8FAFC',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#0088FF',
                      bgcolor: '#F0F9FF'
                    }
                  }}
                >
                  {selectedFile ? (
                    <Box onClick={(e) => e.stopPropagation()}>
                      <Chip
                        icon={<AttachFileIcon sx={{ fontSize: 16 }} />}
                        label={`${selectedFile.name} (${(selectedFile.size / 1024).toFixed(0)} KB)`}
                        onDelete={handleRemoveFile}
                        deleteIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                        sx={{
                          bgcolor: '#EFF8FF',
                          color: '#0088FF',
                          fontWeight: 600,
                          border: '1px solid #BAE6FD',
                          maxWidth: '100%',
                          py: 2,
                          px: 1,
                          mb: 1.5
                        }}
                      />
                      <Button
                        size="small"
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                          display: 'block',
                          mx: 'auto',
                          textTransform: 'none',
                          fontSize: '0.8rem',
                          color: '#0088FF',
                          fontWeight: 600
                        }}
                      >
                        Change File
                      </Button>
                    </Box>
                  ) : (
                    <>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          bgcolor: '#EFF8FF',
                          color: '#0088FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 1
                        }}
                      >
                        <CloudUploadIcon sx={{ fontSize: 24 }} />
                      </Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E293B', mb: 0.25 }}>
                        Upload Document
                      </Typography>
                   
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AttachFileIcon sx={{ fontSize: 16 }} />}
                        sx={{
                          borderRadius: '8px',
                          borderColor: '#CBD5E1',
                          color: '#344054',
                          bgcolor: '#FFFFFF',
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          py: 0.6,
                          px: 2,
                          '&:hover': { borderColor: '#0088FF', bgcolor: '#F0F9FF', color: '#0088FF' }
                        }}
                      >
                        Choose File
                      </Button>
                    </>
                  )}
                </Box>
              </Card>

              {/* If user is not logged in: Track Submissions Quick Card */}
              {!user && (
                <Card
                  sx={{
                    bgcolor: '#FFFFFF',
                    borderRadius: '20px',
                    border: '1px solid #BAE6FD',
                    background: 'linear-gradient(180deg, #F0F9FF 0%, #FFFFFF 100%)',
                    p: 2.5,
                    boxShadow: '0 4px 16px -2px rgba(0, 136, 255, 0.08)'
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.25 }}>
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: '10px',
                        bgcolor: '#EFF8FF',
                        color: '#0088FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <HistoryIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A' }}>
                      Track Existing Enquiry?
                    </Typography>
                  </Stack>
                  <Typography sx={{ fontSize: '0.78rem', color: '#475569', mb: 1.5, lineHeight: 1.4 }}>
                    Already submitted an enquiry? Log in or create an account to view admin replies and status updates in real time.
                  </Typography>
                  <Stack direction="row" spacing={1.5}>
                    <Button
                      component={RouterLink}
                      to="/auth?auth=login"
                      variant="contained"
                      size="small"
                      fullWidth
                      sx={{
                        bgcolor: '#0088FF',
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 700,
                        py: 0.75,
                        fontSize: '0.8rem',
                        boxShadow: 'none',
                        '&:hover': { bgcolor: '#0070D2' }
                      }}
                    >
                      Log In
                    </Button>
                    <Button
                      component={RouterLink}
                      to="/auth?auth=register"
                      variant="outlined"
                      size="small"
                      fullWidth
                      sx={{
                        borderColor: '#BAE6FD',
                        color: '#0284C7',
                        bgcolor: '#FFFFFF',
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 700,
                        py: 0.75,
                        fontSize: '0.8rem',
                        '&:hover': { borderColor: '#0088FF', bgcolor: '#F0F9FF' }
                      }}
                    >
                      Register
                    </Button>
                  </Stack>
                </Card>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
