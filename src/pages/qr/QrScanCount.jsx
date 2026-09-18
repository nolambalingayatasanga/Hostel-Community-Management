import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Divider,
  Pagination,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  QrCodeScanner as QrScannerIcon,
  QrCode2 as QrCodeIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CheckCircle as ValidIcon,
  Warning as WarningIcon,
  Cancel as InvalidIcon,
  Close as CloseIcon,
  CameraAlt as CameraIcon,
  FlashOn as FlashIcon,
  FlashOff as FlashOffIcon,
  Keyboard as KeyboardIcon,
  TrendingUp as TrendingUpIcon,
  Group as UsersIcon,
  Today as TodayIcon,
  VerifiedUser as VerifiedIcon,
  Badge as BadgeIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer
} from 'recharts';
import { useSnackbar } from 'notistack';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import API from '../../api';

const SCAN_TYPES = [
  { value: 'GENERAL', label: 'General Verification' },
  { value: 'GATE_ENTRY', label: 'Hostel Gate Entry' },
  { value: 'GATE_EXIT', label: 'Hostel Gate Exit' },
  { value: 'MESS_MEAL', label: 'Mess / Dining Meal' },
  { value: 'EVENT_ENTRY', label: 'Event Entry' },
  { value: 'ATTENDANCE', label: 'Roll Call / Attendance' }
];

const ROLE_COLORS = {
  STUDENT: { bg: '#EFF8FF', color: '#175CD3', border: '#B2DDFF' },
  ALUMNI: { bg: '#FDF2FA', color: '#C11574', border: '#FCCEEE' },
  STAFF: { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
  MEMBER: { bg: '#F8F9FC', color: '#3E4784', border: '#D5D9EB' },
  WARDEN: { bg: '#FFF6ED', color: '#C4320A', border: '#FECDCA' },
  ADMIN: { bg: '#FEF3F2', color: '#B42318', border: '#FECDCA' }
};

const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // audio context not allowed without interaction
  }
};

export default function QrScanCount() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  // Dashboard Stats State
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Scan Logs State
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [filterScanType, setFilterScanType] = useState('ALL');
  const [filterRole, setFilterRole] = useState('ALL');

  // Scanner Dialog State
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [continuousScan, setContinuousScan] = useState(true);
  const [lastScannedResult, setLastScannedResult] = useState(null);
  const [isScanningActive, setIsScanningActive] = useState(false);

  // Manual / Quick Scan Dialog State
  const [manualOpen, setManualOpen] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [manualScanType, setManualScanType] = useState('GENERAL');
  const [manualNotes, setManualNotes] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Member QR Generator Dialog State
  const [qrGenOpen, setQrGenOpen] = useState(false);
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState([]);
  const [selectedMemberForQr, setSelectedMemberForQr] = useState(null);
  const [searchingMembers, setSearchingMembers] = useState(false);
  const qrCanvasRef = useRef(null);

  // Video & Canvas Refs for Camera
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const lastScannedCodeRef = useRef(null);
  const scanCooldownRef = useRef(false);

  // Fetch Stats
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await API.get('/qr-scans/stats');
      if (res.data?.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load QR scan statistics:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Logs
  const fetchLogs = async (currentPage = page) => {
    try {
      setLogsLoading(true);
      const res = await API.get('/qr-scans/logs', {
        params: {
          page: currentPage,
          limit: 10,
          search: search || undefined,
          scanType: filterScanType !== 'ALL' ? filterScanType : undefined,
          role: filterRole !== 'ALL' ? filterRole : undefined
        }
      });
      if (res.data?.success) {
        setLogs(res.data.data || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalLogs(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load QR scan history logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchLogs(1);
  }, [filterScanType, filterRole]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchLogs(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Record scan API call
  const submitScan = async (payload, type = 'GENERAL', notes = '') => {
    try {
      const res = await API.post('/qr-scans/scan', {
        qrCode: payload,
        scanType: type,
        notes
      });
      if (res.data?.success) {
        playBeep();
        if (navigator.vibrate) {
          try { navigator.vibrate(120); } catch { /* ignore */ }
        }
        enqueueSnackbar('Scan counted successfully! Redirecting to login...', {
          variant: 'success'
        });
        setLastScannedResult({
          user: res.data.user,
          scan: res.data.scan,
          totalScans: res.data.totalScans
        });
        fetchStats();
        fetchLogs(1);

        // Redirect to https://www.kambi-connect.in/login after the scan is counted
        setTimeout(() => {
          window.location.href = 'https://www.kambi-connect.in/login';
        }, 1000);

        return res.data;
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid or unrecognized QR code';
      enqueueSnackbar(errMsg, { variant: 'error' });
      throw err;
    }
  };

  // Delete Log
  const handleDeleteLog = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scan entry?')) return;
    try {
      const res = await API.delete(`/qr-scans/logs/${id}`);
      if (res.data?.success) {
        enqueueSnackbar('Scan record deleted', { variant: 'info' });
        fetchLogs(page);
        fetchStats();
      }
    } catch (err) {
      enqueueSnackbar('Failed to delete scan record', { variant: 'error' });
    }
  };

  // Camera Scanning Loop
  const startCamera = async () => {
    setCameraError(null);
    setIsScanningActive(true);
    lastScannedCodeRef.current = null;
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        requestAnimationFrame(tickScanner);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please ensure camera permissions are allowed.');
      setIsScanningActive(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsScanningActive(false);
  }, []);

  const tickScanner = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data && !scanCooldownRef.current) {
          scanCooldownRef.current = true;
          lastScannedCodeRef.current = code.data;

          submitScan(code.data, 'GENERAL')
            .then(() => {
              if (!continuousScan) {
                stopCamera();
                setCameraOpen(false);
              }
            })
            .catch(() => {})
            .finally(() => {
              // 2 second cooldown before scanning the next code
              setTimeout(() => {
                scanCooldownRef.current = false;
              }, 2000);
            });
        }
      }
    }
    if (isScanningActive) {
      animationFrameRef.current = requestAnimationFrame(tickScanner);
    }
  };

  useEffect(() => {
    if (cameraOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [cameraOpen]);

  // Manual Scan Submit
  const handleManualScanSubmit = async (e) => {
    e?.preventDefault();
    if (!manualInput.trim()) return;
    try {
      setManualSubmitting(true);
      await submitScan(manualInput.trim(), manualScanType, manualNotes);
      setManualInput('');
      setManualNotes('');
      setManualOpen(false);
    } catch {
      // Error handled by submitScan
    } finally {
      setManualSubmitting(false);
    }
  };

  // Search Members for QR generation
  const handleSearchMembers = async (q) => {
    try {
      setSearchingMembers(true);
      const res = await API.get('/qr-scans/search-members', { params: { q } });
      if (res.data?.success) {
        setMemberSearchResults(res.data.users || []);
      }
    } catch (err) {
      console.error('Member search error:', err);
    } finally {
      setSearchingMembers(false);
    }
  };

  useEffect(() => {
    if (qrGenOpen) {
      handleSearchMembers(searchMemberQuery);
    }
  }, [qrGenOpen]);

  // Generate QR Canvas
  useEffect(() => {
    if (selectedMemberForQr && qrCanvasRef.current) {
      // Direct scanning link: counts scan on the server and redirects to https://www.kambi-connect.in/login
      const qrPayload = `https://www.kambi-connect.in/api/qr-scans/public-scan/${selectedMemberForQr._id}`;

      QRCode.toCanvas(qrCanvasRef.current, qrPayload, {
        width: 220,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF'
        }
      }).catch(err => console.error('QR Render Error:', err));
    }
  }, [selectedMemberForQr]);

  // Download QR Code PNG
  const handleDownloadQr = () => {
    if (!qrCanvasRef.current || !selectedMemberForQr) return;
    const link = document.createElement('a');
    link.download = `${selectedMemberForQr.name.replace(/\s+/g, '_')}_QR.png`;
    link.href = qrCanvasRef.current.toDataURL('image/png');
    link.click();
  };

  // Export CSV
  const handleExportCsv = () => {
    if (logs.length === 0) {
      enqueueSnackbar('No scan logs to export', { variant: 'info' });
      return;
    }
    const headers = ['User Name', 'Role', 'Registration No', 'Scan Type', 'Status', 'Verified By', 'Scanned At'];
    const rows = logs.map(l => [
      `"${l.user?.name || 'Unknown'}"`,
      `"${l.user?.role || 'N/A'}"`,
      `"${l.user?.registrationNumber || l.user?.memberInfo?.registrationNo || 'N/A'}"`,
      `"${l.scanType}"`,
      `"${l.status}"`,
      `"${l.scannedBy?.name || 'Admin'}"`,
      `"${new Date(l.scannedAt).toLocaleString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `QR_Scan_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header Bar */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0088FF 0%, #0055FF 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 136, 255, 0.28)'
              }}
            >
              <QrScannerIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                QR Scan Count & Verification
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
                Real-time gate passes, dining meal verification, and student scan metrics
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              fetchStats();
              fetchLogs(page);
            }}
            sx={{
              borderRadius: '9px',
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#E2E8F0',
              color: '#334155',
              bgcolor: '#FFFFFF',
              '&:hover': { bgcolor: '#F8FAFC', borderColor: '#CBD5E1' }
            }}
          >
            Refresh
          </Button>

          <Button
            variant="outlined"
            startIcon={<BadgeIcon />}
            onClick={() => setQrGenOpen(true)}
            sx={{
              borderRadius: '9px',
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#0088FF',
              color: '#0088FF',
              bgcolor: '#FFFFFF',
              '&:hover': { bgcolor: '#F0F7FF', borderColor: '#0070D4' }
            }}
          >
            Member QR Codes
          </Button>

          <Button
            variant="outlined"
            startIcon={<KeyboardIcon />}
            onClick={() => setManualOpen(true)}
            sx={{
              borderRadius: '9px',
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#E2E8F0',
              color: '#334155',
              bgcolor: '#FFFFFF',
              '&:hover': { bgcolor: '#F8FAFC' }
            }}
          >
            Manual / Gun Scan
          </Button>

          <Button
            variant="contained"
            startIcon={<CameraIcon />}
            onClick={() => setCameraOpen(true)}
            sx={{
              borderRadius: '9px',
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#0088FF',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(0, 136, 255, 0.35)',
              px: 2.5,
              '&:hover': { bgcolor: '#0070D4' }
            }}
          >
            Start Camera Scanner
          </Button>
        </Stack>
      </Stack>

      {/* KPI Stats Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Total Scans */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              bgcolor: '#FFFFFF',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                bgcolor: '#0088FF'
              }}
            />
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Total Scans
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                    {statsLoading ? <CircularProgress size={24} /> : (stats?.totalScans || 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    bgcolor: '#EFF8FF',
                    color: '#0088FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <QrCodeIcon sx={{ fontSize: 28 }} />
                </Box>
              </Stack>
              <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
                <TrendingUpIcon sx={{ fontSize: 16 }} /> All-time verification count
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Today's Scans */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              bgcolor: '#FFFFFF',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                bgcolor: '#10B981'
              }}
            />
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Today's Scans
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                    {statsLoading ? <CircularProgress size={24} /> : (stats?.todayScans || 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    bgcolor: '#ECFDF5',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <TodayIcon sx={{ fontSize: 28 }} />
                </Box>
              </Stack>
              <Typography variant="caption" sx={{ color: '#0369A1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
                <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981', display: 'inline-block' }} /> Live activity today
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Unique Users Scanned */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              bgcolor: '#FFFFFF',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                bgcolor: '#8B5CF6'
              }}
            />
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Unique Members
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                    {statsLoading ? <CircularProgress size={24} /> : (stats?.uniqueUsers || 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    bgcolor: '#F5F3FF',
                    color: '#8B5CF6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <UsersIcon sx={{ fontSize: 28 }} />
                </Box>
              </Stack>
              <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
                Verified community members
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Past 7 Days Volume */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              bgcolor: '#FFFFFF',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                bgcolor: '#F59E0B'
              }}
            />
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    7-Day Volume
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                    {statsLoading ? <CircularProgress size={24} /> : (stats?.weekScans || 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    bgcolor: '#FEF3C7',
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <VerifiedIcon sx={{ fontSize: 28 }} />
                </Box>
              </Stack>
              <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
                Weekly pass frequency
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analytics Charts Row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Daily Scan Trend */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: 'none', bgcolor: '#FFFFFF', p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  7-Day Scan Frequency
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Daily count of verified passes and check-ins
                </Typography>
              </Box>
            </Stack>
            <Box sx={{ width: '100%', height: 230 }}>
              {stats?.trend && stats.trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0088FF" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0088FF" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} allowDecimals={false} />
                    <ChartTooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#FFFFFF',
                        fontSize: '12px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#0088FF"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#scanGradient)"
                      name="Scans"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No scan data recorded yet.
                  </Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Scans by Role Breakdown */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: 'none', bgcolor: '#FFFFFF', p: 2.5 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                Scans by Member Role
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Distribution across user categories
              </Typography>
            </Box>
            <Box sx={{ width: '100%', height: 230 }}>
              {stats?.scansByRole && stats.scansByRole.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.scansByRole} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="role" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} allowDecimals={false} />
                    <ChartTooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#FFFFFF',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} name="Scans" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No role breakdown available yet.
                  </Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Top Scanned Members Banner */}
      {stats?.topScannedUsers && stats.topScannedUsers.length > 0 && (
        <Card sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', mb: 3, p: 2, bgcolor: '#F8FAFC' }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <BadgeIcon sx={{ color: '#0088FF', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
              Most Frequent Scans (Top Members)
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            {stats.topScannedUsers.map((topUser) => (
              <Chip
                key={topUser._id}
                avatar={
                  <Avatar src={topUser.profilePhoto?.url} sx={{ width: 24, height: 24 }}>
                    {topUser.name?.charAt(0)}
                  </Avatar>
                }
                label={
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8 }}>
                    <strong>{topUser.name}</strong>
                    <Typography component="span" sx={{ fontSize: 11, color: '#64748B' }}>
                      ({topUser.role})
                    </Typography>
                    <Box
                      component="span"
                      sx={{
                        bgcolor: '#0088FF',
                        color: '#FFFFFF',
                        px: 0.8,
                        py: 0.1,
                        borderRadius: '10px',
                        fontSize: 11,
                        fontWeight: 700
                      }}
                    >
                      {topUser.qrScanCount} scans
                    </Box>
                  </Box>
                }
                onClick={() => navigate(`/profile/${topUser._id}`)}
                sx={{
                  bgcolor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  py: 1.8,
                  px: 0.5,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#F1F5F9' }
                }}
              />
            ))}
          </Stack>
        </Card>
      )}

      {/* Live / Real-Time Scan History Table Card */}
      <Card sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: 'none', bgcolor: '#FFFFFF', overflow: 'hidden' }}>
        {/* Filter Toolbar */}
        <Box sx={{ p: 2.5, borderBottom: '1px solid #F1F5F9' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
            <TextField
              size="small"
              placeholder="Search by student name, reg no, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94A3B8' }} />
                    </InputAdornment>
                  )
                }
              }}
              sx={{ width: { xs: '100%', md: 380 } }}
            />

            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ width: { xs: '100%', md: 'auto' } }}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Scan Purpose</InputLabel>
                <Select
                  value={filterScanType}
                  label="Scan Purpose"
                  onChange={(e) => setFilterScanType(e.target.value)}
                >
                  <MenuItem value="ALL">All Purposes</MenuItem>
                  {SCAN_TYPES.map(t => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={filterRole}
                  label="Role"
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <MenuItem value="ALL">All Roles</MenuItem>
                  <MenuItem value="STUDENT">Student</MenuItem>
                  <MenuItem value="ALUMNI">Alumni</MenuItem>
                  <MenuItem value="STAFF">Staff</MenuItem>
                  <MenuItem value="MEMBER">Member</MenuItem>
                  <MenuItem value="WARDEN">Warden</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleExportCsv}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: '#E2E8F0',
                  color: '#475467',
                  height: 40
                }}
              >
                Export CSV
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Logs Table */}
        <TableContainer sx={{ minHeight: 320 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#475467', fontSize: 13 }}>Member / Student</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475467', fontSize: 13 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475467', fontSize: 13 }}>Scan Purpose</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475467', fontSize: 13 }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475467', fontSize: 13 }}>Verified By</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475467', fontSize: 13 }}>User Scans</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#475467', fontSize: 13 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#475467', fontSize: 13 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logsLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" sx={{ color: '#64748B', fontWeight: 600 }}>
                      No QR scan logs found.
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.5 }}>
                      Use the Camera Scanner or Manual Input above to record your first member verification.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const roleStyle = ROLE_COLORS[log.user?.role] || ROLE_COLORS.MEMBER;
                  return (
                    <TableRow key={log._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      {/* Member Info */}
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            src={log.user?.profilePhoto?.url}
                            alt={log.user?.name}
                            sx={{ width: 38, height: 38, border: '1px solid #E2E8F0' }}
                          >
                            {log.user?.name?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 700,
                                color: '#0F172A',
                                cursor: 'pointer',
                                '&:hover': { color: '#0088FF' }
                              }}
                              onClick={() => log.user?._id && navigate(`/profile/${log.user._id}`)}
                            >
                              {log.user?.name || 'Unknown Member'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                              Reg: {log.user?.registrationNumber || log.user?.memberInfo?.registrationNo || 'N/A'}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Role Badge */}
                      <TableCell>
                        <Chip
                          size="small"
                          label={log.user?.role || 'MEMBER'}
                          sx={{
                            fontWeight: 700,
                            fontSize: 11,
                            bgcolor: roleStyle.bg,
                            color: roleStyle.color,
                            border: `1px solid ${roleStyle.border}`
                          }}
                        />
                      </TableCell>

                      {/* Scan Purpose */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                          {SCAN_TYPES.find(t => t.value === log.scanType)?.label || log.scanType}
                        </Typography>
                        {log.notes && (
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                            {log.notes}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Scanned Timestamp */}
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 500 }}>
                          {new Date(log.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                          {new Date(log.scannedAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>

                      {/* Verified By */}
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>
                          {log.scannedBy?.name || 'Admin'}
                        </Typography>
                      </TableCell>

                      {/* User's Total Scans */}
                      <TableCell>
                        <Chip
                          size="small"
                          label={`${log.user?.qrScanCount || 1} scans`}
                          sx={{
                            fontWeight: 700,
                            bgcolor: '#F1F5F9',
                            color: '#334155'
                          }}
                        />
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {log.status === 'VALID' ? (
                          <Chip
                            size="small"
                            icon={<ValidIcon sx={{ fontSize: '14px !important', color: '#166534 !important' }} />}
                            label="Verified"
                            sx={{ bgcolor: '#F0FDF4', color: '#166534', fontWeight: 700, border: '1px solid #BBF7D0' }}
                          />
                        ) : log.status === 'SUSPENDED' ? (
                          <Chip
                            size="small"
                            icon={<InvalidIcon sx={{ fontSize: '14px !important', color: '#991B1B !important' }} />}
                            label="Suspended"
                            sx={{ bgcolor: '#FEF2F2', color: '#991B1B', fontWeight: 700, border: '1px solid #FECACA' }}
                          />
                        ) : (
                          <Chip
                            size="small"
                            icon={<WarningIcon sx={{ fontSize: '14px !important', color: '#854D0E !important' }} />}
                            label={log.status}
                            sx={{ bgcolor: '#FEFCE8', color: '#854D0E', fontWeight: 700, border: '1px solid #FEF08A' }}
                          />
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View Profile">
                            <IconButton
                              size="small"
                              onClick={() => log.user?._id && navigate(`/profile/${log.user._id}`)}
                              sx={{ color: '#64748B', '&:hover': { color: '#0088FF' } }}
                            >
                              <ArrowForwardIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Entry">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteLog(log._id)}
                              sx={{ color: '#64748B', '&:hover': { color: '#EF4444' } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination Bar */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9' }}>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Showing <strong>{logs.length}</strong> of <strong>{totalLogs}</strong> scan logs
          </Typography>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, p) => {
              setPage(p);
              fetchLogs(p);
            }}
            color="primary"
            shape="rounded"
          />
        </Box>
      </Card>

      {/* Camera Scanner Viewfinder Dialog */}
      <Dialog
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '20px', overflow: 'hidden' }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, bgcolor: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CameraIcon sx={{ color: '#0088FF' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 17 }}>
              Live Camera QR Scanner
            </Typography>
          </Stack>
          <IconButton onClick={() => setCameraOpen(false)} sx={{ color: '#94A3B8' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, bgcolor: '#000000', position: 'relative' }}>
          {cameraError ? (
            <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#FFFFFF' }}>
              <Alert severity="error" sx={{ mb: 2 }}>{cameraError}</Alert>
              <Button variant="contained" onClick={startCamera}>Retry Camera</Button>
            </Box>
          ) : (
            <Box sx={{ position: 'relative', width: '100%', height: 380, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video
                ref={videoRef}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Viewfinder Overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  width: 240,
                  height: 240,
                  border: '2px solid rgba(0, 136, 255, 0.8)',
                  borderRadius: '16px',
                  boxShadow: '0 0 0 4000px rgba(0, 0, 0, 0.45)',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    width: '100%',
                    height: 2,
                    bgcolor: '#0088FF',
                    boxShadow: '0 0 8px #0088FF',
                    animation: 'scanLaser 2s infinite ease-in-out'
                  }
                }}
              />

              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  color: '#FFFFFF',
                  bgcolor: 'rgba(0,0,0,0.6)',
                  px: 2,
                  py: 0.5,
                  borderRadius: '20px'
                }}
              >
                Point camera at student/member QR code
              </Typography>
            </Box>
          )}

          {/* Last Scanned Result Alert inside Scanner Dialog */}
          {lastScannedResult && (
            <Box sx={{ p: 2, bgcolor: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  src={lastScannedResult.user?.profilePhoto?.url}
                  sx={{ width: 48, height: 48, border: '2px solid #0088FF' }}
                >
                  {lastScannedResult.user?.name?.charAt(0)}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    {lastScannedResult.user?.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Role: {lastScannedResult.user?.role} | Reg: {lastScannedResult.user?.registrationNumber || lastScannedResult.user?.memberInfo?.registrationNo || 'N/A'}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: '#166534', fontWeight: 700 }}>
                    Verified! Total scans: {lastScannedResult.totalScans}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate(`/profile/${lastScannedResult.user?._id}`)}
                >
                  View
                </Button>
              </Stack>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC', justifyContent: 'space-between' }}>
          <FormControlLabel
            control={
              <Switch
                checked={continuousScan}
                onChange={(e) => setContinuousScan(e.target.checked)}
                color="primary"
              />
            }
            label={<Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600 }}>Continuous Scan</Typography>}
          />
          <Button onClick={() => setCameraOpen(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual Input / Barcode Scanner Gun Dialog */}
      <Dialog
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#0F172A' }}>
          Manual / Scanner Gun Input
        </DialogTitle>
        <form onSubmit={handleManualScanSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
              Scan with a USB/Bluetooth barcode gun or enter member ID, registration number, email, or phone.
            </Typography>

            <TextField
              autoFocus
              fullWidth
              label="QR Payload / Reg No / Email / Phone"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="e.g. 660a... or REG123"
              sx={{ mb: 2 }}
              required
            />

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Scan Purpose</InputLabel>
              <Select
                value={manualScanType}
                label="Scan Purpose"
                onChange={(e) => setManualScanType(e.target.value)}
              >
                {SCAN_TYPES.map(t => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              label="Notes (Optional)"
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              placeholder="e.g. Gate 1 pass"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setManualOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={manualSubmitting || !manualInput.trim()}
              sx={{ bgcolor: '#0088FF', '&:hover': { bgcolor: '#0070D4' } }}
            >
              {manualSubmitting ? <CircularProgress size={20} /> : 'Record Scan'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Member QR Code Generator & ID Badge Modal */}
      <Dialog
        open={qrGenOpen}
        onClose={() => setQrGenOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <QrCodeIcon sx={{ color: '#0088FF' }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Member QR Code & ID Card Generator
            </Typography>
          </Stack>
          <IconButton onClick={() => setQrGenOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {/* Member Search */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search member by name, phone, or reg number..."
            value={searchMemberQuery}
            onChange={(e) => {
              setSearchMemberQuery(e.target.value);
              handleSearchMembers(e.target.value);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94A3B8' }} />
                  </InputAdornment>
                )
              }
            }}
            sx={{ mb: 2 }}
          />

          {/* Member Selection Chips / Results */}
          <Box sx={{ maxHeight: 160, overflowY: 'auto', mb: 2.5 }}>
            {searchingMembers ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : memberSearchResults.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center">
                No members found matching query.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {memberSearchResults.map((m) => (
                  <Box
                    key={m._id}
                    onClick={() => setSelectedMemberForQr(m)}
                    sx={{
                      p: 1,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      border: selectedMemberForQr?._id === m._id ? '2px solid #0088FF' : '1px solid #E2E8F0',
                      bgcolor: selectedMemberForQr?._id === m._id ? '#EFF8FF' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      '&:hover': { bgcolor: '#F8FAFC' }
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar src={m.profilePhoto?.url} sx={{ width: 32, height: 32 }}>
                        {m.name?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 13.5 }}>
                          {m.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          Reg: {m.registrationNumber || m.memberInfo?.registrationNo || 'N/A'} | {m.phone || 'No phone'}
                        </Typography>
                      </Box>
                    </Stack>
                    <Chip size="small" label={m.role} sx={{ fontSize: 10, fontWeight: 700 }} />
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Printable Member ID Badge with QR Canvas */}
          {selectedMemberForQr ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Card
                sx={{
                  width: 320,
                  borderRadius: '16px',
                  border: '1px solid #CBD5E1',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                  textAlign: 'center',
                  bgcolor: '#FFFFFF'
                }}
              >
                {/* ID Badge Header */}
                <Box sx={{ bgcolor: '#0088FF', color: '#FFFFFF', p: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.05em' }}>
                    HOSTEL COMMUNITY
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    OFFICIAL MEMBER PASS
                  </Typography>
                </Box>

                <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar
                    src={selectedMemberForQr.profilePhoto?.url}
                    sx={{ width: 68, height: 68, border: '3px solid #0088FF', mb: 1 }}
                  >
                    {selectedMemberForQr.name?.charAt(0)}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: 16 }}>
                    {selectedMemberForQr.name}
                  </Typography>
                  <Chip
                    size="small"
                    label={selectedMemberForQr.role}
                    sx={{
                      fontWeight: 700,
                      mt: 0.5,
                      mb: 1.5,
                      bgcolor: '#EFF8FF',
                      color: '#0088FF',
                      border: '1px solid #B2DDFF'
                    }}
                  />

                  {/* QR Canvas */}
                  <Box sx={{ p: 1, border: '1px solid #E2E8F0', borderRadius: '12px', bgcolor: '#FFFFFF', mb: 1.5 }}>
                    <canvas ref={qrCanvasRef} style={{ display: 'block' }} />
                  </Box>

                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    ID: {selectedMemberForQr.registrationNumber || selectedMemberForQr.memberInfo?.registrationNo || selectedMemberForQr._id}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: 10 }}>
                    Scan with any terminal or barcode scanner to verify
                  </Typography>
                </Box>
              </Card>

              {/* Action Buttons */}
              <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadQr}
                  sx={{ bgcolor: '#0088FF', '&:hover': { bgcolor: '#0070D4' } }}
                >
                  Download QR Code
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => window.print()}
                >
                  Print Badge
                </Button>
              </Stack>
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center', color: '#94A3B8' }}>
              <QrCodeIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography variant="body2">
                Select a member above to generate their verifiable QR code and ID card pass.
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Global CSS for laser scan line animation */}
      <style>{`
        @keyframes scanLaser {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 96%; opacity: 1; }
          100% { top: 0%; opacity: 0.8; }
        }
      `}</style>
    </Box>
  );
}
