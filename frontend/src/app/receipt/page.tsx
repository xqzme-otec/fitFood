"use client";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import DocumentScannerRoundedIcon from "@mui/icons-material/DocumentScannerRounded";
import DesignShell from "@/components/DesignShell";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { FRIDGE_CATEGORIES, num } from "@/lib/format";
import type { Receipt } from "@/lib/types";

const DEMO_TEXT =
  "МАГНИТ\nМолоко Простоквашино 930мл 89.90\nКуриное филе 0.8кг 279.50\n" +
  "Брокколи 400г 119.00\nХлеб бородинский 400г 45.90\nМыло Dove 100г 79.00\n" +
  "Салфетки влажные 15шт 59.90\nТворог 9% 200г 89.90\nБананы 1.2кг 119.40";

const unitLabel = (u: string) => (u === "ml" ? "мл" : u === "pcs" ? "шт" : "г");

// Маркер «не еда» — совпадает с DROPPED_CATEGORY на бэкенде (app/services/receipt.py).
const DROPPED = "Отброшено (не еда)";

function UploadCard({
  busy,
  onScanText,
  onScanImage,
}: {
  busy: boolean;
  onScanText: (text: string) => void;
  onScanImage: (file: File) => void;
}) {
  const [tab, setTab] = useState<"text" | "image">("text");
  const [text, setText] = useState("");

  return (
    <Card sx={{ maxWidth: 680 }}>
      <CardContent sx={{ p: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2.5 }}>
          <Tab label="Текст чека" value="text" />
          <Tab label="Фото чека" value="image" />
        </Tabs>

        {tab === "text" ? (
          <Stack spacing={2}>
            <TextField
              multiline
              minRows={7}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Молоко 930мл 89.90&#10;Мыло 79.00 ..."
              fullWidth
            />
            <Stack direction="row" spacing={1.5}>
              <Button variant="contained" size="large" startIcon={<DocumentScannerRoundedIcon />} disabled={busy} onClick={() => onScanText(text)}>
                Распознать
              </Button>
              <Button color="inherit" onClick={() => setText(DEMO_TEXT)}>
                Вставить пример
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={2} alignItems="flex-start">
            <Box
              sx={{
                width: "100%",
                border: "2px dashed",
                borderColor: "divider",
                borderRadius: 3,
                py: 5,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                color: "text.secondary",
              }}
            >
              <UploadFileRoundedIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="body2">Перетащите фото чека сюда или выберите файл</Typography>
            </Box>
            <Button component="label" variant="contained" size="large" startIcon={<UploadFileRoundedIcon />} disabled={busy}>
              Загрузить фото чека
              <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onScanImage(e.target.files[0])} />
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function ReceiptContent() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [accepted, setAccepted] = useState<Record<number, boolean>>({});
  // Категория, выбранная пользователем (если ML определил неправильно).
  const [categories, setCategories] = useState<Record<number, string>>({});

  const onScanned = (r: Receipt) => {
    setReceipt(r);
    const initAcc: Record<number, boolean> = {};
    const initCat: Record<number, string> = {};
    r.items.forEach((it) => {
      initAcc[it.id] = it.is_food;
      initCat[it.id] = it.category;
    });
    setAccepted(initAcc);
    setCategories(initCat);
  };

  const scanText = async (text: string) => {
    if (!text.trim()) return toast("Вставьте текст чека", "error");
    setBusy(true);
    try {
      onScanned(await api.scanReceiptText(text));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка", "error");
    } finally {
      setBusy(false);
    }
  };

  const scanImage = async (file: File) => {
    setBusy(true);
    try {
      onScanned(await api.scanReceiptImage(file));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка", "error");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!receipt) return;
    setBusy(true);
    try {
      const items = receipt.items.map((it) => ({
        item_id: it.id,
        accepted: !!accepted[it.id],
        category: categories[it.id] ?? it.category,
      }));
      const added = await api.confirmReceipt(receipt.id, items);
      toast(`Добавлено в холодильник: ${added.length}`);
      setReceipt(null);
      setAccepted({});
      setCategories({});
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка", "error");
    } finally {
      setBusy(false);
    }
  };

  // Смена категории. Перевод «Отброшено» -> реальная категория автоматически
  // включает галочку (продукт спасён), и наоборот.
  const changeCategory = (id: number, value: string) => {
    const was = categories[id];
    setCategories((c) => ({ ...c, [id]: value }));
    if (value === DROPPED) setAccepted((a) => ({ ...a, [id]: false }));
    else if (was === DROPPED) setAccepted((a) => ({ ...a, [id]: true }));
  };

  const catOf = (it: Receipt["items"][number]) => categories[it.id] ?? it.category;
  const foodCount = receipt?.items.filter((i) => catOf(i) !== DROPPED).length ?? 0;
  const droppedCount = receipt?.items.filter((i) => catOf(i) === DROPPED).length ?? 0;
  const selectedCount = receipt?.items.filter((i) => accepted[i.id] && catOf(i) !== DROPPED).length ?? 0;

  return (
    <Stack spacing={3.5}>
      <Box>
        <Typography variant="h2" sx={{ fontWeight: 800 }}>
          Сканер чека
        </Typography>
        <Typography variant="body1" color="text.secondary">
          OCR + LLM выделят продукты, отбросят непродукты и предложат сроки годности
        </Typography>
      </Box>

      <UploadCard busy={busy} onScanText={scanText} onScanImage={scanImage} />

      {receipt && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 0.5 }}>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Подтвердите продукты
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip size="small" color="success" label={`Продукты: ${foodCount}`} />
                <Chip size="small" variant="outlined" label={`Отброшено: ${droppedCount}`} />
              </Stack>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Непродукты сняты автоматически. Поправьте категорию у любой позиции — в том числе
              верните отброшенное в холодильник, выбрав ему категорию. Отметьте, что добавить.
            </Typography>

            <Stack divider={<Divider flexItem />}>
              {receipt.items.map((it) => {
                const cat = catOf(it);
                const dropped = cat === DROPPED;
                // Опции: «Отброшено» + все категории (+ исходная, если она вне списка).
                const options = [DROPPED, ...FRIDGE_CATEGORIES];
                if (!options.includes(it.category)) options.splice(1, 0, it.category);
                return (
                  <Stack key={it.id} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.5, opacity: dropped ? 0.6 : 1 }}>
                    <Checkbox checked={!!accepted[it.id]} onChange={(e) => setAccepted((a) => ({ ...a, [it.id]: e.target.checked }))} />
                    <Box sx={{ display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: "50%", bgcolor: alpha("#2E7D32", 0.08), fontSize: 22, flex: "none" }}>
                      {it.emoji}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, textDecoration: dropped ? "line-through" : "none" }} noWrap>
                        {it.parsed_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {num(it.quantity)} {unitLabel(it.unit)}
                        {it.price != null ? ` · ${num(it.price)} ₽` : ""}
                        {!dropped && it.expiry_date ? ` · до ${it.expiry_date}` : ""}
                      </Typography>
                    </Box>
                    <TextField
                      select
                      size="small"
                      label="Категория"
                      value={cat}
                      onChange={(e) => changeCategory(it.id, e.target.value)}
                      sx={{ minWidth: 188, flex: "none" }}
                    >
                      {options.map((c) => (
                        <MenuItem key={c} value={c}>
                          {c === DROPPED ? "Отброшено (не еда)" : c}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>
                );
              })}
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
              <Button variant="contained" size="large" onClick={confirm} disabled={busy || selectedCount === 0}>
                Добавить выбранное ({selectedCount})
              </Button>
              <Button color="inherit" onClick={() => setReceipt(null)}>
                Отмена
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}

export default function ReceiptPage() {
  return (
    <DesignShell>
      <ReceiptContent />
    </DesignShell>
  );
}
