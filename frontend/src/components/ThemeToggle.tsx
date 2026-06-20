"use client";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import { useColorMode } from "@/lib/colorMode";

export default function ThemeToggle({ size = "medium" }: { size?: "small" | "medium" }) {
  const { mode, toggle } = useColorMode();
  const dark = mode === "dark";
  return (
    <Tooltip title={dark ? "Светлая тема" : "Тёмная тема"}>
      <IconButton onClick={toggle} size={size} aria-label="Переключить тему" color="inherit">
        {dark ? <LightModeRoundedIcon fontSize={size === "small" ? "small" : "medium"} /> : <DarkModeRoundedIcon fontSize={size === "small" ? "small" : "medium"} />}
      </IconButton>
    </Tooltip>
  );
}
