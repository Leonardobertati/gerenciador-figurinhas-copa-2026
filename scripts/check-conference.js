import { buildAlbum } from "../src/albumData.js";
import { analyzeConferenceInput, normalizeConferenceCodes } from "../src/conference.js";

const stickers = buildAlbum().map((sticker) => {
  if (sticker.codigo === "BRA1") return { ...sticker, colada: true, quantidadeTotal: 1 };
  if (sticker.codigo === "BRA2") return { ...sticker, repetidas: 1, quantidadeTotal: 2 };
  return sticker;
});

const bigInput = [
  "BRA1 BRA2",
  "bra3, BRA4",
  "FWC12",
  "ABC99",
  "TESTE",
  "BRA3",
  ...Array.from({ length: 120 }, (_, index) => `MEX${(index % 20) + 1}`)
].join("\n");

const result = analyzeConferenceInput(bigInput, stickers);
const normalized = normalizeConferenceCodes(" bra1,\nBra2   FWC12 ");
const failures = [];

if (normalized.join("|") !== "BRA1|BRA2|FWC12") failures.push("Normalizacao deve aceitar espaco, virgula e quebra de linha.");
if (!result.existing.includes("BRA1") || !result.existing.includes("BRA2")) failures.push("Figurinhas ja possuidas devem ir para existentes.");
if (!result.toPaste.includes("BRA3") || !result.toPaste.includes("BRA4") || !result.toPaste.includes("FWC12")) failures.push("Figurinhas ainda nao possuidas devem ir para colar.");
if (!result.invalid.includes("ABC99") || !result.invalid.includes("TESTE")) failures.push("Codigos fora do album devem ir para invalidos.");
if (result.toPaste.filter((code) => code === "BRA3").length !== 1) failures.push("Duplicados da entrada devem ser ignorados.");
if (result.toPaste.filter((code) => code.startsWith("MEX")).length !== 20) failures.push("Lista grande deve deduplicar sem perder codigos validos.");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("OK: conferencia classifica novas, existentes, invalidas, duplicadas e lista grande.");
