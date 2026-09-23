import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import {
  Work as WorkIcon,
  Business as BusinessIcon,
  Add as AddIcon
} from '@mui/icons-material';

export default function JobPageHeader({
  canCreateOrganization,
  organization,
  onOpenOrgDialog,
  onOpenPostJob
}) {
  return (
    <Box
      sx={{
        mb: 1.5,
        width: '100%',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 1.5,
        flexShrink: 0
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: '#0F172A',
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            fontSize: { xs: '20px', sm: '24px' }
          }}
        >
          <WorkIcon sx={{ color: '#0088ff', fontSize: { xs: 24, sm: 28 } }} />
          Job Openings & Careers
        </Typography>
      </Box>

      {canCreateOrganization && (
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
          sx={{
            flexShrink: 0,
            ml: { sm: 'auto' },
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          {/* Organization Profile setup */}
          <Button
            variant="outlined"
            startIcon={<BusinessIcon sx={{ fontSize: 18 }} />}
            onClick={onOpenOrgDialog}
            sx={{
              borderRadius: '10px',
              px: 2,
              py: 0.9,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: { xs: '12.5px', sm: '13.5px' },
              borderColor: '#CBD5E1',
              color: '#334155',
              bgcolor: '#FFFFFF',
              flex: { xs: 1, sm: 'none' },
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' }
            }}
          >
            {organization ? organization.name : 'Setup Organization'}
          </Button>

          {/* Post Job Opening Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => onOpenPostJob()}
            sx={{
              borderRadius: '10px',
              px: { xs: 2, sm: 2.5 },
              py: 0.9,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: { xs: '12.5px', sm: '13.5px' },
              bgcolor: '#0088ff',
              boxShadow: '0 2px 8px rgba(0, 136, 255, 0.25)',
              whiteSpace: 'nowrap',
              flex: { xs: 1, sm: 'none' },
              '&:hover': { bgcolor: '#0077ee', boxShadow: 'none' }
            }}
          >
            Post Job Opening
          </Button>
        </Stack>
      )}
    </Box>
  );
}
