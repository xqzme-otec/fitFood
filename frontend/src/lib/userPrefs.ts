/* Косметические настройки пользователя (имя, фото) — хранятся локально в браузере. */

const KEY = "fitfood_userprefs";
const EVENT = "userprefs";

export interface UserPrefs {
  name?: string;
  photo?: string; // data-URL
}

export function getUserPrefs(): UserPrefs {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as UserPrefs;
  } catch {
    return {};
  }
}

export function setUserPrefs(prefs: UserPrefs): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(prefs));
  window.dispatchEvent(new Event(EVENT));
}

/** Подписка на изменения настроек (возвращает функцию отписки). */
export function onUserPrefsChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
