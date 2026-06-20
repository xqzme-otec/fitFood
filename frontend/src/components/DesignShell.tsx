"use client";
import { useEffect, useState } from "react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { alpha, useTheme } from "@mui/material/styles";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import KitchenRoundedIcon from "@mui/icons-material/KitchenRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EnergySavingsLeafRoundedIcon from "@mui/icons-material/EnergySavingsLeafRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import { useAuth } from "@/lib/auth";
import { LoadingScreen } from "@/components/AppShell";
import ThemeToggle from "@/components/ThemeToggle";
import { getUserPrefs, onUserPrefsChange, type UserPrefs } from "@/lib/userPrefs";

const DRAWER_WIDTH = 268;
const BOTTOM_NAV_HEIGHT = 64;

const GOAL_LABEL: Record<string, string> = {
  gain: "Набор массы",
  maintain: "Поддержание",
  lose: "Похудение",
};

const NAV: { href: string; label: string; icon: React.ReactNode }[] = [
  { href: "/today", label: "Главная", icon: <DashboardRoundedIcon /> },
  { href: "/fridge", label: "Холодильник", icon: <KitchenRoundedIcon /> },
  { href: "/recipes", label: "Рецепты", icon: <RestaurantMenuRoundedIcon /> },
  { href: "/receipt", label: "Сканер чека", icon: <ReceiptLongRoundedIcon /> },
];

function Brand() {
  return (
    <Stack
      component={NextLink}
      href="/today"
      direction="row"
      alignItems="center"
      spacing={1.2}
      sx={{ textDecoration: "none", color: "text.primary" }}
    >
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
  const router = useRouter();
  const { ready, user, profile, logout } = useAuth();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"), { noSsr: true });
  const [userMenu, setUserMenu] = useState<null | HTMLElement>(null);
  const [prefs, setPrefs] = useState<UserPrefs>({});
  const active = (href: string) => pathname === href || pathname?.startsWith(href + "/");
  const activeHref = NAV.find((n) => active(n.href))?.href ?? false;

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login");
    else if (!user.is_profile_complete) router.replace("/onboarding");
  }, [ready, user, router]);

  useEffect(() => {
    setPrefs(getUserPrefs());
    return onUserPrefsChange(() => setPrefs(getUserPrefs()));
  }, []);

  if (!ready || !user || !user.is_profile_complete) return <LoadingScreen />;

  const displayName = prefs.name?.trim() || user.email.split("@")[0];
  const initial = (displayName || "?").slice(0, 1).toUpperCase();
  const subtitle = profile
    ? `${GOAL_LABEL[profile.goal] ?? profile.goal} · ${Math.round(profile.weight_kg)} кг`
    : "Профиль";

  // --- Сайдбар (десктоп) ---
  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, py: 1.5 }}>
        <Brand />
        <ThemeToggle size="small" />
      </Stack>

      <Box sx={{ flex: 1, overflowY: "auto", mt: 2 }}>
        <Stack spacing={0.5}>
          {NAV.map((item) => {
            const on = active(item.href);
            return (
              <Stack
                key={item.href}
                component={NextLink}
                href={item.href}
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{
                  px: 1.5,
                  py: 1.25,
                  borderRadius: 3,
                  textDecoration: "none",
                  color: on ? "primary.main" : "text.primary",
                  bgcolor: on ? alpha(theme.palette.primary.main, 0.1) : "transparent",
                  fontWeight: 600,
                  position: "relative",
                  transition: "background .15s",
                  "&:hover": { bgcolor: alpha(theme.palette.primary.main, on ? 0.14 : 0.05) },
                  "&::before": on
                    ? { content: '""', position: "absolute", left: 0, top: "22%", bottom: "22%", width: 3, borderRadius: 3, bgcolor: "primary.main" }
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

      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        onClick={(e) => setUserMenu(e.currentTarget)}
        sx={{
          p: 1,
          borderRadius: 3,
          cursor: "pointer",
          bgcolor: alpha(theme.palette.primary.main, userMenu ? 0.1 : 0.04),
          transition: "background .15s",
          "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1) },
        }}
      >
        <Avatar src={prefs.photo} sx={{ bgcolor: "secondary.main", width: 36, height: 36 }}>{initial}</Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
            {displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {subtitle}
          </Typography>
        </Box>
        <KeyboardArrowUpRoundedIcon
          fontSize="small"
          sx={{ color: "text.secondary", transform: userMenu ? "rotate(180deg)" : "none", transition: "transform .15s" }}
        />
      </Stack>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Верхний бар (мобильный) */}
      {!isDesktop && (
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <Brand />
            <Box sx={{ flex: 1 }} />
            <ThemeToggle />
            <IconButton onClick={(e) => setUserMenu(e.currentTarget)} sx={{ ml: 0.5 }}>
              <Avatar src={prefs.photo} sx={{ bgcolor: "secondary.main", width: 32, height: 32, fontSize: 15 }}>{initial}</Avatar>
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      {/* Сайдбар (десктоп) */}
      {isDesktop && (
        <Box component="nav" sx={{ width: DRAWER_WIDTH, flexShrink: 0 }}>
          <Drawer
            variant="permanent"
            open
            sx={{ "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box", border: "none", bgcolor: "background.paper" } }}
          >
            {drawer}
          </Drawer>
        </Box>
      )}

      {/* Контент */}
      <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        {!isDesktop && <Toolbar />}
        <Box sx={{ p: { xs: 2, md: 4 }, pb: { xs: `${BOTTOM_NAV_HEIGHT + 24}px`, md: 4 }, maxWidth: 1240, mx: "auto" }}>{children}</Box>
      </Box>

      {/* Нижняя навигация (мобильный) */}
      {!isDesktop && (
        <Paper sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: theme.zIndex.drawer + 1, borderTop: `1px solid ${theme.palette.divider}` }} elevation={0}>
          <BottomNavigation value={activeHref} showLabels sx={{ height: BOTTOM_NAV_HEIGHT, bgcolor: "background.paper" }}>
            {NAV.map((item) => (
              <BottomNavigationAction
                key={item.href}
                component={NextLink}
                href={item.href}
                value={item.href}
                label={item.label}
                icon={item.icon}
                sx={{ minWidth: 0 }}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}

      {/* Меню пользователя (общее для десктопа и мобильного) */}
      <Menu
        anchorEl={userMenu}
        open={!!userMenu}
        onClose={() => setUserMenu(null)}
        anchorOrigin={{ vertical: isDesktop ? "top" : "bottom", horizontal: isDesktop ? "center" : "right" }}
        transformOrigin={{ vertical: isDesktop ? "bottom" : "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: 220, borderRadius: 3 } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontWeight: 700 }}>{displayName}</Typography>
          <Typography variant="caption" color="text.secondary">
            {user.email}
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
        <MenuItem
          onClick={() => {
            setUserMenu(null);
            logout();
            router.replace("/login");
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <LogoutRoundedIcon fontSize="small" sx={{ color: "error.main" }} />
          </ListItemIcon>
          Выйти
        </MenuItem>
      </Menu>
    </Box>
  );
}
