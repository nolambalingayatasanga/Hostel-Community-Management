import React from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Switch,
  Tooltip,
  FormControlLabel,
  Stack,
  Button,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import {
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  VisibilityOff as MaskIcon,
  Translate as TranslateIcon
} from '@mui/icons-material';

export default function PersonalInformationSection({
  name,
  setName,
  relation,
  setRelation,
  dob,
  setDob,
  gender,
  setGender,
  role,
  setRole,
  user,
  isAdmin,
  canEdit,
  isMobile,
  registrationNumber,
  setRegistrationNumber,
  adhaar,
  setAdhaar,
  privacySettings,
  setPrivacySettings,
  localLanguageDetails,
  handleKannadaInputChange,
  handleAutoMapFromKannada,
  handleAutoTranslateToKannada,
  mappingFromKannada,
  translating,
  email,
  setEmail,
  phone,
  setPhone,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  address
}) {
  return (
    <Box>
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 700,
          color: '#1E293B',
          mb: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <PersonIcon sx={{ color: '#0088ff', fontSize: 20 }} /> Personal Information
      </Typography>

      <Grid container spacing={2.5}>
        {/* Full Name */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            Full Name
          </Typography>
          <TextField
            fullWidth
            size="small"
            disabled={!canEdit}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter full name"
          />
        </Grid>

        {/* Relative Name (Merged with Relationship dropdown) */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            Relative Name
          </Typography>
          <Box sx={{ display: 'flex', width: '100%' }}>
            <FormControl sx={{ width: '110px', flexShrink: 0 }}>
              <Select
                size="small"
                disabled={!canEdit}
                value={relation.relationshipType || 'Father'}
                onChange={(e) => setRelation((prev) => ({ ...prev, relationshipType: e.target.value }))}
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
              disabled={!canEdit}
              value={relation.relatedPersonName || ''}
              onChange={(e) => setRelation((prev) => ({ ...prev, relatedPersonName: e.target.value }))}
              placeholder={
                relation.relationshipType
                  ? `Enter ${relation.relationshipType.toLowerCase()} name`
                  : 'Enter relative name'
              }
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
              Date of Birth
            </Typography>
            {canEdit && (
              <Tooltip title="When hidden, your date of birth is hidden in directory and profile views.">
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={Boolean(privacySettings.maskDob)}
                      onChange={(e) =>
                        setPrivacySettings((prev) => ({ ...prev, maskDob: e.target.checked }))
                      }
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#0088ff' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#0088ff'
                        }
                      }}
                    />
                  }
                  label={
                    <Typography
                      variant="caption"
                      sx={{
                        color: privacySettings.maskDob ? '#0088ff' : '#64748B',
                        fontWeight: 600,
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      <MaskIcon sx={{ fontSize: 13 }} /> Hide
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              </Tooltip>
            )}
          </Box>
          <DatePicker
            format="DD/MM/YYYY"
            maxDate={dayjs()}
            disabled={!canEdit}
            value={dob ? dayjs(dob) : null}
            onChange={(newValue) => {
              if (!newValue) {
                setDob('');
              } else if (newValue.isValid()) {
                setDob(newValue.format('YYYY-MM-DD'));
              }
            }}
            slotProps={{
              textField: {
                fullWidth: true,
                size: 'small',
                disabled: !canEdit,
                placeholder: 'DD/MM/YYYY'
              },
              dialog: {
                disableScrollLock: true
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
              disabled={!canEdit}
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

        {/* Role (Admin only) */}
        {isAdmin && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
              Role
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={role || 'MEMBER'}
                onChange={(e) => setRole(e.target.value)}
                disabled={!canEdit}
                MenuProps={{ disableScrollLock: true }}
              >
                {['ADMINISTRATOR', 'ADMIN', 'WARDEN', 'MEMBER', 'STAFF', 'STUDENT', 'ALUMNI'].map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Reg No. */}
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

        {/* Adhaar */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
              Adhaar Number
            </Typography>
            {canEdit && (
              <Tooltip title="When hidden, your Aadhaar is hidden in the users directory table.">
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={Boolean(privacySettings.maskAdhaar)}
                      onChange={(e) =>
                        setPrivacySettings((prev) => ({ ...prev, maskAdhaar: e.target.checked }))
                      }
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#0088ff' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#0088ff'
                        }
                      }}
                    />
                  }
                  label={
                    <Typography
                      variant="caption"
                      sx={{
                        color: privacySettings.maskAdhaar ? '#0088ff' : '#64748B',
                        fontWeight: 600,
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      <MaskIcon sx={{ fontSize: 13 }} /> Hide
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              </Tooltip>
            )}
          </Box>
          <TextField
            fullWidth
            size="small"
            disabled={!canEdit}
            value={adhaar}
            onChange={(e) => setAdhaar(e.target.value)}
            placeholder="XXXX XXXX XXXX"
            inputProps={{ maxLength: 14 }}
          />
        </Grid>

        {/* Kannada Native Details & Translation */}
        <Grid size={{ xs: 12 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 0.75,
              flexWrap: 'wrap',
              gap: 1
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
              Kannada Overview
            </Typography>
            {canEdit && (
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
                <Button
                  size="small"
                  onClick={() => handleAutoMapFromKannada(localLanguageDetails, false)}
                  disabled={mappingFromKannada || !localLanguageDetails.trim()}
                  startIcon={
                    mappingFromKannada ? (
                      <CircularProgress size={14} sx={{ color: '#059669' }} />
                    ) : (
                      <TranslateIcon sx={{ fontSize: 15 }} />
                    )
                  }
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
                  startIcon={
                    translating ? (
                      <CircularProgress size={14} sx={{ color: '#0088ff' }} />
                    ) : (
                      <TranslateIcon sx={{ fontSize: 15 }} />
                    )
                  }
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
            )}
          </Box>
          <TextField
            fullWidth
            multiline
            rows={isMobile ? 5 : 3}
            size="small"
            disabled={!canEdit}
            value={localLanguageDetails}
            onChange={(e) => handleKannadaInputChange(e.target.value)}
            onBlur={() => {
              if (!canEdit) return;
              if (localLanguageDetails.trim() && /[\u0C80-\u0CFF]/.test(localLanguageDetails)) {
                if (!name.trim() || !address?.city?.trim()) {
                  handleAutoMapFromKannada(localLanguageDetails, true);
                }
              }
            }}
            placeholder="ವಿವರಗಳನ್ನು ಕನ್ನಡದಲ್ಲಿ ನಮೂದಿಸಿ (ಉದಾ: ಮದನ್, ರಮೇಶ್ ಅವರ ಮಗ, ಬೆಂಗಳೂರು, 560001)..."
          />
        </Grid>

        {/* Email Address */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
              Email Address
            </Typography>
            {canEdit && (
              <Tooltip title="When hidden, your email is hidden in the users directory table.">
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={Boolean(privacySettings.maskEmail)}
                      onChange={(e) =>
                        setPrivacySettings((prev) => ({ ...prev, maskEmail: e.target.checked }))
                      }
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#0088ff' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#0088ff'
                        }
                      }}
                    />
                  }
                  label={
                    <Typography
                      variant="caption"
                      sx={{
                        color: privacySettings.maskEmail ? '#0088ff' : '#64748B',
                        fontWeight: 600,
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      <MaskIcon sx={{ fontSize: 13 }} /> Hide
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              </Tooltip>
            )}
          </Box>
          <TextField
            fullWidth
            size="small"
            type="email"
            disabled={!canEdit}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                backgroundColor: '#F8FAFC'
              }
            }}
          />
        </Grid>

        {/* Phone Number */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
              Phone Number
            </Typography>
            {canEdit && (
              <Tooltip title="When hidden, your phone number is hidden in the users directory table.">
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={Boolean(privacySettings.maskPhone)}
                      onChange={(e) =>
                        setPrivacySettings((prev) => ({ ...prev, maskPhone: e.target.checked }))
                      }
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#0088ff' },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#0088ff'
                        }
                      }}
                    />
                  }
                  label={
                    <Typography
                      variant="caption"
                      sx={{
                        color: privacySettings.maskPhone ? '#0088ff' : '#64748B',
                        fontWeight: 600,
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      <MaskIcon sx={{ fontSize: 13 }} /> Hide
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              </Tooltip>
            )}
          </Box>
          <TextField
            fullWidth
            size="small"
            disabled={!canEdit}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Grid>

        {/* Password Fields */}
        {canEdit && (
          <>
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
                          onClick={() => setShowPassword((prev) => !prev)}
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
                helperText={
                  password && confirmPassword && password !== confirmPassword
                    ? 'Passwords do not match'
                    : ''
                }
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          type="button"
                          size="small"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
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
              />
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
}
