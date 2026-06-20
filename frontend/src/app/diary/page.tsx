"use client";
import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { num, todayStr } from "@/lib/format";
import AppShell from "@/components/AppShell";
import AddFoodDialog from "@/components/AddFoodDialog";
import RecommendationsDialog from "@/components/RecommendationsDialog";
import { CalorieRing } from "@/components/Stats";
import type { DaySummary, MealSlot } from "@/lib/types";

function DiaryContent() {
  const { meals } = useAuth();
  const today = todayStr();
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [addSlot, setAddSlot] = useState<MealSlot | null>(null);
  const [recSlot, setRecSlot] = useState<MealSlot | null>(null);

  const load = useCallback(() => {
    api.daySummary(today).then(setSummary).catch(() => setSummary(null));
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  const removeEntry = async (id: number) => {
    try {
      await api.deleteEntry(id);
      load();
    } catch {
      /* ignore */
    }
  };

  const consumed = summary?.consumed ?? { calories: 0, protein: 0, fat: 0, carbs: 0 };
  const target = summary?.target ?? { calories: 0, protein: 0, fat: 0, carbs: 0 };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems="center">
        <CalorieRing consumed={consumed.calories} target={target.calories} size={140} />
        <Box>
          <Typography variant="h2">Дневник</Typography>
          <Typography variant="body2" color="text.secondary">
            Съедено {num(consumed.calories)} из {num(target.calories)} ккал · Б {num(consumed.protein)} Ж{" "}
            {num(consumed.fat)} У {num(consumed.carbs)}
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={2}>
        {(summary?.meals ?? []).map((m) => {
          const slot = meals.find((s) => s.id === m.meal_slot_id) ?? null;
          const pct = m.limit.calories > 0 ? Math.min((m.consumed.calories / m.limit.calories) * 100, 100) : 0;
          return (
            <Card key={m.meal_slot_id}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h4">{m.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {num(m.consumed.calories)} / {num(m.limit.calories)} ккал
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      startIcon={<LightbulbRoundedIcon />}
                      color="secondary"
                      onClick={() => setRecSlot(slot)}
                    >
                      Идеи
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<AddRoundedIcon />}
                      onClick={() => setAddSlot(slot)}
                    >
                      Добавить
                    </Button>
                  </Stack>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{ height: 7, borderRadius: 4, my: 1.5, "& .MuiLinearProgress-bar": { borderRadius: 4 } }}
                />
                {m.entries.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Пока ничего не добавлено
                  </Typography>
                ) : (
                  <Stack divider={<Divider flexItem />}>
                    {m.entries.map((e) => (
                      <Stack
                        key={e.id}
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ py: 1 }}
                      >
                        <Box>
                          <Typography sx={{ fontWeight: 600 }}>{e.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {num(e.amount)} г · {num(e.calories)} ккал · Б {num(e.protein)} Ж {num(e.fat)} У{" "}
                            {num(e.carbs)}
                          </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => removeEntry(e.id)}>
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      <AddFoodDialog
        open={!!addSlot}
        onClose={() => setAddSlot(null)}
        meals={meals}
        today={today}
        fixedSlotId={addSlot?.id}
        onAdded={load}
      />
      <RecommendationsDialog
        open={!!recSlot}
        onClose={() => setRecSlot(null)}
        slot={recSlot}
        today={today}
        onAdded={load}
      />
    </Stack>
  );
}

export default function DiaryPage() {
  return (
    <AppShell>
      <DiaryContent />
    </AppShell>
  );
}
