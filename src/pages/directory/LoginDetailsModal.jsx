import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  Stack,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Alert,
  Paper,
} from "@mui/material";
import {
  Close as CloseIcon,
  Shield as SecurityIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Computer as DesktopIcon,
  Smartphone as MobileIcon,
  Tablet as TabletIcon,
  Public as IpIcon,
  AccessTime as TimeIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Language as BrowserIcon,
  Devices as DeviceIcon,
  VpnKey as SessionIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import API from "../../api";
import { formatLeadDateTime } from "./leadHelpers";

export default function LoginDetailsModal({ open, onClose, userRow }) {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [auditData, setAuditData] = useState(null);
  const [copiedKey, setCopiedKey] = useState("");

  const targetUserId = userRow?.id || userRow?.raw?._id || userRow?._id;
  const userName = userRow?.name || userRow?.raw?.name || "User";

  const fetchAuditLogs = async () => {
    if (!targetUserId) return;
    setLoading(true);
    setError("");
    try {
      const res = await API.get(`/users/${targetUserId}/audit-logs`);
      if (res.data?.success) {
        setAuditData(res.data.data);
      } else {
        setError(res.data?.message || "Failed to load background telemetry.");
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      setError(err.response?.data?.message || "Could not retrieve security telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && targetUserId) {
      fetchAuditLogs();
    } else {
      setAuditData(null);
      setError("");
    }
  }, [open, targetUserId]);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    enqueueSnackbar("Copied to clipboard", { variant: "success", autoHideDuration: 1800 });
    setTimeout(() => setCopiedKey(""), 2000);
  };

  const user = auditData?.user || userRow?.raw || {};
  const lastLogin = user?.lastLoginDetails || {};
  const logs = auditData?.logs || [];
  const hasTelemetry = Boolean(lastLogin?.ip || logs.length > 0);

  const getDeviceIcon = (deviceType) => {
    const d = (deviceType || "").toLowerCase();
    if (d === "mobile") return <MobileIcon sx={{ fontSize: 20, color: "#0088FF" }} />;
    if (d === "tablet") return <TabletIcon sx={{ fontSize: 20, color: "#0088FF" }} />;
    return <DesktopIcon sx={{ fontSize: 20, color: "#0088FF" }} />;
  };

  const getActionChip = (action, status) => {
    let color = "#3B82F6";
    let bg = "#EFF6FF";
    let label = action || "ACTION";

    if (status === "FAILURE") {
      color = "#EF4444";
      bg = "#FEF2F2";
      label = `${action} (FAILED)`;
    } else if (action === "LOGIN") {
      color = "#10B981";
      bg = "#ECFDF5";
    } else if (action === "REGISTER") {
      color = "#8B5CF6";
      bg = "#F5F3FF";
    } else if (action === "USER_DELETE" || action === "COMMENT_DELETE") {
      color = "#EF4444";
      bg = "#FEF2F2";
    } else if (action === "PROFILE_EDIT" || action === "USER_EDIT") {
      color = "#F59E0B";
      bg = "#FFFBEB";
    } else if (action === "COMMENT_ADD" || action === "REPLY_ADD") {
      color = "#06B6D4";
      bg = "#ECFEFF";
    }

    return (
      <Chip
        label={label}
        size="small"
        sx={{
          bgcolor: bg,
          color,
          fontWeight: 700,
          fontSize: "11px",
          borderRadius: "6px",
          height: "22px",
          border: `1px solid ${color}33`,
        }}
      />
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          boxShadow: "0 24px 48px rgba(0,0,0,0.18)",
          overflow: "hidden",
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#0F172A",
          color: "#FFFFFF",
          py: 2,
          px: 3,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              bgcolor: "rgba(0, 136, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#38BDF8",
            }}
          >
            <SecurityIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", lineHeight: 1.2 }}>
              Browser Security & Network Telemetry
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
              <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "12px" }}>
                Target: <strong>{userName}</strong>
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B" }}>•</Typography>
              <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#38BDF8", bgcolor: "rgba(56, 189, 248, 0.1)", px: 0.75, py: 0.1, borderRadius: "4px", fontSize: "11px" }}>
                ID: {targetUserId}
              </Typography>
              <Tooltip title="Copy User ID">
                <IconButton size="small" onClick={() => handleCopy(targetUserId, "headerId")} sx={{ p: "1px", color: "#94A3B8" }}>
                  {copiedKey === "headerId" ? <CheckIcon sx={{ fontSize: 13, color: "#10B981" }} /> : <CopyIcon sx={{ fontSize: 13 }} />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton size="small" onClick={fetchAuditLogs} sx={{ color: "#94A3B8", "&:hover": { color: "#FFFFFF" } }} title="Refresh telemetry">
            <RefreshIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onClose} sx={{ color: "#94A3B8", "&:hover": { color: "#FFFFFF" } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: "#F8FAFC" }}>
        {loading && !auditData && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8 }}>
            <CircularProgress size={36} sx={{ color: "#0088FF", mb: 2 }} />
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              Fetching background network telemetry & browser logs...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "10px" }}>
            {error}
          </Alert>
        )}

        {auditData && (
          <Stack spacing={3}>
            {/* Notice banner if user hasn't logged in since telemetry system activation */}
            {!hasTelemetry && (
              <Alert severity="info" sx={{ borderRadius: "10px", bgcolor: "#EFF6FF", color: "#1E40AF" }}>
                <strong>No background telemetry recorded yet.</strong> This account has not logged in or performed actions since the audit telemetry system was enabled. Telemetry (IP, browser, OS, and session ID) is captured silently in the background whenever the user logs in, edits, comments, or accesses the platform.
              </Alert>
            )}

            {/* Technical Background Telemetry Grid */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: "14px",
                border: "1px solid #E2E8F0",
                bgcolor: "#FFFFFF",
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1E293B", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <IpIcon sx={{ fontSize: 18, color: "#10B981" }} />
                Background Network & Browser Telemetry
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                  gap: 2,
                }}
              >
                {/* 1. Verified Email */}
                <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                    <EmailIcon sx={{ fontSize: 15, color: "#0088FF" }} />
                    Verified Email
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: (user.email || logs[0]?.email) ? "#0F172A" : "#94A3B8", maxWidth: 150, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {user.email || logs[0]?.email || "No email record"}
                    </Typography>
                    {(user.email || logs[0]?.email) && (
                      <Tooltip title="Copy Email">
                        <IconButton size="small" onClick={() => handleCopy(user.email || logs[0]?.email, "email")} sx={{ p: "2px" }}>
                          {copiedKey === "email" ? <CheckIcon sx={{ fontSize: 14, color: "#16A34A" }} /> : <CopyIcon sx={{ fontSize: 14, color: "#94A3B8" }} />}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>

                {/* 2. Verified Phone */}
                <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                    <PhoneIcon sx={{ fontSize: 15, color: "#10B981" }} />
                    Verified Phone
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: (user.phone || logs[0]?.phone) ? "#0F172A" : "#94A3B8", maxWidth: 150, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {user.phone || logs[0]?.phone || "No phone record"}
                    </Typography>
                    {(user.phone || logs[0]?.phone) && (
                      <Tooltip title="Copy Phone">
                        <IconButton size="small" onClick={() => handleCopy(user.phone || logs[0]?.phone, "phone")} sx={{ p: "2px" }}>
                          {copiedKey === "phone" ? <CheckIcon sx={{ fontSize: 14, color: "#16A34A" }} /> : <CopyIcon sx={{ fontSize: 14, color: "#94A3B8" }} />}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>

                {/* 3. Public IP Address */}
                <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                    <IpIcon sx={{ fontSize: 15, color: "#10B981" }} />
                    Public IP Address
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: "monospace", color: lastLogin.ip ? "#15803D" : "#94A3B8" }}>
                      {lastLogin.ip || "No record"}
                    </Typography>
                    {lastLogin.ip && (
                      <Tooltip title="Copy IP">
                        <IconButton size="small" onClick={() => handleCopy(lastLogin.ip, "ip")} sx={{ p: "2px" }}>
                          {copiedKey === "ip" ? <CheckIcon sx={{ fontSize: 14, color: "#16A34A" }} /> : <CopyIcon sx={{ fontSize: 14, color: "#94A3B8" }} />}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>

                {/* 4. Session ID */}
                <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                    <SessionIcon sx={{ fontSize: 15, color: "#06B6D4" }} />
                    Session ID
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: "monospace", color: lastLogin.sessionId ? "#334155" : "#94A3B8", maxWidth: 140, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {lastLogin.sessionId || "—"}
                    </Typography>
                    {lastLogin.sessionId && (
                      <Tooltip title="Copy Session ID">
                        <IconButton size="small" onClick={() => handleCopy(lastLogin.sessionId, "session")} sx={{ p: "2px" }}>
                          {copiedKey === "session" ? <CheckIcon sx={{ fontSize: 14, color: "#16A34A" }} /> : <CopyIcon sx={{ fontSize: 14, color: "#94A3B8" }} />}
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>

                {/* 5. Login Timestamp */}
                <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                    <TimeIcon sx={{ fontSize: 15, color: "#0088FF" }} />
                    Login Timestamp
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: lastLogin.timestamp || user.lastLoginAt ? "#1E293B" : "#94A3B8" }}>
                    {lastLogin.timestamp || user.lastLoginAt ? formatLeadDateTime(lastLogin.timestamp || user.lastLoginAt) : "Never logged in"}
                  </Typography>
                </Box>

                {/* 6. Browser */}
                <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                    <BrowserIcon sx={{ fontSize: 15, color: "#8B5CF6" }} />
                    Browser (From HTTP Header)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: lastLogin.browser ? "#1E293B" : "#94A3B8" }}>
                    {lastLogin.browser || (lastLogin.ip ? "Unknown Browser" : "No record")}
                  </Typography>
                </Box>

                {/* 7. Operating System */}
                <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                    <DeviceIcon sx={{ fontSize: 15, color: "#F59E0B" }} />
                    Operating System
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: lastLogin.os ? "#1E293B" : "#94A3B8" }}>
                    {lastLogin.os || (lastLogin.ip ? "Unknown OS" : "No record")}
                  </Typography>
                </Box>

                {/* 8. Device Type */}
                <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                    {getDeviceIcon(lastLogin.device)}
                    Device Type
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: lastLogin.device ? "#1E293B" : "#94A3B8" }}>
                    {lastLogin.device || (lastLogin.ip ? "Desktop" : "No record")}
                  </Typography>
                </Box>
              </Box>

              {/* Raw User-Agent Header */}
              {lastLogin.userAgent && (
                <Box sx={{ bgcolor: "#F1F5F9", p: 1.75, borderRadius: "10px", border: "1px solid #E2E8F0", mt: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#475467", textTransform: "uppercase", fontSize: "10px" }}>
                      Raw HTTP User-Agent Header (Sent by Browser):
                    </Typography>
                    <Tooltip title="Copy User-Agent">
                      <IconButton size="small" onClick={() => handleCopy(lastLogin.userAgent, "ua")} sx={{ p: "2px" }}>
                        {copiedKey === "ua" ? <CheckIcon sx={{ fontSize: 14, color: "#16A34A" }} /> : <CopyIcon sx={{ fontSize: 14, color: "#94A3B8" }} />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography variant="caption" sx={{ fontFamily: "monospace", fontSize: "11px", color: "#334155", display: "block", wordBreak: "break-all" }}>
                    {lastLogin.userAgent}
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Audit Action History Table */}
            <Paper elevation={0} sx={{ borderRadius: "14px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
              <Box sx={{ px: 2.5, py: 1.75, bgcolor: "#FFFFFF", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: 1 }}>
                  <HistoryIcon sx={{ fontSize: 18, color: "#0088FF" }} />
                  Background Audit Log Records ({logs.length})
                </Typography>
                <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                  All network events: logins, edits, comments & deletions
                </Typography>
              </Box>

              {logs.length === 0 ? (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <Typography variant="body2" sx={{ color: "#94A3B8" }}>
                    No audit records registered yet for this user.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 260, overflowY: "auto" }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: "#F8FAFC", fontWeight: 700, fontSize: "11px", color: "#475467" }}>Action</TableCell>
                        <TableCell sx={{ bgcolor: "#F8FAFC", fontWeight: 700, fontSize: "11px", color: "#475467" }}>Timestamp</TableCell>
                        <TableCell sx={{ bgcolor: "#F8FAFC", fontWeight: 700, fontSize: "11px", color: "#475467" }}>Source IP Address</TableCell>
                        <TableCell sx={{ bgcolor: "#F8FAFC", fontWeight: 700, fontSize: "11px", color: "#475467" }}>Browser & OS</TableCell>
                        <TableCell sx={{ bgcolor: "#F8FAFC", fontWeight: 700, fontSize: "11px", color: "#475467" }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log._id} hover>
                          <TableCell sx={{ py: 1 }}>{getActionChip(log.action, log.status)}</TableCell>
                          <TableCell sx={{ py: 1, fontSize: "11px", color: "#334155", whiteSpace: "nowrap" }}>
                            {formatLeadDateTime(log.createdAt)}
                          </TableCell>
                          <TableCell sx={{ py: 1, fontSize: "11px", fontFamily: "monospace", color: "#0F172A" }}>
                            {log.ipAddress || "—"}
                          </TableCell>
                          <TableCell sx={{ py: 1, fontSize: "11px", color: "#475467" }}>
                            {log.browser || "Unknown"} {log.os ? `• ${log.os}` : ""}
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Chip
                              label={log.status || "SUCCESS"}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: "10px",
                                fontWeight: 700,
                                bgcolor: log.status === "SUCCESS" ? "#ECFDF5" : "#FEF2F2",
                                color: log.status === "SUCCESS" ? "#10B981" : "#EF4444",
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Paper>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, bgcolor: "#FFFFFF", borderTop: "1px solid #E2E8F0" }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 600,
            bgcolor: "#0088FF",
            "&:hover": { bgcolor: "#0066CC" },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

LoginDetailsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  userRow: PropTypes.object,
};
