import { buildAlbum, buildSections } from "./albumData.js";
import { analyzeConferenceInput } from "./conference.js";
import {
  applyStatusRow,
  DEFAULT_ALBUM_ID,
  getFallbackAlbums,
  getStoredActiveAlbumId,
  normalizeAlbumName,
  sortAlbums,
  StickerStore,
  storeActiveAlbumId
} from "./storage.js";

const TOTAL_STICKERS = 994;
const store = new StickerStore();

const SECTION_THEMES = {
  FWC: { primary: "#3478ff", secondary: "#facc15" },
  CC: { primary: "#ef4444", secondary: "#ffffff" },
  MEX: { primary: "#006847", secondary: "#ce1126" },
  RSA: { primary: "#007a4d", secondary: "#ffb612" },
  KOR: { primary: "#c60c30", secondary: "#003478" },
  CZE: { primary: "#11457e", secondary: "#d7141a" },
  CAN: { primary: "#d52b1e", secondary: "#ffffff" },
  BIH: { primary: "#002f6c", secondary: "#f7d116" },
  QAT: { primary: "#8a1538", secondary: "#ffffff" },
  SUI: { primary: "#d52b1e", secondary: "#ffffff" },
  BRA: { primary: "#009b3a", secondary: "#ffdf00" },
  MAR: { primary: "#c1272d", secondary: "#006233" },
  HAI: { primary: "#00209f", secondary: "#d21034" },
  SCO: { primary: "#005eb8", secondary: "#ffffff" },
  USA: { primary: "#3c3b6e", secondary: "#b22234" },
  PAR: { primary: "#d52b1e", secondary: "#0038a8" },
  AUS: { primary: "#012169", secondary: "#e4002b" },
  TUR: { primary: "#e30a17", secondary: "#ffffff" },
  GER: { primary: "#dd0000", secondary: "#ffce00" },
  CUW: { primary: "#002b7f", secondary: "#f9e814" },
  CIV: { primary: "#f77f00", secondary: "#009e60" },
  ECU: { primary: "#034ea2", secondary: "#ffdd00" },
  NED: { primary: "#ff7f00", secondary: "#21468b" },
  JPN: { primary: "#bc002d", secondary: "#ffffff" },
  SWE: { primary: "#006aa7", secondary: "#fecc00" },
  TUN: { primary: "#e70013", secondary: "#ffffff" },
  BEL: { primary: "#fae042", secondary: "#ed2939" },
  EGY: { primary: "#ce1126", secondary: "#c9a227" },
  IRN: { primary: "#239f40", secondary: "#da0000" },
  NZL: { primary: "#012169", secondary: "#cc142b" },
  ESP: { primary: "#aa151b", secondary: "#f1bf00" },
  CPV: { primary: "#003893", secondary: "#cf2027" },
  KSA: { primary: "#006c35", secondary: "#ffffff" },
  URU: { primary: "#0038a8", secondary: "#fcd116" },
  FRA: { primary: "#0055a4", secondary: "#ef4135" },
  SEN: { primary: "#00853f", secondary: "#fdef42" },
  IRQ: { primary: "#ce1126", secondary: "#007a3d" },
  NOR: { primary: "#ba0c2f", secondary: "#00205b" },
  ARG: { primary: "#74acdf", secondary: "#f6b40e" },
  ALG: { primary: "#006233", secondary: "#d21034" },
  AUT: { primary: "#ed2939", secondary: "#ffffff" },
  JOR: { primary: "#ce1126", secondary: "#007a3d" },
  POR: { primary: "#006600", secondary: "#ff0000" },
  COD: { primary: "#007fff", secondary: "#ce1021" },
  UZB: { primary: "#1eb5e5", secondary: "#009b58" },
  COL: { primary: "#003893", secondary: "#fcd116" },
  ENG: { primary: "#ce1124", secondary: "#ffffff" },
  CRO: { primary: "#171796", secondary: "#ff0000" },
  GHA: { primary: "#006b3f", secondary: "#fcd116" },
  PAN: { primary: "#005293", secondary: "#d21034" }
};

const state = {
  stickers: buildAlbum(),
  albums: getFallbackAlbums(),
  activeAlbumId: DEFAULT_ALBUM_ID,
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
    state.albums = await store.loadAlbums();
    state.activeAlbumId = getStoredActiveAlbumId(state.albums);
    state.stickers = await store.load(buildAlbum(), state.activeAlbumId);
    await store.subscribe(state.activeAlbumId, handleRemoteStatusChange);
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
  if (row.session_id && row.session_id !== state.activeAlbumId) return;
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
  const activeAlbum = getActiveAlbum();
  return `
    <main class="screen">
      <section class="hero-card">
        <img class="hero-mascots" src="./assets/mascots-2026-cutout.png" alt="" aria-hidden="true" />
        <div class="hero-copy">
          <span class="eyebrow">FIFA World Cup 2026</span>
          <h1>${escapeHtml(activeAlbum.nome)}</h1>
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
          <button class="batch-mini-card conference" data-action="open-conference">
            <span>${icon("checklist")}</span>
            <strong>Conferência para Colar</strong>
          </button>
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

      ${renderAlbumManager()}

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

function renderAlbumManager() {
  const activeAlbum = getActiveAlbum();
  const disabled = state.busy ? "disabled" : "";
  return `
    <section class="album-manager">
      <div class="album-manager-head">
        <div>
          <span>Álbum ativo</span>
          <h2>${escapeHtml(activeAlbum.nome)}</h2>
        </div>
        <button class="primary-button album-new-button" data-action="open-album-form" data-album-mode="create" ${disabled}>
          ${icon("plus")} Novo álbum
        </button>
      </div>
      <div class="album-list" aria-label="Meus álbuns">
        ${state.albums.map((album) => renderAlbumOption(album)).join("")}
      </div>
    </section>
  `;
}

function renderAlbumOption(album) {
  const isActive = album.id === state.activeAlbumId;
  const disabled = state.busy ? "disabled" : "";
  return `
    <article class="album-option ${isActive ? "active" : ""}">
      <button class="album-select-button" data-action="select-album" data-album-id="${escapeAttr(album.id)}" ${disabled} aria-pressed="${isActive}">
        <span class="album-select-icon">${icon(isActive ? "check" : "book")}</span>
        <span>
          <strong>${escapeHtml(album.nome)}</strong>
          <small>${isActive ? "Selecionado" : "Selecionar"}</small>
        </span>
      </button>
      <div class="album-option-actions">
        <button data-action="open-album-form" data-album-mode="edit" data-album-id="${escapeAttr(album.id)}" aria-label="Editar ${escapeAttr(album.nome)}" ${disabled}>${icon("edit")}</button>
        <button data-action="open-album-delete" data-album-id="${escapeAttr(album.id)}" aria-label="Excluir ${escapeAttr(album.nome)}" ${disabled}>${icon("trash")}</button>
      </div>
    </article>
  `;
}

function renderAlbum() {
  const activeAlbum = getActiveAlbum();
  return `
    <main class="screen">
      ${topBar(activeAlbum.nome, true)}
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
  const term = state.query.trim();
  const searchView = getSearchView(state.query);

  return `
    <main class="screen">
      ${topBar("Buscar", true)}
      <section class="search-panel">
        <label class="search-box">
          ${icon("search")}
          <input id="search-input" value="${escapeHtml(state.query)}" placeholder="Digite: MEX1, grupo A, FWC, CC14" autocomplete="off" />
        </label>
      </section>
      ${renderSearchContent(searchView, term)}
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
  const showSectionProgress = context !== "repeated";
  const themeStyle = getSectionThemeStyle(section);
  return `
    <section class="sticker-section" style="${escapeAttr(themeStyle)}">
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
        ${
          showSectionProgress
            ? `<div class="section-count">
                <strong>${completed}/${section.total}</strong>
                ${progressBar(percent, "section")}
              </div>`
            : ""
        }
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
        const themeStyle = getSectionThemeStyle(section);
        return `
          <button class="section-card" data-action="open-section" data-section="${escapeAttr(section.nome)}" style="${escapeAttr(themeStyle)}">
            <div class="section-icon">${getSectionIcon(section)}</div>
            <div class="section-info">
              <h2>${section.nome}</h2>
              <p>${section.grupo || section.codigo}</p>
              ${progressBar(percent, "section")}
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
  const themeStyle = getStickerThemeStyle(sticker);
  return `
    <button
      class="sticker-card ${owned ? "owned" : ""} ${repeated ? "repeated" : ""}"
      data-code="${sticker.codigo}"
      data-context="${context}"
      style="${escapeAttr(themeStyle)}"
      aria-label="Figurinha ${sticker.codigo}, colada ${owned ? "sim" : "não"}, repetidas ${repeated}"
    >
      <span class="sticker-code">${sticker.codigo}</span>
      ${sticker.nome ? `<span class="sticker-name">${escapeHtml(sticker.nome)}</span>` : ""}
      ${repeated ? `<span class="repeat-badge">+${repeated}</span>` : ""}
    </button>
  `;
}

function renderSearchResult(sticker) {
  const repeated = getRepeated(sticker);
  const owned = isOwned(sticker);
  const themeStyle = getStickerThemeStyle(sticker);
  return `
    <article class="search-result" style="${escapeAttr(themeStyle)}">
      <button class="sticker-card ${owned ? "owned" : ""} ${repeated ? "repeated" : ""}" data-code="${sticker.codigo}" data-context="search" style="${escapeAttr(themeStyle)}">
        <span class="sticker-code">${sticker.codigo}</span>
        ${sticker.nome ? `<span class="sticker-name">${escapeHtml(sticker.nome)}</span>` : ""}
        ${repeated ? `<span class="repeat-badge">+${repeated}</span>` : ""}
      </button>
      <div>
        <h2>${sticker.codigo}</h2>
        <p>${sticker.nome || sticker.secao}</p>
        <span>${sticker.nome ? `${sticker.secao} · ` : ""}${owned ? "Colada" : "Não colada"} · Repetidas ${repeated} · Total ${getTotal(sticker)}</span>
      </div>
    </article>
  `;
}

function renderSearchContent(searchView, term) {
  if (!term) return emptyState("Busque pelo código da figurinha ou pelo país.");
  if (searchView.type === "sections") {
    return searchView.sections.map((section) => renderQuickSection(section, "search-section")).join("");
  }

  return `
    <section class="result-list">
      ${searchView.stickers.map(renderSearchResult).join("") || emptyState("Nenhuma figurinha encontrada.")}
    </section>
  `;
}

// Decide se a busca deve abrir uma seção completa ou uma lista de figurinhas.
function getSearchView(query) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return { type: "empty", sections: [], stickers: [] };

  const sections = getSearchSections(normalizedQuery);
  if (sections.length) return { type: "sections", sections, stickers: [] };

  return { type: "stickers", sections: [], stickers: getSearchResults(query) };
}

function getSearchSections(normalizedQuery) {
  const sections = getSections(state.stickers);
  const groupSections = getSearchGroupSections(normalizedQuery, sections);
  if (groupSections) return groupSections;

  return sections.filter((section) => sectionMatchesSearch(section, normalizedQuery));
}

function getSearchGroupSections(normalizedQuery, sections) {
  if (normalizedQuery !== "FWC" && !normalizedQuery.includes("GRUPO")) return null;

  if (normalizedQuery === "FWC") {
    return sections.filter((section) => normalizeSearch(section.grupo) === "FWC" || getSectionCode(section) === "FWC");
  }

  const groupCode = normalizedQuery.split(/\s+/).find((part) => /^[A-L]$/.test(part));
  if (!groupCode) return [];
  return sections.filter((section) => normalizeSearch(section.grupo) === `GRUPO ${groupCode}`);
}

function sectionMatchesSearch(section, normalizedQuery) {
  const sectionCode = normalizeSearch(getSectionCode(section));
  const fields = [section.nome, section.codigo, section.grupo, sectionCode].map(normalizeSearch).filter(Boolean);
  return fields.some((field) => field === normalizedQuery || (normalizedQuery.length >= 3 && field.includes(normalizedQuery)));
}

function getSearchResults(query) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return [];

  return state.stickers.filter((sticker) => {
    const fields = [sticker.codigo, sticker.nome, sticker.secao, sticker.grupo].map(normalizeSearch);
    return fields.some((field) => field.includes(normalizedQuery));
  });
}

function getSectionIcon(section) {
  const sectionCode = getSectionCode(section);
  if (sectionCode === "CC") return iconImage("assets/icons/coke.svg", "Coca-Cola", "icon-image");
  if (sectionCode === "FWC") {
    const iconName = section.nome.includes("Parte 1") ? "stadium" : "trophy";
    const label = section.nome.includes("Parte 1") ? "Estádio de futebol" : "Taça da Copa";
    return iconImage(`assets/icons/${iconName}.svg`, label, "icon-image");
  }

  return iconImage(`assets/flags/${sectionCode}.svg`, `Bandeira ${section.nome}`, "flag-image");
}

function getSectionCode(section) {
  if (section.nome === "Coca-Cola") return "CC";
  if (section.nome.startsWith("FWC")) return "FWC";
  const firstCode = section.stickers?.[0]?.codigo || "";
  return firstCode.match(/^[A-Z]+/)?.[0] || section.codigo || "";
}

function getStickerSectionCode(sticker) {
  if (sticker.codigo === "00" || sticker.codigo.startsWith("FWC")) return "FWC";
  if (sticker.codigo.startsWith("CC")) return "CC";
  return sticker.codigo.match(/^[A-Z]+/)?.[0] || "";
}

function getSectionThemeStyle(sectionOrCode) {
  const code = typeof sectionOrCode === "string" ? sectionOrCode : getSectionCode(sectionOrCode);
  const theme = SECTION_THEMES[code] || SECTION_THEMES.FWC;
  const primaryRgb = hexToRgb(theme.primary);
  const secondaryRgb = hexToRgb(theme.secondary);
  const primaryLuminance = getColorLuminance(theme.primary);
  const secondaryLuminance = getColorLuminance(theme.secondary);
  const progressStart = secondaryLuminance > primaryLuminance ? theme.secondary : theme.primary;
  const progressEnd = secondaryLuminance > primaryLuminance ? theme.primary : theme.secondary;
  return [
    `--section-accent:${theme.primary}`,
    `--section-accent-rgb:${primaryRgb}`,
    `--section-secondary:${theme.secondary}`,
    `--section-secondary-rgb:${secondaryRgb}`,
    `--section-progress-start:${progressStart}`,
    `--section-progress-end:${progressEnd}`,
    `--section-badge-text:${getReadableTextColor(theme.secondary)}`
  ].join(";");
}

function getStickerThemeStyle(sticker) {
  return getSectionThemeStyle(getStickerSectionCode(sticker));
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `${red},${green},${blue}`;
}

function getReadableTextColor(hex) {
  const luminance = getColorLuminance(hex);
  return luminance > 150 ? "#111827" : "#ffffff";
}

function getColorLuminance(hex) {
  const [red, green, blue] = hexToRgb(hex).split(",").map(Number);
  return (red * 299 + green * 587 + blue * 114) / 1000;
}

function iconImage(src, alt, className) {
  return `<img class="${escapeAttr(className)}" src="${src}" alt="${escapeAttr(alt)}" loading="lazy" />`;
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
  if (action === "open-conference") openConferenceSheet();
  if (action === "select-album") await selectAlbum(target.dataset.albumId);
  if (action === "open-album-form") openAlbumForm(target.dataset.albumMode, target.dataset.albumId);
  if (action === "save-album") await saveAlbumForm(target);
  if (action === "open-album-delete") openDeleteAlbumSheet(target.dataset.albumId);
  if (action === "confirm-delete-album") await deleteAlbum(target.dataset.albumId);
  if (action === "analyze-conference") analyzeConferenceSheet();
  if (action === "copy-conference") copyConferenceList();
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

async function selectAlbum(albumId, message = "Álbum selecionado.") {
  if (!albumId || albumId === state.activeAlbumId || state.busy) return;
  const previousAlbumId = state.activeAlbumId;
  const previousStickers = state.stickers;
  state.busy = true;
  state.activeAlbumId = albumId;
  state.stickers = buildAlbum();
  render();

  try {
    state.stickers = await store.load(buildAlbum(), albumId);
    await store.subscribe(albumId, handleRemoteStatusChange);
    storeActiveAlbumId(albumId);
    notify(message);
  } catch (error) {
    state.activeAlbumId = previousAlbumId;
    state.stickers = previousStickers;
    await store.subscribe(previousAlbumId, handleRemoteStatusChange);
    console.error(error);
    notify("Falha ao trocar de álbum.");
  } finally {
    state.busy = false;
    render();
  }
}

function openAlbumForm(mode = "create", albumId = "") {
  const isEdit = mode === "edit";
  const album = isEdit ? findAlbum(albumId) : null;
  if (isEdit && !album) return;
  const title = isEdit ? "Editar álbum" : "Novo álbum";
  const buttonLabel = isEdit ? "Salvar nome" : "Criar álbum";
  sheetRoot.innerHTML = `
    <div class="sheet-backdrop" data-action="close-sheet"></div>
    <section class="bottom-sheet album-sheet" role="dialog" aria-modal="true">
      <div class="sheet-handle"></div>
      <button class="sheet-close-button" data-action="close-sheet" aria-label="Fechar">${icon("x")}</button>
      <h2>${title}</h2>
      <p>${isEdit ? "Renomeie este álbum sem alterar as figurinhas já salvas." : "Crie um álbum zerado para controlar outra coleção separada."}</p>
      <label class="album-name-field">
        <span>Nome do álbum</span>
        <input id="album-name-input" value="${escapeAttr(album?.nome || "")}" placeholder="Ex.: Álbum do João" maxlength="64" autocomplete="off" />
      </label>
      <button class="primary-button full" data-action="save-album" data-album-mode="${isEdit ? "edit" : "create"}" data-album-id="${escapeAttr(album?.id || "")}">
        ${icon(isEdit ? "edit" : "plus")} ${buttonLabel}
      </button>
    </section>
  `;
  const input = document.querySelector("#album-name-input");
  input?.focus();
  input?.select();
}

async function saveAlbumForm(button) {
  if (state.busy) return;
  const input = document.querySelector("#album-name-input");
  const name = normalizeAlbumName(input?.value);
  if (!name) {
    notify("Informe um nome para o álbum.");
    input?.focus();
    return;
  }

  const mode = button.dataset.albumMode;
  const albumId = button.dataset.albumId;
  button.disabled = true;
  button.classList.add("loading");
  button.innerHTML = `${icon("loader")} Salvando...`;

  try {
    if (mode === "edit") {
      const album = await store.renameAlbum(albumId, name);
      state.albums = sortAlbums(state.albums.map((item) => (item.id === album.id ? album : item)));
      closeSheet();
      render();
      notify("Nome do álbum atualizado.");
      return;
    }

    const album = await store.createAlbum(name);
    state.albums = sortAlbums([...state.albums, album]);
    closeSheet();
    await selectAlbum(album.id, "Álbum criado e selecionado.");
  } catch (error) {
    console.error(error);
    notify("Falha ao salvar o álbum.");
  } finally {
    button.disabled = false;
    button.classList.remove("loading");
  }
}

function openDeleteAlbumSheet(albumId) {
  const album = findAlbum(albumId);
  if (!album) return;
  if (state.albums.length <= 1) {
    notify("Crie outro álbum antes de excluir o único álbum.");
    return;
  }

  sheetRoot.innerHTML = `
    <div class="sheet-backdrop" data-action="close-sheet"></div>
    <section class="bottom-sheet album-sheet" role="dialog" aria-modal="true">
      <div class="sheet-handle"></div>
      <button class="sheet-close-button" data-action="close-sheet" aria-label="Fechar">${icon("x")}</button>
      <h2>Excluir álbum</h2>
      <p>Isso apaga o álbum <strong>${escapeHtml(album.nome)}</strong> e todo o progresso salvo nele. Os outros álbuns não serão alterados.</p>
      <div class="sheet-actions">
        <button data-action="close-sheet">${icon("x")} Cancelar</button>
        <button class="danger" data-action="confirm-delete-album" data-album-id="${escapeAttr(album.id)}">${icon("trash")} Excluir álbum</button>
      </div>
    </section>
  `;
}

async function deleteAlbum(albumId) {
  const album = findAlbum(albumId);
  if (!album || state.busy || state.albums.length <= 1) return;

  const nextAlbum = state.albums.find((item) => item.id !== albumId);
  state.busy = true;
  try {
    await store.deleteAlbum(albumId);
    state.albums = sortAlbums(state.albums.filter((item) => item.id !== albumId));
    closeSheet();

    if (state.activeAlbumId === albumId && nextAlbum) {
      state.activeAlbumId = nextAlbum.id;
      state.stickers = await store.load(buildAlbum(), nextAlbum.id);
      await store.subscribe(nextAlbum.id, handleRemoteStatusChange);
      storeActiveAlbumId(nextAlbum.id);
    }

    notify("Álbum excluído.");
  } catch (error) {
    console.error(error);
    notify("Falha ao excluir o álbum.");
  } finally {
    state.busy = false;
    render();
  }
}

async function updateSticker(code, operation) {
  const sticker = findSticker(code);
  if (!sticker) return;

  const next = { ...sticker };
  if (operation === "own") next.colada = true;
  if (operation === "add-repeat") {
    next.colada = true;
    next.repetidas = getRepeated(next) + 1;
  }
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
  const total = getTotal(sticker);
  sheetRoot.innerHTML = `
    <div class="sheet-backdrop" data-action="close-sheet"></div>
    <section class="bottom-sheet" role="dialog" aria-modal="true">
      <div class="sheet-handle"></div>
      <button class="sheet-close-button" data-action="close-sheet" aria-label="Fechar">${icon("x")}</button>
      <h2>${sticker.codigo}</h2>
      <p>${sticker.nome ? `${escapeHtml(sticker.nome)} · ` : ""}${sticker.secao} · Total ${total} · ${repeated} repetida${repeated === 1 ? "" : "s"}</p>
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

function openConferenceSheet() {
  sheetRoot.innerHTML = `
    <div class="sheet-backdrop" data-action="close-sheet"></div>
    <section class="bottom-sheet conference-sheet" role="dialog" aria-modal="true">
      <div class="sheet-handle"></div>
      <button class="sheet-close-button" data-action="close-sheet" aria-label="Fechar">${icon("x")}</button>
      <h2>Conferência para Colar</h2>
      <p>Cole vários códigos separados por espaço, vírgula, quebra de linha ou uma combinação deles. Use parênteses para quantidades, como BRA1(5). Esta conferência não altera o álbum.</p>
      <textarea id="conference-input" placeholder="BRA1(5) BRA2&#10;BRA3, BRA4&#10;FWC12"></textarea>
      <button class="primary-button full" data-action="analyze-conference">
        ${icon("checklist")} Analisar Figurinhas
      </button>
      <div id="conference-results" class="conference-results" aria-live="polite"></div>
    </section>
  `;
}

function analyzeConferenceSheet() {
  const input = document.querySelector("#conference-input")?.value || "";
  const resultRoot = document.querySelector("#conference-results");
  const button = document.querySelector('[data-action="analyze-conference"]');
  if (!resultRoot || !button) return;

  button.disabled = true;
  button.classList.add("loading");
  button.innerHTML = `${icon("loader")} Analisando...`;
  resultRoot.innerHTML = `<div class="conference-loading">Analisando códigos...</div>`;

  window.setTimeout(() => {
    const result = analyzeConferenceInput(input, state.stickers);
    resultRoot.innerHTML = renderConferenceResult(result);
    button.disabled = false;
    button.classList.remove("loading");
    button.innerHTML = `${icon("checklist")} Analisar Figurinhas`;
  }, 80);
}

function renderConferenceResult(result) {
  return `
    <section class="conference-summary">
      <h3>Resultado da Conferência</h3>
      ${renderConferenceGroup("Figurinhas para colar", result.toPaste, "new", "Total novas", true)}
      ${renderConferenceGroup("Já existentes / repetidas", result.existing, "existing", "Total repetidas")}
      ${renderConferenceGroup("Códigos inválidos", result.invalid, "invalid", "Total inválidas")}
    </section>
  `;
}

function renderConferenceGroup(title, codes, tone, totalLabel, copyable = false) {
  const text = buildConferenceText(codes);
  const total = codes.reduce((sum, item) => sum + getConferenceItemTotal(item), 0);
  return `
    <article class="conference-group ${tone}">
      <div class="conference-group-head">
        <h4>${title}</h4>
        <strong>${totalLabel}: ${total}</strong>
      </div>
      ${
        codes.length
          ? `<textarea ${copyable ? 'id="conference-copy-text"' : ""} readonly>${escapeHtml(text)}</textarea>`
          : `<div class="conference-empty">Nenhum código nesta lista.</div>`
      }
      ${
        copyable && codes.length
          ? `<button class="secondary-button conference-copy-button" data-action="copy-conference">${icon("copy")} Copiar Lista</button>`
          : ""
      }
    </article>
  `;
}

function buildConferenceText(items) {
  if (!items.length) return "";
  if (typeof items[0] === "string") return items.join("\n");

  const sections = [];
  items.forEach((item) => {
    const current = sections.at(-1);
    if (!current || current.secao !== item.secao) {
      sections.push({ secao: item.secao, items: [item] });
      return;
    }
    current.items.push(item);
  });

  return sections.map((section) => section.items.map(formatConferenceCode).join(", ")).join("\n");
}

function formatConferenceCode(item) {
  if (typeof item === "string") return item;
  return item.total > 1 ? `${item.codigo} (${item.total})` : item.codigo;
}

function getConferenceItemTotal(item) {
  return typeof item === "string" ? 1 : item.total;
}

async function copyConferenceList() {
  const textArea = document.querySelector("#conference-copy-text");
  const text = textArea?.value || "";
  try {
    await navigator.clipboard.writeText(text);
    notify("Lista para colar copiada.");
  } catch {
    textArea?.select();
    notify("Selecione e copie a lista.");
  }
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

function getActiveAlbum() {
  return findAlbum(state.activeAlbumId) || state.albums[0] || getFallbackAlbums()[0];
}

function findAlbum(albumId) {
  return state.albums.find((album) => album.id === albumId);
}

function findSticker(code) {
  return state.stickers.find((sticker) => sticker.codigo === code);
}

function isOwned(sticker) {
  if ("colada" in sticker) return Boolean(sticker.colada) || getRepeated(sticker) > 0;
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
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  const stateClass = safePercent === 0 ? "empty" : safePercent === 100 ? "complete" : "";
  return `<div class="progress ${tone} ${stateClass}"><span style="width:${safePercent}%"></span></div>`;
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
    edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2m-1 0v14H9V6"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    checklist: '<svg viewBox="0 0 24 24"><path d="m9 11 2 2 4-5M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    loader: '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9"/></svg>'
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

