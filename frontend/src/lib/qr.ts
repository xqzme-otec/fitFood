import jsQR from "jsqr";

/**
 * Декодирует QR-код кассового чека из загруженного изображения (в браузере).
 * Возвращает сырую строку QR (t=...&s=...&fn=...&i=...&fp=...&n=...) или
 * бросает ошибку, если код не распознан.
 */
export async function decodeQrFromFile(file: File): Promise<string> {
  const bitmap = await loadImage(file);
  // Ограничиваем размер для скорости decode, сохраняя пропорции.
  const maxSide = 1400;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Не удалось обработать изображение");
  ctx.drawImage(bitmap, 0, 0, w, h);

  const { data } = ctx.getImageData(0, 0, w, h);
  const result = jsQR(data, w, h, { inversionAttempts: "attemptBoth" });
  if (!result?.data) {
    throw new Error("QR-код не распознан. Попробуйте более чёткое фото или вставьте строку вручную.");
  }
  return result.data.trim();
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Не удалось загрузить изображение"));
    };
    img.src = url;
  });
}
