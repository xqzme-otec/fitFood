"use client";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { num } from "@/lib/format";
import type { MealSlot, Recommendation } from "@/lib/types";

export default function RecommendationsDialog({
  open,
  onClose,
  slot,
  today,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  slot: MealSlot | null;
  today: string;
  onAdded: () => void;
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [recs, setRecs] = useState<Recommendation[]>([]);

  useEffect(() => {
    if (!open || !slot) return;
    setLoading(true);
    api
      .recommendations(slot.id)
      .then(setRecs)
      .catch(() => setRecs([]))
      .finally(() => setLoading(false));
  }, [open, slot]);

  const addDish = async (r: Recommendation) => {
    if (!slot || !r.dish_id) return;
    try {
      await api.addEntry({
        meal_slot_id: slot.id,
        dish_id: r.dish_id,
        amount: r.suggested_grams > 0 ? r.suggested_grams : 100,
        entry_date: today,
      });
      toast("Добавлено в приём");
      onAdded();
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка", "error");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Идеи для «{slot?.name}»</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : recs.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 3 }} align="center">
            Подходящих рецептов нет — пополните холодильник.
          </Typography>
        ) : (
          <Stack spacing={2} sx={{ pt: 1 }}>
            {recs.map((r, i) => (
              <Box key={i} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>{r.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {r.reason}
                    </Typography>
                  </Box>
                  <Chip size="small" label={r.kind === "dish" ? "Рецепт" : "Комбо"} />
                </Stack>
                <Stack direction="row" spacing={1} sx={{ my: 1 }} flexWrap="wrap" useFlexGap>
                  <Chip size="small" color="primary" variant="outlined" label={`${num(r.calories)} ккал`} />
                  <Chip size="small" variant="outlined" label={`Б ${num(r.protein)}`} />
                  <Chip size="small" variant="outlined" label={`Ж ${num(r.fat)}`} />
                  <Chip size="small" variant="outlined" label={`У ${num(r.carbs)}`} />
                </Stack>
                {r.missing_ingredients.length > 0 && (
                  <Typography variant="caption" color="error.main">
                    Не хватает: {r.missing_ingredients.join(", ")}
                  </Typography>
                )}
                {r.dish_id && (
                  <Box sx={{ mt: 1 }}>
                    <Button size="small" variant="contained" onClick={() => addDish(r)}>
                      В приём (~{num(r.suggested_grams)} г)
                    </Button>
                  </Box>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
