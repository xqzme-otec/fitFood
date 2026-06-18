"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { num } from "@/lib/format";
import type { Dish, FridgeItem, MealSlot, Product } from "@/lib/types";

type Mode = "product" | "dish";
type Option = (Product & { _kind: "product" }) | (Dish & { _kind: "dish" });

interface Props {
  open: boolean;
  onClose: () => void;
  meals: MealSlot[];
  onAdded: () => void;
  today: string;
  fixedSlotId?: number;
}

export default function AddFoodDialog({ open, onClose, meals, onAdded, today, fixedSlotId }: Props) {
  const toast = useToast();
  const [mode, setMode] = useState<Mode>("product");
  const [options, setOptions] = useState<Option[]>([]);
  const [selected, setSelected] = useState<Option | null>(null);
  const [amount, setAmount] = useState("100");
  const [slotId, setSlotId] = useState<number | "">("");
  const [fridge, setFridge] = useState<FridgeItem[]>([]);
  const [showDeduct, setShowDeduct] = useState(false);
  const [busy, setBusy] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    setMode("product");
    setSelected(null);
    setAmount("100");
    setSlotId(fixedSlotId ?? meals[0]?.id ?? "");
    setOptions([]);
    setShowDeduct(false);
    api.fridgeItems().then(setFridge).catch(() => setFridge([]));
  }, [open, fixedSlotId, meals]);

  const fridgeByProduct = useMemo(() => {
    const m = new Map<number, FridgeItem>();
    fridge.forEach((f) => {
      if (f.product_id != null) m.set(f.product_id, f);
    });
    return m;
  }, [fridge]);

  const runSearch = (term: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      try {
        if (mode === "product") {
          const items = await api.searchProducts(term);
          setOptions(items.map((p) => ({ ...p, _kind: "product" as const })));
        } else {
          const items = await api.searchDishes(term);
          setOptions(items.map((d) => ({ ...d, _kind: "dish" as const })));
        }
      } catch {
        setOptions([]);
      }
    }, 250);
  };

  const per100 = (o: Option) =>
    o._kind === "product"
      ? { calories: o.calories, protein: o.protein, fat: o.fat, carbs: o.carbs }
      : {
          calories: o.per_100g.calories || 0,
          protein: o.per_100g.protein || 0,
          fat: o.per_100g.fat || 0,
          carbs: o.per_100g.carbs || 0,
        };

  const amt = Number(amount) || 0;
  const factor = amt / 100;

  // Списание из холодильника для блюда.
  const deductions = useMemo(() => {
    if (!selected || selected._kind !== "dish" || !selected.total_grams) return [];
    const scale = amt / selected.total_grams;
    return selected.ingredients.map((ing) => {
      const fi = fridgeByProduct.get(ing.product_id);
      return {
        name: ing.name,
        needed: Math.round(ing.grams * scale),
        item: fi || null,
        available: !!fi,
      };
    });
  }, [selected, amt, fridgeByProduct]);

  const handleSubmit = async () => {
    if (!selected) return toast("Выберите продукт или блюдо", "error");
    if (!slotId) return toast("Выберите приём пищи", "error");
    if (!amt || amt <= 0) return toast("Укажите количество", "error");
    setBusy(true);
    try {
      await api.addEntry({
        meal_slot_id: Number(slotId),
        amount: amt,
        entry_date: today,
        ...(selected._kind === "product" ? { product_id: selected.id } : { dish_id: selected.id }),
      });
      // Списываем доступные ингредиенты блюда из холодильника.
      if (selected._kind === "dish") {
        await Promise.all(
          deductions
            .filter((d) => d.available && d.item)
            .map((d) => {
              const remaining = d.item!.quantity - d.needed;
              return remaining <= 0
                ? api.fridgeDelete(d.item!.id)
                : api.fridgeUpdate(d.item!.id, { quantity: remaining });
            }),
        );
      }
      toast("Добавлено в дневник");
      onAdded();
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка", "error");
    } finally {
      setBusy(false);
    }
  };

  const p = selected ? per100(selected) : null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Добавить в дневник</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            fullWidth
            size="small"
            onChange={(_, v: Mode | null) => {
              if (!v) return;
              setMode(v);
              setSelected(null);
              setOptions([]);
            }}
          >
            <ToggleButton value="product">Продукт</ToggleButton>
            <ToggleButton value="dish">Блюдо</ToggleButton>
          </ToggleButtonGroup>

          <Autocomplete
            options={options}
            value={selected}
            onChange={(_, v) => setSelected(v)}
            filterOptions={(x) => x}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(a, b) => a.id === b.id && a._kind === b._kind}
            onInputChange={(_, v) => runSearch(v)}
            noOptionsText="Начните вводить название"
            renderOption={(props, o) => {
              const fi = o._kind === "product" ? fridgeByProduct.get(o.id) : undefined;
              const cal = o._kind === "product" ? o.calories : o.per_100g.calories || 0;
              return (
                <Box component="li" {...props} key={`${o._kind}-${o.id}`}>
                  <Stack direction="row" justifyContent="space-between" sx={{ width: "100%" }}>
                    <span>{o.name}</span>
                    {fi ? (
                      <Typography variant="caption" sx={{ color: "success.main", fontWeight: 700 }}>
                        имеется · {num(fi.quantity)} {fi.unit === "g" ? "г" : fi.unit}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        {num(cal)} ккал/100г
                      </Typography>
                    )}
                  </Stack>
                </Box>
              );
            }}
            renderInput={(params) => (
              <TextField {...params} label="Поиск" placeholder="Например, куриное филе" autoFocus />
            )}
          />

          {selected && p && (
            <>
              <Divider />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Количество, г/мл"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  sx={{ maxWidth: 160 }}
                />
                {!fixedSlotId && (
                  <TextField
                    select
                    label="Приём пищи"
                    value={slotId}
                    onChange={(e) => setSlotId(Number(e.target.value))}
                    fullWidth
                  >
                    {meals.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              </Stack>

              <Box sx={{ bgcolor: "background.default", borderRadius: 2, p: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontWeight: 700 }}>{selected.name}</Typography>
                  <Chip
                    color="primary"
                    label={`${num(p.calories * factor)} ккал`}
                    size="small"
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Б {num(p.protein * factor, 1)} · Ж {num(p.fat * factor, 1)} · У{" "}
                  {num(p.carbs * factor, 1)}
                </Typography>
              </Box>

              {selected._kind === "dish" && deductions.length > 0 && (
                <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                  <Link
                    component="button"
                    type="button"
                    underline="none"
                    onClick={() => setShowDeduct((s) => !s)}
                    sx={{ display: "block", width: "100%", textAlign: "left", p: 1.5, color: "text.secondary", fontWeight: 600 }}
                  >
                    Списание из холодильника {showDeduct ? "▲" : "▼"}
                  </Link>
                  <Collapse in={showDeduct}>
                    <Divider />
                    <List dense>
                      {deductions.map((d, i) => (
                        <ListItem key={i} secondaryAction={<span>{d.needed} г</span>}>
                          <ListItemText
                            primary={d.name}
                            primaryTypographyProps={{
                              color: d.available ? "success.main" : "error.main",
                              fontWeight: 600,
                            }}
                            secondary={d.available ? "есть в холодильнике" : "нет в холодильнике"}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </Box>
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Отмена
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={busy || !selected}>
          Добавить
        </Button>
      </DialogActions>
    </Dialog>
  );
}
