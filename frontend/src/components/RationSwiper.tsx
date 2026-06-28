"use client";
import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import SkipNextRoundedIcon from "@mui/icons-material/SkipNextRounded";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { num } from "@/lib/format";
import type { MealSlot, RationNext } from "@/lib/types";

export default function RationSwiper({
  open,
  onClose,
  today,
  onFinished,
}: {
  open: boolean;
  onClose: () => void;
  today: string;
  onFinished: () => void;
}) {
  const toast = useToast();
  const [meals, setMeals] = useState<MealSlot[]>([]);
  const [mealIndex, setMealIndex] = useState(0);
  const [card, setCard] = useState<RationNext | null>(null);
  const [excluded, setExcluded] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [exiting, setExiting] = useState<"" | "left" | "right">("");
  const [done, setDone] = useState(false);

  const slot = meals[mealIndex];

  const fetchCard = useCallback(
    async (slotId: number, exclude: number[]) => {
      setLoading(true);
      try {
        const next = await api.rationNext(slotId, today, exclude);
        setCard(next);
      } catch {
        setCard(null);
      } finally {
        setLoading(false);
      }
    },
    [today],
  );

  // Загрузка приёмов при открытии.
  useEffect(() => {
    if (!open) return;
    setDone(false);
    setMealIndex(0);
    setExcluded([]);
    setCard(null);
    setLoading(true);
    api
      .getMeals()
      .then((m) => {
        const ordered = [...m].sort((a, b) => a.order - b.order);
        setMeals(ordered);
        if (ordered.length) fetchCard(ordered[0].id, []);
        else setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open, fetchCard]);

  const goToNextMeal = useCallback(() => {
    const next = mealIndex + 1;
    if (next >= meals.length) {
      setDone(true);
      return;
    }
    setMealIndex(next);
    setExcluded([]);
    fetchCard(meals[next].id, []);
  }, [mealIndex, meals, fetchCard]);

  const animate = (dir: "left" | "right", after: () => void) => {
    setExiting(dir);
    setTimeout(() => {
      setExiting("");
      after();
    }, 220);
  };

  // Лайк — съел это: пишем в дневник (если есть рецепт) и идём к следующему приёму.
  const like = async () => {
    if (!card || !slot || busy) return;
    setBusy(true);
    try {
      if (card.dish_id) {
        await api.addEntry({
          meal_slot_id: slot.id,
          dish_id: card.dish_id,
          amount: card.suggested_grams > 0 ? card.suggested_grams : 100,
          entry_date: today,
        });
        toast(`Добавлено в «${slot.name}»`);
      } else {
        // LLM-идея без рецепта в каталоге — залогировать структурно нечем.
        toast("Идея отмечена — добавьте вручную, если приготовите", "info");
      }
      onFinished();
      animate("right", goToNextMeal);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка", "error");
    } finally {
      setBusy(false);
    }
  };

  // Дизлайк — следующий вариант для этого же приёма.
  const dislike = () => {
    if (!card || busy) return;
    if (card.dish_id) {
      const nextExcluded = [...excluded, card.dish_id];
      setExcluded(nextExcluded);
      animate("left", () => slot && fetchCard(slot.id, nextExcluded));
    } else {
      // Каталог исчерпан (LLM-вариант) — пропускаем приём.
      animate("left", goToNextMeal);
    }
  };

  const skipMeal = () => animate("left", goToNextMeal);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
      <Box sx={{ p: 2 }}>
        {/* Шапка: прогресс по приёмам + закрыть */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography sx={{ fontWeight: 800 }}>
            <RestaurantRoundedIcon sx={{ verticalAlign: "-5px", mr: 0.5 }} fontSize="small" />
            Рацион на день
          </Typography>
          <IconButton onClick={onClose} size="small" aria-label="Закрыть">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        {meals.length > 0 && !done && (
          <>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {slot?.name} — приём {mealIndex + 1} из {meals.length}
              </Typography>
              {card && (
                <Typography variant="caption" color="text.secondary">
                  осталось на день: {num(card.day_remaining.calories)} ккал
                </Typography>
              )}
            </Stack>
            <LinearProgress
              variant="determinate"
              value={(mealIndex / meals.length) * 100}
              sx={{ mb: 2, borderRadius: 2, height: 6 }}
            />
          </>
        )}

        {/* Тело */}
        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : done ? (
          <Box sx={{ textAlign: "center", py: 5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Рацион собран 🎉
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Понравившиеся блюда добавлены в ваш дневник.
            </Typography>
            <Button variant="contained" onClick={onClose}>
              Готово
            </Button>
          </Box>
        ) : !card ? (
          <Box sx={{ textAlign: "center", py: 5 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Для «{slot?.name}» подходящих блюд нет — пополните холодильник.
            </Typography>
            <Button variant="outlined" startIcon={<SkipNextRoundedIcon />} onClick={skipMeal}>
              Пропустить приём
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              transition: "transform .22s ease, opacity .22s ease",
              transform:
                exiting === "left"
                  ? "translateX(-120%) rotate(-8deg)"
                  : exiting === "right"
                  ? "translateX(120%) rotate(8deg)"
                  : "none",
              opacity: exiting ? 0 : 1,
            }}
          >
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                p: 2.5,
                boxShadow: 3,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, pr: 1 }}>
                  {card.name}
                </Typography>
                <Chip
                  size="small"
                  color={card.source === "llm" ? "secondary" : "primary"}
                  icon={card.source === "llm" ? <AutoAwesomeRoundedIcon /> : <RestaurantRoundedIcon />}
                  label={card.source === "llm" ? "ИИ-идея" : "Рецепт"}
                />
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {card.reason}
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                <Chip size="small" color="primary" variant="outlined" label={`${num(card.calories)} ккал`} />
                <Chip size="small" variant="outlined" label={`Б ${num(card.protein)}`} />
                <Chip size="small" variant="outlined" label={`Ж ${num(card.fat)}`} />
                <Chip size="small" variant="outlined" label={`У ${num(card.carbs)}`} />
                {card.suggested_grams > 0 && (
                  <Chip size="small" variant="outlined" label={`~${num(card.suggested_grams)} г`} />
                )}
              </Stack>

              {card.missing_ingredients.length > 0 && (
                <Box
                  sx={(t) => ({
                    bgcolor: alpha(t.palette.warning.main, 0.12),
                    borderRadius: 2,
                    p: 1,
                    mb: 0.5,
                  })}
                >
                  <Typography variant="caption" color="warning.main" sx={{ fontWeight: 700 }}>
                    Не хватает: {card.missing_ingredients.join(", ")}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Кнопки тиндера */}
            <Stack direction="row" justifyContent="center" spacing={4} sx={{ mt: 3 }}>
              <IconButton
                onClick={dislike}
                disabled={busy}
                aria-label="Дальше"
                sx={(t) => ({
                  width: 64,
                  height: 64,
                  border: "2px solid",
                  borderColor: "divider",
                  color: t.palette.text.secondary,
                  "&:hover": { borderColor: t.palette.error.main, color: t.palette.error.main },
                })}
              >
                <CloseRoundedIcon sx={{ fontSize: 32 }} />
              </IconButton>
              <IconButton
                onClick={like}
                disabled={busy}
                aria-label="Съел это"
                sx={(t) => ({
                  width: 64,
                  height: 64,
                  bgcolor: t.palette.success.main,
                  color: "#fff",
                  "&:hover": { bgcolor: t.palette.success.dark },
                })}
              >
                <FavoriteRoundedIcon sx={{ fontSize: 30 }} />
              </IconButton>
            </Stack>
            <Typography variant="caption" color="text.secondary" align="center" sx={{ display: "block", mt: 1.5 }}>
              ✗ другой вариант · ♥ съел это
            </Typography>
          </Box>
        )}
      </Box>
    </Dialog>
  );
}
