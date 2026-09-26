import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { RateReview as FeedbackIcon, Add as AddIcon } from '@mui/icons-material';

export default function FeedbackHeader({ onAddFeedback }) {
  return (
    <Box
      sx={{
        mb: 2,
        width: '100%',
        display: 'flex',
        flexDirection: { xs: 'row', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1.5,
        flexShrink: 0
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: '#0F172A',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontSize: { xs: '1.15rem', sm: '1.45rem', md: '1.5rem' }
          }}
        >
          <FeedbackIcon sx={{ color: '#0088ff', fontSize: { xs: 22, sm: 26 } }} />
          Feedback & Suggestions
        </Typography>

 
      </Box>

      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          flexShrink: 0,
          ml: { sm: 'auto' },
          alignItems: 'center'
        }}
      >
        <Button
          variant="contained"
          startIcon={<AddIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
          onClick={onAddFeedback}
          sx={{
            borderRadius: '10px',
            px: { xs: 1.75, sm: 2.5 },
            py: { xs: 0.75, sm: 1 },
            textTransform: 'none',
            fontWeight: 700,
            fontSize: { xs: '12px', sm: '13.5px' },
            bgcolor: '#0088ff',
            boxShadow: '0 2px 8px rgba(0, 136, 255, 0.25)',
            whiteSpace: 'nowrap',
            '&:hover': { bgcolor: '#0077ee', boxShadow: 'none' }
          }}
        >
          Add Feedback
        </Button>
      </Stack>
    </Box>
  );
}
