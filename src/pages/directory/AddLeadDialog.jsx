import PropTypes from "prop-types";
import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Divider,
  Box
} from "@mui/material";

import { useLeadMutations } from "./crmHooks";

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

const INITIAL_ADDRESS = {
  street: "",
  area: "",
  landmark: "",
  location: "",
  city: "",
  district: "",
  taluk: "",
  pincode: ""
};

const INITIAL_STATE = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "STUDENT",
  status: "",
  gender: "MALE",
  adhaar: "",
  registrationNumber: "",
  localLanguageDetails: "",
  address: { ...INITIAL_ADDRESS },
  education: {
    college: "",
    course: "",
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: ""
  },
  employment: {
    occupation: "",
    organization: "",
    industry: "",
    workLocation: "",
    employmentStatus: "Employed",
    businessName: "",
    businessType: ""
  }
};

export default function AddLeadDialog({ open, onClose, statuses }) {
  const { createLead } = useLeadMutations();
  const [basicValues, setBasicValues] = useState({ ...INITIAL_STATE });
  const [validationError, setValidationError] = useState('');

  const handleBasicChange = (key, value) => {
    setBasicValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddressChange = (field, value) => {
    setBasicValues((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handleNestedChange = (parentKey, key, value) => {
    setBasicValues((prev) => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [key]: value
      }
    }));
  };

  const handleClose = () => {
    setBasicValues({ ...INITIAL_STATE });
    setValidationError('');
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationError('');

    if (!basicValues.name.trim() || !basicValues.email.trim() || !basicValues.phone.trim() || !basicValues.password) return;

    if (basicValues.localLanguageDetails) {
      const words = basicValues.localLanguageDetails.trim().split(/\s+/).filter(Boolean);
      if (words.length < 15 || words.length > 20) {
        setValidationError(`Local language details must be exactly between 15 and 20 words (currently ${words.length} words).`);
        return;
      }
    }

    try {
      const payload = {
        name: basicValues.name,
        email: basicValues.email,
        phone: basicValues.phone,
        password: basicValues.password,
        role: basicValues.role,
        status: basicValues.status || undefined,
        gender: basicValues.gender,
        adhaar: basicValues.adhaar || undefined,
        registrationNumber: basicValues.role !== 'STUDENT' ? basicValues.registrationNumber : undefined,
        localLanguageDetails: basicValues.localLanguageDetails || undefined,
        address: basicValues.address
      };

      if (['STUDENT', 'ALUMNI'].includes(basicValues.role)) {
        payload.education = {
          college: basicValues.education.college || undefined,
          course: basicValues.education.course || undefined,
          startMonth: basicValues.education.startMonth ? Number(basicValues.education.startMonth) : undefined,
          startYear: basicValues.education.startYear ? Number(basicValues.education.startYear) : undefined,
          endMonth: basicValues.education.endMonth ? Number(basicValues.education.endMonth) : undefined,
          endYear: basicValues.education.endYear ? Number(basicValues.education.endYear) : undefined
        };
      }

      if (['ALUMNI', 'MEMBER', 'STAFF', 'WARDEN', 'ADMIN'].includes(basicValues.role)) {
        payload.employment = {
          occupation: basicValues.employment.occupation || undefined,
          organization: basicValues.employment.organization || undefined,
          industry: basicValues.employment.industry || undefined,
          workLocation: basicValues.employment.workLocation || undefined,
          employmentStatus: basicValues.employment.employmentStatus,
          businessName: ['Business Owner', 'Entrepreneur', 'Self-Employed'].includes(basicValues.employment.employmentStatus) ? basicValues.employment.businessName : undefined,
          businessType: ['Business Owner', 'Entrepreneur', 'Self-Employed'].includes(basicValues.employment.employmentStatus) ? basicValues.employment.businessType : undefined
        };
      }

      await createLead.mutateAsync(payload);
      handleClose();
    } catch (err) {
      console.error(err);
      setValidationError(err.response?.data?.message || 'Failed to add user.');
    }
  };

  const showEducation = ["STUDENT", "ALUMNI"].includes(basicValues.role);
  const showEmployment = ["ALUMNI", "AGENT", "STAFF", "MEMBER", "ADMIN", "WARDEN"].includes(basicValues.role);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1, color: "#1e293b" }}>
          Add New Community Member
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 2 }}>
          {validationError && (
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>
                {validationError}
              </Typography>
            </Box>
          )}

          <Typography variant="subtitle2" sx={{ color: "#0088ff", mb: 2, fontWeight: 700 }}>
            Profile Login & Basics
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="role-select-label">Community Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  label="Community Role"
                  value={basicValues.role}
                  onChange={(e) => handleBasicChange("role", e.target.value)}
                >
                  {['ADMIN', 'WARDEN', 'MEMBER', 'STAFF', 'STUDENT', 'ALUMNI'].map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-select-label">Pipeline Status</InputLabel>
                <Select
                  labelId="status-select-label"
                  label="Pipeline Status"
                  value={basicValues.status}
                  onChange={(e) => handleBasicChange("status", e.target.value)}
                >
                  <MenuItem value="">Default Status</MenuItem>
                  {statuses.map((status) => (
                    <MenuItem key={status._id} value={status._id}>
                      {status.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="gender-select-label">Gender</InputLabel>
                <Select
                  labelId="gender-select-label"
                  label="Gender"
                  value={basicValues.gender}
                  onChange={(e) => handleBasicChange("gender", e.target.value)}
                >
                  {['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'].map((gender) => (
                    <MenuItem key={gender} value={gender}>
                      {gender}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Full Name" required value={basicValues.name} onChange={(e) => handleBasicChange("name", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Email Address" required type="email" value={basicValues.email} onChange={(e) => handleBasicChange("email", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Phone Number" required value={basicValues.phone} onChange={(e) => handleBasicChange("phone", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Temporary Password" type="password" placeholder="Enter password" required value={basicValues.password} onChange={(e) => handleBasicChange("password", e.target.value)} />
            </Grid>

            {basicValues.role !== 'STUDENT' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Registration Number"
                  required
                  value={basicValues.registrationNumber}
                  onChange={(e) => handleBasicChange("registrationNumber", e.target.value)}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={basicValues.role !== 'STUDENT' ? 6 : 12}>
              <TextField
                fullWidth
                size="small"
                label="Adhaar Number"
                value={basicValues.adhaar}
                onChange={(e) => handleBasicChange("adhaar", e.target.value)}
                placeholder="XXXX XXXX XXXX"
                inputProps={{ maxLength: 14 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                label="Local / Native Language Details (15 to 20 words)"
                value={basicValues.localLanguageDetails}
                onChange={(e) => handleBasicChange("localLanguageDetails", e.target.value)}
                placeholder="Enter details in regional language..."
                helperText="Must be exactly 15 to 20 words containing regional translation details"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle2" sx={{ color: "#0088ff", mb: 2, fontWeight: 700 }}>
            Address Details
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Street Name/Road" value={basicValues.address.street} onChange={(e) => handleAddressChange("street", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Area/Locality" value={basicValues.address.area} onChange={(e) => handleAddressChange("area", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Landmark" value={basicValues.address.landmark} onChange={(e) => handleAddressChange("landmark", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Location / City / Landmark" value={basicValues.address.location} onChange={(e) => handleAddressChange("location", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="City" value={basicValues.address.city} onChange={(e) => handleAddressChange("city", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="District" value={basicValues.address.district} onChange={(e) => handleAddressChange("district", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Taluk" value={basicValues.address.taluk} onChange={(e) => handleAddressChange("taluk", e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Pincode" value={basicValues.address.pincode} onChange={(e) => handleAddressChange("pincode", e.target.value)} />
            </Grid>
          </Grid>

          {showEducation && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle2" sx={{ color: "#0088ff", mb: 2, fontWeight: 700 }}>
                Education Details
              </Typography>
              <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="College / University Name" value={basicValues.education.college} onChange={(e) => handleNestedChange("education", "college", e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Course / Program Name" value={basicValues.education.course} onChange={(e) => handleNestedChange("education", "course", e.target.value)} />
                </Grid>
                
                {/* Start Month & Year */}
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Start Month</InputLabel>
                    <Select value={basicValues.education.startMonth} label="Start Month" onChange={(e) => handleNestedChange("education", "startMonth", e.target.value)}>
                      {months.map((m) => (
                        <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth size="small" label="Start Year" type="number" value={basicValues.education.startYear} onChange={(e) => handleNestedChange("education", "startYear", e.target.value)} placeholder="YYYY" />
                </Grid>

                {/* End Month & Year */}
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>End Month</InputLabel>
                    <Select value={basicValues.education.endMonth} label="End Month" onChange={(e) => handleNestedChange("education", "endMonth", e.target.value)}>
                      {months.map((m) => (
                        <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label={basicValues.role === 'STUDENT' ? 'Expected Graduation Year' : 'Graduation Year'}
                    type="number"
                    value={basicValues.education.endYear}
                    onChange={(e) => handleNestedChange("education", "endYear", e.target.value)}
                    placeholder="YYYY"
                  />
                </Grid>
              </Grid>
            </>
          )}

          {showEmployment && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle2" sx={{ color: "#0088ff", mb: 2, fontWeight: 700 }}>
                Employment & Work Details
              </Typography>
              <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Occupation / Designation" value={basicValues.employment.occupation} onChange={(e) => handleNestedChange("employment", "occupation", e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Organization / Company" value={basicValues.employment.organization} onChange={(e) => handleNestedChange("employment", "organization", e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Industry Sector" value={basicValues.employment.industry} onChange={(e) => handleNestedChange("employment", "industry", e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Work Location / City" value={basicValues.employment.workLocation} onChange={(e) => handleNestedChange("employment", "workLocation", e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="emp-status-select-label">Employment Status</InputLabel>
                    <Select
                      labelId="emp-status-select-label"
                      label="Employment Status"
                      value={basicValues.employment.employmentStatus}
                      onChange={(e) => handleNestedChange("employment", "employmentStatus", e.target.value)}
                    >
                      {['Employed', 'Self-Employed', 'Business Owner', 'Entrepreneur', 'Higher Studies', 'Government Service', 'Retired', 'Unemployed', 'Other'].map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {['Business Owner', 'Entrepreneur', 'Self-Employed'].includes(basicValues.employment.employmentStatus) && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth size="small" label="Business Name" value={basicValues.employment.businessName} onChange={(e) => handleNestedChange("employment", "businessName", e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth size="small" label="Business Type" value={basicValues.employment.businessType} onChange={(e) => handleNestedChange("employment", "businessType", e.target.value)} />
                    </Grid>
                  </>
                )}
              </Grid>
            </>
          )}

        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createLead.isLoading}
            sx={{
              bgcolor: "#0088ff",
              "&:hover": { bgcolor: "#0077ee" },
              textTransform: "none",
              borderRadius: "8px",
              boxShadow: "none",
              fontWeight: 600
            }}
          >
            {createLead.isLoading ? "Adding…" : "Add Member"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

AddLeadDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  statuses: PropTypes.array,
};

AddLeadDialog.defaultProps = { statuses: [] };
