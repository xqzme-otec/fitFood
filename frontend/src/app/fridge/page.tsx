"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { EXPIRY_COLOR, EXPIRY_LABEL, num, unitLabel } from "@/lib/format";
import AppShell from "@/components/AppShell";
import type { FridgeCategoryGroup, FridgeItem, Product, Unit } from "@/lib/types";

const ALL = "__all__";

function AddDialog({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const toast = useToast();
  const [options, setOptions] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [productId, setProductId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("100");
  const [unit, setUnit] = useState<Unit>("g");
  const [expiry, setExpiry] = useState("");
  const [busy, setBusy] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setProductId(null);
      setQuantity("100");
      setUnit("g");
      setExpiry("");
      setOptions([]);
    }
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

  const submit = async () => {
    if (!name.trim()) return toast("Укажите название", "error");
    const qty = Number(quantity) || 0;
    if (qty <= 0) return toast("Укажите количество", "error");
    setBusy(true);
    try {
      await api.fridgeAdd({
        name: name.trim(),
        quantity: qty,
        unit,
        product_id: productId ?? undefined,
        expiry_date: expiry || undefined,
      });
      toast("Добавлено в холодильник");
      onAdded();
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Добавить продукт</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Autocomplete
            freeSolo
            options={options}
            filterOptions={(x) => x}
            getOptionLabel={(o) => (typeof o === "string" ? o : o.name)}
            onInputChange={(_, v) => {
              setName(v);
              search(v);
            }}
            onChange={(_, v) => {
              if (v && typeof v !== "string") {
                setName(v.name);
                setProductId(v.id);
                if (v.unit === "g" || v.unit === "ml" || v.unit === "pcs") setUnit(v.unit);
              } else {
                setProductId(null);
              }
            }}
            renderInput={(params) => (
              <TextField {...params} label="Название" placeholder="Например, Творог 9%" autoFocus />
            )}
          />
          <Stack direction="row" spacing={2}>
            <TextField label="Количество" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} fullWidth />
            <TextField select label="Ед." value={unit} onChange={(e) => setUnit(e.target.value as Unit)} sx={{ minWidth: 96 }}>
              <MenuItem value="g">г</MenuItem>
              <MenuItem value="ml">мл</MenuItem>
              <MenuItem value="pcs">шт</MenuItem>
            </TextField>
          </Stack>
          <TextField
            label="Срок годности"
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText="Пусто → предложит LLM"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Отмена
        </Button>
        <Button onClick={submit} variant="contained" disabled={busy}>
          Добавить
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function EditDialog({
  item,
  onClose,
  onSaved,
}: {
  item: FridgeItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [quantity, setQuantity] = useState("");
  const [expiry, setExpiry] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (item) {
      setQuantity(String(item.quantity));
      setExpiry(item.expiry_date ?? "");
    }
  }, [item]);

  const submit = async () => {
    if (!item) return;
    setBusy(true);
    try {
      await api.fridgeUpdate(item.id, {
        quantity: Number(quantity) || item.quantity,
        expiry_date: expiry || undefined,
      });
      toast("Сохранено");
      onSaved();
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!item} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Изменить «{item?.name}»</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label={`Количество (${item ? unitLabel(item.unit) : "г"})`}
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <TextField
            label="Срок годности"
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Отмена
        </Button>
        <Button onClick={submit} variant="contained" disabled={busy}>
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function FridgeItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: FridgeItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const k = item.kbju_100g;
  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="h4" sx={{ pr: 1 }}>
            {item.name}
          </Typography>
          <Stack direction="row">
            <IconButton size="small" onClick={onEdit}>
              <EditRoundedIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={onDelete}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
          <Typography variant="h3">
            {num(item.quantity)}{" "}
            <Box component="span" sx={{ fontSize: 14, color: "text.secondary" }}>
              {unitLabel(item.unit)}
            </Box>
          </Typography>
          <Chip
            size="small"
            color={EXPIRY_COLOR[item.expiry_status]}
            label={
              item.days_left != null && item.expiry_status !== "expired"
                ? `${EXPIRY_LABEL[item.expiry_status]} · ${item.days_left} дн.`
                : EXPIRY_LABEL[item.expiry_status]
            }
          />
        </Stack>
        {k ? (
          <Stack direction="row" spacing={0.5} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
            <Chip size="small" variant="outlined" label={`${num(k.calories)} ккал`} />
            <Chip size="small" variant="outlined" label={`Б ${num(k.protein)}`} />
            <Chip size="small" variant="outlined" label={`Ж ${num(k.fat)}`} />
            <Chip size="small" variant="outlined" label={`У ${num(k.carbs)}`} />
          </Stack>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
            КБЖУ неизвестно
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function FridgeContent() {
  const toast = useToast();
  const [groups, setGroups] = useState<FridgeCategoryGroup[]>([]);
  const [cat, setCat] = useState<string>(ALL);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<FridgeItem | null>(null);

  const load = useCallback(() => {
    api.fridgeGrouped().then(setGroups).catch(() => setGroups([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const shown = cat === ALL ? allItems : groups.find((g) => g.category === cat)?.items ?? [];

  const remove = async (item: FridgeItem) => {
    try {
      await api.fridgeDelete(item.id);
      toast("Удалено");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка", "error");
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h2">Холодильник</Typography>
          <Typography variant="body2" color="text.secondary">
            {allItems.length} продуктов · сгруппированы по категориям
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setAddOpen(true)}>
          Добавить продукт
        </Button>
      </Stack>

      <Tabs value={cat} onChange={(_, v) => setCat(v)} variant="scrollable" scrollButtons="auto">
        <Tab label={`Все (${allItems.length})`} value={ALL} />
        {groups.map((g) => (
          <Tab key={g.category} label={`${g.category} (${g.items.length})`} value={g.category} />
        ))}
      </Tabs>

      {shown.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
              Здесь пусто. Добавьте продукты или отсканируйте чек.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {shown.map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
              <FridgeItemCard item={item} onEdit={() => setEditItem(item)} onDelete={() => remove(item)} />
            </Grid>
          ))}
        </Grid>
      )}

      <AddDialog open={addOpen} onClose={() => setAddOpen(false)} onAdded={load} />
      <EditDialog item={editItem} onClose={() => setEditItem(null)} onSaved={load} />
    </Stack>
  );
}

export default function FridgePage() {
  return (
    <AppShell>
      <FridgeContent />
    </AppShell>
  );
}
