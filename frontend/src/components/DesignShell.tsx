"use client";
import { useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { alpha, useTheme } from "@mui/material/styles";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import KitchenRoundedIcon from "@mui/icons-material/KitchenRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EnergySavingsLeafRoundedIcon from "@mui/icons-material/EnergySavingsLeafRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";

const DRAWER_WIDTH = 268;

const NAV_GROUPS: { label: string; items: { href: string; label: string; icon: React.ReactNode }[] }[] = [
  {
    label: "Меню",
    items: [
      { href: "/today", label: "Главная", icon: <DashboardRoundedIcon /> },
      { href: "/diary", label: "Дневник", icon: <MenuBookRoundedIcon /> },
      { href: "/fridge", label: "Холодильник", icon: <KitchenRoundedIcon /> },
      { href: "/recipes", label: "Рецепты", icon: <RestaurantMenuRoundedIcon /> },
    ],
  },
  {
    label: "Ещё",
    items: [
      { href: "/receipt", label: "Сканер чека", icon: <ReceiptLongRoundedIcon /> },
      { href: "/profile", label: "Профиль", icon: <PersonRoundedIcon /> },
    ],
  },
];

// Демо-сводка дня для прогресса в сайдбаре (прототип, без бэкенда).
const DEMO = { consumed: 1540, target: 2100 };

function MiniRing({ value, size = 64 }: { value: number; size?: number }) {
  return (
    <Box sx={{ position: "relative", width: size, height: size, flex: "none" }}>
      <CircularProgress variant="determinate" value={100} size={size} thickness={5} sx={{ color: alpha("#2E7D32", 0.15), position: "absolute", left: 0 }} />
      <CircularProgress
        variant="determinate"
        value={value}
        size={size}
        thickness={5}
        sx={{ color: "primary.main", "& .MuiCircularProgress-circle": { strokeLinecap: "round" } }}
      />
      <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        <Typography variant="caption" sx={{ fontWeight: 800 }}>
          {Math.round(value)}%
        </Typography>
      </Box>
    </Box>
  );
}

function Brand() {
  return (
    <Stack direction="row" alignItems="center" spacing={1.2}>
      <Avatar sx={{ bgcolor: "primary.main", width: 38, height: 38 }} variant="rounded">
        <EnergySavingsLeafRoundedIcon />
      </Avatar>
      <Typography variant="h5" sx={{ fontWeight: 800 }}>
        Fit<Box component="span" sx={{ color: "primary.main" }}>Food</Box>
      </Typography>
    </Stack>
  );
}

export default function DesignShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const pathname = usePathname();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"), { noSsr: true });
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState<null | HTMLElement>(null);
  const pct = Math.min((DEMO.consumed / DEMO.target) * 100, 100);
  const active = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", p: 2 }}>
      <Box sx={{ px: 1, py: 1.5 }}>
        <Brand />
      </Box>

      {/* Мини-прогресс дня */}
      <Box
        sx={{
          mt: 1,
          p: 2,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${alpha("#2E7D32", 0.10)}, ${alpha("#66BB6A", 0.06)})`,
          border: "1px solid",
          borderColor: alpha("#2E7D32", 0.12),
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <MiniRing value={pct} />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Сегодня
            </Typography>
            <Typography sx={{ fontWeight: 800, lineHeight: 1.1 }}>
              {DEMO.consumed.toLocaleString("ru-RU")}
              <Box component="span" sx={{ color: "text.secondary", fontWeight: 600, fontSize: 13 }}>
                {" "}/ {DEMO.target.toLocaleString("ru-RU")}
              </Box>
            </Typography>
            <Typography variant="caption" sx={{ color: "success.main", fontWeight: 700 }}>
              осталось {DEMO.target - DEMO.consumed} ккал
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Навигация по секциям */}
      <Box sx={{ flex: 1, overflowY: "auto", mt: 2 }}>
        {NAV_GROUPS.map((group) => (
          <Box key={group.label} sx={{ mb: 2 }}>
            <Typography
              variant="overline"
              sx={{ px: 1.5, color: "text.secondary", fontWeight: 700, letterSpacing: 1 }}
            >
              {group.label}
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 0.5 }}>
              {group.items.map((item) => {
                const on = active(item.href);
                return (
                  <Stack
                    key={item.href}
                    component={NextLink}
                    href={item.href}
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    onClick={() => setOpen(false)}
                    sx={{
                      px: 1.5,
                      py: 1.25,
                      borderRadius: 3,
                      textDecoration: "none",
                      color: on ? "primary.main" : "text.primary",
                      bgcolor: on ? alpha("#2E7D32", 0.10) : "transparent",
                      fontWeight: 600,
                      position: "relative",
                      transition: "background .15s",
                      "&:hover": { bgcolor: on ? alpha("#2E7D32", 0.14) : alpha("#2E7D32", 0.05) },
                      "&::before": on
                        ? {
                            content: '""',
                            position: "absolute",
                            left: 0,
                            top: "22%",
                            bottom: "22%",
                            width: 3,
                            borderRadius: 3,
                            bgcolor: "primary.main",
                          }
                        : {},
                    }}
                  >
                    <Box sx={{ display: "flex", color: on ? "primary.main" : "text.secondary" }}>{item.icon}</Box>
                    <Typography sx={{ fontWeight: 600 }}>{item.label}</Typography>
                  </Stack>
                );
              })}
            </Stack>
          </Box>
        ))}
      </Box>

      {/* Акцентная кнопка + пользователь */}
      <Stack spacing={1.5}>
        <Button variant="contained" size="large" startIcon={<AddRoundedIcon />} sx={{ borderRadius: 3, py: 1.2 }}>
          Добавить приём
        </Button>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          onClick={(e) => setUserMenu(e.currentTarget)}
          sx={{
            p: 1,
            borderRadius: 3,
            cursor: "pointer",
            bgcolor: userMenu ? alpha("#2E7D32", 0.10) : alpha("#2E7D32", 0.04),
            transition: "background .15s",
            "&:hover": { bgcolor: alpha("#2E7D32", 0.10) },
          }}
        >
          <Avatar sx={{ bgcolor: "secondary.main", width: 36, height: 36 }}>А</Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
              Анна
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Похудение · 78 кг
            </Typography>
          </Box>
          <KeyboardArrowUpRoundedIcon
            fontSize="small"
            sx={{ color: "text.secondary", transform: userMenu ? "rotate(180deg)" : "none", transition: "transform .15s" }}
          />
        </Stack>
      </Stack>

      {/* Меню пользователя */}
      <Menu
        anchorEl={userMenu}
        open={!!userMenu}
        onClose={() => setUserMenu(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        slotProps={{ paper: { sx: { width: 220, borderRadius: 3, mt: -1 } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontWeight: 700 }}>Анна</Typography>
          <Typography variant="caption" color="text.secondary">
            anna@example.com
          </Typography>
        </Box>
        <MenuItem component={NextLink} href="/profile" onClick={() => setUserMenu(null)}>
          <ListItemIcon>
            <PersonRoundedIcon fontSize="small" />
          </ListItemIcon>
          Профиль
        </MenuItem>
        <MenuItem component={NextLink} href="/profile" onClick={() => setUserMenu(null)}>
          <ListItemIcon>
            <SettingsRoundedIcon fontSize="small" />
          </ListItemIcon>
          Настройки
        </MenuItem>
        <MenuItem onClick={() => setUserMenu(null)} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <LogoutRoundedIcon fontSize="small" sx={{ color: "error.main" }} />
          </ListItemIcon>
          Выйти
        </MenuItem>
      </Menu>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {!isDesktop && (
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton edge="start" onClick={() => setOpen(true)} sx={{ mr: 1 }}>
              <MenuRoundedIcon />
            </IconButton>
            <Brand />
          </Toolbar>
        </AppBar>
      )}

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isDesktop ? (
          <Drawer
            variant="permanent"
            open
            sx={{ "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box", border: "none", bgcolor: "background.paper" } }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="temporary"
            open={open}
            onClose={() => setOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" } }}
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        {!isDesktop && <Toolbar />}
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1240, mx: "auto" }}>{children}</Box>
      </Box>
    </Box>
  );
}
