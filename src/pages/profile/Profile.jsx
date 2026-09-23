import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import API from '../../api';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  PhotoCamera as CameraIcon,
  Visibility as VisibilityIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';

import {
  PersonalInformationSection,
  EducationSection,
  ChannelsSection,
  EmploymentSection,
  AddressSection,
  ProfileSummaryCard,
  ProfileSkeleton,
  CameraCaptureDialog,
  PhotoSelectionDialog,
  PhotoPreviewDialog,
  StudentTransitionDialog,
  kannadaToEnglishDigits,
  parseTranslatedEnglish,
  dataURLtoFile
} from '../../components/Profile';

const Profile = ({
  userId: propUserId,
  isCreate = false,
  isDialog = false,
  onClose = null,
  onUserUpdated = null
}) => {
  const { id: paramId } = useParams();
  const id = propUserId || paramId;
  const navigate = useNavigate();
  const { user: currentUser, updateUser: updateAuthUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isOwnProfile = !isCreate && Boolean(
    (!id && !propUserId) ||
    (id && currentUser?._id && String(id) === String(currentUser._id)) ||
    (propUserId && currentUser?._id && String(propUserId) === String(currentUser._id))
  );
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'ADMINISTRATOR';
  const isWarden = currentUser?.role === 'WARDEN';
  const isAuthorizedViewer = isCreate || isOwnProfile || isAdmin || isWarden;
  const canEdit = isCreate || isOwnProfile || isAdmin || isWarden;

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
  const [role, setRole] = useState('MEMBER');
  const [dob, setDob] = useState('');
  const [adhaar, setAdhaar] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [localLanguageDetails, setLocalLanguageDetails] = useState('');

  // Relation State
  const [relation, setRelation] = useState({
    relationshipType: '',
    relatedPersonName: ''
  });
  const [translating, setTranslating] = useState(false);
  const [mappingFromKannada, setMappingFromKannada] = useState(false);
  const kannadaDebounceRef = useRef(null);

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    maskPhone: false,
    maskEmail: false,
    maskAdhaar: false,
    maskDob: false
  });

  // Address
  const [address, setAddress] = useState({
    street: '', area: '', landmark: '', location: '', city: '', district: '', taluk: '', pincode: ''
  });

  // Education
  const [education, setEducation] = useState({
    college: '', course: '', startMonth: '', startYear: '', endMonth: '', endYear: ''
  });

  // Employment
  const [employment, setEmployment] = useState({
    occupation: '', organization: '', industry: '', workLocation: '', employmentStatus: '',
    businessName: '', businessType: '',
    higherStudiesDetails: { institution: '', course: '', location: '' }
  });

  // Channels & Portfolio
  const [channels, setChannels] = useState({
    instagram: '',
    linkedin: '',
    whatsapp: '',
    portfolio: '',
    github: '',
    behance: '',
    resume: { url: '', publicId: '', filename: '', uploadedAt: null }
  });

  // Resume upload & delete state
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeDeleting, setResumeDeleting] = useState(false);
  const resumeInputRef = useRef(null);

  // Photo upload
  const [photoUploading, setPhotoUploading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [transitionSubmitting, setTransitionSubmitting] = useState(false);

  // Dialog States
  const [photoMenuAnchor, setPhotoMenuAnchor] = useState(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [viewPhotoOpen, setViewPhotoOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Student Transition Dialog State
  const [transitionOpen, setTransitionOpen] = useState(false);
  const [gradYear, setGradYear] = useState(new Date().getFullYear());
  const [transOccupation, setTransOccupation] = useState('');
  const [transCompany, setTransCompany] = useState('');
  const [transEmpStatus, setTransEmpStatus] = useState('Employed');

  // Clean up camera streams on unmount or stream change
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Synchronize video element with cameraStream whenever available
  useEffect(() => {
    if (cameraOpen && cameraStream && videoRef.current) {
      if (videoRef.current.srcObject !== cameraStream) {
        videoRef.current.srcObject = cameraStream;
      }
      videoRef.current.play().catch((e) => console.log('Camera video playback handled:', e));
    }
  }, [cameraOpen, cameraStream]);

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
      let endpoint = '';
      if (isOwnProfile) {
        endpoint = '/users/profile';
      } else {
        const targetId = propUserId || id;
        if (!targetId || targetId === 'undefined' || targetId === 'null') {
          setLoading(false);
          return;
        }
        endpoint = `/users/${targetId}`;
      }
      const res = await API.get(endpoint);
      if (res.data?.success) {
        const u = res.data.data.user;
        setUser(u);

        setName(u.name || '');
        setEmail(u.email || (u.isEmailMasked ? '••••••••••••' : ''));
        setPhone(u.phone || (u.isPhoneMasked ? '••••••••••' : ''));
        setPassword('');
        setGender(u.gender || 'MALE');
        setRole(u.role || 'MEMBER');
        setDob(
          u.dob || u.dateOfBirth
            ? dayjs(u.dob || u.dateOfBirth).isValid()
              ? dayjs(u.dob || u.dateOfBirth).format('YYYY-MM-DD')
              : ''
            : ''
        );
        setAdhaar(u.adhaar || (u.isAdhaarMasked ? '•••• •••• ••••' : ''));
        setRegistrationNumber(u.registrationNumber || '');
        setLocalLanguageDetails(u.localLanguageDetails || '');

        setAddress(
          u.address || {
            street: '', area: '', landmark: '', location: '', city: '', district: '', taluk: '', pincode: ''
          }
        );

        setEducation(
          u.education || {
            college: '', course: '', startMonth: '', startYear: '', endMonth: '', endYear: ''
          }
        );

        setEmployment(
          u.employment || {
            occupation: '', organization: '', industry: '', workLocation: '', employmentStatus: 'Employed',
            businessName: '', businessType: '',
            higherStudiesDetails: { institution: '', course: '', location: '' }
          }
        );

        setPrivacySettings({
          maskPhone: Boolean(u.privacySettings?.maskPhone),
          maskEmail: Boolean(u.privacySettings?.maskEmail),
          maskAdhaar: Boolean(u.privacySettings?.maskAdhaar),
          maskDob: Boolean(u.privacySettings?.maskDob)
        });

        setRelation({
          relationshipType: u.relation?.relationshipType || '',
          relatedPersonName: u.relation?.relatedPersonName || ''
        });

        setChannels({
          instagram: u.channels?.instagram || '',
          linkedin: u.channels?.linkedin || '',
          whatsapp: u.channels?.whatsapp || '',
          portfolio: u.channels?.portfolio || '',
          github: u.channels?.github || '',
          behance: u.channels?.behance || '',
          resume: u.channels?.resume || { url: '', publicId: '', filename: '', uploadedAt: null }
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
  }, [id, isOwnProfile, isCreate, currentUser?._id]);

  const handleAddressChange = (field, val) => {
    let sanitizedVal = val;
    if (field === 'pincode') {
      sanitizedVal = kannadaToEnglishDigits(val).replace(/\D/g, '').slice(0, 6);
    }
    setAddress((prev) => ({ ...prev, [field]: sanitizedVal }));
  };

  const handleEducationChange = (field, val) => {
    setEducation((prev) => ({ ...prev, [field]: val }));
  };

  const handleEmploymentChange = (field, val) => {
    setEmployment((prev) => ({ ...prev, [field]: val }));
  };

  const uploadPhotoFile = async (file) => {
    const formData = new FormData();
    formData.append('profilePhoto', file);

    try {
      setPhotoUploading(true);
      setError('');
      setSuccess('');

      const targetId = propUserId || id || currentUser?._id;
      const targetPhotoEndpoint = isOwnProfile ? '/users/profile/photo' : `/users/${targetId}/photo`;

      const res = await API.post(targetPhotoEndpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        const msg = 'Profile photo uploaded successfully!';
        setSuccess(msg);
        enqueueSnackbar(msg, { variant: 'success' });
        const updatedPhoto = res.data.data.profilePhoto;
        setUser((prev) => ({ ...prev, profilePhoto: updatedPhoto }));

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

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setResumeUploading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('resume', file);

      const targetId = propUserId || id || currentUser?._id;
      const targetEndpoint = isOwnProfile ? '/users/profile/resume' : `/users/${targetId}/resume`;

      const res = await API.post(targetEndpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        const msg = 'Resume uploaded successfully!';
        setSuccess(msg);
        enqueueSnackbar(msg, { variant: 'success' });
        const updatedResume = res.data.data?.resume;
        setChannels((prev) => ({ ...prev, resume: updatedResume }));
        setUser((prev) => ({
          ...prev,
          channels: { ...(prev?.channels || {}), resume: updatedResume }
        }));
        if (isOwnProfile && updateAuthUser) {
          updateAuthUser({
            ...currentUser,
            channels: { ...(currentUser?.channels || {}), resume: updatedResume }
          });
        }
        if (onUserUpdated) {
          onUserUpdated({
            ...user,
            channels: { ...(user?.channels || {}), resume: updatedResume }
          });
        }
      }
    } catch (err) {
      console.error('Failed to upload resume:', err);
      const errMsg = err.response?.data?.message || 'Failed to upload resume.';
      setError(errMsg);
      enqueueSnackbar(errMsg, { variant: 'error' });
    } finally {
      setResumeUploading(false);
      if (resumeInputRef.current) {
        resumeInputRef.current.value = '';
      }
    }
  };

  const handleDeleteResume = async () => {
    if (!window.confirm('Are you sure you want to remove this resume? The uploaded file will be deleted permanently.')) {
      return;
    }

    try {
      setResumeDeleting(true);
      setError('');
      setSuccess('');

      const targetId = propUserId || id || currentUser?._id;
      const targetEndpoint = isOwnProfile ? '/users/profile/resume' : `/users/${targetId}/resume`;

      const res = await API.delete(targetEndpoint);

      if (res.data?.success) {
        const msg = 'Resume deleted successfully!';
        setSuccess(msg);
        enqueueSnackbar(msg, { variant: 'success' });
        const emptyResume = { url: '', publicId: '', filename: '', uploadedAt: null };
        setChannels((prev) => ({ ...prev, resume: emptyResume }));
        setUser((prev) => ({
          ...prev,
          channels: { ...(prev?.channels || {}), resume: emptyResume }
        }));
        if (isOwnProfile && updateAuthUser) {
          updateAuthUser({
            ...currentUser,
            channels: { ...(currentUser?.channels || {}), resume: emptyResume }
          });
        }
        if (onUserUpdated) {
          onUserUpdated({
            ...user,
            channels: { ...(user?.channels || {}), resume: emptyResume }
          });
        }
      }
    } catch (err) {
      console.error('Failed to remove resume:', err);
      const errMsg = err.response?.data?.message || 'Failed to remove resume.';
      setError(errMsg);
      enqueueSnackbar(errMsg, { variant: 'error' });
    } finally {
      setResumeDeleting(false);
    }
  };

  const handleCopyLink = async (text, label) => {
    if (!text) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      enqueueSnackbar(`${label || 'Link'} copied to clipboard!`, { variant: 'success' });
    } catch (err) {
      console.error('Failed to copy text:', err);
      enqueueSnackbar('Failed to copy to clipboard', { variant: 'error' });
    }
  };

  const startCamera = async (mode = facingMode) => {
    setCameraLoading(true);
    setCameraError('');
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera is not supported or not accessible on this device/browser.');
      }

      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (constraintErr) {
        console.warn('facingMode constraint failed, falling back to basic video:', constraintErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      setCameraStream(stream);
      setCameraLoading(false);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraLoading(false);
      let camErr = 'Could not access the camera. Please check permissions.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        camErr = 'Camera permission was denied. Please allow camera access in your browser site settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        camErr = 'No camera device found on this system.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        camErr = 'Camera is in use by another application. Please close other camera apps and retry.';
      } else if (err.message) {
        camErr = err.message;
      }
      setCameraError(camErr);
      enqueueSnackbar(camErr, { variant: 'error' });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const handleOpenCamera = () => {
    setPhotoMenuAnchor(null);
    setCameraOpen(true);
    setCapturedImage(null);
    setFacingMode('user');
    setCameraError('');
    setTimeout(() => {
      startCamera('user');
    }, 200);
  };

  const handleCloseCamera = () => {
    stopCamera();
    setCameraOpen(false);
    setCapturedImage(null);
    setCameraError('');
    setCameraLoading(false);
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

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
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
        enqueueSnackbar('Please enter Name, Relationship, or Address details first to generate translation.', {
          variant: 'info'
        });
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
        try {
          const googleUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=kn&q=${encodeURIComponent(textToTranslate)}`;
          const fbRes = await fetch(googleUrl);
          const fbData = await fbRes.json();
          translated = Array.isArray(fbData) ? (typeof fbData[0] === 'string' ? fbData.join('') : fbData[0]?.[0] || '') : '';
        } catch (e) {
          const mmUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|kn`;
          const mmRes = await fetch(mmUrl);
          const mmData = await mmRes.json();
          translated = mmData?.responseData?.translatedText || '';
        }
      }

      if (translated) {
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
        try {
          const googleUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=kn&tl=en&q=${encodeURIComponent(sanitizedText)}`;
          const fbRes = await fetch(googleUrl);
          const fbData = await fbRes.json();
          translated = Array.isArray(fbData) ? (typeof fbData[0] === 'string' ? fbData.join('') : fbData[0]?.[0] || '') : '';
        } catch (e) {
          const mmUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(sanitizedText)}&langpair=kn|en`;
          const mmRes = await fetch(mmUrl);
          const mmData = await mmRes.json();
          translated = mmData?.responseData?.translatedText || '';
        }
      }

      if (translated) {
        translated = kannadaToEnglishDigits(translated);
        const parsed = parseTranslatedEnglish(translated);

        let fieldsUpdated = [];
        let fieldsSkipped = [];

        if (parsed.name) {
          const hasName = Boolean(name && name.trim());
          if (!hasName) {
            setName(parsed.name);
            fieldsUpdated.push('Name');
          } else {
            fieldsSkipped.push('Name');
          }
        }

        if (parsed.relation?.relatedPersonName) {
          const hasRelation = Boolean(relation.relatedPersonName && relation.relatedPersonName.trim());
          if (!hasRelation) {
            setRelation((prev) => ({
              relationshipType: prev.relationshipType || parsed.relation.relationshipType || 'Other',
              relatedPersonName: parsed.relation.relatedPersonName
            }));
            fieldsUpdated.push('Relation');
          } else {
            fieldsSkipped.push('Relation');
          }
        }

        if (Object.keys(parsed.address).length > 0) {
          let addressFieldsAdded = [];
          setAddress((prev) => {
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
    const hasKannada = /[\u0C80-\u0CFF]/.test(val);
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

      setProfileSaving(true);

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
        employment: {
          ...employment,
          employmentStatus:
            employment?.employmentStatus && employment.employmentStatus.trim()
              ? employment.employmentStatus.trim()
              : undefined
        },
        privacySettings: privacySettings || {},
        relation: relation || {},
        channels: {
          ...channels,
          resume: (channels.resume?.url ? channels.resume : user?.channels?.resume) || undefined
        }
      };

      if (isAdmin && role) {
        payload.role = role;
      }

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
        payload.role = isAdmin && role ? role : user?.role || 'MEMBER';
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
      const targetEndpoint = isOwnProfile ? '/users/profile' : `/users/${targetId}`;
      const res = await API.patch(targetEndpoint, payload);
      if (res.data?.success) {
        const msg = 'Profile saved successfully!';
        setSuccess(msg);
        enqueueSnackbar(msg, { variant: 'success' });
        const updatedUser = res.data.data?.user || res.data.user || res.data.data;
        if (updatedUser) {
          setUser(updatedUser);
          if (updatedUser.channels) {
            setChannels((prev) => ({
              ...prev,
              ...(updatedUser.channels || {}),
              resume: updatedUser.channels.resume || prev.resume || { url: '', publicId: '', filename: '', uploadedAt: null }
            }));
          }
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
    } finally {
      setProfileSaving(false);
    }
  };

  const handleTransitionSubmit = async () => {
    try {
      setTransitionSubmitting(true);
      setError('');
      setSuccess('');

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
        setTransitionOpen(false);
      }
    } catch (err) {
      console.error('Alumni transition failed:', err);
      const transErr = err.response?.data?.message || 'Failed to transition to Alumni.';
      setError(transErr);
      enqueueSnackbar(transErr, { variant: 'error' });
    } finally {
      setTransitionSubmitting(false);
    }
  };

  if (loading) {
    return <ProfileSkeleton isDialog={isDialog} />;
  }

  if (error && !user) {
    return <Alert severity="error">{error}</Alert>;
  }

  const isStudent = user?.role === 'STUDENT';
  const isAlumni = user?.role === 'ALUMNI';
  const isStaffOrMemberOrWarden = ['STAFF', 'MEMBER', 'WARDEN', 'ADMIN', 'ADMINISTRATOR'].includes(user?.role);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{
          flexGrow: 1,
          maxWidth: 1200,
          mx: 'auto',
          p: isDialog ? { xs: 1.5, sm: 2.5 } : { xs: 1, sm: 2 },
          pb: { xs: '84px', md: isDialog ? 2.5 : 2 }
        }}
      >
        <Grid container spacing={{ xs: 2.5, sm: 3, md: 4 }}>
          {/* LEFT COLUMN: EDIT PROFILE FORM */}
          <Grid size={{ xs: 12, md: 8 }} sx={{ order: { xs: 2, md: 1 } }}>
            <Card sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: 'none', overflow: 'hidden' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                <Stack spacing={4}>
                  {/* 1. PERSONAL INFORMATION */}
                  <PersonalInformationSection
                    name={name}
                    setName={setName}
                    relation={relation}
                    setRelation={setRelation}
                    dob={dob}
                    setDob={setDob}
                    gender={gender}
                    setGender={setGender}
                    role={role}
                    setRole={setRole}
                    user={user}
                    isAdmin={isAdmin}
                    canEdit={canEdit}
                    isMobile={isMobile}
                    registrationNumber={registrationNumber}
                    setRegistrationNumber={setRegistrationNumber}
                    adhaar={adhaar}
                    setAdhaar={setAdhaar}
                    privacySettings={privacySettings}
                    setPrivacySettings={setPrivacySettings}
                    localLanguageDetails={localLanguageDetails}
                    handleKannadaInputChange={handleKannadaInputChange}
                    handleAutoMapFromKannada={handleAutoMapFromKannada}
                    handleAutoTranslateToKannada={handleAutoTranslateToKannada}
                    mappingFromKannada={mappingFromKannada}
                    translating={translating}
                    email={email}
                    setEmail={setEmail}
                    phone={phone}
                    setPhone={setPhone}
                    password={password}
                    setPassword={setPassword}
                    confirmPassword={confirmPassword}
                    setConfirmPassword={setConfirmPassword}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    showConfirmPassword={showConfirmPassword}
                    setShowConfirmPassword={setShowConfirmPassword}
                    address={address}
                  />

                  {/* 2. EDUCATION HISTORY */}
                  <EducationSection
                    education={education}
                    handleEducationChange={handleEducationChange}
                    canEdit={canEdit}
                    isStudent={isStudent}
                  />

                  {/* 3. CHANNELS & PORTFOLIO */}
                  <ChannelsSection
                    channels={channels}
                    setChannels={setChannels}
                    canEdit={canEdit}
                    handleCopyLink={handleCopyLink}
                    resumeUploading={resumeUploading}
                    resumeDeleting={resumeDeleting}
                    handleResumeUpload={handleResumeUpload}
                    handleDeleteResume={handleDeleteResume}
                    resumeInputRef={resumeInputRef}
                  />

                  {/* 4. EMPLOYMENT & CAREER */}
                  <EmploymentSection
                    employment={employment}
                    handleEmploymentChange={handleEmploymentChange}
                    canEdit={canEdit}
                    isAlumni={isAlumni}
                    isStaffOrMemberOrWarden={isStaffOrMemberOrWarden}
                  />

                  {/* 5. ADDRESS CONFIGURATION */}
                  <AddressSection
                    address={address}
                    handleAddressChange={handleAddressChange}
                    canEdit={canEdit}
                  />

                  {/* Save Changes Action Bar */}
                  {canEdit && (
                    <Box
                      sx={{
                        position: { xs: 'fixed', md: 'static' },
                        bottom: { xs: 0, md: 'auto' },
                        left: { xs: 0, md: 'auto' },
                        right: { xs: 0, md: 'auto' },
                        zIndex: { xs: 1100, md: 'auto' },
                        bgcolor: { xs: 'rgba(255, 255, 255, 0.95)', md: 'transparent' },
                        backdropFilter: { xs: 'blur(10px)', md: 'none' },
                        borderTop: { xs: '1px solid #E2E8F0', md: 'none' },
                        p: { xs: '12px 16px', md: 0 },
                        mt: { xs: 0, md: 1 },
                        boxShadow: { xs: '0 -4px 16px rgba(0, 0, 0, 0.06)', md: 'none' },
                        display: 'flex',
                        justifyContent: { xs: 'stretch', md: 'flex-end' }
                      }}
                    >
                      <Button
                        variant="contained"
                        onClick={handleProfileSave}
                        disabled={profileSaving}
                        startIcon={profileSaving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : null}
                        fullWidth
                        sx={{
                          width: { xs: '100%', md: 'auto' },
                          bgcolor: '#0088ff',
                          color: '#ffffff',
                          borderRadius: '10px',
                          textTransform: 'none',
                          fontWeight: 700,
                          px: 4,
                          py: 1.25,
                          boxShadow: 'none',
                          '&:hover': { bgcolor: '#0077EE', boxShadow: 'none' },
                          '&.Mui-disabled': { bgcolor: '#93C5FD', color: '#ffffff' }
                        }}
                      >
                        {profileSaving
                          ? isCreate ? 'Adding Member...' : 'Saving Changes...'
                          : isCreate ? 'Add Member' : 'Save Changes'}
                      </Button>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* RIGHT COLUMN: LIVE PREVIEW SIDEBAR */}
          <Grid
            size={{ xs: 12, md: 4 }}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              order: { xs: 1, md: 2 }
            }}
          >
            <ProfileSummaryCard
              user={user}
              name={name}
              canEdit={canEdit}
              isDialog={isDialog}
              photoUploading={photoUploading}
              setPhotoMenuAnchor={setPhotoMenuAnchor}
              registrationNumber={registrationNumber}
              relation={relation}
              dob={dob}
              privacySettings={privacySettings}
              isAuthorizedViewer={isAuthorizedViewer}
              adhaar={adhaar}
              phone={phone}
              email={email}
              education={education}
              employment={employment}
              address={address}
              localLanguageDetails={localLanguageDetails}
            />

            {/* Photo Selection Context Menu */}
            <Menu
              anchorEl={photoMenuAnchor}
              open={Boolean(photoMenuAnchor)}
              onClose={() => setPhotoMenuAnchor(null)}
              disableScrollLock
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{
                sx: {
                  borderRadius: '12px',
                  mt: 1,
                  p: 0.5,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  border: '1px solid #E2E8F0',
                  minWidth: 190
                }
              }}
            >
              <MenuItem
                onClick={() => {
                  setPhotoMenuAnchor(null);
                  document.getElementById('icon-button-file-hidden')?.click();
                }}
                sx={{ borderRadius: '8px', py: 1, fontSize: 14, fontWeight: 600, color: '#334155', gap: 1.5 }}
              >
                <CloudUploadIcon sx={{ fontSize: 20, color: '#0088ff' }} />
                Update Profile Photo
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setPhotoMenuAnchor(null);
                  handleOpenCamera();
                }}
                sx={{ borderRadius: '8px', py: 1, fontSize: 14, fontWeight: 600, color: '#334155', gap: 1.5 }}
              >
                <CameraIcon sx={{ fontSize: 20, color: '#10B981' }} />
                Take Profile Photo
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setPhotoMenuAnchor(null);
                  setViewPhotoOpen(true);
                }}
                sx={{ borderRadius: '8px', py: 1, fontSize: 14, fontWeight: 600, color: '#334155', gap: 1.5 }}
              >
                <VisibilityIcon sx={{ fontSize: 20, color: '#6366F1' }} />
                View Profile Preview
              </MenuItem>
            </Menu>

            {/* Hidden Input for Profile Photo Upload */}
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="icon-button-file-hidden"
              type="file"
              onChange={handlePhotoUpload}
            />
          </Grid>
        </Grid>

        {/* STUDENT TRANSITION DIALOG */}
        <StudentTransitionDialog
          open={transitionOpen}
          onClose={() => setTransitionOpen(false)}
          gradYear={gradYear}
          setGradYear={setGradYear}
          transEmpStatus={transEmpStatus}
          setTransEmpStatus={setTransEmpStatus}
          transOccupation={transOccupation}
          setTransOccupation={setTransOccupation}
          transCompany={transCompany}
          setTransCompany={setTransCompany}
          transitionSubmitting={transitionSubmitting}
          handleTransitionSubmit={handleTransitionSubmit}
        />

        {/* WEBRTC CAMERA DIALOG */}
        <CameraCaptureDialog
          open={cameraOpen}
          onClose={handleCloseCamera}
          cameraError={cameraError}
          cameraLoading={cameraLoading}
          cameraStream={cameraStream}
          facingMode={facingMode}
          capturedImage={capturedImage}
          startCamera={startCamera}
          toggleCameraFacingMode={toggleCameraFacingMode}
          capturePhoto={capturePhoto}
          retakePhoto={retakePhoto}
          uploadCapturedPhoto={uploadCapturedPhoto}
          photoUploading={photoUploading}
          handlePhotoUpload={handlePhotoUpload}
          videoRef={videoRef}
          canvasRef={canvasRef}
        />

        {/* PHOTO OPTIONS SELECTION POPUP DIALOG */}
        <PhotoSelectionDialog
          open={photoDialogOpen}
          onClose={() => setPhotoDialogOpen(false)}
          onUploadClick={() => document.getElementById('icon-button-file-hidden')?.click()}
          onCameraClick={() => setTimeout(() => handleOpenCamera(), 200)}
          onPreviewClick={() => setViewPhotoOpen(true)}
        />

        {/* ENLARGED PHOTO PREVIEW DIALOG */}
        <PhotoPreviewDialog
          open={viewPhotoOpen}
          onClose={() => setViewPhotoOpen(false)}
          user={user}
          name={name}
          canEdit={canEdit}
          onChangePhotoClick={() => setPhotoDialogOpen(true)}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default Profile;
