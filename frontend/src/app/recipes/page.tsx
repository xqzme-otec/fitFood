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
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DesignShell from "@/components/DesignShell";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { num } from "@/lib/format";
import type { Dish, MealSlot, Product } from "@/lib/types";

interface EditorIngredient {
  product_id: number;
  name: string;
  grams: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

function RecipeCard({ dish, onClick, onEdit }: { dish: Dish; onClick: () => void; onEdit: () => void }) {
  const per = dish.per_100g || {};
  return (
    <Card
      sx={{
        position: "relative",
        height: "100%",
        transition: "box-shadow .15s, transform .15s",
        "&:hover": { boxShadow: "0 6px 18px rgba(27,42,30,0.10)", transform: "translateY(-2px)" },
      }}
    >
      <IconButton
        size="small"
        aria-label="Изменить рецепт"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        sx={{ position: "absolute", top: 6, right: 6, zIndex: 2, color: "text.secondary", bgcolor: "transparent", "&:hover": { color: "primary.main", bgcolor: "transparent" } }}
      >
        <EditRoundedIcon fontSize="small" />
      </IconButton>
      <CardActionArea onClick={onClick} sx={{ height: "100%" }}>
        <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
          <Stack direction="row" alignItems="flex-start" spacing={2}>
            <Box sx={{ display: "grid", placeItems: "center", width: 54, height: 54, borderRadius: "50%", bgcolor: alpha("#2E7D32", 0.08), fontSize: 28, flex: "none" }}>
              {dish.emoji}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800 }} noWrap>
                {dish.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {dish.description || dish.category}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {num(per.calories || 0)}
              <Box component="span" sx={{ fontSize: 13, color: "text.secondary", fontWeight: 600 }}>
                {" "}
                ккал/100г
              </Box>
            </Typography>
            <Chip size="small" label={`${dish.ingredients.length} ингр.`} sx={{ fontWeight: 700 }} />
          </Stack>

          <Stack direction="row" spacing={0.5} sx={{ mt: 2.5 }} flexWrap="wrap" useFlexGap>
            <Chip size="small" variant="outlined" label={`Б ${num(per.protein || 0)}`} />
            <Chip size="small" variant="outlined" label={`Ж ${num(per.fat || 0)}`} />
            <Chip size="small" variant="outlined" label={`У ${num(per.carbs || 0)}`} />
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function RecipeDetailDialog({
  dish,
  meals,
  onClose,
  onAddToDiet,
}: {
  dish: Dish | null;
  meals: MealSlot[];
  onClose: () => void;
  onAddToDiet: (slotId: number, amount: number) => void;
}) {
  const per = dish?.per_100g || {};
  const [dietSlot, setDietSlot] = useState<number | null>(null);
  const [dietQty, setDietQty] = useState("");

  const lastId = useRef<number | null>(null);
  if (dish && lastId.current !== dish.id) {
    lastId.current = dish.id;
    setDietSlot(null);
    setDietQty(String(Math.round(dish.total_grams || 100)));
  }
  if (!dish) lastId.current = null;
  return (
    <Dialog open={!!dish} onClose={onClose} fullWidth maxWidth="xs">
      {dish && (
        <>
          <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: "50%", bgcolor: alpha("#2E7D32", 0.08), fontSize: 22 }}>
              {dish.emoji}
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, lineHeight: 1.1 }}>{dish.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {dish.description || dish.category}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ bgcolor: "background.default", borderRadius: 2, p: 1.5, mb: 2 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography sx={{ fontWeight: 700 }}>На 100 г</Typography>
                <Chip size="small" color="primary" label={`${num(per.calories || 0)} ккал`} />
              </Stack>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                <Chip size="small" variant="outlined" label={`Б ${num(per.protein || 0)}`} />
                <Chip size="small" variant="outlined" label={`Ж ${num(per.fat || 0)}`} />
                <Chip size="small" variant="outlined" label={`У ${num(per.carbs || 0)}`} />
                <Chip size="small" variant="outlined" label={`${num(dish.total_grams || 0)} г всего`} />
              </Stack>
            </Box>

            <Typography variant="overline" color="text.secondary">
              Состав
            </Typography>
            <List dense disablePadding>
              {dish.ingredients.map((ing) => (
                <ListItem key={ing.product_id} disableGutters secondaryAction={<span>{num(ing.grams)} г</span>}>
                  <ListItemText primary={ing.name} />
                </ListItem>
              ))}
            </List>

            {meals.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Добавить в рацион
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {meals.map((m) => (
                    <Button key={m.id} variant={dietSlot === m.id ? "contained" : "outlined"} size="small" onClick={() => setDietSlot(m.id)}>
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
                      InputProps={{ endAdornment: <InputAdornment position="end">г</InputAdornment> }}
                    />
                    <Button variant="contained" size="small" onClick={() => onAddToDiet(dietSlot, Math.max(0, Number(dietQty) || 0))}>
                      Добавить
                    </Button>
                  </Stack>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button color="inherit" onClick={onClose}>
              Закрыть
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}

function RecipeEditorDialog({
  open,
  dish,
  onClose,
  onSaved,
}: {
  open: boolean;
  dish: Dish | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const isNew = !dish;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<EditorIngredient[]>([]);
  const [options, setOptions] = useState<Product[]>([]);
  const [busy, setBusy] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    api.searchProducts("", 50).then(setOptions).catch(() => setOptions([]));
    if (dish) {
      setName(dish.name);
      setDescription(dish.description || "");
      Promise.all(
        dish.ingredients.map(async (ing) => {
          try {
            const p = await api.getProduct(ing.product_id);
            return { product_id: ing.product_id, name: ing.name, grams: ing.grams, calories: p.calories, protein: p.protein, fat: p.fat, carbs: p.carbs };
          } catch {
            return { product_id: ing.product_id, name: ing.name, grams: ing.grams, calories: 0, protein: 0, fat: 0, carbs: 0 };
          }
        }),
      ).then(setIngredients);
    } else {
      setName("");
      setDescription("");
      setIngredients([]);
    }
  }, [open, dish]);

  const search = (term: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      try {
        setOptions(await api.searchProducts(term, 50));
      } catch {
        setOptions([]);
      }
    }, 250);
  };

  const addIngredient = (p: Product) => {
    setIngredients((list) => {
      const existing = list.find((x) => x.product_id === p.id);
      if (existing) return list.map((x) => (x.product_id === p.id ? { ...x, grams: x.grams + 100 } : x));
      return [...list, { product_id: p.id, name: p.name, grams: 100, calories: p.calories, protein: p.protein, fat: p.fat, carbs: p.carbs }];
    });
  };

  const totals = useMemo(() => {
    let c = 0, pr = 0, f = 0, u = 0, g = 0;
    ingredients.forEach((i) => {
      const k = i.grams / 100;
      c += i.calories * k;
      pr += i.protein * k;
      f += i.fat * k;
      u += i.carbs * k;
      g += i.grams;
    });
    const per = g ? 100 / g : 0;
    return { c, pr, f, u, g, per };
  }, [ingredients]);

  const save = async () => {
    if (!name.trim()) return toast("Укажите название блюда", "error");
    if (ingredients.length === 0) return toast("Добавьте хотя бы один ингредиент", "error");
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        ingredients: ingredients.map((i) => ({ product_id: i.product_id, grams: i.grams })),
      };
      if (dish) await api.updateDish(dish.id, payload);
      else await api.createDish(payload);
      toast(dish ? "Рецепт обновлён" : "Рецепт создан");
      onSaved();
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка", "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!dish) return;
    setBusy(true);
    try {
      await api.deleteDish(dish.id);
      toast("Рецепт удалён");
      onSaved();
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 4, pt: 3 }}>
        <span>{isNew ? "Новый рецепт" : `Редактировать «${dish!.name}»`}</span>
        <IconButton aria-label="Закрыть" onClick={onClose} size="small">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 4 }}>
        <Stack spacing={3} sx={{ pt: 1.5 }}>
          <TextField label="Название блюда" placeholder="Например, Паста болоньезе" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField label="Описание (необязательно)" placeholder="Короткое описание" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth />

          <Autocomplete
            options={options}
            value={null}
            openOnFocus
            blurOnSelect
            clearOnBlur
            filterOptions={(x) => x}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            onInputChange={(_, v, reason) => reason === "input" && search(v)}
            onChange={(_, v) => v && addIngredient(v)}
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
            renderInput={(params) => <TextField {...params} label="Добавить ингредиент" placeholder="Найти продукт…" />}
          />

          <Divider />

          {ingredients.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Пока без ингредиентов
            </Typography>
          ) : (
            <List dense disablePadding>
              {ingredients.map((ing, i) => (
                <ListItem
                  key={ing.product_id}
                  sx={{ py: 1 }}
                  secondaryAction={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        type="number"
                        size="small"
                        value={ing.grams}
                        onChange={(e) => setIngredients((list) => list.map((x, j) => (j === i ? { ...x, grams: Number(e.target.value) || 0 } : x)))}
                        sx={{ width: 110 }}
                        InputProps={{ endAdornment: <InputAdornment position="end">г</InputAdornment> }}
                      />
                      <IconButton size="small" onClick={() => setIngredients((list) => list.filter((_, j) => j !== i))}>
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemText primary={ing.name} secondary={`${num(ing.calories)} ккал/100г`} />
                </ListItem>
              ))}
            </List>
          )}

          <Box sx={{ bgcolor: "background.default", borderRadius: 2, p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontWeight: 700 }}>
                {isNew ? "Итого блюдо" : "Итого"} ({num(totals.g)} г)
              </Typography>
              <Chip size="small" color="primary" label={`${num(totals.c)} ккал`} />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              На 100 г: {num(totals.c * totals.per)} ккал · Б {num(totals.pr * totals.per, 1)} · Ж {num(totals.f * totals.per, 1)} · У {num(totals.u * totals.per, 1)}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 4, py: 2.5, justifyContent: "space-between" }}>
        {isNew ? <Box /> : (
          <Button color="error" disabled={busy} onClick={remove}>
            Удалить
          </Button>
        )}
        <Box>
          <Button onClick={onClose} color="inherit">
            Отмена
          </Button>
          <Button variant="contained" onClick={save} disabled={busy} sx={{ ml: 1 }}>
            {isNew ? "Сохранить рецепт" : "Сохранить"}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

function RecipesContent() {
  const toast = useToast();
  const { meals } = useAuth();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [detail, setDetail] = useState<Dish | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Dish | null>(null);

  const load = useCallback(() => {
    api.searchDishes("").then(setDishes).catch(() => setDishes([]));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (d: Dish) => {
    setEditing(d);
    setEditorOpen(true);
  };

  const handleAddToDiet = async (slotId: number, amount: number) => {
    if (!detail) return;
    if (amount <= 0) return toast("Укажите количество", "error");
    try {
      await api.addEntry({ meal_slot_id: slotId, amount, dish_id: detail.id });
      // Списываем ингредиенты блюда из холодильника (по product_id или названию).
      if (detail.total_grams > 0) {
        const fridge = await api.fridgeItems().catch(() => []);
        const byId = new Map(fridge.filter((f) => f.product_id != null).map((f) => [f.product_id, f] as const));
        const byName = new Map(fridge.map((f) => [f.name.trim().toLowerCase(), f] as const));
        const scale = amount / detail.total_grams;
        await Promise.all(
          detail.ingredients.map((ing) => {
            const fi = byId.get(ing.product_id) ?? byName.get(ing.name.trim().toLowerCase());
            if (!fi || (fi.unit !== "g" && fi.unit !== "ml")) return null;
            const remaining = fi.quantity - Math.round(ing.grams * scale);
            return remaining <= 0 ? api.fridgeDelete(fi.id) : api.fridgeUpdate(fi.id, { quantity: remaining });
          }),
        );
      }
      const meal = meals.find((m) => m.id === slotId);
      toast(`«${detail.name}» добавлен в рацион: ${meal?.name ?? ""}`);
      setDetail(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка", "error");
    }
  };

  return (
    <Stack spacing={3.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h2" sx={{ fontWeight: 800 }}>
            Рецепты
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {dishes.length} блюд
          </Typography>
        </Box>
        <Button variant="contained" size="large" startIcon={<AddRoundedIcon />} onClick={openCreate}>
          Создать рецепт
        </Button>
      </Stack>

      {dishes.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              Рецептов пока нет — создайте первый.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3.5}>
          {dishes.map((d) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={d.id}>
              <RecipeCard dish={d} onClick={() => setDetail(d)} onEdit={() => openEdit(d)} />
            </Grid>
          ))}
        </Grid>
      )}

      <RecipeDetailDialog dish={detail} meals={meals} onClose={() => setDetail(null)} onAddToDiet={handleAddToDiet} />
      <RecipeEditorDialog open={editorOpen} dish={editing} onClose={() => setEditorOpen(false)} onSaved={load} />
    </Stack>
  );
}

export default function RecipesPage() {
  return (
    <DesignShell>
      <RecipesContent />
    </DesignShell>
  );
}
