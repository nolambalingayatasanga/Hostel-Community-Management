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
  direct: {
    bg: "#F0FDF4",
    color: "#166534",
    border: "#BBF7D0",
    label: "Direct Click",
  },
};

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
};

const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const DeviceIcon = ({ type }) => {
  if (type === "mobile")
    return <PhoneIcon sx={{ fontSize: 18, color: "#0088FF" }} />;
  if (type === "tablet")
    return <TabletIcon sx={{ fontSize: 18, color: "#8B5CF6" }} />;
  return <DesktopIcon sx={{ fontSize: 18, color: "#64748B" }} />;
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

  const fetchLoginQr = useCallback(
    async (currentPage = page) => {
      try {
        setLoading(true);
        const res = await API.get("/qr-scans/login-qr", {
          params: { page: currentPage, limit: 10 },
        });
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load login QR analytics:", err);
        enqueueSnackbar(
          err.response?.data?.message || "Failed to load QR scan data",
          {
            variant: "error",
          },
        );
      } finally {
        setLoading(false);
      }
    },
    [page, enqueueSnackbar],
  );

  useEffect(() => {
    fetchLoginQr(page);
  }, [page]);

  useEffect(() => {
    const timer = setInterval(() => {
      fetchLoginQr(page);
    }, 12000);
    return () => clearInterval(timer);
  }, [fetchLoginQr, page]);

  useEffect(() => {
    if (!data?.qrTrackingLink || !qrCanvasRef.current) return;
    QRCode.toCanvas(qrCanvasRef.current, data.qrTrackingLink, {
      width: 184,
      margin: 1,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
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
      const res = await API.get("/qr-scans/login-qr/download", {
        params: { format },
        responseType: "blob",
      });
      const blobUrl = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `kambi-connect-login-qr.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      enqueueSnackbar(`QR code downloaded as ${format.toUpperCase()}`, {
        variant: "success",
      });
    } catch (err) {
      enqueueSnackbar("Failed to download QR code", { variant: "error" });
    } finally {
      setDownloading(false);
      setDownloadFormat(null);
    }
  };

  const handleExportCsv = () => {
    const devices = data?.devices || [];
    if (devices.length === 0) {
      enqueueSnackbar("No scan records to export", { variant: "info" });
      return;
    }

    const headers = [
      "IP Address",
      "Device Type",
      "OS",
      "Browser",
      "Access Type",
      "Date",
      "Time",
    ];
    const rows = devices.map((device) => [
      `"${device.ip || ""}"`,
      `"${device.type || ""}"`,
      `"${device.os || ""}"`,
      `"${device.browser || ""}"`,
      `"${device.accessType || ""}"`,
      `"${formatDate(device.timestamp)}"`,
      `"${formatTime(device.timestamp)}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `QR_Scan_Devices_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              background: "linear-gradient(135deg, #0088FF 0%, #0055FF 100%)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0, 136, 255, 0.28)",
            }}
          >
            <QrScannerIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: "#0F172A",
                letterSpacing: "-0.02em",
              }}
            >
              QR Scan Count
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#64748B", fontWeight: 500 }}
            >
              Scan the login QR to open Kambi Connect. Counts, device, and time
              are tracked live.
            </Typography>
          </Box>
        </Stack>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => fetchLoginQr(page)}
          sx={{
            borderRadius: "9px",
            textTransform: "none",
            fontWeight: 600,
            borderColor: "#E2E8F0",
            color: "#334155",
            bgcolor: "#FFFFFF",
            "&:hover": { bgcolor: "#F8FAFC", borderColor: "#CBD5E1" },
          }}
        >
          Refresh
        </Button>
      </Stack>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Total Scans"
            value={data?.scanCount}
            loading={loading}
            color="#0088FF"
            icon={<QrCodeIcon sx={{ fontSize: 28 }} />}
            footer="All-time QR scans"
            footerColor="#166534"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Today's Scans"
            value={data?.todayScans}
            loading={loading}
            color="#10B981"
            icon={<TodayIcon sx={{ fontSize: 28 }} />}
            footer="Live activity today"
            footerColor="#0369A1"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Direct Clicks"
            value={data?.clickCount}
            loading={loading}
            color="#F59E0B"
            icon={<ClickIcon sx={{ fontSize: 28 }} />}
            footer="Opened without scanning"
            footerColor="#B45309"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Unique Devices"
            value={data?.uniqueDeviceCount}
            loading={loading}
            color="#8B5CF6"
            icon={<DevicesIcon sx={{ fontSize: 28 }} />}
            footer="Distinct IPs recorded"
            footerColor="#6B7280"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              borderRadius: "16px",
              border: "1px solid #E2E8F0",
              boxShadow: "none",
              bgcolor: "#FFFFFF",
              height: "100%",
            }}
          >
            <CardContent
              sx={{
                p: 2.5,
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: "#0F172A" }}
              >
                Login QR Code
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#64748B", display: "block", mb: 2 }}
              >
                Scan opens kambi-connect.in/login after the count is recorded.
              </Typography>

              <Box
                sx={{
                  py: 2,
                  px: 1,
                  mb: 2,
                  borderRadius: "12px",
                  bgcolor: "#F8FAFC",
                  border: "1px solid #EEF2F6",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    p: 1,
                    borderRadius: "12px",
                    bgcolor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    minHeight: 200,
                    minWidth: 200,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {loading && !data ? (
                    <CircularProgress size={28} />
                  ) : (
                    <canvas
                      ref={qrCanvasRef}
                      style={{ display: "block", width: 184, height: 184 }}
                    />
                  )}
                </Box>
                {data?.code && (
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 1.25,
                      color: "#64748B",
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                    }}
                  >
                    Code {data.code}
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1.25,
                  py: 0.5,
                  mb: 2,
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  bgcolor: "#FFFFFF",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    color: "#334155",
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    fontSize: 11.5,
                  }}
                  title={data?.qrTrackingLink}
                >
                  {data?.qrTrackingLink || "Generating tracking link..."}
                </Typography>
                <Tooltip title={copied ? "Copied" : "Copy link"}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={handleCopyLink}
                      disabled={!data?.qrTrackingLink}
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: "8px",
                        color: copied ? "#16A34A" : "#64748B",
                        "&:hover": {
                          bgcolor: "#F1F5F9",
                          color: copied ? "#16A34A" : "#0F172A",
                        },
                      }}
                    >
                      {copied ? (
                        <CheckIcon sx={{ fontSize: 16 }} />
                      ) : (
                        <CopyIcon sx={{ fontSize: 16 }} />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Open link">
                  <span>
                    <IconButton
                      size="small"
                      disabled={!data?.qrTrackingLink}
                      onClick={() =>
                        window.open(
                          data.qrTrackingLink,
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: "8px",
                        color: "#64748B",
                        "&:hover": { bgcolor: "#F1F5F9", color: "#0F172A" },
                      }}
                    >
                      <OpenInNewIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>

              <Stack spacing={1} sx={{ mt: "auto" }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={
                    downloading && downloadFormat === "png" ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <DownloadIcon />
                    )
                  }
                  onClick={() => handleDownloadQr("png")}
                  disabled={downloading || !data}
                  sx={{
                    height: 42,
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 700,
                    bgcolor: "#0088FF",
                    boxShadow: "none",
                    "&:hover": { bgcolor: "#0070D4", boxShadow: "none" },
                  }}
                >
                  Download PNG
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={
                    downloading && downloadFormat === "svg" ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <DownloadIcon />
                    )
                  }
                  onClick={() => handleDownloadQr("svg")}
                  disabled={downloading || !data}
                  sx={{
                    height: 42,
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: "#E2E8F0",
                    color: "#334155",
                    bgcolor: "#FFFFFF",
                    "&:hover": { bgcolor: "#F8FAFC", borderColor: "#CBD5E1" },
                  }}
                >
                  Download SVG
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card
            sx={{
              borderRadius: "16px",
              border: "1px solid #E2E8F0",
              boxShadow: "none",
              bgcolor: "#FFFFFF",
              height: "100%",
              p: 2.5,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: "#0F172A" }}
                >
                  7-Day Scan Frequency
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748B" }}>
                  QR scans vs direct link clicks
                </Typography>
              </Box>
              <Chip
                icon={<TrendingUpIcon sx={{ fontSize: "16px !important" }} />}
                label={`${data?.weekScans || 0} scans this week`}
                sx={{ fontWeight: 700, bgcolor: "#EFF8FF", color: "#175CD3" }}
              />
            </Stack>
            <Box sx={{ width: "100%", height: 280 }}>
              {data?.trend?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.trend}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="scanGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#0088FF"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#0088FF"
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#F1F5F9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      stroke="#94A3B8"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={12}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <ChartTooltip
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        borderRadius: "8px",
                        border: "none",
                        color: "#FFFFFF",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="scans"
                      stroke="#0088FF"
                      strokeWidth={2.5}
                      fill="url(#scanGradient)"
                      name="QR Scans"
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="#10B981"
                      strokeWidth={2}
                      fillOpacity={0}
                      name="Direct Clicks"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No scan data recorded yet.
                  </Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Card
        sx={{
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          boxShadow: "none",
          bgcolor: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2.5, borderBottom: "1px solid #F1F5F9" }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={1.5}
          >
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: "#0F172A" }}
              >
                Device & Time Log
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B" }}>
                Every scan stores device type, OS, browser, IP, and exact time
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportCsv}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                borderColor: "#E2E8F0",
                color: "#475467",
                height: 40,
              }}
            >
              Export CSV
            </Button>
          </Stack>
        </Box>

        <TableContainer sx={{ minHeight: 280 }}>
          <Table>
            <TableHead sx={{ bgcolor: "#F8FAFC" }}>
              <TableRow>
                <TableCell
                  sx={{ fontWeight: 600, color: "#475467", fontSize: 13 }}
                >
                  Device
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, color: "#475467", fontSize: 13 }}
                >
                  OS
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, color: "#475467", fontSize: 13 }}
                >
                  Browser
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, color: "#475467", fontSize: 13 }}
                >
                  IP Address
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, color: "#475467", fontSize: 13 }}
                >
                  Access
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, color: "#475467", fontSize: 13 }}
                >
                  Date
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, color: "#475467", fontSize: 13 }}
                >
                  Time
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && !data ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : !data?.devices?.length ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography
                      variant="body1"
                      sx={{ color: "#64748B", fontWeight: 600 }}
                    >
                      No scans yet.
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#94A3B8", mt: 0.5 }}
                    >
                      Download or print the QR above. Each phone scan will
                      appear here with device and time.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.devices.map((device) => {
                  const accessStyle =
                    ACCESS_STYLES[device.accessType] || ACCESS_STYLES.qr;
                  return (
                    <TableRow
                      key={device._id || `${device.ip}-${device.timestamp}`}
                      hover
                    >
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <DeviceIcon type={device.type} />
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: "#0F172A",
                              textTransform: "capitalize",
                            }}
                          >
                            {device.type || "desktop"}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: "#334155" }}>
                          {device.os || "unknown"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: "#334155" }}>
                          {device.browser || "unknown"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace", color: "#0F172A" }}
                        >
                          {device.ip || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={accessStyle.label}
                          sx={{
                            fontWeight: 700,
                            fontSize: 11,
                            bgcolor: accessStyle.bg,
                            color: accessStyle.color,
                            border: `1px solid ${accessStyle.border}`,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ color: "#0F172A", fontWeight: 500 }}
                        >
                          {formatDate(device.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ color: "#0F172A", fontWeight: 600 }}
                        >
                          {formatTime(device.timestamp)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider />
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="body2" sx={{ color: "#64748B" }}>
            Showing <strong>{data?.devices?.length || 0}</strong> of{" "}
            <strong>{pagination.total || 0}</strong> records
          </Typography>
          <Pagination
            count={pagination.totalPages || 1}
            page={page}
            onChange={(e, nextPage) => setPage(nextPage)}
            color="primary"
            shape="rounded"
          />
        </Box>
      </Card>
    </Box>
  );
}

function StatCard({ label, value, loading, color, icon, footer, footerColor }) {
  return (
    <Card
      sx={{
        borderRadius: "16px",
        border: "1px solid #E2E8F0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        bgcolor: "#FFFFFF",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          bgcolor: color,
        }}
      />
      <CardContent sx={{ p: 2.5 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: "#64748B",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {label}
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, color: "#0F172A", mt: 0.5 }}
            >
              {loading && value == null ? (
                <CircularProgress size={24} />
              ) : (
                Number(value || 0).toLocaleString()
              )}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "12px",
              bgcolor: `${color}14`,
              color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
        </Stack>
        <Typography
          variant="caption"
          sx={{
            color: footerColor,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            mt: 1.5,
          }}
        >
          {footer}
        </Typography>
      </CardContent>
    </Card>
  );
}
