import { buildAlbum } from "../src/albumData.js";
import { analyzeConferenceInput, normalizeConferenceCodes } from "../src/conference.js";

const stickers = buildAlbum().map((sticker) => {
  if (sticker.codigo === "BRA1") return { ...sticker, colada: true, quantidadeTotal: 1 };
  if (sticker.codigo === "BRA2") return { ...sticker, repetidas: 1, quantidadeTotal: 2 };
  return sticker;
});

const bigInput = [
  "BRA1(5) BRA2(3)",
  "bra3(5), BRA4",
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
if (!hasEntry(result.existing, "BRA1", 5) || !hasEntry(result.existing, "BRA2", 3)) failures.push("Figurinhas ja possuidas devem ir para existentes com a quantidade inteira.");
if (!hasEntry(result.toPaste, "BRA3", 1) || !hasEntry(result.toPaste, "BRA4", 1) || !hasEntry(result.toPaste, "FWC12", 1)) failures.push("Figurinhas ainda nao possuidas devem ir para colar uma vez.");
if (!hasEntry(result.existing, "BRA3", 4)) failures.push("Excedente de codigo ainda nao possuido deve ir para repetidas.");
if (!result.invalid.includes("ABC99") || !result.invalid.includes("TESTE")) failures.push("Codigos fora do album devem ir para invalidos.");
if (result.toPaste.filter((item) => item.codigo === "BRA3").length !== 1) failures.push("Duplicados da entrada devem ser ignorados.");
if (result.toPaste.filter((item) => item.codigo.startsWith("MEX")).length !== 20) failures.push("Lista grande deve deduplicar sem perder codigos validos.");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("OK: conferencia classifica novas, existentes, invalidas, duplicadas e lista grande.");

function hasEntry(items, codigo, total) {
  return items.some((item) => item.codigo === codigo && item.total === total);
}
