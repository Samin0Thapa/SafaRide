import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#7c3aed', // Purple brand color
      dark: '#6d28d9', // Hover state
      light: '#f3e8ff', // Light background
      contrastText: '#ffffff', // White text on purple
    },
    secondary: {
      main: '#4caf50', // Green (for biking theme)
    },
    error: {
      main: '#f44336',
    },
    text: {
      primary: '#1e293b',
      secondary: '#475569',
    },
    grey: {
      400: '#64748b', // Muted text
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Disable uppercase transformation
          borderRadius: 8, // 2 * 4px = 8px for rounded corners
          minHeight: 48, // Mobile touch target
          fontWeight: 600,
        },
        sizeLarge: {
          paddingTop: 14, // py: 1.75 * 8px = 14px
          paddingBottom: 14,
          fontSize: '1rem',
        },
      },
    },
  },
});

export default theme;
