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
  qr: { bg: "#EFF8FF", color: "#175CD3", border: "#B2DDFF", label: "QR Scan" },
  direct: { bg: "#F0FDF4", color: "#166534", border: "#BBF7D0", label: "Direct Click" },
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
  if (type === "mobile") return <PhoneIcon sx={{ fontSize: 16, color: "#0088FF" }} />;
  if (type === "tablet") return <TabletIcon sx={{ fontSize: 16, color: "#8B5CF6" }} />;
  return <DesktopIcon sx={{ fontSize: 16, color: "#64748B" }} />;
};

export default function QrScanCount() {
  const { enqueueSnackbar } = useSnackbar();
  const qrCanvasRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState(null);
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(1);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const fetchLoginQr = useCallback(
    async (currentPage = page) => {
      try {
        setLoading(true);
        const res = await API.get("/qr-scans/login-qr", {
          params: { page: currentPage, limit: 10 },
        });
        if (res.data?.success) setData(res.data.data);
      } catch (err) {
        enqueueSnackbar(err.response?.data?.message || "Failed to load QR scan data", { variant: "error" });
      } finally {
        setLoading(false);
      }
    },
    [page, enqueueSnackbar],
  );

  useEffect(() => { fetchLoginQr(page); }, [page]);

  useEffect(() => {
    const timer = setInterval(() => fetchLoginQr(page), 12000);
    return () => clearInterval(timer);
  }, [fetchLoginQr, page]);

  useEffect(() => {
    if (!data?.qrTrackingLink || !qrCanvasRef.current) return;
    QRCode.toCanvas(qrCanvasRef.current, data.qrTrackingLink, {
      width: 180, margin: 1,
      color: { dark: "#0F172A", light: "#FFFFFF" },
    }).catch((err) => console.error("QR render error:", err));
  }, [data?.qrTrackingLink]);

  const handleCopyLink = async () => {
    if (!data?.qrTrackingLink) return;
    try {
      await navigator.clipboard.writeText(data.qrTrackingLink);
      setCopied(true);
      enqueueSnackbar("QR tracking link copied", { variant: "success" });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      enqueueSnackbar("Unable to copy link", { variant: "error" });
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

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto" }}>

      {/* ── Header ── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 44, height: 44, borderRadius: "12px",
              background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
              color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(29, 78, 216, 0.25)",
            }}
          >
            <QrScannerIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
              QR Scan Count
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B", mt: 0.25 }}>
              Login QR analytics — scans, clicks, devices, and live trend tracking.
            </Typography>
          </Box>
        </Stack>

        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={14} /> : <RefreshIcon />}
          onClick={() => fetchLoginQr(page)}
          disabled={loading}
          sx={{
            borderRadius: "9px", textTransform: "none", fontWeight: 600,
            borderColor: "#E2E8F0", color: "#334155", bgcolor: "#FFFFFF",
            "&:hover": { bgcolor: "#F8FAFC", borderColor: "#CBD5E1" },
          }}
        >
          Refresh
        </Button>
      </Stack>

      {/* ── Stat Cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: "Total Scans", value: data?.scanCount, color: "#0088FF", icon: <QrCodeIcon sx={{ fontSize: 24 }} />, sub: "All-time QR scans" },
          { label: "Today's Scans", value: data?.todayScans, color: "#10B981", icon: <TodayIcon sx={{ fontSize: 24 }} />, sub: "Live activity today" },
          { label: "Direct Clicks", value: data?.clickCount, color: "#F59E0B", icon: <ClickIcon sx={{ fontSize: 24 }} />, sub: "Opened without scanning" },
          { label: "Unique Devices", value: data?.uniqueDeviceCount, color: "#8B5CF6", icon: <DevicesIcon sx={{ fontSize: 24 }} />, sub: "Distinct IPs recorded" },
        ].map(({ label, value, color, icon, sub }) => (
          <Grid key={label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                borderRadius: "16px", border: "1px solid #E2E8F0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)", bgcolor: "#FFFFFF",
                transition: "all 0.2s", "&:hover": { boxShadow: "0 6px 20px rgba(0,0,0,0.07)", transform: "translateY(-2px)" },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {label}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: "#0F172A", mt: 0.5, lineHeight: 1.1 }}>
                      {loading && value == null ? <CircularProgress size={22} sx={{ color }} /> : Number(value || 0).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 500, mt: 1, display: "block" }}>
                      {sub}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 44, height: 44, borderRadius: "12px",
                      bgcolor: `${color}18`, color,
                      display: "flex", alignItems: "center", justifyContent: "center",
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

      {/* ── QR + Chart Row ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>

        {/* QR Panel */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "none", bgcolor: "#FFFFFF", height: "100%" }}>
            <CardContent sx={{ p: 2.5, display: "flex", flexDirection: "column", height: "100%" }}>

              {/* Card header */}
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <Box sx={{ width: 30, height: 30, borderRadius: "8px", bgcolor: "#EFF8FF", color: "#0088FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <QrCodeIcon sx={{ fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}>
                    Login QR Code
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748B" }}>
                    Redirects to kambi-connect.in/login
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              {/* QR Canvas */}
              <Box
                sx={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  py: 3, px: 2, mb: 2, borderRadius: "12px",
                  bgcolor: "#F8FAFC", border: "1px solid #E2E8F0",
                }}
              >
                <Box
                  sx={{
                    p: 1.5, borderRadius: "12px", bgcolor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    minHeight: 196, minWidth: 196,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {loading && !data ? (
                    <CircularProgress size={28} />
                  ) : (
                    <canvas ref={qrCanvasRef} style={{ display: "block", width: 180, height: 180 }} />
                  )}
                </Box>
                {data?.code && (
                  <Chip
                    size="small"
                    label={`Code: ${data.code}`}
                    sx={{ mt: 1.5, fontWeight: 700, bgcolor: "#EFF8FF", color: "#175CD3", border: "1px solid #B2DDFF", fontSize: 11 }}
                  />
                )}
              </Box>

              {/* Tracking link row */}
              <Box
                sx={{
                  display: "flex", alignItems: "center", gap: 0.5,
                  px: 1.25, py: 0.75, mb: 2,
                  border: "1px solid #E2E8F0", borderRadius: "10px", bgcolor: "#F8FAFC",
                }}
              >
                <LinkIcon sx={{ fontSize: 14, color: "#94A3B8", flexShrink: 0 }} />
                <Typography
                  variant="caption"
                  sx={{
                    flex: 1, minWidth: 0, color: "#334155", fontWeight: 500,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    fontSize: 11,
                  }}
                  title={data?.qrTrackingLink}
                >
                  {data?.qrTrackingLink || "Generating..."}
                </Typography>
                <Tooltip title={copied ? "Copied!" : "Copy link"}>
                  <span>
                    <IconButton size="small" onClick={handleCopyLink} disabled={!data?.qrTrackingLink}
                      sx={{ width: 28, height: 28, borderRadius: "7px", color: copied ? "#16A34A" : "#64748B", "&:hover": { bgcolor: "#E2E8F0" } }}>
                      {copied ? <CheckIcon sx={{ fontSize: 14 }} /> : <CopyIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Open in new tab">
                  <span>
                    <IconButton size="small" disabled={!data?.qrTrackingLink}
                      onClick={() => window.open(data.qrTrackingLink, "_blank", "noopener,noreferrer")}
                      sx={{ width: 28, height: 28, borderRadius: "7px", color: "#64748B", "&:hover": { bgcolor: "#E2E8F0" } }}>
                      <OpenInNewIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>

              {/* Download buttons */}
              <Stack spacing={1} sx={{ mt: "auto" }}>
                <Button
                  fullWidth variant="contained"
                  startIcon={downloading && downloadFormat === "png" ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon />}
                  onClick={() => handleDownloadQr("png")}
                  disabled={downloading || !data}
                  sx={{
                    height: 40, borderRadius: "9px", textTransform: "none", fontWeight: 700,
                    bgcolor: "#0088FF", boxShadow: "0 4px 14px rgba(0, 136, 255, 0.3)",
                    "&:hover": { bgcolor: "#0070D4", boxShadow: "0 4px 14px rgba(0, 136, 255, 0.3)" },
                  }}
                >
                  Download PNG
                </Button>
                <Button
                  fullWidth variant="outlined"
                  startIcon={downloading && downloadFormat === "svg" ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon />}
                  onClick={() => handleDownloadQr("svg")}
                  disabled={downloading || !data}
                  sx={{
                    height: 40, borderRadius: "9px", textTransform: "none", fontWeight: 600,
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

        {/* Chart Panel */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "none", bgcolor: "#FFFFFF", height: "100%", p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0F172A" }}>
                  7-Day Scan Frequency
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748B" }}>
                  QR scans vs direct link clicks over the last week
                </Typography>
              </Box>
              <Chip
                icon={<TrendingUpIcon sx={{ fontSize: "14px !important" }} />}
                label={`${data?.weekScans || 0} scans this week`}
                sx={{ fontWeight: 700, bgcolor: "#EFF8FF", color: "#175CD3", border: "1px solid #B2DDFF", fontSize: 11 }}
              />
            </Stack>
            <Box sx={{ width: "100%", height: 280 }}>
              {data?.trend?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0088FF" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0088FF" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <ChartTooltip
                      contentStyle={{ backgroundColor: "#0F172A", borderRadius: "8px", border: "none", color: "#FFFFFF", fontSize: "12px", padding: "8px 12px" }}
                      itemStyle={{ color: "#FFFFFF" }}
                      labelStyle={{ fontWeight: 700 }}
                    />
                    <Area type="monotone" dataKey="scans" stroke="#0088FF" strokeWidth={2.5} fill="url(#scanGradient)" name="QR Scans" />
                    <Area type="monotone" dataKey="clicks" stroke="#10B981" strokeWidth={2} fill="url(#clickGradient)" name="Direct Clicks" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
                  <Box sx={{ width: 52, height: 52, borderRadius: "50%", bgcolor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <TrendingUpIcon sx={{ fontSize: 28, color: "#CBD5E1" }} />
                  </Box>
                  <Typography variant="body2" sx={{ color: "#94A3B8", fontWeight: 600 }}>No scan data recorded yet</Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── Device & Time Log Table ── */}
      <Card sx={{ borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "none", bgcolor: "#FFFFFF", overflow: "hidden" }}>

        {/* Table Header */}
        <Box sx={{ p: 2.5, borderBottom: "1px solid #F1F5F9" }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={1.5}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0F172A" }}>
                Device & Time Log
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B" }}>
                Every scan stores device type, OS, browser, IP, and exact time
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              {selectedIds.length > 0 && (
                <Button
                  variant="outlined" color="error" size="small"
                  startIcon={<DeleteIcon />}
                  onClick={() => setBatchDeleteDialogOpen(true)}
                  sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, height: 36 }}
                >
                  Delete ({selectedIds.length})
                </Button>
              )}
              {(data?.devices?.length > 0 || data?.totalInteractions > 0) && (
                <Button
                  variant="outlined" color="error" size="small"
                  startIcon={<DeleteSweepIcon />}
                  onClick={() => setClearDialogOpen(true)}
                  sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, height: 36 }}
                >
                  Clear All
                </Button>
              )}
              <Button
                variant="outlined" size="small"
                startIcon={<DownloadIcon />}
                onClick={handleExportCsv}
                sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, borderColor: "#E2E8F0", color: "#475467", height: 36 }}
              >
                Export CSV
              </Button>
            </Stack>
          </Stack>
        </Box>

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
                    sx={{ fontWeight: 600, color: "#475467", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", py: 1.25, ...(i === 7 ? { pr: 2.5 } : {}) }}
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
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : !data?.devices?.length ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                      <Box sx={{ width: 56, height: 56, borderRadius: "50%", bgcolor: "#EFF8FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <DevicesIcon sx={{ fontSize: 30, color: "#0088FF" }} />
                      </Box>
                      <Typography variant="body1" sx={{ color: "#64748B", fontWeight: 700 }}>No scans recorded yet</Typography>
                      <Typography variant="body2" sx={{ color: "#94A3B8", maxWidth: 380, textAlign: "center" }}>
                        Download or print the QR code above. Every phone scan will appear here with device details and exact time.
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
                        "&.Mui-selected:hover": { bgcolor: "#E0F0FF" },
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

        {/* Pagination footer */}
        <Divider />
        <Box sx={{ px: 2.5, py: 1.75, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" sx={{ color: "#64748B" }}>
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
