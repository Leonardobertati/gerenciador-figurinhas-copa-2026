import { FIXED_SESSION_ID, SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config.js";

const LEGACY_LOCAL_KEY = "copa-2026-sticker-progress";
const ACTIVE_ALBUM_KEY = "copa-2026-active-album";
const ALBUM_ID = "copa-2026";
export const DEFAULT_ALBUM_ID = FIXED_SESSION_ID;
export const DEFAULT_ALBUM_NAME = "Álbum principal";

export class StickerStore {
  constructor() {
    this.client = hasSupabaseConfig()
      ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      : null;
    this.channel = null;
    this.sessionId = DEFAULT_ALBUM_ID;
    this.saveQueue = Promise.resolve();
  }

  get mode() {
    return this.client ? "supabase" : "unconfigured";
  }

  // Album sessions let the same sticker catalog have independent progress sets.
  async loadAlbums() {
    this.ensureClient();

    const { data, error } = await this.client
      .from("album_sessions")
      .select("id, nome, created_at, updated_at")
      .eq("album_id", ALBUM_ID)
      .order("created_at", { ascending: true });

    if (error) throw error;
    const albums = normalizeAlbums(data);
    if (albums.length) return albums;

    const album = await this.createAlbum(DEFAULT_ALBUM_NAME, DEFAULT_ALBUM_ID);
    return [album];
  }

  async createAlbum(name, id = createAlbumId()) {
    this.ensureClient();
    const albumName = normalizeAlbumName(name) || DEFAULT_ALBUM_NAME;
    const { data, error } = await this.client
      .from("album_sessions")
      .insert({
        id,
        album_id: ALBUM_ID,
        nome: albumName
      })
      .select("id, nome, created_at, updated_at")
      .single();

    if (error) throw error;
    return normalizeAlbum(data);
  }

  async renameAlbum(id, name) {
    this.ensureClient();
    const albumName = normalizeAlbumName(name);
    if (!albumName) throw new Error("Informe um nome para o álbum.");

    const { data, error } = await this.client
      .from("album_sessions")
      .update({ nome: albumName })
      .eq("id", id)
      .select("id, nome, created_at, updated_at")
      .single();

    if (error) throw error;
    return normalizeAlbum(data);
  }

  async deleteAlbum(id) {
    this.ensureClient();
    const { error: statusError } = await this.client
      .from("sticker_status")
      .delete()
      .eq("session_id", id);

    if (statusError) throw statusError;

    const { error } = await this.client
      .from("album_sessions")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  // Loading a session applies only that album's status rows to a clean catalog.
  async load(stickers, sessionId = this.sessionId) {
    this.ensureClient();
    this.sessionId = sessionId || DEFAULT_ALBUM_ID;

    let rows = await this.fetchStatusRows(this.sessionId);
    if (!rows.length && this.sessionId === DEFAULT_ALBUM_ID) {
      const migrated = await this.migrateLegacyLocalStorage(stickers, this.sessionId);
      if (migrated) rows = await this.fetchStatusRows(this.sessionId);
    }

    return applyProgress(stickers, rowsToProgress(rows));
  }

  // Realtime is scoped to the selected album so other albums do not mutate the view.
  async subscribe(sessionId, onStatusChange) {
    if (!this.client) return;
    await this.unsubscribe();
    this.sessionId = sessionId || DEFAULT_ALBUM_ID;

    this.channel = this.client
      .channel(`album-session-${this.sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sticker_status",
          filter: `session_id=eq.${this.sessionId}`
        },
        (payload) => {
          const row = payload.new || payload.old;
          if (row?.codigo) onStatusChange(row);
        }
      )
      .subscribe();
  }

  async unsubscribe() {
    if (!this.client || !this.channel) return;
    await this.client.removeChannel(this.channel);
    this.channel = null;
  }

  async saveSticker(sticker) {
    this.ensureClient();
    const row = serializeStatus(sticker, this.sessionId);
    return this.enqueueSave(async () => {
      const { error } = await this.client.from("sticker_status").upsert(
        row,
        { onConflict: "session_id,codigo" }
      );
      if (error) throw error;
    });
  }

  async saveStickers(stickers) {
    this.ensureClient();
    const rows = stickers.map((sticker) => serializeStatus(sticker, this.sessionId));
    return this.enqueueSave(async () => {
      const { error } = await this.client
        .from("sticker_status")
        .upsert(rows, { onConflict: "session_id,codigo" });
      if (error) throw error;
    });
  }

  // Keeps rapid local edits persisted in the same order the user made them.
  enqueueSave(task) {
    const run = this.saveQueue.catch(() => {}).then(task);
    this.saveQueue = run;
    return run;
  }

  async fetchStatusRows(sessionId = this.sessionId) {
    const { data, error } = await this.client
      .from("sticker_status")
      .select("session_id, codigo, possui, repetidas, updated_at")
      .eq("session_id", sessionId || DEFAULT_ALBUM_ID);
    if (error) throw error;
    return data || [];
  }

  async migrateLegacyLocalStorage(stickers, sessionId = DEFAULT_ALBUM_ID) {
    const legacyProgress = readLegacyLocalProgress();
    const knownCodes = new Set(stickers.map((sticker) => sticker.codigo));
    const rows = Object.entries(legacyProgress)
      .filter(([codigo]) => knownCodes.has(codigo))
      .map(([codigo, progress]) => {
        const normalized = normalizeProgress(progress);
        return {
          session_id: sessionId,
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

export function getFallbackAlbums() {
  return [
    {
      id: DEFAULT_ALBUM_ID,
      nome: DEFAULT_ALBUM_NAME,
      created_at: "",
      updated_at: ""
    }
  ];
}

export function getStoredActiveAlbumId(albums) {
  const ids = new Set(albums.map((album) => album.id));
  const stored = localStorage.getItem(ACTIVE_ALBUM_KEY);
  if (stored && ids.has(stored)) return stored;
  return albums[0]?.id || DEFAULT_ALBUM_ID;
}

export function storeActiveAlbumId(id) {
  localStorage.setItem(ACTIVE_ALBUM_KEY, id || DEFAULT_ALBUM_ID);
}

export function normalizeAlbumName(name) {
  return String(name || "").replace(/\s+/g, " ").trim().slice(0, 64);
}

export function sortAlbums(albums) {
  return [...albums].sort((a, b) => {
    if (a.id === DEFAULT_ALBUM_ID) return -1;
    if (b.id === DEFAULT_ALBUM_ID) return 1;
    return String(a.created_at || "").localeCompare(String(b.created_at || ""));
  });
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

function serializeStatus(sticker, sessionId = DEFAULT_ALBUM_ID) {
  const repetidas = Math.max(0, Number(sticker.repetidas || 0));
  return {
    session_id: sessionId || DEFAULT_ALBUM_ID,
    codigo: sticker.codigo,
    possui: Boolean(sticker.colada) || repetidas > 0,
    repetidas,
    updated_at: new Date().toISOString()
  };
}

function createAlbumId() {
  if (globalThis.crypto?.randomUUID) return `album-${globalThis.crypto.randomUUID()}`;
  const random = Math.random().toString(36).slice(2, 10);
  return `album-${Date.now()}-${random}`;
}

function normalizeAlbums(albums) {
  return sortAlbums((albums || []).map(normalizeAlbum).filter(Boolean));
}

function normalizeAlbum(album) {
  if (!album?.id) return null;
  return {
    id: album.id,
    nome: normalizeAlbumName(album.nome) || DEFAULT_ALBUM_NAME,
    created_at: album.created_at || "",
    updated_at: album.updated_at || ""
  };
}
