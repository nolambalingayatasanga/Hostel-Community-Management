import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Alert,
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
  DeleteSweep as DeleteSweepIcon,
  Link as LinkIcon,
  PlayArrow as PlayArrowIcon,
  FiberManualRecord as DotIcon,
  AccessTime as TimeIcon,
  CalendarToday as DateIcon
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

const ACCESS_STYLES = {
  qr: { bg: "#EFF8FF", color: "#1D4ED8", border: "#BFDBFE", label: "QR Scan" },
  direct: { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0", label: "Direct Click" },
};

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

export default function QrScanCount() {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const qrCanvasRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState(null);
  const [copiedQr, setCopiedQr] = useState(false);
  const [copiedDirect, setCopiedDirect] = useState(false);
  const [testingClick, setTestingClick] = useState(false);
  const [page, setPage] = useState(1);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const fetchLoginQr = useCallback(
    async (currentPage = page, silent = false) => {
      try {
        if (!silent) setLoading(true);
        const res = await API.get("/qr-scans/login-qr", {
          params: { page: currentPage, limit: 10 },
        });
        if (res.data?.success) setData(res.data.data);
      } catch (err) {
        if (!silent) {
          enqueueSnackbar(err.response?.data?.message || "Failed to load QR scan data", { variant: "error" });
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [page, enqueueSnackbar],
  );

  useEffect(() => { fetchLoginQr(page); }, [page]);

  useEffect(() => {
    const timer = setInterval(() => fetchLoginQr(page, true), 10000);
    return () => clearInterval(timer);
  }, [fetchLoginQr, page]);

  useEffect(() => {
    if (!data?.qrTrackingLink || !qrCanvasRef.current) return;
    QRCode.toCanvas(qrCanvasRef.current, data.qrTrackingLink, {
      width: isMobile ? 160 : 180,
      margin: 1,
      color: { dark: "#0F172A", light: "#FFFFFF" },
    }).catch((err) => console.error("QR render error:", err));
  }, [data?.qrTrackingLink, isMobile]);

  const handleCopyQrLink = async () => {
    if (!data?.qrTrackingLink) return;
    try {
      await navigator.clipboard.writeText(data.qrTrackingLink);
      setCopiedQr(true);
      enqueueSnackbar("QR tracking link copied to clipboard", { variant: "success" });
      setTimeout(() => setCopiedQr(false), 2000);
    } catch {
      enqueueSnackbar("Unable to copy link", { variant: "error" });
    }
  };

  const handleCopyDirectLink = async () => {
    const directUrl = data?.trackingLink || (data?.code ? `${window.location.origin}/${data.code}` : "");
    if (!directUrl) return;
    try {
      await navigator.clipboard.writeText(directUrl);
      setCopiedDirect(true);
      enqueueSnackbar("Direct login link copied to clipboard", { variant: "success" });
      setTimeout(() => setCopiedDirect(false), 2000);
    } catch {
      enqueueSnackbar("Unable to copy link", { variant: "error" });
    }
  };

  // Test Direct Click: simulates or executes a direct link click and refreshes stats
  const handleTestDirectClick = async () => {
    try {
      setTestingClick(true);
      const res = await API.get("/qr-scans/track-direct");
      if (res.data?.success) {
        enqueueSnackbar("Direct Click successfully tracked! Count updated.", { variant: "success" });
        await fetchLoginQr(page, true);
      }
    } catch (_err) {
      // Fallback: open tracking link directly in new tab
      const directUrl = data?.trackingLink || (data?.code ? `${window.location.origin}/${data.code}` : "");
      if (directUrl) {
        window.open(directUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setTestingClick(false);
    }
  };

  const handleDownloadQr = async (format = "png") => {
    try {
      setDownloading(true);
      setDownloadFormat(format);
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
      setDownloadFormat(null);
    }
  };

  const handleExportCsv = () => {
    const devices = data?.devices || [];
    if (!devices.length) { enqueueSnackbar("No scan records to export", { variant: "info" }); return; }
    const headers = ["IP Address", "Device Type", "OS", "Browser", "Access Type", "Date", "Time"];
    const rows = devices.map((d) => [
      `"${d.ip || ""}"`, `"${d.type || ""}"`, `"${d.os || ""}"`,
      `"${d.browser || ""}"`, `"${d.accessType || ""}"`,
      `"${formatDate(d.timestamp)}"`, `"${formatTime(d.timestamp)}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QR_Scan_Devices_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds((data?.devices || []).map((d) => d._id).filter(Boolean));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const confirmDeleteSingle = async () => {
    if (!deleteTarget?._id) return;
    try {
      setDeleting(true);
      const res = await API.delete(`/qr-scans/login-qr/device/${deleteTarget._id}`, { params: { page, limit: 10 } });
      if (res.data?.success) {
        setData(res.data.data || null);
        if (!res.data.data) fetchLoginQr(page);
        setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget._id));
        enqueueSnackbar("Scan record deleted", { variant: "success" });
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
      }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || "Failed to delete scan record", { variant: "error" });
    } finally { setDeleting(false); }
  };

  const confirmDeleteBatch = async () => {
    if (!selectedIds.length) return;
    try {
      setDeleting(true);
      const res = await API.delete("/qr-scans/login-qr/devices", { data: { ids: selectedIds }, params: { page, limit: 10 } });
      if (res.data?.success) {
        setData(res.data.data || null);
        if (!res.data.data) fetchLoginQr(page);
        enqueueSnackbar(`${selectedIds.length} records deleted`, { variant: "success" });
        setSelectedIds([]);
        setBatchDeleteDialogOpen(false);
      }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || "Failed to delete selected records", { variant: "error" });
    } finally { setDeleting(false); }
  };

  const confirmClearAll = async () => {
    try {
      setDeleting(true);
      const res = await API.delete("/qr-scans/login-qr/devices", { data: { resetCounts: true }, params: { page: 1, limit: 10 } });
      if (res.data?.success) {
        setData(res.data.data || null);
        if (!res.data.data) fetchLoginQr(1);
        setPage(1);
        setSelectedIds([]);
        enqueueSnackbar("All scan logs and counts cleared", { variant: "success" });
        setClearDialogOpen(false);
      }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || "Failed to clear scan records", { variant: "error" });
    } finally { setDeleting(false); }
  };

  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };
  const directLinkUrl = data?.trackingLink || (data?.code ? `${window.location.origin}/${data.code}` : "Loading...");

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1400, mx: "auto" }}>

      {/* ── Top Header ── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: { xs: 40, sm: 46 },
              height: { xs: 40, sm: 46 },
              borderRadius: "14px",
              background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(2, 132, 199, 0.28)",
              flexShrink: 0
            }}
          >
            <QrScannerIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
          </Box>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
                QR & Link Analytics
              </Typography>
              <Chip
                size="small"
                icon={<DotIcon sx={{ fontSize: "10px !important", color: "#16A34A !important" }} />}
                label="LIVE"
                sx={{
                  bgcolor: "#DCFCE7",
                  color: "#166534",
                  fontWeight: 800,
                  fontSize: 10,
                  height: 20,
                  border: "1px solid #BBF7D0",
                  display: { xs: "none", sm: "inline-flex" }
                }}
              />
            </Stack>
            <Typography variant="body2" sx={{ color: "#64748B", mt: 0.25, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
              Real-time traffic tracking for Kambi Connect portal login link & QR scans.
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            startIcon={loading ? <CircularProgress size={14} /> : <RefreshIcon sx={{ fontSize: 18 }} />}
            onClick={() => fetchLoginQr(page)}
            disabled={loading}
            sx={{
              borderRadius: "9px",
              textTransform: "none",
              fontWeight: 600,
              borderColor: "#E2E8F0",
              color: "#334155",
              bgcolor: "#FFFFFF",
              height: 38,
              px: 2,
              "&:hover": { bgcolor: "#F8FAFC", borderColor: "#CBD5E1" },
            }}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {/* ── Stat Cards (2x2 on Mobile, 4 in a row on Desktop) ── */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: 3 }}>
        {[
          { label: "Total Scans", value: data?.scanCount, color: "#0284C7", icon: <QrCodeIcon sx={{ fontSize: 22 }} />, sub: "Camera scans" },
          { label: "Direct Clicks", value: data?.clickCount, color: "#16A34A", icon: <ClickIcon sx={{ fontSize: 22 }} />, sub: "Link opened directly" },
          { label: "Today's Activity", value: (Number(data?.todayScans || 0) + Number(data?.todayClicks || 0)), color: "#EAB308", icon: <TodayIcon sx={{ fontSize: 22 }} />, sub: "Scans & clicks today" },
          { label: "Unique Devices", value: data?.uniqueDeviceCount, color: "#8B5CF6", icon: <DevicesIcon sx={{ fontSize: 22 }} />, sub: "Distinct devices" },
        ].map(({ label, value, color, icon, sub }) => (
          <Grid key={label} size={{ xs: 6, sm: 6, md: 3 }}>
            <Card
              sx={{
                borderRadius: "16px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                bgcolor: "#FFFFFF",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                  transform: "translateY(-2px)",
                  borderColor: "#CBD5E1"
                },
              }}
            >
              <CardContent sx={{ p: { xs: 1.75, sm: 2.25 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>
                      {label}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: "#0F172A", mt: 0.5, lineHeight: 1.1, fontSize: { xs: "1.35rem", sm: "1.75rem" } }}>
                      {loading && value == null ? <CircularProgress size={20} sx={{ color }} /> : Number(value || 0).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 500, mt: 0.75, display: "block", fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                      {sub}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: { xs: 36, sm: 42 },
                      height: { xs: 36, sm: 42 },
                      borderRadius: "10px",
                      bgcolor: `${color}15`,
                      color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    {icon}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Tracking Links & QR Panel ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>

        {/* QR & Direct Links Panel */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "none", bgcolor: "#FFFFFF", height: "100%" }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 }, display: "flex", flexDirection: "column", height: "100%" }}>

              {/* Card Header */}
              <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 0.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: "#EFF8FF", color: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <QrCodeIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
                    Login Access Links
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748B" }}>
                    Redirects to https://www.kambi-connect.in/login
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              {/* QR Canvas Display */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  py: 2.5,
                  px: 2,
                  mb: 2,
                  borderRadius: "12px",
                  bgcolor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                }}
              >
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "12px",
                    bgcolor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {loading && !data ? (
                    <CircularProgress size={28} />
                  ) : (
                    <canvas ref={qrCanvasRef} style={{ display: "block" }} />
                  )}
                </Box>
                {data?.code && (
                  <Chip
                    size="small"
                    label={`Code: ${data.code}`}
                    sx={{ mt: 1.5, fontWeight: 700, bgcolor: "#EFF8FF", color: "#0284C7", border: "1px solid #BAE6FD", fontSize: 11 }}
                  />
                )}
              </Box>

              {/* SECTION 1: DIRECT LINK (CLICK COUNT) */}
              <Box sx={{ p: 1.5, mb: 1.5, borderRadius: "12px", bgcolor: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                  <Stack direction="row" spacing={0.8} alignItems="center">
                    <ClickIcon sx={{ fontSize: 16, color: "#16A34A" }} />
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "#15803D", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      Direct Portal Link (Tracks Clicks)
                    </Typography>
                  </Stack>
                  <Chip size="small" label={`${data?.clickCount || 0} clicks`} sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: "#DCFCE7", color: "#15803D" }} />
                </Stack>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, bgcolor: "#FFFFFF", p: 0.8, borderRadius: "8px", border: "1px solid #BBF7D0", mb: 1 }}>
                  <LinkIcon sx={{ fontSize: 14, color: "#16A34A", flexShrink: 0 }} />
                  <Typography
                    variant="caption"
                    sx={{
                      flex: 1, minWidth: 0, color: "#1E293B", fontWeight: 600,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      fontFamily: "ui-monospace, monospace", fontSize: 11
                    }}
                    title={directLinkUrl}
                  >
                    {directLinkUrl}
                  </Typography>
                  <Tooltip title={copiedDirect ? "Copied!" : "Copy Direct Link"}>
                    <IconButton size="small" onClick={handleCopyDirectLink} sx={{ color: copiedDirect ? "#16A34A" : "#64748B", p: 0.5 }}>
                      {copiedDirect ? <CheckIcon sx={{ fontSize: 15 }} /> : <CopyIcon sx={{ fontSize: 15 }} />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Open link in browser">
                    <IconButton size="small" onClick={() => window.open(directLinkUrl, "_blank", "noopener,noreferrer")} sx={{ color: "#64748B", p: 0.5 }}>
                      <OpenInNewIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={testingClick ? <CircularProgress size={12} color="inherit" /> : <PlayArrowIcon sx={{ fontSize: 15 }} />}
                    onClick={handleTestDirectClick}
                    disabled={testingClick}
                    sx={{
                      flex: 1,
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: 11,
                      borderRadius: "7px",
                      borderColor: "#86EFAC",
                      color: "#15803D",
                      bgcolor: "#FFFFFF",
                      "&:hover": { bgcolor: "#DCFCE7", borderColor: "#4ADE80" }
                    }}
                  >
                    {testingClick ? "Testing..." : "Test Direct Click"}
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={copiedDirect ? <CheckIcon sx={{ fontSize: 14 }} /> : <CopyIcon sx={{ fontSize: 14 }} />}
                    onClick={handleCopyDirectLink}
                    sx={{
                      flex: 1,
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: 11,
                      borderRadius: "7px",
                      bgcolor: "#16A34A",
                      "&:hover": { bgcolor: "#15803D" }
                    }}
                  >
                    {copiedDirect ? "Copied!" : "Copy Link"}
                  </Button>
                </Stack>
              </Box>

              {/* SECTION 2: QR TRACKING LINK (SCAN COUNT) */}
              <Box sx={{ p: 1.5, mb: 2, borderRadius: "12px", bgcolor: "#F0F9FF", border: "1px solid #BAE6FD" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                  <Stack direction="row" spacing={0.8} alignItems="center">
                    <QrScannerIcon sx={{ fontSize: 16, color: "#0284C7" }} />
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "#0369A1", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      QR Tracking Link (Camera Scans)
                    </Typography>
                  </Stack>
                  <Chip size="small" label={`${data?.scanCount || 0} scans`} sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: "#E0F2FE", color: "#0369A1" }} />
                </Stack>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, bgcolor: "#FFFFFF", p: 0.8, borderRadius: "8px", border: "1px solid #BAE6FD", mb: 1 }}>
                  <LinkIcon sx={{ fontSize: 14, color: "#0284C7", flexShrink: 0 }} />
                  <Typography
                    variant="caption"
                    sx={{
                      flex: 1, minWidth: 0, color: "#1E293B", fontWeight: 600,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      fontFamily: "ui-monospace, monospace", fontSize: 11
                    }}
                    title={data?.qrTrackingLink}
                  >
                    {data?.qrTrackingLink || "Generating..."}
                  </Typography>
                  <Tooltip title={copiedQr ? "Copied!" : "Copy QR Link"}>
                    <IconButton size="small" onClick={handleCopyQrLink} sx={{ color: copiedQr ? "#16A34A" : "#64748B", p: 0.5 }}>
                      {copiedQr ? <CheckIcon sx={{ fontSize: 15 }} /> : <CopyIcon sx={{ fontSize: 15 }} />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Open link in browser">
                    <IconButton size="small" onClick={() => window.open(data?.qrTrackingLink, "_blank", "noopener,noreferrer")} sx={{ color: "#64748B", p: 0.5 }}>
                      <OpenInNewIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  startIcon={copiedQr ? <CheckIcon sx={{ fontSize: 14 }} /> : <CopyIcon sx={{ fontSize: 14 }} />}
                  onClick={handleCopyQrLink}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: 11,
                    borderRadius: "7px",
                    borderColor: "#BAE6FD",
                    color: "#0369A1",
                    bgcolor: "#FFFFFF",
                    "&:hover": { bgcolor: "#E0F2FE", borderColor: "#7DD3FC" }
                  }}
                >
                  {copiedQr ? "QR Link Copied!" : "Copy QR Tracking Link"}
                </Button>
              </Box>

              {/* Download Buttons */}
              <Stack direction="row" spacing={1} sx={{ mt: "auto" }}>
                <Button
                  fullWidth variant="contained" size="small"
                  startIcon={downloading && downloadFormat === "png" ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon />}
                  onClick={() => handleDownloadQr("png")}
                  disabled={downloading || !data}
                  sx={{
                    height: 38, borderRadius: "9px", textTransform: "none", fontWeight: 700,
                    bgcolor: "#0284C7", boxShadow: "0 4px 12px rgba(2, 132, 199, 0.25)",
                    "&:hover": { bgcolor: "#0369A1" },
                  }}
                >
                  Download PNG
                </Button>
                <Button
                  fullWidth variant="outlined" size="small"
                  startIcon={downloading && downloadFormat === "svg" ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon />}
                  onClick={() => handleDownloadQr("svg")}
                  disabled={downloading || !data}
                  sx={{
                    height: 38, borderRadius: "9px", textTransform: "none", fontWeight: 600,
                    borderColor: "#E2E8F0", color: "#334155", bgcolor: "#FFFFFF",
                    "&:hover": { bgcolor: "#F8FAFC", borderColor: "#CBD5E1" },
                  }}
                >
                  Download SVG
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* 7-Day Frequency Chart */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "none", bgcolor: "#FFFFFF", height: "100%", p: { xs: 2, sm: 2.5 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1} sx={{ mb: 2.5 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A" }}>
                  7-Day Traffic Trends
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748B" }}>
                  Comparison of QR scans vs direct portal clicks over time
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  icon={<TrendingUpIcon sx={{ fontSize: "14px !important" }} />}
                  label={`${data?.weekScans || 0} scans this week`}
                  sx={{ fontWeight: 700, bgcolor: "#EFF8FF", color: "#0284C7", border: "1px solid #BAE6FD", fontSize: 11 }}
                />
              </Stack>
            </Stack>

            <Box sx={{ width: "100%", height: { xs: 220, sm: 260, md: 280 } }}>
              {data?.trend?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284C7" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0284C7" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16A34A" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <ChartTooltip
                      contentStyle={{ backgroundColor: "#0F172A", borderRadius: "8px", border: "none", color: "#FFFFFF", fontSize: "12px", padding: "8px 12px" }}
                      itemStyle={{ color: "#FFFFFF" }}
                      labelStyle={{ fontWeight: 700 }}
                    />
                    <Area type="monotone" dataKey="scans" stroke="#0284C7" strokeWidth={2.5} fill="url(#scanGradient)" name="QR Scans" />
                    <Area type="monotone" dataKey="clicks" stroke="#16A34A" strokeWidth={2} fill="url(#clickGradient)" name="Direct Clicks" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
                  <Box sx={{ width: 52, height: 52, borderRadius: "50%", bgcolor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <TrendingUpIcon sx={{ fontSize: 28, color: "#CBD5E1" }} />
                  </Box>
                  <Typography variant="body2" sx={{ color: "#94A3B8", fontWeight: 600 }}>No scan activity recorded yet</Typography>
                </Box>
              )}
            </Box>

            <Stack direction="row" spacing={3} justifyContent="center" sx={{ mt: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#0284C7" }} />
                <Typography variant="caption" sx={{ color: "#475467", fontWeight: 600 }}>QR Scans</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#16A34A" }} />
                <Typography variant="caption" sx={{ color: "#475467", fontWeight: 600 }}>Direct Clicks</Typography>
              </Stack>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* ── Device & Time Log Section ── */}
      <Card sx={{ borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "none", bgcolor: "#FFFFFF", overflow: "hidden" }}>

        {/* Section Header Toolbar */}
        <Box sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: "1px solid #F1F5F9" }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={1.5}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0F172A" }}>
                Device & Time Activity Log
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B" }}>
                Records device type, OS, browser, IP address, access method, and exact timestamp.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              {selectedIds.length > 0 && (
                <Button
                  variant="contained" color="error" size="small"
                  startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
                  onClick={() => setBatchDeleteDialogOpen(true)}
                  sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700, height: 34, px: 1.5 }}
                >
                  Delete ({selectedIds.length})
                </Button>
              )}
              {(data?.devices?.length > 0 || data?.totalInteractions > 0) && (
                <Button
                  variant="outlined" color="error" size="small"
                  startIcon={<DeleteSweepIcon sx={{ fontSize: 16 }} />}
                  onClick={() => setClearDialogOpen(true)}
                  sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, height: 34, px: 1.5 }}
                >
                  Clear All
                </Button>
              )}
              <Button
                variant="outlined" size="small"
                startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                onClick={handleExportCsv}
                sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, borderColor: "#E2E8F0", color: "#475467", height: 34, px: 1.5 }}
              >
                Export CSV
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Mobile View: Card List (xs to sm) */}
        {isMobile ? (
          <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
            {loading && !data ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress size={30} />
              </Box>
            ) : !data?.devices?.length ? (
              <Box sx={{ textAlign: "center", py: 6, px: 2 }}>
                <DevicesIcon sx={{ fontSize: 36, color: "#94A3B8", mb: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#475467" }}>No scan records found</Typography>
                <Typography variant="caption" sx={{ color: "#94A3B8" }}>Camera scans and direct clicks will appear here.</Typography>
              </Box>
            ) : (
              data.devices.map((device) => {
                const accessStyle = ACCESS_STYLES[device.accessType] || ACCESS_STYLES.qr;
                const isSelected = selectedIds.includes(device._id);

                return (
                  <Card
                    key={device._id || `${device.ip}-${device.timestamp}`}
                    variant="outlined"
                    sx={{
                      p: 1.75,
                      borderRadius: "12px",
                      bgcolor: isSelected ? "#F0F9FF" : "#FFFFFF",
                      borderColor: isSelected ? "#0284C7" : "#E2E8F0",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Checkbox
                          size="small"
                          checked={isSelected}
                          onChange={() => handleSelectRow(device._id)}
                          sx={{ p: 0 }}
                        />
                        <DeviceIcon type={device.type} />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "#0F172A", textTransform: "capitalize" }}>
                          {device.type || "desktop"}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <Chip
                          size="small"
                          label={accessStyle.label}
                          sx={{
                            fontWeight: 700,
                            fontSize: 10,
                            height: 20,
                            bgcolor: accessStyle.bg,
                            color: accessStyle.color,
                            border: `1px solid ${accessStyle.border}`
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => { setDeleteTarget(device); setDeleteDialogOpen(true); }}
                          sx={{ color: "#94A3B8", p: 0.5, "&:hover": { color: "#EF4444" } }}
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Stack>
                    </Stack>

                    <Stack spacing={0.6} sx={{ pl: 3 }}>
                      <Typography variant="caption" sx={{ color: "#475467", fontWeight: 600 }}>
                        {device.os || "Unknown OS"} · {device.browser || "Unknown Browser"}
                      </Typography>

                      <Typography variant="caption" sx={{ fontFamily: "ui-monospace, monospace", color: "#64748B", fontSize: 11 }}>
                        IP: {device.ip || "—"}
                      </Typography>

                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <DateIcon sx={{ fontSize: 12, color: "#94A3B8" }} />
                          <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 500 }}>
                            {formatDate(device.timestamp)}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <TimeIcon sx={{ fontSize: 12, color: "#94A3B8" }} />
                          <Typography variant="caption" sx={{ color: "#0F172A", fontWeight: 600 }}>
                            {formatTime(device.timestamp)}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Card>
                );
              })
            )}
          </Box>
        ) : (
          /* Desktop View: Full Table */
          <TableContainer sx={{ minHeight: 240 }}>
            <Table>
              <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ pl: 2 }}>
                    <Checkbox
                      size="small"
                      indeterminate={selectedIds.length > 0 && selectedIds.length < (data?.devices?.length || 0)}
                      checked={Boolean(data?.devices?.length) && selectedIds.length === data.devices.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  {["Device", "OS", "Browser", "IP Address", "Access", "Date", "Time", ""].map((h, i) => (
                    <TableCell
                      key={h || i}
                      align={i === 7 ? "right" : "left"}
                      sx={{ fontWeight: 700, color: "#475467", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", py: 1.25, ...(i === 7 ? { pr: 2.5 } : {}) }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {loading && !data ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : !data?.devices?.length ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{ width: 52, height: 52, borderRadius: "50%", bgcolor: "#EFF8FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <DevicesIcon sx={{ fontSize: 26, color: "#0284C7" }} />
                        </Box>
                        <Typography variant="body1" sx={{ color: "#475467", fontWeight: 700 }}>No scans recorded yet</Typography>
                        <Typography variant="body2" sx={{ color: "#94A3B8", maxWidth: 380, textAlign: "center" }}>
                          Download or share the tracking links above. Every scan and click will appear here.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.devices.map((device) => {
                    const accessStyle = ACCESS_STYLES[device.accessType] || ACCESS_STYLES.qr;
                    const isSelected = selectedIds.includes(device._id);
                    return (
                      <TableRow
                        key={device._id || `${device.ip}-${device.timestamp}`}
                        hover
                        selected={isSelected}
                        sx={{
                          "&.Mui-selected": { bgcolor: "#EFF8FF" },
                          "&.Mui-selected:hover": { bgcolor: "#E0F2FE" },
                          transition: "background 0.15s",
                        }}
                      >
                        <TableCell padding="checkbox" sx={{ pl: 2 }}>
                          <Checkbox size="small" checked={isSelected} onChange={() => handleSelectRow(device._id)} />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <DeviceIcon type={device.type} />
                            <Typography variant="body2" sx={{ fontWeight: 600, color: "#0F172A", textTransform: "capitalize" }}>
                              {device.type || "desktop"}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: "#334155" }}>{device.os || "—"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: "#334155" }}>{device.browser || "—"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: "ui-monospace, Menlo, monospace", color: "#0F172A", fontSize: 12 }}>
                            {device.ip || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={accessStyle.label}
                            sx={{ fontWeight: 700, fontSize: 11, bgcolor: accessStyle.bg, color: accessStyle.color, border: `1px solid ${accessStyle.border}` }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: "#475467", fontWeight: 500 }}>{formatDate(device.timestamp)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: "#0F172A", fontWeight: 600 }}>{formatTime(device.timestamp)}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 2 }}>
                          <Tooltip title="Delete record" arrow>
                            <IconButton
                              size="small"
                              onClick={() => { setDeleteTarget(device); setDeleteDialogOpen(true); }}
                              sx={{ color: "#CBD5E1", borderRadius: "7px", "&:hover": { color: "#EF4444", bgcolor: "#FEE2E2" } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination footer */}
        <Divider />
        <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 1.75, display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 1.5 }}>
          <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 500 }}>
            Showing <strong>{data?.devices?.length || 0}</strong> of <strong>{pagination.total || 0}</strong> records
          </Typography>
          <Pagination
            count={pagination.totalPages || 1}
            page={page}
            onChange={(e, nextPage) => setPage(nextPage)}
            color="primary"
            shape="rounded"
            size="small"
          />
        </Box>
      </Card>

      {/* ── Single Delete Dialog ── */}
      <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A" }}>Delete Scan Record?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will permanently remove the log entry and decrement the corresponding count.
          </Typography>
          {deleteTarget && (
            <Box sx={{ p: 2, borderRadius: "10px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#1E293B" }}>
                {(deleteTarget.type || "device").toUpperCase()} · {deleteTarget.os || "Unknown OS"} · {deleteTarget.browser || "Unknown Browser"}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B", display: "block", mt: 0.5 }}>
                IP: {deleteTarget.ip || "—"} · {deleteTarget.accessType === "qr" ? "QR Scan" : "Direct Click"}
              </Typography>
              <Typography variant="caption" sx={{ color: "#94A3B8", display: "block" }}>
                {formatDate(deleteTarget.timestamp)} at {formatTime(deleteTarget.timestamp)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting} sx={{ textTransform: "none", fontWeight: 600, color: "#64748B" }}>Cancel</Button>
          <Button
            variant="contained" color="error" onClick={confirmDeleteSingle} disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <DeleteIcon />}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Batch Delete Dialog ── */}
      <Dialog open={batchDeleteDialogOpen} onClose={() => !deleting && setBatchDeleteDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#0F172A" }}>Delete Selected Records?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete <strong>{selectedIds.length}</strong> selected scan record{selectedIds.length > 1 ? "s" : ""}? Counts will be adjusted accordingly.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setBatchDeleteDialogOpen(false)} disabled={deleting} sx={{ textTransform: "none", fontWeight: 600, color: "#64748B" }}>Cancel</Button>
          <Button
            variant="contained" color="error" onClick={confirmDeleteBatch} disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <DeleteIcon />}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
          >
            {deleting ? "Deleting..." : `Delete (${selectedIds.length})`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Clear All Dialog ── */}
      <Dialog open={clearDialogOpen} onClose={() => !deleting && setClearDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ fontWeight: 800, color: "#DC2626" }}>Clear All Logs & Counts?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: "10px" }}>
            All device history will be permanently erased and scan / click counts will be reset to 0.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. Are you sure you want to proceed?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setClearDialogOpen(false)} disabled={deleting} sx={{ textTransform: "none", fontWeight: 600, color: "#64748B" }}>Cancel</Button>
          <Button
            variant="contained" color="error" onClick={confirmClearAll} disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <DeleteSweepIcon />}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
          >
            {deleting ? "Clearing..." : "Clear All"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
