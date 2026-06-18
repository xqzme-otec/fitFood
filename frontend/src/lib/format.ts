/* Хелперы форматирования. */

export function num(v: number | null | undefined, digits = 0): string {
  if (v == null || Number.isNaN(v)) return "0";
  return v.toLocaleString("ru-RU", { maximumFractionDigits: digits });
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function unitLabel(unit: string): string {
  return unit === "ml" ? "мл" : unit === "pcs" ? "шт" : "г";
}

export const ACTIVITY_OPTIONS: [string, string][] = [
  ["minimal", "Минимальная (сидячий образ жизни)"],
  ["low", "Низкая"],
  ["medium", "Средняя"],
  ["high", "Высокая"],
  ["very_high", "Очень высокая"],
];

export const GOAL_OPTIONS: [string, string][] = [
  ["lose", "Похудение"],
  ["maintain", "Поддержание"],
  ["gain", "Набор массы"],
];

export const GOAL_LABELS: Record<string, string> = {
  lose: "Похудение",
  maintain: "Поддержание",
  gain: "Набор массы",
};

export const EXPIRY_LABEL: Record<string, string> = {
  ok: "Свежий",
  soon: "Скоро истекает",
  expired: "Просрочен",
  unknown: "Срок неизвестен",
};

export const EXPIRY_COLOR: Record<string, "success" | "warning" | "error" | "default"> = {
  ok: "success",
  soon: "warning",
  expired: "error",
  unknown: "default",
};
