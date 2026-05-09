export const OFFICIAL_SECTIONS = [
  { codigo: "FWC", nome: "Fifa World Cup" },
  { codigo: "MEX", nome: "México" },
  { codigo: "RSA", nome: "África do Sul" },
  { codigo: "KOR", nome: "Coreia do Sul" },
  { codigo: "CZE", nome: "República Tcheca" },
  { codigo: "CAN", nome: "Canadá" },
  { codigo: "BIH", nome: "Bósnia e Herzegovina" },
  { codigo: "QAT", nome: "Catar" },
  { codigo: "SUI", nome: "Suíça" },
  { codigo: "BRA", nome: "Brasil" },
  { codigo: "MAR", nome: "Marrocos" },
  { codigo: "HAI", nome: "Haiti" },
  { codigo: "SCO", nome: "Escócia" },
  { codigo: "USA", nome: "Estados Unidos" },
  { codigo: "PAR", nome: "Paraguai" },
  { codigo: "AUS", nome: "Austrália" },
  { codigo: "TUR", nome: "Turquia" },
  { codigo: "GER", nome: "Alemanha" },
  { codigo: "CUW", nome: "Curaçao" },
  { codigo: "CIV", nome: "Costa do Marfim" },
  { codigo: "ECU", nome: "Equador" },
  { codigo: "NED", nome: "Holanda" },
  { codigo: "JPN", nome: "Japão" },
  { codigo: "SWE", nome: "Suécia" },
  { codigo: "TUN", nome: "Tunísia" },
  { codigo: "BEL", nome: "Bélgica" },
  { codigo: "EGY", nome: "Egito" },
  { codigo: "IRN", nome: "Irã" },
  { codigo: "NZL", nome: "Nova Zelândia" },
  { codigo: "ESP", nome: "Espanha" },
  { codigo: "CPV", nome: "Cabo Verde" },
  { codigo: "KSA", nome: "Arábia Saudita" },
  { codigo: "URU", nome: "Uruguai" },
  { codigo: "FRA", nome: "França" },
  { codigo: "SEN", nome: "Senegal" },
  { codigo: "IRQ", nome: "Iraque" },
  { codigo: "NOR", nome: "Noruega" },
  { codigo: "ARG", nome: "Argentina" },
  { codigo: "ALG", nome: "Argélia" },
  { codigo: "AUT", nome: "Áustria" },
  { codigo: "JOR", nome: "Jordânia" },
  { codigo: "POR", nome: "Portugal" },
  { codigo: "COD", nome: "Congo RD" },
  { codigo: "UZB", nome: "Uzbequistão" },
  { codigo: "COL", nome: "Colômbia" },
  { codigo: "ENG", nome: "Inglaterra" },
  { codigo: "CRO", nome: "Croácia" },
  { codigo: "GHA", nome: "Gana" },
  { codigo: "PAN", nome: "Panamá" },
  { codigo: "CC", nome: "Coca-Cola" }
];

const GROUP_NAMES = [
  "Grupo A",
  "Grupo B",
  "Grupo C",
  "Grupo D",
  "Grupo E",
  "Grupo F",
  "Grupo G",
  "Grupo H",
  "Grupo I",
  "Grupo J",
  "Grupo K",
  "Grupo L"
];

const fwcPart1Codes = ["00", "FWC1", "FWC2", "FWC3", "FWC4", "FWC5", "FWC6", "FWC7", "FWC8"];

export function buildAlbum() {
  const stickers = [];
  let globalOrder = 1;

  const addSticker = ({ codigo, secao, grupo = "", ordemSecao, ordemFigurinha }) => {
    stickers.push({
      id: codigo,
      codigo,
      secao,
      grupo,
      ordemSecao,
      ordemFigurinha,
      ordemAlbum: globalOrder,
      colada: false,
      repetidas: 0,
      quantidadeTotal: 0
    });
    globalOrder += 1;
  };

  fwcPart1Codes.forEach((codigo, index) => {
    addSticker({
      codigo,
      secao: "FWC - Parte 1",
      grupo: "FWC",
      ordemSecao: 1,
      ordemFigurinha: index + 1
    });
  });

  Array.from({ length: 11 }, (_, index) => `FWC${index + 9}`).forEach((codigo, index) => {
    addSticker({
      codigo,
      secao: "FWC - Parte 2",
      grupo: "FWC",
      ordemSecao: 2,
      ordemFigurinha: index + 1
    });
  });

  OFFICIAL_SECTIONS.slice(1, -1).forEach((section, index) => {
    const ordemSecao = index + 3;
    const grupo = GROUP_NAMES[Math.floor(index / 4)] ?? "";
    Array.from({ length: 20 }, (_, stickerIndex) => {
      addSticker({
        codigo: `${section.codigo}${stickerIndex + 1}`,
        secao: section.nome,
        grupo,
        ordemSecao,
        ordemFigurinha: stickerIndex + 1
      });
    });
  });

  Array.from({ length: 14 }, (_, index) => `CC${index + 1}`).forEach((codigo, index) => {
    addSticker({
      codigo,
      secao: "Coca-Cola",
      grupo: "CC",
      ordemSecao: 51,
      ordemFigurinha: index + 1
    });
  });

  return stickers;
}

export function buildSections(stickers) {
  const sectionMap = new Map();
  stickers.forEach((sticker) => {
    if (!sectionMap.has(sticker.secao)) {
      sectionMap.set(sticker.secao, {
        nome: sticker.secao,
        codigo: sticker.grupo,
        grupo: sticker.grupo?.startsWith("Grupo") ? sticker.grupo : "",
        ordemSecao: sticker.ordemSecao,
        total: 0,
        stickers: []
      });
    }
    const section = sectionMap.get(sticker.secao);
    section.total += 1;
    section.stickers.push(sticker);
  });
  return [...sectionMap.values()].sort((a, b) => a.ordemSecao - b.ordemSecao);
}
