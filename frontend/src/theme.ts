"use client";
import { createTheme, type Theme } from "@mui/material/styles";

/* Зелёная health-тема FitFood. Поддерживает светлый и тёмный режимы. */
type Mode = "light" | "dark";

const lightPalette = {
  mode: "light" as const,
  primary: { main: "#2E7D32", light: "#60ad5e", dark: "#1b5e20", contrastText: "#fff" },
  secondary: { main: "#66BB6A", contrastText: "#fff" },
  success: { main: "#43A047" },
  warning: { main: "#F9A825" },
  error: { main: "#E53935" },
  info: { main: "#0288D1" },
  background: { default: "#F6F8F5", paper: "#FFFFFF" },
  text: { primary: "#1B2A1E", secondary: "#5B6B5E" },
  divider: "rgba(46,125,50,0.12)",
};

const darkPalette = {
  mode: "dark" as const,
  primary: { main: "#66BB6A", light: "#98ee99", dark: "#338a3e", contrastText: "#06210b" },
  secondary: { main: "#81C784", contrastText: "#06210b" },
  success: { main: "#66BB6A" },
  warning: { main: "#FFB74D" },
  error: { main: "#EF5350" },
  info: { main: "#4FC3F7" },
  background: { default: "#0F140F", paper: "#1A211B" },
  text: { primary: "#E8F0E9", secondary: "#9DB0A1" },
  divider: "rgba(255,255,255,0.12)",
};

export function makeTheme(mode: Mode): Theme {
  return createTheme({
    cssVariables: true,
    palette: mode === "dark" ? darkPalette : lightPalette,
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
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
          root: ({ theme }) => ({
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.palette.mode === "light" ? "0 2px 10px rgba(27,42,30,0.04)" : "none",
            backgroundImage: "none",
          }),
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
          root: ({ theme }) => ({
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            backgroundImage: "none",
          }),
        },
      },
      MuiTextField: { defaultProps: { size: "small" } },
    },
  });
}

// Совместимость: дефолтный (светлый) инстанс темы.
const theme = makeTheme("light");
export default theme;
