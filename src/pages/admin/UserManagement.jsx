import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';
import UserDirectory from '../../components/UserDirectory';
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
  IconButton,
  Alert,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  PersonAdd as AddIcon
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

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const action = searchParams.get('action'); // new, edit, or null
  const userId = searchParams.get('id');

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Form State
  const [role, setRole] = useState('STUDENT');
  const [status, setStatus] = useState('ACTIVE');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(''); // Only for new user
  const [gender, setGender] = useState('MALE');
  const [adhaar, setAdhaar] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [localLanguageDetails, setLocalLanguageDetails] = useState('');

  // Address
  const [address, setAddress] = useState({
    street: '', area: '', landmark: '', location: '', city: '', district: '', taluk: '', pincode: ''
  });

  // Education (Student/Alumni)
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [endYear, setEndYear] = useState('');

  // Employment (Alumni/Staff/Agents/Members/Admin)
  const [occupation, setOccupation] = useState('');
  const [organization, setOrganization] = useState('');
  const [industry, setIndustry] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('Employed');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');

  // Fetch user if editing
  useEffect(() => {
    if (action === 'edit' && userId) {
      const fetchUserData = async () => {
        try {
          setLoading(true);
          const res = await API.get(`/users/${userId}`);
          if (res.data?.success) {
            const u = res.data.data.user;

            // Security check: WARDENs cannot edit ADMINs or other WARDENs
            if (currentUser?.role === 'WARDEN' && ['ADMIN', 'WARDEN'].includes(u.role)) {
              const permErr = 'Wardens do not have permission to edit Admin or Warden accounts.';
              setFormError(permErr);
              enqueueSnackbar(permErr, { variant: 'error' });
              setLoading(false);
              return;
            }

            const rawAccountStatus = u?.accountStatus || u?.status;
            const resolvedAccountStatus = typeof rawAccountStatus === 'string'
              ? rawAccountStatus.toUpperCase().trim()
              : (typeof rawAccountStatus?.name === 'string'
                ? rawAccountStatus.name.toUpperCase().trim()
                : '');
            setRole(u.role);
            setStatus(
              ['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(resolvedAccountStatus)
                ? resolvedAccountStatus
                : 'ACTIVE'
            );
            setName(u.name || '');
            setEmail(u.email || '');
            setPhone(u.phone || '');
            setGender(u.gender || 'MALE');
            setAdhaar(u.adhaar || '');
            setRegistrationNumber(u.registrationNumber || '');
            setLocalLanguageDetails(u.localLanguageDetails || '');

            setAddress(u.address || {
              street: '', area: '', landmark: '', location: '', city: '', district: '', taluk: '', pincode: ''
            });

            setCollege(u.education?.college || '');
            setCourse(u.education?.course || '');
            setStartMonth(u.education?.startMonth || '');
            setStartYear(u.education?.startYear || '');
            setEndMonth(u.education?.endMonth || '');
            setEndYear(u.education?.endYear || '');

            setOccupation(u.employment?.occupation || '');
            setOrganization(u.employment?.organization || '');
            setIndustry(u.employment?.industry || '');
            setWorkLocation(u.employment?.workLocation || '');
            setEmploymentStatus(u.employment?.employmentStatus || 'Employed');
            setBusinessName(u.employment?.businessName || '');
            setBusinessType(u.employment?.businessType || '');
          }
          setLoading(false);
        } catch (err) {
          console.error(err);
          const fetchErr = 'Failed to fetch user data for editing.';
          setFormError(fetchErr);
          enqueueSnackbar(fetchErr, { variant: 'error' });
          setLoading(false);
        }
      };
      fetchUserData();
    }
  }, [action, userId]);

  const handleAddressChange = (field, val) => {
    setAddress(prev => ({ ...prev, [field]: val }));
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!name || !email || !phone || (action !== 'edit' && !password)) {
      const reqErr = 'Name, Email, Phone, and Password are required.';
      setFormError(reqErr);
      enqueueSnackbar(reqErr, { variant: 'warning' });
      return;
    }

    setLoading(true);

    try {
      if (localLanguageDetails) {
        const words = localLanguageDetails.trim().split(/\s+/).filter(Boolean);
        if (words.length < 15 || words.length > 20) {
          const langErr = `Kannada Overview must be exactly between 15 and 20 words (currently ${words.length} words).`;
          setFormError(langErr);
          enqueueSnackbar(langErr, { variant: 'warning' });
          setLoading(false);
          return;
        }
      }

      const payload = {
        role,
        ...(action === 'edit'
          ? { accountStatus: status }
          : { status }),
        name,
        email,
        phone,
        ...(action !== 'edit' && { password }),
        gender,
        adhaar: adhaar || undefined,
        registrationNumber: role !== 'STUDENT' ? registrationNumber : undefined,
        localLanguageDetails,
        address,
        education: {
          college, course,
          startMonth: startMonth ? parseInt(startMonth, 10) : undefined,
          startYear: startYear ? parseInt(startYear, 10) : undefined,
          endMonth: endMonth ? parseInt(endMonth, 10) : undefined,
          endYear: endYear ? parseInt(endYear, 10) : undefined
        },
        employment: {
          occupation, organization, industry, workLocation, employmentStatus,
          businessName: ['Business Owner', 'Entrepreneur'].includes(employmentStatus) ? businessName : undefined,
          businessType: ['Business Owner', 'Entrepreneur'].includes(employmentStatus) ? businessType : undefined
        }
      };

      let res;
      if (action === 'edit') {
        res = await API.patch(`/users/${userId}`, payload);
      } else {
        res = await API.post('/users', payload);
      }

      if (res.data?.success) {
        const succMsg = `User ${action === 'edit' ? 'updated' : 'created'} successfully!`;
        setFormSuccess(succMsg);
        enqueueSnackbar(succMsg, { variant: 'success' });
        setTimeout(() => {
          navigate('/admin/users');
        }, 1500);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      const subErr = err.response?.data?.message || 'Failed to submit form data.';
      setFormError(subErr);
      enqueueSnackbar(subErr, { variant: 'error' });
      setLoading(false);
    }
  };

  // RENDER CREATE / EDIT FORMS
  if (action === 'new' || action === 'edit') {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', flexGrow: 1 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/admin/users')}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {action === 'edit' ? 'Edit Profile Console' : 'Register Community Member'}
          </Typography>
        </Box>

        {formError && <Alert severity="error" sx={{ mb: 3 }}>{formError}</Alert>}
        {formSuccess && <Alert severity="success" sx={{ mb: 3 }}>{formSuccess}</Alert>}

        {loading && action === 'edit' ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#0088ff' }} />
          </Box>
        ) : (
          <form onSubmit={handleFormSubmit}>
            <Card sx={{ mb: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#0088ff' }}
                >
                  Basic Account Credentials
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Role Access</InputLabel>
                      <Select value={role} label="Role Access" onChange={(e) => setRole(e.target.value)}>
                        <MenuItem value="STUDENT">STUDENT</MenuItem>
                        <MenuItem value="ALUMNI">ALUMNI</MenuItem>
                        <MenuItem value="MEMBER">MEMBER</MenuItem>
                        <MenuItem value="STAFF">STAFF</MenuItem>
                        {currentUser?.role !== 'WARDEN' && <MenuItem value="WARDEN">WARDEN</MenuItem>}
                        {currentUser?.role !== 'WARDEN' && <MenuItem value="ADMIN">ADMIN</MenuItem>}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Account Status</InputLabel>
                      <Select value={status} label="Account Status" onChange={(e) => setStatus(e.target.value)}>
                        <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                        <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                        <MenuItem value="SUSPENDED">SUSPENDED</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Full Name" required value={name} onChange={(e) => setName(e.target.value)} />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Email Address" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Phone Number" required value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </Grid>

                  {action !== 'edit' && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Temporary Password"
                        required
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                      />
                    </Grid>
                  )}
                  
                  <Grid item xs={12} sm={6}>
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

                  {role !== 'STUDENT' && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Registration Number"
                        required
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        placeholder="REG-12345"
                      />
                    </Grid>
                  )}

                  <Grid item xs={12} sm={role !== 'STUDENT' ? 6 : 12}>
                    <TextField
                      fullWidth
                      label="Adhaar Number"
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
                      placeholder="Enter details in regional language..."
                      helperText="Must be exactly 15 to 20 words containing the same info in regional language"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* CONDITIONAL EDUCATION CARD */}
            {['STUDENT', 'ALUMNI'].includes(role) && (
              <Card sx={{ mb: 4 }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#6366F1' }}>
                    Education Configuration
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField fullWidth label="College / University" value={college} onChange={(e) => setCollege(e.target.value)} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth label="Course / Major" value={course} onChange={(e) => setCourse(e.target.value)} />
                    </Grid>
                    
                    {/* Start Month & Year */}
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

                    {/* End Month & Year */}
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
                      <TextField
                        fullWidth
                        label={role === 'STUDENT' ? 'Expected Graduation Year' : 'Graduation Year'}
                        type="number"
                        value={endYear}
                        onChange={(e) => setEndYear(e.target.value)}
                        placeholder="YYYY"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* CONDITIONAL EMPLOYMENT CARD */}
            {['ALUMNI', 'STAFF', 'MEMBER', 'ADMIN'].includes(role) && (
              <Card sx={{ mb: 4 }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#10b981' }}>
                    Professional Occupation
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Occupation / Title" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Organization / Company" value={organization} onChange={(e) => setOrganization(e.target.value)} />
                    </Grid>

                    {role === 'ALUMNI' && (
                      <>
                        <Grid item xs={12} sm={4}>
                          <FormControl fullWidth>
                            <InputLabel>Employment Status</InputLabel>
                            <Select value={employmentStatus} label="Employment Status" onChange={(e) => setEmploymentStatus(e.target.value)}>
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
                        <Grid item xs={12} sm={4}>
                          <TextField fullWidth label="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField fullWidth label="Work Location" value={workLocation} onChange={(e) => setWorkLocation(e.target.value)} />
                        </Grid>

                        {['Business Owner', 'Entrepreneur'].includes(employmentStatus) && (
                          <>
                            <Grid item xs={12} sm={6}>
                              <TextField fullWidth label="Business Name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField fullWidth label="Business Type" value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
                            </Grid>
                          </>
                        )}
                      </>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* ADDRESS CONFIG CARD */}
            <Card sx={{ mb: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: '#3b82f6' }}>
                  Address Configuration
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth size="small" label="Street" value={address.street} onChange={(e) => handleAddressChange('street', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth size="small" label="Area" value={address.area} onChange={(e) => handleAddressChange('area', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth size="small" label="Landmark" value={address.landmark} onChange={(e) => handleAddressChange('landmark', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth size="small" label="Location / City / Landmark" value={address.location} onChange={(e) => handleAddressChange('location', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth size="small" label="City" value={address.city} onChange={(e) => handleAddressChange('city', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth size="small" label="District" value={address.district} onChange={(e) => handleAddressChange('district', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth size="small" label="Taluk" value={address.taluk} onChange={(e) => handleAddressChange('taluk', e.target.value)} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth size="small" label="Pincode" value={address.pincode} onChange={(e) => handleAddressChange('pincode', e.target.value)} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Box sx={{ mb: 6, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" onClick={() => navigate('/admin/users')}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={loading} startIcon={<SaveIcon />}>
                {loading ? 'Saving...' : action === 'edit' ? 'Update Member Profile' : 'Register Member'}
              </Button>
            </Box>
          </form>
        )}
      </Box>
    );
  }

  // RENDER CENTRAL TABBED USER DIRECTORY CONSOLE
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Central Control Panel
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/users?action=new')}
        >
          Register Warden/Staff/Admin
        </Button>
      </Box>

      {/* Tabs list */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} textColor="primary" indicatorColor="primary">
          <Tab label="Wardens" />
          <Tab label="Staff" />
          <Tab label="Admins" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {tabValue === 0 && <UserDirectory directoryRole="WARDEN" title="Manage Wardens" />}
      {tabValue === 1 && <UserDirectory directoryRole="STAFF" title="Manage Staff" />}
      {tabValue === 2 && <UserDirectory directoryRole="ADMIN" title="Manage Admins" />}
    </Box>
  );
};

export default UserManagement;
