import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';
import API from '../../api';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress,
  Stack,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Domain as DomainIcon,
  Apartment as ApartmentIcon,
  People as PeopleIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';

const HOSTEL_TYPES = ['Boys Hostel', 'Girls Hostel', 'Combined', 'Other'];

export default function Organizations() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [type, setType] = useState('Boys Hostel');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isUserAdmin = user?.role === 'ADMIN' || user?.role === 'ADMINISTRATOR';

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const res = await API.get('/organizations');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setOrganizations(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load organizations:', err);
      enqueueSnackbar('Failed to load organizations', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedOrg(null);
    setName('');
    setType('Boys Hostel');
    setCity('');
    setAddress('');
    setIsActive(true);
    setOpenModal(true);
  };

  const handleOpenEdit = (org) => {
    setIsEditing(true);
    setSelectedOrg(org);
    setName(org.name || '');
    setType(org.type || 'Boys Hostel');
    setCity(org.city || '');
    setAddress(org.address || '');
    setIsActive(org.isActive !== false);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setOpenModal(false);
    setSelectedOrg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      enqueueSnackbar('Organization / Hostel name is required', { variant: 'warning' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        type,
        city: city.trim(),
        address: address.trim(),
        isActive
      };

      if (isEditing && selectedOrg?._id) {
        const res = await API.put(`/organizations/${selectedOrg._id}`, payload);
        if (res.data?.success) {
          enqueueSnackbar('Organization updated successfully', { variant: 'success' });
          setOpenModal(false);
          fetchOrganizations();
        }
      } else {
        const res = await API.post('/organizations', payload);
        if (res.data?.success) {
          enqueueSnackbar('Organization created successfully', { variant: 'success' });
          setOpenModal(false);
          fetchOrganizations();
        }
      }
    } catch (err) {
      console.error('Failed to save organization:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to save organization', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (org) => {
    setOrgToDelete(org);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!orgToDelete?._id) return;
    if ((orgToDelete.userCount || 0) > 0) {
      enqueueSnackbar(`Cannot delete: ${orgToDelete.userCount} user(s) are assigned to "${orgToDelete.name}". Reassign them first.`, { variant: 'error' });
      return;
    }
    try {
      setDeleting(true);
      const res = await API.delete(`/organizations/${orgToDelete._id}`);
      if (res.data?.success) {
        enqueueSnackbar('Organization deleted successfully', { variant: 'success' });
        setDeleteDialogOpen(false);
        setOrgToDelete(null);
        fetchOrganizations();
      }
    } catch (err) {
      console.error('Failed to delete organization:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete organization', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = organizations.length;
    const boys = organizations.filter(o => o.type === 'Boys Hostel').length;
    const girls = organizations.filter(o => o.type === 'Girls Hostel').length;
    const totalUsers = organizations.reduce((acc, curr) => acc + (curr.userCount || 0), 0);
    return { total, boys, girls, totalUsers };
  }, [organizations]);

  // Filtered organizations
  const filteredOrganizations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return organizations;
    return organizations.filter(o =>
      (o.name || '').toLowerCase().includes(q) ||
      (o.city || '').toLowerCase().includes(q) ||
      (o.type || '').toLowerCase().includes(q)
    );
  }, [organizations, searchQuery]);

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
            <DomainIcon sx={{ color: '#0088FF', fontSize: 28 }} /> Organizations & Hostel Locations
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
            Manage hostel organizations, dropdown values for registration, and user affiliations.
          </Typography>
        </Box>

        {isUserAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{
              bgcolor: '#0088FF',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '10px',
              px: 2.5,
              py: 1,
              boxShadow: '0 4px 12px rgba(0, 136, 255, 0.25)',
              '&:hover': { bgcolor: '#0077E6' }
            }}
          >
            Add Organization
          </Button>
        )}
      </Box>

      {/* Overview Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3.5 }}>
        <Card sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: 'none', bgcolor: '#F8FAFC' }}>
          <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Total Hostels
              </Typography>
              <ApartmentIcon sx={{ color: '#0088FF', fontSize: 22 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A', mt: 1 }}>
              {stats.total}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: 'none', bgcolor: '#F0F9FF' }}>
          <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#0369A1', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Boys Hostels
              </Typography>
              <MaleIcon sx={{ color: '#0284C7', fontSize: 24 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#0369A1', mt: 1 }}>
              {stats.boys}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: 'none', bgcolor: '#FDF2F8' }}>
          <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#BE185D', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Girls Hostels
              </Typography>
              <FemaleIcon sx={{ color: '#DB2777', fontSize: 24 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#BE185D', mt: 1 }}>
              {stats.girls}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', boxShadow: 'none', bgcolor: '#F0FDF4' }}>
          <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#15803D', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Assigned Users
              </Typography>
              <PeopleIcon sx={{ color: '#16A34A', fontSize: 22 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#15803D', mt: 1 }}>
              {stats.totalUsers}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Main Table Card */}
      <Card sx={{ borderRadius: '14px', border: '1px solid #EAECF0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {/* Table Toolbar */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EAECF0' }}>
          <TextField
            size="small"
            placeholder="Search organizations or cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                  </InputAdornment>
                )
              }
            }}
            sx={{
              maxWidth: 320,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                bgcolor: '#F8FAFC'
              }
            }}
          />
          <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
            Showing {filteredOrganizations.length} {filteredOrganizations.length === 1 ? 'organization' : 'organizations'}
          </Typography>
        </Box>

        {/* Table */}
        <TableContainer>
          <Table sx={{ minWidth: 700 }}>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475467', py: 1.5 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475467', py: 1.5 }}>Organization / Hostel Location</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475467', py: 1.5 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475467', py: 1.5 }}>City</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475467', py: 1.5 }}>Affiliated Users</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475467', py: 1.5 }}>Status</TableCell>
                {isUserAdmin && <TableCell align="right" sx={{ fontWeight: 700, color: '#475467', py: 1.5 }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: '#0088FF' }} />
                  </TableCell>
                </TableRow>
              ) : filteredOrganizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#64748B' }}>
                    No organizations found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrganizations.map((org, index) => {
                  const isBoys = org.type === 'Boys Hostel';
                  const isGirls = org.type === 'Girls Hostel';
                  return (
                    <TableRow key={org._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ color: '#64748B', fontWeight: 600 }}>{index + 1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Box sx={{ width: 34, height: 34, borderRadius: '8px', bgcolor: isBoys ? '#EFF6FF' : isGirls ? '#FDF2F8' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ApartmentIcon sx={{ color: isBoys ? '#0088FF' : isGirls ? '#DB2777' : '#64748B', fontSize: 19 }} />
                          </Box>
                          <Box>
                            <Typography sx={{ fontWeight: 600, color: '#0F172A', fontSize: '14px' }}>
                              {org.name}
                            </Typography>
                            {org.address && (
                              <Typography variant="caption" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.3, mt: 0.2 }}>
                                <LocationIcon sx={{ fontSize: 13 }} /> {org.address}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={org.type || 'Hostel'}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '12px',
                            bgcolor: isBoys ? '#DBEAFE' : isGirls ? '#FCE7F3' : '#F1F5F9',
                            color: isBoys ? '#1E40AF' : isGirls ? '#9D174D' : '#475467'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#334155', fontWeight: 500 }}>
                        {org.city || '—'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<PeopleIcon sx={{ fontSize: '15px !important' }} />}
                          label={`${org.userCount || 0} user${org.userCount === 1 ? '' : 's'}`}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '12px',
                            bgcolor: (org.userCount || 0) > 0 ? '#ECFDF5' : '#F1F5F9',
                            color: (org.userCount || 0) > 0 ? '#047857' : '#64748B'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={org.isActive !== false ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '11.5px',
                            bgcolor: org.isActive !== false ? '#DCFCE7' : '#FEE2E2',
                            color: org.isActive !== false ? '#15803D' : '#B91C1C'
                          }}
                        />
                      </TableCell>
                      {isUserAdmin && (
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Edit Organization">
                              <IconButton size="small" onClick={() => handleOpenEdit(org)} sx={{ color: '#0088FF' }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={org.userCount > 0 ? 'Cannot delete with active users' : 'Delete Organization'}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDelete(org)}
                                  disabled={org.userCount > 0}
                                  sx={{ color: '#EF4444', '&.Mui-disabled': { color: '#CBD5E1' } }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add / Edit Organization Dialog */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px', p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
            {isEditing ? 'Edit Organization' : 'Add New Organization'}
          </Typography>
          <IconButton size="small" onClick={handleCloseModal} disabled={submitting}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.2 }}>
            <Box>
              <Typography component="label" sx={{ fontWeight: 600, color: '#334155', fontSize: '13px', mb: 0.5, display: 'block' }}>
                Organization / Hostel Name <span style={{ color: '#EF4444' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kambi sidrammana boys Hostel - Basaveshwara nagar"
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F8FAFC' }
                }}
              />
              {isEditing && (
                <Typography variant="caption" sx={{ color: '#64748B', mt: 0.5, display: 'block' }}>
                  Renaming will automatically update all {selectedOrg?.userCount || 0} associated users in the database.
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Box>
                <Typography component="label" sx={{ fontWeight: 600, color: '#334155', fontSize: '13px', mb: 0.5, display: 'block' }}>
                  Hostel Type
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    sx={{ borderRadius: '8px', bgcolor: '#F8FAFC' }}
                  >
                    {HOSTEL_TYPES.map(t => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <Typography component="label" sx={{ fontWeight: 600, color: '#334155', fontSize: '13px', mb: 0.5, display: 'block' }}>
                  City / Location
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bengaluru"
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F8FAFC' }
                  }}
                />
              </Box>
            </Box>

            <Box>
              <Typography component="label" sx={{ fontWeight: 600, color: '#334155', fontSize: '13px', mb: 0.5, display: 'block' }}>
                Full Address (Optional)
              </Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter street, area, landmarks..."
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#F8FAFC' }
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 0.5 }}>
              <Box>
                <Typography sx={{ fontWeight: 600, color: '#334155', fontSize: '13.5px' }}>
                  Active Status
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  When active, this organization appears in the registration dropdown.
                </Typography>
              </Box>
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#0088FF' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#0088FF' }
                }}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
            <Button
              onClick={handleCloseModal}
              disabled={submitting}
              sx={{ textTransform: 'none', color: '#64748B', fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                bgcolor: '#0088FF',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '8px',
                px: 3,
                '&:hover': { bgcolor: '#0077E6' }
              }}
            >
              {submitting ? <CircularProgress size={20} sx={{ color: '#FFFFFF' }} /> : isEditing ? 'Save Changes' : 'Create Organization'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px', p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#DC2626' }}>
          Delete Organization?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#475467' }}>
            Are you sure you want to delete <strong>{orgToDelete?.name}</strong>?
          </Typography>
          {(orgToDelete?.userCount || 0) > 0 ? (
            <Alert severity="error" sx={{ mt: 2, borderRadius: '8px', fontSize: '13px' }}>
              <strong>Cannot Delete:</strong> {orgToDelete.userCount} user(s) are currently assigned to this organization. You must reassign all users under it to another organization before this can be deleted.
            </Alert>
          ) : (
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 1 }}>
              This action cannot be undone. All details for this organization will be permanently removed.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            sx={{ textTransform: 'none', color: '#64748B', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleting || (orgToDelete?.userCount || 0) > 0}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
              px: 2.5
            }}
          >
            {deleting ? <CircularProgress size={20} sx={{ color: '#FFFFFF' }} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
