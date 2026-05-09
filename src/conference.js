// Classifies a pasted batch without mutating sticker state or persistence.
export function analyzeConferenceInput(input, stickers) {
  const stickerMap = new Map(stickers.map((sticker) => [sticker.codigo, sticker]));
  const seen = new Set();
  const result = {
    toPaste: [],
    existing: [],
    invalid: []
  };

  normalizeConferenceCodes(input).forEach((code) => {
    if (seen.has(code)) return;
    seen.add(code);

    const sticker = stickerMap.get(code);
    if (!sticker) {
      result.invalid.push(code);
      return;
    }

    if (isConferenceStickerOwned(sticker)) {
      result.existing.push(code);
      return;
    }

    result.toPaste.push(code);
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

function isConferenceStickerOwned(sticker) {
  const repeated = Math.max(0, Number(sticker.repetidas || 0));
  if ("colada" in sticker) return Boolean(sticker.colada) || repeated > 0;
  return Number(sticker.quantidadeTotal || 0) >= 1;
}
