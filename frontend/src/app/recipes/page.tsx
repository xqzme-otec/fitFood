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
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { num } from "@/lib/format";
import AppShell from "@/components/AppShell";
import type { Dish, FridgeItem, Product } from "@/lib/types";

interface EditorIngredient {
  product_id: number;
  name: string;
  grams: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

function DishEditorDialog({
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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<EditorIngredient[]>([]);
  const [options, setOptions] = useState<Product[]>([]);
  const [fridge, setFridge] = useState<FridgeItem[]>([]);
  const [busy, setBusy] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    setOptions([]);
    api.fridgeItems().then(setFridge).catch(() => setFridge([]));
    if (dish) {
      setName(dish.name);
      setDescription(dish.description || "");
      // Подтягиваем КБЖУ каждого ингредиента для подсчёта итогов.
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

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{dish ? "Редактировать рецепт" : "Новый рецепт"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Название блюда" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField label="Описание (необязательно)" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth />
          <Autocomplete
            options={options}
            value={null}
            blurOnSelect
            clearOnBlur
            filterOptions={(x) => x}
            getOptionLabel={(o) => o.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            onInputChange={(_, v) => search(v)}
            onChange={(_, v) => v && addIngredient(v)}
            noOptionsText="Начните вводить название"
            renderOption={(props, o) => {
              const fi = fridgeByProduct.get(o.id);
              return (
                <Box component="li" {...props} key={o.id}>
                  <Stack direction="row" justifyContent="space-between" sx={{ width: "100%" }}>
                    <span>{o.name}</span>
                    {fi ? (
                      <Typography variant="caption" sx={{ color: "success.main", fontWeight: 700 }}>
                        имеется
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
            renderInput={(params) => <TextField {...params} label="Добавить ингредиент" />}
          />

          {ingredients.length > 0 && (
            <List dense disablePadding>
              {ingredients.map((ing, i) => (
                <ListItem
                  key={ing.product_id}
                  secondaryAction={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        type="number"
                        size="small"
                        value={ing.grams}
                        onChange={(e) =>
                          setIngredients((list) =>
                            list.map((x, j) => (j === i ? { ...x, grams: Number(e.target.value) || 0 } : x)),
                          )
                        }
                        sx={{ width: 90 }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => setIngredients((list) => list.filter((_, j) => j !== i))}
                      >
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

          <Box sx={{ bgcolor: "background.default", borderRadius: 2, p: 1.5 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ fontWeight: 700 }}>Итого ({num(totals.g)} г)</Typography>
              <Chip size="small" color="primary" label={`${num(totals.c)} ккал`} />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              На 100 г: {num(totals.c * totals.per)} ккал · Б {num(totals.pr * totals.per, 1)} · Ж{" "}
              {num(totals.f * totals.per, 1)} · У {num(totals.u * totals.per, 1)}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Отмена
        </Button>
        <Button onClick={save} variant="contained" disabled={busy}>
          {dish ? "Сохранить" : "Создать рецепт"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DishDetailDialog({
  dish,
  onClose,
  onEdit,
  onDelete,
}: {
  dish: Dish | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const per = dish?.per_100g ?? {};
  return (
    <Dialog open={!!dish} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{dish?.name}</DialogTitle>
      <DialogContent>
        {dish?.description && (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {dish.description}
          </Typography>
        )}
        <Box sx={{ bgcolor: "background.default", borderRadius: 2, p: 1.5, mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography sx={{ fontWeight: 700 }}>На 100 г</Typography>
            <Chip size="small" color="primary" label={`${num(per.calories || 0)} ккал`} />
          </Stack>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            <Chip size="small" variant="outlined" label={`Б ${num(per.protein || 0)}`} />
            <Chip size="small" variant="outlined" label={`Ж ${num(per.fat || 0)}`} />
            <Chip size="small" variant="outlined" label={`У ${num(per.carbs || 0)}`} />
            <Chip size="small" variant="outlined" label={`${num(dish?.total_grams || 0)} г всего`} />
          </Stack>
        </Box>
        <Typography variant="overline" color="text.secondary">
          Ингредиенты
        </Typography>
        <List dense>
          {(dish?.ingredients ?? []).map((ing) => (
            <ListItem key={ing.product_id} disableGutters secondaryAction={<span>{num(ing.grams)} г</span>}>
              <ListItemText primary={ing.name} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={onDelete}>
          Удалить
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button color="inherit" onClick={onClose}>
          Закрыть
        </Button>
        <Button variant="contained" startIcon={<EditRoundedIcon />} onClick={onEdit}>
          Изменить
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function RecipesContent() {
  const toast = useToast();
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
    setDetail(null);
    setEditing(d);
    setEditorOpen(true);
  };
  const remove = async (d: Dish) => {
    try {
      await api.deleteDish(d.id);
      toast("Рецепт удалён");
      setDetail(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка", "error");
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h2">Мои рецепты</Typography>
          <Typography variant="body2" color="text.secondary">
            {dishes.length} блюд
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
          Создать рецепт
        </Button>
      </Stack>

      {dishes.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
              Рецептов пока нет — создайте первый.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {dishes.map((d) => {
            const per = d.per_100g || {};
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={d.id}>
                <Card>
                  <CardActionArea onClick={() => setDetail(d)} sx={{ height: "100%" }}>
                    <CardContent>
                      <Typography variant="h4" gutterBottom>
                        {d.name}
                      </Typography>
                      <Typography variant="h3" color="primary">
                        {num(per.calories || 0)}{" "}
                        <Box component="span" sx={{ fontSize: 14, color: "text.secondary" }}>
                          ккал/100г
                        </Box>
                      </Typography>
                      <Stack direction="row" spacing={0.5} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
                        <Chip size="small" variant="outlined" label={`Б ${num(per.protein || 0)}`} />
                        <Chip size="small" variant="outlined" label={`Ж ${num(per.fat || 0)}`} />
                        <Chip size="small" variant="outlined" label={`У ${num(per.carbs || 0)}`} />
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <DishDetailDialog
        dish={detail}
        onClose={() => setDetail(null)}
        onEdit={() => detail && openEdit(detail)}
        onDelete={() => detail && remove(detail)}
      />
      <DishEditorDialog
        open={editorOpen}
        dish={editing}
        onClose={() => setEditorOpen(false)}
        onSaved={load}
      />
    </Stack>
  );
}

export default function RecipesPage() {
  return (
    <AppShell>
      <RecipesContent />
    </AppShell>
  );
}
