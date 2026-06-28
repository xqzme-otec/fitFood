"use client";
import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import KitchenRoundedIcon from "@mui/icons-material/KitchenRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import DesignShell from "@/components/DesignShell";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { num } from "@/lib/format";
import type { RecipeCard, RecipeDetail, RecipeMenu, RecipeQuery } from "@/lib/types";

const PAGE = 24;

const SORTS: [string, string][] = [
  ["relevance", "По умолчанию"],
  ["match", "Из холодильника (по совпадениям)"],
  ["calories_asc", "Калорийность ↑"],
  ["calories_desc", "Калорийность ↓"],
  ["time_asc", "Время приготовления ↑"],
];

interface Filters {
  q: string;
  sort: string;
  timeMax: string;
  calMin: string;
  calMax: string;
  proteinMin: string;
  proteinMax: string;
  fatMin: string;
  fatMax: string;
  carbsMin: string;
  carbsMax: string;
}

const EMPTY_FILTERS: Filters = {
  q: "",
  sort: "relevance",
  timeMax: "",
  calMin: "",
  calMax: "",
  proteinMin: "",
  proteinMax: "",
  fatMin: "",
  fatMax: "",
  carbsMin: "",
  carbsMax: "",
};

const numOrU = (s: string): number | undefined => (s.trim() === "" ? undefined : Number(s));

function MacroChips({ r, size = "small" }: { r: RecipeCard; size?: "small" | "medium" }) {
  return (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
      <Chip
        size={size}
        icon={<LocalFireDepartmentRoundedIcon />}
        label={`${num(r.calories)} ккал`}
        color="error"
        variant="outlined"
      />
      <Chip size={size} label={`Б ${num(r.protein)}`} variant="outlined" />
      <Chip size={size} label={`Ж ${num(r.fat)}`} variant="outlined" />
      <Chip size={size} label={`У ${num(r.carbs)}`} variant="outlined" />
    </Stack>
  );
}

function RecipePhoto({ url, height }: { url: string; height: number }) {
  const [broken, setBroken] = useState(false);
  if (!url || broken) {
    return (
      <Box
        sx={{
          height,
          display: "grid",
          placeItems: "center",
          bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
          color: "text.disabled",
        }}
      >
        <RestaurantMenuRoundedIcon sx={{ fontSize: 40 }} />
      </Box>
    );
  }
  return (
    <CardMedia
      component="img"
      image={url}
      alt=""
      height={height}
      loading="lazy"
      onError={() => setBroken(true)}
      sx={{ objectFit: "cover" }}
    />
  );
}

function Tile({ r, onOpen }: { r: RecipeCard; onOpen: () => void }) {
  const meta = [
    r.cook_time_min ? `${num(r.cook_time_min)} мин` : "",
    r.servings ? `${num(r.servings)} порц.` : "",
    r.cuisine,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <Card
      sx={{
        height: "100%",
        position: "relative",
        transition: "box-shadow .15s, transform .15s",
        "&:hover": { boxShadow: "0 8px 22px rgba(27,42,30,0.12)", transform: "translateY(-2px)" },
      }}
    >
      {r.match_count > 0 && (
        <Chip
          size="small"
          icon={<KitchenRoundedIcon />}
          label={`${r.match_count}/${r.total_ingredients}`}
          color="success"
          sx={{ position: "absolute", top: 10, left: 10, zIndex: 2, fontWeight: 700 }}
        />
      )}
      <CardActionArea onClick={onOpen} sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}>
        <RecipePhoto url={r.photo_url} height={168} />
        <CardContent sx={{ width: "100%" }}>
          <Typography sx={{ fontWeight: 700, lineHeight: 1.25, mb: 0.5, minHeight: 40 }}>
            {r.name}
          </Typography>
          {meta && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              {meta}
            </Typography>
          )}
          <MacroChips r={r} />
          <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.75 }}>
            КБЖУ на 100 г
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function DetailDialog({ id, onClose }: { id: number | null; onClose: () => void }) {
  const toast = useToast();
  const [data, setData] = useState<RecipeDetail | null>(null);

  useEffect(() => {
    if (id == null) {
      setData(null);
      return;
    }
    let active = true;
    api
      .recipe(id)
      .then((d) => active && setData(d))
      .catch((e) => toast(e instanceof Error ? e.message : "Ошибка", "error"));
    return () => {
      active = false;
    };
  }, [id, toast]);

  const steps = (data?.method_text || "")
    .split(/\n+/)
    .map((s) => s.trim().replace(/^\d+\.\s*/, ""))
    .filter(Boolean);

  return (
    <Dialog open={id != null} onClose={onClose} fullWidth maxWidth="sm">
      {!data ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <DialogTitle sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, pr: 1 }}>
            <Box sx={{ flex: 1, fontWeight: 800 }}>{data.name}</Box>
            <IconButton onClick={onClose} size="small" aria-label="Закрыть">
              <CloseRoundedIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <RecipePhoto url={data.photo_url} height={240} />
            <Box sx={{ my: 2 }}>
              <MacroChips r={data} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                {[
                  data.cook_time_min ? `Готовка: ${num(data.cook_time_min)} мин` : "",
                  data.prep_time_min ? `Подготовка: ${num(data.prep_time_min)} мин` : "",
                  data.servings ? `Порций: ${num(data.servings)}` : "",
                  data.cuisine ? `Кухня: ${data.cuisine}` : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Typography>
            </Box>

            <Divider textAlign="left" sx={{ mb: 1 }}>
              <Typography variant="subtitle2">Ингредиенты</Typography>
            </Divider>
            <List dense disablePadding>
              {data.ingredients.map((ing, i) => (
                <ListItem
                  key={i}
                  disableGutters
                  secondaryAction={
                    ing.available ? <Chip size="small" label="есть" color="success" /> : null
                  }
                >
                  <ListItemText primary={ing.text} />
                </ListItem>
              ))}
            </List>

            {steps.length > 0 && (
              <>
                <Divider textAlign="left" sx={{ mt: 2, mb: 1 }}>
                  <Typography variant="subtitle2">Приготовление</Typography>
                </Divider>
                <Box component="ol" sx={{ pl: 2.5, m: 0, "& li": { mb: 1, lineHeight: 1.5 } }}>
                  {steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </Box>
              </>
            )}

            {data.source_url && (
              <Box sx={{ mt: 2 }}>
                <Link href={data.source_url} target="_blank" rel="noopener">
                  Источник: food.ru
                </Link>
              </Box>
            )}
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}

function CatalogContent() {
  const toast = useToast();
  const [menus, setMenus] = useState<RecipeMenu[]>([]);
  const [menu, setMenu] = useState<string>("");
  const [f, setF] = useState<Filters>(EMPTY_FILTERS);
  const [items, setItems] = useState<RecipeCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<number | null>(null);

  useEffect(() => {
    api
      .recipeMenus()
      .then((m) => {
        setMenus(m);
        if (m.length) setMenu((cur) => cur || m[0].key);
      })
      .catch((e) => toast(e instanceof Error ? e.message : "Ошибка", "error"));
  }, [toast]);

  const buildQuery = useCallback(
    (offset: number): RecipeQuery => ({
      menu,
      sort: f.sort,
      q: f.q.trim() || undefined,
      time_max: numOrU(f.timeMax),
      cal_min: numOrU(f.calMin),
      cal_max: numOrU(f.calMax),
      protein_min: numOrU(f.proteinMin),
      protein_max: numOrU(f.proteinMax),
      fat_min: numOrU(f.fatMin),
      fat_max: numOrU(f.fatMax),
      carbs_min: numOrU(f.carbsMin),
      carbs_max: numOrU(f.carbsMax),
      limit: PAGE,
      offset,
    }),
    [menu, f],
  );

  // Загрузка/перезагрузка сетки (reset=true — с нуля; иначе догрузка).
  const load = useCallback(
    async (reset: boolean, currentCount = 0) => {
      if (!menu) return;
      setLoading(true);
      try {
        const data = await api.recipes(buildQuery(reset ? 0 : currentCount));
        setTotal(data.total);
        setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
      } catch (e) {
        toast(e instanceof Error ? e.message : "Ошибка", "error");
      } finally {
        setLoading(false);
      }
    },
    [menu, buildQuery, toast],
  );

  // При смене меню — перезагрузка с применёнными фильтрами.
  useEffect(() => {
    if (menu) load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu]);

  const apply = () => load(true);
  const reset = () => {
    setF(EMPTY_FILTERS);
    // Перезагрузка произойдёт после применения нового состояния.
    setTimeout(() => load(true), 0);
  };

  const set = (k: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const rangeField = (label: string, minKey: keyof Filters, maxKey: keyof Filters) => (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <TextField size="small" type="number" placeholder="от" value={f[minKey]} onChange={set(minKey)} />
        <Typography color="text.disabled">–</Typography>
        <TextField size="small" type="number" placeholder="до" value={f[maxKey]} onChange={set(maxKey)} />
      </Stack>
    </Stack>
  );

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h2" sx={{ fontWeight: 800 }}>
          Рецепты
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Каталог блюд с фото — выберите меню и подберите по КБЖУ, времени и холодильнику
        </Typography>
      </Box>

      {/* Вкладки-меню */}
      <Tabs
        value={menu || false}
        onChange={(_, v) => setMenu(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        {menus.map((m) => (
          <Tab key={m.key} value={m.key} label={`${m.label} (${m.count})`} />
        ))}
      </Tabs>

      {/* Панель фильтров */}
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 5 }}>
              <TextField
                fullWidth
                size="small"
                label="Поиск по названию"
                placeholder="Например, омлет"
                value={f.q}
                onChange={set("q")}
                onKeyDown={(e) => e.key === "Enter" && apply()}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth size="small" select label="Сортировка" value={f.sort} onChange={set("sort")}>
                {SORTS.map(([v, l]) => (
                  <MenuItem key={v} value={v}>
                    {l}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Время готовки ≤, мин"
                placeholder="любое"
                value={f.timeMax}
                onChange={set("timeMax")}
              />
            </Grid>

            <Grid size={{ xs: 6, md: 3 }}>{rangeField("Калории / 100 г", "calMin", "calMax")}</Grid>
            <Grid size={{ xs: 6, md: 3 }}>{rangeField("Белки", "proteinMin", "proteinMax")}</Grid>
            <Grid size={{ xs: 6, md: 3 }}>{rangeField("Жиры", "fatMin", "fatMax")}</Grid>
            <Grid size={{ xs: 6, md: 3 }}>{rangeField("Углеводы", "carbsMin", "carbsMax")}</Grid>
          </Grid>

          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
            <Button variant="contained" onClick={apply}>
              Применить
            </Button>
            <Button variant="text" color="inherit" onClick={reset}>
              Сбросить
            </Button>
            <Box sx={{ flex: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Найдено: {num(total)}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Сетка рецептов */}
      {loading && items.length === 0 ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              Под фильтры ничего не нашлось — измените параметры.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Grid container spacing={3}>
            {items.map((r) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={r.id}>
                <Tile r={r} onOpen={() => setDetailId(r.id)} />
              </Grid>
            ))}
          </Grid>
          {items.length < total && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
              <Button variant="outlined" disabled={loading} onClick={() => load(false, items.length)}>
                {loading ? "Загрузка…" : `Показать ещё (${num(total - items.length)})`}
              </Button>
            </Box>
          )}
        </>
      )}

      <DetailDialog id={detailId} onClose={() => setDetailId(null)} />
    </Stack>
  );
}

export default function CatalogPage() {
  return (
    <DesignShell>
      <CatalogContent />
    </DesignShell>
  );
}
