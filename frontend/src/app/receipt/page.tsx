"use client";
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { num } from "@/lib/format";
import AppShell from "@/components/AppShell";
import type { Receipt } from "@/lib/types";

const DEMO =
  "МАГНИТ\nМолоко Простоквашино 930мл 89.90\nКуриное филе 0.8кг 279.50\n" +
  "Брокколи 400г 119.00\nХлеб бородинский 400г 45.90\nМыло Dove 100г 79.00\n" +
  "Салфетки влажные 15шт 59.90\nТворог 9% 200г 89.90\nБананы 1.2кг 119.40";

function ReceiptContent() {
  const toast = useToast();
  const [tab, setTab] = useState<"text" | "image">("text");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [accepted, setAccepted] = useState<Record<number, boolean>>({});

  const onScanned = (r: Receipt) => {
    setReceipt(r);
    const init: Record<number, boolean> = {};
    r.items.forEach((it) => (init[it.id] = it.is_food));
    setAccepted(init);
  };

  const scanText = async () => {
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
      const items = receipt.items.map((it) => ({ item_id: it.id, accepted: !!accepted[it.id] }));
      const added = await api.confirmReceipt(receipt.id, items);
      toast(`Добавлено в холодильник: ${added.length}`);
      setReceipt(null);
      setText("");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ошибка", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h2">Сканер чека</Typography>
        <Typography variant="body2" color="text.secondary">
          OCR + LLM выделят продукты, отбросят непродукты и предложат сроки годности
        </Typography>
      </Box>

      <Card sx={{ maxWidth: 640 }}>
        <CardContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Текст чека" value="text" />
            <Tab label="Фото чека" value="image" />
          </Tabs>

          {tab === "text" ? (
            <Stack spacing={2}>
              <TextField
                multiline
                minRows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Молоко 930мл 89.90&#10;Мыло 79.00 ..."
                fullWidth
              />
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={scanText} disabled={busy}>
                  Распознать
                </Button>
                <Button color="inherit" onClick={() => setText(DEMO)}>
                  Вставить пример
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Button component="label" variant="outlined" startIcon={<UploadFileRoundedIcon />} disabled={busy}>
              Загрузить фото чека
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && scanImage(e.target.files[0])}
              />
            </Button>
          )}
        </CardContent>
      </Card>

      {receipt && (
        <Card>
          <CardContent>
            <Typography variant="h4" sx={{ mb: 1 }}>
              Подтвердите продукты
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Отметьте, что добавить в холодильник. Непродукты сняты автоматически.
            </Typography>
            <Stack divider={<Divider flexItem />}>
              {receipt.items.map((it) => (
                <Stack key={it.id} direction="row" alignItems="center" spacing={1} sx={{ py: 1 }}>
                  <Checkbox
                    checked={!!accepted[it.id]}
                    onChange={(e) => setAccepted((a) => ({ ...a, [it.id]: e.target.checked }))}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }}>{it.parsed_name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {num(it.quantity)} {it.unit === "ml" ? "мл" : it.unit === "pcs" ? "шт" : "г"}
                      {it.price != null ? ` · ${num(it.price)} ₽` : ""}
                      {it.expiry_date ? ` · до ${it.expiry_date}` : ""}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    color={it.is_food ? "success" : "default"}
                    variant={it.is_food ? "filled" : "outlined"}
                    label={it.is_food ? it.category : "Не еда"}
                  />
                </Stack>
              ))}
            </Stack>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" onClick={confirm} disabled={busy}>
                Добавить выбранное в холодильник
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}

export default function ReceiptPage() {
  return (
    <AppShell>
      <ReceiptContent />
    </AppShell>
  );
}
