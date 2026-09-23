import React from 'react';
import {
  Card,
  Box,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Chip,
  IconButton,
  Pagination
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  DeleteOutlined as DeleteIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { DeviceIcon, formatDate, formatTime } from './qrHelpers.jsx';

export default function QrActivityLogsTab({
  data,
  page,
  onPageChange,
  onBackToOverview,
  deviceFilter,
  osFilter,
  browserFilter,
  onDeviceFilterChange,
  onOsFilterChange,
  onBrowserFilterChange,
  onResetFilters,
  selectedIds,
  onSelectAll,
  onSelectRow,
  onOpenBatchDelete,
  onOpenDeleteSingle,
  onExportCsv,
  filteredDevices
}) {
  return (
    <Card sx={{ borderRadius: '18px', border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', bgcolor: '#FFFFFF', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: '1px solid #F1F5F9' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <IconButton size="small" onClick={onBackToOverview} sx={{ color: '#64748B' }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
              Device & Time Activity Log
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: { xs: 'none', sm: 'block' } }}>
              Records device type, OS, browser, IP address, access method, and exact timestamp.
            </Typography>
          </Box>
        </Stack>

        {/* Filter Toolbar */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{
            mt: 2.5,
            flexWrap: 'wrap',
            gap: 1,
            alignItems: { xs: 'stretch', sm: 'center' }
          }}
        >
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: 13 }}>All Devices</InputLabel>
            <Select
              value={deviceFilter}
              label="All Devices"
              onChange={(e) => onDeviceFilterChange(e.target.value)}
              sx={{ borderRadius: '10px', fontSize: 13 }}
            >
              <MenuItem value="all">All Devices</MenuItem>
              <MenuItem value="mobile">Mobile</MenuItem>
              <MenuItem value="desktop">Desktop</MenuItem>
              <MenuItem value="tablet">Tablet</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel sx={{ fontSize: 13 }}>All OS</InputLabel>
            <Select
              value={osFilter}
              label="All OS"
              onChange={(e) => onOsFilterChange(e.target.value)}
              sx={{ borderRadius: '10px', fontSize: 13 }}
            >
              <MenuItem value="all">All OS</MenuItem>
              <MenuItem value="Android">Android</MenuItem>
              <MenuItem value="iOS">iOS</MenuItem>
              <MenuItem value="Windows">Windows</MenuItem>
              <MenuItem value="macOS">macOS</MenuItem>
              <MenuItem value="Linux">Linux</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: 13 }}>All Browsers</InputLabel>
            <Select
              value={browserFilter}
              label="All Browsers"
              onChange={(e) => onBrowserFilterChange(e.target.value)}
              sx={{ borderRadius: '10px', fontSize: 13 }}
            >
              <MenuItem value="all">All Browsers</MenuItem>
              <MenuItem value="Chrome">Chrome</MenuItem>
              <MenuItem value="Safari">Safari</MenuItem>
              <MenuItem value="Firefox">Firefox</MenuItem>
              <MenuItem value="Edge">Edge</MenuItem>
            </Select>
          </FormControl>

          {(deviceFilter !== 'all' || osFilter !== 'all' || browserFilter !== 'all') && (
            <Button
              size="small"
              onClick={onResetFilters}
              sx={{ textTransform: 'none', color: '#64748B', fontWeight: 700 }}
            >
              Reset Filters
            </Button>
          )}

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', ml: { sm: 'auto !important' } }}>
            {selectedIds.length > 0 && (
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<DeleteIcon sx={{ fontSize: 17 }} />}
                onClick={onOpenBatchDelete}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  px: 1.75,
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)'
                }}
              >
                Delete Selected ({selectedIds.length})
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadIcon sx={{ fontSize: 18 }} />}
              onClick={onExportCsv}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                color: '#334155',
                borderColor: '#CBD5E1',
                bgcolor: '#FFFFFF'
              }}
            >
              Export CSV
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Table */}
      <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <Table size="medium" sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
            <TableRow>
              <TableCell padding="checkbox" sx={{ pl: 2 }}>
                <Checkbox
                  size="small"
                  indeterminate={selectedIds.length > 0 && selectedIds.length < filteredDevices.length}
                  checked={filteredDevices.length > 0 && selectedIds.length === filteredDevices.length}
                  onChange={onSelectAll}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.78rem' }}>Device / OS / Browser</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.78rem' }}>IP Address</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.78rem' }}>Access Method</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.78rem' }}>Timestamp</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#64748B', fontSize: '0.78rem' }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDevices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#94A3B8' }}>
                  No activity records found matching filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredDevices.map((item) => {
                const isQr = item.accessType === 'qr';
                const isSelected = selectedIds.includes(item._id);
                return (
                  <TableRow
                    key={item._id}
                    hover
                    selected={isSelected}
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      '&.Mui-selected': { bgcolor: '#EFF8FF' },
                      '&.Mui-selected:hover': { bgcolor: '#E0F2FE' }
                    }}
                  >
                    <TableCell padding="checkbox" sx={{ pl: 2 }}>
                      <Checkbox
                        size="small"
                        checked={isSelected}
                        onChange={() => onSelectRow(item._id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <DeviceIcon type={item.type} />
                        <Box>
                          <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.86rem' }}>
                            {item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Device'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem' }}>
                            ({item.os || 'OS'} • {item.browser || 'Browser'})
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#334155' }}>
                      {item.ip || '—'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={isQr ? 'QR Scan' : 'Direct Click'}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          bgcolor: isQr ? '#EFF8FF' : '#F0FDF4',
                          color: isQr ? '#0284C7' : '#16A34A',
                          border: `1px solid ${isQr ? '#BAE6FD' : '#BBF7D0'}`,
                          height: 22
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#64748B', fontSize: '0.82rem' }}>
                      {formatDate(item.timestamp)} {formatTime(item.timestamp)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => onOpenDeleteSingle(item)}
                        sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444' } }}
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
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid #F1F5F9' }}>
          <Pagination
            count={data.pagination.totalPages}
            page={page}
            onChange={(_, val) => onPageChange(val)}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Card>
  );
}
