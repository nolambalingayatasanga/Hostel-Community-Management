import React from 'react';
import ReactDOM from 'react-dom';
import { Stack, Button, CircularProgress } from '@mui/material';
import { RestartAltRounded as ResetIcon, LockRounded as LockIcon } from '@mui/icons-material';

const AccessHeaderActions = ({ portalNode, saving, onResetDefaults, onSave }) => {
  const actionButtons = (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Button
        variant="outlined"
        startIcon={<ResetIcon sx={{ fontSize: 18 }} />}
        onClick={onResetDefaults}
        disabled={saving}
        sx={{
          textTransform: 'none',
          borderRadius: '10px',
          borderColor: '#E2E8F0',
          backgroundColor: '#FFFFFF',
          color: '#475569',
          fontWeight: 600,
          fontSize: '13.5px',
          px: 2,
          py: 0.8,
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          transition: 'all 0.15s ease',
          '&:hover': {
            borderColor: '#CBD5E1',
            backgroundColor: '#F8FAFC',
            color: '#1E293B'
          }
        }}
      >
        Reset Defaults
      </Button>

      <Button
        variant="contained"
        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <LockIcon sx={{ fontSize: 17 }} />}
        onClick={onSave}
        disabled={saving}
        sx={{
          backgroundColor: '#0088ff',
          color: '#FFFFFF',
          fontWeight: 700,
          fontSize: '13.5px',
          borderRadius: '10px',
          textTransform: 'none',
          px: 2.5,
          py: 0.8,
          boxShadow: 'none',
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: '#1465D0',
            boxShadow: '0 6px 18px rgba(24, 119, 242, 0.45)'
          }
        }}
      >
        {saving ? 'Saving Config...' : 'Save Configuration'}
      </Button>
    </Stack>
  );

  if (portalNode) {
    return ReactDOM.createPortal(actionButtons, portalNode);
  }

  return actionButtons;
};

export default AccessHeaderActions;
