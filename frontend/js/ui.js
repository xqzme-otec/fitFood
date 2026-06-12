/* DOM-хелперы, тосты, модалки и переиспользуемые компоненты. */
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // Числа: убираем лишние нули, разделяем тысячи неразрывным пробелом.
  function num(v, digits = 0) {
    if (v == null || isNaN(v)) return "0";
    const n = Number(v);
    const r = digits ? Math.round(n * 10 ** digits) / 10 ** digits : Math.round(n);
    return r.toLocaleString("ru-RU");
  }

  function setHTML(node, html) { node.innerHTML = html; return node; }

  // --- Тосты ---
  function toast(message, type = "ok", timeout = 3200) {
    const root = document.getElementById("toast-root");
    const t = document.createElement("div");
    t.className = "toast " + (type === "err" ? "err" : type === "info" ? "" : "ok");
    t.innerHTML = window.icon(type === "err" ? "info" : "check", "icon-sm") + "<span>" + esc(message) + "</span>";
    root.appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity .25s"; setTimeout(() => t.remove(), 260); }, timeout);
  }

  // --- Модальное окно ---
  // openModal({ title, body(node), footer(node, close), onMount, maxWidth })
  function openModal({ title, render, footer, width }) {
    const root = document.getElementById("modal-root");
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    const close = () => { overlay.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);

    const modal = document.createElement("div");
    modal.className = "modal";
    if (width) modal.style.maxWidth = width;
    modal.innerHTML =
      `<header><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="Закрыть">${window.icon("close")}</button></header>` +
      `<div class="body"></div>` +
      `<footer></footer>`;
    overlay.appendChild(modal);
    overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) close(); });
    modal.querySelector("[data-close]").addEventListener("click", close);

    const body = modal.querySelector(".body");
    const foot = modal.querySelector("footer");
    if (render) render(body, close);
    if (footer) footer(foot, close); else foot.remove();

    root.appendChild(overlay);
    const firstInput = body.querySelector("input, select, textarea, button");
    if (firstInput) setTimeout(() => firstInput.focus(), 30);
    return { close, modal, body };
  }

  function confirmDialog(message, { confirmText = "Удалить", danger = true } = {}) {
    return new Promise((resolve) => {
      openModal({
        title: "Подтверждение", width: "400px",
        render: (b) => { b.innerHTML = `<p style="margin:0">${esc(message)}</p>`; },
        footer: (f, close) => {
          f.innerHTML = `<button class="btn btn-ghost" data-no>Отмена</button>
            <button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-yes>${esc(confirmText)}</button>`;
          f.querySelector("[data-no]").addEventListener("click", () => { close(); resolve(false); });
          f.querySelector("[data-yes]").addEventListener("click", () => { close(); resolve(true); });
        },
      });
    });
  }

  // --- Компоненты ---
  function macroBar({ label, cls, consumed, limit, unit = "г" }) {
    const lim = Math.max(limit, 0.0001);
    const pct = Math.min((consumed / lim) * 100, 100);
    const over = consumed > limit * 1.001;
    return `<div class="macrobar">
      <div class="top"><span>${esc(label)}</span><span><b>${num(consumed)}</b> / ${num(limit)} ${unit}</span></div>
      <div class="track ${cls} ${over ? "over" : ""}"><i style="width:${pct}%"></i></div>
    </div>`;
  }

  function calorieRing({ consumed, target }) {
    const pct = Math.min((consumed / Math.max(target, 1)) * 100, 100);
    const remaining = Math.round(target - consumed);
    const color = consumed > target ? "var(--danger)" : "var(--primary)";
    return `<div class="ring" style="--p:${pct};--c:${color}">
      <div class="bg"></div>
      <div class="hole">
        <div class="big">${num(consumed)}</div>
        <div class="sub">из ${num(target)} ккал</div>
        <div class="sub" style="margin-top:4px;color:${remaining < 0 ? "var(--danger)" : "var(--ok)"}">
          ${remaining < 0 ? "перебор " + num(-remaining) : "осталось " + num(remaining)}
        </div>
      </div>
    </div>`;
  }

  function badgeExpiry(status, daysLeft) {
    const map = {
      ok: ["ok", "годен"], soon: ["soon", "скоро истекает"],
      expired: ["expired", "просрочен"], unknown: ["unknown", "срок неизвестен"],
    };
    const [cls, txt] = map[status] || map.unknown;
    let detail = "";
    if (status === "ok" && daysLeft != null) detail = ` · ${daysLeft} дн.`;
    if (status === "soon" && daysLeft != null) detail = ` · ${daysLeft} дн.`;
    if (status === "expired" && daysLeft != null) detail = ` · ${-daysLeft} дн. назад`;
    return `<span class="badge ${cls}">${window.icon("clock", "icon-sm")}${txt}${detail}</span>`;
  }

  function emptyState(iconName, text) {
    return `<div class="empty">${window.icon(iconName)}<div>${esc(text)}</div></div>`;
  }

  function spinner() { return `<div class="loading-wrap"><div class="spinner"></div></div>`; }

  // Безопасное чтение значения формы
  function formValues(scope) {
    const out = {};
    $$("[name]", scope).forEach((el) => {
      if (el.type === "checkbox") out[el.name] = el.checked;
      else out[el.name] = el.value;
    });
    return out;
  }

  window.UI = {
    $, $$, esc, num, setHTML, toast, openModal, confirmDialog,
    macroBar, calorieRing, badgeExpiry, emptyState, spinner, formValues,
  };
})();
