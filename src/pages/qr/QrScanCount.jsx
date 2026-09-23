import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Button,
  Alert,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  QrCode2 as QrCodeIcon,
  TrendingUp as TrendingUpIcon,
  History as HistoryIcon,
  Dashboard as DashboardIcon,
  WarningAmber as WarningIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import QRCode from 'qrcode';
import API from '../../api';

import {
  QrScanSkeleton,
  QrNavSidebar,
  QrOverviewTab,
  QrLinksTab,
  QrAnalyticsTab,
  QrActivityLogsTab,
  UpdateDestinationDialog,
  DeleteRecordDialog,
  BatchDeleteDialog,
  formatDate,
  formatTime
} from '../../components/QrScan/index.js';

export default function QrScanCount() {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const qrCanvasRef = useRef(null);

  // Active navigation tab (0: Overview, 1: QR & Links, 2: Analytics, 3: Activity Logs)
  const [activeTab, setActiveTab] = useState(0);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [copiedDirect, setCopiedDirect] = useState(false);
  const [copiedAccess, setCopiedAccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [testingClick, setTestingClick] = useState(false);
  const [page, setPage] = useState(1);

  // Update Link Dialog state
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [newRedirectUrl, setNewRedirectUrl] = useState('');
  const [regenerateQrCheck, setRegenerateQrCheck] = useState(false);
  const [updatingLink, setUpdatingLink] = useState(false);
  const [qrUpdatedBanner, setQrUpdatedBanner] = useState(false);

  // Activity Logs Filters
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [osFilter, setOsFilter] = useState('all');
  const [browserFilter, setBrowserFilter] = useState('all');

  // Delete log state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchLoginQr = useCallback(
    async (currentPage = page, silent = false) => {
      try {
        if (!silent) setLoading(true);
        const res = await API.get('/qr-scans/login-qr', {
          params: { page: currentPage, limit: 30 }
        });
        if (res.data?.success) {
          setData(res.data.data);
          if (res.data.data?.redirectUrl && !newRedirectUrl) {
            setNewRedirectUrl(res.data.data.redirectUrl);
          }
        }
      } catch (err) {
        if (!silent) {
          enqueueSnackbar(err.response?.data?.message || 'Failed to load QR scan data', { variant: 'error' });
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [page, enqueueSnackbar, newRedirectUrl]
  );

  useEffect(() => {
    fetchLoginQr(page);
  }, [page]);

  useEffect(() => {
    const timer = setInterval(() => fetchLoginQr(page, true), 10000);
    return () => clearInterval(timer);
  }, [fetchLoginQr, page]);

  useEffect(() => {
    if (!data?.qrTrackingLink || !qrCanvasRef.current || activeTab !== 1) return;
    QRCode.toCanvas(qrCanvasRef.current, data.qrTrackingLink, {
      width: isMobile ? 180 : 200,
      margin: 1,
      color: { dark: '#0F172A', light: '#FFFFFF' }
    }).catch((err) => console.error('QR render error:', err));
  }, [data?.qrTrackingLink, isMobile, activeTab]);

  const directLinkUrl = data?.trackingLink || `${window.location.origin}/login`;

  const handleCopyText = async (text, type, label) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'code') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else if (type === 'direct') {
        setCopiedDirect(true);
        setTimeout(() => setCopiedDirect(false), 2000);
      } else if (type === 'access') {
        setCopiedAccess(true);
        setTimeout(() => setCopiedAccess(false), 2000);
      }
      enqueueSnackbar(`${label} copied to clipboard`, { variant: 'success' });
    } catch {
      enqueueSnackbar('Unable to copy to clipboard', { variant: 'error' });
    }
  };

  const handleTestDirectClick = async () => {
    try {
      setTestingClick(true);
      const res = await API.get('/qr-scans/track-direct');
      if (res.data?.success) {
        enqueueSnackbar('Direct Click successfully tracked! Count updated.', { variant: 'success' });
        await fetchLoginQr(page, true);
      }
    } catch (_err) {
      window.open(directLinkUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setTestingClick(false);
    }
  };

  const handleDownloadQr = async (format = 'png') => {
    try {
      setDownloading(true);
      const res = await API.get('/qr-scans/login-qr/download', { params: { format }, responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `kambi-connect-login-qr.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      enqueueSnackbar(`QR code downloaded as ${format.toUpperCase()}`, { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to download QR code', { variant: 'error' });
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenUpdateDialog = () => {
    setNewRedirectUrl(data?.redirectUrl || 'https://www.kambi-connect.in/login');
    setRegenerateQrCheck(false);
    setUpdateDialogOpen(true);
  };

  const handleUpdateLinkSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newRedirectUrl.trim()) {
      enqueueSnackbar('Please enter a valid destination redirect URL', { variant: 'warning' });
      return;
    }
    try {
      setUpdatingLink(true);
      const res = await API.put('/qr-scans/login-qr', {
        redirectUrl: newRedirectUrl.trim(),
        regenerateQr: regenerateQrCheck
      });
      if (res.data?.success) {
        setData(res.data.data);
        setUpdateDialogOpen(false);
        if (res.data.qrUpdated) {
          setQrUpdatedBanner(true);
          enqueueSnackbar('Destination updated and new QR code generated! Please download the new QR.', {
            variant: 'warning',
            autoHideDuration: 6000
          });
        } else {
          enqueueSnackbar('Destination link updated! Existing QR code and counts are preserved.', { variant: 'success' });
        }
      }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to update link', { variant: 'error' });
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
        setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget._id));
        enqueueSnackbar('Scan record deleted', { variant: 'success' });
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
      }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete record', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredDevices.map((d) => d._id).filter(Boolean));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const confirmDeleteBatch = async () => {
    if (!selectedIds.length) return;
    try {
      setDeleting(true);
      const res = await API.delete('/qr-scans/login-qr/devices', {
        data: { ids: selectedIds },
        params: { page, limit: 30 }
      });
      if (res.data?.success) {
        setData(res.data.data || null);
        if (!res.data.data) fetchLoginQr(page);
        enqueueSnackbar(`${selectedIds.length} records deleted successfully`, { variant: 'success' });
        setSelectedIds([]);
        setBatchDeleteDialogOpen(false);
      }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete selected records', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // Filtered devices list for Tab 4 (Activity Logs)
  const filteredDevices = useMemo(() => {
    const list = data?.devices || [];
    return list.filter((item) => {
      if (deviceFilter !== 'all' && (item.type || 'desktop').toLowerCase() !== deviceFilter.toLowerCase()) {
        return false;
      }
      if (osFilter !== 'all' && !String(item.os || '').toLowerCase().includes(osFilter.toLowerCase())) {
        return false;
      }
      if (browserFilter !== 'all' && !String(item.browser || '').toLowerCase().includes(browserFilter.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [data?.devices, deviceFilter, osFilter, browserFilter]);

  const handleExportCsv = () => {
    const devices = filteredDevices;
    if (!devices.length) {
      enqueueSnackbar('No scan records to export', { variant: 'info' });
      return;
    }
    const headers = ['IP Address', 'Device Type', 'OS', 'Browser', 'Access Method', 'Date', 'Time'];
    const rows = devices.map((d) => [
      `"${d.ip || ''}"`,
      `"${d.type || ''}"`,
      `"${d.os || ''}"`,
      `"${d.browser || ''}"`,
      `"${d.accessType === 'qr' ? 'QR Scan' : 'Direct Click'}"`,
      `"${formatDate(d.timestamp)}"`,
      `"${formatTime(d.timestamp)}"`
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_Activity_Logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const navTabs = [
    { label: 'Overview', icon: <DashboardIcon sx={{ fontSize: 19 }} /> },
    { label: 'QR & Links', icon: <QrCodeIcon sx={{ fontSize: 19 }} /> },
    { label: 'Analytics', icon: <TrendingUpIcon sx={{ fontSize: 19 }} /> },
    { label: 'Activity Logs', icon: <HistoryIcon sx={{ fontSize: 19 }} /> }
  ];

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1440, mx: 'auto' }}>
      {/* Persistent Warning when QR is updated */}
      {qrUpdatedBanner && (
        <Alert
          severity="warning"
          icon={<WarningIcon fontSize="inherit" />}
          onClose={() => setQrUpdatedBanner(false)}
          sx={{ mb: 2.5, borderRadius: '12px', fontWeight: 600 }}
          action={
            <Button size="small" color="inherit" onClick={() => handleDownloadQr('png')} sx={{ fontWeight: 700, textTransform: 'none' }}>
              Download New QR
            </Button>
          }
        >
          Destination updated and new QR code generated! Please download and replace previous printed or distributed QR codes. All previous scan statistics remain preserved.
        </Alert>
      )}

      {/* Main Layout: Responsive Left Sidebar on Desktop, Top Tabs on Mobile */}
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Sidebar Column (Desktop) / Top Tabs (Mobile) */}
        <Grid size={{ xs: 12, md: 3, lg: 2.5 }}>
          <QrNavSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            navTabs={navTabs}
            isMobile={isMobile}
            loading={loading}
            onRefresh={() => fetchLoginQr(page)}
          />
        </Grid>

        {/* Main Content Column */}
        <Grid size={{ xs: 12, md: 9, lg: 9.5 }}>
          {loading && !data ? (
            <QrScanSkeleton />
          ) : (
            <>
              {/* TAB 0: OVERVIEW */}
              {activeTab === 0 && (
                <QrOverviewTab
                  data={data}
                  onNavigateDrive={() => navigate('/drive')}
                />
              )}

              {/* TAB 1: QR & LINKS */}
              {activeTab === 1 && (
                <QrLinksTab
                  data={data}
                  qrCanvasRef={qrCanvasRef}
                  copiedCode={copiedCode}
                  copiedDirect={copiedDirect}
                  copiedAccess={copiedAccess}
                  downloading={downloading}
                  testingClick={testingClick}
                  directLinkUrl={directLinkUrl}
                  onCopyText={handleCopyText}
                  onDownloadQr={handleDownloadQr}
                  onTestDirectClick={handleTestDirectClick}
                  onOpenUpdateDialog={handleOpenUpdateDialog}
                />
              )}

              {/* TAB 2: ANALYTICS & TRENDS */}
              {activeTab === 2 && (
                <QrAnalyticsTab data={data} />
              )}

              {/* TAB 3: ACTIVITY LOGS */}
              {activeTab === 3 && (
                <QrActivityLogsTab
                  data={data}
                  page={page}
                  onPageChange={setPage}
                  onBackToOverview={() => setActiveTab(0)}
                  deviceFilter={deviceFilter}
                  osFilter={osFilter}
                  browserFilter={browserFilter}
                  onDeviceFilterChange={setDeviceFilter}
                  onOsFilterChange={setOsFilter}
                  onBrowserFilterChange={setBrowserFilter}
                  onResetFilters={() => {
                    setDeviceFilter('all');
                    setOsFilter('all');
                    setBrowserFilter('all');
                  }}
                  selectedIds={selectedIds}
                  onSelectAll={handleSelectAll}
                  onSelectRow={handleSelectRow}
                  onOpenBatchDelete={() => setBatchDeleteDialogOpen(true)}
                  onOpenDeleteSingle={(item) => {
                    setDeleteTarget(item);
                    setDeleteDialogOpen(true);
                  }}
                  onExportCsv={handleExportCsv}
                  filteredDevices={filteredDevices}
                />
              )}
            </>
          )}
        </Grid>
      </Grid>

      {/* UPDATE LINK DIALOG */}
      {updateDialogOpen && (
        <UpdateDestinationDialog
          open={updateDialogOpen}
          onClose={() => setUpdateDialogOpen(false)}
          newRedirectUrl={newRedirectUrl}
          onRedirectUrlChange={setNewRedirectUrl}
          regenerateQrCheck={regenerateQrCheck}
          onRegenerateQrCheckChange={setRegenerateQrCheck}
          onSubmit={handleUpdateLinkSubmit}
          updatingLink={updatingLink}
        />
      )}

      {/* DELETE SINGLE RECORD DIALOG */}
      {deleteDialogOpen && (
        <DeleteRecordDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          target={deleteTarget}
          onConfirmDelete={confirmDeleteSingle}
          deleting={deleting}
        />
      )}

      {/* BATCH DELETE MULTIPLE RECORDS DIALOG */}
      {batchDeleteDialogOpen && (
        <BatchDeleteDialog
          open={batchDeleteDialogOpen}
          onClose={() => setBatchDeleteDialogOpen(false)}
          selectedCount={selectedIds.length}
          onConfirmBatchDelete={confirmDeleteBatch}
          deleting={deleting}
        />
      )}
    </Box>
  );
}
