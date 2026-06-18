"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import EnergySavingsLeafRoundedIcon from "@mui/icons-material/EnergySavingsLeafRounded";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { LoadingScreen } from "@/components/AppShell";

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: 2,
        background: "linear-gradient(160deg, #EAF3EA 0%, #F6F8F5 100%)",
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 52, height: 52 }} variant="rounded">
              <EnergySavingsLeafRoundedIcon />
            </Avatar>
            <Typography variant="h4">
              Fit<Box component="span" sx={{ color: "primary.main" }}>Food</Box>
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Умный холодильник: КБЖУ, дневник и рецепты
            </Typography>
          </Stack>

          <Tabs
            value={mode}
            onChange={(_, v) => setMode(v)}
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            <Tab label="Вход" value="login" />
            <Tab label="Регистрация" value="register" />
          </Tabs>

          <form onSubmit={submit}>
            <Stack spacing={2}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                size="medium"
              />
              <TextField
                label="Пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                size="medium"
                helperText="Минимум 6 символов"
              />
              <Button type="submit" variant="contained" size="large" disabled={busy} fullWidth>
                {mode === "login" ? "Войти" : "Создать аккаунт"}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
