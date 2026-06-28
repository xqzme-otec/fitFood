"use client";
import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import DocumentScannerRoundedIcon from "@mui/icons-material/DocumentScannerRounded";
import QrCodeScannerRoundedIcon from "@mui/icons-material/QrCodeScannerRounded";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import DesignShell from "@/components/DesignShell";
import CameraScanner from "@/components/CameraScanner";
import { api } from "@/lib/api";
import { decodeQrFromFile } from "@/lib/qr";
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

// Ключи действий — чтобы показывать прогресс именно на нажатой кнопке.
type Action = "text" | "qr-file" | "qr-text" | "confirm" | null;

/** Текст этапа с «живой» анимированной троеточием — пользователь видит процесс. */
function AnimatedStage({ text }: { text: string }) {
  return (
    <Box
      component="span"
      sx={{
        "@keyframes fitfoodBlink": { "0%,80%,100%": { opacity: 0.2 }, "40%": { opacity: 1 } },
        "& .dot": { animation: "fitfoodBlink 1.4s infinite both" },
        "& .dot:nth-of-type(2)": { animationDelay: "0.2s" },
        "& .dot:nth-of-type(3)": { animationDelay: "0.4s" },
      }}
    >
      {text}
      <span className="dot">.</span>
      <span className="dot">.</span>
      <span className="dot">.</span>
    </Box>
  );
}

function UploadCard({
  busy,
  stage,
  action,
  onScanText,
  onScanQr,
  onScanQrImage,
}: {
  busy: boolean;
  stage: string | null;
  action: Action;
  onScanText: (text: string) => void;
  onScanQr: (qrraw: string) => void;
  onScanQrImage: (file: File) => void;
}) {
  const [tab, setTab] = useState<"text" | "qr">("text");
  const [text, setText] = useState("");
  const [qr, setQr] = useState("");
  const [camOpen, setCamOpen] = useState(false);

  // Контент/иконка кнопки в зависимости от того, идёт ли её действие.
  const label = (key: Action, fallback: ReactNode) =>
    action === key && stage ? <AnimatedStage text={stage} /> : fallback;
  const icon = (key: Action, normal: ReactNode) =>
    action === key ? <CircularProgress size={18} color="inherit" /> : normal;

  return (
    <Card sx={{ maxWidth: 680 }}>
      <CardContent sx={{ p: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2.5 }}>
          <Tab label="Текст чека" value="text" />
          <Tab label="QR-код" value="qr" />
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
              <Button variant="contained" size="large" startIcon={icon("text", <DocumentScannerRoundedIcon />)} disabled={busy} onClick={() => onScanText(text)}>
                {label("text", "Распознать")}
              </Button>
              <Button color="inherit" disabled={busy} onClick={() => setText(DEMO_TEXT)}>
                Вставить пример
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={2} alignItems="stretch">
            <Typography variant="body2" color="text.secondary">
              Отсканируйте QR-код чека камерой или загрузите фото — получим реальный
              состав покупки из базы ФНС. Можно вставить строку QR вручную.
            </Typography>

            {camOpen ? (
              <CameraScanner
                onDetected={(qrraw) => {
                  setCamOpen(false);
                  onScanQr(qrraw);
                }}
                onClose={() => setCamOpen(false)}
              />
            ) : (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<CameraAltRoundedIcon />}
                  disabled={busy}
                  onClick={() => setCamOpen(true)}
                >
                  Сканировать камерой
                </Button>
                <Button component="label" variant="outlined" size="large" fullWidth startIcon={icon("qr-file", <QrCodeScannerRoundedIcon />)} disabled={busy}>
                  {label("qr-file", "Загрузить фото QR")}
                  <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onScanQrImage(e.target.files[0])} />
                </Button>
              </Stack>
            )}

            <Divider flexItem>или вставьте строку</Divider>
            <TextField
              value={qr}
              onChange={(e) => setQr(e.target.value)}
              placeholder="t=20230101T1200&s=703.10&fn=...&i=...&fp=...&n=1"
              fullWidth
              disabled={busy}
            />
            <Button variant="text" startIcon={icon("qr-text", <DocumentScannerRoundedIcon />)} disabled={busy} onClick={() => onScanQr(qr)} sx={{ alignSelf: "flex-start" }}>
              {label("qr-text", "Получить чек по строке")}
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function ReceiptContent() {
  const toast = useToast();
  const [stage, setStage] = useState<string | null>(null);
  const [action, setAction] = useState<Action>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [accepted, setAccepted] = useState<Record<number, boolean>>({});
  // Категория, выбранная пользователем (если ML определил неправильно).
  const [categories, setCategories] = useState<Record<number, string>>({});

  const busy = stage !== null;

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

  // Прогоняет задачу, последовательно показывая этапы на кнопке (с анимацией).
  // Этапы продвигаются по таймеру, пока ждём ответ — пользователь видит процесс.
  const runStaged = async <T,>(act: Action, stages: string[], task: () => Promise<T>) => {
    setAction(act);
    setStage(stages[0]);
    const timers = stages.slice(1).map((s, i) => window.setTimeout(() => setStage(s), (i + 1) * 1100));
    try {
      return await task();
    } finally {
      timers.forEach(clearTimeout);
      setStage(null);
      setAction(null);
    }
  };

  const fail = (e: unknown) => toast(e instanceof Error ? e.message : "Ошибка", "error");

  const scanText = (text: string) => {
    if (!text.trim()) return toast("Вставьте текст чека", "error");
    runStaged("text", ["Распознаю продукты", "Чищу названия"], async () => onScanned(await api.scanReceiptText(text))).catch(fail);
  };

  const scanQr = (qrraw: string) => {
    if (!qrraw.trim()) return toast("Вставьте строку QR-кода", "error");
    runStaged("qr-text", ["Получаю чек из ФНС", "Распознаю продукты", "Чищу названия"], async () =>
      onScanned(await api.scanReceiptQr(qrraw.trim())),
    ).catch(fail);
  };

  // Фото QR декодируем в браузере (jsQR) и отправляем уже готовую строку.
  const scanQrImage = (file: File) => {
    runStaged("qr-file", ["Декодирую QR-код", "Получаю чек из ФНС", "Распознаю продукты", "Чищу названия"], async () => {
      const qrraw = await decodeQrFromFile(file);
      onScanned(await api.scanReceiptQr(qrraw));
    }).catch(fail);
  };

  const confirm = () => {
    if (!receipt) return;
    runStaged("confirm", ["Добавляю в холодильник"], async () => {
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
    }).catch(fail);
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
          Текст или QR-код чека — выделим продукты, отбросим непродукты и предложим сроки годности
        </Typography>
      </Box>

      <UploadCard
        busy={busy}
        stage={stage}
        action={action}
        onScanText={scanText}
        onScanQr={scanQr}
        onScanQrImage={scanQrImage}
      />

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
              <Button
                variant="contained"
                size="large"
                onClick={confirm}
                disabled={busy || selectedCount === 0}
                startIcon={action === "confirm" ? <CircularProgress size={18} color="inherit" /> : undefined}
              >
                {action === "confirm" && stage ? <AnimatedStage text={stage} /> : `Добавить выбранное (${selectedCount})`}
              </Button>
              <Button color="inherit" disabled={busy} onClick={() => setReceipt(null)}>
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
