import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1E3A8A",
      dark: "#172554",
      light: "#DBEAFE",
      contrastText: "#FFFFFF"
    },
    secondary: {
      main: "#D97706",
      dark: "#B45309",
      light: "#FEF3C7",
      contrastText: "#FFFFFF"
    },
    success: {
      main: "#16A34A"
    },
    background: {
      default: "#F6F8FB",
      paper: "#FFFFFF"
    },
    text: {
      primary: "#111827",
      secondary: "#4B5563"
    }
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontWeight: 800, letterSpacing: 0 },
    h2: { fontWeight: 800, letterSpacing: 0 },
    h3: { fontWeight: 800, letterSpacing: 0 },
    h4: { fontWeight: 800, letterSpacing: 0 },
    h5: { fontWeight: 700, letterSpacing: 0 },
    h6: { fontWeight: 700, letterSpacing: 0 },
    button: { fontWeight: 700, letterSpacing: 0, textTransform: "none" }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: 8,
          boxShadow: "none"
        },
        contained: {
          boxShadow: "0 10px 15px -3px rgba(29, 78, 216, 0.22)"
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #E5E7EB",
          borderRadius: 8,
          boxShadow: "0 10px 24px -18px rgba(17, 24, 39, 0.35)"
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 8
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined"
      },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 700
        }
      }
    }
  }
});
