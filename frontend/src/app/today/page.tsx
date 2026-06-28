"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EggAltRoundedIcon from "@mui/icons-material/EggAltRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import GrainRoundedIcon from "@mui/icons-material/GrainRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DesignShell from "@/components/DesignShell";
import AddFoodDialog from "@/components/AddFoodDialog";
import RationSwiper from "@/components/RationSwiper";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import { CalorieRing } from "@/components/Stats";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { num } from "@/lib/format";
import type { DaySummary, Product, Recommendation } from "@/lib/types";

const todayStr = () => new Date().toISOString().slice(0, 10);

// Серия дней подряд (пока статичная демо-плитка, без логики).
const STREAK = { days: 7, nextMilestone: 14 };

function StreakTile() {
  const pct = Math.min((STREAK.days / STREAK.nextMilestone) * 100, 100);
  const left = Math.max(STREAK.nextMilestone - STREAK.days, 0);
  return (
    <Card sx={{ height: "100%", color: "#fff", border: "none", background: "linear-gradient(135deg, #2E7D32, #66BB6A)" }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Box sx={{ display: "flex" }}>
            <LocalFireDepartmentRoundedIcon />
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9 }}>
            🔥 серия
          </Typography>
        </Stack>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          {STREAK.days}
          <Box component="span" sx={{ fontSize: 13, fontWeight: 600, opacity: 0.85 }}>
            {" "}дней подряд
          </Box>
        </Typography>
        <Typography variant="body2" sx={{ mb: 1, opacity: 0.85 }}>
          Ещё {left} до рубежа {STREAK.nextMilestone} дней
        </Typography>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{ height: 6, borderRadius: 3, bgcolor: "rgba(255,255,255,0.25)", "& .MuiLinearProgress-bar": { bgcolor: "#fff", borderRadius: 3 } }}
        />
      </CardContent>
    </Card>
  );
}

function StatTile({
  label,
  value,
  target,
  color,
  icon,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
  icon: React.ReactNode;
}) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  return (
    <Card sx={{ height: "100%", bgcolor: alpha(color, 0.06), borderColor: alpha(color, 0.18) }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Box sx={{ color, display: "flex" }}>{icon}</Box>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
            {Math.round(pct)}%
          </Typography>
        </Stack>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          {num(value)}
          <Box component="span" sx={{ fontSize: 13, color: "text.secondary", fontWeight: 600 }}>
            {" "}/ {num(target)} г
          </Box>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {label}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{ height: 6, borderRadius: 3, bgcolor: alpha(color, 0.15), "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 } }}
        />
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { meals } = useAuth();
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [ideas, setIdeas] = useState<Recommendation[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rationOpen, setRationOpen] = useState(false);
  const [fixedSlot, setFixedSlot] = useState<number | undefined>(undefined);
  const [preset, setPreset] = useState<Product | null>(null);
  const [searchOptions, setSearchOptions] = useState<Product[]>([]);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runProductSearch = (term: string) => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(async () => {
      try {
        setSearchOptions(await api.searchProducts(term));
      } catch {
        setSearchOptions([]);
      }
    }, 250);
  };

  const pickFromSearch = (p: Product) => {
    setPreset(p);
    setFixedSlot(undefined);
    setDialogOpen(true);
  };

  const load = useCallback(() => {
    api.daySummary(todayStr()).then(setSummary).catch(() => setSummary(null));
    api.recommendations().then(setIdeas).catch(() => setIdeas([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = (slotId?: number) => {
    setPreset(null);
    setFixedSlot(slotId);
    setDialogOpen(true);
  };

  const deleteEntry = async (id: number) => {
    try {
      await api.deleteEntry(id);
      load();
    } catch {
      /* ignore */
    }
  };

  const consumed = summary?.consumed ?? { calories: 0, protein: 0, fat: 0, carbs: 0 };
  const target = summary?.target ?? { calories: 0, protein: 0, fat: 0, carbs: 0 };

  const tiles = useMemo(
    () => [
      { label: "Белки", value: consumed.protein, target: target.protein, color: "#2E7D32", icon: <EggAltRoundedIcon /> },
      { label: "Жиры", value: consumed.fat, target: target.fat, color: "#F9A825", icon: <BoltRoundedIcon /> },
      { label: "Углеводы", value: consumed.carbs, target: target.carbs, color: "#0288D1", icon: <GrainRoundedIcon /> },
    ],
    [consumed, target],
  );

  return (
    <Stack spacing={3.5}>
      {/* Поиск / быстрое добавление */}
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Добавить продукт
        </Typography>
        <Autocomplete
          options={searchOptions}
          filterOptions={(x) => x}
          getOptionLabel={(o) => o.name}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          onInputChange={(_, v) => runProductSearch(v)}
          onChange={(_, v) => v && pickFromSearch(v)}
          value={null}
          blurOnSelect
          clearOnBlur
          noOptionsText="Начните вводить название продукта"
          slotProps={{ paper: { sx: { borderRadius: 3, mt: 0.5 } } }}
          renderOption={(props, o) => (
            <Box component="li" {...props} key={o.id}>
              <Stack direction="row" justifyContent="space-between" sx={{ width: "100%" }}>
                <span>{o.name}</span>
                <Typography variant="caption" color="text.secondary">
                  {num(o.calories)} ккал/100г
                </Typography>
              </Stack>
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Например, куриное филе…"
              InputProps={{
                ...params.InputProps,
                sx: { borderRadius: 99, bgcolor: "background.paper", pl: 1 },
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <SearchRoundedIcon color="action" />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </Box>

      {/* Герой: кольцо калорий + плитки макросов */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: "100%", background: `linear-gradient(150deg, ${alpha("#2E7D32", 0.08)}, ${alpha("#66BB6A", 0.03)})` }}>
            <CardContent sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Typography variant="h4" sx={{ alignSelf: "flex-start", mb: 2, fontWeight: 800 }}>
                Калории
              </Typography>
              <CalorieRing consumed={Math.round(consumed.calories)} target={Math.round(target.calories)} size={196} />
              <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                <Chip size="small" label={`Б ${num(consumed.protein)}`} sx={{ bgcolor: alpha("#2E7D32", 0.12), fontWeight: 700 }} />
                <Chip size="small" label={`Ж ${num(consumed.fat)}`} sx={{ bgcolor: alpha("#F9A825", 0.15), fontWeight: 700 }} />
                <Chip size="small" label={`У ${num(consumed.carbs)}`} sx={{ bgcolor: alpha("#0288D1", 0.12), fontWeight: 700 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Grid container spacing={3} sx={{ height: "100%" }}>
            {tiles.map((t) => (
              <Grid size={{ xs: 6 }} key={t.label}>
                <StatTile {...t} />
              </Grid>
            ))}
            <Grid size={{ xs: 6 }}>
              <StreakTile />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* CTA: сгенерировать рацион (тиндер блюд) */}
      <Button
        onClick={() => setRationOpen(true)}
        variant="contained"
        size="large"
        fullWidth
        startIcon={<RestaurantMenuRoundedIcon />}
        sx={{
          py: 1.6,
          borderRadius: 99,
          fontWeight: 800,
          fontSize: 16,
          background: "linear-gradient(135deg, #2E7D32, #66BB6A)",
          boxShadow: 3,
          "&:hover": { background: "linear-gradient(135deg, #2E7D32, #43A047)" },
        }}
      >
        Сгенерировать рацион
      </Button>

      {/* Приёмы пищи */}
      <Box>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
          Приёмы пищи
        </Typography>
        <Grid container spacing={3}>
          {(summary?.meals ?? []).map((m) => {
            const pct = m.limit.calories > 0 ? Math.min((m.consumed.calories / m.limit.calories) * 100, 100) : 0;
            return (
              <Grid size={{ xs: 12, md: 4 }} key={m.meal_slot_id}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        {m.name}
                      </Typography>
                      <IconButton size="small" onClick={() => openAdd(m.meal_slot_id)} sx={{ bgcolor: alpha("#2E7D32", 0.10), color: "primary.main" }}>
                        <AddRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {num(m.consumed.calories)} / {num(m.limit.calories)} ккал
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{ height: 7, borderRadius: 4, my: 1.5, "& .MuiLinearProgress-bar": { borderRadius: 4 } }}
                    />
                    {m.entries.length === 0 ? (
                      <Box sx={{ py: 2.5, textAlign: "center", borderRadius: 3, border: "1px dashed", borderColor: alpha("#2E7D32", 0.25), color: "text.secondary" }}>
                        <Typography variant="body2">Пока пусто — добавьте блюдо</Typography>
                      </Box>
                    ) : (
                      <Stack spacing={1}>
                        {m.entries.map((it) => (
                          <Stack key={it.id} direction="row" alignItems="center" spacing={1} sx={{ pl: 1.5, pr: 0.5, py: 0.5, borderRadius: 2, bgcolor: "background.default" }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }} noWrap>
                              {it.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ flex: "none" }}>
                              {num(it.calories)} ккал
                            </Typography>
                            <IconButton size="small" aria-label="Удалить" onClick={() => deleteEntry(it.id)} sx={{ color: "text.secondary", "&:hover": { color: "#E53935" } }}>
                              <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Stack>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Идеи (рекомендации из бэкенда) */}
      {ideas.length > 0 && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              Идеи для вас
            </Typography>
            <Chip label="Из вашего холодильника" size="small" color="secondary" variant="outlined" />
          </Stack>
          <Grid container spacing={3}>
            {ideas.slice(0, 3).map((idea) => (
              <Grid size={{ xs: 12, sm: 4 }} key={idea.name}>
                <Card sx={{ height: "100%", background: `linear-gradient(150deg, ${alpha("#66BB6A", 0.10)}, ${alpha("#2E7D32", 0.02)})` }}>
                  <CardContent>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                      {idea.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {num(idea.calories)} ккал · Б {num(idea.protein)} · Ж {num(idea.fat)} · У {num(idea.carbs)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <AddFoodDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        meals={meals}
        onAdded={load}
        today={todayStr()}
        fixedSlotId={fixedSlot}
        presetProduct={preset}
      />

      <RationSwiper
        open={rationOpen}
        onClose={() => setRationOpen(false)}
        today={todayStr()}
        onFinished={load}
      />
    </Stack>
  );
}

export default function TodayPage() {
  return (
    <DesignShell>
      <Dashboard />
    </DesignShell>
  );
}
