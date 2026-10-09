import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0088ff',
      light: '#33a0ff',
      dark: '#0070d6',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6366f1',
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
      disabled: '#94a3b8',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    error: {
      main: '#f43f5e',
      light: '#fb7185',
      dark: '#e11d48',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0088ff',
      light: '#33a0ff',
      dark: '#0070d6',
      contrastText: '#ffffff',
    },
    divider: 'rgba(226, 232, 240, 0.85)',
  },
  typography: {
    fontFamily: '"Inter", "Outfit", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontFamily: '"Outfit", "Inter", sans-serif',
      fontWeight: 800,
      letterSpacing: '-0.025em',
      color: '#0f172a',
    },
    h2: {
      fontFamily: '"Outfit", "Inter", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.025em',
      color: '#0f172a',
    },
    h3: {
      fontFamily: '"Outfit", "Inter", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#0f172a',
    },
    h4: {
      fontFamily: '"Outfit", "Inter", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: '#0f172a',
    },
    h5: {
      fontFamily: '"Outfit", "Inter", sans-serif',
      fontWeight: 600,
      letterSpacing: '-0.015em',
      color: '#0f172a',
    },
    h6: {
      fontFamily: '"Outfit", "Inter", sans-serif',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      color: '#0f172a',
    },
    subtitle1: {
      fontWeight: 500,
      letterSpacing: '-0.01em',
      color: '#475569',
    },
    subtitle2: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
      color: '#334155',
    },
    body1: {
      fontWeight: 400,
      color: '#0f172a',
      lineHeight: 1.6,
    },
    body2: {
      fontWeight: 400,
      color: '#475569',
      lineHeight: 1.55,
    },
    button: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      textTransform: 'none',
    },
    caption: {
      color: '#64748b',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: Array(25).fill('none'),
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 18px',
          fontWeight: 600,
          fontSize: '0.875rem',
          letterSpacing: '-0.01em',
          boxShadow: 'none !important',
          transition: 'all 0.15s ease',
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        containedPrimary: {
          backgroundColor: '#0088ff !important',
          color: '#ffffff !important',
          boxShadow: 'none !important',
          '&:hover': {
            backgroundColor: '#0077ee !important',
            boxShadow: 'none !important',
          },
        },
        outlinedPrimary: {
          borderColor: '#0088ff !important',
          color: '#0088ff !important',
          boxShadow: 'none !important',
          '&:hover': {
            borderColor: '#0070d6 !important',
            backgroundColor: 'rgba(0, 136, 255, 0.05) !important',
            boxShadow: 'none !important',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          border: '1px solid rgba(226, 232, 240, 0.85)',
          boxShadow: 'none !important',
          borderRadius: 16,
          transition: 'border-color 0.2s ease, transform 0.2s ease',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: 'none !important',
        },
        rounded: {
          borderRadius: 14,
        },
        elevation1: {
          border: '1px solid rgba(226, 232, 240, 0.85)',
          boxShadow: 'none !important',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          border: '1px solid rgba(226, 232, 240, 0.85)',
          boxShadow: 'none !important',
          borderRadius: 20,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#ffffff',
            boxShadow: 'none !important',
            transition: 'border-color 0.2s ease',
            '& fieldset': {
              borderColor: 'rgba(203, 213, 225, 0.8)',
            },
            '&:hover fieldset': {
              borderColor: '#0088ff',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0088ff',
              borderWidth: '1.5px',
            },
            '&.Mui-focused': {
              boxShadow: 'none !important',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#64748b',
            fontSize: '0.9rem',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#0088ff',
          },
          '& .MuiOutlinedInput-input': {
            color: '#0f172a',
            fontSize: '0.925rem',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#ffffff',
          boxShadow: 'none !important',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(203, 213, 225, 0.8)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0088ff',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0088ff',
            borderWidth: '1.5px',
          },
          '&.Mui-focused': {
            boxShadow: 'none !important',
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          boxShadow: 'none !important',
          border: '1px solid rgba(226, 232, 240, 0.85)',
          borderRadius: 12,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          boxShadow: 'none !important',
          border: '1px solid rgba(226, 232, 240, 0.85)',
          borderRadius: 12,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(241, 245, 249, 1)',
          padding: '14px 18px',
          color: '#0f172a',
          fontSize: '0.875rem',
        },
        head: {
          backgroundColor: '#f8fafc',
          fontWeight: 600,
          color: '#475569',
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.785rem',
          borderRadius: 8,
          letterSpacing: '-0.01em',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: 'none',
          color: '#0f172a',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontSize: '0.875rem',
          fontWeight: 500,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(226, 232, 240, 0.8)',
        },
      },
    },
  },
});

export default theme;
