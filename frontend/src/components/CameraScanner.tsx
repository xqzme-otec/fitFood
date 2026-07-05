"use client";
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

/**
 * Live-сканер QR-кода с камеры устройства: показывает поток, в цикле прогоняет
 * кадры через jsQR и при первом распознавании вызывает onDetected(qrraw).
 * Камера/поток аккуратно останавливаются при размонтировании или находке.
 *
 * Требует защищённый контекст (https или localhost) — иначе getUserMedia
 * недоступен; в этом случае показываем ошибку и предлагаем загрузку файла.
 */
export default function CameraScanner({
  onDetected,
  onClose,
}: {
  onDetected: (qrraw: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Держим колбэк в ref, чтобы эффект не перезапускался (и камера не моргала).
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  const [starting, setStarting] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const stop = () => {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };

    const tick = () => {
      if (stopped) return;
      const v = videoRef.current;
      if (v && v.readyState === v.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const res = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
        if (res?.data) {
          stop();
          onDetectedRef.current(res.data.trim());
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play();
        setStarting(false);
        tick();
      } catch {
        setError("Нет доступа к камере. Разрешите доступ в браузере или используйте загрузку файла.");
      }
    })();

    return stop;
  }, []);

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "4 / 3",
          borderRadius: 3,
          overflow: "hidden",
          bgcolor: "#000",
          display: "grid",
          placeItems: "center",
        }}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* Рамка-видоискатель */}
        {!error && (
          <Box
            sx={{
              position: "absolute",
              width: "60%",
              aspectRatio: "1",
              border: "3px solid rgba(255,255,255,0.9)",
              borderRadius: 2,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)",
            }}
          />
        )}
        {starting && !error && (
          <Box sx={{ position: "absolute", display: "grid", placeItems: "center", gap: 1, color: "#fff" }}>
            <CircularProgress size={28} color="inherit" />
            <Typography variant="body2">Запускаю камеру…</Typography>
          </Box>
        )}
        {error && (
          <Box sx={{ position: "absolute", px: 3, textAlign: "center", color: "#fff" }}>
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5, textAlign: "center" }}>
        {error ? "Камера недоступна" : "Наведите камеру на QR-код чека"}
      </Typography>

      <Button fullWidth color="inherit" startIcon={<CloseRoundedIcon />} onClick={onClose} sx={{ mt: 1 }}>
        Закрыть камеру
      </Button>
    </Box>
  );
}
