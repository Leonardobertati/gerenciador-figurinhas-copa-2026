import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const iconDir = join(root, "assets", "icons");
const flagDir = join(root, "assets", "flags");
mkdirSync(iconDir, { recursive: true });
mkdirSync(flagDir, { recursive: true });

const icons = {
  trophy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="bg" x1="20" x2="108" y1="16" y2="112" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#25304c"/><stop offset=".55" stop-color="#111827"/><stop offset="1" stop-color="#0b1020"/></linearGradient><linearGradient id="gold" x1="42" x2="88" y1="18" y2="112" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff4b0"/><stop offset=".2" stop-color="#facc15"/><stop offset=".55" stop-color="#d97706"/><stop offset="1" stop-color="#92400e"/></linearGradient><linearGradient id="glow" x1="38" x2="86" y1="20" y2="70" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fef9c3"/><stop offset=".5" stop-color="#fde047"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs><rect width="128" height="128" rx="32" fill="url(#bg)"/><circle cx="64" cy="47" r="28" fill="#facc15" opacity=".14"/><path d="M64 19c13 0 23 10 23 23 0 9-5 17-12 21 5 4 8 10 8 17 0 9-5 17-13 21h14c4 0 7 3 7 7v5H37v-5c0-4 3-7 7-7h14c-8-4-13-12-13-21 0-7 3-13 8-17-7-4-12-12-12-21 0-13 10-23 23-23Z" fill="url(#gold)"/><path d="M49 37c4-9 11-13 15-13 4 0 11 4 15 13-7-5-23-5-30 0Z" fill="#fff7c2" opacity=".8"/><path d="M44 44c5 5 11 8 20 8s15-3 20-8c-1 9-9 18-20 18s-19-9-20-18Z" fill="url(#glow)"/><path d="M50 68c4 5 8 8 14 8s10-3 14-8c-3 11-8 18-14 18s-11-7-14-18Z" fill="#b45309" opacity=".82"/><path d="M56 88h16l4 13H52Z" fill="#f59e0b"/><path d="M47 101h34l5 12H42Z" fill="#d97706"/><path d="M37 113h54v6H37Z" fill="#fde68a"/><path d="M38 47c-10-1-17 5-17 14 0 10 8 18 19 19" fill="none" stroke="#facc15" stroke-width="6" stroke-linecap="round"/><path d="M90 47c10-1 17 5 17 14 0 10-8 18-19 19" fill="none" stroke="#facc15" stroke-width="6" stroke-linecap="round"/><path d="M55 24c-5 5-7 11-7 18" fill="none" stroke="#fff7c2" stroke-width="4" stroke-linecap="round" opacity=".75"/><path d="M74 28c5 4 8 9 8 15" fill="none" stroke="#92400e" stroke-width="4" stroke-linecap="round" opacity=".45"/></svg>`,
  stadium: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="bg" x1="20" x2="108" y1="16" y2="112" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#334155"/><stop offset=".55" stop-color="#111827"/><stop offset="1" stop-color="#050816"/></linearGradient><linearGradient id="facade" x1="20" x2="110" y1="35" y2="91" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f8fafc"/><stop offset=".45" stop-color="#cbd5e1"/><stop offset="1" stop-color="#64748b"/></linearGradient><linearGradient id="pitch" x1="34" x2="96" y1="72" y2="105" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4ade80"/><stop offset="1" stop-color="#15803d"/></linearGradient></defs><rect width="128" height="128" rx="32" fill="url(#bg)"/><path d="M17 66c6-25 25-40 47-40s41 15 47 40v30H17Z" fill="#e2e8f0"/><path d="M23 66c6-21 22-33 41-33s35 12 41 33v22H23Z" fill="url(#facade)"/><path d="M30 65c6-16 19-24 34-24s28 8 34 24v12H30Z" fill="#0f172a"/><path d="M36 64c5-11 16-17 28-17s23 6 28 17v7H36Z" fill="#dbeafe"/><path d="M40 65c5-8 13-12 24-12s19 4 24 12" fill="none" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/><path d="M23 75h82v16H23Z" fill="#cbd5e1"/><path d="M29 78h70v4H29zm0 7h70v4H29" stroke="#64748b" stroke-width="2" opacity=".9"/><ellipse cx="64" cy="93" rx="42" ry="22" fill="#e5e7eb"/><ellipse cx="64" cy="94" rx="31" ry="14" fill="url(#pitch)"/><path d="M43 94h42M64 81v25" stroke="#bbf7d0" stroke-width="2.6" stroke-linecap="round" opacity=".85"/><path d="M53 88c6-4 16-4 22 0" fill="none" stroke="#bbf7d0" stroke-width="2.4" stroke-linecap="round" opacity=".85"/><g fill="#f8fafc"><rect x="20" y="61" width="8" height="33" rx="3"/><rect x="100" y="61" width="8" height="33" rx="3"/></g><g fill="#facc15"><circle cx="32" cy="39" r="2.6"/><circle cx="45" cy="32" r="2.6"/><circle cx="64" cy="29" r="3"/><circle cx="83" cy="32" r="2.6"/><circle cx="96" cy="39" r="2.6"/></g><path d="M22 67c9 7 23 11 42 11s33-4 42-11" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity=".75"/><path d="M34 50c8-8 18-12 30-12s22 4 30 12" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".65"/></svg>`,
  coke: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="32" fill="#2a1111"/><path d="M44 30h40l-6 80H50L44 30Z" fill="#ef4444"/><path d="M48 20h32v12H48z" fill="#f8fafc"/><path d="M49 51h30v32H49z" fill="#f8fafc" opacity=".95"/><path d="M55 67c6-8 14-8 20 0-6 8-14 8-20 0Z" fill="#dc2626"/></svg>`,
  ball: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#10224a"/><circle cx="256" cy="256" r="174" fill="#f8fafc"/><path d="M116 249c64-16 118 2 162 53 38 44 78 61 118 54" fill="none" stroke="#0b1220" stroke-width="12" opacity=".2"/><path d="M178 116c-5 75 23 123 84 145 56 20 87 58 95 112" fill="none" stroke="#0b1220" stroke-width="12" opacity=".2"/><path d="M122 221c76-62 150-75 221-39" fill="none" stroke="#ef4444" stroke-width="44" stroke-linecap="round"/><path d="M166 373c49-85 113-127 194-126" fill="none" stroke="#16a34a" stroke-width="44" stroke-linecap="round"/><path d="M309 113c33 58 51 121 54 190" fill="none" stroke="#2563eb" stroke-width="44" stroke-linecap="round"/><path d="M154 169c70 8 135 37 195 87" fill="none" stroke="#facc15" stroke-width="12" stroke-linecap="round"/><circle cx="256" cy="256" r="174" fill="none" stroke="#e5e7eb" stroke-width="10"/></svg>`
};

Object.entries(icons).forEach(([name, svg]) => writeFileSync(join(iconDir, `${name}.svg`), svg));
writeFileSync(join(root, "assets", "icon.svg"), icons.ball);

const simpleFlags = {
  MEX: vertical(["#006847", "#ffffff", "#ce1126"], emblem("MEX", "#b45309")),
  RSA: stripes(["#de3831", "#ffffff", "#007a4d", "#ffffff", "#002395"], "horizontal"),
  KOR: field("#ffffff", `<circle cx="32" cy="24" r="10" fill="#c60c30"/><path d="M22 24a10 10 0 0 0 20 0 10 5 0 0 1-20 0Z" fill="#003478"/><g stroke="#111827" stroke-width="2"><path d="M12 10h10M12 15h10M42 33h10M42 38h10M42 10h10M42 15h10M12 33h10M12 38h10"/></g>`),
  CZE: field("#ffffff", `<path d="M0 24h64v24H0z" fill="#d7141a"/><path d="M0 0 34 24 0 48Z" fill="#11457e"/>`),
  CAN: vertical(["#d52b1e", "#ffffff", "#d52b1e"], maple()),
  BIH: field("#002f6c", `<path d="M26 0h38v48H45Z" fill="#f7d116"/><g fill="#fff">${stars(9, 4, 4, 4, 5)}</g>`),
  QAT: field("#8a1538", `<path d="M0 0h22l-9 4 9 4-9 4 9 4-9 4 9 4-9 4 9 4-9 4 9 4-9 4 9 4H0Z" fill="#fff"/>`),
  SUI: field("#d52b1e", `<path d="M27 12h10v10h10v10H37v10H27V32H17V22h10Z" fill="#fff"/>`),
  BRA: field("#009b3a", `<path d="M32 6 58 24 32 42 6 24Z" fill="#ffdf00"/><circle cx="32" cy="24" r="11" fill="#002776"/><path d="M22 22c8-3 18-2 25 4" fill="none" stroke="#fff" stroke-width="2"/>`),
  MAR: field("#c1272d", starPath("#006233")),
  HAI: stripes(["#00209f", "#d21034"], "horizontal", emblem("HAI", "#ffffff")),
  SCO: field("#005eb8", `<path d="M0 0h10l54 40v8H54L0 8Z" fill="#fff"/><path d="M64 0v8L10 48H0v-8L54 0Z" fill="#fff"/>`),
  USA: usa(),
  PAR: stripes(["#d52b1e", "#ffffff", "#0038a8"], "horizontal", emblem("PAR", "#111827")),
  AUS: field("#012169", `<g transform="scale(.45)">${unionJack()}</g><g fill="#fff">${stars(5, 46, 16, 11, 8)}</g>`),
  TUR: field("#e30a17", `<circle cx="27" cy="24" r="12" fill="#fff"/><circle cx="31" cy="24" r="10" fill="#e30a17"/>${star(43, 24, 6, "#fff")}`),
  GER: stripes(["#000000", "#dd0000", "#ffce00"], "horizontal"),
  CUW: field("#002b7f", `<path d="M0 33h64v5H0z" fill="#f9e814"/><circle cx="16" cy="14" r="3" fill="#fff"/><circle cx="24" cy="20" r="2" fill="#fff"/>`),
  CIV: vertical(["#f77f00", "#ffffff", "#009e60"]),
  ECU: stripes(["#ffdd00", "#ffdd00", "#034ea2", "#ed1c24"], "horizontal", emblem("ECU", "#7c2d12")),
  NED: stripes(["#ae1c28", "#ffffff", "#21468b"], "horizontal"),
  JPN: field("#ffffff", `<circle cx="32" cy="24" r="13" fill="#bc002d"/>`),
  SWE: field("#006aa7", `<path d="M0 19h64v8H0zM22 0h8v48h-8z" fill="#fecc00"/>`),
  TUN: field("#e70013", `<circle cx="32" cy="24" r="14" fill="#fff"/><circle cx="35" cy="24" r="8" fill="#e70013"/><circle cx="38" cy="24" r="7" fill="#fff"/>${star(42, 24, 5, "#e70013")}`),
  BEL: vertical(["#000000", "#fae042", "#ed2939"]),
  EGY: stripes(["#ce1126", "#ffffff", "#000000"], "horizontal", emblem("EGY", "#c9a227")),
  IRN: stripes(["#239f40", "#ffffff", "#da0000"], "horizontal", emblem("IRN", "#da0000")),
  NZL: field("#012169", `<g transform="scale(.45)">${unionJack()}</g><g>${star(45, 16, 5, "#cc142b", "#fff")}${star(54, 23, 4, "#cc142b", "#fff")}${star(43, 32, 4, "#cc142b", "#fff")}${star(53, 37, 5, "#cc142b", "#fff")}</g>`),
  ESP: stripes(["#aa151b", "#f1bf00", "#f1bf00", "#aa151b"], "horizontal", emblem("ESP", "#aa151b")),
  CPV: field("#003893", `<path d="M0 28h64v5H0z" fill="#fff"/><path d="M0 33h64v4H0z" fill="#cf2027"/><g fill="#f7d116">${stars(10, 22, 24, 3, 7)}</g>`),
  KSA: field("#006c35", `<path d="M13 32h38" stroke="#fff" stroke-width="3"/><path d="M16 16h32v5H16z" fill="#fff" opacity=".9"/>`),
  URU: field("#ffffff", `<g>${Array.from({ length: 4 }, (_, i) => `<path d="M0 ${8 + i * 10}h64v5H0z" fill="#0038a8"/>`).join("")}</g><rect width="24" height="24" fill="#fff"/><circle cx="12" cy="12" r="6" fill="#fcd116"/>`),
  FRA: vertical(["#0055a4", "#ffffff", "#ef4135"]),
  SEN: stripes(["#00853f", "#fdef42", "#e31b23"], "vertical", star(32, 24, 7, "#00853f")),
  IRQ: stripes(["#ce1126", "#ffffff", "#000000"], "horizontal", `<path d="M20 25h24" stroke="#007a3d" stroke-width="4"/>`),
  NOR: field("#ba0c2f", `<path d="M0 17h64v14H0zM20 0h14v48H20z" fill="#fff"/><path d="M0 21h64v6H0zM24 0h6v48h-6z" fill="#00205b"/>`),
  ARG: stripes(["#74acdf", "#ffffff", "#74acdf"], "horizontal", `<circle cx="32" cy="24" r="6" fill="#f6b40e"/>`),
  ALG: vertical(["#006233", "#ffffff"], `<circle cx="34" cy="24" r="9" fill="#d21034"/><circle cx="37" cy="24" r="8" fill="#fff"/>${star(43, 24, 5, "#d21034")}`),
  AUT: stripes(["#ed2939", "#ffffff", "#ed2939"], "horizontal"),
  JOR: stripes(["#000000", "#ffffff", "#007a3d"], "horizontal", `<path d="M0 0 30 24 0 48Z" fill="#ce1126"/>${star(12, 24, 4, "#fff")}`),
  POR: vertical(["#006600", "#ff0000"], emblem("POR", "#facc15")),
  COD: field("#007fff", `<path d="M-4 42 58 -5h12L8 52Z" fill="#f7d618"/><path d="M0 44 60 -4h5L5 51Z" fill="#ce1021"/>${star(15, 13, 7, "#f7d618")}`),
  UZB: stripes(["#1eb5e5", "#ffffff", "#009b58"], "horizontal", `<path d="M0 16h64v2H0zM0 30h64v2H0z" fill="#ce1126"/><circle cx="13" cy="10" r="5" fill="#fff"/><circle cx="16" cy="10" r="5" fill="#1eb5e5"/>`),
  COL: stripes(["#fcd116", "#fcd116", "#003893", "#ce1126"], "horizontal"),
  ENG: field("#ffffff", `<path d="M0 20h64v8H0zM28 0h8v48h-8z" fill="#ce1124"/>`),
  CRO: stripes(["#ff0000", "#ffffff", "#171796"], "horizontal", emblem("CRO", "#ef4444")),
  GHA: stripes(["#ce1126", "#fcd116", "#006b3f"], "horizontal", star(32, 24, 7, "#000")),
  PAN: field("#ffffff", `<path d="M32 0h32v24H32z" fill="#d21034"/><path d="M0 24h32v24H0z" fill="#005293"/>${star(16, 12, 5, "#005293")}${star(48, 36, 5, "#d21034")}`)
};

// Country flags are maintained as official SVG assets in assets/flags.
// Keep this generator from replacing them with older placeholder drawings.
if (process.env.GENERATE_PLACEHOLDER_FLAGS === "1") {
  Object.entries(simpleFlags).forEach(([code, svg]) => writeFileSync(join(flagDir, `${code}.svg`), svg));
}

function svg(content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 48">${content}</svg>`;
}

function field(fill, content = "") {
  return svg(`<rect width="64" height="48" fill="${fill}"/>${content}`);
}

function stripes(colors, direction, extra = "") {
  if (direction === "vertical") return vertical(colors, extra);
  const h = 48 / colors.length;
  return svg(colors.map((color, i) => `<path d="M0 ${i * h}h64v${h}H0z" fill="${color}"/>`).join("") + extra);
}

function vertical(colors, extra = "") {
  const w = 64 / colors.length;
  return svg(colors.map((color, i) => `<path d="M${i * w} 0h${w}v48H${i * w}z" fill="${color}"/>`).join("") + extra);
}

function emblem(text, fill) {
  return `<circle cx="32" cy="24" r="9" fill="${fill}" opacity=".9"/><text x="32" y="27" font-size="7" font-family="Arial" text-anchor="middle" fill="#fff" font-weight="700">${text.slice(0, 3)}</text>`;
}

function star(cx, cy, r, fill, stroke = "") {
  const points = Array.from({ length: 10 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? r : r * 0.42;
    return `${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`;
  }).join(" ");
  return `<polygon points="${points}" fill="${fill}" ${stroke ? `stroke="${stroke}" stroke-width="1.5"` : ""}/>`;
}

function stars(count, x, y, r, gap) {
  return Array.from({ length: count }, (_, i) => star(x + (i % 5) * gap, y + Math.floor(i / 5) * gap, r, "currentColor")).join("");
}

function starPath(fill) {
  return star(32, 24, 9, fill);
}

function maple() {
  return `<path d="M32 10 35 20 43 16 40 25 48 27 38 31 42 39 32 34 22 39 26 31 16 27 24 25 21 16 29 20Z" fill="#d52b1e"/>`;
}

function unionJack() {
  return `<rect width="64" height="48" fill="#012169"/><path d="M0 0h8l56 42v6h-8L0 6zM64 0v6L8 48H0v-6L56 0z" fill="#fff"/><path d="M0 0h4l60 45v3h-4L0 3zM64 0v3L4 48H0v-3L60 0z" fill="#c8102e"/><path d="M27 0h10v48H27zM0 19h64v10H0z" fill="#fff"/><path d="M29 0h6v48h-6zM0 21h64v6H0z" fill="#c8102e"/>`;
}

function usa() {
  const rows = Array.from({ length: 13 }, (_, i) => `<path d="M0 ${i * 48 / 13}h64v${48 / 13}H0z" fill="${i % 2 ? "#fff" : "#b22234"}"/>`).join("");
  return svg(`${rows}<rect width="28" height="26" fill="#3c3b6e"/><g fill="#fff">${stars(12, 4, 4, 2, 5)}</g>`);
}
