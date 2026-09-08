import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
  Dialog,
  Stack,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Menu
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as CameraIcon,
  School as EducationIcon,
  Work as WorkIcon,
  Home as HomeIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  SwapHoriz as TransitionIcon,
  SwitchCamera as SwitchCameraIcon,
  Refresh as RefreshIcon,
  Upload as UploadIcon,
  Storefront as StoreIcon,
  Category as CategoryIcon,
  LocationOn as PlaceIcon,
  Email as EmailIcon,
  Language as WebIcon,
  Info as InfoIcon,
  LocalPhone as PhoneIcon
} from '@mui/icons-material';

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUser: updateAuthUser } = useAuth();

  const isOwnProfile = !id || id === currentUser?._id;
  const isAdmin = currentUser?.role === 'ADMIN';

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('');
  const [adhaar, setAdhaar] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [localLanguageDetails, setLocalLanguageDetails] = useState('');

  // Address
  const [address, setAddress] = useState({
    street: '', area: '', landmark: '', location: '', city: '', district: '', taluk: '', pincode: ''
  });

  // Education (Students/Alumni)
  const [education, setEducation] = useState({
    college: '', course: '', startMonth: '', startYear: '', endMonth: '', endYear: ''
  });

  // Employment (Alumni/Staff/Agents/Members)
  const [employment, setEmployment] = useState({
    occupation: '', organization: '', industry: '', workLocation: '', employmentStatus: '',
    businessName: '', businessType: '',
    higherStudiesDetails: { institution: '', course: '', location: '' }
  });

  // Photo upload
  const [photoUploading, setPhotoUploading] = useState(false);

  // Camera Capture Dialog State
  const [photoMenuAnchor, setPhotoMenuAnchor] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' (front) or 'environment' (back)
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Clean up camera streams on unmount or stream change
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Student Transition Dialog State
  const [transitionOpen, setTransitionOpen] = useState(false);
  const [gradYear, setGradYear] = useState(new Date().getFullYear());
  const [transOccupation, setTransOccupation] = useState('');
  const [transCompany, setTransCompany] = useState('');
  const [transEmpStatus, setTransEmpStatus] = useState('Employed');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const targetId = isOwnProfile ? currentUser._id : id;
      const res = await API.get(`/users/${targetId}`);
      if (res.data?.success) {
        const u = res.data.data.user;
        setUser(u);

        // Populate form fields
        setName(u.name || '');
        setEmail(u.email || '');
        setPhone(u.phone || '');
        setPassword('');
        setGender(u.gender || 'MALE');
        setAdhaar(u.adhaar || '');
        setRegistrationNumber(u.registrationNumber || '');
        setLocalLanguageDetails(u.localLanguageDetails || '');

        setAddress(u.address || {
          street: '', area: '', landmark: '', location: '', city: '', district: '', taluk: '', pincode: ''
        });

        setEducation(u.education || {
          college: '', course: '', startMonth: '', startYear: '', endMonth: '', endYear: ''
        });

        setEmployment(u.employment || {
          occupation: '', organization: '', industry: '', workLocation: '', employmentStatus: 'Employed',
          businessName: '', businessType: '',
          higherStudiesDetails: { institution: '', course: '', location: '' }
        });


      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Could not load profile details.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id, isOwnProfile]);

  const handleAddressChange = (field, val) => {
    setAddress(prev => ({ ...prev, [field]: val }));
  };

  const handleEducationChange = (field, val) => {
    setEducation(prev => ({ ...prev, [field]: val }));
  };

  const handleEmploymentChange = (field, val) => {
    setEmployment(prev => ({ ...prev, [field]: val }));
  };

  const uploadPhotoFile = async (file) => {
    const formData = new FormData();
    formData.append('profilePhoto', file);

    try {
      setPhotoUploading(true);
      setError('');
      setSuccess('');

      const res = await API.post('/users/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        setSuccess('Profile photo uploaded successfully!');
        const updatedPhoto = res.data.data.profilePhoto;
        setUser(prev => ({ ...prev, profilePhoto: updatedPhoto }));

        // If viewing own profile, update auth context
        if (isOwnProfile) {
          updateAuthUser({ ...currentUser, profilePhoto: updatedPhoto });
        }
        setPhotoUploading(false);
        return true;
      }
      setPhotoUploading(false);
      return false;
    } catch (err) {
      console.error('Failed upload photo:', err);
      setError(err.response?.data?.message || 'Failed to upload image.');
      setPhotoUploading(false);
      return false;
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await uploadPhotoFile(file);
  };

  // Helper to convert base64 data URL to a File object
  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const startCamera = async (mode = facingMode) => {
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false
      });

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Could not access the camera. Please check permissions.');
      setCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const handleOpenCamera = () => {
    setPhotoMenuAnchor(null);
    setCameraOpen(true);
    setCapturedImage(null);
    setFacingMode('user');
    // Start camera stream after a minor delay to ensure elements are rendered
    setTimeout(() => {
      startCamera('user');
    }, 150);
  };

  const handleCloseCamera = () => {
    stopCamera();
    setCameraOpen(false);
    setCapturedImage(null);
  };

  const toggleCameraFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Use the actual video track dimensions or fallback
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      // Mirror the output if using front camera
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      if (facingMode === 'user') {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }

      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const uploadCapturedPhoto = async () => {
    if (!capturedImage) return;
    const file = dataURLtoFile(capturedImage, 'profile_camera.jpg');
    const success = await uploadPhotoFile(file);
    if (success) {
      handleCloseCamera();
    }
  };

  const handleProfileSave = async () => {
    try {
      setError('');
      setSuccess('');

      if (localLanguageDetails) {
        const words = localLanguageDetails.trim().split(/\s+/).filter(Boolean);
        if (words.length < 15 || words.length > 20) {
          setError(`Local language details must be exactly between 15 and 20 words (currently ${words.length} words).`);
          return;
        }
      }

      const updatedPayload = {
        name,
        email,
        phone,
        password: password || undefined,
        gender,
        adhaar: adhaar || undefined,
        registrationNumber: user?.role !== 'STUDENT' ? registrationNumber : undefined,
        localLanguageDetails,
        address,
        education,
        employment
      };

      const res = await API.patch('/users/profile', updatedPayload);
      if (res.data?.success) {
        setSuccess('Profile saved successfully!');
        setUser(res.data.data.user);
        setPassword('');
        setEditMode(false);
        if (isOwnProfile) {
          updateAuthUser(res.data.data.user);
        }
      }
    } catch (err) {
      console.error('Profile update failed:', err);
      setError(err.response?.data?.message || 'Could not save profile details.');
    }
  };

  const handleTransitionSubmit = async () => {
    try {
      setError('');
      setSuccess('');
      setTransitionOpen(false);

      const res = await API.post('/users/profile/transition', {
        graduationYear: gradYear,
        occupation: transOccupation,
        organization: transCompany,
        employmentStatus: transEmpStatus
      });

      if (res.data?.success) {
        setSuccess('Congratulations! You have successfully transitioned to ALUMNI.');
        setUser(res.data.data.user);
        updateAuthUser(res.data.data.user);
        fetchProfile();
      }
    } catch (err) {
      console.error('Alumni transition failed:', err);
      setError(err.response?.data?.message || 'Failed to transition to Alumni.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: '#0088ff' }} />
      </Box>
    );
  }

  if (error && !user) {
    return <Alert severity="error">{error}</Alert>;
  }

  const isStudent = user?.role === 'STUDENT';
  const isAlumni = user?.role === 'ALUMNI';
  const isStaffOrMemberOrChairperson = ['STAFF', 'MEMBER', 'CHAIRPERSON', 'ADMIN'].includes(user?.role);
  const hasContactDetails = user?.email && user?.phone;

  return (
    <Box sx={{ flexGrow: 1, maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

      <Grid container spacing={4}>
        {/* LEFT COLUMN: EDIT PROFILE FORM */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ borderRadius: "20px", border: "1px solid #E2E8F0", boxShadow: "0 8px 30px rgba(0,0,0,0.02)", overflow: "hidden" }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>

              {/* Photo Upload Section */}
              <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 4 }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={user?.profilePhoto?.url || ''}
                    alt={user?.name}
                    sx={{
                      width: 100,
                      height: 100,
                      border: '2px dashed #CBD5E1',
                      p: 2,
                      bgcolor: '#F8FAFC',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: '#0088ff' }
                    }}
                    onClick={(e) => setPhotoMenuAnchor(e.currentTarget)}
                  >
                    {user?.name?.charAt(0)}
                  </Avatar>
                  <Box sx={{ position: 'absolute', bottom: -4, right: -4 }}>
                    <IconButton
                      size="small"
                      onClick={(e) => setPhotoMenuAnchor(e.currentTarget)}
                      disabled={photoUploading}
                      sx={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #EAECF0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        '&:hover': { backgroundColor: '#F8FAFC' }
                      }}
                    >
                      {photoUploading ? <CircularProgress size={16} /> : <CameraIcon sx={{ fontSize: 16, color: '#64748B' }} />}
                    </IconButton>
                  </Box>
                  <Menu
                    anchorEl={photoMenuAnchor}
                    open={Boolean(photoMenuAnchor)}
                    onClose={() => setPhotoMenuAnchor(null)}
                  >
                    <MenuItem onClick={() => {
                      setPhotoMenuAnchor(null);
                      document.getElementById('icon-button-file-hidden').click();
                    }}>
                      <UploadIcon sx={{ mr: 1, fontSize: 20 }} /> Upload Photo
                    </MenuItem>
                    <MenuItem onClick={handleOpenCamera}>
                      <CameraIcon sx={{ mr: 1, fontSize: 20 }} /> Take Photo
                    </MenuItem>
                  </Menu>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="icon-button-file-hidden"
                    type="file"
                    onChange={handlePhotoUpload}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B' }}>
                    Upload Profile Photo
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', lineHeight: 1.3 }}>
                    Allowed *.jpeg, *.jpg, *.png
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', lineHeight: 1.3 }}>
                    max size of 10.0 MB
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={4}>
                {/* 1. PERSONAL INFORMATION */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ color: '#0088ff', fontSize: 20 }} /> Personal Information
                  </Typography>
                  <Divider sx={{ mb: 2.5 }} />
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        Full Name
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        Gender
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                        >
                          <MenuItem value="MALE">Male</MenuItem>
                          <MenuItem value="FEMALE">Female</MenuItem>
                          <MenuItem value="OTHER">Other</MenuItem>
                          <MenuItem value="PREFER_NOT_TO_SAY">Prefer Not To Say</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    {user?.role !== 'STUDENT' && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                          Registration Number
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={registrationNumber}
                          onChange={(e) => setRegistrationNumber(e.target.value)}
                          placeholder="Registration Number"
                        />
                      </Grid>
                    )}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        Adhaar Number
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        value={adhaar}
                        onChange={(e) => setAdhaar(e.target.value)}
                        placeholder="XXXX XXXX XXXX"
                        inputProps={{ maxLength: 14 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        Local / Native Language Details (15 to 20 words)
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        value={localLanguageDetails}
                        onChange={(e) => setLocalLanguageDetails(e.target.value)}
                        placeholder="Enter details in regional language..."
                        helperText="Must be exactly 15 to 20 words"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        Email Address
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "10px",
                            backgroundColor: "#F8FAFC"
                          }
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        Phone Number
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        Change Password
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="password"
                        placeholder="Enter new password (or blank)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* 2. EDUCATION HISTORY */}
                {(isStudent || isAlumni) && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EducationIcon sx={{ color: '#6366F1', fontSize: 20 }} /> Education History
                    </Typography>
                    <Divider sx={{ mb: 2.5 }} />
                    <Grid container spacing={2.5}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                          College Name
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={education.college || ''}
                          onChange={(e) => handleEducationChange('college', e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                          Course/Major
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={education.course || ''}
                          onChange={(e) => handleEducationChange('course', e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                          Start Month
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select
                            value={education.startMonth || ''}
                            onChange={(e) => handleEducationChange('startMonth', e.target.value)}
                          >
                            {months.map((m) => (
                              <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                          Start Year
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={education.startYear || ''}
                          onChange={(e) => handleEducationChange('startYear', e.target.value)}
                          placeholder="YYYY"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                          End Month
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select
                            value={education.endMonth || ''}
                            onChange={(e) => handleEducationChange('endMonth', e.target.value)}
                          >
                            {months.map((m) => (
                              <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                          {isStudent ? 'Expected Graduation Year' : 'Graduation Year'}
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={education.endYear || ''}
                          onChange={(e) => handleEducationChange('endYear', e.target.value)}
                          placeholder="YYYY"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* 3. EMPLOYMENT & CAREER */}
                {(isAlumni || isStaffOrMemberOrChairperson) && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WorkIcon sx={{ color: '#10b981', fontSize: 20 }} /> Employment & Career
                    </Typography>
                    <Divider sx={{ mb: 2.5 }} />
                    <Grid container spacing={2.5}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                          Occupation / Job Title
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={employment.occupation || ''}
                          onChange={(e) => handleEmploymentChange('occupation', e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                          Organization / Company
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          value={employment.organization || ''}
                          onChange={(e) => handleEmploymentChange('organization', e.target.value)}
                        />
                      </Grid>

                      {isAlumni && (
                        <>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                              Employment Status
                            </Typography>
                            <FormControl fullWidth size="small">
                              <Select
                                value={employment.employmentStatus || 'Employed'}
                                onChange={(e) => handleEmploymentChange('employmentStatus', e.target.value)}
                              >
                                <MenuItem value="Employed">Employed</MenuItem>
                                <MenuItem value="Self-Employed">Self-Employed</MenuItem>
                                <MenuItem value="Business Owner">Business Owner</MenuItem>
                                <MenuItem value="Entrepreneur">Entrepreneur</MenuItem>
                                <MenuItem value="Higher Studies">Higher Studies</MenuItem>
                                <MenuItem value="Unemployed">Unemployed</MenuItem>
                                <MenuItem value="Other">Other</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                              Industry
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              value={employment.industry || ''}
                              onChange={(e) => handleEmploymentChange('industry', e.target.value)}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                              Work Location
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              value={employment.workLocation || ''}
                              onChange={(e) => handleEmploymentChange('workLocation', e.target.value)}
                            />
                          </Grid>

                          {['Business Owner', 'Self-Employed', 'Entrepreneur'].includes(employment.employmentStatus) && (
                            <>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                                  Business Name
                                </Typography>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={employment.businessName || ''}
                                  onChange={(e) => handleEmploymentChange('businessName', e.target.value)}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                                  Business Type
                                </Typography>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={employment.businessType || ''}
                                  onChange={(e) => handleEmploymentChange('businessType', e.target.value)}
                                />
                              </Grid>
                            </>
                          )}
                        </>
                      )}
                    </Grid>
                  </Box>
                )}

                {/* 4. ADDRESS CONFIGURATION */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HomeIcon sx={{ color: '#3b82f6', fontSize: 20 }} /> Address Configuration
                  </Typography>
                  <Divider sx={{ mb: 2.5 }} />
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        Street
                      </Typography>
                      <TextField fullWidth size="small" value={address.street || ''} onChange={(e) => handleAddressChange('street', e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        Area
                      </Typography>
                      <TextField fullWidth size="small" value={address.area || ''} onChange={(e) => handleAddressChange('area', e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        Landmark
                      </Typography>
                      <TextField fullWidth size="small" value={address.landmark || ''} onChange={(e) => handleAddressChange('landmark', e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        Location / City / Landmark
                      </Typography>
                      <TextField fullWidth size="small" value={address.location || ''} onChange={(e) => handleAddressChange('location', e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        City
                      </Typography>
                      <TextField fullWidth size="small" value={address.city || ''} onChange={(e) => handleAddressChange('city', e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        District
                      </Typography>
                      <TextField fullWidth size="small" value={address.district || ''} onChange={(e) => handleAddressChange('district', e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        Taluk
                      </Typography>
                      <TextField fullWidth size="small" value={address.taluk || ''} onChange={(e) => handleAddressChange('taluk', e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        Pincode
                      </Typography>
                      <TextField fullWidth size="small" value={address.pincode || ''} onChange={(e) => handleAddressChange('pincode', e.target.value)} />
                    </Grid>
                  </Grid>
                </Box>

                {/* Save Changes Button Row */}
                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handleProfileSave}
                    sx={{
                      bgcolor: '#0088ff',
                      color: '#ffffff',
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 4,
                      py: 1.25,
                      boxShadow: 'none',
                      '&:hover': { bgcolor: '#0077EE', boxShadow: 'none' }
                    }}
                  >
                    Save Changes
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT COLUMN: LIVE PREVIEW SIDEBAR */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box
            sx={{
              position: { md: 'sticky' },
              top: 90,
              bgcolor: '#F8FAFC',
              borderRadius: '24px',
              border: '1px solid #EAECF0',
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <Card
              sx={{
                width: '100%',
                borderRadius: '20px',
                bgcolor: '#ffffff',
                border: '1px solid #EAECF0',
                boxShadow: '0 8px 32px rgba(0,0,0,0.03)',
                overflow: 'hidden'
              }}
            >
              <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Centered Avatar */}
                <Avatar
                  src={user?.profilePhoto?.url || ''}
                  alt={user?.name || name}
                  sx={{
                    width: 110,
                    height: 110,
                    border: '4px solid #ffffff',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    mb: 2
                  }}
                >
                  {(user?.name || name)?.charAt(0)}
                </Avatar>

                {/* Centered Name */}
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', mb: 1, textAlign: 'center' }}>
                  {name || user?.name || 'User'}
                </Typography>

                {/* Role and Account Status Badges */}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mb: 4 }}>
                  <Chip
                    label={user?.role}
                    size="small"
                    sx={{
                      bgcolor: '#EFF6FF',
                      color: '#0088ff',
                      fontWeight: 700,
                      border: '1px solid #BFDBFE'
                    }}
                  />
                  <Chip
                    label={user?.accountStatus || 'ACTIVE'}
                    size="small"
                    color={user?.accountStatus === 'ACTIVE' ? 'success' : 'warning'}
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                {/* Info List Items */}
                <Stack spacing={3} sx={{ width: '100%' }}>
                  {/* Address */}
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <PlaceIcon sx={{ color: '#64748B', fontSize: 20, mt: 0.25 }} />
                    <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.5 }}>
                      {[
                        address.street,
                        address.area,
                        address.landmark,
                        address.location,
                        address.city,
                        address.district,
                        address.taluk,
                        address.pincode
                      ].filter(Boolean).join(', ') || 'Not Provided'}
                    </Typography>
                  </Stack>

                  {/* Email */}
                  <Stack direction="row" spacing={2} alignItems="center">
                    <EmailIcon sx={{ color: '#64748B', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: '#0088ff', wordBreak: 'break-all' }}>
                      {email || 'Not Provided'}
                    </Typography>
                  </Stack>

                  {/* Phone */}
                  <Stack direction="row" spacing={2} alignItems="center">
                    <PhoneIcon sx={{ color: '#64748B', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                      {phone || 'Not Provided'}
                    </Typography>
                  </Stack>

                  {/* Education History */}
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <EducationIcon sx={{ color: '#64748B', fontSize: 20, mt: 0.25 }} />
                    <Box>
                      {(!education.college && !education.course) ? (
                        <Typography variant="body2" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                          Education: Not Provided
                        </Typography>
                      ) : (
                        <>
                          <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                            {education.college || 'College: Not Provided'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.25 }}>
                            {education.course || 'Course: Not Provided'}
                          </Typography>
                          {(education.startYear || education.endYear) && (
                            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.25 }}>
                              {education.startMonth ? `${months.find(m => m.value === education.startMonth)?.label || education.startMonth} ` : ''}{education.startYear || '-'} - {education.endMonth ? `${months.find(m => m.value === education.endMonth)?.label || education.endMonth} ` : ''}{education.endYear || '-'}
                            </Typography>
                          )}
                        </>
                      )}
                    </Box>
                  </Stack>

                  {/* Employment Details */}
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <WorkIcon sx={{ color: '#64748B', fontSize: 20, mt: 0.25 }} />
                    <Box>
                      {(!employment.occupation && !employment.organization && !employment.employmentStatus) ? (
                        <Typography variant="body2" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                          Employment: Not Provided
                        </Typography>
                      ) : (
                        <>
                          <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                            {employment.occupation || 'Occupation: Not Provided'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.25 }}>
                            {employment.organization || 'Organization: Not Provided'}
                          </Typography>
                          {employment.employmentStatus && (
                            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.25 }}>
                              Status: {employment.employmentStatus}
                            </Typography>
                          )}
                        </>
                      )}
                    </Box>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* STUDENT TRANSITION DIALOG */}
      <Dialog open={transitionOpen} onClose={() => setTransitionOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Transition to Alumni Profile</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            Congratulations on completing your graduation! Transitioning your profile to Alumni will update your status and preserve your educational history while allowing you to maintain your career records.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Graduation Year"
                type="number"
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Employment Status</InputLabel>
                <Select
                  value={transEmpStatus}
                  label="Employment Status"
                  onChange={(e) => setTransEmpStatus(e.target.value)}
                >
                  <MenuItem value="Employed">Employed</MenuItem>
                  <MenuItem value="Self-Employed">Self-Employed</MenuItem>
                  <MenuItem value="Business Owner">Business Owner</MenuItem>
                  <MenuItem value="Entrepreneur">Entrepreneur</MenuItem>
                  <MenuItem value="Higher Studies">Higher Studies</MenuItem>
                  <MenuItem value="Unemployed">Unemployed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Job Title / Occupation"
                value={transOccupation}
                onChange={(e) => setTransOccupation(e.target.value)}
                placeholder="Software Engineer, Consultant, etc."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company / Institution Name"
                value={transCompany}
                onChange={(e) => setTransCompany(e.target.value)}
                placeholder="Google, TechCorp, State University"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setTransitionOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleTransitionSubmit} variant="contained" color="secondary">
            Complete Transition
          </Button>
        </DialogActions>
      </Dialog>

      {/* CAMERA DIALOG */}
      <Dialog
        open={cameraOpen}
        onClose={handleCloseCamera}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#ffffff',
            border: '1px solid #EAECF0',
            borderRadius: 3,
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: 'text.primary', borderBottom: '1px solid #EAECF0', pb: 2 }}>
          Take Profile Photo
        </DialogTitle>
        <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{
            position: 'relative',
            width: '100%',
            maxWidth: 400,
            aspectRatio: '4/3',
            borderRadius: 2,
            overflow: 'hidden',
            border: '2px solid rgba(0, 136, 255, 0.3)',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 3
          }}>
            {!capturedImage ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
                }}
              />
            ) : (
              <img
                src={capturedImage}
                alt="Captured profile preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            )}

            {/* Hidden canvas for snapshot capture */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </Box>

          <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', display: 'block', mb: 1 }}>
            {!capturedImage ? "Center your face and take a picture." : "Check your photo. Click Save to upload."}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between', borderTop: '1px solid #EAECF0', pt: 2 }}>
          <Button onClick={handleCloseCamera} variant="outlined" sx={{ color: 'text.secondary', borderColor: '#D0D5DD' }}>
            Cancel
          </Button>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {!capturedImage ? (
              <>
                <Button
                  onClick={toggleCameraFacingMode}
                  variant="outlined"
                  startIcon={<SwitchCameraIcon />}
                  sx={{ borderColor: 'rgba(0, 136, 255, 0.3)', color: '#0088ff' }}
                >
                  Switch Camera
                </Button>
                <Button
                  onClick={capturePhoto}
                  variant="contained"
                  startIcon={<CameraIcon />}
                  sx={{ background: '#0088ff', color: '#fff', fontWeight: 'bold' }}
                >
                  Capture
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={retakePhoto}
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  sx={{ borderColor: '#D0D5DD', color: 'text.secondary' }}
                >
                  Retake
                </Button>
                <Button
                  onClick={uploadCapturedPhoto}
                  variant="contained"
                  startIcon={<SaveIcon />}
                  sx={{ background: '#0088ff', color: '#fff', fontWeight: 'bold', '&:hover': { background: '#0077EE' } }}
                >
                  Save & Upload
                </Button>
              </>
            )}
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
