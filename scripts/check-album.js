import { buildAlbum, buildSections } from "../src/albumData.js";
import { STICKER_NAMES } from "../src/stickerNames.js";

const stickers = buildAlbum();
const sections = buildSections(stickers);

const failures = [];
if (stickers.length !== 994) failures.push(`Total esperado 994, recebido ${stickers.length}`);
if (sections.length !== 51) failures.push(`Seções esperadas 51, recebido ${sections.length}`);
if (sections[0].nome !== "FWC - Parte 1") failures.push("A primeira seção deve ser FWC - Parte 1");
if (sections[1].nome !== "FWC - Parte 2") failures.push("A segunda seção deve ser FWC - Parte 2");
if (sections.at(-1).nome !== "Coca-Cola") failures.push("A última seção deve ser Coca-Cola");

const senegalSectionIndex = sections.findIndex((section) => section.nome === "Senegal");
if (senegalSectionIndex === -1) failures.push("A seção Senegal deve existir");
if (sections[senegalSectionIndex - 1]?.nome !== "França") failures.push("Senegal deve continuar depois de França");
if (sections[senegalSectionIndex + 1]?.nome !== "Iraque") failures.push("Senegal deve continuar antes de Iraque");
if (!stickers.some((sticker) => sticker.codigo === "SEN1")) failures.push("Senegal deve usar o prefixo SEN");
const oldSenegalPrefix = "SE" + "M";
if (stickers.some((sticker) => sticker.codigo.startsWith(oldSenegalPrefix))) {
  failures.push("Prefixo antigo de Senegal não pode existir no álbum");
}

const duplicated = stickers
  .map((sticker) => sticker.codigo)
  .filter((code, index, list) => list.indexOf(code) !== index);
if (duplicated.length) failures.push(`Códigos duplicados: ${duplicated.join(", ")}`);

const stickerMap = new Map(stickers.map((sticker) => [sticker.codigo, sticker]));
const namedCodes = Object.entries(STICKER_NAMES);
if (namedCodes.length !== 80) failures.push(`Lote de nomes esperado 80, recebido ${namedCodes.length}`);
namedCodes.forEach(([codigo, nome]) => {
  const sticker = stickerMap.get(codigo);
  if (!sticker) failures.push(`Nome cadastrado para codigo inexistente: ${codigo}`);
  if (sticker && sticker.nome !== nome) failures.push(`Nome divergente em ${codigo}: ${sticker.nome}`);
});

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`OK: ${stickers.length} figurinhas em ${sections.length} seções.`);
