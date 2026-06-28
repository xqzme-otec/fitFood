"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import DesignShell from "@/components/DesignShell";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { FRIDGE_CATEGORIES, num } from "@/lib/format";
import type { FridgeItem, MealSlot, Product } from "@/lib/types";

const ALL = "Все";
const SOON = "__soon__";
const EXPIRED = "__expired__";

const UNITS: { code: string; label: string }[] = [
  { code: "g", label: "г" },
  { code: "ml", label: "мл" },
  { code: "pcs", label: "шт" },
];
const unitLabel = (code: string) => UNITS.find((u) => u.code === code)?.label ?? code;

const STATUS: Record<string, { label: string; color: string }> = {
  ok: { label: "Свежий", color: "#2E7D32" },
  soon: { label: "Скоро истекает", color: "#F9A825" },
  expired: { label: "Просрочен", color: "#E53935" },
  unknown: { label: "Без срока", color: "#90A4AE" },
};

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function ItemCard({ item, onClick, onDelete }: { item: FridgeItem; onClick: () => void; onDelete: () => void }) {
  const s = STATUS[item.expiry_status] ?? STATUS.unknown;
  const tinted = item.expiry_status === "soon" || item.expiry_status === "expired";
  const kb = item.kbju_100g;
  return (
    <Card
      sx={{
        position: "relative",
        height: "100%",
        borderColor: tinted ? alpha(s.color, 0.35) : undefined,
        bgcolor: tinted ? alpha(s.color, 0.04) : undefined,
        transition: "box-shadow .15s, transform .15s",
        "&:hover": { boxShadow: "0 6px 18px rgba(27,42,30,0.10)", transform: "translateY(-2px)" },
      }}
    >
      <IconButton
        size="small"
        aria-label="Удалить продукт"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        sx={{
          position: "absolute",
          top: 6,
          right: 6,
          zIndex: 2,
          color: "text.secondary",
          bgcolor: "transparent",
          "&:hover": { color: "#E53935", bgcolor: "transparent" },
        }}
      >
        <DeleteOutlineRoundedIcon fontSize="small" />
      </IconButton>
      <CardActionArea onClick={onClick} sx={{ height: "100%" }}>
        <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
          <Stack direction="row" alignItems="flex-start" spacing={2}>
            <Box sx={{ display: "grid", placeItems: "center", width: 54, height: 54, borderRadius: "50%", bgcolor: alpha("#2E7D32", 0.08), fontSize: 28, flex: "none" }}>
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
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {num(item.quantity)}
              <Box component="span" sx={{ fontSize: 13, color: "text.secondary", fontWeight: 600 }}>
                {" "}
                {unitLabel(item.unit)}
              </Box>
            </Typography>
            <Chip
              size="small"
              label={item.days_left != null && item.expiry_status !== "expired" ? `${s.label} · ${item.days_left} дн.` : s.label}
              sx={{ bgcolor: alpha(s.color, 0.14), color: s.color, fontWeight: 700 }}
            />
          </Stack>

          {kb && (
            <Stack direction="row" spacing={0.5} sx={{ mt: 2.5 }} flexWrap="wrap" useFlexGap>
              <Chip size="small" variant="outlined" label={`${num(kb.calories)} ккал`} />
              <Chip size="small" variant="outlined" label={`Б ${num(kb.protein)}`} />
              <Chip size="small" variant="outlined" label={`Ж ${num(kb.fat)}`} />
              <Chip size="small" variant="outlined" label={`У ${num(kb.carbs)}`} />
            </Stack>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function EditItemDialog({
  item,
  meals,
  onClose,
  onSave,
  onDelete,
  onAddToDiet,
}: {
  item: FridgeItem | null;
  meals: MealSlot[];
  onClose: () => void;
  onSave: (quantity: number, expiry: string | null, category: string) => void;
  onDelete: () => void;
  onAddToDiet: (slotId: number, amount: number) => void;
}) {
  const [qty, setQty] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("");
  const [dietSlot, setDietSlot] = useState<number | null>(null);
  const [dietQty, setDietQty] = useState("");

  const lastId = useRef<number | null>(null);
  if (item && lastId.current !== item.id) {
    lastId.current = item.id;
    setQty(String(item.quantity));
    setDate(item.expiry_date ?? "");
    setCategory(item.category);
    setDietSlot(null);
    setDietQty(String(item.quantity));
  }
  if (!item) lastId.current = null;

  const open = Boolean(item);
  const handleSave = () => onSave(Math.max(0, Number(qty) || 0), date || null, category);
  // На случай, если у позиции категория вне канонного списка — добавим её в опции.
  const categoryOptions =
    item && !FRIDGE_CATEGORIES.includes(item.category)
      ? [item.category, ...FRIDGE_CATEGORIES]
      : FRIDGE_CATEGORIES;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      {item && (
        <>
          <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: "50%", bgcolor: alpha("#2E7D32", 0.08), fontSize: 22 }}>
              {item.emoji}
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, lineHeight: 1.1 }}>{item.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {item.category}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ mt: 0.5 }}>
              <TextField
                label="Количество"
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                fullWidth
                InputProps={{ endAdornment: <InputAdornment position="end">{unitLabel(item.unit)}</InputAdornment> }}
              />
              <TextField label="Срок годности" type="date" value={date} onChange={(e) => setDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />

              <TextField
                label="Категория"
                select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                fullWidth
                helperText="Если продукт лежит не в том разделе — выберите правильный"
              >
                {categoryOptions.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>

              {item.product_id != null && meals.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                    Добавить в рацион
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {meals.map((m) => (
                      <Button
                        key={m.id}
                        variant={dietSlot === m.id ? "contained" : "outlined"}
                        size="small"
                        onClick={() => setDietSlot(m.id)}
                      >
                        {m.name}
                      </Button>
                    ))}
                  </Stack>
                  {dietSlot != null && (
                    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} alignItems="center">
                      <TextField
                        label="Количество"
                        type="number"
                        size="small"
                        value={dietQty}
                        onChange={(e) => setDietQty(e.target.value)}
                        sx={{ width: 150 }}
                        InputProps={{ endAdornment: <InputAdornment position="end">{unitLabel(item.unit)}</InputAdornment> }}
                      />
                      <Button variant="contained" size="small" onClick={() => onAddToDiet(dietSlot, Math.max(0, Number(dietQty) || 0))}>
                        Добавить
                      </Button>
                    </Stack>
                  )}
                </Box>
              )}
            </Stack>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
            <Button color="error" onClick={onDelete}>
              Удалить
            </Button>
            <Box>
              <Button onClick={onClose}>Отмена</Button>
              <Button variant="contained" onClick={handleSave} sx={{ ml: 1 }}>
                Сохранить
              </Button>
            </Box>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}

function AddItemDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (product: Product, quantity: number, unit: string, expiry: string | null) => void;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [options, setOptions] = useState<Product[]>([]);
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("g");
  const [date, setDate] = useState(addDaysISO(7));
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    setProduct(null);
    setQty("");
    setUnit("g");
    setDate(addDaysISO(7));
    api.searchProducts("").then(setOptions).catch(() => setOptions([]));
  }, [open]);

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

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 4, pt: 3 }}>
        <span>Добавить продукт</span>
        <IconButton aria-label="Закрыть" onClick={onClose} size="small">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 4 }}>
        <Stack spacing={3} sx={{ pt: 1.5 }}>
          <Autocomplete
            options={options}
            value={product}
            openOnFocus
            filterOptions={(x) => x}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            onInputChange={(_, v, reason) => reason === "input" && search(v)}
            onChange={(_, v) => {
              setProduct(v);
              if (v) setUnit(v.unit === "ml" ? "ml" : v.unit === "pcs" ? "pcs" : "g");
            }}
            noOptionsText="Ничего не найдено"
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
            renderInput={(params) => <TextField {...params} label="Продукт" placeholder="Найти продукт…" autoFocus />}
          />
          <Stack direction="row" spacing={2}>
            <TextField label="Количество" type="number" value={qty} onChange={(e) => setQty(e.target.value)} fullWidth />
            <TextField label="Единица" select value={unit} onChange={(e) => setUnit(e.target.value)} sx={{ width: 120 }}>
              {UNITS.map((u) => (
                <MenuItem key={u.code} value={u.code}>
                  {u.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <TextField label="Срок годности" type="date" value={date} onChange={(e) => setDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 4, py: 2.5 }}>
        <Button onClick={onClose} color="inherit">
          Отмена
        </Button>
        <Button variant="contained" sx={{ ml: 1 }} disabled={!product} onClick={() => product && onAdd(product, Math.max(0, Number(qty) || 0), unit, date || null)}>
          Добавить
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function FridgeContent() {
  const toast = useToast();
  const { meals } = useAuth();
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [cat, setCat] = useState<string>(ALL);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<FridgeItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(() => {
    api.fridgeItems().then(setItems).catch(() => setItems([]));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items]);
  const soonCount = items.filter((i) => i.expiry_status === "soon").length;
  const expiredCount = items.filter((i) => i.expiry_status === "expired").length;

  const shown = useMemo(() => {
    let list = items;
    if (cat === SOON) list = list.filter((i) => i.expiry_status === "soon");
    else if (cat === EXPIRED) list = list.filter((i) => i.expiry_status === "expired");
    else if (cat !== ALL) list = list.filter((i) => i.category === cat);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((i) => i.name.toLowerCase().includes(q));
    return list;
  }, [cat, items, query]);

  const handleAdd = async (product: Product, quantity: number, unit: string, expiry: string | null) => {
    if (quantity <= 0) return toast("Укажите количество", "error");
    try {
      await api.fridgeAdd({ name: product.name, product_id: product.id, quantity, unit: unit as "g" | "ml" | "pcs", expiry_date: expiry });
      setAddOpen(false);
      toast(`«${product.name}» добавлен в холодильник`);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка", "error");
    }
  };

  const handleSave = async (quantity: number, expiry: string | null, category: string) => {
    if (!editing) return;
    try {
      await api.fridgeUpdate(editing.id, { quantity, expiry_date: expiry, category });
      setEditing(null);
      toast("Изменения сохранены");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка", "error");
    }
  };

  const handleDeleteItem = async (target: FridgeItem) => {
    try {
      await api.fridgeDelete(target.id);
      if (editing?.id === target.id) setEditing(null);
      toast(`«${target.name}» удалён из холодильника`);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка", "error");
    }
  };

  const handleAddToDiet = async (slotId: number, amount: number) => {
    if (!editing || editing.product_id == null) return;
    if (amount <= 0) return toast("Укажите количество", "error");
    try {
      await api.addEntry({ meal_slot_id: slotId, amount, product_id: editing.product_id });
      // Списываем добавленное количество из холодильника.
      const remaining = editing.quantity - amount;
      if (remaining <= 0) await api.fridgeDelete(editing.id);
      else await api.fridgeUpdate(editing.id, { quantity: remaining });
      const meal = meals.find((m) => m.id === slotId);
      toast(`«${editing.name}» добавлен в рацион: ${meal?.name ?? ""}`);
      setEditing(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка", "error");
    }
  };

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
          ...(active ? { bgcolor: accent || "primary.main", color: "#fff" } : accent ? { color: accent, borderColor: alpha(accent, 0.4) } : {}),
        }}
      />
    );
  };

  return (
    <Stack spacing={3.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h2" sx={{ fontWeight: 800 }}>
            Холодильник
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {items.length} продуктов · следим за свежестью
          </Typography>
        </Box>
        <Button variant="contained" size="large" startIcon={<AddRoundedIcon />} onClick={() => setAddOpen(true)}>
          Добавить продукт
        </Button>
      </Stack>

      <TextField
        fullWidth
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск по холодильнику…"
        sx={{ mt: 5 }}
        InputProps={{
          sx: { borderRadius: 99, bgcolor: "background.paper", pl: 1 },
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {chip(ALL, `Все (${items.length})`)}
        {chip(SOON, `⚠ Скоро истекает (${soonCount})`, "#F9A825")}
        {chip(EXPIRED, `⛔ Просрочено (${expiredCount})`, "#E53935")}
        {categories.map((c) => chip(c, `${c} (${items.filter((i) => i.category === c).length})`))}
      </Stack>

      {items.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              Холодильник пуст — добавьте продукт или отсканируйте чек.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3.5}>
          {shown.map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
              <ItemCard item={item} onClick={() => setEditing(item)} onDelete={() => handleDeleteItem(item)} />
            </Grid>
          ))}
        </Grid>
      )}

      <EditItemDialog
        item={editing}
        meals={meals}
        onClose={() => setEditing(null)}
        onSave={handleSave}
        onDelete={() => editing && handleDeleteItem(editing)}
        onAddToDiet={handleAddToDiet}
      />

      <AddItemDialog open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAdd} />
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
