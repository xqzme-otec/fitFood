"use client";
import { useEffect, useState } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { GOAL_LABELS, num } from "@/lib/format";
import { getUserPrefs, setUserPrefs } from "@/lib/userPrefs";
import DesignShell from "@/components/DesignShell";
import type { WeightRecord } from "@/lib/types";

function ProfileContent() {
  const { profile, targets, meals, reloadTargets, user } = useAuth();
  const toast = useToast();
  const [accName, setAccName] = useState("");
  const [accPhoto, setAccPhoto] = useState<string | undefined>(undefined);

  useEffect(() => {
    const p = getUserPrefs();
    setAccName(p.name ?? "");
    setAccPhoto(p.photo);
  }, []);

  const onPhotoFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setAccPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveAccount = () => {
    setUserPrefs({ name: accName.trim() || undefined, photo: accPhoto });
    toast("Профиль обновлён");
  };
  const [weight, setWeight] = useState("");
  const [calories, setCalories] = useState("");
  const [macros, setMacros] = useState({ protein_g: "", fat_g: "", carb_g: "" });
  const [history, setHistory] = useState<WeightRecord[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) setWeight(String(profile.weight_kg));
  }, [profile]);
  useEffect(() => {
    if (targets) {
      setCalories(String(Math.round(targets.calories)));
      setMacros({
        protein_g: String(Math.round(targets.protein_g)),
        fat_g: String(Math.round(targets.fat_g)),
        carb_g: String(Math.round(targets.carb_g)),
      });
    }
  }, [targets]);
  useEffect(() => {
    api.weightHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  const reloadHistory = () => api.weightHistory().then(setHistory).catch(() => {});

  const saveWeight = async () => {
    setBusy(true);
    try {
      await api.updateWeight(Number(weight));
      await reloadTargets();
      await reloadHistory();
      toast("Вес обновлён, норма пересчитана");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка", "error");
    } finally {
      setBusy(false);
    }
  };

  const saveCalories = async () => {
    setBusy(true);
    try {
      await api.overrideCalories(Number(calories));
      await reloadTargets();
      toast("Лимит калорий обновлён, БЖУ пересчитаны");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка", "error");
    } finally {
      setBusy(false);
    }
  };

  const saveMacros = async () => {
    setBusy(true);
    try {
      await api.overrideMacros({
        protein_g: Number(macros.protein_g),
        fat_g: Number(macros.fat_g),
        carb_g: Number(macros.carb_g),
      });
      await reloadTargets();
      toast("БЖУ обновлены");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка", "error");
    } finally {
      setBusy(false);
    }
  };

  if (!profile || !targets) return null;

  return (
    <Stack spacing={3}>
      <Typography variant="h2">Профиль</Typography>

      <Grid container spacing={3}>
        {/* Аккаунт: имя и фото (косметика, хранится локально) */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h4" sx={{ mb: 2 }}>
                Аккаунт
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ xs: "flex-start", sm: "center" }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar src={accPhoto} sx={{ width: 72, height: 72, bgcolor: "secondary.main", fontSize: 28 }}>
                    {(accName || user?.email || "?").slice(0, 1).toUpperCase()}
                  </Avatar>
                  <Stack spacing={1}>
                    <Button component="label" variant="outlined" size="small">
                      Загрузить фото
                      <input hidden type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onPhotoFile(e.target.files[0])} />
                    </Button>
                    {accPhoto && (
                      <Button size="small" color="inherit" onClick={() => setAccPhoto(undefined)}>
                        Убрать фото
                      </Button>
                    )}
                  </Stack>
                </Stack>
                <TextField label="Имя пользователя" value={accName} onChange={(e) => setAccName(e.target.value)} sx={{ flex: 1, minWidth: 220 }} />
                <Button variant="contained" onClick={saveAccount}>
                  Сохранить
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                Email: {user?.email}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Норма КБЖУ */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h4" sx={{ mb: 2 }}>
                Суточная норма
              </Typography>
              <Typography variant="h1" color="primary">
                {num(targets.calories)}{" "}
                <Box component="span" sx={{ fontSize: 16, color: "text.secondary" }}>
                  ккал
                </Box>
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                <Chip label={`Белки ${num(targets.protein_g)} г`} color="primary" variant="outlined" />
                <Chip label={`Жиры ${num(targets.fat_g)} г`} color="warning" variant="outlined" />
                <Chip label={`Углеводы ${num(targets.carb_g)} г`} color="info" variant="outlined" />
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Typography variant="body2" color="text.secondary">
                  BMR: <b>{num(targets.bmr)}</b>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  TDEE: <b>{num(targets.tdee)}</b>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Цель: <b>{GOAL_LABELS[profile.goal]}</b>
                </Typography>
                {targets.is_manual && <Chip size="small" label="Ручная настройка" />}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Анкета + вес */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h4" sx={{ mb: 2 }}>
                Данные тела
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Пол: <b>{profile.sex === "male" ? "М" : "Ж"}</b>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Возраст: <b>{profile.age}</b>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Рост: <b>{num(profile.height_cm)} см</b>
                </Typography>
              </Stack>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField label="Текущий вес, кг" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
                <Button variant="contained" onClick={saveWeight} disabled={busy}>
                  Сохранить
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Ручная корректировка */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h4" sx={{ mb: 2 }}>
                Ручная корректировка
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <TextField label="Лимит калорий" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} />
                <Button variant="outlined" onClick={saveCalories} disabled={busy}>
                  Применить
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                БЖУ пересчитаются пропорционально с сохранением соотношения.
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
                <TextField label="Белки, г" type="number" value={macros.protein_g} onChange={(e) => setMacros((m) => ({ ...m, protein_g: e.target.value }))} />
                <TextField label="Жиры, г" type="number" value={macros.fat_g} onChange={(e) => setMacros((m) => ({ ...m, fat_g: e.target.value }))} />
                <TextField label="Углеводы, г" type="number" value={macros.carb_g} onChange={(e) => setMacros((m) => ({ ...m, carb_g: e.target.value }))} />
              </Stack>
              <Button variant="outlined" onClick={saveMacros} disabled={busy}>
                Применить БЖУ
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Приёмы пищи */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h4" sx={{ mb: 2 }}>
                Приёмы пищи
              </Typography>
              <Stack divider={<Divider flexItem />}>
                {meals.map((m) => (
                  <Stack key={m.id} direction="row" justifyContent="space-between" sx={{ py: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>{m.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {num(m.calorie_limit)} ккал · Б {num(m.protein_limit)} Ж {num(m.fat_limit)} У {num(m.carb_limit)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* История веса */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h4" sx={{ mb: 2 }}>
                История веса
              </Typography>
              {history.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Пока нет записей.
                </Typography>
              ) : (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {history.map((h, i) => (
                    <Chip
                      key={i}
                      label={`${num(h.weight_kg, 1)} кг · ${new Date(h.recorded_at).toLocaleDateString("ru-RU")}`}
                      variant="outlined"
                    />
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

export default function ProfilePage() {
  return (
    <DesignShell>
      <ProfileContent />
    </DesignShell>
  );
}
