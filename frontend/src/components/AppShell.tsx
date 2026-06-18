"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import NextLink from "next/link";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import KitchenRoundedIcon from "@mui/icons-material/KitchenRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import EnergySavingsLeafRoundedIcon from "@mui/icons-material/EnergySavingsLeafRounded";
import { useAuth } from "@/lib/auth";

const NAV: { href: string; label: string; icon: React.ReactNode }[] = [
  { href: "/today", label: "Главная", icon: <DashboardRoundedIcon /> },
  { href: "/diary", label: "Дневник", icon: <MenuBookRoundedIcon /> },
  { href: "/fridge", label: "Холодильник", icon: <KitchenRoundedIcon /> },
  { href: "/recipes", label: "Рецепты", icon: <RestaurantMenuRoundedIcon /> },
  { href: "/receipt", label: "Сканер чека", icon: <ReceiptLongRoundedIcon /> },
  { href: "/profile", label: "Профиль", icon: <PersonRoundedIcon /> },
];

const DRAWER_WIDTH = 248;

export function LoadingScreen() {
  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <CircularProgress color="primary" />
    </Box>
  );
}

function Brand() {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1 }}>
      <Avatar sx={{ bgcolor: "primary.main", width: 34, height: 34 }} variant="rounded">
        <EnergySavingsLeafRoundedIcon fontSize="small" />
      </Avatar>
      <Typography variant="h5" sx={{ fontWeight: 800 }}>
        Fit<Box component="span" sx={{ color: "primary.main" }}>Food</Box>
      </Typography>
    </Stack>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login");
    else if (!user.is_profile_complete) router.replace("/onboarding");
  }, [ready, user, router]);

  if (!ready) return <LoadingScreen />;
  if (!user || !user.is_profile_complete) return <LoadingScreen />;

  const active = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar sx={{ px: 2 }}>
        <Brand />
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {NAV.map((item) => (
          <ListItemButton
            key={item.href}
            component={NextLink}
            href={item.href}
            selected={active(item.href)}
            onClick={() => setMobileOpen(false)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              "&.Mui-selected": { bgcolor: "primary.main", color: "#fff" },
              "&.Mui-selected:hover": { bgcolor: "primary.dark" },
              "&.Mui-selected .MuiListItemIcon-root": { color: "#fff" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>{item.icon}</ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontWeight: 600 }}>{item.label}</ListItemText>
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{ bgcolor: "secondary.main", width: 34, height: 34 }}>
            {(user.email || "?").slice(0, 1).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {user.email}
            </Typography>
          </Box>
          <Tooltip title="Выйти">
            <IconButton onClick={logout} size="small">
              <LogoutRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Mobile top bar */}
      {!isDesktop && (
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
              <MenuRoundedIcon />
            </IconButton>
            <Brand />
          </Toolbar>
        </AppBar>
      )}

      {/* Navigation drawer */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isDesktop ? (
          <Drawer
            variant="permanent"
            open
            sx={{
              "& .MuiDrawer-paper": {
                width: DRAWER_WIDTH,
                boxSizing: "border-box",
                borderRight: "1px solid rgba(46,125,50,0.10)",
              },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" } }}
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        {!isDesktop && <Toolbar />}
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1180, mx: "auto" }}>{children}</Box>
      </Box>
    </Box>
  );
}
