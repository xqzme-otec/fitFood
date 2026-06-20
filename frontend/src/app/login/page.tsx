"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import EnergySavingsLeafRoundedIcon from "@mui/icons-material/EnergySavingsLeafRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import KitchenRoundedIcon from "@mui/icons-material/KitchenRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { LoadingScreen } from "@/components/AppShell";

const FEATURES: { icon: React.ReactNode; text: string }[] = [
  { icon: <LocalFireDepartmentRoundedIcon />, text: "Автоматический расчёт КБЖУ и норм питания" },
  { icon: <KitchenRoundedIcon />, text: "Умный холодильник с контролем сроков годности" },
  { icon: <RestaurantMenuRoundedIcon />, text: "Рецепты, подобранные под ваши продукты" },
  { icon: <ReceiptLongRoundedIcon />, text: "Сканер чеков для быстрого добавления покупок" },
];

function BrandPanel() {
  return (
    <Box
      sx={{
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        justifyContent: "center",
        gap: 4,
        flex: 1,
        p: 8,
        color: "#fff",
        background: "linear-gradient(150deg, #2E7D32 0%, #66BB6A 100%)",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 48, height: 48 }} variant="rounded">
          <EnergySavingsLeafRoundedIcon />
        </Avatar>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          FitFood
        </Typography>
      </Stack>

      <Box>
        <Typography variant="h2" sx={{ fontWeight: 800, lineHeight: 1.15, mb: 1.5 }}>
          Умный холодильник
          <br />
          для здорового питания
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 420 }}>
          Следите за КБЖУ, сроками годности продуктов и готовьте из того, что есть под рукой.
        </Typography>
      </Box>

      <Stack spacing={1.5}>
        {FEATURES.map((f) => (
          <Stack key={f.text} direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ display: "flex", color: "#fff", opacity: 0.95 }}>{f.icon}</Box>
            <Typography variant="body1" sx={{ opacity: 0.95 }}>
              {f.text}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

export default function LoginPage() {
  const { ready, user, login, register } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace(user.is_profile_complete ? "/today" : "/onboarding");
  }, [ready, user, router]);

  if (!ready) return <LoadingScreen />;

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = password.length >= 6;
  const canSubmit = emailValid && passwordValid && !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) return toast("Введите корректный email", "error");
    if (!passwordValid) return toast("Пароль должен быть не короче 6 символов", "error");
    setBusy(true);
    try {
      if (mode === "register") {
        await register(email.trim(), password);
        toast("Аккаунт создан, входим…");
      }
      await login(email.trim(), password);
      router.replace("/");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Ошибка входа", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: "background.default" }}>
      <BrandPanel />

      {/* Панель формы */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 3, sm: 6 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 400 }}>
          {/* Логотип для мобильных */}
          <Stack direction="row" alignItems="center" spacing={1.2} sx={{ display: { md: "none" }, mb: 3 }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 44, height: 44 }} variant="rounded">
              <EnergySavingsLeafRoundedIcon />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Fit<Box component="span" sx={{ color: "primary.main" }}>Food</Box>
            </Typography>
          </Stack>

          <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
            {mode === "login" ? "С возвращением 👋" : "Создайте аккаунт"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {mode === "login" ? "Войдите, чтобы продолжить" : "Пара шагов — и начнём считать КБЖУ"}
          </Typography>

          <Tabs
            value={mode}
            onChange={(_, v) => setMode(v)}
            variant="fullWidth"
            sx={{
              mb: 3,
              bgcolor: alpha("#2E7D32", 0.06),
              borderRadius: 99,
              minHeight: 44,
              "& .MuiTabs-indicator": { display: "none" },
              "& .MuiTab-root": { minHeight: 44, zIndex: 1, fontWeight: 700, textTransform: "none" },
              "& .Mui-selected": { color: "#fff !important" },
              "&::after": {
                content: '""',
                position: "absolute",
                top: 4,
                bottom: 4,
                left: mode === "login" ? 4 : "50%",
                width: "calc(50% - 4px)",
                borderRadius: 99,
                bgcolor: "primary.main",
                transition: "left .2s",
              },
            }}
          >
            <Tab disableRipple label="Вход" value="login" />
            <Tab disableRipple label="Регистрация" value="register" />
          </Tabs>

          <form onSubmit={submit} noValidate>
            <Stack spacing={2}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={email.length > 0 && !emailValid}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailOutlineRoundedIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={password.length > 0 && !passwordValid}
                helperText={password.length > 0 && !passwordValid ? "Минимум 6 символов" : " "}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button type="submit" variant="contained" size="large" disabled={!canSubmit} fullWidth sx={{ py: 1.2 }}>
                {busy ? "Подождите…" : mode === "login" ? "Войти" : "Создать аккаунт"}
              </Button>
            </Stack>
          </form>

          <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {mode === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}
            </Typography>
            <Button
              variant="text"
              size="small"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              {mode === "login" ? "Зарегистрироваться" : "Войти"}
            </Button>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1} justifyContent="center" sx={{ mt: 3, color: "text.secondary" }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 16, color: "primary.main" }} />
            <Typography variant="caption">Данные хранятся локально, демо-режим без внешних сервисов</Typography>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
