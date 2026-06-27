import { createTheme } from "@mui/material/styles";

const bodyFont = 'Roboto, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const headingFont = 'Merriweather, Georgia, serif';

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#363938", // Графит
      dark: "#1e201f",
      light: "#eceae4",
      contrastText: "#FFFFFF"
    },
    secondary: {
      main: "#BEA44F", // Золото
      dark: "#9c823b",
      light: "#f9f6ef",
      contrastText: "#FFFFFF"
    },
    success: {
      main: "#16A34A"
    },
    background: {
      default: "#f5f2ea", // Тёплый светлый (кремовый) фон
      paper: "#FFFFFF"
    },
    text: {
      primary: "#363938", // Графит
      secondary: "#6B6D6B" // Приглушенный графит
    }
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    fontFamily: bodyFont,
    h1: { fontFamily: headingFont, fontWeight: 900, letterSpacing: 0 },
    h2: { fontFamily: headingFont, fontWeight: 900, letterSpacing: 0 },
    h3: { fontFamily: headingFont, fontWeight: 800, letterSpacing: 0 },
    h4: { fontFamily: headingFont, fontWeight: 700, letterSpacing: 0 },
    h5: { fontFamily: headingFont, fontWeight: 700, letterSpacing: 0 },
    h6: { fontFamily: headingFont, fontWeight: 700, letterSpacing: 0 },
    button: { fontFamily: bodyFont, fontWeight: 700, letterSpacing: 0, textTransform: "none" }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ":root": {
          "--gold": "#BEA44F",
          "--graphite": "#363938",
          "--bg": "#f5f2ea",
          "--grad-brand": "linear-gradient(135deg, #484c4a 0%, #2b2d2c 100%)",
          "--grad-gold": "linear-gradient(135deg, #BEA44F 0%, #D4AF37 100%)",
          "--grad-brand-soft": "linear-gradient(135deg, #d2c499 0%, #a3946a 100%)"
        },
        body: {
          backgroundColor: "var(--bg)",
          color: "var(--graphite)"
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: 8,
          boxShadow: "none"
        },
        contained: {
          boxShadow: "0 10px 15px -3px rgba(54, 57, 56, 0.22)"
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #e3ded1",
          borderRadius: 8,
          boxShadow: "0 10px 24px -18px rgba(54, 57, 56, 0.35)"
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
