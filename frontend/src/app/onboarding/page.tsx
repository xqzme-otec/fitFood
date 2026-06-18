"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid2";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { ACTIVITY_OPTIONS, GOAL_OPTIONS } from "@/lib/format";
import { LoadingScreen } from "@/components/AppShell";
import type { ActivityLevel, Goal, ProfileCreate, Sex } from "@/lib/types";

export default function OnboardingPage() {
  const { ready, user, reloadUser } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    sex: "male" as Sex,
    age: "30",
    height_cm: "175",
    weight_kg: "75",
    activity_level: "medium" as ActivityLevel,
    goal: "lose" as Goal,
    target_weight_kg: "70",
    target_days: "90",
    meals_per_day: "3",
  });

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login");
    else if (user.is_profile_complete) router.replace("/today");
  }, [ready, user, router]);

  if (!ready || !user) return <LoadingScreen />;

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const needsTarget = form.goal === "lose" || form.goal === "gain";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload: ProfileCreate = {
        sex: form.sex,
        age: Number(form.age),
        height_cm: Number(form.height_cm),
        weight_kg: Number(form.weight_kg),
        activity_level: form.activity_level,
        goal: form.goal,
        meals_per_day: Number(form.meals_per_day),
        target_weight_kg: needsTarget ? Number(form.target_weight_kg) : null,
        target_days: needsTarget ? Number(form.target_days) : null,
      };
      await api.createProfile(payload);
      await reloadUser();
      toast("Анкета сохранена, норма рассчитана");
      router.replace("/today");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Ошибка", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2, bgcolor: "background.default" }}>
      <Card sx={{ width: "100%", maxWidth: 620 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h3" gutterBottom>
            Анкета
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Рассчитаем вашу суточную норму КБЖУ
          </Typography>
          <form onSubmit={submit}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField select label="Пол" value={form.sex} onChange={(e) => set("sex", e.target.value)} fullWidth>
                  <MenuItem value="male">Мужской</MenuItem>
                  <MenuItem value="female">Женский</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField label="Возраст, лет" type="number" value={form.age} onChange={(e) => set("age", e.target.value)} fullWidth required />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField label="Рост, см" type="number" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} fullWidth required />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField label="Вес, кг" type="number" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} fullWidth required />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField select label="Дневная активность" value={form.activity_level} onChange={(e) => set("activity_level", e.target.value)} fullWidth>
                  {ACTIVITY_OPTIONS.map(([v, l]) => (
                    <MenuItem key={v} value={v}>
                      {l}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField select label="Цель" value={form.goal} onChange={(e) => set("goal", e.target.value)} fullWidth>
                  {GOAL_OPTIONS.map(([v, l]) => (
                    <MenuItem key={v} value={v}>
                      {l}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField select label="Приёмов пищи в день" value={form.meals_per_day} onChange={(e) => set("meals_per_day", e.target.value)} fullWidth>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <MenuItem key={n} value={String(n)}>
                      {n}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              {needsTarget && (
                <>
                  <Grid size={{ xs: 6 }}>
                    <TextField label="Целевой вес, кг" type="number" value={form.target_weight_kg} onChange={(e) => set("target_weight_kg", e.target.value)} fullWidth required />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <TextField label="Срок, дней" type="number" value={form.target_days} onChange={(e) => set("target_days", e.target.value)} fullWidth required />
                  </Grid>
                </>
              )}
              <Grid size={{ xs: 12 }}>
                <Button type="submit" variant="contained" size="large" disabled={busy} fullWidth>
                  Рассчитать и продолжить
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
