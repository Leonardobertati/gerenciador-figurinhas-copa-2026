// Classifies a pasted batch without mutating sticker state or persistence.
export function analyzeConferenceInput(input, stickers) {
  const stickerMap = new Map(stickers.map((sticker) => [sticker.codigo, sticker]));
  const grouped = new Map();
  const result = {
    toPaste: [],
    existing: [],
    invalid: []
  };

  normalizeConferenceCodes(input).forEach((rawCode) => {
    const parsed = parseConferenceCode(rawCode);
    if (!parsed) {
      result.invalid.push(rawCode);
      return;
    }

    const { codigo, total } = parsed;
    grouped.set(codigo, (grouped.get(codigo) || 0) + total);
  });

  grouped.forEach((total, codigo) => {
    const sticker = stickerMap.get(codigo);
    if (!sticker) {
      result.invalid.push(codigo);
      return;
    }

    if (isConferenceStickerOwned(sticker)) {
      result.existing.push({ codigo, total });
      return;
    }

    result.toPaste.push({ codigo, total: 1 });
    if (total > 1) {
      result.existing.push({ codigo, total: total - 1 });
    }
  });

  return result;
}

// Accepts pasted batches separated by spaces, commas, line breaks or a mix of them.
export function normalizeConferenceCodes(input) {
  return String(input || "")
    .split(/[\s,]+/)
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);
}

function parseConferenceCode(rawCode) {
  const match = rawCode.match(/^([A-Z]*[0-9]+)(?:\((\d+)\))?$/);
  if (!match) return null;
  return {
    codigo: match[1],
    total: Math.max(1, Number(match[2] || 1))
  };
}

function isConferenceStickerOwned(sticker) {
  const repeated = Math.max(0, Number(sticker.repetidas || 0));
  if ("colada" in sticker) return Boolean(sticker.colada) || repeated > 0;
  return Number(sticker.quantidadeTotal || 0) >= 1;
}
