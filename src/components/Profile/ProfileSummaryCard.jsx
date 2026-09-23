import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Avatar,
  IconButton,
  CircularProgress,
  Stack,
  Typography,
  Chip,
  Tooltip
} from '@mui/material';
import {
  PhotoCamera as CameraIcon,
  Lock as LockIcon,
  Badge as BadgeIcon,
  Person as PersonIcon,
  Cake as CakeIcon,
  Fingerprint as FingerprintIcon,
  LocalPhone as PhoneIcon,
  Email as EmailIcon,
  School as EducationIcon,
  Work as WorkIcon,
  LocationOn as PlaceIcon,
  Language as WebIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { kannadaToEnglishDigits, months } from './profileHelpers';

export default function ProfileSummaryCard({
  user,
  name,
  canEdit,
  isDialog,
  photoUploading,
  setPhotoMenuAnchor,
  registrationNumber,
  relation,
  dob,
  privacySettings,
  isAuthorizedViewer,
  adhaar,
  phone,
  email,
  education,
  employment,
  address,
  localLanguageDetails
}) {
  return (
    <Box
      sx={{
        position: { md: 'sticky' },
        top: { md: isDialog ? 0 : 84 },
        zIndex: 10,
        width: '100%'
      }}
    >
      <Card
        sx={{
          width: '100%',
          borderRadius: '16px',
          bgcolor: '#ffffff',
          border: '1px solid #EAECF0',
          boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
          maxHeight: { md: isDialog ? 'calc(85vh - 40px)' : 'calc(100vh - 104px)' },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <CardContent
          sx={{
            p: { xs: 2, sm: 2.5, md: 3 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflowY: 'auto',
            flexGrow: 1,
            minHeight: 0,
            '&::-webkit-scrollbar': { width: 5 },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 4 },
            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
            '&:last-child': { pb: 3 }
          }}
        >
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
              onClick={(e) => {
                if (canEdit) setPhotoMenuAnchor(e.currentTarget);
              }}
            >
              {(user?.name || name)?.charAt(0)}
            </Avatar>
            {canEdit && (
              <Box sx={{ position: 'absolute', bottom: -2, right: -2 }}>
                <IconButton
                  size="small"
                  onClick={(e) => setPhotoMenuAnchor(e.currentTarget)}
                  disabled={photoUploading}
                  sx={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #EAECF0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    p: '5px',
                    '&:hover': { backgroundColor: '#0088ff', color: '#fff' }
                  }}
                >
                  {photoUploading ? (
                    <CircularProgress size={16} />
                  ) : (
                    <CameraIcon sx={{ fontSize: 16, color: '#64748B' }} />
                  )}
                </IconButton>
              </Box>
            )}
          </Box>

          <Stack spacing={2} sx={{ width: '100%' }}>
            {/* Registration Number */}
            {(registrationNumber || user?.registrationNumber || user?.role !== 'STUDENT') && (
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
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
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
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
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <CakeIcon sx={{ color: '#64748B', fontSize: 20 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: 12, fontWeight: 500, lineHeight: 1.1 }}>
                    Date of Birth
                  </Typography>
                  {privacySettings.maskDob && (
                    <Tooltip title="Hidden in directory and profile views.">
                      <Chip
                        size="small"
                        icon={<LockIcon color="#fff" sx={{ fontSize: '11px !important', borderRadius: '10px' }} />}
                        label="Hidden"
                        sx={{ height: 18, fontSize: 10, bgcolor: '#0088ff', color: '#fff', fontWeight: 700 }}
                      />
                    </Tooltip>
                  )}
                </Box>
                <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>
                  {isAuthorizedViewer
                    ? dob || user?.dob || user?.dateOfBirth
                      ? dayjs(dob || user?.dob || user?.dateOfBirth).isValid()
                        ? dayjs(dob || user?.dob || user?.dateOfBirth).format('DD MMM YYYY')
                        : dob || user?.dob || user?.dateOfBirth
                      : 'Not Provided'
                    : privacySettings.maskDob || user?.isDobMasked
                    ? '••••••••••'
                    : dob || user?.dob || user?.dateOfBirth
                    ? dayjs(dob || user?.dob || user?.dateOfBirth).isValid()
                      ? dayjs(dob || user?.dob || user?.dateOfBirth).format('DD MMM YYYY')
                      : dob || user?.dob || user?.dateOfBirth
                    : 'Not Provided'}
                </Typography>
              </Box>
            </Stack>

            {/* Adhaar Number */}
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <FingerprintIcon sx={{ color: '#64748B', fontSize: 20 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: 12, fontWeight: 500, lineHeight: 1.1 }}>
                    Adhaar No.
                  </Typography>
                  {privacySettings.maskAdhaar && (
                    <Tooltip title="Hidden in the users directory table.">
                      <Chip
                        size="small"
                        icon={<LockIcon color="#fff" sx={{ fontSize: '11px !important', borderRadius: '10px' }} />}
                        label="Hidden"
                        sx={{ height: 18, fontSize: 10, bgcolor: '#0088ff', color: '#fff', fontWeight: 700 }}
                      />
                    </Tooltip>
                  )}
                </Box>
                <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>
                  {isAuthorizedViewer
                    ? adhaar || user?.adhaar || 'Not Provided'
                    : privacySettings.maskAdhaar || user?.isAdhaarMasked
                    ? '•••• •••• ••••'
                    : adhaar || user?.adhaar || 'Not Provided'}
                </Typography>
              </Box>
            </Stack>

            {/* Phone */}
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <PhoneIcon sx={{ color: '#64748B', fontSize: 20 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: 12, fontWeight: 500, lineHeight: 1.1 }}>
                    Phone
                  </Typography>
                  {privacySettings.maskPhone && (
                    <Tooltip title="Hidden in the users directory table.">
                      <Chip
                        size="small"
                        icon={<LockIcon color="#fff" sx={{ fontSize: '11px !important', borderRadius: '10px' }} />}
                        label="Hidden"
                        sx={{ height: 18, fontSize: 10, bgcolor: '#0088ff', color: '#fff', fontWeight: 700 }}
                      />
                    </Tooltip>
                  )}
                </Box>
                <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                  {isAuthorizedViewer
                    ? phone || 'Not Provided'
                    : privacySettings.maskPhone || user?.isPhoneMasked
                    ? '••••••••••'
                    : phone || 'Not Provided'}
                </Typography>
              </Box>
            </Stack>

            {/* Email */}
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <EmailIcon sx={{ color: '#64748B', fontSize: 20 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: 12, fontWeight: 500, lineHeight: 1.1 }}>
                    Email
                  </Typography>
                  {privacySettings.maskEmail && (
                    <Tooltip title="Hidden in the users directory table.">
                      <Chip
                        size="small"
                        icon={<LockIcon color="#fff" sx={{ fontSize: '11px !important', borderRadius: '10px' }} />}
                        label="Hidden"
                        sx={{ height: 18, fontSize: 10, bgcolor: '#0088ff', color: '#fff', fontWeight: 700 }}
                      />
                    </Tooltip>
                  )}
                </Box>
                <Typography variant="body2" sx={{ wordBreak: 'break-all', color: '#334155' }}>
                  {isAuthorizedViewer
                    ? email || 'Not Provided'
                    : privacySettings.maskEmail || user?.isEmailMasked
                    ? '••••••••••••'
                    : email || 'Not Provided'}
                </Typography>
              </Box>
            </Stack>

            {/* Education History */}
            <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
              <EducationIcon sx={{ color: '#64748B', fontSize: 20, mt: 0.25 }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: 12, fontWeight: 500, lineHeight: 1.1 }}>
                  Education
                </Typography>
                {!education.college && !education.course ? (
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    Not Provided
                  </Typography>
                ) : (
                  <>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {education.college || 'College: Not Provided'}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.25 }}>
                      {education.course || 'Course: Not Provided'}
                    </Typography>
                    {(education.startYear || education.endYear) && (
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.25 }}>
                        {education.startMonth
                          ? `${months.find((m) => m.value === education.startMonth)?.label || education.startMonth} `
                          : ''}
                        {education.startYear || '-'} -{' '}
                        {education.endMonth
                          ? `${months.find((m) => m.value === education.endMonth)?.label || education.endMonth} `
                          : ''}
                        {education.endYear || '-'}
                      </Typography>
                    )}
                  </>
                )}
              </Box>
            </Stack>

            {/* Employment Details */}
            <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
              <WorkIcon sx={{ color: '#64748B', fontSize: 20, mt: 0.25 }} />
              <Box>
                {!employment.occupation && !employment.organization && !employment.employmentStatus ? (
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    Not Provided
                  </Typography>
                ) : (
                  <>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {employment.occupation || 'Occupation'}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.25 }}>
                      {employment.organization || 'Not Provided'}
                    </Typography>
                  </>
                )}
              </Box>
            </Stack>

            {/* Address */}
            <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
              <PlaceIcon sx={{ color: '#64748B', fontSize: 20, mt: 0.25, flexShrink: 0 }} />
              <Typography
                variant="body2"
                sx={{
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  flexGrow: 1,
                  minWidth: 0,
                  color: '#334155'
                }}
              >
                {[
                  address.street,
                  address.area,
                  address.landmark,
                  address.location,
                  address.city,
                  address.district,
                  address.taluk,
                  address.pincode ? kannadaToEnglishDigits(address.pincode) : ''
                ]
                  .filter(Boolean)
                  .join(', ') || 'Not Provided'}
              </Typography>
            </Stack>

            {/* Local Details (Kannada) */}
            {(localLanguageDetails || user?.localLanguageDetails) && (
              <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                <WebIcon sx={{ fontSize: 20, mt: 0.25, color: '#64748B', flexShrink: 0 }} />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ display: 'block', fontSize: 12, fontWeight: 600, lineHeight: 1.1, color: '#94A3B8' }}>
                    ಕನ್ನಡ ವಿವರ (Kannada)
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#1E293B',
                      fontWeight: 500,
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere'
                    }}
                  >
                    {kannadaToEnglishDigits(localLanguageDetails || user?.localLanguageDetails)}
                  </Typography>
                </Box>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
