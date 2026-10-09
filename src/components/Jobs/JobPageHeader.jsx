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
            fontFamily: '"Outfit", sans-serif',
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
              borderColor: '#0088ff',
              color: '#0088ff',
              bgcolor: '#FFFFFF',
              boxShadow: 'none',
              flex: { xs: 1, sm: 'none' },
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              '&:hover': { bgcolor: 'rgba(0, 136, 255, 0.05)', borderColor: '#0070d6', boxShadow: 'none' }
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
              backgroundColor: '#0088ff',
              color: '#FFFFFF',
              boxShadow: 'none',
              whiteSpace: 'nowrap',
              flex: { xs: 1, sm: 'none' },
              transition: 'all 0.15s ease',
              '&:hover': {
                backgroundColor: '#0077ee',
                boxShadow: 'none'
              }
            }}
          >
            Post Job Opening
          </Button>
        </Stack>
      )}
    </Box>
  );
}
