/* FitFood SPA — роутер, оболочка и экраны. */
(function () {
  const { $, $$, esc, num, toast, openModal, confirmDialog,
    macroBar, calorieRing, badgeExpiry, emptyState, spinner } = UI;

  const app = document.getElementById("app");
  const state = { user: null, profile: null, targets: null, meals: [], today: todayStr() };
  let reload = () => {};
  let fridgeCat = null; // активная категория-вкладка в холодильнике
  const FRIDGE_PAGE_SIZE = 15;
  let fridgePage = 0;        // сколько страниц уже отрисовано
  let fridgeObserver = null; // IntersectionObserver для infinite scroll
  let fridgeSort = "added_desc"; // текущая сортировка

  function todayStr() { return new Date().toISOString().slice(0, 10); }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }

  const ACTIVITY = [
    ["minimal", "Минимальная (сидячий образ жизни)"],
    ["low", "Низкая"], ["medium", "Средняя"], ["high", "Высокая"],
    ["very_high", "Очень высокая"],
  ];
  const GOALS = [["lose", "Похудение"], ["maintain", "Поддержание"], ["gain", "Набор массы"]];
  const FRIDGE_CATS = ["Крупы", "Овощи", "Фрукты", "Мясо", "Рыба", "Молочка", "Соусы", "Прочее"];
  const DEMO_RECEIPT =
    "МАГНИТ\nМолоко Простоквашино 930мл 89.90\nКуриное филе 0.8кг 279.50\n" +
    "Брокколи 400г 119.00\nХлеб бородинский 400г 45.90\nМыло Dove 100г 79.00\n" +
    "Салфетки влажные 15шт 59.90\nТворог 9% 200г 89.90\nБананы 1.2кг 119.40\nИТОГО 961.50";

  // ---------------- Boot ----------------
  async function boot() {
    if (!API.Auth.isAuthed) { go("#/login"); return; }
    try {
      state.user = await API.me();
      if (!state.user.is_profile_complete) { go("#/onboarding"); return; }
      state.profile = await API.getProfile();
      state.targets = await API.getTargets();
      state.meals = await API.getMeals();
      if (!location.hash || location.hash === "#/login" || location.hash === "#/onboarding") go("#/today");
      else render();
    } catch (e) {
      API.Auth.logout(); go("#/login");
    }
  }

  async function refreshTargets() {
    state.targets = await API.getTargets();
    state.meals = await API.getMeals();
    state.profile = await API.getProfile();
  }

  // ---------------- Router ----------------
  function render() {
    const route = (location.hash || "#/today").split("?")[0];
    if (route === "#/login") return viewAuth();
    if (route === "#/onboarding") return viewOnboarding();
    if (!API.Auth.isAuthed) return go("#/login");
    if (state.user && !state.user.is_profile_complete) return go("#/onboarding");

    const inner = {
      "#/today": viewToday, "#/fridge": viewFridge, "#/receipt": viewReceipt,
      "#/add": viewAddProducts, "#/recipes": viewRecipes, "#/settings": viewSettings,
    }[route] || viewToday;
    renderShell(route);
    inner();
  }
  window.addEventListener("hashchange", render);

  // ---------------- Shell ----------------
  const NAV = [
    ["#/today", "home", "Сегодня"],
    ["#/fridge", "fridge", "Холодильник"],
    ["#/add", "search", "Добавить"],
    ["#/receipt", "receipt", "Сканер чека"],
    ["#/recipes", "chef", "Рецепты"],
    ["#/settings", "settings", "Профиль"],
  ];

  function renderShell(route) {
    const initials = (state.user?.email || "?").slice(0, 1).toUpperCase();
    app.innerHTML = `
      <div class="shell">
        <div class="topbar">
          <div class="brand"><span class="logo">${icon("apple")}</span>Fit<b>Food</b></div>
          <div class="spacer"></div>
          <div class="userpill"><span class="uemail">${esc(state.user?.email || "")}</span>
            <span class="avatar">${esc(initials)}</span></div>
        </div>
        <div class="layout">
          <nav class="sidenav">
            ${NAV.map(([h, ic, lbl]) => `<a class="navlink ${route === h ? "active" : ""}" href="${h}">
              ${icon(ic)}<span class="lbl">${lbl}</span></a>`).join("")}
          </nav>
          <main class="main" id="view">${spinner()}</main>
        </div>
      </div>`;
  }
  const view = () => document.getElementById("view");

  // ---------------- Auth ----------------
  function viewAuth() {
    let mode = "login";
    app.innerHTML = `
      <div class="center-wrap">
        <div class="card auth-card">
          <div class="brand"><span class="logo">${icon("apple")}</span>Fit<b>Food</b></div>
          <p class="tagline">Умный холодильник: КБЖУ, дневник и рецепты</p>
          <div class="seg" id="seg">
            <button class="active" data-m="login">Вход</button>
            <button data-m="register">Регистрация</button>
          </div>
          <form id="auth-form">
            <div class="field"><label for="email">Email</label>
              <input class="input" id="email" name="email" type="email" required placeholder="you@example.com" autocomplete="email"></div>
            <div class="field"><label for="password">Пароль</label>
              <input class="input" id="password" name="password" type="password" required minlength="6" placeholder="Минимум 6 символов" autocomplete="current-password"></div>
            <button class="btn btn-primary btn-block" type="submit" id="submit">Войти</button>
          </form>
          <p class="switch-line" id="switch"></p>
        </div>
      </div>`;

    const seg = $("#seg"), form = $("#auth-form"), submit = $("#submit");
    seg.addEventListener("click", (e) => {
      const b = e.target.closest("[data-m]"); if (!b) return;
      mode = b.dataset.m;
      $$("#seg button").forEach((x) => x.classList.toggle("active", x === b));
      submit.textContent = mode === "login" ? "Войти" : "Создать аккаунт";
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("#email").value.trim(), pwd = $("#password").value;
      submit.disabled = true; submit.textContent = "...";
      try {
        if (mode === "register") {
          await API.register(email, pwd);
          toast("Аккаунт создан, входим…");
        }
        await API.login(email, pwd);
        await boot();
      } catch (err) {
        toast(err.message, "err");
        submit.disabled = false; submit.textContent = mode === "login" ? "Войти" : "Создать аккаунт";
      }
    });
  }

  // ---------------- Onboarding ----------------
  function viewOnboarding() {
    app.innerHTML = `
      <div class="center-wrap">
        <div class="card auth-card" style="max-width:560px">
          <div class="brand"><span class="logo">${icon("apple")}</span>Анкета</div>
          <p class="tagline">Рассчитаем вашу суточную норму КБЖУ</p>
          <form id="ob">
            <div class="row">
              <div class="field"><label>Пол</label>
                <select class="select" name="sex"><option value="male">Мужской</option><option value="female">Женский</option></select></div>
              <div class="field"><label>Возраст, лет</label><input class="input" name="age" type="number" min="6" max="119" value="30" required></div>
            </div>
            <div class="row">
              <div class="field"><label>Рост, см</label><input class="input" name="height_cm" type="number" min="60" max="250" value="175" required></div>
              <div class="field"><label>Вес, кг</label><input class="input" name="weight_kg" type="number" step="0.1" min="25" max="350" value="75" required></div>
            </div>
            <div class="field"><label>Дневная активность</label>
              <select class="select" name="activity_level">${ACTIVITY.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></div>
            <div class="field"><label>Цель</label>
              <select class="select" name="goal" id="goal">${GOALS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></div>
            <div class="row" id="goal-extra" style="display:none">
              <div class="field"><label>Целевой вес, кг</label><input class="input" name="target_weight_kg" type="number" step="0.1" min="25" max="350"></div>
              <div class="field"><label>Срок, дней</label><input class="input" name="target_days" type="number" min="1" max="1999"></div>
            </div>
            <div class="field"><label>Приёмов пищи в день</label>
              <select class="select" name="meals_per_day"><option>2</option><option selected>3</option><option>4</option><option>5</option></select></div>
            <button class="btn btn-primary btn-block" type="submit" id="ob-submit">Рассчитать и продолжить</button>
          </form>
          <p class="switch-line"><a id="logout" href="#">Выйти</a></p>
        </div>
      </div>`;

    const goalSel = $("#goal"), extra = $("#goal-extra");
    const toggleExtra = () => { extra.style.display = goalSel.value === "maintain" ? "none" : "flex"; };
    goalSel.addEventListener("change", toggleExtra); toggleExtra();
    $("#logout").addEventListener("click", (e) => { e.preventDefault(); API.Auth.logout(); go("#/login"); });

    $("#ob").addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = UI.formValues(e.target);
      const payload = {
        sex: v.sex, age: +v.age, height_cm: +v.height_cm, weight_kg: +v.weight_kg,
        activity_level: v.activity_level, goal: v.goal, meals_per_day: +v.meals_per_day,
      };
      if (v.goal !== "maintain") {
        payload.target_weight_kg = v.target_weight_kg ? +v.target_weight_kg : null;
        payload.target_days = v.target_days ? +v.target_days : null;
      }
      const btn = $("#ob-submit"); btn.disabled = true; btn.textContent = "...";
      try {
        await API.createProfile(payload);
        toast("Норма рассчитана!");
        state.user.is_profile_complete = true;
        await boot();
      } catch (err) {
        toast(err.message, "err"); btn.disabled = false; btn.textContent = "Рассчитать и продолжить";
      }
    });
  }

  // ---------------- Today / Dashboard ----------------
  async function viewToday() {
    reload = viewToday;
    const v = view(); v.innerHTML = spinner();
    let s;
    try { s = await API.daySummary(state.today); }
    catch (e) { v.innerHTML = emptyState("info", e.message); return; }

    v.innerHTML = `
      <div class="page-head">
        <div><h1>Сегодня</h1><div class="sub">${new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</div></div>
      </div>
      <div class="grid grid-2">
        <div class="card">
          <div class="flex gap-12 items-center">
            ${calorieRing({ consumed: s.consumed.calories, target: s.target.calories })}
            <div class="grow" style="flex:1">
              ${macroBar({ label: "Белки", cls: "m-protein", consumed: s.consumed.protein, limit: s.target.protein })}
              ${macroBar({ label: "Жиры", cls: "m-fat", consumed: s.consumed.fat, limit: s.target.fat })}
              ${macroBar({ label: "Углеводы", cls: "m-carb", consumed: s.consumed.carbs, limit: s.target.carbs })}
            </div>
          </div>
        </div>
        <div class="card">
          <h3 style="margin-bottom:12px">Итог дня</h3>
          <div class="grid" style="grid-template-columns:1fr 1fr;gap:14px">
            <div class="stat"><div class="v">${num(s.consumed.calories)}</div><div class="k">съедено, ккал</div></div>
            <div class="stat"><div class="v" style="color:${s.remaining.calories < 0 ? "var(--danger)" : "var(--ok)"}">${num(s.remaining.calories)}</div><div class="k">остаток, ккал</div></div>
            <div class="stat"><div class="v">${num(s.consumed.protein)}<span class="k" style="font-size:14px"> г</span></div><div class="k">белки</div></div>
            <div class="stat"><div class="v">${num(s.consumed.carbs)}<span class="k" style="font-size:14px"> г</span></div><div class="k">углеводы</div></div>
          </div>
        </div>
      </div>

      <div class="section-title" style="margin-top:24px"><h2>Приёмы пищи</h2></div>
      <div class="grid grid-meals" id="meals"></div>`;

    const mealsEl = $("#meals", v);
    s.meals.forEach((m) => mealsEl.appendChild(mealCard(m)));
  }

  function mealCard(m) {
    const el = document.createElement("div");
    el.className = "card";
    const pct = Math.min((m.consumed.calories / Math.max(m.limit.calories, 1)) * 100, 100);
    const over = m.consumed.calories > m.limit.calories * 1.001;
    el.innerHTML = `
      <div class="section-title">
        <div><h3>${esc(m.name)}</h3>
          <div class="muted" style="font-size:13px">${num(m.consumed.calories)} / ${num(m.limit.calories)} ккал</div></div>
        <span class="kcal-tag">${num(m.remaining.calories)}</span>
      </div>
      <div class="track m-cal ${over ? "over" : ""}" style="margin-bottom:14px"><i style="width:${pct}%"></i></div>
      <div class="list">
        ${m.entries.length ? m.entries.map((e) => `
          <div class="list-item">
            <div class="grow"><div class="name">${esc(e.name)}</div>
              <div class="meta">${num(e.amount)} г · Б${num(e.protein)} Ж${num(e.fat)} У${num(e.carbs)}</div></div>
            <span class="kcal-tag">${num(e.calories)}</span>
            <button class="icon-btn" data-del="${e.id}" aria-label="Удалить запись">${icon("trash", "icon-sm")}</button>
          </div>`).join("") : `<div class="muted" style="padding:6px 0;font-size:13px">Пока ничего не добавлено</div>`}
      </div>
      <div class="flex gap-8 mt-16">
        <button class="btn btn-primary btn-sm" data-add aria-label="Добавить продукт">${icon("plus", "icon-sm")} Добавить</button>
        <button class="btn btn-ghost btn-sm" data-ideas>${icon("sparkles", "icon-sm")} Идеи</button>
      </div>`;

    el.querySelector("[data-add]").addEventListener("click", () => openAddFood(m));
    el.querySelector("[data-ideas]").addEventListener("click", () => openRecommendations(m));
    $$("[data-del]", el).forEach((b) => b.addEventListener("click", async () => {
      await API.deleteEntry(b.dataset.del); toast("Удалено"); viewToday();
    }));
    return el;
  }

  // -------- Add food modal --------
  function openAddFood(slot) {
    let mode = "product", selected = null, timer = null;
    let fridgeCache = null;
    const dishDetailsCache = {};

    openModal({
      title: `Добавить в «${slot.name}»`,
      render: (body) => {
        body.innerHTML = `
          <div class="seg" id="m-seg">
            <button class="active" data-mode="product">Продукт</button>
            <button data-mode="dish">Блюдо</button>
          </div>
          <div class="field" style="margin-top:12px"><label>Поиск</label>
            <input class="input" id="m-q" placeholder="Например, куриное филе" autocomplete="off">
            <div id="m-res"></div></div>
          <div id="m-pick"></div>`;

        const q = $("#m-q", body), res = $("#m-res", body), pick = $("#m-pick", body);

        $("#m-seg", body).addEventListener("click", (e) => {
          const b = e.target.closest("[data-mode]"); if (!b) return;
          mode = b.dataset.mode; selected = null; pick.innerHTML = ""; res.innerHTML = "";
          $$("#m-seg button", body).forEach((x) => x.classList.toggle("active", x === b));
          doSearch();
        });

        const renderResults = (items) => {
          if (!items.length) { res.innerHTML = `<div class="hint" style="padding:6px 0">Ничего не найдено</div>`; return; }
          res.innerHTML = `<div class="search-results">${items.map((it) => {
            const per = it._per100 || {};
            const inFridge = !!it._fridgeId;
            const unitLabel = it._unit === "ml" ? "мл" : it._unit === "pcs" ? "шт" : "г";
            const kbjuText = per.calories != null && per.calories > 0 ? `${num(per.calories)} ккал/100г` : "КБЖУ неизв.";
            return `<div class="opt" data-id="${it.id}" data-fridge-id="${it._fridgeId || ""}"
              data-name="${esc(it.name)}" data-unit="${esc(it._unit || "g")}" data-max="${it._max != null ? it._max : ""}"
              data-cal="${per.calories || 0}" data-p="${per.protein || 0}" data-f="${per.fat || 0}" data-c="${per.carbs || 0}">
              <span>
                ${esc(it.name)}
                ${inFridge ? `<span style="color:#16a34a;font-size:12px;font-weight:600;margin-left:6px">имеется · ${num(it._max)} ${unitLabel}</span>` : ""}
              </span>
              <span class="cat">${kbjuText}</span>
            </div>`;
          }).join("")}</div>`;

          $$(".opt", res).forEach((o) => o.addEventListener("click", () => {
            const hasCal = +o.dataset.cal > 0 || +o.dataset.p > 0;
            selected = {
              id: +o.dataset.id,
              fridgeId: o.dataset.fridgeId ? +o.dataset.fridgeId : null,
              name: o.dataset.name,
              unit: o.dataset.unit || "g",
              maxQty: o.dataset.max !== "" ? +o.dataset.max : null,
              per100: { calories: +o.dataset.cal, protein: +o.dataset.p, fat: +o.dataset.f, carbs: +o.dataset.c },
              hasKbju: hasCal,
            };
            res.innerHTML = ""; q.value = selected.name; renderPick();
          }));
        };

        const doSearch = async () => {
          const term = q.value.trim();

          if (mode === "dish") {
            const items = await API.searchDishes(term);
            // Сохраняем полные данные блюда (включая ингредиенты) для списания из холодильника
            items.forEach((it) => { dishDetailsCache[it.id] = it; });
            renderResults(items.map((it) => ({ id: it.id, name: it.name, _unit: "g", _per100: it.per_100g })));
            return;
          }

          // Загружаем холодильник один раз
          if (!fridgeCache) {
            try { fridgeCache = await API.fridgeItems(); } catch { fridgeCache = []; }
          }

          // Поиск по каталогу
          const catalogItems = await API.searchProducts(term);

          // Фильтруем холодильник по поисковому запросу
          const termLower = term.toLowerCase();
          const fridgeMatches = fridgeCache.filter((fi) =>
            !term || fi.name.toLowerCase().includes(termLower)
          );
          // Имена из холодильника для быстрого поиска дублей
          const fridgeByProductId = Object.fromEntries(
            fridgeCache.filter((fi) => fi.product_id).map((fi) => [fi.product_id, fi])
          );
          const fridgeByName = Object.fromEntries(
            fridgeCache.map((fi) => [fi.name.toLowerCase(), fi])
          );

          // Помечаем каталожные продукты, если они есть в холодильнике
          const catalogMapped = catalogItems.map((it) => {
            const fi = fridgeByProductId[it.id] || fridgeByName[it.name.toLowerCase()];
            return {
              id: it.id,
              name: it.name,
              _fridgeId: fi ? fi.id : null,
              _unit: fi ? fi.unit : "g",
              _max: fi ? fi.quantity : null,
              _per100: it,
              _inFridge: !!fi,
            };
          });

          // Добавляем продукты из холодильника, которых нет в каталоге
          const catalogProductIds = new Set(catalogItems.map((it) => it.id));
          const fridgeOnly = fridgeMatches
            .filter((fi) => !fi.product_id || !catalogProductIds.has(fi.product_id))
            .filter((fi) => !catalogMapped.some((c) => c._fridgeId === fi.id))
            .map((fi) => ({
              id: fi.product_id || 0,
              name: fi.name,
              _fridgeId: fi.id,
              _unit: fi.unit,
              _max: fi.quantity,
              _per100: fi.kbju_100g || {},
              _inFridge: true,
            }));

          // Сортировка: сначала есть в холодильнике, потом каталог
          const merged = [...catalogMapped, ...fridgeOnly].sort((a, b) => {
            if (a._inFridge && !b._inFridge) return -1;
            if (!a._inFridge && b._inFridge) return 1;
            return 0;
          });

          renderResults(merged);
        };

        q.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(doSearch, 250); });
        doSearch();

        async function renderPick() {
          const unitLabel = selected.unit === "ml" ? "мл" : selected.unit === "pcs" ? "шт" : "г";
          const defaultAmt = selected.unit === "pcs" ? 1 : 100;
          const maxAttr = selected.maxQty != null ? `max="${selected.maxQty}"` : "";
          const dish = mode === "dish" ? dishDetailsCache[selected.id] : null;
          const ings = dish?.ingredients || [];

          // Загружаем холодильник для проверки наличия ингредиентов
          if (ings.length && !fridgeCache) {
            try { fridgeCache = await API.fridgeItems(); } catch { fridgeCache = []; }
          }
          const fridgeByProductId = Object.fromEntries(
            (fridgeCache || []).filter((fi) => fi.product_id).map((fi) => [fi.product_id, fi])
          );

          pick.innerHTML = `
            <div class="divider"></div>
            <div class="field">
              <label>Количество, ${unitLabel}${selected.maxQty != null ? ` (в холодильнике: ${num(selected.maxQty)} ${unitLabel})` : ""}</label>
              <input class="input" id="m-amt" type="number" min="1" step="1" value="${defaultAmt}" ${maxAttr}>
            </div>
            <div class="card" style="background:var(--surface-2);padding:12px" id="m-prev"></div>
            ${ings.length ? `
            <div style="margin-top:10px;border:1px solid var(--line-2);border-radius:var(--r-sm);overflow:hidden">
              <button id="m-ings-toggle" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:none;border:none;cursor:pointer;font-size:13px;font-weight:600;color:var(--ink-2)">
                <span>${icon("list", "icon-sm")} Списание из холодильника</span>
                <span id="m-ings-chevron" style="transition:transform .2s">${icon("chevron-down", "icon-sm")}</span>
              </button>
              <div id="m-ings-list" style="display:none;border-top:1px solid var(--line-2)">
                ${ings.map((ing) => {
                  const inFridge = !!fridgeByProductId[ing.product_id];
                  const color = inFridge ? "var(--ok)" : "var(--danger,#DC2626)";
                  const statusText = inFridge ? "есть" : "нет";
                  return `<div class="list-item" data-ing-id="${ing.product_id}" data-ing-grams="${ing.grams}" style="padding:8px 14px">
                    <span class="grow" style="font-size:13px;color:${color};font-weight:600">${esc(ing.name)}</span>
                    <span style="font-size:12px;color:${color};margin-right:8px">${statusText}</span>
                    <span class="ing-qty" style="font-size:13px;color:${color};white-space:nowrap;font-weight:600">—</span>
                  </div>`;
                }).join("")}
              </div>
            </div>` : ""}`;

          const amt = $("#m-amt", pick), prev = $("#m-prev", pick);
          const toggle = pick.querySelector("#m-ings-toggle");
          const ingsList = pick.querySelector("#m-ings-list");
          const chevron = pick.querySelector("#m-ings-chevron");
          if (toggle) {
            toggle.addEventListener("click", () => {
              const open = ingsList.style.display !== "none";
              ingsList.style.display = open ? "none" : "block";
              chevron.style.transform = open ? "" : "rotate(180deg)";
            });
          }

          const upd = () => {
            const qty = +amt.value || 0;
            const f = selected.unit === "pcs" ? qty : qty / 100;
            const p = selected.per100;
            const kbjuLine = selected.hasKbju
              ? `<div class="muted" style="font-size:13px;margin-top:4px">Б ${num(p.protein * f)} · Ж ${num(p.fat * f)} · У ${num(p.carbs * f)}</div>`
              : `<div class="muted" style="font-size:13px;margin-top:4px">КБЖУ неизвестно</div>`;
            prev.innerHTML = `
              <div class="flex between">
                <b>${esc(selected.name)}</b>
                <span class="kcal-tag">${selected.hasKbju ? num(p.calories * f) + " ккал" : "—"}</span>
              </div>${kbjuLine}`;

            if (ings.length && dish?.total_grams) {
              const scale = qty / dish.total_grams;
              pick.querySelectorAll("[data-ing-grams]").forEach((row) => {
                const g = Math.round(+row.dataset.ingGrams * scale);
                row.querySelector(".ing-qty").textContent = g > 0 ? `${g} г` : "< 1 г";
              });
            }
          };
          amt.addEventListener("input", upd); upd();
        }
      },
      footer: (f, close) => {
        f.innerHTML = `<button class="btn btn-ghost" data-x>Отмена</button><button class="btn btn-primary" data-ok>Добавить</button>`;
        f.querySelector("[data-x]").addEventListener("click", close);
        f.querySelector("[data-ok]").addEventListener("click", async () => {
          if (!selected) return toast("Выберите продукт или блюдо", "err");
          if (!selected.id) return toast("Продукт не привязан к каталогу", "err");
          const amount = +document.getElementById("m-amt").value;
          if (!amount || amount <= 0) return toast("Укажите количество", "err");
          if (selected.maxQty != null && amount > selected.maxQty) {
            const u = selected.unit === "ml" ? "мл" : selected.unit === "pcs" ? "шт" : "г";
            return toast(`В холодильнике только ${num(selected.maxQty)} ${u}`, "err");
          }

          const payload = { meal_slot_id: slot.meal_slot_id || slot.id, amount, entry_date: state.today };

          if (mode === "dish") {
            payload.dish_id = selected.id;
            // Проверяем ингредиенты блюда против холодильника
            const dish = dishDetailsCache[selected.id];
            const ings = dish?.ingredients || [];
            if (ings.length > 0) {
              if (!fridgeCache) {
                try { fridgeCache = await API.fridgeItems(); } catch { fridgeCache = []; }
              }
              const fridgeByProductId = Object.fromEntries(
                fridgeCache.filter((fi) => fi.product_id).map((fi) => [fi.product_id, fi])
              );
              // Масштабируем граммы ингредиентов на введённое количество
              const scale = amount / (dish.total_grams || amount);
              const toDeduct = [];
              const missing = [];
              ings.forEach((ing) => {
                const fi = fridgeByProductId[ing.product_id];
                const needed = Math.round(ing.grams * scale);
                if (fi) toDeduct.push({ fi, needed });
                else missing.push({ name: ing.name, needed });
              });


              try {
                await API.addEntry(payload);
                await Promise.all(toDeduct.map(({ fi, needed }) => {
                  const remaining = fi.quantity - needed;
                  return remaining <= 0 ? API.fridgeDelete(fi.id) : API.fridgeUpdate(fi.id, { quantity: remaining });
                }));
                toast(toDeduct.length > 0 ? "Добавлено и списано из холодильника" : "Добавлено в рацион");
                close(); viewToday();
              } catch (e) { toast(e.message, "err"); }
              return;
            }
          } else {
            payload.product_id = selected.id;
          }

          try {
            await API.addEntry(payload);
            if (selected.fridgeId) {
              const remaining = (selected.maxQty || 0) - amount;
              if (remaining <= 0) await API.fridgeDelete(selected.fridgeId);
              else await API.fridgeUpdate(selected.fridgeId, { quantity: remaining });
            }
            toast("Добавлено" + (selected.fridgeId ? " и списано из холодильника" : ""));
            close();
            viewToday();
          } catch (e) { toast(e.message, "err"); }
        });
      },
    });
  }

  // -------- Recommendations modal (per meal) --------
  async function openRecommendations(slot) {
    const slotId = slot.meal_slot_id || slot.id;
    const m = openModal({
      title: `Идеи для «${slot.name}»`, width: "560px",
      render: (body) => { body.innerHTML = spinner(); },
    });
    try {
      const recs = await API.recommendations(slotId);
      m.body.innerHTML = recs.length
        ? recs.map((r) => recCard(r)).join("")
        : emptyState("chef", "Подходящих рецептов нет — добавьте продукты в холодильник");
      wireRecCards(m.body, async (dishId, grams) => {
        try {
          await API.addEntry({ meal_slot_id: slotId, dish_id: dishId, amount: grams, entry_date: state.today });
          toast("Добавлено в приём"); m.close(); viewToday();
        } catch (e) { toast(e.message, "err"); }
      });
    } catch (e) { m.body.innerHTML = emptyState("info", e.message); }
  }

  function recCard(r) {
    const kind = r.kind === "dish" ? "Рецепт" : "Комбо";
    const g = r.suggested_grams > 0 ? r.suggested_grams : 100;
    const per = { c: r.calories / g * 100, p: r.protein / g * 100, f: r.fat / g * 100, u: r.carbs / g * 100 };
    const miss = (r.missing_ingredients || []).map((x) => `<span class="chip miss">нет: ${esc(x)}</span>`).join("");
    const eat = r.dish_id ? `
      <div class="flex gap-8 items-center mt-8">
        <input class="input grams-inp" type="number" min="1" step="1" value="${num(g)}" style="max-width:104px" aria-label="Граммы">
        <span class="muted" style="font-size:13px">г</span>
        <button class="btn btn-accent btn-sm" data-eat="${r.dish_id}" style="margin-left:auto">${icon("plus", "icon-sm")} В приём</button>
      </div>` : "";
    return `<div class="card rec" style="margin-bottom:12px"
        data-c100="${per.c}" data-p100="${per.p}" data-f100="${per.f}" data-u100="${per.u}">
      <div class="section-title">
        <div><h3>${esc(r.name)}</h3><div class="muted" style="font-size:13px">${esc(r.reason)}</div></div>
        <span class="badge">${kind}</span>
      </div>
      <div class="flex gap-8" style="flex-wrap:wrap;margin-bottom:8px">
        <span class="chip c-cal">${icon("flame", "icon-sm")} ${num(r.calories)} ккал</span>
        <span class="chip c-p">Б ${num(r.protein)}</span><span class="chip c-f">Ж ${num(r.fat)}</span><span class="chip c-u">У ${num(r.carbs)}</span>
      </div>
      ${miss ? `<div class="flex gap-8" style="flex-wrap:wrap;margin-bottom:8px">${miss}</div>` : ""}
      ${eat}
    </div>`;
  }

  // Живой пересчёт КБЖУ при изменении граммовки + обработка «В приём».
  function wireRecCards(scope, onEat) {
    $$(".rec", scope).forEach((card) => {
      const inp = $(".grams-inp", card);
      if (inp) {
        const upd = () => {
          const g = (+inp.value || 0) / 100;
          $(".c-cal", card).innerHTML = icon("flame", "icon-sm") + " " + num(card.dataset.c100 * g) + " ккал";
          $(".c-p", card).textContent = "Б " + num(card.dataset.p100 * g);
          $(".c-f", card).textContent = "Ж " + num(card.dataset.f100 * g);
          $(".c-u", card).textContent = "У " + num(card.dataset.u100 * g);
        };
        inp.addEventListener("input", upd);
      }
      const b = $("[data-eat]", card);
      if (b) b.addEventListener("click", () => {
        const grams = +(inp ? inp.value : 0) || 0;
        if (grams <= 0) return toast("Укажите количество", "err");
        onEat(+b.dataset.eat, grams);
      });
    });
  }

  // ---------------- Fridge ----------------
  async function viewFridge() {
    reload = viewFridge;
    const v = view(); v.innerHTML = spinner();
    let groups;
    try { groups = await API.fridgeGrouped(); }
    catch (e) { v.innerHTML = emptyState("info", e.message); return; }

    v.innerHTML = `
      <div class="page-head">
        <div><h1>Мой холодильник</h1><div class="sub">Продукты сгруппированы по категориям</div></div>
        <div class="flex gap-8">
          <button class="btn btn-ghost" id="scan">${icon("scan", "icon-sm")} Сканировать чек</button>
          <button class="btn btn-primary" id="add">${icon("plus", "icon-sm")} Добавить продукт</button>
        </div>
      </div>
      <div id="groups"></div>`;

    $("#add", v).addEventListener("click", () => go("#/add"));
    $("#scan", v).addEventListener("click", () => go("#/receipt"));

    const wrap = $("#groups", v);
    if (!groups.length) { wrap.innerHTML = `<div class="card">${emptyState("fridge", "Холодильник пуст. Добавьте продукт или отсканируйте чек.")}</div>`; return; }

    const ALL_CAT = "__all__";
    const allItems = groups.flatMap((g) => g.items);
    const allGroups = [{ category: ALL_CAT, items: allItems }, ...groups];

    if (!fridgeCat || !allGroups.some((g) => g.category === fridgeCat)) fridgeCat = ALL_CAT;

    const SORT_OPTIONS = [
      ["added_desc",   "Дата добавления (новые)"],
      ["added_asc",    "Дата добавления (старые)"],
      ["expiry_asc",   "Срок годности (раньше истекает)"],
      ["expiry_desc",  "Срок годности (позже истекает)"],
      ["calories_asc", "Калорийность (возрастание)"],
      ["calories_desc","Калорийность (убывание)"],
      ["qty_asc",      "Количество (возрастание)"],
      ["qty_desc",     "Количество (убывание)"],
    ];

    function applyFiltersAndSort(items) {
      let result = [...items];
      result.sort((a, b) => {
        switch (fridgeSort) {
          case "added_asc":    return (a.added_at || "") > (b.added_at || "") ? 1 : -1;
          case "added_desc":   return (a.added_at || "") < (b.added_at || "") ? 1 : -1;
          case "expiry_asc": {
            const da = a.expiry_date ? new Date(a.expiry_date) : new Date("9999-12-31");
            const db = b.expiry_date ? new Date(b.expiry_date) : new Date("9999-12-31");
            return da - db;
          }
          case "expiry_desc": {
            const da = a.expiry_date ? new Date(a.expiry_date) : new Date("0000-01-01");
            const db = b.expiry_date ? new Date(b.expiry_date) : new Date("0000-01-01");
            return db - da;
          }
          case "calories_asc":  return (a.kbju_100g?.calories || 0) - (b.kbju_100g?.calories || 0);
          case "calories_desc": return (b.kbju_100g?.calories || 0) - (a.kbju_100g?.calories || 0);
          case "qty_asc":  return a.quantity - b.quantity;
          case "qty_desc": return b.quantity - a.quantity;
          default: return 0;
        }
      });
      return result;
    }

    const currentSortLabel = SORT_OPTIONS.find(([v]) => v === fridgeSort)?.[1] || "Сортировка";
    wrap.innerHTML = `
      <div class="tabs" id="cat-tabs"></div>
      <div style="display:flex;align-items:center;gap:10px;margin-top:24px;position:relative">
        <div style="position:relative;display:inline-block">
          <button class="btn btn-ghost" id="sort-btn" style="border:1px solid var(--line-2);gap:6px">
            ${icon("filter", "icon-sm")}
            <span id="sort-btn-label">${esc(currentSortLabel)}</span>
            ${icon("chevron-down", "icon-sm")}
          </button>
          <div id="sort-dropdown" style="
            display:none;position:absolute;top:calc(100% + 6px);left:0;z-index:200;
            background:var(--surface);border:1px solid var(--line);border-radius:var(--r-md);
            box-shadow:0 8px 24px rgba(0,0,0,.12);min-width:260px;padding:8px 0;
          ">
            <div style="padding:8px 14px 6px;font-size:12px;font-weight:700;color:var(--ink-2);text-transform:uppercase;letter-spacing:.05em">Сортировка</div>
            ${SORT_OPTIONS.map(([v, l]) => `
              <button class="sort-option" data-val="${v}" style="
                display:flex;align-items:center;gap:10px;width:100%;padding:10px 14px;
                background:none;border:none;cursor:pointer;font-size:14px;color:var(--ink);
                text-align:left;transition:background .12s;
                ${fridgeSort === v ? "background:var(--surface-2);font-weight:600;color:var(--primary);" : ""}
              ">
                <span style="width:16px;flex:none">${fridgeSort === v ? icon("check", "icon-sm") : ""}</span>
                ${esc(l)}
              </button>`).join("")}
          </div>
        </div>
        <span class="muted" id="filter-count" style="font-size:13px"></span>
      </div>
      <div class="grid grid-meals" id="cat-items" style="margin-top:14px"></div>
      <div id="fridge-sentinel" style="height:1px"></div>`;

    const tabs = $("#cat-tabs", wrap);
    tabs.innerHTML = allGroups.map((g) => {
      const label = g.category === ALL_CAT ? "Все" : g.category;
      return `<button class="tab ${g.category === fridgeCat ? "active" : ""}" data-cat="${esc(g.category)}">
        ${esc(label)} <span class="cnt">${g.items.length}</span></button>`;
    }).join("");
    $$(".tab", tabs).forEach((b) => b.addEventListener("click", () => {
      fridgeCat = b.dataset.cat;
      fridgePage = 0;
      if (fridgeObserver) { fridgeObserver.disconnect(); fridgeObserver = null; }
      viewFridge();
    }));

    const sortBtn = $("#sort-btn", wrap);
    const sortDropdown = $("#sort-dropdown", wrap);

    sortBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = sortDropdown.style.display === "block";
      sortDropdown.style.display = open ? "none" : "block";
    });

    // Закрывать дропдаун при клике вне; снимаем слушатель когда wrap уходит из DOM
    const closeSortDropdown = () => { sortDropdown.style.display = "none"; };
    document.addEventListener("click", closeSortDropdown);
    new MutationObserver((_, obs) => {
      if (!wrap.isConnected) { document.removeEventListener("click", closeSortDropdown); obs.disconnect(); }
    }).observe(document.getElementById("app"), { childList: true, subtree: false });

    $$(".sort-option", wrap).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        fridgeSort = btn.dataset.val;
        sortDropdown.style.display = "none";
        // обновить label и активный пункт
        const label = SORT_OPTIONS.find(([v]) => v === fridgeSort)?.[1] || "";
        $("#sort-btn-label", wrap).textContent = label;
        $$(".sort-option", wrap).forEach((b) => {
          const active = b.dataset.val === fridgeSort;
          b.style.background = active ? "var(--surface-2)" : "none";
          b.style.fontWeight = active ? "600" : "400";
          b.style.color = active ? "var(--primary)" : "var(--ink)";
          b.querySelector("span").innerHTML = active ? icon("check", "icon-sm") : "";
        });
        rerenderItems();
      });
    });

    function rerenderItems() {
      fridgePage = 0;
      if (fridgeObserver) { fridgeObserver.disconnect(); fridgeObserver = null; }
      const grid = $("#cat-items", wrap);
      grid.innerHTML = "";
      // восстановить sentinel если его убрали
      if (!$("#fridge-sentinel", wrap)) {
        const s = document.createElement("div");
        s.id = "fridge-sentinel"; s.style.height = "1px";
        wrap.appendChild(s);
      }
      startPagination();
    }

    function startPagination() {
      const active = allGroups.find((g) => g.category === fridgeCat) || allGroups[0];
      const items = applyFiltersAndSort(active.items);
      const grid = $("#cat-items", wrap);
      const countEl = $("#filter-count", wrap);
      countEl.textContent = `${items.length} продуктов`;

      function renderNextPage() {
        const start = fridgePage * FRIDGE_PAGE_SIZE;
        const slice = items.slice(start, start + FRIDGE_PAGE_SIZE);
        slice.forEach((it) => grid.appendChild(fridgeCard(it)));
        fridgePage++;
        const sentinel = $("#fridge-sentinel", wrap);
        if (fridgePage * FRIDGE_PAGE_SIZE >= items.length) {
          if (fridgeObserver) { fridgeObserver.disconnect(); fridgeObserver = null; }
          if (sentinel) sentinel.remove();
        }
      }

      renderNextPage();

      if (items.length > FRIDGE_PAGE_SIZE) {
        if (fridgeObserver) fridgeObserver.disconnect();
        fridgeObserver = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) renderNextPage();
        }, { rootMargin: "120px" });
        const sentinel = $("#fridge-sentinel", wrap);
        if (sentinel) fridgeObserver.observe(sentinel);
      }
    }

    fridgePage = 0;
    startPagination();
  }

  function fridgeCard(it) {
    const el = document.createElement("div");
    el.className = "card";
    const unit = { g: "г", ml: "мл", pcs: "шт" }[it.unit] || it.unit;
    const k = it.kbju_100g;
    const tot = it.kbju_total;
    const kbjuBlock = k
      ? `<div class="divider" style="margin:12px 0"></div>
         <div class="muted" style="font-size:12px;margin-bottom:4px">КБЖУ на 100 ${it.unit === "ml" ? "мл" : "г"}</div>
         <div class="flex gap-8" style="flex-wrap:wrap">
           <span class="chip">${icon("flame", "icon-sm")} ${num(k.calories)}</span>
           <span class="chip">Б ${num(k.protein)}</span><span class="chip">Ж ${num(k.fat)}</span><span class="chip">У ${num(k.carbs)}</span>
         </div>
         ${tot ? `<div class="muted" style="font-size:12px;margin-top:6px">Всего: <b>${num(tot.calories)}</b> ккал · Б ${num(tot.protein)} · Ж ${num(tot.fat)} · У ${num(tot.carbs)}</div>` : ""}`
      : `<div class="muted" style="font-size:12px;margin-top:10px">${icon("info", "icon-sm")} КБЖУ неизвестно</div>`;

    el.innerHTML = `
      <div class="section-title">
        <h3>${esc(it.name)}</h3>
        <div class="flex gap-8">
          <button class="icon-btn" data-edit aria-label="Изменить">${icon("edit", "icon-sm")}</button>
          <button class="icon-btn" data-del aria-label="Удалить">${icon("trash", "icon-sm")}</button>
        </div>
      </div>
      <div class="flex between items-center">
        <div class="stat"><div class="v">${num(it.quantity)} <span class="k" style="font-size:14px">${unit}</span></div>
          ${it.price != null ? `<div class="k">${num(it.price)} ₽</div>` : ""}</div>
        ${badgeExpiry(it.expiry_status, it.days_left)}
      </div>
      ${kbjuBlock}
      ${it.product_id ? `<button class="btn btn-accent btn-sm btn-block mt-16" data-log>${icon("plus", "icon-sm")} Добавить в рацион</button>` : ""}`;

    el.querySelector("[data-edit]").addEventListener("click", () => openEditFridge(it));
    const logBtn = el.querySelector("[data-log]");
    if (logBtn) logBtn.addEventListener("click", () => openLogFromFridge(it));
    el.querySelector("[data-del]").addEventListener("click", async () => {
      if (await confirmDialog(`Удалить «${it.name}» из холодильника?`)) {
        await API.fridgeDelete(it.id); toast("Удалено"); viewFridge();
      }
    });
    return el;
  }

  // -------- Добавить продукт из холодильника в дневник --------
  function openLogFromFridge(item) {
    const defAmount = item.unit === "pcs" ? 100 : Math.round(item.quantity);
    openModal({
      title: `«${item.name}» в рацион`, width: "420px",
      render: (body) => {
        body.innerHTML = `
          <div class="field"><label>Приём пищи</label>
            <select class="select" id="lf-slot">${state.meals.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join("")}</select></div>
          <div class="field"><label>Количество, г/мл</label>
            <input class="input" id="lf-amt" type="number" min="1" step="1" value="${defAmount}"></div>
          <div class="card" style="background:var(--surface-2);padding:12px" id="lf-prev"></div>`;
        const amt = $("#lf-amt", body), prev = $("#lf-prev", body);
        const k = item.kbju_100g || { calories: 0, protein: 0, fat: 0, carbs: 0 };
        const upd = () => { const f = (+amt.value || 0) / 100;
          prev.innerHTML = `<div class="flex between"><b>${esc(item.name)}</b><span class="kcal-tag">${num(k.calories * f)} ккал</span></div>
            <div class="muted" style="font-size:13px;margin-top:4px">Б ${num(k.protein * f)} · Ж ${num(k.fat * f)} · У ${num(k.carbs * f)}</div>`; };
        amt.addEventListener("input", upd); upd();
      },
      footer: (f, close) => {
        f.innerHTML = `<button class="btn btn-ghost" data-x>Отмена</button><button class="btn btn-primary" data-ok>Добавить</button>`;
        f.querySelector("[data-x]").addEventListener("click", close);
        f.querySelector("[data-ok]").addEventListener("click", async () => {
          const amount = +document.getElementById("lf-amt").value;
          const slot = +document.getElementById("lf-slot").value;
          if (!amount || amount <= 0) return toast("Укажите количество", "err");
          try {
            await API.addEntry({ meal_slot_id: slot, product_id: item.product_id, amount, entry_date: state.today });
            toast("Добавлено в дневник"); close();
          } catch (e) { toast(e.message, "err"); }
        });
      },
    });
  }

  function openAddFridge() {
    openModal({
      title: "Добавить продукт",
      render: (body) => {
        body.innerHTML = `
          <div class="field"><label>Название</label><input class="input" name="name" placeholder="Например, Творог 9%" required></div>
          <div class="row">
            <div class="field"><label>Количество</label><input class="input" name="quantity" type="number" min="1" step="1" value="100"></div>
            <div class="field"><label>Единица</label><select class="select" name="unit"><option value="g">г</option><option value="ml">мл</option><option value="pcs">шт</option></select></div>
          </div>
          <div class="field"><label>Категория</label>
            <select class="select" name="category"><option value="">Авто (ML-классификатор)</option>${FRIDGE_CATS.map((c) => `<option>${c}</option>`).join("")}</select></div>
          <div class="row">
            <div class="field"><label>Срок годности</label><input class="input" name="expiry_date" type="date">
              <span class="hint">Пусто → предложит LLM</span></div>
            <div class="field"><label>Цена, ₽</label><input class="input" name="price" type="number" step="0.01" min="0"></div>
          </div>`;
      },
      footer: (f, close) => {
        f.innerHTML = `<button class="btn btn-ghost" data-x>Отмена</button><button class="btn btn-primary" data-ok>Добавить</button>`;
        f.querySelector("[data-x]").addEventListener("click", close);
        f.querySelector("[data-ok]").addEventListener("click", async (e) => {
          const v = UI.formValues(e.target.closest(".modal"));
          if (!v.name.trim()) return toast("Укажите название", "err");
          const payload = { name: v.name.trim(), quantity: +v.quantity, unit: v.unit };
          if (v.category) payload.category = v.category;
          if (v.expiry_date) payload.expiry_date = v.expiry_date;
          if (v.price) payload.price = +v.price;
          try { await API.fridgeAdd(payload); toast("Добавлено в холодильник"); close(); viewFridge(); }
          catch (err) { toast(err.message, "err"); }
        });
      },
    });
  }

  function openEditFridge(it) {
    openModal({
      title: `Изменить «${it.name}»`, width: "400px",
      render: (body) => {
        body.innerHTML = `
          <div class="field"><label>Количество (${{ g: "г", ml: "мл", pcs: "шт" }[it.unit] || it.unit})</label>
            <input class="input" name="quantity" type="number" min="0.1" step="1" value="${it.quantity}"></div>
          <div class="field"><label>Срок годности</label><input class="input" name="expiry_date" type="date" value="${it.expiry_date || ""}"></div>`;
      },
      footer: (f, close) => {
        f.innerHTML = `<button class="btn btn-ghost" data-x>Отмена</button><button class="btn btn-primary" data-ok>Сохранить</button>`;
        f.querySelector("[data-x]").addEventListener("click", close);
        f.querySelector("[data-ok]").addEventListener("click", async (e) => {
          const v = UI.formValues(e.target.closest(".modal"));
          const patch = { quantity: +v.quantity };
          if (v.expiry_date) patch.expiry_date = v.expiry_date;
          try { await API.fridgeUpdate(it.id, patch); toast("Сохранено"); close(); viewFridge(); }
          catch (err) { toast(err.message, "err"); }
        });
      },
    });
  }

  // ---------------- Add products ----------------
  function viewAddProducts() {
    reload = viewAddProducts;
    const v = view();
    v.innerHTML = `
      <div class="page-head">
        <div><h1>Добавить продукты</h1><div class="sub">Поиск по каталогу из базы продуктов</div></div>
      </div>
      <div class="card" style="max-width:680px">
        <div style="display:flex;align-items:center;gap:10px;background:var(--surface-2);border:1px solid var(--line-2);border-radius:var(--r-sm);padding:12px 16px">
          ${icon("search", "icon-sm")}
          <input class="input" id="add-q" placeholder="Начните вводить название продукта…" autocomplete="off"
            style="border:none;background:transparent;padding:0 0 0 2px;font-size:16px;outline:none;flex:1;box-shadow:none">
        </div>
        <div id="add-res" style="margin-top:12px"></div>
      </div>`;

    const q = document.getElementById("add-q");
    const res = document.getElementById("add-res");
    let timer = null;

    const doSearch = async () => {
      const term = q.value.trim();
      if (!term) { res.innerHTML = ""; return; }
      res.innerHTML = spinner();
      try {
        const items = await API.searchProducts(term);
        if (!items.length) { res.innerHTML = `<div class="hint" style="padding:6px 0">Ничего не найдено</div>`; return; }

        res.innerHTML = `<div class="search-results">${items.map((it) =>
          `<div class="opt" data-id="${it.id}" data-name="${esc(it.name)}"
            data-cal="${it.calories}" data-p="${it.protein}" data-f="${it.fat}" data-c="${it.carbs}">
            <span>${esc(it.name)}</span><span class="cat">${num(it.calories)} ккал/100г</span></div>`
        ).join("")}</div>`;

        res.querySelectorAll(".opt").forEach((o) => o.addEventListener("click", () => {
          const prod = {
            id: +o.dataset.id, name: o.dataset.name,
            per100: { calories: +o.dataset.cal, protein: +o.dataset.p, fat: +o.dataset.f, carbs: +o.dataset.c }
          };
          openAddProductToFridge(prod);
        }));
      } catch (e) { res.innerHTML = `<div class="hint err" style="padding:6px 0">${e.message}</div>`; }
    };

    q.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(doSearch, 280); });
    q.focus();
  }

  function openAddProductToFridge(prod) {
    openModal({
      title: `Добавить «${prod.name}» в холодильник`,
      render: (body) => {
        body.innerHTML = `
          <div class="row">
            <div class="field"><label>Количество</label>
              <input class="input" id="ap-amt" type="number" min="1" step="1" value="100"></div>
            <div class="field"><label>Единица</label>
              <select class="select" id="ap-unit"><option value="g">г</option><option value="ml">мл</option><option value="pcs">шт</option></select></div>
          </div>
          <div class="field"><label>Срок годности</label>
            <input class="input" id="ap-exp" type="date">
            <span class="hint">Пусто → предложит LLM</span></div>`;
      },
      footer: (f, close) => {
        f.innerHTML = `<button class="btn btn-ghost" data-x>Отмена</button><button class="btn btn-primary" data-ok>В холодильник</button>`;
        f.querySelector("[data-x]").addEventListener("click", close);
        f.querySelector("[data-ok]").addEventListener("click", async () => {
          const amount = +document.getElementById("ap-amt").value;
          if (!amount || amount <= 0) return toast("Укажите количество", "err");
          const unit = document.getElementById("ap-unit").value;
          const expiry = document.getElementById("ap-exp").value;
          const payload = { name: prod.name, quantity: amount, unit, product_id: prod.id };
          if (expiry) payload.expiry_date = expiry;
          try {
            await API.fridgeAdd(payload);
            toast("Добавлено в холодильник"); close();
          } catch (e) { toast(e.message, "err"); }
        });
      },
    });
  }

  // ---------------- Receipt scanner ----------------
  function viewReceipt() {
    reload = viewReceipt;
    const v = view();
    v.innerHTML = `
      <div class="page-head"><div><h1>Сканер чека</h1>
        <div class="sub">OCR + LLM выделят продукты, отбросят непродукты и предложат сроки</div></div></div>
      <div class="card" style="max-width:620px">
        <div class="seg" id="r-seg"><button class="active" data-t="text">Текст чека</button><button data-t="image">Фото чека</button></div>
        <div id="r-input"></div>
      </div>
      <div id="r-result" class="mt-16"></div>`;

    const seg = $("#r-seg", v), input = $("#r-input", v);
    let tab = "text";
    const renderInput = () => {
      if (tab === "text") {
        input.innerHTML = `
          <div class="field"><label>Вставьте текст чека</label>
            <textarea class="input" id="r-text" rows="8" placeholder="Молоко 930мл 89.90&#10;Мыло 79.00 ..."></textarea></div>
          <div class="flex gap-8">
            <button class="btn btn-ghost btn-sm" id="r-demo">${icon("list", "icon-sm")} Подставить пример</button>
            <button class="btn btn-primary" id="r-scan">${icon("scan", "icon-sm")} Распознать</button>
          </div>`;
        $("#r-demo", input).addEventListener("click", () => { $("#r-text", input).value = DEMO_RECEIPT; });
        $("#r-scan", input).addEventListener("click", async () => {
          const text = $("#r-text", input).value.trim();
          if (!text) return toast("Вставьте текст чека или нажмите «Пример»", "err");
          await doScan(() => API.scanReceiptText(text));
        });
      } else {
        input.innerHTML = `
          <div class="field"><label>Фото чека</label><input class="input" id="r-file" type="file" accept="image/*"></div>
          <p class="hint">Демо-режим OCR вернёт пример чека независимо от файла.</p>
          <button class="btn btn-primary" id="r-scan2">${icon("scan", "icon-sm")} Распознать</button>`;
        $("#r-scan2", input).addEventListener("click", async () => {
          const file = $("#r-file", input).files[0];
          if (!file) return toast("Выберите изображение", "err");
          await doScan(() => API.scanReceiptImage(file));
        });
      }
    };
    seg.addEventListener("click", (e) => {
      const b = e.target.closest("[data-t]"); if (!b) return;
      tab = b.dataset.t; $$("#r-seg button", v).forEach((x) => x.classList.toggle("active", x === b)); renderInput();
    });
    renderInput();

    async function doScan(fn) {
      const out = $("#r-result", v); out.innerHTML = spinner();
      try { renderReceiptConfirm(await fn(), out); }
      catch (e) { out.innerHTML = emptyState("info", e.message); }
    }
  }

  function renderReceiptConfirm(receipt, out) {
    const rows = receipt.items.map((it) => {
      const catOptions = ["Отброшено (не еда)", ...FRIDGE_CATS]
        .map((c) => `<option ${c === it.category ? "selected" : ""}>${c}</option>`).join("");
      return `<div class="list-item" data-id="${it.id}">
        <input type="checkbox" class="acc" ${it.accepted ? "checked" : ""} aria-label="Принять" style="width:18px;height:18px;cursor:pointer">
        <div class="grow">
          <div class="name ${it.is_food ? "" : "strike"}">${esc(it.parsed_name)}</div>
          <div class="meta">${num(it.quantity)} ${{ g: "г", ml: "мл", pcs: "шт" }[it.unit] || it.unit}${it.price != null ? " · " + num(it.price) + " ₽" : ""}${it.expiry_date ? " · до " + it.expiry_date : ""}</div>
        </div>
        <select class="select cat" style="max-width:170px;padding:6px 8px">${catOptions}</select>
      </div>`;
    }).join("");

    out.innerHTML = `
      <div class="card" style="max-width:620px">
        <div class="section-title"><h2>Проверьте перед добавлением</h2>
          <span class="badge">${receipt.items.length} позиций</span></div>
        <p class="hint" style="margin-top:-6px">Непродукты сняты с галочки и зачёркнуты. Поправьте категории и подтвердите.</p>
        <div class="list">${rows}</div>
        <div class="flex gap-8 mt-16 between">
          <button class="btn btn-ghost" id="r-cancel">Отмена</button>
          <button class="btn btn-accent" id="r-confirm">${icon("check", "icon-sm")} Подтвердить и добавить</button>
        </div>
      </div>`;

    $("#r-cancel", out).addEventListener("click", () => { out.innerHTML = ""; });
    $("#r-confirm", out).addEventListener("click", async () => {
      const items = $$(".list-item", out).map((row) => {
        const cat = $(".cat", row).value;
        return {
          item_id: +row.dataset.id,
          accepted: $(".acc", row).checked,
          category: cat === "Отброшено (не еда)" ? null : cat,
        };
      });
      try {
        const added = await API.confirmReceipt(receipt.id, items);
        toast(`Добавлено в холодильник: ${added.length}`);
        go("#/fridge");
      } catch (e) { toast(e.message, "err"); }
    });
  }

  // ---------------- Recipes ----------------
  async function viewRecipes() {
    reload = viewRecipes;
    const v = view();

    v.innerHTML = `
      <div class="page-head">
        <div><h1>Мои рецепты</h1><div class="sub">Все созданные блюда</div></div>
        <button class="btn btn-primary" id="new-dish">${icon("plus", "icon-sm")} Создать рецепт</button>
      </div>
      <div id="rec-list">${spinner()}</div>`;

    const list = $("#rec-list", v);

    const load = async () => {
      list.innerHTML = spinner();
      try {
        const dishes = await API.searchDishes("");
        if (!dishes.length) {
          list.innerHTML = `<div class="card">${emptyState("chef", "Рецептов пока нет — создайте первый")}</div>`;
          return;
        }
        const grid = document.createElement("div");
        grid.className = "grid grid-meals";
        dishes.forEach((d) => grid.appendChild(dishCard(d, load)));
        list.innerHTML = "";
        list.appendChild(grid);
      } catch (e) { list.innerHTML = emptyState("info", e.message); }
    };

    $("#new-dish", v).addEventListener("click", () => openCreateDish(load));
    load();
  }

  function dishCard(d, onRefresh) {
    const per = d.per_100g || {};
    const el = document.createElement("div");
    el.className = "card";
    el.style.cssText = "cursor:pointer;transition:box-shadow .15s,transform .15s";
    el.innerHTML = `
      <div class="section-title">
        <h3>${esc(d.name)}</h3>
        <div class="flex gap-8">
          <button class="icon-btn" data-edit aria-label="Изменить">${icon("edit", "icon-sm")}</button>
          <button class="icon-btn" data-del aria-label="Удалить">${icon("trash", "icon-sm")}</button>
        </div>
      </div>
      <div class="stat" style="margin-bottom:12px">
        <div class="v">${num(per.calories || 0)} <span class="k" style="font-size:14px">ккал</span></div>
        <div class="k">на 100 г · ${num(d.total_grams || 0)} г всего</div>
      </div>
      <div class="divider" style="margin:0 0 12px"></div>
      <div class="muted" style="font-size:12px;margin-bottom:4px">БЖУ на 100 г</div>
      <div class="flex gap-8" style="flex-wrap:wrap">
        <span class="chip">Б ${num(per.protein || 0)}</span>
        <span class="chip">Ж ${num(per.fat || 0)}</span>
        <span class="chip">У ${num(per.carbs || 0)}</span>
      </div>`;

    el.addEventListener("mouseenter", () => { el.style.boxShadow = "0 4px 16px rgba(0,0,0,.1)"; el.style.transform = "translateY(-2px)"; });
    el.addEventListener("mouseleave", () => { el.style.boxShadow = ""; el.style.transform = ""; });
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-edit],[data-del]")) return;
      openDishDetail(d);
    });
    el.querySelector("[data-edit]").addEventListener("click", (e) => {
      e.stopPropagation();
      openEditDish(d, onRefresh);
    });
    el.querySelector("[data-del]").addEventListener("click", async (e) => {
      e.stopPropagation();
      if (await confirmDialog(`Удалить рецепт «${d.name}»?`)) {
        try { await API.deleteDish(d.id); toast("Рецепт удалён"); if (onRefresh) onRefresh(); }
        catch (err) { toast(err.message, "err"); }
      }
    });
    return el;
  }

  function openDishDetail(d) {
    const per = d.per_100g || {};
    const ings = d.ingredients || [];
    openModal({
      title: d.name, width: "480px",
      render: (body) => {
        body.innerHTML = `
          ${d.description ? `<p class="muted" style="margin:0 0 14px">${esc(d.description)}</p>` : ""}
          <div class="card" style="background:var(--surface-2);padding:12px;margin-bottom:16px">
            <div class="flex between" style="margin-bottom:6px">
              <b>На 100 г</b><span class="kcal-tag">${num(per.calories || 0)} ккал</span>
            </div>
            <div class="flex gap-8" style="flex-wrap:wrap">
              <span class="chip">Б ${num(per.protein || 0)}</span>
              <span class="chip">Ж ${num(per.fat || 0)}</span>
              <span class="chip">У ${num(per.carbs || 0)}</span>
              ${d.total_grams ? `<span class="chip">${num(d.total_grams)} г всего</span>` : ""}
            </div>
          </div>
          ${ings.length ? `
            <div style="font-size:12px;font-weight:700;color:var(--ink-2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Ингредиенты</div>
            <div class="list">${ings.map((i) => `
              <div class="list-item">
                <span class="grow">${esc(i.name)}</span>
                <span class="muted" style="font-size:13px">${num(i.grams)} г</span>
              </div>`).join("")}
            </div>` : ""}`;
      },
      footer: (f, close) => {
        f.innerHTML = `<button class="btn btn-ghost" data-x>Закрыть</button>`;
        f.querySelector("[data-x]").addEventListener("click", close);
      },
    });
  }

  // -------- Reusable product search picker (returns chosen product via onPick) --------
  function productSearchField(container, onPick, fridgeMap = {}) {
    container.innerHTML = `
      <input class="input" data-q placeholder="Найти продукт…" autocomplete="off">
      <div data-res></div>`;
    const q = $("[data-q]", container), res = $("[data-res]", container);
    let timer = null;
    const search = async () => {
      const term = q.value.trim();
      if (!term) { res.innerHTML = ""; return; }
      const items = await API.searchProducts(term);
      const inFridge = items.filter((it) => fridgeMap[it.name.trim().toLowerCase()]);
      const notFridge = items.filter((it) => !fridgeMap[it.name.trim().toLowerCase()]);
      const sorted = [...inFridge, ...notFridge];
      res.innerHTML = sorted.length ? `<div class="search-results">${sorted.map((it) => {
        const fi = fridgeMap[it.name.trim().toLowerCase()];
        const badge = fi
          ? `<span style="color:var(--ok);font-size:12px;font-weight:600;white-space:nowrap">имеется · ${fi.quantity}${fi.unit === "g" ? "г" : fi.unit}</span>`
          : `<span class="cat">${num(it.calories)} ккал/100г</span>`;
        return `<div class="opt" data-id="${it.id}" data-name="${esc(it.name)}" data-cal="${it.calories}"
          data-p="${it.protein}" data-f="${it.fat}" data-c="${it.carbs}">
          <span>${esc(it.name)}</span>${badge}</div>`;
      }).join("")}</div>`
        : `<div class="hint" style="padding:6px">Ничего не найдено</div>`;
      $$(".opt", res).forEach((o) => o.addEventListener("click", () => {
        onPick({ id: +o.dataset.id, name: o.dataset.name, calories: +o.dataset.cal,
          protein: +o.dataset.p, fat: +o.dataset.f, carbs: +o.dataset.c });
        res.innerHTML = ""; q.value = "";
      }));
    };
    q.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(search, 250); });
  }

  // -------- Edit existing recipe --------
  async function openEditDish(d, onSaved) {
    const ingredients = (d.ingredients || []).map((i) => ({
      id: i.product_id, name: i.name, grams: i.grams,
      calories: 0, protein: 0, fat: 0, carbs: 0,
    }));
    let fridgeMap = {};
    try {
      const fi = await API.fridgeItems();
      fi.forEach((f) => { fridgeMap[f.name.trim().toLowerCase()] = f; });
    } catch (_) {}

    openModal({
      title: `Редактировать «${d.name}»`, width: "560px",
      render: (body) => {
        body.innerHTML = `
          <div class="field"><label>Название блюда</label><input class="input" id="d-name" value="${esc(d.name)}"></div>
          <div class="field"><label>Описание (необязательно)</label><input class="input" id="d-desc" value="${esc(d.description || "")}"></div>
          <div class="field"><label>Добавить ингредиент</label><div id="d-search"></div></div>
          <div class="divider"></div>
          <div id="d-list"></div>
          <div class="card" style="background:var(--surface-2);padding:12px;margin-top:8px" id="d-total"></div>`;
        const list = $("#d-list", body), total = $("#d-total", body);

        const redraw = () => {
          list.innerHTML = ingredients.length ? `<div class="list">${ingredients.map((ing, i) => `
            <div class="list-item">
              <div class="grow"><div class="name">${esc(ing.name)}</div></div>
              <input class="input ing-g" data-i="${i}" type="number" min="1" value="${ing.grams}" style="max-width:90px">
              <span class="muted" style="font-size:13px">г</span>
              <button class="icon-btn" data-rm="${i}">${icon("trash", "icon-sm")}</button>
            </div>`).join("")}</div>` : `<div class="muted" style="font-size:13px">Пока без ингредиентов</div>`;
          redrawTotals();
          $$(".ing-g", list).forEach((inp) => inp.addEventListener("input", () => { ingredients[+inp.dataset.i].grams = +inp.value || 0; redrawTotals(); }));
          $$("[data-rm]", list).forEach((b) => b.addEventListener("click", () => { ingredients.splice(+b.dataset.rm, 1); redraw(); }));
        };
        const redrawTotals = () => {
          let c = 0, p = 0, f = 0, u = 0, g = 0;
          ingredients.forEach((ing) => { const k = ing.grams / 100;
            c += (ing.calories||0) * k; p += (ing.protein||0) * k; f += (ing.fat||0) * k; u += (ing.carbs||0) * k; g += ing.grams; });
          const per = g ? 100 / g : 0;
          total.innerHTML = `<div class="flex between"><b>Итого (${num(g)} г)</b><span class="kcal-tag">${num(c)} ккал</span></div>
            <div class="muted" style="font-size:13px;margin-top:4px">На 100 г: ${num(c*per)} ккал · Б ${num(p*per)} · Ж ${num(f*per)} · У ${num(u*per)}</div>`;
        };

        productSearchField($("#d-search", body), (prod) => {
          const found = ingredients.find((x) => x.id === prod.id);
          if (found) found.grams += 100; else ingredients.push({ ...prod, grams: 100 });
          redraw();
        }, fridgeMap);
        redraw();
      },
      footer: (f, close) => {
        f.innerHTML = `<button class="btn btn-ghost" data-x>Отмена</button><button class="btn btn-primary" data-ok>Сохранить</button>`;
        f.querySelector("[data-x]").addEventListener("click", close);
        f.querySelector("[data-ok]").addEventListener("click", async () => {
          const name = document.getElementById("d-name").value.trim();
          if (!name) return toast("Укажите название блюда", "err");
          if (!ingredients.length) return toast("Добавьте хотя бы один ингредиент", "err");
          try {
            await API.updateDish(d.id, {
              name, description: document.getElementById("d-desc").value.trim(),
              ingredients: ingredients.map((i) => ({ product_id: i.id, grams: i.grams })),
            });
            toast("Рецепт обновлён"); close(); if (onSaved) onSaved();
          } catch (e) { toast(e.message, "err"); }
        });
      },
    });
  }

  // -------- Create own recipe (dish) --------
  async function openCreateDish(onSaved) {
    const ingredients = []; // {id,name,grams, per100...}
    let fridgeMap = {};
    try {
      const fridgeItems = await API.fridgeItems();
      fridgeItems.forEach((fi) => { fridgeMap[fi.name.trim().toLowerCase()] = fi; });
    } catch (_) {}
    openModal({
      title: "Новый рецепт", width: "560px",
      render: (body) => {
        body.innerHTML = `
          <div class="field"><label>Название блюда</label><input class="input" id="d-name" placeholder="Например, Паста болоньезе"></div>
          <div class="field"><label>Описание (необязательно)</label><input class="input" id="d-desc" placeholder="Короткое описание"></div>
          <div class="field"><label>Добавить ингредиент</label><div id="d-search"></div></div>
          <div class="divider"></div>
          <div id="d-list"></div>
          <div class="card" style="background:var(--surface-2);padding:12px;margin-top:8px" id="d-total"></div>`;
        const list = $("#d-list", body), total = $("#d-total", body);

        const redraw = () => {
          list.innerHTML = ingredients.length ? `<div class="list">${ingredients.map((ing, i) => `
            <div class="list-item">
              <div class="grow"><div class="name">${esc(ing.name)}</div>
                <div class="meta">${num(ing.calories)} ккал/100г</div></div>
              <input class="input ing-g" data-i="${i}" type="number" min="1" value="${ing.grams}" style="max-width:90px">
              <span class="muted" style="font-size:13px">г</span>
              <button class="icon-btn" data-rm="${i}" aria-label="Убрать">${icon("trash", "icon-sm")}</button>
            </div>`).join("")}</div>` : `<div class="muted" style="font-size:13px">Пока без ингредиентов</div>`;

          let c = 0, p = 0, f = 0, u = 0, g = 0;
          ingredients.forEach((ing) => { const k = ing.grams / 100;
            c += ing.calories * k; p += ing.protein * k; f += ing.fat * k; u += ing.carbs * k; g += ing.grams; });
          const per = g ? 100 / g : 0;
          total.innerHTML = `<div class="flex between"><b>Итого блюдо (${num(g)} г)</b><span class="kcal-tag">${num(c)} ккал</span></div>
            <div class="muted" style="font-size:13px;margin-top:4px">На 100 г: ${num(c * per)} ккал · Б ${num(p * per)} · Ж ${num(f * per)} · У ${num(u * per)}</div>`;

          $$(".ing-g", list).forEach((inp) => inp.addEventListener("input", () => {
            ingredients[+inp.dataset.i].grams = +inp.value || 0; redrawTotalsOnly();
          }));
          $$("[data-rm]", list).forEach((b) => b.addEventListener("click", () => {
            ingredients.splice(+b.dataset.rm, 1); redraw();
          }));
        };
        const redrawTotalsOnly = () => {
          let c = 0, p = 0, f = 0, u = 0, g = 0;
          ingredients.forEach((ing) => { const k = ing.grams / 100;
            c += ing.calories * k; p += ing.protein * k; f += ing.fat * k; u += ing.carbs * k; g += ing.grams; });
          const per = g ? 100 / g : 0;
          total.innerHTML = `<div class="flex between"><b>Итого блюдо (${num(g)} г)</b><span class="kcal-tag">${num(c)} ккал</span></div>
            <div class="muted" style="font-size:13px;margin-top:4px">На 100 г: ${num(c * per)} ккал · Б ${num(p * per)} · Ж ${num(f * per)} · У ${num(u * per)}</div>`;
        };

        productSearchField($("#d-search", body), (prod) => {
          const found = ingredients.find((x) => x.id === prod.id);
          if (found) found.grams += 100; else ingredients.push({ ...prod, grams: 100 });
          redraw();
        }, fridgeMap);
        redraw();
      },
      footer: (f, close) => {
        f.innerHTML = `<button class="btn btn-ghost" data-x>Отмена</button><button class="btn btn-primary" data-ok>Сохранить рецепт</button>`;
        f.querySelector("[data-x]").addEventListener("click", close);
        f.querySelector("[data-ok]").addEventListener("click", async () => {
          const name = document.getElementById("d-name").value.trim();
          if (!name) return toast("Укажите название блюда", "err");
          if (!ingredients.length) return toast("Добавьте хотя бы один ингредиент", "err");
          try {
            await API.createDish({
              name, description: document.getElementById("d-desc").value.trim(),
              ingredients: ingredients.map((i) => ({ product_id: i.id, grams: i.grams })),
            });
            toast("Рецепт создан"); close(); if (onSaved) onSaved();
          } catch (e) { toast(e.message, "err"); }
        });
      },
    });
  }

  // ---------------- Settings ----------------
  async function viewSettings() {
    reload = viewSettings;
    const v = view(); v.innerHTML = spinner();
    let t, hist;
    try { await refreshTargets(); t = state.targets; hist = await API.weightHistory(); }
    catch (e) { v.innerHTML = emptyState("info", e.message); return; }

    v.innerHTML = `
      <div class="page-head"><div><h1>Профиль и норма</h1>
        <div class="sub">${esc(state.user.email)}</div></div>
        <button class="btn btn-danger" id="logout">${icon("logout", "icon-sm")} Выйти</button></div>

      <div class="card" style="margin-bottom:18px">
        <div class="section-title"><h2>Текущая норма КБЖУ</h2>${t.is_manual ? `<span class="badge soon">ручной лимит</span>` : `<span class="badge ok">авторасчёт</span>`}</div>
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:14px">
          <div class="stat"><div class="v">${num(t.calories)}</div><div class="k">ккал/сутки</div></div>
          <div class="stat"><div class="v" style="color:var(--m-protein)">${num(t.protein_g)}</div><div class="k">белки, г</div></div>
          <div class="stat"><div class="v" style="color:var(--m-fat)">${num(t.fat_g)}</div><div class="k">жиры, г</div></div>
          <div class="stat"><div class="v" style="color:var(--m-carb)">${num(t.carb_g)}</div><div class="k">углеводы, г</div></div>
          <div class="stat"><div class="v">${num(t.bmr)}</div><div class="k">BMR</div></div>
          <div class="stat"><div class="v">${num(t.tdee)}</div><div class="k">TDEE</div></div>
        </div>
      </div>

      <div class="grid grid-2">
        <div class="card">
          <h3 style="margin-bottom:12px">${icon("weight", "icon-sm")} Изменить вес</h3>
          <form id="w-form"><div class="field"><label>Текущий вес, кг</label>
            <input class="input" name="weight_kg" type="number" step="0.1" min="25" max="350" value="${state.profile.weight_kg}"></div>
            <button class="btn btn-primary btn-block">Пересчитать норму</button></form>
        </div>
        <div class="card">
          <h3 style="margin-bottom:12px">${icon("flame", "icon-sm")} Ручной лимит калорий</h3>
          <form id="c-form"><div class="field"><label>Калорий в сутки</label>
            <input class="input" name="calories" type="number" step="10" min="1000" max="8000" value="${Math.round(t.calories)}"></div>
            <span class="hint">БЖУ пересчитаются пропорционально</span>
            <button class="btn btn-accent btn-block mt-8">Применить</button></form>
        </div>
      </div>

      <div class="card" style="margin-top:18px">
        <h3 style="margin-bottom:4px">Своя норма БЖУ</h3>
        <p class="hint" style="margin-top:0">Задайте граммы вручную — калории пересчитаются автоматически (4/9/4 ккал на грамм).</p>
        <form id="macro-form">
          <div class="row">
            <div class="field"><label style="color:var(--m-protein)">Белки, г</label><input class="input" name="protein_g" type="number" step="1" min="0" max="600" value="${Math.round(t.protein_g)}"></div>
            <div class="field"><label style="color:var(--m-fat)">Жиры, г</label><input class="input" name="fat_g" type="number" step="1" min="0" max="400" value="${Math.round(t.fat_g)}"></div>
            <div class="field"><label style="color:var(--m-carb)">Углеводы, г</label><input class="input" name="carb_g" type="number" step="1" min="0" max="1200" value="${Math.round(t.carb_g)}"></div>
          </div>
          <div class="flex between items-center mt-8">
            <span class="hint" id="macro-cal">≈ ${num(t.calories)} ккал</span>
            <button class="btn btn-primary">Сохранить БЖУ</button>
          </div>
        </form>
      </div>

      <div class="card" style="margin-top:18px">
        <div class="section-title"><h3>Распределение по приёмам</h3>
          <button class="btn btn-ghost btn-sm" id="meal-add">${icon("plus", "icon-sm")} Приём</button></div>
        <div id="meal-rows"></div>
        <span class="hint">Сумма долей должна равняться 100%.</span>
        <button class="btn btn-primary mt-16" id="meal-save">Сохранить план</button>
      </div>

      <div class="card" style="margin-top:18px">
        <h3 style="margin-bottom:12px">История веса</h3>
        <div class="list">${hist.length ? hist.map((h) => `<div class="list-item"><div class="grow name">${num(h.weight_kg, 1)} кг</div>
          <span class="meta">${new Date(h.recorded_at).toLocaleDateString("ru-RU")}</span></div>`).join("") : `<div class="muted">Нет записей</div>`}</div>
      </div>`;

    $("#logout", v).addEventListener("click", () => { API.Auth.logout(); go("#/login"); });

    $("#w-form", v).addEventListener("submit", async (e) => {
      e.preventDefault();
      try { await API.updateWeight(+UI.formValues(e.target).weight_kg); toast("Норма пересчитана"); viewSettings(); }
      catch (err) { toast(err.message, "err"); }
    });
    $("#c-form", v).addEventListener("submit", async (e) => {
      e.preventDefault();
      try { await API.overrideCalories(+UI.formValues(e.target).calories); toast("Лимит обновлён"); viewSettings(); }
      catch (err) { toast(err.message, "err"); }
    });

    const macroForm = $("#macro-form", v), macroCal = $("#macro-cal", v);
    const recalcCal = () => {
      const m = UI.formValues(macroForm);
      const cal = (+m.protein_g || 0) * 4 + (+m.fat_g || 0) * 9 + (+m.carb_g || 0) * 4;
      macroCal.textContent = "≈ " + num(cal) + " ккал";
    };
    $$("input", macroForm).forEach((i) => i.addEventListener("input", recalcCal));
    macroForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const m = UI.formValues(e.target);
      try {
        await API.overrideMacros({ protein_g: +m.protein_g, fat_g: +m.fat_g, carb_g: +m.carb_g });
        toast("БЖУ обновлены"); viewSettings();
      } catch (err) { toast(err.message, "err"); }
    });

    // --- Редактор плана приёмов ---
    const rowsEl = $("#meal-rows", v);
    let plan = state.meals.map((m) => ({ name: m.name, share: Math.round(m.calorie_share * 100) }));
    const drawRows = () => {
      rowsEl.innerHTML = plan.map((p, i) => `
        <div class="row" data-i="${i}" style="align-items:flex-end">
          <div class="field" style="flex:2"><label>Название</label><input class="input nm" value="${esc(p.name)}"></div>
          <div class="field" style="flex:1"><label>Доля, %</label><input class="input sh" type="number" min="1" max="100" value="${p.share}"></div>
          <button class="icon-btn" data-rm style="margin-bottom:14px" aria-label="Удалить приём">${icon("trash", "icon-sm")}</button>
        </div>`).join("");
      $$("[data-rm]", rowsEl).forEach((b) => b.addEventListener("click", () => {
        plan.splice(+b.closest("[data-i]").dataset.i, 1); syncFromInputs(); drawRows();
      }));
    };
    const syncFromInputs = () => {
      $$("[data-i]", rowsEl).forEach((row) => {
        const i = +row.dataset.i;
        if (plan[i]) { plan[i].name = $(".nm", row).value; plan[i].share = +$(".sh", row).value; }
      });
    };
    $("#meal-add", v).addEventListener("click", () => { syncFromInputs(); plan.push({ name: "Приём " + (plan.length + 1), share: 10 }); drawRows(); });
    $("#meal-save", v).addEventListener("click", async () => {
      syncFromInputs();
      const sum = plan.reduce((s, p) => s + p.share, 0);
      if (Math.abs(sum - 100) > 1) return toast(`Сумма долей = ${sum}%, нужно 100%`, "err");
      try {
        await API.setMealPlan(plan.map((p) => ({ name: p.name, share: p.share / 100 })));
        toast("План сохранён"); viewSettings();
      } catch (e) { toast(e.message, "err"); }
    });
    drawRows();
  }

  // ---------------- Start ----------------
  boot();
})();
