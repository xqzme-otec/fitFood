"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { makeTheme } from "@/theme";

type Mode = "light" | "dark";
const KEY = "fitfood_theme";

interface ColorModeValue {
  mode: Mode;
  toggle: () => void;
  setMode: (m: Mode) => void;
}

const ColorModeContext = createContext<ColorModeValue>({
  mode: "light",
  toggle: () => {},
  setMode: () => {},
});

export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>("light");

  // При монтировании берём сохранённый выбор или системную тему.
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem(KEY)) as Mode | null;
    if (saved === "light" || saved === "dark") {
      setModeState(saved);
    } else if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setModeState("dark");
    }
  }, []);

  const value = useMemo<ColorModeValue>(() => {
    const apply = (m: Mode) => {
      if (typeof window !== "undefined") localStorage.setItem(KEY, m);
      setModeState(m);
    };
    return {
      mode,
      setMode: apply,
      toggle: () => apply(mode === "dark" ? "light" : "dark"),
    };
  }, [mode]);

  const theme = useMemo(() => makeTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export const useColorMode = () => useContext(ColorModeContext);
