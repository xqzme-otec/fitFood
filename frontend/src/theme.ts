"use client";
import { createTheme } from "@mui/material/styles";

/* Свежая зелёная health-тема FitFood: воздушно, светло, скруглённые карточки. */
const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: { main: "#2E7D32", light: "#60ad5e", dark: "#1b5e20", contrastText: "#fff" },
    secondary: { main: "#66BB6A", contrastText: "#fff" },
    success: { main: "#43A047" },
    warning: { main: "#F9A825" },
    error: { main: "#E53935" },
    info: { main: "#0288D1" },
    background: { default: "#F6F8F5", paper: "#FFFFFF" },
    text: { primary: "#1B2A1E", secondary: "#5B6B5E" },
    divider: "rgba(46,125,50,0.12)",
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily:
      '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, fontSize: "2rem" },
    h2: { fontWeight: 800, fontSize: "1.6rem" },
    h3: { fontWeight: 700, fontSize: "1.3rem" },
    h4: { fontWeight: 700, fontSize: "1.1rem" },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: "1px solid rgba(46,125,50,0.10)",
          boxShadow: "0 2px 10px rgba(27,42,30,0.04)",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 10 } },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
      styleOverrides: {
        root: { borderBottom: "1px solid rgba(46,125,50,0.10)", backgroundColor: "#FFFFFF" },
      },
    },
    MuiTextField: { defaultProps: { size: "small" } },
  },
});

export default theme;
