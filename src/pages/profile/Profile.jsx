import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import API from '../../api';
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

  CircularProgress,
  Alert,
  FormControlLabel,
  Switch,
  Tooltip,
  Dialog,
  Stack,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Menu,
  InputAdornment
} from '@mui/material';
import {
  Save as SaveIcon,
  PhotoCamera as CameraIcon,
  School as EducationIcon,
  Work as WorkIcon,
  Home as HomeIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Cake as CakeIcon,
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
  LocalPhone as PhoneIcon,
  Badge as BadgeIcon,
  Fingerprint as FingerprintIcon,
  Shield as ShieldIcon,
  VisibilityOff as MaskIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Translate as TranslateIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
  Share as ShareIcon
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

const kannadaToEnglishDigits = (str) => {
  if (!str) return '';
  const knDigits = ['೦', '೧', '೨', '೩', '೪', '೫', '೬', '೭', '೮', '೯'];
  return String(str).replace(/[೦-೯]/g, (char) => {
    const idx = knDigits.indexOf(char);
    return idx !== -1 ? String(idx) : char;
  });
};

const parseTranslatedEnglish = (text) => {
  const result = {
    name: '',
    relation: { relationshipType: '', relatedPersonName: '' },
    address: {}
  };

  if (!text || !text.trim()) return result;

  // Extract 6-digit pincode anywhere in string
  const pinMatch = text.match(/\b\d{6}\b/);
  if (pinMatch) {
    result.address.pincode = pinMatch[0];
  }

  // Split by comma or newline, filter empty items and pincode token
  const rawParts = text
    .split(/,|\n/)
    .map((p) => p.trim())
    .filter((p) => p && p !== result.address?.pincode);

  if (rawParts.length === 0) return result;

  let nameAssigned = false;
  const remainingAddressParts = [];

  const relRegex = /^(?:(son|daughter|father|mother|spouse|wife|husband)\s+of\s+(.+)|(?:father|mother|son|daughter|spouse|wife|husband)\s*[:\-]\s*(.+)|(?:father|mother|son|daughter|spouse|wife|husband)\s+(.+))$/i;

  for (let i = 0; i < rawParts.length; i++) {
    const part = rawParts[i];
    const relMatch = part.match(relRegex);

    if (relMatch) {
      const rawType = (relMatch[1] || part.split(/[:\s]/)[0] || '').toLowerCase();
      let type = 'Other';
      if (rawType === 'father') type = 'Father';
      else if (rawType === 'mother') type = 'Mother';
      else if (rawType === 'son') type = 'Son';
      else if (rawType === 'daughter') type = 'Daughter';
      else if (['spouse', 'wife', 'husband'].includes(rawType)) type = 'Spouse';

      const personName = (relMatch[2] || relMatch[3] || relMatch[4] || '').trim();
      result.relation = {
        relationshipType: type,
        relatedPersonName: personName
      };
      continue;
    }

    if (!nameAssigned) {
      result.name = part;
      nameAssigned = true;
      continue;
    }

    remainingAddressParts.push(part);
  }

  // Map remaining parts into address fields
  if (remainingAddressParts.length === 1) {
    result.address.city = remainingAddressParts[0];
  } else if (remainingAddressParts.length === 2) {
    result.address.city = remainingAddressParts[0];
    result.address.district = remainingAddressParts[1];
  } else if (remainingAddressParts.length === 3) {
    result.address.street = remainingAddressParts[0];
    result.address.city = remainingAddressParts[1];
    result.address.district = remainingAddressParts[2];
  } else if (remainingAddressParts.length > 0) {
    const addressKeys = ['street', 'area', 'landmark', 'location', 'city', 'district', 'taluk'];
    for (let i = 0; i < remainingAddressParts.length && i < addressKeys.length; i++) {
      result.address[addressKeys[i]] = remainingAddressParts[i];
    }
  }

  return result;
};

const Profile = ({ userId: propUserId, isCreate = false, isDialog = false, onClose = null, onUserUpdated = null }) => {
  const { id: paramId } = useParams();
  const id = propUserId || paramId;
  const navigate = useNavigate();
  const { user: currentUser, updateUser: updateAuthUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const isOwnProfile = !isCreate && ((!id && !propUserId) || (id && currentUser?._id && String(id) === String(currentUser._id)));
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'WARDEN';
  const isAuthorizedViewer = isCreate || isOwnProfile || isAdmin;
  const canEdit = isCreate || isOwnProfile || isAdmin;

  const [user, setUser] = useState(isCreate ? { role: 'MEMBER', accountStatus: 'ACTIVE', isDropped: false } : null);
  const [loading, setLoading] = useState(!isCreate);
  const [editMode, setEditMode] = useState(isCreate);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [adhaar, setAdhaar] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [localLanguageDetails, setLocalLanguageDetails] = useState('');

  // Relation State (Father/Mother/Son/Daughter)
  const [relation, setRelation] = useState({
    relationshipType: '',
    relatedPersonName: ''
  });
  const [translating, setTranslating] = useState(false);
  const [mappingFromKannada, setMappingFromKannada] = useState(false);
  const kannadaDebounceRef = useRef(null);

  // Privacy / Data Masking State
  const [privacySettings, setPrivacySettings] = useState({
    maskPhone: false,
    maskEmail: false,
    maskAdhaar: false
  });

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

  // Channels (Social Links)
  const [channels, setChannels] = useState({
    instagram: '',
    linkedin: '',
    whatsapp: ''
  });

  // Photo upload
  const [photoUploading, setPhotoUploading] = useState(false);

  // Photo upload & Camera Dialog State
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
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
    if (isCreate) {
      setLoading(false);
      setEditMode(true);
      setUser({ role: 'MEMBER', accountStatus: 'ACTIVE', isDropped: false });
      return;
    }
    try {
      setLoading(true);
      setError('');
      const targetId = propUserId || id || (isOwnProfile ? currentUser?._id : id);
      if (!targetId) {
        setLoading(false);
        return;
      }
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
        setDob(u.dob || u.dateOfBirth ? (dayjs(u.dob || u.dateOfBirth).isValid() ? dayjs(u.dob || u.dateOfBirth).format('YYYY-MM-DD') : '') : '');
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

        setPrivacySettings({
          maskPhone: Boolean(u.privacySettings?.maskPhone),
          maskEmail: Boolean(u.privacySettings?.maskEmail),
          maskAdhaar: Boolean(u.privacySettings?.maskAdhaar)
        });

        setRelation({
          relationshipType: u.relation?.relationshipType || '',
          relatedPersonName: u.relation?.relatedPersonName || ''
        });

        setChannels({
          instagram: u.channels?.instagram || '',
          linkedin: u.channels?.linkedin || '',
          whatsapp: u.channels?.whatsapp || ''
        });


      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      const msg = 'Could not load profile details.';
      setError(msg);
      enqueueSnackbar(msg, { variant: 'error' });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isCreate) {
      setLoading(false);
      setEditMode(true);
      setUser({ role: 'MEMBER', accountStatus: 'ACTIVE', isDropped: false });
    } else {
      fetchProfile();
    }
  }, [id, isOwnProfile, isCreate]);

  const handleAddressChange = (field, val) => {
    let sanitizedVal = val;
    if (field === 'pincode') {
      sanitizedVal = kannadaToEnglishDigits(val).replace(/\D/g, '').slice(0, 6);
    }
    setAddress(prev => ({ ...prev, [field]: sanitizedVal }));
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

      const targetId = propUserId || id || currentUser?._id;
      const targetPhotoEndpoint = (isOwnProfile && !propUserId) ? '/users/profile/photo' : `/users/${targetId}/photo`;

      const res = await API.post(targetPhotoEndpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        const msg = 'Profile photo uploaded successfully!';
        setSuccess(msg);
        enqueueSnackbar(msg, { variant: 'success' });
        const updatedPhoto = res.data.data.profilePhoto;
        setUser(prev => ({ ...prev, profilePhoto: updatedPhoto }));

        // If viewing own profile, update auth context
        if (isOwnProfile) {
          updateAuthUser({ ...currentUser, profilePhoto: updatedPhoto });
        }
        if (onUserUpdated) {
          onUserUpdated({ ...user, profilePhoto: updatedPhoto });
        }
        setPhotoUploading(false);
        return true;
      }
      setPhotoUploading(false);
      return false;
    } catch (err) {
      console.error('Failed upload photo:', err);
      const errMsg = err.response?.data?.message || 'Failed to upload image.';
      setError(errMsg);
      enqueueSnackbar(errMsg, { variant: 'error' });
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
      const camErr = 'Could not access the camera. Please check permissions.';
      setError(camErr);
      enqueueSnackbar(camErr, { variant: 'error' });
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

  const handleAutoTranslateToKannada = async () => {
    try {
      const parts = [];
      if (name.trim()) parts.push(name.trim());
      if (relation.relationshipType && relation.relatedPersonName?.trim()) {
        parts.push(`${relation.relationshipType} of ${relation.relatedPersonName.trim()}`);
      } else if (relation.relatedPersonName?.trim()) {
        parts.push(relation.relatedPersonName.trim());
      }
      
      // Include all Address Configuration fields
      if (address.street?.trim()) parts.push(address.street.trim());
      if (address.area?.trim()) parts.push(address.area.trim());
      if (address.landmark?.trim()) parts.push(address.landmark.trim());
      if (address.location?.trim()) parts.push(address.location.trim());
      if (address.city?.trim()) parts.push(address.city.trim());
      if (address.district?.trim()) parts.push(address.district.trim());
      if (address.taluk?.trim()) parts.push(address.taluk.trim());
      if (address.pincode?.trim()) {
        parts.push(kannadaToEnglishDigits(address.pincode.trim()));
      }

      if (parts.length === 0) {
        enqueueSnackbar('Please enter Name, Relationship, or Address details first to generate translation.', { variant: 'info' });
        return;
      }

      const textToTranslate = parts.join(', ');
      setTranslating(true);

      let translated = '';
      try {
        const res = await API.post('/users/translate-kannada', { text: textToTranslate });
        if (res.data?.success && res.data?.data?.translatedText) {
          translated = res.data.data.translatedText;
        }
      } catch (apiErr) {
        // Fallback directly to Google Translate endpoint if needed
        const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=kn&dt=t&q=${encodeURIComponent(textToTranslate)}`;
        const fbRes = await fetch(googleUrl);
        const fbData = await fbRes.json();
        translated = Array.isArray(fbData?.[0]) ? fbData[0].map(chunk => chunk?.[0] || '').join('') : '';
      }

      if (translated) {
        // Show pincode/numbers as digits only, not Kannada numerals
        translated = kannadaToEnglishDigits(translated);
        setLocalLanguageDetails(translated);
        enqueueSnackbar('Details translated into Kannada (pincode as numbers)!', { variant: 'success' });
      } else {
        enqueueSnackbar('Please try again or enter manually.', { variant: 'warning' });
      }
    } catch (err) {
      console.error('Translation error:', err);
      enqueueSnackbar('Failed to translate to Kannada. Please try again.', { variant: 'error' });
    } finally {
      setTranslating(false);
    }
  };

  const handleAutoMapFromKannada = async (customText, isAuto = false) => {
    const textToMap = (customText !== undefined ? customText : localLanguageDetails) || '';
    if (!textToMap.trim()) {
      if (!isAuto) {
        enqueueSnackbar('Please enter Kannada details first to map to English fields.', { variant: 'info' });
      }
      return;
    }

    try {
      setMappingFromKannada(true);

      const sanitizedText = kannadaToEnglishDigits(textToMap.trim());

      let translated = '';
      try {
        const res = await API.post('/users/translate-english', { text: sanitizedText });
        if (res.data?.success && res.data?.data?.translatedText) {
          translated = res.data.data.translatedText;
        }
      } catch (apiErr) {
        // Fallback directly to Google Translate endpoint if needed
        const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(sanitizedText)}`;
        const fbRes = await fetch(googleUrl);
        const fbData = await fbRes.json();
        translated = Array.isArray(fbData?.[0]) ? fbData[0].map(chunk => chunk?.[0] || '').join('') : '';
      }

      if (translated) {
        translated = kannadaToEnglishDigits(translated);
        const parsed = parseTranslatedEnglish(translated);

        let fieldsUpdated = [];
        let fieldsSkipped = [];

        // 1. Name: only add if current name has no value, else skip
        if (parsed.name) {
          const hasName = Boolean(name && name.trim());
          if (!hasName) {
            setName(parsed.name);
            fieldsUpdated.push('Name');
          } else {
            fieldsSkipped.push('Name');
          }
        }

        // 2. Relation: only add if current relatedPersonName has no value, else skip
        if (parsed.relation?.relatedPersonName) {
          const hasRelation = Boolean(relation.relatedPersonName && relation.relatedPersonName.trim());
          if (!hasRelation) {
            setRelation(prev => ({
              relationshipType: prev.relationshipType || parsed.relation.relationshipType || 'Other',
              relatedPersonName: parsed.relation.relatedPersonName
            }));
            fieldsUpdated.push('Relation');
          } else {
            fieldsSkipped.push('Relation');
          }
        }

        // 3. Address: check each field, only add if field has no value, else skip
        if (Object.keys(parsed.address).length > 0) {
          let addressFieldsAdded = [];
          setAddress(prev => {
            const next = { ...prev };
            Object.entries(parsed.address).forEach(([k, v]) => {
              const existing = prev[k];
              const hasVal = existing !== undefined && existing !== null && String(existing).trim() !== '';
              if (!hasVal && v && String(v).trim()) {
                next[k] = v;
                addressFieldsAdded.push(k);
              } else if (hasVal) {
                fieldsSkipped.push(k);
              }
            });
            return next;
          });

          if (addressFieldsAdded.length > 0) {
            fieldsUpdated.push(`Address (${addressFieldsAdded.join(', ')})`);
          }
        }

        if (fieldsUpdated.length > 0) {
          enqueueSnackbar(
            isAuto
              ? `Auto-mapped to empty fields: ${fieldsUpdated.join(', ')}`
              : `Mapped to empty fields: ${fieldsUpdated.join(', ')}`,
            { variant: 'success' }
          );
        } else if (fieldsSkipped.length > 0 && !isAuto) {
          enqueueSnackbar(`Existing values preserved. Skipped: ${fieldsSkipped.join(', ')}`, { variant: 'info' });
        }
      } else if (!isAuto) {
        enqueueSnackbar('Could not translate text. Please try again.', { variant: 'warning' });
      }
    } catch (err) {
      console.error('Translation error from Kannada:', err);
      if (!isAuto) {
        enqueueSnackbar('Failed to translate from Kannada. Please try again.', { variant: 'error' });
      }
    } finally {
      setMappingFromKannada(false);
    }
  };

  const handleKannadaInputChange = (val) => {
    setLocalLanguageDetails(val);
    if (kannadaDebounceRef.current) {
      clearTimeout(kannadaDebounceRef.current);
    }
    // Check if input has Kannada characters
    const hasKannada = /[\u0C80-\u0CFF]/.test(val);
    // If only Local / Native Language Details is filled (or Name / address is blank)
    if (hasKannada && (!name.trim() || !address.city?.trim())) {
      kannadaDebounceRef.current = setTimeout(() => {
        handleAutoMapFromKannada(val, true);
      }, 1000);
    }
  };


  const handleProfileSave = async () => {
    try {
      setError('');
      setSuccess('');

      if (password) {
        if (password.length < 6) {
          const msg = 'Password must be at least 6 characters long.';
          setError(msg);
          enqueueSnackbar(msg, { variant: 'error' });
          return;
        }
        if (password !== confirmPassword) {
          const msg = 'Passwords do not match. Please ensure Confirm Password matches your new password.';
          setError(msg);
          enqueueSnackbar(msg, { variant: 'error' });
          return;
        }
      }

      const payload = {
        name: (name || '').trim(),
        email: (email || '').trim(),
        phone: (phone || '').trim(),
        gender: gender || 'MALE',
        dob: dob || null,
        adhaar: (adhaar || '').trim(),
        registrationNumber: (registrationNumber || '').trim(),
        localLanguageDetails: localLanguageDetails || '',
        address: address || {},
        education: education || {},
        employment: employment || {},
        privacySettings: privacySettings || {},
        relation: relation || {},
        channels: channels || {},
      };

      if (password) {
        payload.password = password;
      }

      if (isCreate) {
        if (!name.trim()) {
          const msg = 'Please enter member full name.';
          setError(msg);
          enqueueSnackbar(msg, { variant: 'warning' });
          return;
        }
        payload.role = user?.role || 'MEMBER';
        const res = await API.post('/users', payload);
        if (res.data?.success) {
          const msg = 'Member added successfully!';
          setSuccess(msg);
          enqueueSnackbar(msg, { variant: 'success' });
          const createdUser = res.data.data?.user || res.data.user;
          if (onUserUpdated && createdUser) {
            onUserUpdated(createdUser);
          }
          if (onClose) {
            onClose();
          }
        }
        return;
      }

      const targetId = propUserId || id || (isOwnProfile ? currentUser?._id : id);
      const targetEndpoint = (isOwnProfile && !propUserId) ? '/users/profile' : `/users/${targetId}`;
      const res = await API.patch(targetEndpoint, payload);
      if (res.data?.success) {
        const msg = 'Profile saved successfully!';
        setSuccess(msg);
        enqueueSnackbar(msg, { variant: 'success' });
        const updatedUser = res.data.data?.user || res.data.user || res.data.data;
        if (updatedUser) {
          setUser(updatedUser);
        }
        setPassword('');
        setConfirmPassword('');
        setEditMode(false);
        if (isOwnProfile && updatedUser) {
          updateAuthUser(updatedUser);
        }
        if (onUserUpdated && updatedUser) {
          onUserUpdated(updatedUser);
        }
      }
    } catch (err) {
      console.error('Profile update failed:', err);
      const saveErr = err.response?.data?.message || 'Could not save profile details.';
      setError(saveErr);
      enqueueSnackbar(saveErr, { variant: 'error' });
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
        const transMsg = 'Congratulations! You have successfully transitioned to ALUMNI.';
        setSuccess(transMsg);
        enqueueSnackbar(transMsg, { variant: 'success' });
        setUser(res.data.data.user);
        updateAuthUser(res.data.data.user);
        fetchProfile();
      }
    } catch (err) {
      console.error('Alumni transition failed:', err);
      const transErr = err.response?.data?.message || 'Failed to transition to Alumni.';
      setError(transErr);
      enqueueSnackbar(transErr, { variant: 'error' });
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
  const isStaffOrMemberOrChairperson = ['STAFF', 'MEMBER', 'WARDEN', 'ADMIN'].includes(user?.role);
  const hasContactDetails = user?.email && user?.phone;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ flexGrow: 1, maxWidth: 1200, mx: 'auto', p: isDialog ? { xs: 1.5, sm: 2.5 } : 2 }}>
        {isDialog && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, pb: 1.5, borderBottom: '1px solid #EAECF0' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', fontSize: '1.25rem' }}>
                {isCreate ? 'Add New Member' : (name || user?.name ? `${name || user?.name}` : 'Member Profile Details')}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                {isCreate ? 'Fill member details to add to the directory' : (canEdit ? (isOwnProfile ? 'Editing your profile' : 'Administrator Edit Mode') : 'View-only mode')}
              </Typography>
            </Box>
            {onClose && (
              <IconButton onClick={onClose} sx={{ color: '#64748B', '&:hover': { bgcolor: '#F1F5F9' } }}>
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        )}
      <Grid container spacing={4} sx={{ alignItems: 'flex-start' }}>
        {/* LEFT COLUMN: EDIT PROFILE FORM */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ borderRadius: "12px", border: "1px solid #E2E8F0", boxShadow: "none", overflow: "hidden" }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack spacing={4}>
                {/* 1. PERSONAL INFORMATION */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ color: '#0088ff', fontSize: 20 }} /> Personal Information
                  </Typography>
                  {/* <Divider sx={{ mb: 2.5 }} /> */}
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
                    {/* Relative Name (Merged with Relationship dropdown) */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        Relative Name
                      </Typography>
                      <Box sx={{ display: 'flex', width: '100%' }}>
                        <FormControl sx={{ width: "110px", flexShrink: 0 }}>
                          <Select
                            size="small"
                            value={relation.relationshipType || 'Father'}
                            onChange={(e) => setRelation(prev => ({ ...prev, relationshipType: e.target.value }))}
                            MenuProps={{ disableScrollLock: true }}
                            sx={{
                              borderTopRightRadius: 0,
                              borderBottomRightRadius: 0,
                              bgcolor: '#F8FAFC',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderRight: 'none'
                              }
                            }}
                          >
                            <MenuItem value="Father">Father</MenuItem>
                            <MenuItem value="Mother">Mother</MenuItem>
                            <MenuItem value="Son">Son</MenuItem>
                            <MenuItem value="Daughter">Daughter</MenuItem>
                            <MenuItem value="Brother">Brother</MenuItem>
                            <MenuItem value="Sister">Sister</MenuItem>
                            <MenuItem value="Spouse">Spouse</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                          </Select>
                        </FormControl>
                        <TextField
                          fullWidth
                          size="small"
                          value={relation.relatedPersonName || ''}
                          onChange={(e) => setRelation(prev => ({ ...prev, relatedPersonName: e.target.value }))}
                          placeholder={relation.relationshipType ? `Enter ${relation.relationshipType.toLowerCase()} name` : "Enter relative name"}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderTopLeftRadius: 0,
                              borderBottomLeftRadius: 0
                            }
                          }}
                        />
                      </Box>
                    </Grid>

                    {/* Date of Birth (DOB) */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        Date of Birth
                      </Typography>
                      <DatePicker
                        format="DD/MM/YYYY"
                        maxDate={dayjs()}
                        value={dob ? dayjs(dob) : null}
                        onChange={(newValue) => {
                          const formatted = newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '';
                          setDob(formatted);
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                            placeholder: 'DD/MM/YYYY'
                          },
                          dialog: {
                            disableScrollLock: true
                          },
                          popper: {
                            disablePortal: false
                          }
                        }}
                      />
                    </Grid>

                    {/* Gender */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        Gender
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={gender || 'MALE'}
                          onChange={(e) => setGender(e.target.value)}
                          MenuProps={{ disableScrollLock: true }}
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
                          Reg No.
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          disabled={!canEdit}
                          value={registrationNumber}
                          onChange={(e) => setRegistrationNumber(e.target.value)}
                          placeholder="Reg No."
                        />
                      </Grid>
                    )}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                          Adhaar Number
                        </Typography>
                        <Tooltip title="When masked, only you can view your Adhaar. Other community members cannot see it.">
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={Boolean(privacySettings.maskAdhaar)}
                                onChange={(e) => setPrivacySettings(prev => ({ ...prev, maskAdhaar: e.target.checked }))}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#0088ff' },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#0088ff' }
                                }}
                              />
                            }
                            label={
                              <Typography variant="caption" sx={{ color: privacySettings.maskAdhaar ? '#0088ff' : '#64748B', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <MaskIcon sx={{ fontSize: 13 }} /> Mask
                              </Typography>
                            }
                            sx={{ m: 0 }}
                          />
                        </Tooltip>
                      </Box>
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
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75, flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                          Kanada Overview
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                          <Button
                            size="small"
                            onClick={() => handleAutoMapFromKannada(localLanguageDetails, false)}
                            disabled={mappingFromKannada || !localLanguageDetails.trim()}
                            startIcon={mappingFromKannada ? <CircularProgress size={14} sx={{ color: '#059669' }} /> : <TranslateIcon sx={{ fontSize: 15 }} />}
                            sx={{
                              textTransform: 'none',
                              fontSize: 12,
                              fontWeight: 700,
                              color: '#059669',
                              bgcolor: 'rgba(16, 185, 129, 0.08)',
                              borderRadius: '8px',
                              px: 1.5,
                              py: 0.5,
                              '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.16)' }
                            }}
                          >
                            {mappingFromKannada ? 'Mapping...' : 'Map to English Fields'}
                          </Button>
                          <Button
                            size="small"
                            onClick={handleAutoTranslateToKannada}
                            disabled={translating}
                            startIcon={translating ? <CircularProgress size={14} sx={{ color: '#0088ff' }} /> : <TranslateIcon sx={{ fontSize: 15 }} />}
                            sx={{
                              textTransform: 'none',
                              fontSize: 12,
                              fontWeight: 700,
                              color: '#0088ff',
                              bgcolor: 'rgba(0, 136, 255, 0.08)',
                              borderRadius: '8px',
                              px: 1.5,
                              py: 0.5,
                              '&:hover': { bgcolor: 'rgba(0, 136, 255, 0.15)' }
                            }}
                          >
                            {translating ? 'Translating...' : 'Auto Translate to Kannada'}
                          </Button>
                        </Stack>
                      </Box>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        value={localLanguageDetails}
                        onChange={(e) => handleKannadaInputChange(e.target.value)}
                        onBlur={() => {
                          if (localLanguageDetails.trim() && /[\u0C80-\u0CFF]/.test(localLanguageDetails)) {
                            if (!name.trim() || !address.city?.trim()) {
                              handleAutoMapFromKannada(localLanguageDetails, true);
                            }
                          }
                        }}
                        placeholder="ವಿವರಗಳನ್ನು ಕನ್ನಡದಲ್ಲಿ ನಮೂದಿಸಿ (ಉದಾ: ಮದನ್, ರಮೇಶ್ ಅವರ ಮಗ, ಬೆಂಗಳೂರು, 560001)..."
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                          Email Address
                        </Typography>
                        <Tooltip title="When masked, only you can view your email. Other community members cannot see it.">
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={Boolean(privacySettings.maskEmail)}
                                onChange={(e) => setPrivacySettings(prev => ({ ...prev, maskEmail: e.target.checked }))}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#0088ff' },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#0088ff' }
                                }}
                              />
                            }
                            label={
                              <Typography variant="caption" sx={{ color: privacySettings.maskEmail ? '#0088ff' : '#64748B', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <MaskIcon sx={{ fontSize: 13 }} /> Mask
                              </Typography>
                            }
                            sx={{ m: 0 }}
                          />
                        </Tooltip>
                      </Box>
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
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                          Phone Number
                        </Typography>
                        <Tooltip title="When masked, only you can view your phone number. Other community members cannot see it.">
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={Boolean(privacySettings.maskPhone)}
                                onChange={(e) => setPrivacySettings(prev => ({ ...prev, maskPhone: e.target.checked }))}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#0088ff' },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#0088ff' }
                                }}
                              />
                            }
                            label={
                              <Typography variant="caption" sx={{ color: privacySettings.maskPhone ? '#0088ff' : '#64748B', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <MaskIcon sx={{ fontSize: 13 }} /> Mask
                              </Typography>
                            }
                            sx={{ m: 0 }}
                          />
                        </Tooltip>
                      </Box>
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
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  type="button"
                                  size="small"
                                  onClick={() => setShowPassword(prev => !prev)}
                                  edge="end"
                                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                                  sx={{ color: '#64748B', '&:hover': { color: '#1E293B' } }}
                                >
                                  {showPassword ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }
                        }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                type="button"
                                size="small"
                                onClick={() => setShowPassword(prev => !prev)}
                                edge="end"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                sx={{ color: '#64748B', '&:hover': { color: '#1E293B' } }}
                              >
                                {showPassword ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        Confirm Password
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        error={Boolean(password && confirmPassword && password !== confirmPassword)}
                        helperText={password && confirmPassword && password !== confirmPassword ? "Passwords do not match" : ""}
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  type="button"
                                  size="small"
                                  onClick={() => setShowConfirmPassword(prev => !prev)}
                                  edge="end"
                                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                  sx={{ color: '#64748B', '&:hover': { color: '#1E293B' } }}
                                >
                                  {showConfirmPassword ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }
                        }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                type="button"
                                size="small"
                                onClick={() => setShowConfirmPassword(prev => !prev)}
                                edge="end"
                                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                sx={{ color: '#64748B', '&:hover': { color: '#1E293B' } }}
                              >
                                {showConfirmPassword ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* 2. EDUCATION HISTORY */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EducationIcon sx={{ color: '#6366F1', fontSize: 20 }} /> Education History
                  </Typography>
                  {/* <Divider sx={{ mb: 2.5 }} /> */}
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
                          MenuProps={{ disableScrollLock: true }}
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
                      <DatePicker
                        views={['year']}
                        openTo="year"
                        value={education.startYear ? dayjs().year(Number(education.startYear)) : null}
                        onChange={(newValue) => {
                          const yr = newValue && newValue.isValid() ? newValue.year() : '';
                          handleEducationChange('startYear', yr);
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                            placeholder: 'YYYY'
                          },
                          dialog: {
                            disableScrollLock: true
                          },
                          popper: {
                            disablePortal: false
                          }
                        }}
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
                          MenuProps={{ disableScrollLock: true }}
                        >
                          {months.map((m) => (
                            <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        {isStudent ? 'Graduation Year' : 'Graduation Year'}
                      </Typography>
                      <DatePicker
                        views={['year']}
                        openTo="year"
                        value={education.endYear ? dayjs().year(Number(education.endYear)) : null}
                        onChange={(newValue) => {
                          const yr = newValue && newValue.isValid() ? newValue.year() : '';
                          handleEducationChange('endYear', yr);
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                            placeholder: 'YYYY'
                          },
                          dialog: {
                            disableScrollLock: true
                          },
                          popper: {
                            disablePortal: false
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* 3. CHANNELS */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShareIcon sx={{ color: '#0A66C2', fontSize: 20 }} /> Channels
                  </Typography>
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        Instagram
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="https://instagram.com"
                        value={channels.instagram || ''}
                        onChange={(e) => setChannels((prev) => ({ ...prev, instagram: e.target.value }))}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <InstagramIcon sx={{ color: '#E1306C', fontSize: 20 }} />
                              </InputAdornment>
                            )
                          }
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
                        LinkedIn
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="https://linkedin.com"
                        value={channels.linkedin || ''}
                        onChange={(e) => setChannels((prev) => ({ ...prev, linkedin: e.target.value }))}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <LinkedInIcon sx={{ color: '#0A66C2', fontSize: 20 }} />
                              </InputAdornment>
                            )
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* 3. EMPLOYMENT & CAREER */}
                {(isAlumni || isStaffOrMemberOrChairperson) && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WorkIcon sx={{ color: '#10b981', fontSize: 20 }} /> Employment & Career
                    </Typography>
                    {/* <Divider sx={{ mb: 2.5 }} /> */}
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
                              Employment
                            </Typography>
                            <FormControl fullWidth size="small">
                              <Select
                                value={employment.employmentStatus || 'Employed'}
                                onChange={(e) => handleEmploymentChange('employmentStatus', e.target.value)}
                                MenuProps={{ disableScrollLock: true }}
                              >
                                <MenuItem value="Employed">Employed</MenuItem>
                                <MenuItem value="Business Owner">Business Owner</MenuItem>
                                <MenuItem value="Entrepreneur">Entrepreneur</MenuItem>
                                <MenuItem value="Higher Studies">Higher Studies</MenuItem>
                                <MenuItem value="Government Service">Government Service</MenuItem>
                                <MenuItem value="Retired">Retired</MenuItem>
                                <MenuItem value="Unemployed">Unemployed</MenuItem>
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
                  {/* <Divider sx={{ mb: 2.5 }} /> */}
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
                {canEdit && (
                  <Stack direction="row" sx={{ mt: 1 , justifyContent:"flex-end"}}>
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
                      {isCreate ? 'Add Member' : 'Save Changes'}
                    </Button>
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT COLUMN: LIVE PREVIEW SIDEBAR */}
        <Grid
          size={{ xs: 12, md: 4 }}
          sx={{
            position: { md: 'sticky' },
            top: 0,
            alignSelf: 'flex-start',
            zIndex: 10
          }}
        >
          <Box
            sx={{
              width: '100%',
              boxSizing: 'border-box',
              bgcolor: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #EAECF0',
              p: { xs: 2, sm: 3 },
              py: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <Card
              sx={{
                width: '100%',
                borderRadius: '12px',
                bgcolor: '#ffffff',
                minHeight:"78dvh",
                border: '1px solid #EAECF0',
                boxShadow: '0 8px 32px rgba(0,0,0,0.03)',
                overflow: 'hidden'
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, md: 3 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Centered Avatar with Upload Profile Image Logic */}
              <Box sx={{ position: 'relative', mb: 2 }}>
                <Avatar
                  src={user?.profilePhoto?.url || ''}
                  alt={user?.name || name}
                  sx={{
                    width: 104,
                    height: 104,
                    borderRadius: '50%',
                    border: '2px dashed #CBD5E1',
                    p: user?.profilePhoto?.url ? '3px' : 2,
                    bgcolor: '#F8FAFC',
                    cursor: canEdit ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    overflow: 'hidden',
                    '& .MuiAvatar-img': {
                      borderRadius: '50%',
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%'
                    },
                    '&:hover': canEdit ? { borderColor: '#0088ff' } : {}
                  }}
                  onClick={() => {
                    if (canEdit) setPhotoDialogOpen(true);
                  }}
                >
                  {(user?.name || name)?.charAt(0)}
                </Avatar>
                {canEdit && (
                  <Box sx={{ position: 'absolute', bottom: -2, right: -2 }}>
                    <IconButton
                      size="small"
                      onClick={() => setPhotoDialogOpen(true)}
                      disabled={photoUploading}
                      sx={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #EAECF0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        p: '5px',
                        '&:hover': { backgroundColor: '#0088ff', color: '#fff' }
                      }}
                    >
                      {photoUploading ? <CircularProgress size={16} /> : <CameraIcon sx={{ fontSize: 16, color: '#64748B' }} />}
                    </IconButton>
                  </Box>
                )}
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="icon-button-file-hidden"
                  type="file"
                  onChange={handlePhotoUpload}
                />
              </Box>

                {/* Centered Name */}
                {/* <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', mb: 1, textAlign: 'center' }}>
                  {name || user?.name || 'User'}
                </Typography> */}

                {/* Info List Items */}
                <Stack spacing={2} sx={{ width: '100%' }}>
                  {/* Registration Number */}
                  {(registrationNumber || user?.registrationNumber || user?.role !== 'STUDENT') && (
                    <Stack direction="row" spacing={2} alignItems="center">
                      <BadgeIcon sx={{ color: '#64748B', fontSize: 20 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: 12, fontWeight: 500, lineHeight: 1.1 }}>
                          Registration No.
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>
                          {registrationNumber || user?.registrationNumber || 'Not Provided'}
                        </Typography>
                      </Box>
                    </Stack>
                  )}

                  {/* Family / Relation */}
                  {(relation.relatedPersonName || user?.relation?.relatedPersonName) && (
                    <Stack direction="row" spacing={2} alignItems="center">
                      <PersonIcon sx={{ color: '#64748B', fontSize: 20 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: 12, fontWeight: 500, lineHeight: 1.1 }}>
                          {relation.relationshipType || user?.relation?.relationshipType || 'Relation'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>
                          {relation.relatedPersonName || user?.relation?.relatedPersonName}
                        </Typography>
                      </Box>
                    </Stack>
                  )}

                  {/* Date of Birth */}
                  {(dob || user?.dob || user?.dateOfBirth) && (
                    <Stack direction="row" spacing={2} alignItems="center">
                      <CakeIcon sx={{ color: '#64748B', fontSize: 20 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: 12, fontWeight: 500, lineHeight: 1.1 }}>
                          Date of Birth
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>
                          {dayjs(dob || user?.dob || user?.dateOfBirth).isValid()
                            ? dayjs(dob || user?.dob || user?.dateOfBirth).format('DD MMM YYYY')
                            : (dob || user?.dob || user?.dateOfBirth)}
                        </Typography>
                      </Box>
                    </Stack>
                  )}

                  {/* Adhaar Number */}
                  <Stack direction="row" spacing={2} alignItems="center">
                    <FingerprintIcon sx={{ color: '#64748B', fontSize: 20 }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: 12, fontWeight: 500, lineHeight: 1.1 }}>
                          Adhaar No.
                        </Typography>
                        {privacySettings.maskAdhaar && (
                          <Tooltip title="Masked from public users. Visible only to you.">
                            <Chip
                              size="small"
                              icon={<LockIcon color="#fff" sx={{ fontSize: '11px !important',borderRadius:"10px" }} />}
                              label="Masked"
                              sx={{ height: 18, fontSize: 10, bgcolor: '#0088ff', color: '#fff', fontWeight: 700 }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>
                        {isAuthorizedViewer
                          ? (adhaar || user?.adhaar || 'Not Provided')
                          : (privacySettings.maskAdhaar || user?.isAdhaarMasked ? '•••• •••• ••••' : (adhaar || user?.adhaar || 'Not Provided'))}
                      </Typography>
                    </Box>
                  </Stack>
             
                  {/* Phone */}
                  <Stack direction="row" spacing={2} alignItems="center">
                    <PhoneIcon sx={{ color: '#64748B', fontSize: 20 }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: 12, fontWeight: 500, lineHeight: 1.1 }}>
                          Phone
                        </Typography>
                        {privacySettings.maskPhone && (
                          <Tooltip title="Masked from public / other users. Visible only to you and administrators.">
                            <Chip
                              size="small"
                              icon={<LockIcon sx={{ fontSize: '11px !important' }} />}
                              label="Masked"
                              sx={{ height: 18, fontSize: 10, bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700 }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                        {isAuthorizedViewer
                          ? (phone || 'Not Provided')
                          : (privacySettings.maskPhone || user?.isPhoneMasked ? '••••••••••' : (phone || 'Not Provided'))}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Email */}
                  <Stack direction="row" spacing={2} alignItems="center">
                    <EmailIcon sx={{ color: '#64748B', fontSize: 20 }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: 12, fontWeight: 500, lineHeight: 1.1 }}>
                          Email
                        </Typography>
                        {privacySettings.maskEmail && (
                          <Tooltip title="Masked from public / other users. Visible only to you and administrators.">
                            <Chip
                              size="small"
                              icon={<LockIcon sx={{ fontSize: '11px !important' }} />}
                              label="Masked"
                              sx={{ height: 18, fontSize: 10, bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700 }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all', color: '#334155' }}>
                        {isAuthorizedViewer
                          ? (email || 'Not Provided')
                          : (privacySettings.maskEmail || user?.isEmailMasked ? '••••••••••••' : (email || 'Not Provided'))}
                      </Typography>
                    </Box>
                  </Stack>


                  {/* Education History */}
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <EducationIcon sx={{ color: '#64748B', fontSize: 20, mt: 0.25 }} />
                    <Box>
                         <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: 12, fontWeight: 500, lineHeight: 1.1 }}>
                        Education
                      </Typography>
                      {(!education.college && !education.course) ? (
                        <Typography variant="body2" sx={{  fontStyle: 'italic' }}>
                          Not Provided
                        </Typography>
                      ) : (
                        <>
                          <Typography variant="body2" sx={{  fontWeight: 600 }}>
                            {education.college || 'College: Not Provided'}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.25 }}>
                            {education.course || 'Course: Not Provided'}
                          </Typography>
                          {(education.startYear || education.endYear) && (
                            <Typography variant="caption" sx={{  display: 'block', mt: 0.25 }}>
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
                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                           Not Provided
                        </Typography>
                      ) : (
                        <>
                          <Typography variant="body2" sx={{  fontWeight: 600 }}>
                            {employment.occupation || 'Occupation'}
                          </Typography>
                          <Typography variant="caption" sx={{  display: 'block', mt: 0.25 }}>
                            {employment.organization || 'Not Provided'}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Stack>
                       {/* Address */}
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <PlaceIcon sx={{ color: '#64748B', fontSize: 20 }} />
                    <Typography variant="body2" sx={{  lineHeight: 1.5 }}>
                      {[
                        address.street,
                        address.area,
                        address.landmark,
                        address.location,
                        address.city,
                        address.district,
                        address.taluk,
                        address.pincode ? kannadaToEnglishDigits(address.pincode) : ''
                      ].filter(Boolean).join(', ') || 'Not Provided'}
                    </Typography>
                  </Stack>

                  {/* Local Details (Kannada) */}
                  {(localLanguageDetails || user?.localLanguageDetails) && (
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <WebIcon sx={{  fontSize: 20, mt: 0.25 }} />
                      <Box>
                        <Typography variant="caption" sx={{  display: 'block', fontSize: 12, fontWeight: 600, lineHeight: 1.1 }}>
                          ಕನ್ನಡ ವಿವರ (Kannada)
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 500, lineHeight: 1.5 }}>
                          {kannadaToEnglishDigits(localLanguageDetails || user?.localLanguageDetails)}
                        </Typography>
                      </Box>
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* STUDENT TRANSITION DIALOG */}
      <Dialog open={transitionOpen} onClose={() => setTransitionOpen(false)} disableScrollLock>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Transition to Alumni Profile</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            Congratulations on completing your graduation! Transitioning your profile to Alumni will update your status and preserve your educational history while allowing you to maintain your career records.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <DatePicker
                views={['year']}
                openTo="year"
                label="Graduation Year"
                value={gradYear ? dayjs().year(Number(gradYear)) : null}
                onChange={(newValue) => {
                  const yr = newValue && newValue.isValid() ? newValue.year() : '';
                  setGradYear(yr);
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    placeholder: 'YYYY'
                  },
                  dialog: {
                    disableScrollLock: true
                  },
                  popper: {
                    disablePortal: false
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Employment</InputLabel>
                <Select
                  value={transEmpStatus}
                  label="Employment"
                  onChange={(e) => setTransEmpStatus(e.target.value)}
                  MenuProps={{ disableScrollLock: true }}
                >
                  <MenuItem value="Employed">Employed</MenuItem>
                  <MenuItem value="Business Owner">Business Owner</MenuItem>
                  <MenuItem value="Entrepreneur">Entrepreneur</MenuItem>
                  <MenuItem value="Higher Studies">Higher Studies</MenuItem>
                  <MenuItem value="Government Service">Government Service</MenuItem>
                  <MenuItem value="Retired">Retired</MenuItem>
                  <MenuItem value="Unemployed">Unemployed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Current Occupation / Job Title"
                value={transOccupation}
                onChange={(e) => setTransOccupation(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Company / Organization"
                value={transCompany}
                onChange={(e) => setTransCompany(e.target.value)}
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
        {/* <DialogTitle sx={{ fontWeight: 'bold', color: 'text.primary', borderBottom: '1px solid #EAECF0', pb: 2 }}>
          Take Profile Photo
        </DialogTitle> */}
        <DialogContent sx={{  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{
            position: 'relative',
            width: '100%',
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

          {/* <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', display: 'block', mb: 1 }}>
            {!capturedImage ? "Center your face and take a picture." : "Check your photo. Click Save to upload."}
          </Typography> */}
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
      {/* PHOTO SELECTION POPUP DIALOG */}
      <Dialog
        open={photoDialogOpen}
        onClose={() => setPhotoDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        disableScrollLock
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 1,
            boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, pt: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '1.1rem' }}>
            Update Profile Photo
          </Typography>
          <IconButton size="small" onClick={() => setPhotoDialogOpen(false)} sx={{ color: '#94A3B8' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 2 }}>
          

          <Stack spacing={2}>
            {/* Option 1: Upload from Device */}
            <Box
              onClick={() => {
                setPhotoDialogOpen(false);
                const fileInput = document.getElementById('icon-button-file-hidden');
                if (fileInput) fileInput.click();
              }}
              sx={{
                p: 2,
                borderRadius: '12px',
                border: '1.5px solid #E2E8F0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#0088ff',
                  bgcolor: '#F0F7FF',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: '10px',
                  bgcolor: '#EBF5FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0088ff',
                  flexShrink: 0
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                  Upload from Device
                </Typography>
              
              </Box>
            </Box>

            {/* Option 2: Take Photo */}
            <Box
              onClick={() => {
                setPhotoDialogOpen(false);
                handleOpenCamera();
              }}
              sx={{
                p: 2,
                borderRadius: '12px',
                border: '1.5px solid #E2E8F0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#0088ff',
                  bgcolor: '#F0F7FF',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: '10px',
                  bgcolor: '#F0FDF4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981',
                  flexShrink: 0
                }}
              >
                <CameraIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                  Take Photo with Camera
                </Typography>
            
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
          <Button
            onClick={() => setPhotoDialogOpen(false)}
            variant="outlined"
            fullWidth
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#E2E8F0',
              color: '#64748B'
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default Profile;
