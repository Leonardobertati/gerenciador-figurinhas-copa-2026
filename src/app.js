import { buildAlbum, buildSections } from "./albumData.js";
import { applyStatusRow, StickerStore } from "./storage.js";

const TOTAL_STICKERS = 994;
const store = new StickerStore();

const state = {
  stickers: buildAlbum(),
  route: "dashboard",
  viewMode: "rapido",
  sortAZ: false,
  filterMode: "todas",
  selectedSection: null,
  query: "",
  busy: false
};

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
const sheetRoot = document.querySelector("#sheet-root");
let remoteRenderTimer = null;

init();

async function init() {
  try {
    state.stickers = await store.load(state.stickers);
    store.subscribe(handleRemoteStatusChange);
  } catch (error) {
    notify("Configure o Supabase para carregar e salvar o álbum online.");
    console.error(error);
  }

  window.addEventListener("hashchange", syncRouteFromHash);
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("input", handleDocumentInput);
  syncRouteFromHash();
  registerServiceWorker();
}

function handleRemoteStatusChange(row) {
  state.stickers = state.stickers.map((sticker) =>
    sticker.codigo === row.codigo ? applyStatusRow(sticker, row) : sticker
  );
  if (remoteRenderTimer) return;
  remoteRenderTimer = window.setTimeout(() => {
    remoteRenderTimer = null;
    render();
  }, 100);
}

function syncRouteFromHash() {
  const hash = window.location.hash.replace("#", "");
  const [route = "dashboard", param = ""] = hash.split("/");
  state.route = route || "dashboard";
  state.selectedSection = decodeURIComponent(param || "");
  render();
}

function navigate(route) {
  window.location.hash = route;
}

function render() {
  const views = {
    dashboard: renderDashboard,
    album: renderAlbum,
    search: renderSearch,
    repeated: () => renderFiltered("repeated"),
    missing: () => renderFiltered("missing"),
    section: renderSection
  };

  app.innerHTML = (views[state.route] || renderDashboard)();
  attachStickerCardEvents();
}

function renderDashboard() {
  const stats = getStats();
  const percent = getPercent(stats.coladas, TOTAL_STICKERS);
  return `
    <main class="screen">
      <section class="hero-card">
        <img class="hero-mascots" src="./assets/mascots-2026-cutout.png" alt="" aria-hidden="true" />
        <div class="hero-copy">
          <span class="eyebrow">FIFA World Cup 2026</span>
          <h1>Meu Álbum</h1>
          <p class="hero-hosts">Canad&aacute; &middot; Estados Unidos &middot; M&eacute;xico</p>
        </div>
        <div class="trophy" aria-hidden="true">🏆</div>
        <div class="hero-progress">
          <div class="progress-label">
            <span>Progresso do álbum</span>
            <strong>${percent}%</strong>
          </div>
          ${progressBar(percent, "gold")}
          <p>${stats.coladas} de ${TOTAL_STICKERS} figurinhas</p>
        </div>
      </section>

      <section class="stats-card">
        ${statItem(stats.coladas, "Coladas", "blue")}
        ${statItem(stats.faltando, "Faltando", "red")}
        ${statItem(stats.repetidas, "Repetidas", "green")}
      </section>

      <section class="quick-section">
        <h2>Acesso rápido</h2>
        <div class="quick-grid">
          ${quickCard("album", "Álbum", "Ver figurinhas", "book", "blue")}
          ${quickCard("search", "Buscar", "Encontrar figurinha", "search", "amber")}
          ${quickCard("repeated", "Repetidas", "Exportar trocas", "copy", "green")}
          ${quickCard("missing", "Faltantes", "Lista para amigos", "filter", "red")}
        </div>
        <div class="batch-mini-grid">
          <button class="batch-mini-card" data-action="open-batch-add">
            <span>${icon("plus")}</span>
            <strong>Lote +</strong>
          </button>
          <button class="batch-mini-card remove" data-action="open-batch-remove">
            <span>${icon("minus")}</span>
            <strong>Lote -</strong>
          </button>
        </div>
      </section>

      <section class="reset-panel">
        <h2>Reset</h2>
        <div class="reset-actions">
          <button class="reset-button" data-action="reset-coladas">${icon("minus")} Reset coladas</button>
          <button class="reset-button" data-action="reset-repetidas">${icon("copy")} Reset repetidas</button>
        </div>
      </section>
    </main>
  `;
}

function renderAlbum() {
  return `
    <main class="screen">
      ${topBar("Meu Álbum", true)}
      ${viewSwitcher()}
      ${albumSummaryStrip()}
      ${
        state.viewMode === "lista"
          ? renderSectionList(getVisibleSections())
          : renderAllQuickSections()
      }
      ${bottomNav()}
    </main>
  `;
}

function renderSearch() {
  const term = state.query.trim().toUpperCase();
  const results = getSearchResults(state.query);

  return `
    <main class="screen">
      ${topBar("Buscar", true)}
      <section class="search-panel">
        <label class="search-box">
          ${icon("search")}
          <input id="search-input" value="${escapeHtml(state.query)}" placeholder="Digite: MEX1, grupo A, FWC, CC14" autocomplete="off" />
        </label>
      </section>
      <section class="result-list">
        ${
          term
            ? results.map(renderSearchResult).join("") || emptyState("Nenhuma figurinha encontrada.")
            : emptyState("Busque pelo código da figurinha.")
        }
      </section>
      ${bottomNav()}
    </main>
  `;
}

function renderFiltered(type) {
  const isRepeated = type === "repeated";
  const title = isRepeated ? "Repetidas" : "Faltantes";
  const stickers = state.stickers.filter((sticker) =>
    isRepeated ? getRepeated(sticker) > 0 : !isOwned(sticker)
  );
  const sections = getSections(stickers);

  return `
    <main class="screen">
      ${topBar(title, true)}
      <section class="export-panel">
        <div>
          <span>${stickers.length} códigos</span>
          <strong>${isRepeated ? getStats().repetidas : stickers.length} ${isRepeated ? "repetidas" : "faltantes"}</strong>
        </div>
        <button class="primary-button" data-action="export" data-export-type="${type}">
          ${icon("copy")} Exportar ${isRepeated ? "repetidas" : "faltantes"}
        </button>
      </section>
      ${sections.length ? sections.map((section) => renderQuickSection(section, type)).join("") : emptyState(`Nenhuma figurinha ${isRepeated ? "repetida" : "faltante"}.`)}
      ${bottomNav()}
    </main>
  `;
}

function renderSection() {
  const sectionName = state.selectedSection;
  const section = getSections(state.stickers).find((item) => item.nome === sectionName);
  if (!section) return renderAlbum();

  return `
    <main class="screen">
      ${topBar(section.nome, true)}
      ${renderQuickSection(section, "album")}
      ${bottomNav()}
    </main>
  `;
}

function renderAllQuickSections() {
  const sections = getVisibleSections();
  return sections.length
    ? sections.map((section) => renderQuickSection(section, "album")).join("")
    : emptyState("Nenhuma figurinha nesse filtro.");
}

function renderQuickSection(section, context) {
  const visibleStickers = context === "album" ? applyStickerFilter(section.stickers) : section.stickers;
  const completed = section.stickers.filter(isOwned).length;
  const percent = getPercent(completed, section.total);
  const repeatedTotal = section.stickers.reduce((sum, sticker) => sum + getRepeated(sticker), 0);
  const tradeableRepeated = section.stickers.filter((sticker) => getRepeated(sticker) > 0).length;
  const ownedTotal = section.stickers.reduce((sum, sticker) => sum + getTotal(sticker), 0);
  const showSectionActions = context === "album";
  return `
    <section class="sticker-section">
      <div class="section-title-row">
        <div class="section-marker"></div>
        <div class="section-heading-icon" aria-hidden="true">${getSectionIcon(section)}</div>
        <div class="section-heading-main">
          <span>${section.codigo || section.grupo || "Seleção"}</span>
          <h2>${section.nome}</h2>
          <div class="section-stats">
            <span>Rep. total ${repeatedTotal}</span>
            <span>Trocáveis ${tradeableRepeated}</span>
            <span>Total ${ownedTotal}</span>
          </div>
          ${
            showSectionActions
              ? `<div class="section-actions">
                  <button data-action="complete-section" data-section="${escapeAttr(section.nome)}">${icon("check")} Completar</button>
                  <button class="danger" data-action="clear-section" data-section="${escapeAttr(section.nome)}">${icon("trash")} Zerar</button>
                </div>`
              : ""
          }
        </div>
        <div class="section-count">
          <strong>${completed}/${section.total}</strong>
          ${progressBar(percent)}
        </div>
      </div>
      <div class="sticker-grid">
        ${visibleStickers.map((sticker) => renderStickerCard(sticker, context)).join("")}
      </div>
    </section>
  `;
}

function renderSectionList(sections) {
  return `
    <section class="section-list">
      ${sections.map((section) => {
        const completed = section.stickers.filter(isOwned).length;
        const percent = getPercent(completed, section.total);
        const tone = percent >= 75 ? "green" : percent >= 40 ? "blue" : percent > 0 ? "red" : "muted";
        return `
          <button class="section-card" data-action="open-section" data-section="${escapeAttr(section.nome)}">
            <div class="section-icon">${getSectionIcon(section)}</div>
            <div class="section-info">
              <h2>${section.nome}</h2>
              <p>${section.grupo || section.codigo}</p>
              ${progressBar(percent, tone)}
            </div>
            <div class="section-meta">
              <strong>${percent}%</strong>
              <span>${completed}/${section.total}</span>
              ${icon("chevron")}
            </div>
          </button>
        `;
      }).join("")}
    </section>
  `;
}

function renderStickerCard(sticker, context) {
  const repeated = getRepeated(sticker);
  const owned = isOwned(sticker);
  return `
    <button
      class="sticker-card ${owned ? "owned" : ""} ${repeated ? "repeated" : ""}"
      data-code="${sticker.codigo}"
      data-context="${context}"
      aria-label="Figurinha ${sticker.codigo}, colada ${owned ? "sim" : "não"}, repetidas ${repeated}"
    >
      <span class="sticker-code">${sticker.codigo}</span>
      ${repeated ? `<span class="repeat-badge">+${repeated}</span>` : ""}
    </button>
  `;
}

function renderSearchResult(sticker) {
  const repeated = getRepeated(sticker);
  const owned = isOwned(sticker);
  return `
    <article class="search-result">
      <button class="sticker-card ${owned ? "owned" : ""} ${repeated ? "repeated" : ""}" data-code="${sticker.codigo}" data-context="search">
        <span class="sticker-code">${sticker.codigo}</span>
        ${repeated ? `<span class="repeat-badge">+${repeated}</span>` : ""}
      </button>
      <div>
        <h2>${sticker.codigo}</h2>
        <p>${sticker.secao}</p>
        <span>${owned ? "Colada" : "Não colada"} · Repetidas ${repeated} · Total ${getTotal(sticker)}</span>
      </div>
    </article>
  `;
}

function getSearchResults(query) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return [];

  if (normalizedQuery.includes("GRUPO")) {
    const groupCode = normalizedQuery.split(/\s+/).find((part) => /^[A-L]$/.test(part));
    if (!groupCode) return [];
    return state.stickers.filter((sticker) => normalizeSearch(sticker.grupo) === `GRUPO ${groupCode}`);
  }

  if (normalizedQuery === "FWC") {
    return state.stickers.filter((sticker) => sticker.grupo === "FWC");
  }

  return state.stickers.filter((sticker) => {
    const fields = [sticker.codigo, sticker.secao, sticker.grupo].map(normalizeSearch);
    return fields.some((field) => field.includes(normalizedQuery));
  });
}

function getSectionIcon(section) {
  const sectionCode = getSectionCode(section);
  if (sectionCode === "CC") return iconImage("assets/icons/coke.svg", "Coca-Cola");
  if (sectionCode === "FWC") {
    const iconName = section.nome.includes("Parte 1") ? "trophy" : "stadium";
    const label = section.nome.includes("Parte 1") ? "Taça da Copa" : "Estádio de futebol";
    return iconImage(`assets/icons/${iconName}.svg`, label);
  }

  return iconImage(`assets/flags/${sectionCode}.svg`, `Bandeira ${section.nome}`);
}

function getSectionCode(section) {
  if (section.nome === "Coca-Cola") return "CC";
  if (section.nome.startsWith("FWC")) return "FWC";
  const firstCode = section.stickers?.[0]?.codigo || "";
  return firstCode.match(/^[A-Z]+/)?.[0] || section.codigo || "";
}

function iconImage(src, alt) {
  return `<img src="${src}" alt="${escapeAttr(alt)}" loading="lazy" />`;
}

function topBar(title, back) {
  const filterActive = state.filterMode !== "todas";
  return `
    <header class="top-bar">
      <button class="icon-button" data-action="${back ? "back" : "dashboard"}" aria-label="${back ? "Voltar" : "Início"}">
        ${icon(back ? "back" : "book")}
      </button>
      <h1>${title}</h1>
      <div class="top-actions">
        <button class="icon-button" data-action="go-search" aria-label="Buscar">${icon("search")}</button>
        <button class="icon-button filter-button ${filterActive ? "active" : ""}" data-action="open-filter" aria-label="Filtro">${icon("filter")}</button>
      </div>
    </header>
  `;
}

function viewSwitcher() {
  return `
    <section class="switcher-wrap">
      <div class="segmented">
        <button class="${state.viewMode === "rapido" ? "active" : ""}" data-action="set-view" data-view="rapido">${icon("bolt")} Rápido</button>
        <button class="${state.viewMode === "lista" ? "active" : ""}" data-action="set-view" data-view="lista">${icon("list")} Lista</button>
      </div>
      <button class="icon-button sort-button ${state.sortAZ ? "active" : ""}" data-action="toggle-sort" aria-label="${state.sortAZ ? "Ordenação A-Z ativa" : "Ordem original do álbum"}">${state.sortAZ ? "A-Z" : icon("sort")}</button>
    </section>
  `;
}

function albumSummaryStrip() {
  const stats = getStats();
  return `
    <section class="album-strip">
      <p>${TOTAL_STICKERS} figurinhas · 48 seleções</p>
      <div class="strip-progress">
        ${progressBar(getPercent(stats.coladas, TOTAL_STICKERS), "blue")}
        <strong>${stats.coladas}/${TOTAL_STICKERS}</strong>
      </div>
    </section>
  `;
}

function bottomNav() {
  const items = [
    ["dashboard", "Início", "book"],
    ["album", "Álbum", "grid"],
    ["batch-add", "Lote +", "plus"],
    ["batch-remove", "Lote -", "minus"],
    ["search", "Buscar", "search"],
    ["repeated", "Repetidas", "copy"],
    ["missing", "Faltantes", "filter"]
  ];
  return `
    <nav class="bottom-nav" aria-label="Navegação principal">
      ${items.map(([route, label, iconName]) => `
        <button class="${route === "batch-remove" ? "danger-nav" : ""} ${state.route === route ? "active" : ""}" data-action="${route === "batch-add" ? "open-batch-add" : route === "batch-remove" ? "open-batch-remove" : "nav"}" data-route="${route}">
          ${icon(iconName)}
          <span>${label}</span>
        </button>
      `).join("")}
    </nav>
  `;
}

async function handleDocumentClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  const action = target.dataset.action;
  if (action === "nav") navigate(target.dataset.route);
  if (action === "dashboard") navigate("dashboard");
  if (action === "go-search") navigate("search");
  if (action === "open-filter") openFilterSheet();
  if (action === "set-filter") {
    state.filterMode = target.dataset.filter || "todas";
    closeSheet();
    render();
  }
  if (action === "back") history.length > 1 ? history.back() : navigate("dashboard");
  if (action === "toggle-sort") {
    state.sortAZ = !state.sortAZ;
    render();
  }
  if (action === "set-view") {
    state.viewMode = target.dataset.view;
    render();
  }
  if (action === "open-section") navigate(`section/${encodeURIComponent(target.dataset.section)}`);
  if (action === "export") openExportSheet(target.dataset.exportType);
  if (action === "copy-export") copyExportText();
  if (action === "close-sheet") closeSheet();
  if (action === "open-batch-add") openBatchSheet("add");
  if (action === "open-batch-remove") openBatchSheet("remove");
  if (action === "apply-batch-add") applyBatchAdd();
  if (action === "apply-batch-remove") applyBatchRemove();
  if (action === "quick-card") navigate(target.dataset.route);
  if (action === "card-menu") openStickerMenu(target.dataset.code);
  if (action === "reset-coladas") resetColadas();
  if (action === "reset-repetidas") resetRepetidas();
  if (action === "complete-section") completeSection(target.dataset.section);
  if (action === "clear-section") clearSection(target.dataset.section);
  if (action === "sticker-update") {
    const code = target.dataset.code;
    await updateSticker(code, target.dataset.operation);
    openStickerMenu(code);
  }
}

function handleDocumentInput(event) {
  if (event.target.id === "search-input") {
    state.query = event.target.value;
    render();
    const input = document.querySelector("#search-input");
    input?.focus();
    input?.setSelectionRange(state.query.length, state.query.length);
  }
}

function attachStickerCardEvents() {
  document.querySelectorAll(".sticker-card").forEach((card) => {
    let timer = null;
    let longPress = false;
    const code = card.dataset.code;

    const start = () => {
      longPress = false;
      timer = window.setTimeout(() => {
        longPress = true;
        openStickerMenu(code);
      }, 520);
    };
    const end = () => {
      window.clearTimeout(timer);
    };

    card.addEventListener("pointerdown", start);
    card.addEventListener("pointerup", end);
    card.addEventListener("pointerleave", end);
    card.addEventListener("click", (event) => {
      event.preventDefault();
      if (longPress) return;
      const context = card.dataset.context;
      const sticker = findSticker(code);
      if (context === "repeated") {
        openStickerMenu(code);
        return;
      }
      if (!isOwned(sticker)) {
        updateSticker(code, "own");
      } else {
        notify(`${code} já está no álbum. Segure para editar.`);
      }
    });
  });
}

async function updateSticker(code, operation) {
  const sticker = findSticker(code);
  if (!sticker) return;

  const next = { ...sticker };
  if (operation === "own") next.colada = true;
  if (operation === "add-repeat") next.repetidas = getRepeated(next) + 1;
  if (operation === "remove-repeat") next.repetidas = Math.max(0, getRepeated(next) - 1);
  if (operation === "remove") {
    next.colada = false;
    next.repetidas = 0;
  }
  next.quantidadeTotal = getTotal(next);

  state.stickers = state.stickers.map((item) => (item.codigo === code ? next : item));
  render();

  try {
    await store.saveSticker(next);
    const messages = {
      own: `${code} adicionada ao álbum.`,
      "add-repeat": `Repetida adicionada em ${code}.`,
      "remove-repeat": `Uma repetida removida de ${code}.`,
      remove: `${code} removida do álbum.`
    };
    notify(messages[operation]);
  } catch (error) {
    console.error(error);
    notify("Falha ao salvar. Verifique a configuração do Supabase.");
  }
}

async function resetColadas() {
  if (!confirm("Tem certeza que deseja apagar as coladas?")) return;
  await applyBulkUpdate(
    state.stickers.map((sticker) => ({
      ...sticker,
      colada: false,
      quantidadeTotal: getRepeated(sticker)
    })),
    "Coladas removidas."
  );
}

async function resetRepetidas() {
  if (!confirm("Tem certeza que deseja apagar as repetidas?")) return;
  await applyBulkUpdate(
    state.stickers.map((sticker) => ({
      ...sticker,
      repetidas: 0,
      quantidadeTotal: Number(isOwned(sticker))
    })),
    "Repetidas zeradas."
  );
}

async function completeSection(sectionName) {
  if (!confirm(`Tem certeza que deseja completar ${sectionName}?`)) return;
  const codes = getSectionCodes(sectionName);
  if (!codes.size) return;
  await applyBulkUpdate(
    state.stickers.map((sticker) => {
      if (!codes.has(sticker.codigo)) return sticker;
      const next = { ...sticker, colada: true };
      next.quantidadeTotal = getTotal(next);
      return next;
    }),
    `${sectionName} completa.`
  );
}

async function clearSection(sectionName) {
  if (!confirm(`Tem certeza que deseja zerar ${sectionName}?`)) return;
  const codes = getSectionCodes(sectionName);
  if (!codes.size) return;
  await applyBulkUpdate(
    state.stickers.map((sticker) => {
      if (!codes.has(sticker.codigo)) return sticker;
      return { ...sticker, colada: false, repetidas: 0, quantidadeTotal: 0 };
    }),
    `${sectionName} zerada.`
  );
}

function getSectionCodes(sectionName) {
  const section = buildSections(state.stickers).find((item) => item.nome === sectionName);
  return new Set(section?.stickers.map((sticker) => sticker.codigo) || []);
}

async function applyBulkUpdate(nextStickers, message) {
  const previous = state.stickers;
  state.stickers = nextStickers;
  render();

  try {
    await store.saveStickers(nextStickers);
    notify(message);
  } catch (error) {
    state.stickers = previous;
    render();
    console.error(error);
    notify("Falha ao salvar. Verifique a configuração do Supabase.");
  }
}

function openStickerMenu(code) {
  const sticker = findSticker(code);
  if (!sticker) return;
  const repeated = getRepeated(sticker);
  const owned = isOwned(sticker);
  sheetRoot.innerHTML = `
    <div class="sheet-backdrop" data-action="close-sheet"></div>
    <section class="bottom-sheet" role="dialog" aria-modal="true">
      <div class="sheet-handle"></div>
      <button class="sheet-close-button" data-action="close-sheet" aria-label="Fechar">${icon("x")}</button>
      <h2>${sticker.codigo}</h2>
      <p>${sticker.secao} · ${owned ? "colada" : "não colada"} · ${repeated} repetida${repeated === 1 ? "" : "s"}</p>
      <div class="sheet-actions">
        <button data-action="sticker-update" data-code="${code}" data-operation="add-repeat">${icon("plus")} Adicionar repetida</button>
        <button data-action="sticker-update" data-code="${code}" data-operation="remove-repeat" ${repeated <= 0 ? "disabled" : ""}>${icon("minus")} Remover repetida</button>
        <button class="danger" data-action="sticker-update" data-code="${code}" data-operation="remove">${icon("trash")} Remover figurinha</button>
      </div>
    </section>
  `;
}

function openBatchSheet(mode) {
  const isRemove = mode === "remove";
  sheetRoot.innerHTML = `
    <div class="sheet-backdrop" data-action="close-sheet"></div>
    <section class="bottom-sheet batch-sheet" role="dialog" aria-modal="true">
      <div class="sheet-handle"></div>
      <button class="sheet-close-button" data-action="close-sheet" aria-label="Fechar">${icon("x")}</button>
      <h2>${isRemove ? "Remover em lote" : "Adicionar em lote"}</h2>
      <p>Use vírgula para separar. Em MEX2(2), 2 é a quantidade ${isRemove ? "removida" : "nova adicionada"}.</p>
      <textarea id="batch-input" placeholder="MEX1, MEX2(2), BRA5"></textarea>
      <button class="primary-button full ${isRemove ? "danger-button" : ""}" data-action="${isRemove ? "apply-batch-remove" : "apply-batch-add"}">
        ${icon(isRemove ? "minus" : "plus")} ${isRemove ? "Remover figurinhas" : "Adicionar figurinhas"}
      </button>
    </section>
  `;
}

async function applyBatchAdd() {
  const input = document.querySelector("#batch-input")?.value || "";
  const parsed = parseBatchInput(input);
  if (!parsed.length) {
    notify("Nenhum código válido encontrado.");
    return;
  }

  const stickerMap = new Map(state.stickers.map((sticker) => [sticker.codigo, sticker]));
  const invalidCodes = parsed.filter((item) => !stickerMap.has(item.codigo)).map((item) => item.codigo);
  const updates = new Map();

  parsed.forEach(({ codigo, total }) => {
    const sticker = updates.get(codigo) || { ...stickerMap.get(codigo) };
    if (!sticker) return;
    const nextTotal = getTotal(sticker) + total;
    sticker.colada = nextTotal > 0;
    sticker.repetidas = Math.max(0, nextTotal - 1);
    sticker.quantidadeTotal = nextTotal;
    updates.set(codigo, sticker);
  });

  if (!updates.size) {
    notify(`Código não encontrado: ${invalidCodes[0] || ""}`);
    return;
  }

  await applyBulkUpdate(
    state.stickers.map((sticker) => updates.get(sticker.codigo) || sticker),
    `${updates.size} código${updates.size === 1 ? "" : "s"} adicionado${updates.size === 1 ? "" : "s"}.`
  );

  closeSheet();
  if (invalidCodes.length) {
    notify(`Adicionados. Ignorados: ${[...new Set(invalidCodes)].join(", ")}`);
  }
}

async function applyBatchRemove() {
  const input = document.querySelector("#batch-input")?.value || "";
  const parsed = parseBatchInput(input);
  if (!parsed.length) {
    notify("Nenhum código válido encontrado.");
    return;
  }

  const stickerMap = new Map(state.stickers.map((sticker) => [sticker.codigo, sticker]));
  const invalidCodes = parsed.filter((item) => !stickerMap.has(item.codigo)).map((item) => item.codigo);
  const updates = new Map();

  parsed.forEach(({ codigo, total }) => {
    const sticker = updates.get(codigo) || { ...stickerMap.get(codigo) };
    if (!sticker) return;
    const nextTotal = Math.max(0, getTotal(sticker) - total);
    sticker.colada = nextTotal > 0;
    sticker.repetidas = Math.max(0, nextTotal - 1);
    sticker.quantidadeTotal = nextTotal;
    updates.set(codigo, sticker);
  });

  if (!updates.size) {
    notify(`Código não encontrado: ${invalidCodes[0] || ""}`);
    return;
  }

  await applyBulkUpdate(
    state.stickers.map((sticker) => updates.get(sticker.codigo) || sticker),
    `${updates.size} código${updates.size === 1 ? "" : "s"} removido${updates.size === 1 ? "" : "s"}.`
  );

  closeSheet();
  if (invalidCodes.length) {
    notify(`Removidos. Ignorados: ${[...new Set(invalidCodes)].join(", ")}`);
  }
}

function parseBatchInput(input) {
  return input
    .split(",")
    .map((item) => item.trim().toUpperCase().replace(/\s+/g, ""))
    .map((item) => item.match(/^([A-Z]+[0-9]+)(?:\((\d+)\))?$/))
    .filter(Boolean)
    .map((match) => ({
      codigo: match[1],
      total: Math.max(1, Number(match[2] || 1))
    }));
}

function openExportSheet(type) {
  const text = buildExportText(type);
  sheetRoot.innerHTML = `
    <div class="sheet-backdrop" data-action="close-sheet"></div>
    <section class="bottom-sheet export-sheet" role="dialog" aria-modal="true">
      <div class="sheet-handle"></div>
      <button class="sheet-close-button" data-action="close-sheet" aria-label="Fechar">${icon("x")}</button>
      <h2>Exportar ${type === "repeated" ? "repetidas" : "faltantes"}</h2>
      <textarea id="export-text" readonly>${escapeHtml(text)}</textarea>
      <button class="primary-button full" data-action="copy-export">${icon("copy")} Copiar texto</button>
    </section>
  `;
}

function openFilterSheet() {
  const options = [
    ["todas", "Mostrar todas", "check"],
    ["repetidas", "Só repetidas", "copy"],
    ["faltantes", "Só faltantes", "filter"],
    ["completas", "Só possuídas", "check"]
  ];
  sheetRoot.innerHTML = `
    <div class="sheet-backdrop" data-action="close-sheet"></div>
    <section class="bottom-sheet filter-sheet" role="dialog" aria-modal="true">
      <div class="sheet-handle"></div>
      <button class="sheet-close-button" data-action="close-sheet" aria-label="Fechar">${icon("x")}</button>
      <h2>Filtro</h2>
      <p>Aplicado apenas na visualização do álbum.</p>
      <div class="filter-options">
        ${options.map(([value, label, iconName]) => `
          <button class="${state.filterMode === value ? "active" : ""}" data-action="set-filter" data-filter="${value}">
            ${icon(iconName)}
            <span>${label}</span>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function buildExportText(type) {
  const isRepeated = type === "repeated";
  const sections = getSections(state.stickers);
  const lines = sections
    .map((section) => {
      const codes = section.stickers
        .filter((sticker) => (isRepeated ? getRepeated(sticker) > 0 : !isOwned(sticker)))
        .map((sticker) => {
          const repeated = getRepeated(sticker);
          return isRepeated && repeated > 1 ? `${sticker.codigo} (${repeated})` : sticker.codigo;
        });
      return codes.length ? `${section.nome}: ${codes.join(", ")}` : "";
    })
    .filter(Boolean);

  const header = isRepeated
    ? "Aqui segue as minhas figurinhas repetidas:"
    : "Aqui seguem as minhas figurinhas faltantes:";

  return `${header}\n\n${lines.join("\n") || "Nenhuma figurinha para listar."}`;
}

async function copyExportText() {
  const text = document.querySelector("#export-text")?.value || "";
  try {
    await navigator.clipboard.writeText(text);
    notify("Texto copiado.");
  } catch {
    document.querySelector("#export-text")?.select();
    notify("Selecione e copie o texto.");
  }
}

function closeSheet() {
  sheetRoot.innerHTML = "";
}

function getSections(stickers) {
  const sections = buildSections(stickers);
  if (!state.sortAZ) return sections;
  return [...sections].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

function getVisibleSections() {
  const sections = getSections(state.stickers);
  if (state.filterMode === "todas") return sections;
  return sections.filter((section) => applyStickerFilter(section.stickers).length > 0);
}

function applyStickerFilter(stickers) {
  if (state.filterMode === "repetidas") return stickers.filter((sticker) => getRepeated(sticker) > 0);
  if (state.filterMode === "faltantes") return stickers.filter((sticker) => !isOwned(sticker));
  if (state.filterMode === "completas") return stickers.filter(isOwned);
  return stickers;
}

function getStats() {
  return state.stickers.reduce(
    (acc, sticker) => {
      if (isOwned(sticker)) acc.coladas += 1;
      if (!isOwned(sticker)) acc.faltando += 1;
      acc.repetidas += getRepeated(sticker);
      return acc;
    },
    { coladas: 0, faltando: 0, repetidas: 0 }
  );
}

function findSticker(code) {
  return state.stickers.find((sticker) => sticker.codigo === code);
}

function isOwned(sticker) {
  if ("colada" in sticker) return Boolean(sticker.colada);
  return Number(sticker.quantidadeTotal || 0) >= 1;
}

function getRepeated(sticker) {
  if ("repetidas" in sticker) return Math.max(0, Number(sticker.repetidas || 0));
  return Math.max(0, Number(sticker.quantidadeTotal || 0) - 1);
}

function getTotal(sticker) {
  return Number(isOwned(sticker)) + getRepeated(sticker);
}

function getPercent(value, total) {
  return Math.round((value / total) * 100);
}

function progressBar(percent, tone = "blue") {
  return `<div class="progress ${tone}"><span style="width:${Math.min(100, percent)}%"></span></div>`;
}

function statItem(value, label, tone) {
  return `<div class="stat ${tone}"><strong>${value}</strong><span>${label}</span></div>`;
}

function quickCard(route, title, subtitle, iconName, tone) {
  return `
    <button class="quick-card" data-action="quick-card" data-route="${route}">
      <span class="quick-icon ${tone}">${icon(iconName)}</span>
      <strong>${title}</strong>
      <span>${subtitle}</span>
    </button>
  `;
}

function emptyState(text) {
  return `<section class="empty-state">${text}</section>`;
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(notify.timer);
  notify.timer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function icon(name) {
  const icons = {
    back: '<svg viewBox="0 0 24 24"><path d="M19 12H5m6 7-7-7 7-7"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    filter: '<svg viewBox="0 0 24 24"><path d="M3 5h18l-7 8v5l-4 2v-7L3 5Z"/></svg>',
    book: '<svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    bolt: '<svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>',
    list: '<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    sort: '<svg viewBox="0 0 24 24"><path d="M8 4v16m0 0-4-4m4 4 4-4M16 20V4m0 0-4 4m4-4 4 4"/></svg>',
    chevron: '<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m5 12 5 5L20 7"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2m-1 0v14H9V6"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>'
  };
  return icons[name] || "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#039;");
}

function normalizeSearch(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  const isLocalhost = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
  if (isLocalhost) {
    navigator.serviceWorker.getRegistrations?.().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
    return;
  }

  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

