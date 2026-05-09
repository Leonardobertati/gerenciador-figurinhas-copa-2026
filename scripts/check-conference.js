import { buildAlbum } from "../src/albumData.js";
import { analyzeConferenceInput, normalizeConferenceCodes } from "../src/conference.js";

const stickers = buildAlbum().map((sticker) => {
  if (sticker.codigo === "BRA1") return { ...sticker, colada: true, quantidadeTotal: 1 };
  if (sticker.codigo === "BRA2") return { ...sticker, repetidas: 1, quantidadeTotal: 2 };
  return sticker;
});

const bigInput = [
  "BRA1(5) BRA2(3)",
  "bra3(5), BRA4, KOR8(2), KOR8",
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
if (!hasEntry(result.existing, "BRA1", 5) || !hasEntry(result.existing, "BRA2", 3)) failures.push("Figurinhas ja possuidas devem considerar toda a quantidade digitada como repetida.");
if (!hasEntry(result.toPaste, "BRA3", 1) || !hasEntry(result.toPaste, "BRA4", 1) || !hasEntry(result.toPaste, "FWC12", 1) || !hasEntry(result.toPaste, "KOR8", 1)) failures.push("Figurinhas ainda nao possuidas devem ir para colar uma vez.");
if (!hasEntry(result.existing, "BRA3", 5)) failures.push("Excedente de codigo ainda nao possuido deve ir para repetidas com duplicados somados.");
if (!hasEntry(result.existing, "KOR8", 2)) failures.push("Ocorrencias repetidas do mesmo codigo devem somar quantidades antes da conferencia.");
if (!result.invalid.includes("ABC99") || !result.invalid.includes("TESTE")) failures.push("Codigos fora do album devem ir para invalidos.");
if (result.toPaste.filter((item) => item.codigo === "BRA3").length !== 1) failures.push("Duplicados da entrada devem gerar uma unica linha agregada.");
if (result.toPaste.filter((item) => item.codigo.startsWith("MEX")).length !== 20) failures.push("Lista grande deve deduplicar sem perder codigos validos.");
if (result.toPaste.map((item) => item.codigo).join("|").indexOf("FWC12|MEX1") !== 0) failures.push("Lista para colar deve seguir a ordem padrao do album.");
if (result.existing.findIndex((item) => item.codigo === "KOR8") > result.existing.findIndex((item) => item.codigo === "BRA1")) failures.push("Lista de existentes deve seguir a ordem padrao do album.");

const ownedKor8 = stickers.map((sticker) =>
  sticker.codigo === "KOR8" ? { ...sticker, colada: true, quantidadeTotal: 1 } : sticker
);
const ownedKor8Result = analyzeConferenceInput("kor8(2), kor8", ownedKor8);
if (!hasEntry(ownedKor8Result.existing, "KOR8", 3)) failures.push("Codigo ja existente no album deve somar todas as ocorrencias digitadas como repetidas.");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("OK: conferencia classifica novas, existentes, invalidas, duplicadas e lista grande.");

function hasEntry(items, codigo, total) {
  return items.some((item) => item.codigo === codigo && item.total === total);
}
