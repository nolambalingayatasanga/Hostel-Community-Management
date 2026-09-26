import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stack,
  FormControl,
  Select,
  Tooltip,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  AttachFile as AttachFileIcon,
  Refresh as RefreshIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  DeleteForever as DeleteForeverIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Sync as SyncIcon,
  Block as BlockIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import API from '../../api';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved', 'Closed'];

const ENQUIRY_CATEGORIES = [
  'ALL',
  'Room Admission & Availability',
  'Hostel Facilities & Amenities',
  'Mess & Food Services',
  'Fee Structure & Payments',
  'Maintenance & Housekeeping',
  'General Enquiry'
];

export default function EnquiryManagementView() {
  const { enqueueSnackbar } = useSnackbar();

  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Details Modal
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [activeEnquiry, setActiveEnquiry] = useState(null);
  const [modalStatus, setModalStatus] = useState('Pending');
  const [modalNotes, setModalNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  // Delete Modal
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [enquiryToDelete, setEnquiryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const res = await API.get('/enquiries');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setEnquiries(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load enquiries:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load enquiries', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleOpenDetails = (enquiry) => {
    setActiveEnquiry(enquiry);
    setModalStatus(enquiry.status || 'Pending');
    setModalNotes(enquiry.adminNotes || '');
    setDetailsDialogOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!activeEnquiry) return;
    try {
      setSavingStatus(true);
      const res = await API.patch(`/enquiries/${activeEnquiry._id}/status`, {
        status: modalStatus,
        adminNotes: modalNotes
      });
      if (res.data?.success) {
        enqueueSnackbar('Enquiry status updated successfully', { variant: 'success' });
        setDetailsDialogOpen(false);
        fetchEnquiries();
      }
    } catch (err) {
      console.error('Update status error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to update status', { variant: 'error' });
    } finally {
      setSavingStatus(false);
    }
  };

  const handleRequestDelete = (enquiry) => {
    setEnquiryToDelete(enquiry);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!enquiryToDelete) return;
    try {
      setDeleting(true);
      const res = await API.delete(`/enquiries/${enquiryToDelete._id}`);
      if (res.data?.success) {
        enqueueSnackbar('Enquiry removed successfully', { variant: 'success' });
        setDeleteDialogOpen(false);
        setEnquiryToDelete(null);
        fetchEnquiries();
      }
    } catch (err) {
      console.error('Delete enquiry error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete enquiry', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((e) => {
      if (selectedStatus !== 'ALL' && e.status !== selectedStatus) return false;
      if (selectedCategory !== 'ALL' && e.category !== selectedCategory) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const nameMatch = (e.name || '').toLowerCase().includes(q);
        const emailMatch = (e.email || '').toLowerCase().includes(q);
        const phoneMatch = (e.phone || '').toLowerCase().includes(q);
        const subjMatch = (e.subject || '').toLowerCase().includes(q);
        const msgMatch = (e.message || '').toLowerCase().includes(q);
        const catMatch = (e.category || '').toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !phoneMatch && !subjMatch && !msgMatch && !catMatch) {
          return false;
        }
      }
      return true;
    });
  }, [enquiries, selectedStatus, selectedCategory, search]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' };
      case 'In Progress':
        return { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
      case 'Resolved':
        return { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
      case 'Closed':
        return { bg: '#F1F5F9', color: '#475467', border: '#CBD5E1' };
      default:
        return { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' };
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── Controls Filter Bar ── */}
      <Box
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderBottom: '1px solid #EAECF0',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: 1.5,
          bgcolor: '#FFFFFF'
        }}
      >
        {/* Status Filter Pill Tabs */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            overflowX: 'auto',
            pb: { xs: 0.5, md: 0 },
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' }
          }}
        >
          {['ALL', 'Pending', 'In Progress', 'Resolved', 'Closed'].map((st) => {
            const isSelected = selectedStatus === st;
            const count = st === 'ALL' ? enquiries.length : enquiries.filter((e) => e.status === st).length;
            return (
              <Box
                key={st}
                onClick={() => setSelectedStatus(st)}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.75,
                  py: 0.6,
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontWeight: isSelected ? 700 : 600,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  bgcolor: isSelected ? '#0088FF' : '#F8FAFC',
                  color: isSelected ? '#FFFFFF' : '#334155',
                  border: isSelected ? '1px solid #0088FF' : '1px solid #E2E8F0',
                  boxShadow: isSelected ? '0 2px 6px rgba(0, 136, 255, 0.25)' : 'none',
                  '&:hover': {
                    bgcolor: isSelected ? '#0088FF' : '#EFF6FF',
                    color: isSelected ? '#FFFFFF' : '#0088FF'
                  }
                }}
              >
                <span>{st === 'ALL' ? 'All Enquiries' : st}</span>
                <Box
                  sx={{
                    px: 0.65,
                    py: 0.1,
                    borderRadius: '10px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    bgcolor: isSelected ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                    color: isSelected ? '#FFFFFF' : '#475467'
                  }}
                >
                  {count}
                </Box>
              </Box>
            );
          })}
        </Stack>

        {/* Search, Category Filter, and Refresh */}
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flexShrink: 0 }}>
          {/* Category Dropdown */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              sx={{ borderRadius: '10px', fontSize: '12.5px', height: '38px', bgcolor: '#FFFFFF' }}
            >
              <MenuItem value="ALL" sx={{ fontSize: '12.5px' }}>All Categories</MenuItem>
              {ENQUIRY_CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                <MenuItem key={c} value={c} sx={{ fontSize: '12.5px' }}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Search Box */}
          <TextField
            size="small"
            placeholder="Search enquiries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 17, color: '#94A3B8' }} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <IconButton size="small" onClick={() => setSearch('')} sx={{ p: 0.3 }}>
                  <CloseIcon sx={{ fontSize: 13 }} />
                </IconButton>
              ) : null
            }}
            sx={{
              width: { xs: '100%', sm: 220 },
              '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '12.5px', height: '38px' }
            }}
          />

          {/* Refresh Button */}
          <Tooltip title="Refresh">
            <IconButton
              size="small"
              onClick={fetchEnquiries}
              disabled={loading}
              sx={{
                width: 38,
                height: 38,
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                color: '#475467',
                '&:hover': { bgcolor: '#F8FAFC' }
              }}
            >
              <RefreshIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* ── Table / Cards Container ── */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 1.5, sm: 2 } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60%' }}>
            <CircularProgress size={36} sx={{ color: '#0088FF' }} />
          </Box>
        ) : filteredEnquiries.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <AssignmentIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1 }} />
            <Typography sx={{ fontWeight: 700, color: '#1E293B', fontSize: 16 }}>
              No enquiries found
            </Typography>
            <Typography sx={{ color: '#64748B', fontSize: 13, mt: 0.5 }}>
              {search || selectedStatus !== 'ALL' || selectedCategory !== 'ALL'
                ? 'Try adjusting your filters or search keywords.'
                : 'Enquiries submitted via the public enquiry form will appear here.'}
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #EAECF0', borderRadius: '12px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475467', fontSize: 12, py: 1.25 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475467', fontSize: 12 }}>Sender</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475467', fontSize: 12 }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475467', fontSize: 12 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475467', fontSize: 12 }}>Subject & Details</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475467', fontSize: 12 }}>Attachment</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475467', fontSize: 12 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475467', fontSize: 12 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEnquiries.map((enq) => {
                  const statusStyling = getStatusColor(enq.status);
                  const dateStr = enq.createdAt
                    ? new Date(enq.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'Recent';

                  return (
                    <TableRow key={enq._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      {/* Date */}
                      <TableCell sx={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>
                        {dateStr}
                      </TableCell>

                      {/* Sender */}
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
                          {enq.name}
                        </Typography>
                        {enq.userRole && enq.userRole !== 'GUEST' && (
                          <Chip
                            size="small"
                            label={enq.userRole}
                            sx={{ height: 18, fontSize: '9.5px', fontWeight: 600, bgcolor: '#EFF6FF', color: '#0088FF', mt: 0.25 }}
                          />
                        )}
                      </TableCell>

                      {/* Contact */}
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography sx={{ fontSize: 12, color: '#334155' }}>
                          {enq.email}
                        </Typography>
                        <Typography sx={{ fontSize: 11.5, color: '#64748B' }}>
                          {enq.phone}
                        </Typography>
                      </TableCell>

                      {/* Category */}
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Chip
                          size="small"
                          label={enq.category || 'General'}
                          sx={{
                            fontSize: '11px',
                            fontWeight: 600,
                            bgcolor: '#F1F5F9',
                            color: '#334155',
                            border: '1px solid #E2E8F0',
                            height: 22
                          }}
                        />
                      </TableCell>

                      {/* Subject & Details */}
                      <TableCell sx={{ maxWidth: 280 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 12.5, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {enq.subject || 'Enquiry'}
                        </Typography>
                        <Typography sx={{ fontSize: 11.5, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {enq.message}
                        </Typography>
                      </TableCell>

                      {/* Attachment */}
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {enq.attachmentUrl ? (
                          <Tooltip title={enq.attachmentName || 'View Document'}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<AttachFileIcon sx={{ fontSize: 14 }} />}
                              onClick={() => window.open(enq.attachmentUrl, '_blank')}
                              sx={{
                                textTransform: 'none',
                                fontSize: '11px',
                                fontWeight: 600,
                                py: 0.2,
                                px: 1,
                                height: 24,
                                borderRadius: '6px',
                                borderColor: '#BFDBFE',
                                color: '#0088FF',
                                '&:hover': { bgcolor: '#EFF6FF' }
                              }}
                            >
                              File
                            </Button>
                          </Tooltip>
                        ) : (
                          <Typography sx={{ fontSize: 11.5, color: '#94A3B8' }}>None</Typography>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Chip
                          size="small"
                          label={enq.status || 'Pending'}
                          sx={{
                            fontSize: '11px',
                            fontWeight: 700,
                            bgcolor: statusStyling.bg,
                            color: statusStyling.color,
                            border: `1px solid ${statusStyling.border}`,
                            height: 22
                          }}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="View Details & Update">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDetails(enq)}
                            sx={{ color: '#0088FF', p: 0.5, mr: 0.5 }}
                          >
                            <VisibilityIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Enquiry">
                          <IconButton
                            size="small"
                            onClick={() => handleRequestDelete(enq)}
                            sx={{ color: '#EF4444', p: 0.5 }}
                          >
                            <DeleteIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* ── View Details & Update Status Modal ── */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => !savingStatus && setDetailsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                bgcolor: '#EFF6FF',
                color: '#0088FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AssignmentIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 16.5, color: '#0F172A', lineHeight: 1.2 }}>
                Enquiry Details
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#64748B' }}>
                Review and update hostel enquiry status
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setDetailsDialogOpen(false)} sx={{ color: '#94A3B8' }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Sender info card */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', bgcolor: '#F8FAFC', borderColor: '#E2E8F0' }}>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>Full Name</Typography>
                <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{activeEnquiry?.name}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>Category</Typography>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#0088FF' }}>{activeEnquiry?.category}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>Email Address</Typography>
                <Typography
                  component="a"
                  href={`mailto:${activeEnquiry?.email}`}
                  sx={{ fontSize: 13, color: '#0088FF', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  {activeEnquiry?.email}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography sx={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>Phone Number</Typography>
                <Typography
                  component="a"
                  href={`tel:${activeEnquiry?.phone}`}
                  sx={{ fontSize: 13, color: '#0F172A', textDecoration: 'none', fontWeight: 600 }}
                >
                  {activeEnquiry?.phone}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Subject & Message */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1E293B', mb: 0.5 }}>Subject</Typography>
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#0F172A', bgcolor: '#FFFFFF', p: 1.25, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              {activeEnquiry?.subject || 'Hostel Enquiry'}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1E293B', mb: 0.5 }}>Enquiry Message</Typography>
            <Typography sx={{ fontSize: 13, color: '#334155', bgcolor: '#FFFFFF', p: 1.5, borderRadius: '8px', border: '1px solid #E2E8F0', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              {activeEnquiry?.message}
            </Typography>
          </Box>

          {/* Attachment (if any) */}
          {activeEnquiry?.attachmentUrl && (
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1E293B', mb: 0.5 }}>Attached Document</Typography>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => window.open(activeEnquiry.attachmentUrl, '_blank')}
                sx={{
                  textTransform: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: 13,
                  color: '#0088FF',
                  borderColor: '#BFDBFE'
                }}
              >
                {activeEnquiry.attachmentName || 'Download Document'}
              </Button>
            </Box>
          )}

          <Divider sx={{ my: 0.5 }} />

          {/* Status & Resolution Notes */}
          <Box>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#1E293B', mb: 0.75 }}>Update Status</Typography>
            <FormControl fullWidth size="small">
              <Select
                value={modalStatus}
                onChange={(e) => setModalStatus(e.target.value)}
                sx={{ borderRadius: '10px' }}
              >
                {STATUS_OPTIONS.map((st) => (
                  <MenuItem key={st} value={st}>{st}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#1E293B', mb: 0.75 }}>Admin / Warden Notes</Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Add response or resolution notes here..."
              value={modalNotes}
              onChange={(e) => setModalNotes(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 13 } }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
          <Button
            onClick={() => setDetailsDialogOpen(false)}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#64748B' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveStatus}
            variant="contained"
            disabled={savingStatus}
            sx={{
              bgcolor: '#0088FF',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              '&:hover': { bgcolor: '#0070D2' }
            }}
          >
            {savingStatus ? <CircularProgress size={18} color="inherit" /> : 'Save Updates'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Custom Deletion Confirmation Popup (NO browser alerts!) ── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '18px',
            p: 1,
            boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444',
              flexShrink: 0
            }}
          >
            <DeleteForeverIcon sx={{ fontSize: 22 }} />
          </Box>
          Remove Enquiry?
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.6 }}>
            Are you sure you want to remove the enquiry from <strong>"{enquiryToDelete?.name}"</strong> ({enquiryToDelete?.subject})?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 600, color: '#64748B', borderColor: '#E2E8F0' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleting}
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              bgcolor: '#EF4444',
              '&:hover': { bgcolor: '#DC2626' }
            }}
          >
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
