(function () {
  "use strict";

  /* ---------- storage ---------- */
  const STORAGE_KEY = "cf_data_v1";

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { cards: [], expenses: [] };
      const parsed = JSON.parse(raw);
      return {
        cards: Array.isArray(parsed.cards) ? parsed.cards : [],
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      };
    } catch (e) {
      console.error("Falha ao ler dados salvos", e);
      return { cards: [], expenses: [] };
    }
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ cards: state.cards, expenses: state.expenses }));
  }

  /* ---------- state ---------- */
  const state = Object.assign({ view: "dashboard", currentMonth: getMonthKey(new Date()), filterCard: "" }, loadData());

  const COLORS = ["#2563eb", "#7c3aed", "#db2777", "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#0891b2", "#475569", "#111827"];
  const CATEGORIES = ["Alimentação", "Transporte", "Moradia", "Lazer", "Saúde", "Compras", "Contas", "Outros"];

  let selectedCardColor = COLORS[0];

  /* ---------- helpers ---------- */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function getMonthKey(date) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
  }

  function shiftMonthKey(key, delta) {
    const [y, m] = key.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return getMonthKey(d);
  }

  function monthLabel(key) {
    const [y, m] = key.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(d);
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  function formatCurrency(value) {
    return (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function formatDate(iso) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  function todayISO() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function cardById(id) {
    return state.cards.find((c) => c.id === id);
  }

  function expensesOfMonth(monthKey) {
    return state.expenses.filter((e) => e.date.slice(0, 7) === monthKey);
  }

  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add("hidden"), 2200);
  }

  /* ---------- DOM refs ---------- */
  const $ = (id) => document.getElementById(id);

  const pageTitle = $("pageTitle");
  const monthLabelEl = $("monthLabel");
  const monthSwitch = document.querySelector(".month-switch");
  const fab = $("fab");

  const VIEW_TITLES = { dashboard: "Início", cards: "Cartões", expenses: "Gastos", settings: "Mais" };

  /* ---------- navigation ---------- */
  function setView(view) {
    state.view = view;
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    $("view-" + view).classList.add("active");
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    pageTitle.textContent = VIEW_TITLES[view];
    monthSwitch.style.visibility = view === "dashboard" || view === "expenses" ? "visible" : "hidden";
    fab.style.display = view === "settings" ? "none" : "flex";
    renderAll();
  }

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  });

  $("prevMonth").addEventListener("click", () => {
    state.currentMonth = shiftMonthKey(state.currentMonth, -1);
    renderAll();
  });
  $("nextMonth").addEventListener("click", () => {
    state.currentMonth = shiftMonthKey(state.currentMonth, 1);
    renderAll();
  });

  fab.addEventListener("click", () => {
    if (state.view === "cards") {
      openCardModal();
    } else if (state.cards.length === 0) {
      toast("Cadastre um cartão primeiro");
      setView("cards");
      openCardModal();
    } else {
      openExpenseModal();
    }
  });

  /* ---------- rendering ---------- */
  function renderAll() {
    monthLabelEl.textContent = monthLabel(state.currentMonth);
    renderDashboard();
    renderCards();
    renderExpenses();
  }

  function renderDashboard() {
    const monthExpenses = expensesOfMonth(state.currentMonth);
    const total = monthExpenses.reduce((s, e) => s + e.amount, 0);
    $("totalMonth").textContent = formatCurrency(total);
    $("countMonth").textContent = String(monthExpenses.length);

    // by card
    const byCard = new Map();
    monthExpenses.forEach((e) => byCard.set(e.cardId, (byCard.get(e.cardId) || 0) + e.amount));
    const cardsList = $("cardsSummaryList");
    cardsList.innerHTML = "";
    const cardsWithTotals = state.cards
      .map((c) => ({ card: c, total: byCard.get(c.id) || 0 }))
      .sort((a, b) => b.total - a.total);

    $("cardsSummaryEmpty").hidden = state.cards.length > 0;

    cardsWithTotals.forEach(({ card, total: t }) => {
      const row = document.createElement("div");
      row.className = "row-card";
      row.addEventListener("click", () => openCardModal(card.id));
      const pct = card.limit ? Math.min(100, (t / card.limit) * 100) : null;
      row.innerHTML = `
        <div class="swatch" style="background:${card.color}"></div>
        <div class="row-main">
          <div class="row-title">${escapeHtml(card.name)}</div>
          <div class="row-sub">${card.limit ? `Limite ${formatCurrency(card.limit)}` : "Sem limite definido"}</div>
          ${pct !== null ? `<div class="progress-bar ${pct >= 100 ? "over" : ""}"><div style="width:${pct}%"></div></div>` : ""}
        </div>
        <div class="row-value">${formatCurrency(t)}</div>
      `;
      cardsList.appendChild(row);
    });

    // by category
    const byCat = new Map();
    monthExpenses.forEach((e) => byCat.set(e.category, (byCat.get(e.category) || 0) + e.amount));
    const catList = $("categorySummaryList");
    catList.innerHTML = "";
    const catEntries = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
    $("categorySummaryEmpty").hidden = catEntries.length > 0;
    catEntries.forEach(([cat, amt]) => {
      const pct = total ? (amt / total) * 100 : 0;
      const row = document.createElement("div");
      row.className = "row-card";
      row.innerHTML = `
        <div class="row-main">
          <div class="row-title">${escapeHtml(cat)}</div>
          <div class="progress-bar"><div style="width:${pct}%"></div></div>
        </div>
        <div class="row-value">${formatCurrency(amt)}</div>
      `;
      catList.appendChild(row);
    });

    // upcoming due dates
    const dueList = $("dueList");
    dueList.innerHTML = "";
    const todayDay = new Date().getDate();
    const withDue = state.cards
      .filter((c) => c.dueDay)
      .map((c) => {
        let diff = c.dueDay - todayDay;
        if (diff < 0) diff += 31;
        return { card: c, diff };
      })
      .sort((a, b) => a.diff - b.diff);

    $("dueEmpty").hidden = withDue.length > 0;
    withDue.forEach(({ card }) => {
      const amt = byCard.get(card.id) || 0;
      const row = document.createElement("div");
      row.className = "row-card";
      row.addEventListener("click", () => openCardModal(card.id));
      row.innerHTML = `
        <div class="swatch" style="background:${card.color}"></div>
        <div class="row-main">
          <div class="row-title">${escapeHtml(card.name)}</div>
          <div class="row-sub">Vence dia ${card.dueDay}</div>
        </div>
        <div class="row-value">${formatCurrency(amt)}</div>
      `;
      dueList.appendChild(row);
    });
  }

  function renderCards() {
    const list = $("cardsList");
    list.innerHTML = "";
    $("cardsEmpty").hidden = state.cards.length > 0;
    state.cards.forEach((card) => {
      const monthTotal = expensesOfMonth(state.currentMonth)
        .filter((e) => e.cardId === card.id)
        .reduce((s, e) => s + e.amount, 0);
      const row = document.createElement("div");
      row.className = "row-card";
      row.addEventListener("click", () => openCardModal(card.id));
      const subParts = [];
      if (card.closingDay) subParts.push(`Fecha dia ${card.closingDay}`);
      if (card.dueDay) subParts.push(`Vence dia ${card.dueDay}`);
      row.innerHTML = `
        <div class="swatch" style="background:${card.color}"></div>
        <div class="row-main">
          <div class="row-title">${escapeHtml(card.name)}</div>
          <div class="row-sub">${subParts.join(" · ") || "Sem datas definidas"}</div>
        </div>
        <div class="row-value">${formatCurrency(monthTotal)}</div>
      `;
      list.appendChild(row);
    });
  }

  function renderExpenses() {
    // refresh filter options
    const filterSel = $("filterCard");
    const prevVal = filterSel.value;
    filterSel.innerHTML = '<option value="">Todos os cartões</option>' +
      state.cards.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
    filterSel.value = state.cards.some((c) => c.id === prevVal) ? prevVal : "";
    state.filterCard = filterSel.value;

    let items = expensesOfMonth(state.currentMonth);
    if (state.filterCard) items = items.filter((e) => e.cardId === state.filterCard);
    items = items.slice().sort((a, b) => (a.date < b.date ? 1 : -1));

    const list = $("expensesList");
    list.innerHTML = "";
    $("expensesEmpty").hidden = items.length > 0;
    items.forEach((exp) => {
      const card = cardById(exp.cardId);
      const row = document.createElement("div");
      row.className = "row-card";
      row.addEventListener("click", () => openExpenseModal(exp.id));
      row.innerHTML = `
        <div class="swatch" style="background:${card ? card.color : "#999"}"></div>
        <div class="row-main">
          <div class="row-title">${escapeHtml(exp.description)}</div>
          <div class="row-sub">${card ? escapeHtml(card.name) : "Cartão removido"} · ${exp.category} · ${formatDate(exp.date)}</div>
        </div>
        <div class="row-value">${formatCurrency(exp.amount)}</div>
      `;
      list.appendChild(row);
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  $("filterCard").addEventListener("change", (e) => {
    state.filterCard = e.target.value;
    renderExpenses();
  });

  /* ---------- modal: card ---------- */
  const modalCard = $("modalCard");
  const formCard = $("formCard");

  function buildColorPicker() {
    const picker = $("colorPicker");
    picker.innerHTML = "";
    COLORS.forEach((color) => {
      const dot = document.createElement("div");
      dot.className = "color-dot" + (color === selectedCardColor ? " selected" : "");
      dot.style.background = color;
      dot.addEventListener("click", () => {
        selectedCardColor = color;
        picker.querySelectorAll(".color-dot").forEach((d) => d.classList.remove("selected"));
        dot.classList.add("selected");
      });
      picker.appendChild(dot);
    });
  }

  function openCardModal(editId) {
    const editing = editId ? cardById(editId) : null;
    $("cardModalTitle").textContent = editing ? "Editar cartão" : "Novo cartão";
    $("cardId").value = editing ? editing.id : "";
    $("cardName").value = editing ? editing.name : "";
    $("cardLimit").value = editing && editing.limit ? editing.limit : "";
    $("cardClosing").value = editing && editing.closingDay ? editing.closingDay : "";
    $("cardDue").value = editing && editing.dueDay ? editing.dueDay : "";
    selectedCardColor = editing ? editing.color : COLORS[state.cards.length % COLORS.length];
    buildColorPicker();
    $("cardDeleteBtn").hidden = !editing;
    modalCard.classList.remove("hidden");
    setTimeout(() => $("cardName").focus(), 50);
  }

  function closeCardModal() {
    modalCard.classList.add("hidden");
  }

  formCard.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = $("cardId").value || uid();
    const name = $("cardName").value.trim();
    if (!name) return;
    const limit = $("cardLimit").value ? parseFloat($("cardLimit").value) : null;
    const closingDay = $("cardClosing").value ? parseInt($("cardClosing").value, 10) : null;
    const dueDay = $("cardDue").value ? parseInt($("cardDue").value, 10) : null;

    const existingIdx = state.cards.findIndex((c) => c.id === id);
    const cardObj = { id, name, color: selectedCardColor, limit, closingDay, dueDay, createdAt: existingIdx >= 0 ? state.cards[existingIdx].createdAt : Date.now() };
    if (existingIdx >= 0) state.cards[existingIdx] = cardObj;
    else state.cards.push(cardObj);

    saveData();
    closeCardModal();
    renderAll();
    toast("Cartão salvo");
  });

  $("cardDeleteBtn").addEventListener("click", () => {
    const id = $("cardId").value;
    if (!id) return;
    const hasExpenses = state.expenses.some((e) => e.cardId === id);
    const msg = hasExpenses
      ? "Excluir este cartão também vai excluir todos os gastos lançados nele. Continuar?"
      : "Excluir este cartão?";
    if (!confirm(msg)) return;
    state.cards = state.cards.filter((c) => c.id !== id);
    state.expenses = state.expenses.filter((e) => e.cardId !== id);
    saveData();
    closeCardModal();
    renderAll();
    toast("Cartão excluído");
  });

  /* ---------- modal: expense ---------- */
  const modalExpense = $("modalExpense");
  const formExpense = $("formExpense");

  function openExpenseModal(editId) {
    if (state.cards.length === 0) {
      toast("Cadastre um cartão primeiro");
      return;
    }
    const editing = editId ? state.expenses.find((e) => e.id === editId) : null;
    $("expenseModalTitle").textContent = editing ? "Editar gasto" : "Novo gasto";
    $("expenseId").value = editing ? editing.id : "";

    const cardSel = $("expenseCard");
    cardSel.innerHTML = state.cards.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
    cardSel.value = editing ? editing.cardId : (state.filterCard || state.cards[0].id);

    $("expenseDesc").value = editing ? editing.description : "";
    $("expenseAmount").value = editing ? editing.amount : "";
    $("expenseDate").value = editing ? editing.date : defaultExpenseDate();
    $("expenseCategory").value = editing ? editing.category : CATEGORIES[0];

    $("expenseDeleteBtn").hidden = !editing;
    modalExpense.classList.remove("hidden");
    setTimeout(() => $("expenseDesc").focus(), 50);
  }

  function defaultExpenseDate() {
    const today = todayISO();
    return today.slice(0, 7) === state.currentMonth ? today : state.currentMonth + "-01";
  }

  function closeExpenseModal() {
    modalExpense.classList.add("hidden");
  }

  formExpense.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = $("expenseId").value || uid();
    const cardId = $("expenseCard").value;
    const description = $("expenseDesc").value.trim();
    const amount = parseFloat($("expenseAmount").value);
    const date = $("expenseDate").value;
    const category = $("expenseCategory").value;
    if (!description || !cardId || !date || !(amount > 0)) return;

    const existingIdx = state.expenses.findIndex((x) => x.id === id);
    const expObj = { id, cardId, description, amount, date, category, createdAt: existingIdx >= 0 ? state.expenses[existingIdx].createdAt : Date.now() };
    if (existingIdx >= 0) state.expenses[existingIdx] = expObj;
    else state.expenses.push(expObj);

    saveData();
    closeExpenseModal();
    state.currentMonth = date.slice(0, 7);
    renderAll();
    toast("Gasto salvo");
  });

  $("expenseDeleteBtn").addEventListener("click", () => {
    const id = $("expenseId").value;
    if (!id) return;
    if (!confirm("Excluir este gasto?")) return;
    state.expenses = state.expenses.filter((e) => e.id !== id);
    saveData();
    closeExpenseModal();
    renderAll();
    toast("Gasto excluído");
  });

  /* ---------- modal close wiring ---------- */
  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeCardModal();
      closeExpenseModal();
    });
  });
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.add("hidden");
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeCardModal();
      closeExpenseModal();
    }
  });

  /* ---------- settings: export / import / clear ---------- */
  $("btnExport").addEventListener("click", () => {
    const payload = { exportedAt: new Date().toISOString(), cards: state.cards, expenses: state.expenses };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = todayISO();
    a.href = url;
    a.download = `controle-financeiro-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Backup exportado");
  });

  $("btnImport").addEventListener("click", () => $("importFile").click());

  $("importFile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed.cards) || !Array.isArray(parsed.expenses)) throw new Error("formato inválido");
        const replace = confirm(
          "Importar vai SUBSTITUIR todos os dados atuais por este backup. Toque OK para substituir, ou Cancelar para mesclar com os dados existentes."
        );
        if (replace) {
          state.cards = parsed.cards;
          state.expenses = parsed.expenses;
        } else {
          const existingCardIds = new Set(state.cards.map((c) => c.id));
          parsed.cards.forEach((c) => { if (!existingCardIds.has(c.id)) state.cards.push(c); });
          const existingExpIds = new Set(state.expenses.map((x) => x.id));
          parsed.expenses.forEach((x) => { if (!existingExpIds.has(x.id)) state.expenses.push(x); });
        }
        saveData();
        renderAll();
        toast("Backup importado");
      } catch (err) {
        alert("Não foi possível importar este arquivo: " + err.message);
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  });

  $("btnClear").addEventListener("click", () => {
    if (!confirm("Isso vai apagar TODOS os cartões e gastos deste dispositivo. Essa ação não pode ser desfeita. Continuar?")) return;
    state.cards = [];
    state.expenses = [];
    saveData();
    renderAll();
    toast("Dados apagados");
  });

  /* ---------- service worker ---------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch((err) => console.warn("SW falhou:", err));
    });
  }

  /* ---------- init ---------- */
  setView("dashboard");
})();
