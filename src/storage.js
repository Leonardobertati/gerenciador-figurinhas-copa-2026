import { FIXED_USER_ID, SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config.js";

const LOCAL_KEY = "copa-2026-sticker-progress";

function hasSupabaseConfig() {
  return SUPABASE_URL.startsWith("https://") && SUPABASE_ANON_KEY.length > 20 && window.supabase;
}

function getLocalProgress() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}");
  } catch {
    return {};
  }
}

function setLocalProgress(progress) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(progress));
}

export class StickerStore {
  constructor() {
    this.client = hasSupabaseConfig()
      ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      : null;
  }

  get mode() {
    return this.client ? "supabase" : "local";
  }

  async load(stickers) {
    if (!this.client) {
      return applyProgress(stickers, getLocalProgress());
    }

    let { data, error } = await this.client
      .from("user_sticker_status")
      .select("codigo, colada, repetidas, quantidade_total")
      .eq("user_id", FIXED_USER_ID);

    if (error) {
      const fallback = await this.client
        .from("user_sticker_status")
        .select("codigo, quantidade_total")
        .eq("user_id", FIXED_USER_ID);
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    const progress = Object.fromEntries((data || []).map((item) => [item.codigo, item]));
    return applyProgress(stickers, progress);
  }

  async saveSticker(sticker) {
    if (!this.client) {
      const progress = getLocalProgress();
      progress[sticker.codigo] = serializeSticker(sticker);
      setLocalProgress(progress);
      return;
    }

    let { error } = await this.client.from("user_sticker_status").upsert(
      {
        user_id: FIXED_USER_ID,
        codigo: sticker.codigo,
        colada: sticker.colada,
        repetidas: sticker.repetidas,
        quantidade_total: getTotal(sticker),
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id,codigo" }
    );

    if (error) {
      const fallback = await this.client.from("user_sticker_status").upsert(
        {
          user_id: FIXED_USER_ID,
          codigo: sticker.codigo,
          quantidade_total: getTotal(sticker),
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id,codigo" }
      );
      error = fallback.error;
    }

    if (error) throw error;
  }

  async saveStickers(stickers) {
    if (!this.client) {
      const progress = Object.fromEntries(
        stickers.map((sticker) => [sticker.codigo, serializeSticker(sticker)])
      );
      setLocalProgress(progress);
      return;
    }

    const rows = stickers.map((sticker) => ({
      user_id: FIXED_USER_ID,
      codigo: sticker.codigo,
      colada: sticker.colada,
      repetidas: sticker.repetidas,
      quantidade_total: getTotal(sticker),
      updated_at: new Date().toISOString()
    }));

    let { error } = await this.client
      .from("user_sticker_status")
      .upsert(rows, { onConflict: "user_id,codigo" });

    if (error) {
      const fallbackRows = stickers.map((sticker) => ({
        user_id: FIXED_USER_ID,
        codigo: sticker.codigo,
        quantidade_total: getTotal(sticker),
        updated_at: new Date().toISOString()
      }));
      const fallback = await this.client
        .from("user_sticker_status")
        .upsert(fallbackRows, { onConflict: "user_id,codigo" });
      error = fallback.error;
    }

    if (error) throw error;
  }
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

  if (typeof progress === "object" && "colada" in progress) {
    const total = Math.max(0, Number(progress.quantidade_total ?? progress.quantidadeTotal ?? 0));
    const hasSeparatedValue = Boolean(progress.colada) || Number(progress.repetidas || 0) > 0 || total === 0;
    const colada = hasSeparatedValue ? Boolean(progress.colada) : total >= 1;
    const repetidas = hasSeparatedValue
      ? Math.max(0, Number(progress.repetidas || 0))
      : Math.max(0, total - 1);
    return { colada, repetidas, quantidadeTotal: Number(colada) + repetidas };
  }

  const total = Math.max(0, Number(progress.quantidade_total ?? progress.quantidadeTotal ?? 0));
  return {
    colada: total >= 1,
    repetidas: Math.max(0, total - 1),
    quantidadeTotal: total
  };
}

function serializeSticker(sticker) {
  return {
    colada: Boolean(sticker.colada),
    repetidas: Math.max(0, Number(sticker.repetidas || 0)),
    quantidadeTotal: getTotal(sticker)
  };
}

function getTotal(sticker) {
  return Number(Boolean(sticker.colada)) + Math.max(0, Number(sticker.repetidas || 0));
}
