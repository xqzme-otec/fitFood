"use client";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { num } from "@/lib/format";

export function CalorieRing({
  consumed,
  target,
  size = 168,
}: {
  consumed: number;
  target: number;
  size?: number;
}) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
  const remaining = Math.round(target - consumed);
  const over = consumed > target;
  return (
    <Box sx={{ position: "relative", width: size, height: size }}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={size}
        thickness={4}
        sx={{ color: "rgba(46,125,50,0.12)", position: "absolute", left: 0 }}
      />
      <CircularProgress
        variant="determinate"
        value={pct}
        size={size}
        thickness={4}
        sx={{ color: over ? "error.main" : "primary.main", "& .MuiCircularProgress-circle": { strokeLinecap: "round" } }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h3" sx={{ lineHeight: 1 }}>
          {num(consumed)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          из {num(target)} ккал
        </Typography>
        <Typography
          variant="caption"
          sx={{ mt: 0.5, fontWeight: 700, color: over ? "error.main" : "success.main" }}
        >
          {over ? `+${Math.abs(remaining)} сверх` : `${remaining} осталось`}
        </Typography>
      </Box>
    </Box>
  );
}

const MACRO_COLORS: Record<string, string> = {
  Белки: "#2E7D32",
  Жиры: "#F9A825",
  Углеводы: "#0288D1",
};

export function MacroBar({
  label,
  consumed,
  limit,
}: {
  label: string;
  consumed: number;
  limit: number;
}) {
  const pct = limit > 0 ? Math.min((consumed / limit) * 100, 100) : 0;
  const over = consumed > limit * 1.001;
  const color = MACRO_COLORS[label] || "#2E7D32";
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <b>{num(consumed)}</b> / {num(limit)} г
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: "rgba(0,0,0,0.06)",
          "& .MuiLinearProgress-bar": { borderRadius: 4, bgcolor: over ? "#E53935" : color },
        }}
      />
    </Box>
  );
}

export function MacroBars({
  consumed,
  target,
}: {
  consumed: { protein: number; fat: number; carbs: number };
  target: { protein: number; fat: number; carbs: number };
}) {
  return (
    <Stack spacing={2}>
      <MacroBar label="Белки" consumed={consumed.protein} limit={target.protein} />
      <MacroBar label="Жиры" consumed={consumed.fat} limit={target.fat} />
      <MacroBar label="Углеводы" consumed={consumed.carbs} limit={target.carbs} />
    </Stack>
  );
}
