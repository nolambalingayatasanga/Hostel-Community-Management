import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  CircularProgress,
  Stack,
  Pagination,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Alert,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme
} from "@mui/material";
import {
  QrCodeScanner as QrScannerIcon,
  QrCode2 as QrCodeIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  OpenInNew as OpenInNewIcon,
  Check as CheckIcon,
  TrendingUp as TrendingUpIcon,
  Devices as DevicesIcon,
  Today as TodayIcon,
  TouchApp as ClickIcon,
  PhoneIphone as PhoneIcon,
  Computer as DesktopIcon,
  TabletMac as TabletIcon,
  DeleteOutlined as DeleteIcon,
  Link as LinkIcon,
  PlayArrow as PlayArrowIcon,
  FiberManualRecord as DotIcon,
  Edit as EditIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  FileDownload as FileDownloadIcon,
  WarningAmber as WarningIcon,
  InfoOutlined as InfoIcon,
  FilterList as FilterListIcon
} from "@mui/icons-material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from "recharts";
import { useSnackbar } from "notistack";
import QRCode from "qrcode";
import API from "../../api";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
};

const DeviceIcon = ({ type }) => {
  if (type === "mobile") return <PhoneIcon sx={{ fontSize: 18, color: "#0284C7" }} />;
  if (type === "tablet") return <TabletIcon sx={{ fontSize: 18, color: "#7C3AED" }} />;
  return <DesktopIcon sx={{ fontSize: 18, color: "#475467" }} />;
};

// Subtle background SVG wave for Screen 1 Overview Cards
const BottomWave = ({ color }) => (
  <svg
    viewBox="0 0 500 120"
    preserveAspectRatio="none"
    style={{
      position: "absolute",
      bottom: 0,
      left: 0,
      width: "100%",
      height: "44px",
      pointerEvents: "none",
      zIndex: 0
    }}
  >
    <path
      d="M0,40 C150,110 350,-20 500,50 L500,120 L0,120 Z"
      fill={color}
      opacity="0.12"
    />
  </svg>
);

export default function QrScanCount() {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const qrCanvasRef = useRef(null);

  // Active navigation tab (0: Overview, 1: QR & Links, 2: Analytics, 3: Activity Logs)
  const [activeTab, setActiveTab] = useState(0);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);
  const [copiedDirect, setCopiedDirect] = useState(false);
  const [copiedAccess, setCopiedAccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [testingClick, setTestingClick] = useState(false);
  const [page, setPage] = useState(1);

  // Update Link Dialog state
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [newRedirectUrl, setNewRedirectUrl] = useState("");
  const [regenerateQrCheck, setRegenerateQrCheck] = useState(false);
  const [updatingLink, setUpdatingLink] = useState(false);
  const [qrUpdatedBanner, setQrUpdatedBanner] = useState(false);

  // Activity Logs Filters
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [osFilter, setOsFilter] = useState("all");
  const [browserFilter, setBrowserFilter] = useState("all");

  // Delete log state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchLoginQr = useCallback(
    async (currentPage = page, silent = false) => {
      try {
        if (!silent) setLoading(true);
        const res = await API.get("/qr-scans/login-qr", {
          params: { page: currentPage, limit: 30 },
        });
        if (res.data?.success) {
          setData(res.data.data);
          if (res.data.data?.redirectUrl && !newRedirectUrl) {
            setNewRedirectUrl(res.data.data.redirectUrl);
          }
        }
      } catch (err) {
        if (!silent) {
          enqueueSnackbar(err.response?.data?.message || "Failed to load QR scan data", { variant: "error" });
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [page, enqueueSnackbar, newRedirectUrl]
  );

  useEffect(() => { fetchLoginQr(page); }, [page]);

  useEffect(() => {
    const timer = setInterval(() => fetchLoginQr(page, true), 10000);
    return () => clearInterval(timer);
  }, [fetchLoginQr, page]);

  useEffect(() => {
    if (!data?.qrTrackingLink || !qrCanvasRef.current) return;
    QRCode.toCanvas(qrCanvasRef.current, data.qrTrackingLink, {
      width: isMobile ? 180 : 200,
      margin: 1,
      color: { dark: "#0F172A", light: "#FFFFFF" },
    }).catch((err) => console.error("QR render error:", err));
  }, [data?.qrTrackingLink, isMobile, activeTab]);

  const directLinkUrl = data?.trackingLink || `${window.location.origin}/login`;

  const handleCopyText = async (text, setter, label) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      enqueueSnackbar(`${label} copied to clipboard`, { variant: "success" });
      setTimeout(() => setter(false), 2000);
    } catch {
      enqueueSnackbar("Unable to copy to clipboard", { variant: "error" });
    }
  };

  const handleTestDirectClick = async () => {
    try {
      setTestingClick(true);
      const res = await API.get("/qr-scans/track-direct");
      if (res.data?.success) {
        enqueueSnackbar("Direct Click successfully tracked! Count updated.", { variant: "success" });
        await fetchLoginQr(page, true);
      }
    } catch (_err) {
      window.open(directLinkUrl, "_blank", "noopener,noreferrer");
    } finally {
      setTestingClick(false);
    }
  };

  const handleDownloadQr = async (format = "png") => {
    try {
      setDownloading(true);
      const res = await API.get("/qr-scans/login-qr/download", { params: { format }, responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `kambi-connect-login-qr.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      enqueueSnackbar(`QR code downloaded as ${format.toUpperCase()}`, { variant: "success" });
    } catch {
      enqueueSnackbar("Failed to download QR code", { variant: "error" });
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenUpdateDialog = () => {
    setNewRedirectUrl(data?.redirectUrl || "https://www.kambi-connect.in/login");
    setRegenerateQrCheck(false);
    setUpdateDialogOpen(true);
  };

  const handleUpdateLinkSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newRedirectUrl.trim()) {
      enqueueSnackbar("Please enter a valid destination redirect URL", { variant: "warning" });
      return;
    }
    try {
      setUpdatingLink(true);
      const res = await API.put("/qr-scans/login-qr", {
        redirectUrl: newRedirectUrl.trim(),
        regenerateQr: regenerateQrCheck
      });
      if (res.data?.success) {
        setData(res.data.data);
        setUpdateDialogOpen(false);
        if (res.data.qrUpdated) {
          setQrUpdatedBanner(true);
          enqueueSnackbar("Destination updated and new QR code generated! Please download the new QR.", { variant: "warning", autoHideDuration: 6000 });
        } else {
          enqueueSnackbar("Destination link updated! Existing QR code and counts are preserved.", { variant: "success" });
        }
      }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || "Failed to update link", { variant: "error" });
    } finally {
      setUpdatingLink(false);
    }
  };

  const confirmDeleteSingle = async () => {
    if (!deleteTarget?._id) return;
    try {
      setDeleting(true);
      const res = await API.delete(`/qr-scans/login-qr/device/${deleteTarget._id}`, { params: { page, limit: 30 } });
      if (res.data?.success) {
        setData(res.data.data || null);
        if (!res.data.data) fetchLoginQr(page);
        enqueueSnackbar("Scan record deleted", { variant: "success" });
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
      }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || "Failed to delete record", { variant: "error" });
    } finally { setDeleting(false); }
  };

  // Filtered devices list for Tab 4 (Activity Logs)
  const filteredDevices = useMemo(() => {
    const list = data?.devices || [];
    return list.filter((item) => {
      if (deviceFilter !== "all" && (item.type || "desktop").toLowerCase() !== deviceFilter.toLowerCase()) {
        return false;
      }
      if (osFilter !== "all" && !String(item.os || "").toLowerCase().includes(osFilter.toLowerCase())) {
        return false;
      }
      if (browserFilter !== "all" && !String(item.browser || "").toLowerCase().includes(browserFilter.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [data?.devices, deviceFilter, osFilter, browserFilter]);

  const handleExportCsv = () => {
    const devices = filteredDevices;
    if (!devices.length) { enqueueSnackbar("No scan records to export", { variant: "info" }); return; }
    const headers = ["IP Address", "Device Type", "OS", "Browser", "Access Method", "Date", "Time"];
    const rows = devices.map((d) => [
      `"${d.ip || ""}"`, `"${d.type || ""}"`, `"${d.os || ""}"`,
      `"${d.browser || ""}"`, `"${d.accessType === "qr" ? "QR Scan" : "Direct Click"}"`,
      `"${formatDate(d.timestamp)}"`, `"${formatTime(d.timestamp)}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QR_Activity_Logs_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const navTabs = [
    { label: "Overview", icon: <DashboardIcon sx={{ fontSize: 19 }} /> },
    { label: "QR & Links", icon: <QrCodeIcon sx={{ fontSize: 19 }} /> },
    { label: "Analytics", icon: <TrendingUpIcon sx={{ fontSize: 19 }} /> },
    { label: "Activity Logs", icon: <HistoryIcon sx={{ fontSize: 19 }} /> }
  ];

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1440, mx: "auto" }}>

      {/* ── Persistent Warning when QR is updated ── */}
      {qrUpdatedBanner && (
        <Alert
          severity="warning"
          icon={<WarningIcon fontSize="inherit" />}
          onClose={() => setQrUpdatedBanner(false)}
          sx={{ mb: 2.5, borderRadius: "12px", fontWeight: 600 }}
          action={
            <Button size="small" color="inherit" onClick={() => handleDownloadQr("png")} sx={{ fontWeight: 700, textTransform: "none" }}>
              Download New QR
            </Button>
          }
        >
          Destination updated and new QR code generated! Please download and replace previous printed or distributed QR codes. All previous scan statistics remain preserved.
        </Alert>
      )}

      {/* ── Main Layout: Responsive Left Sidebar on Desktop, Top Tabs on Mobile ── */}
      <Grid container spacing={{ xs: 2, md: 3 }}>

        {/* ── Sidebar Column (Desktop) / Top Tabs (Mobile) ── */}
        <Grid size={{ xs: 12, md: 3, lg: 2.5 }}>
          <Card
            sx={{
              borderRadius: "18px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
              bgcolor: "#FFFFFF",
              p: { xs: 1.25, md: 2 }
            }}
          >
            {/* Sidebar Brand Header (Desktop) */}
            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1.5, mb: 2.5, px: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(2, 132, 199, 0.25)"
                }}
              >
                <QrScannerIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A", lineHeight: 1.15, fontSize: "0.95rem" }}>
                  QR Scanner
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.25 }}>
                  <DotIcon sx={{ fontSize: 9, color: "#16A34A" }} />
                  <Typography variant="caption" sx={{ color: "#16A34A", fontWeight: 700, fontSize: "0.7rem" }}>
                    Live Tracking
                  </Typography>
                </Stack>
              </Box>
            </Box>

            {/* Desktop Vertical Tabs / Mobile Horizontal Tabs */}
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              orientation={isMobile ? "horizontal" : "vertical"}
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
              sx={{
                "& .MuiTabs-indicator": { display: "none" },
                gap: 0.5,
                "& .MuiTab-root": {
                  minHeight: { xs: 40, md: 44 },
                  borderRadius: "12px",
                  justifyContent: { xs: "center", md: "flex-start" },
                  textAlign: "left",
                  px: { xs: 1.5, md: 2 },
                  py: 1,
                  mb: { xs: 0, md: 0.75 },
                  mr: { xs: 0.75, md: 0 },
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: { xs: "0.82rem", md: "0.9rem" },
                  color: "#64748B",
                  transition: "all 0.18s ease-in-out",
                  "&:hover": {
                    bgcolor: "#F8FAFC",
                    color: "#0F172A"
                  },
                  "&.Mui-selected": {
                    bgcolor: "#EFF8FF",
                    color: "#0284C7",
                    fontWeight: 800,
                    boxShadow: "0 1px 4px rgba(2, 132, 199, 0.08)"
                  }
                }
              }}
            >
              {navTabs.map((item, idx) => (
                <Tab
                  key={item.label}
                  icon={item.icon}
                  iconPosition="start"
                  label={item.label}
                  id={`qr-tab-${idx}`}
                />
              ))}
            </Tabs>

            <Divider sx={{ my: { xs: 1, md: 2 } }} />

            {/* Quick Refresh & Live Indicator */}
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ px: { xs: 0.5, md: 1 } }}>
              <Button
                fullWidth
                size="small"
                variant="outlined"
                startIcon={loading ? <CircularProgress size={14} /> : <RefreshIcon sx={{ fontSize: 16 }} />}
                onClick={() => fetchLoginQr(page)}
                disabled={loading}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  borderColor: "#E2E8F0",
                  color: "#475569",
                  bgcolor: "#FFFFFF",
                  py: 0.6,
                  "&:hover": { bgcolor: "#F8FAFC" }
                }}
              >
                Refresh Data
              </Button>
            </Stack>
          </Card>
        </Grid>

        {/* ── Main Content Column ── */}
        <Grid size={{ xs: 12, md: 9, lg: 9.5 }}>

          {/* ══════════════════════════════════════════════════════════
              SCREEN 1: OVERVIEW TAB
             ══════════════════════════════════════════════════════════ */}
          {activeTab === 0 && (
            <Box>
              <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
                {/* 1. TOTAL SCANS */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card sx={{ borderRadius: "18px", border: "1px solid #EBF0F5", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", bgcolor: "#FFFFFF", position: "relative", overflow: "hidden", minHeight: 180, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <CardContent sx={{ p: 2.5, position: "relative", zIndex: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Box sx={{ width: 42, height: 42, borderRadius: "12px", bgcolor: "#EFF8FF", color: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <QrCodeIcon sx={{ fontSize: 24 }} />
                          </Box>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", fontSize: "0.75rem" }}>
                            TOTAL SCANS
                          </Typography>
                        </Stack>
                        <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: "#F0F9FF", color: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <TrendingUpIcon sx={{ fontSize: 16 }} />
                        </Box>
                      </Stack>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
                          {Number(data?.scanCount || 0).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 500, mt: 0.75, fontSize: "0.85rem" }}>
                          Camera scans
                        </Typography>
                      </Box>
                    </CardContent>
                    <BottomWave color="#0284C7" />
                  </Card>
                </Grid>

                {/* 2. DIRECT CLICKS */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card sx={{ borderRadius: "18px", border: "1px solid #EBF0F5", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", bgcolor: "#FFFFFF", position: "relative", overflow: "hidden", minHeight: 180, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <CardContent sx={{ p: 2.5, position: "relative", zIndex: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Box sx={{ width: 42, height: 42, borderRadius: "12px", bgcolor: "#F0FDF4", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ClickIcon sx={{ fontSize: 22 }} />
                          </Box>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", fontSize: "0.75rem" }}>
                            DIRECT CLICKS
                          </Typography>
                        </Stack>
                        <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: "#DCFCE7", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <TrendingUpIcon sx={{ fontSize: 16 }} />
                        </Box>
                      </Stack>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
                          {Number(data?.clickCount || 0).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 500, mt: 0.75, fontSize: "0.85rem" }}>
                          Link opened directly
                        </Typography>
                      </Box>
                    </CardContent>
                    <BottomWave color="#16A34A" />
                  </Card>
                </Grid>

                {/* 3. TODAY'S ACTIVITY */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card sx={{ borderRadius: "18px", border: "1px solid #EBF0F5", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", bgcolor: "#FFFFFF", position: "relative", overflow: "hidden", minHeight: 180, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <CardContent sx={{ p: 2.5, position: "relative", zIndex: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Box sx={{ width: 42, height: 42, borderRadius: "12px", bgcolor: "#FEF9C3", color: "#CA8A04", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <TodayIcon sx={{ fontSize: 22 }} />
                          </Box>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", fontSize: "0.75rem" }}>
                            TODAY'S ACTIVITY
                          </Typography>
                        </Stack>
                        <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: "#FEF08A", color: "#CA8A04", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <TrendingUpIcon sx={{ fontSize: 16 }} />
                        </Box>
                      </Stack>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
                          {(Number(data?.todayScans || 0) + Number(data?.todayClicks || 0)).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 500, mt: 0.75, fontSize: "0.85rem" }}>
                          Scans & clicks today
                        </Typography>
                      </Box>
                    </CardContent>
                    <BottomWave color="#EAB308" />
                  </Card>
                </Grid>

                {/* 4. UNIQUE DEVICES */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card sx={{ borderRadius: "18px", border: "1px solid #EBF0F5", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", bgcolor: "#FFFFFF", position: "relative", overflow: "hidden", minHeight: 180, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <CardContent sx={{ p: 2.5, position: "relative", zIndex: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Box sx={{ width: 42, height: 42, borderRadius: "12px", bgcolor: "#F3E8FF", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <DevicesIcon sx={{ fontSize: 22 }} />
                          </Box>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", fontSize: "0.75rem" }}>
                            UNIQUE DEVICES
                          </Typography>
                        </Stack>
                        <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: "#EDE9FE", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <DevicesIcon sx={{ fontSize: 16 }} />
                        </Box>
                      </Stack>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
                          {Number(data?.uniqueDeviceCount || 0).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 500, mt: 0.75, fontSize: "0.85rem" }}>
                          Distinct devices
                        </Typography>
                      </Box>
                    </CardContent>
                    <BottomWave color="#8B5CF6" />
                  </Card>
                </Grid>

                {/* 5. TOTAL LINKS */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card sx={{ borderRadius: "18px", border: "1px solid #EBF0F5", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", bgcolor: "#FFFFFF", position: "relative", overflow: "hidden", minHeight: 180, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <CardContent sx={{ p: 2.5, position: "relative", zIndex: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Box sx={{ width: 42, height: 42, borderRadius: "12px", bgcolor: "#FFE4E6", color: "#E11D48", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <TrendingUpIcon sx={{ fontSize: 22 }} />
                          </Box>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", letterSpacing: "0.06em", textTransform: "uppercase", fontSize: "0.75rem" }}>
                            TOTAL LINKS
                          </Typography>
                        </Stack>
                        <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: "#FFE4E6", color: "#E11D48", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <TrendingUpIcon sx={{ fontSize: 16 }} />
                        </Box>
                      </Stack>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: "#0F172A", lineHeight: 1 }}>
                          {Number(data?.totalDriveLinks || 3).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 500, mt: 0.75, fontSize: "0.85rem" }}>
                          Active drive links
                        </Typography>
                      </Box>
                    </CardContent>
                    <BottomWave color="#E11D48" />
                  </Card>
                </Grid>

                {/* 6. SHARE YOUR LINKS */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card sx={{ borderRadius: "18px", border: "1px solid #E0F2FE", bgcolor: "#F0F9FF", minHeight: 180, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "#BAE6FD", color: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <LinkIcon sx={{ fontSize: 20 }} />
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0369A1", fontSize: "0.95rem" }}>
                          Share your links
                        </Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ color: "#475569", fontSize: "0.82rem", lineHeight: 1.4, mb: 2 }}>
                        Create and share drive links with QR codes for easy access.
                      </Typography>
                      <Button
                        variant="contained"
                        endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                        onClick={() => navigate("/drive")}
                        sx={{
                          bgcolor: "#0284C7",
                          textTransform: "none",
                          fontWeight: 700,
                          borderRadius: "10px",
                          fontSize: "0.82rem",
                          px: 2.5,
                          boxShadow: "0 2px 8px rgba(2, 132, 199, 0.3)",
                          "&:hover": { bgcolor: "#0369A1" }
                        }}
                      >
                        Create New Link
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* ══════════════════════════════════════════════════════════
              SCREEN 2: QR & DIRECT LINKS TAB
             ══════════════════════════════════════════════════════════ */}
          {activeTab === 1 && (
            <Box>
              <Grid container spacing={{ xs: 2, md: 2.5 }}>
                {/* Left Card: QR CODE */}
                <Grid size={{ xs: 12, md: 5.5 }}>
                  <Card sx={{ borderRadius: "18px", border: "1px solid #E2E8F0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", bgcolor: "#FFFFFF", p: 3, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <Box>
                      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2.5 }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: "12px", bgcolor: "#EFF8FF", color: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <QrCodeIcon sx={{ fontSize: 24 }} />
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1E293B", letterSpacing: "0.04em" }}>
                          QR CODE
                        </Typography>
                      </Stack>

                      {/* QR Canvas Container */}
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", my: 1 }}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: "16px",
                            bgcolor: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                            display: "inline-flex"
                          }}
                        >
                          <canvas ref={qrCanvasRef} style={{ display: "block" }} />
                        </Box>

                        {/* Code badge with copy */}
                        {data?.code && (
                          <Box sx={{ mt: 2, display: "inline-flex", alignItems: "center", gap: 1, bgcolor: "#EFF8FF", px: 2, py: 0.75, borderRadius: "20px", border: "1px solid #BAE6FD" }}>
                            <Typography sx={{ color: "#0284C7", fontWeight: 700, fontSize: "0.85rem", fontFamily: "monospace" }}>
                              Code: {data.code}
                            </Typography>
                            <Tooltip title="Copy Code">
                              <IconButton size="small" onClick={() => handleCopyText(data.code, setCopiedCode, "Code")} sx={{ color: "#0284C7", p: 0.25 }}>
                                {copiedCode ? <CheckIcon sx={{ fontSize: 15 }} /> : <CopyIcon sx={{ fontSize: 15 }} />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </Box>
                    </Box>

                    {/* Download Buttons */}
                    <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={downloading ? <CircularProgress size={16} /> : <DownloadIcon />}
                        onClick={() => handleDownloadQr("png")}
                        disabled={downloading}
                        sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, borderColor: "#CBD5E1", color: "#334155" }}
                      >
                        Download PNG
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadQr("svg")}
                        disabled={downloading}
                        sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, borderColor: "#CBD5E1", color: "#334155" }}
                      >
                        Download SVG
                      </Button>
                    </Stack>
                  </Card>
                </Grid>

                {/* Right Card: DIRECT PORTAL LINK (TRACKS CLICKS) */}
                <Grid size={{ xs: 12, md: 6.5 }}>
                  <Card sx={{ borderRadius: "18px", border: "1px solid #E2E8F0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", bgcolor: "#FFFFFF", p: 3, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <Box>
                      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2.5 }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: "12px", bgcolor: "#F0FDF4", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <LinkIcon sx={{ fontSize: 24 }} />
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#1E293B", letterSpacing: "0.04em" }}>
                          DIRECT PORTAL LINK (TRACKS CLICKS)
                        </Typography>
                      </Stack>

                      {/* URL Box */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 1.5,
                          borderRadius: "12px",
                          border: "1px solid #CBD5E1",
                          bgcolor: "#FFFFFF",
                          mb: 2
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: "monospace",
                            fontSize: "0.88rem",
                            fontWeight: 600,
                            color: "#1E293B",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            pr: 1
                          }}
                        >
                          {directLinkUrl}
                        </Typography>
                        <Tooltip title="Copy Direct Link">
                          <IconButton size="small" onClick={() => handleCopyText(directLinkUrl, setCopiedDirect, "Direct portal link")} sx={{ color: "#64748B" }}>
                            {copiedDirect ? <CheckIcon sx={{ fontSize: 18, color: "#16A34A" }} /> : <CopyIcon sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </Tooltip>
                      </Box>

                      {/* Action Buttons */}
                      <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
                        <Button
                          variant="outlined"
                          fullWidth
                          startIcon={testingClick ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon sx={{ fontSize: 18 }} />}
                          onClick={handleTestDirectClick}
                          disabled={testingClick}
                          sx={{
                            borderRadius: "10px",
                            textTransform: "none",
                            fontWeight: 700,
                            color: "#16A34A",
                            borderColor: "#86EFAC",
                            bgcolor: "#FFFFFF",
                            py: 1,
                            "&:hover": { bgcolor: "#F0FDF4", borderColor: "#4ADE80" }
                          }}
                        >
                          Test Direct Click
                        </Button>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={copiedDirect ? <CheckIcon sx={{ fontSize: 18 }} /> : <CopyIcon sx={{ fontSize: 18 }} />}
                          onClick={() => handleCopyText(directLinkUrl, setCopiedDirect, "Direct portal link")}
                          sx={{
                            borderRadius: "10px",
                            textTransform: "none",
                            fontWeight: 700,
                            bgcolor: "#16A34A",
                            py: 1,
                            boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)",
                            "&:hover": { bgcolor: "#15803D" }
                          }}
                        >
                          {copiedDirect ? "Copied" : "Copy Link"}
                        </Button>
                      </Stack>
                    </Box>

                    {/* Status Box */}
                    <Box sx={{ p: 2, borderRadius: "12px", bgcolor: "#F0FDF4", border: "1px solid #BBF7D0", display: "flex", alignItems: "center", gap: 1.5 }}>
                      <DotIcon sx={{ fontSize: 16, color: "#16A34A" }} />
                      <Box>
                        <Typography sx={{ fontWeight: 800, color: "#15803D", fontSize: "0.85rem" }}>
                          Link is active
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#4B7C59", fontWeight: 500 }}>
                          Clicks are being tracked & added to total analytics
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                {/* Bottom Card: Login Access Link + UPDATE LINK OPTION */}
                <Grid size={{ xs: 12 }}>
                  <Card sx={{ borderRadius: "18px", border: "1px solid #E2E8F0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", bgcolor: "#FFFFFF", p: { xs: 2, sm: 2.5 } }}>
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: "#EFF8FF", color: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <QrCodeIcon sx={{ fontSize: 24 }} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
                            Login Access Link
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#64748B", fontSize: "0.82rem" }}>
                            Redirects to <strong>{data?.redirectUrl || "https://www.kambi-connect.in/login"}</strong>
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ width: { xs: "100%", sm: "auto" }, justifyContent: "flex-end", flexWrap: "wrap", gap: 1 }}>
                        <Tooltip title="Copy destination URL">
                          <IconButton size="small" onClick={() => handleCopyText(data?.redirectUrl || "https://www.kambi-connect.in/login", setCopiedAccess, "Access link")} sx={{ border: "1px solid #E2E8F0", borderRadius: "9px" }}>
                            {copiedAccess ? <CheckIcon sx={{ fontSize: 18, color: "#16A34A" }} /> : <CopyIcon sx={{ fontSize: 18, color: "#64748B" }} />}
                          </IconButton>
                        </Tooltip>
                        <Button
                          variant="outlined"
                          size="small"
                          endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                          onClick={() => window.open(data?.redirectUrl || "https://www.kambi-connect.in/login", "_blank", "noopener,noreferrer")}
                          sx={{ textTransform: "none", fontWeight: 700, borderRadius: "10px", borderColor: "#CBD5E1", color: "#0284C7" }}
                        >
                          Open Link
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                          onClick={handleOpenUpdateDialog}
                          sx={{
                            textTransform: "none",
                            fontWeight: 700,
                            borderRadius: "10px",
                            bgcolor: "#0284C7",
                            "&:hover": { bgcolor: "#0369A1" }
                          }}
                        >
                          Update Link
                        </Button>
                      </Stack>
                    </Stack>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* ══════════════════════════════════════════════════════════
              SCREEN 3: ANALYTICS & TRENDS TAB
             ══════════════════════════════════════════════════════════ */}
          {activeTab === 2 && (
            <Box>
              <Grid container spacing={{ xs: 2, md: 2.5 }}>
                {/* Left: Weekly Area Chart */}
                <Grid size={{ xs: 12, lg: 8 }}>
                  <Card sx={{ borderRadius: "18px", border: "1px solid #E2E8F0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", bgcolor: "#FFFFFF", p: { xs: 2, sm: 3 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, bgcolor: "#EFF8FF", px: 1.5, py: 0.6, borderRadius: "16px", border: "1px solid #BAE6FD" }}>
                        <TrendingUpIcon sx={{ fontSize: 16, color: "#0284C7" }} />
                        <Typography sx={{ color: "#0284C7", fontWeight: 800, fontSize: "0.82rem" }}>
                          {data?.weekScans || 100} scans this week
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Chart Container */}
                    <Box sx={{ width: "100%", height: 320, mt: 1 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="qrColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="clickColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#16A34A" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="day" tickLine={false} axisLine={{ stroke: "#E2E8F0" }} tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }} />
                          <YAxis tickLine={false} axisLine={{ stroke: "#E2E8F0" }} tick={{ fill: "#64748B", fontSize: 12 }} allowDecimals={false} />
                          <ChartTooltip
                            contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}
                          />
                          <Area type="monotone" dataKey="scans" stroke="#0284C7" strokeWidth={3} fillOpacity={1} fill="url(#qrColor)" name="QR Scans" />
                          <Area type="monotone" dataKey="clicks" stroke="#16A34A" strokeWidth={3} fillOpacity={1} fill="url(#clickColor)" name="Direct Clicks" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>

                    {/* Legend */}
                    <Stack direction="row" spacing={3} justifyContent="center" sx={{ mt: 2 }}>
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <DotIcon sx={{ fontSize: 14, color: "#0284C7" }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155" }}>QR Scans</Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <DotIcon sx={{ fontSize: 14, color: "#16A34A" }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155" }}>Direct Clicks</Typography>
                      </Stack>
                    </Stack>
                  </Card>
                </Grid>

                {/* Right: 3 Stacked Metric Cards */}
                <Grid size={{ xs: 12, lg: 4 }}>
                  <Stack spacing={2}>
                    {/* Card 1: Total Scans */}
                    <Card sx={{ borderRadius: "18px", border: "1px solid #E2E8F0", p: 2.5, bgcolor: "#FFFFFF" }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: "#EFF8FF", color: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <QrCodeIcon sx={{ fontSize: 24 }} />
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 700 }}>
                              Total Scans
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: "#0F172A", lineHeight: 1.1 }}>
                              {Number(data?.scanCount || 0).toLocaleString()}
                            </Typography>
                          </Box>
                        </Stack>
                        <Chip
                          label={`+${data?.scanGrowth ?? 78}% vs last week`}
                          size="small"
                          sx={{ bgcolor: "#DCFCE7", color: "#166534", fontWeight: 800, fontSize: "0.72rem", height: 24 }}
                        />
                      </Stack>
                    </Card>

                    {/* Card 2: Total Clicks */}
                    <Card sx={{ borderRadius: "18px", border: "1px solid #E2E8F0", p: 2.5, bgcolor: "#FFFFFF" }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: "#F0FDF4", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <LinkIcon sx={{ fontSize: 24 }} />
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 700 }}>
                              Total Clicks
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: "#0F172A", lineHeight: 1.1 }}>
                              {Number(data?.clickCount || 0).toLocaleString()}
                            </Typography>
                          </Box>
                        </Stack>
                        <Chip
                          label={`${data?.clickGrowth ?? 0}% vs last week`}
                          size="small"
                          sx={{ bgcolor: "#F1F5F9", color: "#475569", fontWeight: 800, fontSize: "0.72rem", height: 24 }}
                        />
                      </Stack>
                    </Card>

                    {/* Card 3: Unique Devices */}
                    <Card sx={{ borderRadius: "18px", border: "1px solid #E2E8F0", p: 2.5, bgcolor: "#FFFFFF" }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{ width: 44, height: 44, borderRadius: "12px", bgcolor: "#F3E8FF", color: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <DevicesIcon sx={{ fontSize: 24 }} />
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 700 }}>
                              Unique Devices
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: "#0F172A", lineHeight: 1.1 }}>
                              {Number(data?.uniqueDeviceCount || 0).toLocaleString()}
                            </Typography>
                          </Box>
                        </Stack>
                        <Chip
                          label={`+${data?.deviceGrowth ?? 62}% vs last week`}
                          size="small"
                          sx={{ bgcolor: "#DCFCE7", color: "#166534", fontWeight: 800, fontSize: "0.72rem", height: 24 }}
                        />
                      </Stack>
                    </Card>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* ══════════════════════════════════════════════════════════
              SCREEN 4: ACTIVITY LOGS TAB
             ══════════════════════════════════════════════════════════ */}
          {activeTab === 3 && (
            <Box>
              <Card sx={{ borderRadius: "18px", border: "1px solid #E2E8F0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", bgcolor: "#FFFFFF", overflow: "hidden" }}>
                {/* Header */}
                <Box sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: "1px solid #F1F5F9" }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <IconButton size="small" onClick={() => setActiveTab(0)} sx={{ color: "#64748B" }}>
                      <ArrowBackIcon fontSize="small" />
                    </IconButton>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A", fontSize: "1.05rem" }}>
                        Device & Time Activity Log
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748B" }}>
                        Records device type, OS, browser, IP address, access method, and exact timestamp.
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Filter Toolbar */}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }} sx={{ mt: 2.5, flexWrap: "wrap", gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                      <InputLabel sx={{ fontSize: 13 }}>All Devices</InputLabel>
                      <Select
                        value={deviceFilter}
                        label="All Devices"
                        onChange={(e) => setDeviceFilter(e.target.value)}
                        sx={{ borderRadius: "10px", fontSize: 13 }}
                      >
                        <MenuItem value="all">All Devices</MenuItem>
                        <MenuItem value="mobile">Mobile</MenuItem>
                        <MenuItem value="desktop">Desktop</MenuItem>
                        <MenuItem value="tablet">Tablet</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel sx={{ fontSize: 13 }}>All OS</InputLabel>
                      <Select
                        value={osFilter}
                        label="All OS"
                        onChange={(e) => setOsFilter(e.target.value)}
                        sx={{ borderRadius: "10px", fontSize: 13 }}
                      >
                        <MenuItem value="all">All OS</MenuItem>
                        <MenuItem value="Android">Android</MenuItem>
                        <MenuItem value="iOS">iOS</MenuItem>
                        <MenuItem value="Windows">Windows</MenuItem>
                        <MenuItem value="macOS">macOS</MenuItem>
                        <MenuItem value="Linux">Linux</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 130 }}>
                      <InputLabel sx={{ fontSize: 13 }}>All Browsers</InputLabel>
                      <Select
                        value={browserFilter}
                        label="All Browsers"
                        onChange={(e) => setBrowserFilter(e.target.value)}
                        sx={{ borderRadius: "10px", fontSize: 13 }}
                      >
                        <MenuItem value="all">All Browsers</MenuItem>
                        <MenuItem value="Chrome">Chrome</MenuItem>
                        <MenuItem value="Safari">Safari</MenuItem>
                        <MenuItem value="Firefox">Firefox</MenuItem>
                        <MenuItem value="Edge">Edge</MenuItem>
                      </Select>
                    </FormControl>

                    {(deviceFilter !== "all" || osFilter !== "all" || browserFilter !== "all") && (
                      <Button
                        size="small"
                        onClick={() => { setDeviceFilter("all"); setOsFilter("all"); setBrowserFilter("all"); }}
                        sx={{ textTransform: "none", color: "#64748B", fontWeight: 700 }}
                      >
                        Reset Filters
                      </Button>
                    )}

                    <Box sx={{ ml: { sm: "auto !important" } }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<FileDownloadIcon sx={{ fontSize: 18 }} />}
                        onClick={handleExportCsv}
                        sx={{
                          borderRadius: "10px",
                          textTransform: "none",
                          fontWeight: 700,
                          color: "#334155",
                          borderColor: "#CBD5E1",
                          bgcolor: "#FFFFFF"
                        }}
                      >
                        Export CSV
                      </Button>
                    </Box>
                  </Stack>
                </Box>

                {/* Table */}
                <TableContainer>
                  <Table size="medium">
                    <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: "#64748B", fontSize: "0.78rem" }}>Device / OS / Browser</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#64748B", fontSize: "0.78rem" }}>IP Address</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#64748B", fontSize: "0.78rem" }}>Access Method</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#64748B", fontSize: "0.78rem" }}>Timestamp</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#64748B", fontSize: "0.78rem" }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredDevices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 6, color: "#94A3B8" }}>
                            No activity records found matching filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDevices.map((item) => {
                          const isQr = item.accessType === "qr";
                          return (
                            <TableRow key={item._id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                              <TableCell>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                  <DeviceIcon type={item.type} />
                                  <Box>
                                    <Typography sx={{ fontWeight: 700, color: "#0F172A", fontSize: "0.86rem" }}>
                                      {item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : "Device"}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.75rem" }}>
                                      ({item.os || "OS"} • {item.browser || "Browser"})
                                    </Typography>
                                  </Box>
                                </Stack>
                              </TableCell>
                              <TableCell sx={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#334155" }}>
                                {item.ip || "—"}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={isQr ? "QR Scan" : "Direct Click"}
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: "0.72rem",
                                    bgcolor: isQr ? "#EFF8FF" : "#F0FDF4",
                                    color: isQr ? "#0284C7" : "#16A34A",
                                    border: `1px solid ${isQr ? "#BAE6FD" : "#BBF7D0"}`,
                                    height: 22
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ color: "#64748B", fontSize: "0.82rem" }}>
                                {formatDate(item.timestamp)} {formatTime(item.timestamp)}
                              </TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  onClick={() => { setDeleteTarget(item); setDeleteDialogOpen(true); }}
                                  sx={{ color: "#94A3B8", "&:hover": { color: "#EF4444" } }}
                                >
                                  <DeleteIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                {data?.pagination?.totalPages > 1 && (
                  <Box sx={{ p: 2, display: "flex", justifyContent: "center", borderTop: "1px solid #F1F5F9" }}>
                    <Pagination
                      count={data.pagination.totalPages}
                      page={page}
                      onChange={(_, val) => setPage(val)}
                      color="primary"
                      shape="rounded"
                    />
                  </Box>
                )}
              </Card>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* ── UPDATE LINK DIALOG ── */}
      <Dialog
        open={updateDialogOpen}
        onClose={() => setUpdateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "18px" } }}
      >
        <form onSubmit={handleUpdateLinkSubmit}>
          <DialogTitle sx={{ fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 1 }}>
            <EditIcon sx={{ color: "#0284C7" }} />
            Update Destination Link
          </DialogTitle>
          <DialogContent dividers sx={{ p: 2.5 }}>
            <Typography variant="body2" sx={{ color: "#475569", mb: 2 }}>
              Update where visitors are redirected when scanning the QR code or clicking the direct portal link.
            </Typography>

            <TextField
              fullWidth
              label="Destination URL"
              value={newRedirectUrl}
              onChange={(e) => setNewRedirectUrl(e.target.value)}
              placeholder="https://www.kambi-connect.in/login"
              helperText="Target URL where users will land upon scanning or clicking."
              sx={{ mb: 2.5 }}
            />

            <Box sx={{ p: 2, bgcolor: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0", mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={regenerateQrCheck}
                    onChange={(e) => setRegenerateQrCheck(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#0F172A" }}>
                      Regenerate QR Code with a new code
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748B" }}>
                      Leave unchecked to keep current QR code (it will automatically redirect to the new destination). Check this if you require a brand new unique QR code.
                    </Typography>
                  </Box>
                }
              />
            </Box>

            <Alert severity="info" icon={<InfoIcon fontSize="inherit" />} sx={{ borderRadius: "10px", fontSize: "0.82rem" }}>
              <strong>All existing analytics are preserved:</strong> Your previous scan counts, direct clicks, and device history will remain untouched. Any new interactions will seamlessly accumulate on top of old counts.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setUpdateDialogOpen(false)} sx={{ textTransform: "none", fontWeight: 600 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={updatingLink}
              sx={{
                bgcolor: "#0284C7",
                textTransform: "none",
                fontWeight: 700,
                px: 3,
                "&:hover": { bgcolor: "#0369A1" }
              }}
            >
              {updatingLink ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Save & Update Link"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── DELETE SINGLE RECORD DIALOG ── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A" }}>Delete Activity Record?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this scan entry from {deleteTarget?.ip || "unknown IP"}? The overall scan count will adjust accordingly.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: "none", fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDeleteSingle} disabled={deleting} sx={{ textTransform: "none", fontWeight: 700 }}>
            {deleting ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
