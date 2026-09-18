import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  IconButton,
  Pagination,
  Collapse,
  Divider,
  CircularProgress,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  CheckCircle as ActiveIcon,
  Block as SuspendedIcon,
  ToggleOff as InactiveIcon
} from '@mui/icons-material';

const UserDirectory = ({ directoryRole, title }) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const isAdmin = currentUser?.role === 'ADMIN';
  const isAdminOrWarden = ['ADMIN', 'WARDEN'].includes(currentUser?.role);

  // Users and Pagination State
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  // Deletion Dialog State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  // Filtering Options State
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  
  // Dynamic filter values
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [taluk, setTaluk] = useState('');
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [occupation, setOccupation] = useState('');
  const [organization, setOrganization] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const resolveAccountStatus = (userRecord) => {
    const accountStatus = userRecord?.accountStatus;
    if (typeof accountStatus === 'string') {
      return accountStatus.toUpperCase();
    }
    return '';
  };

  // Trigger search / filters fetch
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        role: directoryRole,
        page,
        limit: 10,
        search,
        gender,
        city,
        taluk,
        college,
        course,
        startYear,
        endYear,
        occupation,
        organization,
        employmentStatus,
        status,
        sortBy
      };

      // Clean empty keys
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const res = await API.get('/users', { params });
      if (res.data?.success) {
        setUsers(res.data.data || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalUsers(res.data.pagination?.total || 0);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, directoryRole, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleClearFilters = () => {
    setSearch('');
    setGender('');
    setCity('');
    setTaluk('');
    setCollege('');
    setCourse('');
    setStartYear('');
    setEndYear('');
    setOccupation('');
    setOrganization('');
    setEmploymentStatus('');
    setStatus('');
    setPage(1);
    // Timeout to wait for state reset
    setTimeout(fetchUsers, 50);
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      const normalizedCurrentStatus = (currentStatus || 'INACTIVE').toUpperCase();
      const nextStatus = normalizedCurrentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      const res = await API.patch(`/users/${userId}/status`, { status: nextStatus });
      if (res.data?.success) {
        setUsers(users.map(u => u._id === userId ? { ...u, accountStatus: nextStatus } : u));
      }
    } catch (error) {
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setConfirmDeleteText('');
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (confirmDeleteText !== 'DELETE') return;
    try {
      const res = await API.delete(`/users/${userToDelete._id}`);
      if (res.data?.success) {
        setUsers(users.filter(u => u._id !== userToDelete._id));
        setDeleteOpen(false);
        setUserToDelete(null);
      }
    } catch (error) {
    }
  };

  // Render Status Badge
  const renderStatus = (userStatus) => {
    if (!userStatus) return null;
    const statusString = typeof userStatus === 'object' ? userStatus.name : userStatus;
    const normalizedStatus = (statusString || '').toUpperCase();
    switch (normalizedStatus) {
      case 'ACTIVE':
        return <Chip size="small" icon={<ActiveIcon />} label="Active" color="success" variant="outlined" />;
      case 'SUSPENDED':
        return <Chip size="small" icon={<SuspendedIcon />} label="Suspended" color="error" variant="outlined" />;
      case 'INACTIVE':
        return <Chip size="small" icon={<InactiveIcon />} label="Inactive" color="warning" variant="outlined" />;
      default:
        return <Chip size="small" label={statusString} />;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          {title} ({totalUsers})
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            onClick={() => navigate('/admin/users?action=new')}
          >
            Add New Profile
          </Button>
        )}
      </Box>

      {/* SEARCH AND TOGGLE FILTERS BAR */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <form onSubmit={handleSearchSubmit}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center', width: '100%' }}>
              <Box sx={{ flexGrow: 1, width: '100%' }}>
                <TextField
                  fullWidth
                  placeholder={`Search by Name, Email, Phone, College, Location...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    }
                  }}
                  size="small"
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', sm: 'auto' }, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button type="submit" variant="contained">
                  Search
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setShowFilters(!showFilters)}
                  startIcon={<FilterIcon />}
                >
                  Filters
                </Button>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="sort-select-label">Sort By</InputLabel>
                  <Select
                    labelId="sort-select-label"
                    value={sortBy}
                    label="Sort By"
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <MenuItem value="newest">Newest</MenuItem>
                    <MenuItem value="oldest">Oldest</MenuItem>
                    <MenuItem value="nameAsc">Name A-Z</MenuItem>
                    <MenuItem value="nameDesc">Name Z-A</MenuItem>

                    {directoryRole === 'ALUMNI' && <MenuItem value="graduationYear">Graduation Year</MenuItem>}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </form>

          {/* ADVANCED FILTER PANEL */}
          <Collapse in={showFilters} timeout="auto" sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Gender</InputLabel>
                  <Select value={gender} label="Gender" onChange={(e) => setGender(e.target.value)}>
                    <MenuItem value="">Any</MenuItem>
                    <MenuItem value="MALE">Male</MenuItem>
                    <MenuItem value="FEMALE">Female</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              
              {/* Account Status Filter (Admin/Warden only) */}
              {isAdminOrWarden && (
                <Grid xs={6} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
                      <MenuItem value="">Any</MenuItem>
                      <MenuItem value="ACTIVE">Active</MenuItem>
                      <MenuItem value="INACTIVE">Inactive</MenuItem>
                      <MenuItem value="SUSPENDED">Suspended</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Location filters */}
              <Grid xs={6} sm={3}>
                <TextField fullWidth size="small" label="City" value={city} onChange={(e) => setCity(e.target.value)} />
              </Grid>
              <Grid xs={6} sm={3}>
                <TextField fullWidth size="small" label="Taluk" value={taluk} onChange={(e) => setTaluk(e.target.value)} />
              </Grid>

              {/* STUDENT / ALUMNI Filters */}
              {['STUDENT', 'ALUMNI'].includes(directoryRole) && (
                <>
                  <Grid xs={6} sm={3}>
                    <TextField fullWidth size="small" label="College" value={college} onChange={(e) => setCollege(e.target.value)} />
                  </Grid>
                  <Grid xs={6} sm={3}>
                    <TextField fullWidth size="small" label="Course" value={course} onChange={(e) => setCourse(e.target.value)} />
                  </Grid>
                  <Grid xs={6} sm={3}>
                    <TextField fullWidth size="small" label="Start Year" type="number" value={startYear} onChange={(e) => setStartYear(e.target.value)} />
                  </Grid>
                  <Grid xs={6} sm={3}>
                    <TextField fullWidth size="small" label={directoryRole === 'STUDENT' ? 'Expected End Year' : 'Graduation Year'} type="number" value={endYear} onChange={(e) => setEndYear(e.target.value)} />
                  </Grid>
                </>
              )}

              {/* ALUMNI specific professional filters */}
              {directoryRole === 'ALUMNI' && (
                <>
                  <Grid xs={6} sm={3}>
                    <TextField fullWidth size="small" label="Occupation / Title" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
                  </Grid>
                  <Grid xs={6} sm={3}>
                    <TextField fullWidth size="small" label="Company / Org" value={organization} onChange={(e) => setOrganization(e.target.value)} />
                  </Grid>
                  <Grid xs={6} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Employment Status</InputLabel>
                      <Select value={employmentStatus} label="Employment Status" onChange={(e) => setEmploymentStatus(e.target.value)}>
                        <MenuItem value="">Any</MenuItem>
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
                </>
              )}

              {/* MEMBER/STAFF/WARDEN specific professional filters */}
              {['MEMBER', 'STAFF', 'WARDEN'].includes(directoryRole) && (
                <>
                  <Grid xs={6} sm={3}>
                    <TextField fullWidth size="small" label="Occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
                  </Grid>
                  <Grid xs={6} sm={3}>
                    <TextField fullWidth size="small" label="Organization" value={organization} onChange={(e) => setOrganization(e.target.value)} />
                  </Grid>
                </>
              )}
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" color="secondary" onClick={handleClearFilters}>
                Clear All Filters
              </Button>
              <Button variant="contained" onClick={() => { setPage(1); fetchUsers(); }}>
                Apply Filters
              </Button>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* DIRECTORY TABLE LIST */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="user directory table">
          <TableHead>
            <TableRow>
              <TableCell>Avatar</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Contact Details</TableCell>
              <TableCell>
                {['STUDENT', 'ALUMNI'].includes(directoryRole) ? 'Education Details' : 'Professional Title'}
              </TableCell>
              {directoryRole === 'ALUMNI' && <TableCell>Current Job</TableCell>}
              <TableCell>Location</TableCell>
              {isAdminOrWarden && <TableCell>Status</TableCell>}
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={30} sx={{ color: '#0088ff' }} />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No members found matching your filters. Try adjusting your query parameters.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const PrivateChip = () => (
                  <Tooltip title="Hidden for privacy by this user.">
                    <Chip size="small" icon={<LockIcon fontSize="small" />} label="Private" sx={{ backgroundColor: 'rgba(0,136,255,0.08)' }} />
                  </Tooltip>
                );

                return (
                  <TableRow key={u._id} hover>
                    <TableCell>
                      <Avatar
                        src={u.profilePhoto?.url || ''}
                        sx={{ width: 44, height: 44, border: '1px solid rgba(0,0,0,0.08)' }}
                      >
                        {u.name?.charAt(0) || ''}
                      </Avatar>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {u.name}
                      {u.gender && (
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          Gender: {u.gender}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {/* Email row */}
                      {(u.isEmailMasked || u.privacySettings?.maskEmail)
                        ? <PrivateChip />
                        : u.email
                          ? <Typography variant="body2">{u.email}</Typography>
                          : null
                      }
                      {/* Phone row */}
                      {(u.isPhoneMasked || u.privacySettings?.maskPhone)
                        ? <PrivateChip />
                        : u.phone
                          ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{u.phone}</Typography>
                          : null
                      }
                      {/* Fallback when neither field exists at all */}
                      {!u.email && !u.isEmailMasked && !u.privacySettings?.maskEmail && !u.phone && !u.isPhoneMasked && !u.privacySettings?.maskPhone && (
                        <Typography variant="caption" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {['STUDENT', 'ALUMNI'].includes(directoryRole) ? (
                        <>
                          <Typography variant="body2">{u.education?.course || '-'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {u.education?.college || '-'} <br />
                            Class: {u.education?.startYear || '-'} - {u.education?.endYear || '-'}
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Typography variant="body2">{u.employment?.occupation || '-'}</Typography>
                          <Typography variant="caption" color="text.secondary">{u.employment?.organization || '-'}</Typography>
                        </>
                      )}
                    </TableCell>
                    {directoryRole === 'ALUMNI' && (
                      <TableCell>
                        <Typography variant="body2">{u.employment?.occupation || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {u.employment?.organization || '-'} ({u.employment?.employmentStatus || '-'})
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell>
                      {u.address?.city ? (
                        `${u.address.city}, ${u.address.district || 'N/A'}`
                      ) : (
                        <Chip size="small" icon={<LockIcon />} label="Hidden" variant="outlined" />
                      )}
                    </TableCell>
                    
                    {isAdminOrWarden && (
                      <TableCell>
                          {renderStatus(resolveAccountStatus(u))}
                      </TableCell>
                    )}
                    
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="View Profile">
                          <IconButton size="small" onClick={() => navigate(`/profile/${u._id}`)}>
                            <ViewIcon sx={{ color: '#0088ff' }} />
                          </IconButton>
                        </Tooltip>
                        
                        {isAdminOrWarden && (
                          <>
                            <Tooltip title="Edit Profile">
                              <IconButton size="small" onClick={() => navigate(`/admin/users?action=edit&id=${u._id}`)}>
                                <EditIcon sx={{ color: 'warning.main' }} />
                              </IconButton>
                            </Tooltip>
                            
                            {/* Deactivate/Reactivate toggler */}
                              <Tooltip title={resolveAccountStatus(u) === 'ACTIVE' ? 'Deactivate Account' : 'Reactivate Account'}>
                              <IconButton size="small" onClick={() => handleStatusToggle(u._id, resolveAccountStatus(u))}>
                                {resolveAccountStatus(u) === 'ACTIVE' ? <InactiveIcon color="warning" /> : <ActiveIcon color="success" />}
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Permanently Delete">
                              <IconButton size="small" onClick={() => handleDeleteClick(u)}>
                                <DeleteIcon sx={{ color: 'error.main' }} />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* PAGINATION PANEL */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, p) => setPage(p)}
          color="primary"
          shape="rounded"
        />
      </Box>

      {/* DELETION CONFIRMATION DIALOG (ADMIN ONLY) */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>
          Permanent Deletion Warning
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you absolutely sure you want to permanently delete the profile of{' '}
            <strong style={{ color: '#111827' }}>{userToDelete?.name}</strong>? This action is irreversible
            and will remove their account, address, and images from Cloudinary.
          </DialogContentText>
          <DialogContentText>
            To confirm deletion, type <strong style={{ color: '#ff4d4d' }}>DELETE</strong> in the box below:
          </DialogContentText>
          <TextField
            fullWidth
            size="small"
            margin="dense"
            value={confirmDeleteText}
            onChange={(e) => setConfirmDeleteText(e.target.value)}
            placeholder="DELETE"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={confirmDeleteText !== 'DELETE'}
          >
            Permanently Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserDirectory;
