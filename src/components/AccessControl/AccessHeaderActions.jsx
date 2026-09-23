import React from 'react';
import ReactDOM from 'react-dom';
import { Stack, Button, CircularProgress, Box } from '@mui/material';
import { LockRounded as LockIcon } from '@mui/icons-material';

export default function AccessHeaderActions({ portalNode, saving, onResetDefaults, onSave }) {
  const actionButtons = (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Button
        variant="contained"
        startIcon={
          saving ? (
            <CircularProgress size={15} color="inherit" />
          ) : (
            <LockIcon sx={{ fontSize: { xs: 15, sm: 17 } }} />
          )
        }
        onClick={onSave}
        disabled={saving}
        sx={{
          backgroundColor: '#0088ff',
          color: '#FFFFFF',
          fontWeight: 700,
          fontSize: { xs: '12px', sm: '13.5px' },
          borderRadius: '10px',
          textTransform: 'none',
          px: { xs: 1.5, sm: 2.5 },
          py: { xs: 0.6, sm: 0.8 },
          minWidth: 'auto',
          whiteSpace: 'nowrap',
          boxShadow: 'none',
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: '#1465D0',
            boxShadow: '0 6px 18px rgba(24, 119, 242, 0.45)'
          }
        }}
      >
        <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
          {saving ? 'Saving...' : 'Save'}
        </Box>
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
          {saving ? 'Saving Config...' : 'Save Configuration'}
        </Box>
      </Button>
    </Stack>
  );

  if (portalNode) {
    return ReactDOM.createPortal(actionButtons, portalNode);
  }

  return actionButtons;
}
