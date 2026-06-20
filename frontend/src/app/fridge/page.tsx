"use client";
import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import DesignShell from "@/components/DesignShell";

/* Прототип «Холодильника» (статичные демо-данные, без бэкенда). */

type Status = "ok" | "soon" | "expired";

interface Item {
  name: string;
  emoji: string;
  category: string;
  qty: number;
  unit: string;
  status: Status;
  days: number;
  kcal: number;
  p: number;
  f: number;
  c: number;
}

const ITEMS: Item[] = [
  { name: "Куриное филе", emoji: "🍗", category: "Мясо и рыба", qty: 500, unit: "г", status: "soon", days: 2, kcal: 113, p: 23.6, f: 1.9, c: 0.4 },
  { name: "Лосось", emoji: "🐟", category: "Мясо и рыба", qty: 300, unit: "г", status: "soon", days: 1, kcal: 208, p: 20, f: 13, c: 0 },
  { name: "Молоко 2.5%", emoji: "🥛", category: "Молочка", qty: 900, unit: "мл", status: "ok", days: 6, kcal: 52, p: 2.9, f: 2.5, c: 4.7 },
  { name: "Творог 9%", emoji: "🧀", category: "Молочка", qty: 200, unit: "г", status: "ok", days: 5, kcal: 159, p: 16.7, f: 9, c: 2 },
  { name: "Йогурт натуральный", emoji: "🍶", category: "Молочка", qty: 350, unit: "г", status: "expired", days: -1, kcal: 60, p: 5, f: 3.2, c: 3.5 },
  { name: "Брокколи", emoji: "🥦", category: "Овощи и фрукты", qty: 350, unit: "г", status: "ok", days: 4, kcal: 34, p: 2.8, f: 0.4, c: 6.6 },
  { name: "Помидоры", emoji: "🍅", category: "Овощи и фрукты", qty: 400, unit: "г", status: "soon", days: 3, kcal: 20, p: 1.1, f: 0.2, c: 3.7 },
  { name: "Банан", emoji: "🍌", category: "Овощи и фрукты", qty: 600, unit: "г", status: "ok", days: 5, kcal: 96, p: 1.5, f: 0.2, c: 21 },
  { name: "Яблоко", emoji: "🍎", category: "Овощи и фрукты", qty: 700, unit: "г", status: "ok", days: 12, kcal: 47, p: 0.4, f: 0.4, c: 9.8 },
  { name: "Гречка", emoji: "🌾", category: "Бакалея", qty: 800, unit: "г", status: "ok", days: 200, kcal: 343, p: 12.6, f: 3.3, c: 62 },
  { name: "Макароны", emoji: "🍝", category: "Бакалея", qty: 500, unit: "г", status: "ok", days: 300, kcal: 344, p: 10.4, f: 1.1, c: 69.7 },
  { name: "Яйцо куриное", emoji: "🥚", category: "Молочка", qty: 10, unit: "шт", status: "ok", days: 18, kcal: 157, p: 12.7, f: 11.5, c: 0.7 },
];

const STATUS: Record<Status, { label: string; color: string }> = {
  ok: { label: "Свежий", color: "#2E7D32" },
  soon: { label: "Скоро истекает", color: "#F9A825" },
  expired: { label: "Просрочен", color: "#E53935" },
};

const ALL = "Все";
const SOON = "__soon__";

function StatTile({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card sx={{ bgcolor: alpha(color, 0.06), borderColor: alpha(color, 0.18) }}>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{ display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: 2, bgcolor: alpha(color, 0.14), color }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function ItemCard({ item }: { item: Item }) {
  const s = STATUS[item.status];
  const tinted = item.status !== "ok";
  return (
    <Card
      sx={{
        height: "100%",
        borderColor: tinted ? alpha(s.color, 0.35) : undefined,
        bgcolor: tinted ? alpha(s.color, 0.04) : undefined,
        transition: "box-shadow .15s, transform .15s",
        "&:hover": { boxShadow: "0 6px 18px rgba(27,42,30,0.10)", transform: "translateY(-2px)" },
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          <Box sx={{ display: "grid", placeItems: "center", width: 46, height: 46, borderRadius: "50%", bgcolor: alpha("#2E7D32", 0.08), fontSize: 24, flex: "none" }}>
            {item.emoji}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800 }} noWrap>
              {item.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {item.category}
            </Typography>
          </Box>
          <Stack direction="row" sx={{ mr: -1 }}>
            <IconButton size="small">
              <EditRoundedIcon fontSize="small" />
            </IconButton>
            <IconButton size="small">
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {item.qty}
            <Box component="span" sx={{ fontSize: 13, color: "text.secondary", fontWeight: 600 }}>
              {" "}
              {item.unit}
            </Box>
          </Typography>
          <Chip
            size="small"
            label={item.status === "expired" ? s.label : `${s.label} · ${item.days} дн.`}
            sx={{ bgcolor: alpha(s.color, 0.14), color: s.color, fontWeight: 700 }}
          />
        </Stack>

        <Stack direction="row" spacing={0.5} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
          <Chip size="small" variant="outlined" label={`${item.kcal} ккал`} />
          <Chip size="small" variant="outlined" label={`Б ${item.p}`} />
          <Chip size="small" variant="outlined" label={`Ж ${item.f}`} />
          <Chip size="small" variant="outlined" label={`У ${item.c}`} />
        </Stack>
      </CardContent>
    </Card>
  );
}

function FridgeContent() {
  const [cat, setCat] = useState<string>(ALL);

  const categories = useMemo(() => Array.from(new Set(ITEMS.map((i) => i.category))), []);
  const soonCount = ITEMS.filter((i) => i.status === "soon").length;
  const expiredCount = ITEMS.filter((i) => i.status === "expired").length;

  const shown = useMemo(() => {
    if (cat === ALL) return ITEMS;
    if (cat === SOON) return ITEMS.filter((i) => i.status !== "ok");
    return ITEMS.filter((i) => i.category === cat);
  }, [cat]);

  const chip = (value: string, label: string, accent?: string) => {
    const active = cat === value;
    return (
      <Chip
        key={value}
        label={label}
        onClick={() => setCat(value)}
        variant={active ? "filled" : "outlined"}
        sx={{
          fontWeight: 700,
          px: 0.5,
          ...(active
            ? { bgcolor: accent || "primary.main", color: "#fff" }
            : accent
              ? { color: accent, borderColor: alpha(accent, 0.4) }
              : {}),
        }}
      />
    );
  };

  return (
    <Stack spacing={3.5}>
      {/* Заголовок */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h2" sx={{ fontWeight: 800 }}>
            Холодильник
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {ITEMS.length} продуктов · следим за свежестью
          </Typography>
        </Box>
        <Button variant="contained" size="large" startIcon={<AddRoundedIcon />}>
          Добавить продукт
        </Button>
      </Stack>

      {/* Статистика */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile icon={<Inventory2RoundedIcon />} label="всего продуктов" value={ITEMS.length} color="#2E7D32" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile icon={<WarningAmberRoundedIcon />} label="скоро испортятся" value={soonCount} color="#F9A825" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile icon={<ErrorOutlineRoundedIcon />} label="просрочено" value={expiredCount} color="#E53935" />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatTile icon={<CategoryRoundedIcon />} label="категорий" value={categories.length} color="#0288D1" />
        </Grid>
      </Grid>

      {/* Фильтр категорий */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {chip(ALL, `Все (${ITEMS.length})`)}
        {chip(SOON, `⚠ Скоро / просрочено (${soonCount + expiredCount})`, "#F9A825")}
        {categories.map((c) => chip(c, `${c} (${ITEMS.filter((i) => i.category === c).length})`))}
      </Stack>

      {/* Сетка продуктов */}
      <Grid container spacing={3}>
        {shown.map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.name}>
            <ItemCard item={item} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

export default function FridgePage() {
  return (
    <DesignShell>
      <FridgeContent />
    </DesignShell>
  );
}
