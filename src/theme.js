import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0088ff',
      light: '#3BA6FF',
      dark: '#0066CC',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6366F1',
      light: '#818CF8',
      dark: '#4F46E5',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F8FAFC',
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      disabled: '#9CA3AF',
    },
    success: { main: '#10B981' },
    error:   { main: '#EF4444' },
    warning: { main: '#F59E0B' },
    info:    { main: '#0088ff' },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: '"Inter", "Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 600 },
    body1: { fontWeight: 400, color: '#111827' },
    body2: { fontWeight: 400, color: '#374151' },
    button: { fontWeight: 600, textTransform: 'none' },
    caption: { color: '#6B7280' },
  },
  shape: { borderRadius: 10 },
  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.05)',
    '0 1px 4px rgba(0,0,0,0.06)',
    '0 2px 8px rgba(0,0,0,0.06)',
    '0 4px 12px rgba(0,0,0,0.07)',
    '0 8px 20px rgba(0,0,0,0.08)',
    '0 12px 28px rgba(0,0,0,0.09)',
    '0 16px 36px rgba(0,0,0,0.1)',
    '0 20px 44px rgba(0,0,0,0.1)',
    '0 24px 48px rgba(0,0,0,0.11)',
    '0 28px 52px rgba(0,0,0,0.11)',
    '0 32px 56px rgba(0,0,0,0.12)',
    '0 36px 60px rgba(0,0,0,0.12)',
    '0 40px 64px rgba(0,0,0,0.13)',
    '0 44px 68px rgba(0,0,0,0.13)',
    '0 48px 72px rgba(0,0,0,0.14)',
    '0 52px 76px rgba(0,0,0,0.14)',
    '0 56px 80px rgba(0,0,0,0.15)',
    '0 60px 84px rgba(0,0,0,0.15)',
    '0 64px 88px rgba(0,0,0,0.16)',
    '0 68px 92px rgba(0,0,0,0.16)',
    '0 72px 96px rgba(0,0,0,0.17)',
    '0 76px 100px rgba(0,0,0,0.17)',
    '0 80px 104px rgba(0,0,0,0.18)',
    '0 84px 108px rgba(0,0,0,0.18)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 18px',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          backgroundColor: '#0088ff',
          '&:hover': { backgroundColor: '#0077EE' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          border: '1px solid #EAECF0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          borderRadius: 12,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          border: '1px solid #EAECF0',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#fff',
            '& fieldset': { borderColor: '#D0D5DD' },
            '&:hover fieldset': { borderColor: '#0088ff' },
            '&.Mui-focused fieldset': { borderColor: '#0088ff' },
          },
          '& .MuiInputLabel-root': { color: '#374151' },
          '& .MuiInputLabel-root.Mui-focused': { color: '#0088ff' },
          '& .MuiOutlinedInput-input': { color: '#111827' },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#D0D5DD' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#0088ff' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0088ff' },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #F3F4F6',
          padding: '14px 16px',
          color: '#111827',
        },
        head: {
          backgroundColor: '#F9FAFB',
          fontWeight: 600,
          color: '#374151',
          fontSize: '13px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '12px' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #EAECF0',
          boxShadow: 'none',
          color: '#111827',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: '#E5E7EB' },
      },
    },
  },
});

export default theme;
