/* FitFood SPA — роутер, оболочка и экраны. */
(function () {
  const { $, $$, esc, num, toast, openModal, confirmDialog,
    macroBar, calorieRing, badgeExpiry, emptyState, spinner } = UI;

  const app = document.getElementById("app");
  const state = { user: null, profile: null, targets: null, meals: [], today: todayStr() };
  let reload = () => {};
  let fridgeCat = null; // активная категория-вкладка в холодильнике

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
      "#/recipes": viewRecipes, "#/settings": viewSettings,
    }[route] || viewToday;
    renderShell(route);
    inner();
  }
  window.addEventListener("hashchange", render);

  // ---------------- Shell ----------------
  const NAV = [
    ["#/today", "home", "Сегодня"],
    ["#/fridge", "fridge", "Холодильник"],
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
    openModal({
      title: `Добавить в «${slot.name}»`,
      render: (body) => {
        body.innerHTML = `
          <div class="seg" id="m-seg"><button class="active" data-mode="product">Продукт</button><button data-mode="dish">Блюдо</button></div>
          <div class="field"><label>Поиск</label>
            <input class="input" id="m-q" placeholder="Например, куриное филе" autocomplete="off">
            <div id="m-res"></div></div>
          <div id="m-pick"></div>`;
        const q = $("#m-q", body), res = $("#m-res", body), pick = $("#m-pick", body);

        $("#m-seg", body).addEventListener("click", (e) => {
          const b = e.target.closest("[data-mode]"); if (!b) return;
          mode = b.dataset.mode; selected = null; pick.innerHTML = ""; res.innerHTML = "";
          $$("#m-seg button", body).forEach((x) => x.classList.toggle("active", x === b));
          if (q.value.trim()) doSearch();
        });

        const doSearch = async () => {
          const term = q.value.trim();
          const items = mode === "product" ? await API.searchProducts(term) : await API.searchDishes(term);
          res.innerHTML = items.length ? `<div class="search-results">${items.map((it) => {
            const per = mode === "product" ? it : it.per_100g;
            return `<div class="opt" data-id="${it.id}" data-name="${esc(it.name)}"
              data-cal="${per.calories}" data-p="${per.protein}" data-f="${per.fat}" data-c="${per.carbs}">
              <span>${esc(it.name)}</span><span class="cat">${num(per.calories)} ккал/100г</span></div>`;
          }).join("")}</div>` : `<div class="hint" style="padding:6px">Ничего не найдено</div>`;
          $$(".opt", res).forEach((o) => o.addEventListener("click", () => {
            selected = { id: +o.dataset.id, name: o.dataset.name,
              per100: { calories: +o.dataset.cal, protein: +o.dataset.p, fat: +o.dataset.f, carbs: +o.dataset.c } };
            res.innerHTML = ""; q.value = selected.name; renderPick();
          }));
        };
        q.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(doSearch, 250); });

        function renderPick() {
          pick.innerHTML = `
            <div class="divider"></div>
            <div class="field"><label>Количество, г/мл</label>
              <input class="input" id="m-amt" type="number" min="1" step="1" value="100"></div>
            <div class="card" style="background:var(--surface-2);padding:12px" id="m-prev"></div>`;
          const amt = $("#m-amt", pick), prev = $("#m-prev", pick);
          const upd = () => {
            const f = (+amt.value || 0) / 100;
            prev.innerHTML = `<div class="flex between"><b>${esc(selected.name)}</b><span class="kcal-tag">${num(selected.per100.calories * f)} ккал</span></div>
              <div class="muted" style="font-size:13px;margin-top:4px">Б ${num(selected.per100.protein * f)} · Ж ${num(selected.per100.fat * f)} · У ${num(selected.per100.carbs * f)}</div>`;
          };
          amt.addEventListener("input", upd); upd();
        }
      },
      footer: (f, close) => {
        f.innerHTML = `<button class="btn btn-ghost" data-x>Отмена</button><button class="btn btn-primary" data-ok>Добавить</button>`;
        f.querySelector("[data-x]").addEventListener("click", close);
        f.querySelector("[data-ok]").addEventListener("click", async () => {
          if (!selected) return toast("Выберите продукт или блюдо", "err");
          const amount = +document.getElementById("m-amt").value;
          if (!amount || amount <= 0) return toast("Укажите количество", "err");
          const payload = { meal_slot_id: slot.meal_slot_id || slot.id, amount, entry_date: state.today };
          payload[mode === "product" ? "product_id" : "dish_id"] = selected.id;
          try { await API.addEntry(payload); toast("Добавлено в дневник"); close(); viewToday(); }
          catch (e) { toast(e.message, "err"); }
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

    $("#add", v).addEventListener("click", openAddFridge);
    $("#scan", v).addEventListener("click", () => go("#/receipt"));

    const wrap = $("#groups", v);
    if (!groups.length) { wrap.innerHTML = `<div class="card">${emptyState("fridge", "Холодильник пуст. Добавьте продукт или отсканируйте чек.")}</div>`; return; }

    const ALL_CAT = "__all__";
    const allItems = groups.flatMap((g) => g.items);
    // Виртуальная группа «Все» + реальные группы
    const allGroups = [{ category: ALL_CAT, items: allItems }, ...groups];

    // Активная вкладка (если прежняя пропала — «Все»)
    if (!fridgeCat || !allGroups.some((g) => g.category === fridgeCat)) fridgeCat = ALL_CAT;
    const active = allGroups.find((g) => g.category === fridgeCat) || allGroups[0];

    wrap.innerHTML = `
      <div class="tabs" id="cat-tabs"></div>
      <div class="grid grid-meals" id="cat-items" style="margin-top:18px"></div>`;
    const tabs = $("#cat-tabs", wrap);
    tabs.innerHTML = allGroups.map((g) => {
      const label = g.category === ALL_CAT ? "Все" : g.category;
      return `<button class="tab ${g.category === fridgeCat ? "active" : ""}" data-cat="${esc(g.category)}">
        ${esc(label)} <span class="cnt">${g.items.length}</span></button>`;
    }).join("");
    $$(".tab", tabs).forEach((b) => b.addEventListener("click", () => { fridgeCat = b.dataset.cat; viewFridge(); }));

    const grid = $("#cat-items", wrap);
    active.items.forEach((it) => grid.appendChild(fridgeCard(it)));
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
        <div><h1>Рекомендации рецептов</h1><div class="sub">По остатку КБЖУ и содержимому холодильника</div></div>
        <div class="flex gap-12 items-center" style="flex-wrap:wrap">
          <button class="btn btn-primary" id="new-dish">${icon("plus", "icon-sm")} Создать рецепт</button>
          <div class="field" style="margin:0;min-width:200px">
            <label>Для приёма</label>
            <select class="select" id="rec-slot">
              <option value="">Сейчас (авто)</option>
              ${state.meals.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join("")}
            </select>
          </div>
        </div>
      </div>
      <div id="rec-list">${spinner()}</div>`;

    const sel = $("#rec-slot", v), list = $("#rec-list", v);
    const load = async () => {
      list.innerHTML = spinner();
      try {
        const recs = await API.recommendations(sel.value || null);
        list.innerHTML = recs.length
          ? `<div class="grid grid-meals">${recs.map((r) => recCard(r)).join("")}</div>`
          : `<div class="card">${emptyState("chef", "Подходящих рецептов нет — пополните холодильник")}</div>`;
        wireRecCards(list, async (dishId, grams) => {
          if (!sel.value) return toast("Выберите конкретный приём, чтобы добавить", "err");
          try {
            await API.addEntry({ meal_slot_id: +sel.value, dish_id: dishId, amount: grams, entry_date: state.today });
            toast("Добавлено в дневник");
          } catch (e) { toast(e.message, "err"); }
        });
      } catch (e) { list.innerHTML = emptyState("info", e.message); }
    };
    sel.addEventListener("change", load); load();
    $("#new-dish", v).addEventListener("click", () => openCreateDish(load));
  }

  // -------- Reusable product search picker (returns chosen product via onPick) --------
  function productSearchField(container, onPick) {
    container.innerHTML = `
      <input class="input" data-q placeholder="Найти продукт…" autocomplete="off">
      <div data-res></div>`;
    const q = $("[data-q]", container), res = $("[data-res]", container);
    let timer = null;
    const search = async () => {
      const items = await API.searchProducts(q.value.trim());
      res.innerHTML = items.length ? `<div class="search-results">${items.map((it) =>
        `<div class="opt" data-id="${it.id}" data-name="${esc(it.name)}" data-cal="${it.calories}"
          data-p="${it.protein}" data-f="${it.fat}" data-c="${it.carbs}">
          <span>${esc(it.name)}</span><span class="cat">${num(it.calories)} ккал/100г</span></div>`).join("")}</div>`
        : `<div class="hint" style="padding:6px">Ничего не найдено</div>`;
      $$(".opt", res).forEach((o) => o.addEventListener("click", () => {
        onPick({ id: +o.dataset.id, name: o.dataset.name, calories: +o.dataset.cal,
          protein: +o.dataset.p, fat: +o.dataset.f, carbs: +o.dataset.c });
        res.innerHTML = ""; q.value = "";
      }));
    };
    q.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(search, 250); });
  }

  // -------- Create own recipe (dish) --------
  function openCreateDish(onSaved) {
    const ingredients = []; // {id,name,grams, per100...}
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
        });
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
