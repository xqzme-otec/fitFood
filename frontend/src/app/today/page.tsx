"use client";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
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
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import WaterDropRoundedIcon from "@mui/icons-material/WaterDropRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import EggAltRoundedIcon from "@mui/icons-material/EggAltRounded";
import GrainRoundedIcon from "@mui/icons-material/GrainRounded";
import DesignShell from "@/components/DesignShell";
import { CalorieRing } from "@/components/Stats";

/* Прототип Главной (статичные демо-данные, без бэкенда). */

const SUGGESTIONS = ["Куриное филе", "Гречка", "Банан", "Творог 9%", "Яйцо"];

const TILES = [
  { label: "Белки", value: 96, target: 140, unit: "г", color: "#2E7D32", icon: <EggAltRoundedIcon /> },
  { label: "Жиры", value: 48, target: 70, unit: "г", color: "#F9A825", icon: <BoltRoundedIcon /> },
  { label: "Углеводы", value: 180, target: 240, unit: "г", color: "#0288D1", icon: <GrainRoundedIcon /> },
  { label: "Вода", value: 1.4, target: 2.0, unit: "л", color: "#26A0DA", icon: <WaterDropRoundedIcon /> },
];

const MEALS = [
  {
    name: "Завтрак",
    consumed: 420,
    limit: 630,
    items: [
      { name: "Овсянка с бананом", kcal: 280 },
      { name: "Йогурт натуральный", kcal: 140 },
    ],
  },
  {
    name: "Обед",
    consumed: 610,
    limit: 840,
    items: [
      { name: "Гречка с курицей", kcal: 450 },
      { name: "Овощной салат", kcal: 160 },
    ],
  },
  {
    name: "Ужин",
    consumed: 0,
    limit: 630,
    items: [],
  },
];

const IDEAS = [
  { name: "Творог с ягодами", kcal: 210, tag: "Высокий белок" },
  { name: "Куриный салат", kcal: 320, tag: "Сбалансировано" },
  { name: "Омлет с овощами", kcal: 260, tag: "Из холодильника" },
];

function StatTile({ label, value, target, unit, color, icon }: (typeof TILES)[number]) {
  const pct = Math.min((value / target) * 100, 100);
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
          {value}
          <Box component="span" sx={{ fontSize: 13, color: "text.secondary", fontWeight: 600 }}>
            {" "}/ {target} {unit}
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

function QuickSearch() {
  return (
    <Autocomplete
      freeSolo
      openOnFocus
      options={SUGGESTIONS}
      groupBy={() => "Часто добавляемые"}
      sx={{ maxWidth: 620 }}
      slotProps={{ paper: { sx: { borderRadius: 3, mt: 0.5 } } }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Добавить продукт"
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
  );
}

function Dashboard() {
  const dateLabel = new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });

  return (
    <Stack spacing={3.5}>
      {/* Минималистичный поиск сверху */}
      <QuickSearch />

      {/* Приветствие */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h2" sx={{ fontWeight: 800 }}>
            Добрый день, Анна 👋
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ textTransform: "capitalize" }}>
            {dateLabel}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip icon={<LocalFireDepartmentRoundedIcon />} label="7 дней подряд" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
        </Stack>
      </Stack>

      {/* Герой: кольцо калорий + bento-плитки */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card
            sx={{
              height: "100%",
              background: `linear-gradient(150deg, ${alpha("#2E7D32", 0.08)}, ${alpha("#66BB6A", 0.03)})`,
            }}
          >
            <CardContent sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Typography variant="h4" sx={{ alignSelf: "flex-start", mb: 2, fontWeight: 800 }}>
                Калории
              </Typography>
              <CalorieRing consumed={1540} target={2100} size={196} />
              <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                <Chip size="small" label="Б 96" sx={{ bgcolor: alpha("#2E7D32", 0.12), fontWeight: 700 }} />
                <Chip size="small" label="Ж 48" sx={{ bgcolor: alpha("#F9A825", 0.15), fontWeight: 700 }} />
                <Chip size="small" label="У 180" sx={{ bgcolor: alpha("#0288D1", 0.12), fontWeight: 700 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Grid container spacing={3} sx={{ height: "100%" }}>
            {TILES.map((t) => (
              <Grid size={{ xs: 6 }} key={t.label}>
                <StatTile {...t} />
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Приёмы пищи */}
      <Box>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
          Приёмы пищи
        </Typography>
        <Grid container spacing={3}>
          {MEALS.map((m) => {
            const pct = Math.min((m.consumed / m.limit) * 100, 100);
            return (
              <Grid size={{ xs: 12, md: 4 }} key={m.name}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        {m.name}
                      </Typography>
                      <IconButton size="small" sx={{ bgcolor: alpha("#2E7D32", 0.10), color: "primary.main" }}>
                        <AddRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {m.consumed} / {m.limit} ккал
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{ height: 7, borderRadius: 4, my: 1.5, "& .MuiLinearProgress-bar": { borderRadius: 4 } }}
                    />
                    {m.items.length === 0 ? (
                      <Box
                        sx={{
                          py: 2.5,
                          textAlign: "center",
                          borderRadius: 3,
                          border: "1px dashed",
                          borderColor: alpha("#2E7D32", 0.25),
                          color: "text.secondary",
                        }}
                      >
                        <Typography variant="body2">Пока пусто — добавьте блюдо</Typography>
                      </Box>
                    ) : (
                      <Stack spacing={1}>
                        {m.items.map((it) => (
                          <Stack
                            key={it.name}
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ px: 1.5, py: 1, borderRadius: 2, bgcolor: "background.default" }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {it.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {it.kcal} ккал
                            </Typography>
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

      {/* Идеи */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>
            Идеи на ужин
          </Typography>
          <Chip label="Из вашего холодильника" size="small" color="secondary" variant="outlined" />
        </Stack>
        <Grid container spacing={3}>
          {IDEAS.map((idea) => (
            <Grid size={{ xs: 12, sm: 4 }} key={idea.name}>
              <Card
                sx={{
                  height: "100%",
                  background: `linear-gradient(150deg, ${alpha("#66BB6A", 0.10)}, ${alpha("#2E7D32", 0.02)})`,
                }}
              >
                <CardContent>
                  <Chip label={idea.tag} size="small" sx={{ mb: 1.5, bgcolor: alpha("#2E7D32", 0.12), fontWeight: 700 }} />
                  <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                    {idea.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {idea.kcal} ккал · готово за 15 мин
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
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
