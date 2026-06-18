"use client";
import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid2";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { GOAL_LABELS, num, todayStr } from "@/lib/format";
import AppShell from "@/components/AppShell";
import QuickAdd from "@/components/QuickAdd";
import { CalorieRing, MacroBars } from "@/components/Stats";
import type { DaySummary } from "@/lib/types";

function TodayContent() {
  const { meals, targets, profile } = useAuth();
  const today = todayStr();
  const [summary, setSummary] = useState<DaySummary | null>(null);

  const load = useCallback(() => {
    api.daySummary(today).then(setSummary).catch(() => setSummary(null));
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  const consumed = summary?.consumed ?? { calories: 0, protein: 0, fat: 0, carbs: 0 };
  const target = summary?.target ?? {
    calories: targets?.calories ?? 0,
    protein: targets?.protein_g ?? 0,
    fat: targets?.fat_g ?? 0,
    carbs: targets?.carb_g ?? 0,
  };

  const dateLabel = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h2">Главная</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textTransform: "capitalize" }}>
          {dateLabel}
        </Typography>
      </Box>

      {/* Быстрое добавление продуктов */}
      <Card>
        <CardContent>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Быстрое добавление
          </Typography>
          <QuickAdd meals={meals} today={today} onAdded={load} />
        </CardContent>
      </Card>

      {/* Статистика дня */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 3 }}>
              <Typography variant="h4" sx={{ alignSelf: "flex-start", mb: 2 }}>
                Калории
              </Typography>
              <CalorieRing consumed={consumed.calories} target={target.calories} />
              <Stack direction="row" spacing={1} sx={{ mt: 3 }} flexWrap="wrap" justifyContent="center">
                {profile && <Chip size="small" label={GOAL_LABELS[profile.goal]} color="primary" variant="outlined" />}
                {profile && <Chip size="small" label={`Вес ${num(profile.weight_kg, 1)} кг`} variant="outlined" />}
                {targets && <Chip size="small" label={`BMR ${num(targets.bmr)}`} variant="outlined" />}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h4" sx={{ mb: 3 }}>
                Макронутриенты
              </Typography>
              <MacroBars consumed={consumed} target={target} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Приёмы пищи сегодня */}
      <Box>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Приёмы пищи
        </Typography>
        <Grid container spacing={2}>
          {(summary?.meals ?? []).map((m) => {
            const pct = m.limit.calories > 0 ? Math.min((m.consumed.calories / m.limit.calories) * 100, 100) : 0;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={m.meal_slot_id}>
                <Card>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography sx={{ fontWeight: 700 }}>{m.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {num(m.consumed.calories)} / {num(m.limit.calories)}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{ height: 7, borderRadius: 4, mb: 1, "& .MuiLinearProgress-bar": { borderRadius: 4 } }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {m.entries.length} {m.entries.length === 1 ? "запись" : "записей"} · Б {num(m.consumed.protein)} Ж{" "}
                      {num(m.consumed.fat)} У {num(m.consumed.carbs)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Stack>
  );
}

export default function TodayPage() {
  return (
    <AppShell>
      <TodayContent />
    </AppShell>
  );
}
