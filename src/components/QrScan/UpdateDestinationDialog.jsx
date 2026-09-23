import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Box,
  FormControlLabel,
  Checkbox,
  Alert,
  Button,
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon, InfoOutlined as InfoIcon } from '@mui/icons-material';

export default function UpdateDestinationDialog({
  open,
  onClose,
  newRedirectUrl,
  onRedirectUrlChange,
  regenerateQrCheck,
  onRegenerateQrCheckChange,
  onSubmit,
  updatingLink
}) {
  return (
    <Dialog
      open={open}
      onClose={() => !updatingLink && onClose()}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: { sx: { borderRadius: '18px' } }
      }}
    >
      <form onSubmit={onSubmit}>
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon sx={{ color: '#0284C7' }} />
          Update Destination Link
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2.5 }}>
          <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
            Update where visitors are redirected when scanning the QR code or clicking the direct portal link.
          </Typography>

          <TextField
            fullWidth
            label="Destination URL"
            value={newRedirectUrl}
            onChange={(e) => onRedirectUrlChange(e.target.value)}
            placeholder="https://www.kambi-connect.in/login"
            helperText="Target URL where users will land upon scanning or clicking."
            sx={{ mb: 2.5 }}
          />

          <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={regenerateQrCheck}
                  onChange={(e) => onRegenerateQrCheckChange(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                    Regenerate QR Code with a new code
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Leave unchecked to keep current QR code (it will automatically redirect to the new destination). Check this if you require a brand new unique QR code.
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Alert severity="info" icon={<InfoIcon fontSize="inherit" />} sx={{ borderRadius: '10px', fontSize: '0.82rem' }}>
            <strong>All existing analytics are preserved:</strong> Your previous scan counts, direct clicks, and device history will remain untouched. Any new interactions will seamlessly accumulate on top of old counts.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} disabled={updatingLink} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={updatingLink}
            sx={{
              bgcolor: '#0284C7',
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              '&:hover': { bgcolor: '#0369A1' }
            }}
          >
            {updatingLink ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Save & Update Link'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
