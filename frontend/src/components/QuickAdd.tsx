"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { num } from "@/lib/format";
import type { FridgeItem, MealSlot, Product } from "@/lib/types";

export default function QuickAdd({
  meals,
  today,
  onAdded,
}: {
  meals: MealSlot[];
  today: string;
  onAdded: () => void;
}) {
  const toast = useToast();
  const [options, setOptions] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [amount, setAmount] = useState("100");
  const [slotId, setSlotId] = useState<number | "">(meals[0]?.id ?? "");
  const [fridge, setFridge] = useState<FridgeItem[]>([]);
  const [busy, setBusy] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.fridgeItems().then(setFridge).catch(() => setFridge([]));
  }, []);
  useEffect(() => {
    if (slotId === "" && meals[0]) setSlotId(meals[0].id);
  }, [meals, slotId]);

  const fridgeByProduct = useMemo(() => {
    const m = new Map<number, FridgeItem>();
    fridge.forEach((f) => f.product_id != null && m.set(f.product_id, f));
    return m;
  }, [fridge]);

  const search = (term: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      try {
        setOptions(await api.searchProducts(term));
      } catch {
        setOptions([]);
      }
    }, 250);
  };

  const factor = (Number(amount) || 0) / 100;

  const add = async () => {
    if (!selected || !slotId) return;
    const amt = Number(amount) || 0;
    if (amt <= 0) return toast("Укажите количество", "error");
    setBusy(true);
    try {
      await api.addEntry({ meal_slot_id: Number(slotId), product_id: selected.id, amount: amt, entry_date: today });
      toast(`${selected.name} добавлен`);
      setSelected(null);
      setAmount("100");
      onAdded();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Autocomplete
        options={options}
        value={selected}
        onChange={(_, v) => setSelected(v)}
        filterOptions={(x) => x}
        getOptionLabel={(o) => o.name}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        onInputChange={(_, v) => search(v)}
        noOptionsText="Начните вводить название продукта"
        renderOption={(props, o) => {
          const fi = fridgeByProduct.get(o.id);
          return (
            <Box component="li" {...props} key={o.id}>
              <Stack direction="row" justifyContent="space-between" sx={{ width: "100%" }}>
                <span>{o.name}</span>
                {fi ? (
                  <Typography variant="caption" sx={{ color: "success.main", fontWeight: 700 }}>
                    имеется · {num(fi.quantity)} {fi.unit === "g" ? "г" : fi.unit}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    {num(o.calories)} ккал/100г
                  </Typography>
                )}
              </Stack>
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Добавить продукт — начните вводить название…"
            size="medium"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        )}
      />

      {selected && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <TextField
            label="Кол-во, г/мл"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            sx={{ maxWidth: { sm: 140 } }}
          />
          <TextField
            select
            label="Приём пищи"
            value={slotId}
            onChange={(e) => setSlotId(Number(e.target.value))}
            sx={{ minWidth: 180 }}
          >
            {meals.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.name}
              </MenuItem>
            ))}
          </TextField>
          <Chip color="primary" variant="outlined" label={`${num(selected.calories * factor)} ккал`} />
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" onClick={add} disabled={busy}>
            Добавить
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
