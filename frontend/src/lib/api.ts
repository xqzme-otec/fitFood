/* Типизированный клиент к FastAPI-бэкенду FitFood. JWT в localStorage. */
import type {
  DaySummary,
  Dish,
  DishCreate,
  FoodEntry,
  FoodEntryCreate,
  FridgeCategoryGroup,
  FridgeItem,
  FridgeItemCreate,
  FridgeItemUpdate,
  MealShareIn,
  MealSlot,
  NutritionTarget,
  Product,
  Profile,
  ProfileCreate,
  Receipt,
  ReceiptItemConfirm,
  Recommendation,
  Token,
  User,
  WeightRecord,
} from "./types";

const TOKEN_KEY = "fitfood_token";
// Прод: тот же origin (FastAPI раздаёт статику). Dev: rewrites в next.config.
const BASE = process.env.NEXT_PUBLIC_API_BASE || "";

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const auth = {
  get token(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set token(v: string | null) {
    if (typeof window === "undefined") return;
    if (v) localStorage.setItem(TOKEN_KEY, v);
    else localStorage.removeItem(TOKEN_KEY);
  },
  get isAuthed(): boolean {
    return !!this.token;
  },
  logout() {
    this.token = null;
  },
};

interface RequestOptions {
  method?: string;
  body?: unknown;
  form?: Record<string, string>;
  auth?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, form, auth: needAuth = true } = opts;
  const headers: Record<string, string> = {};
  const init: RequestInit = { method, headers };

  if (needAuth && auth.token) headers["Authorization"] = "Bearer " + auth.token;

  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    init.body = new URLSearchParams(form).toString();
  } else if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(BASE + path, init);
  } catch {
    throw new ApiError("Нет связи с сервером", 0);
  }

  if (res.status === 401 && needAuth) {
    auth.logout();
    throw new ApiError("Сессия истекла, войдите заново", 401);
  }

  let data: unknown = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) data = await res.json().catch(() => null);
  else if (res.status !== 204) data = await res.text().catch(() => null);

  if (!res.ok) throw new ApiError(extractError(data), res.status, data);
  return data as T;
}

function extractError(data: unknown): string {
  if (!data) return "Ошибка запроса";
  if (typeof data === "string") return data;
  const d = data as { detail?: unknown };
  if (typeof d.detail === "string") return d.detail;
  if (Array.isArray(d.detail)) {
    return d.detail
      .map((e: { loc?: string[]; msg?: string }) => {
        const loc = (e.loc || []).slice(1).join(".");
        return (loc ? loc + ": " : "") + (e.msg || "");
      })
      .join("; ");
  }
  return "Ошибка запроса";
}

export const api = {
  // --- Auth ---
  register: (email: string, password: string) =>
    request<User>("/auth/register", { method: "POST", auth: false, body: { email, password } }),
  async login(email: string, password: string) {
    const t = await request<Token>("/auth/login", {
      method: "POST",
      auth: false,
      form: { username: email, password },
    });
    auth.token = t.access_token;
    return t;
  },
  me: () => request<User>("/auth/me"),

  // --- Profile / targets ---
  getProfile: () => request<Profile>("/profile"),
  createProfile: (p: ProfileCreate) => request<Profile>("/profile", { method: "POST", body: p }),
  getTargets: () => request<NutritionTarget>("/profile/targets"),
  updateWeight: (weight_kg: number) =>
    request<NutritionTarget>("/profile/weight", { method: "PUT", body: { weight_kg } }),
  weightHistory: () => request<WeightRecord[]>("/profile/weight/history"),
  overrideCalories: (calories: number) =>
    request<NutritionTarget>("/profile/calories", { method: "PUT", body: { calories } }),
  overrideMacros: (m: { protein_g: number; fat_g: number; carb_g: number; calories?: number }) =>
    request<NutritionTarget>("/profile/macros", { method: "PUT", body: m }),
  getMeals: () => request<MealSlot[]>("/profile/meals"),
  setMealPlan: (meals: MealShareIn[]) =>
    request<MealSlot[]>("/profile/meals", { method: "PUT", body: { meals } }),

  // --- Catalog ---
  searchProducts: (q: string, limit = 20) =>
    request<Product[]>(`/products?limit=${limit}&q=${encodeURIComponent(q || "")}`),
  getProduct: (id: number) => request<Product>(`/products/${id}`),
  searchDishes: (q = "", limit = 200) =>
    request<Dish[]>(`/dishes?limit=${limit}&q=${encodeURIComponent(q || "")}`),
  getDish: (id: number) => request<Dish>(`/dishes/${id}`),
  createDish: (dish: DishCreate) => request<Dish>("/dishes", { method: "POST", body: dish }),
  updateDish: (id: number, dish: DishCreate) =>
    request<Dish>(`/dishes/${id}`, { method: "PUT", body: dish }),
  deleteDish: (id: number) => request<void>(`/dishes/${id}`, { method: "DELETE" }),

  // --- Diary ---
  addEntry: (e: FoodEntryCreate) => request<FoodEntry>("/diary/entries", { method: "POST", body: e }),
  deleteEntry: (id: number) => request<void>(`/diary/entries/${id}`, { method: "DELETE" }),
  daySummary: (day?: string) =>
    request<DaySummary>("/diary/summary" + (day ? "?day=" + day : "")),

  // --- Fridge ---
  fridgeItems: () => request<FridgeItem[]>("/fridge/items"),
  fridgeGrouped: () => request<FridgeCategoryGroup[]>("/fridge/grouped"),
  fridgeAdd: (item: FridgeItemCreate) =>
    request<FridgeItem>("/fridge/items", { method: "POST", body: item }),
  fridgeUpdate: (id: number, patch: FridgeItemUpdate) =>
    request<FridgeItem>(`/fridge/items/${id}`, { method: "PATCH", body: patch }),
  fridgeDelete: (id: number) => request<void>(`/fridge/items/${id}`, { method: "DELETE" }),

  // --- Receipts ---
  scanReceiptText: (text: string) =>
    request<Receipt>("/receipts/scan-text", { method: "POST", body: { text } }),
  scanReceiptImage: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<Receipt>("/receipts/scan", { method: "POST", body: fd });
  },
  confirmReceipt: (id: number, items: ReceiptItemConfirm[]) =>
    request<FridgeItem[]>(`/receipts/${id}/confirm`, { method: "POST", body: { items } }),

  // --- Recommendations ---
  recommendations: (mealSlotId?: number | null) =>
    request<Recommendation[]>(
      "/recommendations" + (mealSlotId ? "?meal_slot_id=" + mealSlotId : ""),
    ),
};
