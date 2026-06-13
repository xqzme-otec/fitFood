/* Тонкий клиент к FastAPI-бэкенду FitFood. JWT хранится в localStorage. */
(function () {
  const TOKEN_KEY = "fitfood_token";

  const Auth = {
    get token() { return localStorage.getItem(TOKEN_KEY); },
    set token(v) { v ? localStorage.setItem(TOKEN_KEY, v) : localStorage.removeItem(TOKEN_KEY); },
    get isAuthed() { return !!this.token; },
    logout() { this.token = null; },
  };

  async function request(path, { method = "GET", body, form, auth = true } = {}) {
    const headers = {};
    const opts = { method, headers };

    if (auth && Auth.token) headers["Authorization"] = "Bearer " + Auth.token;

    if (form) {
      // application/x-www-form-urlencoded (для /auth/login)
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      opts.body = new URLSearchParams(form).toString();
    } else if (body instanceof FormData) {
      opts.body = body; // multipart, Content-Type выставит браузер
    } else if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }

    let res;
    try {
      res = await fetch(path, opts);
    } catch (e) {
      throw new ApiError("Нет связи с сервером", 0);
    }

    if (res.status === 401 && auth) {
      Auth.logout();
      throw new ApiError("Сессия истекла, войдите заново", 401);
    }

    let data = null;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) data = await res.json().catch(() => null);
    else if (res.status !== 204) data = await res.text().catch(() => null);

    if (!res.ok) throw new ApiError(extractError(data), res.status, data);
    return data;
  }

  function extractError(data) {
    if (!data) return "Ошибка запроса";
    if (typeof data === "string") return data;
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((d) => {
        const loc = (d.loc || []).slice(1).join(".");
        return (loc ? loc + ": " : "") + d.msg;
      }).join("; ");
    }
    return "Ошибка запроса";
  }

  class ApiError extends Error {
    constructor(message, status, data) { super(message); this.status = status; this.data = data; }
  }

  // --- Эндпоинты ---
  const API = {
    Auth, ApiError,
    register: (email, password) => request("/auth/register", { method: "POST", auth: false, body: { email, password } }),
    login: async (email, password) => {
      const t = await request("/auth/login", { method: "POST", auth: false, form: { username: email, password } });
      Auth.token = t.access_token; return t;
    },
    me: () => request("/auth/me"),

    getProfile: () => request("/profile"),
    createProfile: (p) => request("/profile", { method: "POST", body: p }),
    getTargets: () => request("/profile/targets"),
    updateWeight: (weight_kg) => request("/profile/weight", { method: "PUT", body: { weight_kg } }),
    weightHistory: () => request("/profile/weight/history"),
    overrideCalories: (calories) => request("/profile/calories", { method: "PUT", body: { calories } }),
    overrideMacros: (m) => request("/profile/macros", { method: "PUT", body: m }),
    getMeals: () => request("/profile/meals"),
    setMealPlan: (meals) => request("/profile/meals", { method: "PUT", body: { meals } }),

    searchProducts: (q) => request("/products?limit=12&q=" + encodeURIComponent(q || "")),
    searchDishes: (q) => request("/dishes?limit=12&q=" + encodeURIComponent(q || "")),
    createDish: (dish) => request("/dishes", { method: "POST", body: dish }),

    addEntry: (e) => request("/diary/entries", { method: "POST", body: e }),
    deleteEntry: (id) => request("/diary/entries/" + id, { method: "DELETE" }),
    daySummary: (day) => request("/diary/summary" + (day ? "?day=" + day : "")),

    fridgeGrouped: () => request("/fridge/grouped"),
    fridgeAdd: (item) => request("/fridge/items", { method: "POST", body: item }),
    fridgeUpdate: (id, patch) => request("/fridge/items/" + id, { method: "PATCH", body: patch }),
    fridgeDelete: (id) => request("/fridge/items/" + id, { method: "DELETE" }),

    scanReceiptText: (text) => request("/receipts/scan-text", { method: "POST", body: { text } }),
    scanReceiptImage: (file) => { const fd = new FormData(); fd.append("file", file); return request("/receipts/scan", { method: "POST", body: fd }); },
    confirmReceipt: (id, items) => request("/receipts/" + id + "/confirm", { method: "POST", body: { items } }),

    recommendations: (mealSlotId) => request("/recommendations" + (mealSlotId ? "?meal_slot_id=" + mealSlotId : "")),
  };

  window.API = API;
})();
