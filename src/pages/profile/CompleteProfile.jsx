import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  Container,
  CircularProgress
} from '@mui/material';

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

const CompleteProfile = () => {
  const { user, updateUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Basic Information
  const [gender, setGender] = useState('MALE');
  const [adhaar, setAdhaar] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [localLanguageDetails, setLocalLanguageDetails] = useState('');

  // Address
  const [address, setAddress] = useState({
    street: '', area: '', landmark: '', location: '', city: '', district: '', taluk: '', pincode: ''
  });

  // Student/Alumni specific fields
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [endYear, setEndYear] = useState('');

  // Alumni/Agent/Staff/Member specific fields
  const [occupation, setOccupation] = useState('');
  const [organization, setOrganization] = useState('');
  const [industry, setIndustry] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('Employed');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');

  const handleAddressChange = (field, value) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

  
    if (localLanguageDetails) {
      const words = localLanguageDetails.trim().split(/\s+/).filter(Boolean);
      if (words.length < 15 || words.length > 20) {
        const valMsg = `Kannada Overview must be exactly between 15 and 20 words (currently ${words.length} words).`;
        setError(valMsg);
        enqueueSnackbar(valMsg, { variant: 'warning' });
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        gender,
        adhaar: adhaar || undefined,
        registrationNumber: user?.role !== 'STUDENT' ? registrationNumber : undefined,
        localLanguageDetails,
        address,
        education: ['STUDENT', 'ALUMNI'].includes(user?.role)
          ? {
              college,
              course,
              startMonth: startMonth ? Number(startMonth) : undefined,
              startYear: startYear ? Number(startYear) : undefined,
              endMonth: endMonth ? Number(endMonth) : undefined,
              endYear: endYear ? Number(endYear) : undefined
            }
          : undefined,
        employment: ['ALUMNI', 'MEMBER', 'STAFF', 'WARDEN', 'ADMIN'].includes(user?.role)
          ? {
              occupation,
              organization,
              industry,
              workLocation,
              employmentStatus: user?.role === 'ALUMNI' ? employmentStatus : undefined,
              businessName: user?.role === 'ALUMNI' && ['Business Owner', 'Entrepreneur', 'Self-Employed'].includes(employmentStatus) ? businessName : undefined,
              businessType: user?.role === 'ALUMNI' && ['Business Owner', 'Entrepreneur', 'Self-Employed'].includes(employmentStatus) ? businessType : undefined
            }
          : undefined
      };

      const res = await API.patch('/users/profile', payload);
      setLoading(false);

      if (res.data?.success) {
        enqueueSnackbar('Profile completed successfully!', { variant: 'success' });
        // Update user context
        updateUser(res.data.data.user);
        navigate('/profile');
      }
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Failed to complete profile. Please try again.';
      setError(errMsg);
      enqueueSnackbar(errMsg, { variant: 'error' });
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', py: 6, backgroundColor: 'transparent' }}>
      <Container maxWidth="md">
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: '#0088ff' }}>
                Complete Your Profile
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Fill in details to finalize registration as a <strong style={{ color: '#0088ff' }}>{user?.role}</strong>
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {/* SECTION 1: PERSONAL */}
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#0088ff' }}>
                Personal Information
              </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={user?.role !== 'STUDENT' ? 6 : 12}>
                  <FormControl fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <Select value={gender} label="Gender" onChange={(e) => setGender(e.target.value)}>
                      <MenuItem value="MALE">Male</MenuItem>
                      <MenuItem value="FEMALE">Female</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                      <MenuItem value="PREFER_NOT_TO_SAY">Prefer Not To Say</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {user?.role !== 'STUDENT' && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Registration Number"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="Enter registration number"
                      required
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Aadhaar Number (12 Digits)"
                    value={adhaar}
                    onChange={(e) => setAdhaar(e.target.value)}
                    placeholder="XXXX XXXX XXXX"
                    inputProps={{ maxLength: 14 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Local / Native Language Details (15 to 20 words)"
                    value={localLanguageDetails}
                    onChange={(e) => setLocalLanguageDetails(e.target.value)}
                    placeholder="Enter details in Hindi, Kannada, Tamil, or any other regional language..."
                    helperText="Must be exactly 15 to 20 words containing the same info in regional language"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ mb: 4 }} />

              {/* SECTION 2: ROLE-SPECIFIC FIELDS */}
              {['STUDENT', 'ALUMNI'].includes(user?.role) && (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#0088ff' }}>
                    Education Details
                  </Typography>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="College / Institution" value={college} onChange={(e) => setCollege(e.target.value)} placeholder=".... College of ...." />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Course / Program" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="CSE / MBA / BCA" />
                    </Grid>
                    
                    {/* Education Start Month/Year */}
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth>
                        <InputLabel>Start Month</InputLabel>
                        <Select value={startMonth} label="Start Month" onChange={(e) => setStartMonth(e.target.value)}>
                          {months.map((m) => (
                            <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField fullWidth label="Start Year" type="number" value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="YYYY" />
                    </Grid>

                    {/* Education End Month/Year */}
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth>
                        <InputLabel>End Month</InputLabel>
                        <Select value={endMonth} label="End Month" onChange={(e) => setEndMonth(e.target.value)}>
                          {months.map((m) => (
                            <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField fullWidth label="Graduation Year" type="number" value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="YYYY" />
                    </Grid>
                  </Grid>
                  <Divider sx={{ mb: 4 }} />
                </>
              )}

              {['ALUMNI', 'MEMBER', 'STAFF', 'WARDEN', 'ADMIN'].includes(user?.role) && (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#0088ff' }}>
                    Occupation & Professional Career
                  </Typography>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                     <Grid item xs={12} sm={6}>
                       <TextField fullWidth label="Occupation / Title" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="e.g. Software Engineer, Doctor" />
                     </Grid>
                     <Grid item xs={12} sm={6}>
                       <TextField fullWidth label="Organization / Company" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="e.g. Google, TechCorp" />
                     </Grid>

                     {user?.role === 'ALUMNI' && (
                       <>
                         <Grid item xs={12} sm={6}>
                           <FormControl fullWidth>
                             <InputLabel>Employment</InputLabel>
                             <Select value={employmentStatus} label="Employment" onChange={(e) => setEmploymentStatus(e.target.value)}>
                               <MenuItem value="Intern">Intern</MenuItem>
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
                         <Grid item xs={12} sm={6}>
                           <TextField fullWidth label="Work Location" value={workLocation} onChange={(e) => setWorkLocation(e.target.value)} placeholder="e.g. Bengaluru, India" />
                         </Grid>

                         {['Business Owner', 'Entrepreneur'].includes(employmentStatus) && (
                           <>
                             <Grid item xs={12} sm={6}>
                               <TextField fullWidth label="Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Apex Consulting" />
                             </Grid>
                             <Grid item xs={12} sm={6}>
                               <TextField fullWidth label="Business Type" value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="e.g. LLC, Startup" />
                             </Grid>
                           </>
                         )}
                       </>
                     )}
                   </Grid>
                  <Divider sx={{ mb: 4 }} />
                </>
              )}

              {/* SECTION 3: ADDRESS */}
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#0088ff' }}>
                Address Setup
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Street" value={address.street} onChange={(e) => handleAddressChange('street', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Area" value={address.area} onChange={(e) => handleAddressChange('area', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Landmark" value={address.landmark} onChange={(e) => handleAddressChange('landmark', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Location / City / Landmark" value={address.location} onChange={(e) => handleAddressChange('location', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="City" value={address.city} onChange={(e) => handleAddressChange('city', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="District" value={address.district} onChange={(e) => handleAddressChange('district', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Taluk" value={address.taluk} onChange={(e) => handleAddressChange('taluk', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Pincode" value={address.pincode} onChange={(e) => handleAddressChange('pincode', e.target.value)} />
                </Grid>
              </Grid>

              <Button
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ py: 1.5, textTransform: 'none', fontWeight: 700 }}
              >
                {loading ? 'Saving Profile...' : 'Save and Enter Portal'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default CompleteProfile;
