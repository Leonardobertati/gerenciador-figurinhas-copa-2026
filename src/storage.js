import { FIXED_SESSION_ID, SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config.js";

const LEGACY_LOCAL_KEY = "copa-2026-sticker-progress";

export class StickerStore {
  constructor() {
    this.client = hasSupabaseConfig()
      ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      : null;
    this.channel = null;
  }

  get mode() {
    return this.client ? "supabase" : "unconfigured";
  }

  async load(stickers) {
    this.ensureClient();

    let rows = await this.fetchStatusRows();
    if (!rows.length) {
      const migrated = await this.migrateLegacyLocalStorage(stickers);
      if (migrated) rows = await this.fetchStatusRows();
    }

    return applyProgress(stickers, rowsToProgress(rows));
  }

  subscribe(onStatusChange) {
    if (!this.client || this.channel) return;

    this.channel = this.client
      .channel(`album-session-${FIXED_SESSION_ID}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sticker_status",
          filter: `session_id=eq.${FIXED_SESSION_ID}`
        },
        (payload) => {
          const row = payload.new || payload.old;
          if (row?.codigo) onStatusChange(row);
        }
      )
      .subscribe();
  }

  async saveSticker(sticker) {
    this.ensureClient();
    const { error } = await this.client.from("sticker_status").upsert(
      serializeStatus(sticker),
      { onConflict: "session_id,codigo" }
    );
    if (error) throw error;
  }

  async saveStickers(stickers) {
    this.ensureClient();
    const rows = stickers.map(serializeStatus);
    const { error } = await this.client
      .from("sticker_status")
      .upsert(rows, { onConflict: "session_id,codigo" });
    if (error) throw error;
  }

  async fetchStatusRows() {
    const { data, error } = await this.client
      .from("sticker_status")
      .select("codigo, possui, repetidas, updated_at")
      .eq("session_id", FIXED_SESSION_ID);
    if (error) throw error;
    return data || [];
  }

  async migrateLegacyLocalStorage(stickers) {
    const legacyProgress = readLegacyLocalProgress();
    const knownCodes = new Set(stickers.map((sticker) => sticker.codigo));
    const rows = Object.entries(legacyProgress)
      .filter(([codigo]) => knownCodes.has(codigo))
      .map(([codigo, progress]) => {
        const normalized = normalizeProgress(progress);
        return {
          session_id: FIXED_SESSION_ID,
          codigo,
          possui: normalized.colada,
          repetidas: normalized.repetidas,
          updated_at: new Date().toISOString()
        };
      })
      .filter((row) => row.possui || row.repetidas > 0);

    if (!rows.length) return false;

    const { error } = await this.client
      .from("sticker_status")
      .upsert(rows, { onConflict: "session_id,codigo" });
    if (error) throw error;
    return true;
  }

  ensureClient() {
    if (!this.client) {
      throw new Error("Configure SUPABASE_URL e SUPABASE_ANON_KEY em src/supabase-config.js.");
    }
  }
}

export function applyStatusRow(sticker, row) {
  return {
    ...sticker,
    ...normalizeProgress(row)
  };
}

function hasSupabaseConfig() {
  return (
    SUPABASE_URL.startsWith("https://") &&
    SUPABASE_ANON_KEY.length > 20 &&
    Boolean(window.supabase)
  );
}

function readLegacyLocalProgress() {
  try {
    return JSON.parse(localStorage.getItem(LEGACY_LOCAL_KEY) || "{}");
  } catch {
    return {};
  }
}

function rowsToProgress(rows) {
  return Object.fromEntries((rows || []).map((item) => [item.codigo, item]));
}

function applyProgress(stickers, progress) {
  return stickers.map((sticker) => ({
    ...sticker,
    ...normalizeProgress(progress[sticker.codigo])
  }));
}

function normalizeProgress(progress) {
  if (!progress) return { colada: false, repetidas: 0, quantidadeTotal: 0 };

  if (typeof progress === "number") {
    const total = Math.max(0, progress);
    return {
      colada: total >= 1,
      repetidas: Math.max(0, total - 1),
      quantidadeTotal: total
    };
  }

  const repetidas = Math.max(0, Number(progress.repetidas || 0));
  const total = Math.max(0, Number(progress.quantidade_total ?? progress.quantidadeTotal ?? 0));
  const hasSeparatedValue =
    "possui" in progress ||
    "colada" in progress ||
    repetidas > 0 ||
    total === 0;
  const colada = hasSeparatedValue
    ? Boolean(progress.possui ?? progress.colada) || repetidas > 0
    : total >= 1;

  return {
    colada,
    repetidas,
    quantidadeTotal: Number(colada) + repetidas
  };
}

function serializeStatus(sticker) {
  const repetidas = Math.max(0, Number(sticker.repetidas || 0));
  return {
    session_id: FIXED_SESSION_ID,
    codigo: sticker.codigo,
    possui: Boolean(sticker.colada) || repetidas > 0,
    repetidas,
    updated_at: new Date().toISOString()
  };
}
