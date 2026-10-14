// Fig 2.2g · Scramjet: vehículo hipersónico (tipo X-43) colgado de un pórtico, con la pared lateral cercana
// del módulo propulsor quitada para ver el conducto. node build.mjs [--audit]
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { k, G, A, DEG, escena, svgDe } from "../comun/kitfig.mjs";
import { piezas } from "../comun/piezas.mjs";
import { tarjeta, escribir, sinExport } from "../comun/pagina.mjs";
import { SCRAMJET, scramjet } from "./modelo.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 1000;
const H = 560;
const AZ = 70;
const EL = 18;
const Z0 = 56;
const SPAN = 30;
const BASE = { x: -50, y: -92, w: 400, d: 180, r: 10 };
const BASE_H = 10;
const FOOT_H = 6;
const SCRAMJET_RANGE = { ...SCRAMJET, mMin: 6 };

const P = k.fitProjection([...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [150, -70, Z0 + 132], [0, SPAN, Z0 + 30], [305, 0, Z0 + 72], [-40, 0, Z0 + 10], [340, 0, Z0 - 30]], W, H, { pad: 24, azimuth: AZ, elevation: EL });
const E = escena(P);
const { at, S, Ln, Dots, record, back, put, boxAt, cylAt } = E;
const X = piezas(E);
const { dial } = X;

// Perfiles en el plano (x, z) extruidos a lo ancho (y): marco con a = +y, u = +x, v = +z.
const FY = G.frameOf([0, 0, Z0], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
const prism = (part, name, poly, y0, y1, { tone = "hi", extra = "", F = FY, bias = 0 } = {}) => {
  const id = E.R.nameFor(`${part}.${name}`);
  const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
  const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
  const centre = G.add3(G.add3(F.o, G.mul3(F.a, (y0 + y1) / 2)), G.add3(G.mul3(F.u, cx), G.mul3(F.v, cy)));
  put(part, centre, S(G.prismOf(F, poly, y0, y1, P), { tone }) + extra, { bias, name: id, shapes: [record(A.prism(F, poly, y0, y1, { name: id }))] });
};
const pY = (x, y, z) => [x, y, Z0 + z];

// ---------- bancada ----------
back.push(`<path class="iso-halo" d="${k.haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P)}"/>`);
const FEET = [-30, 150, 330].flatMap((x) => [[x, BASE.y + 16], [x, BASE.y + BASE.d - 16]]).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
for (const [x, y] of FEET) {
  back.push(S(k.cylinder(x, y, 8, -BASE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
  back.push(S(k.cylinder(x, y, 6, -BASE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
}
back.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.4), { tone: "mid", inner: Ln(k.sideSeam(BASE, -5, P, 8), { tone: "faint" }) }));
record(A.slab(BASE, -BASE_H, BASE_H, { name: "stand.bancada" }));
back.push(Ln(k.planOutline(k.insetPlan(BASE, 6), 0, P), { tone: "lo" }));
const SCREWS = k.corners(BASE, 12);
back.push(Ln(SCREWS.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 18)).join(""), { tone: "lo" }));
back.push(Dots(SCREWS.map(([x, y]) => at([x, y, 0])), { size: 0.55 }));
const STRIP = { x: 40, y: BASE.y + BASE.d - 14, w: 220, d: 7, r: 1 };
back.push(S(k.slabOf(STRIP, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
const TICKS = k.topTicks(STRIP.x + 4, STRIP.x + STRIP.w - 4, 5, 5, STRIP.y + 0.8, 0.6, [2, 3.6], P);
back.push(Ln(TICKS.minor, { tone: "lo" }), Ln(TICKS.major, { tone: "mid" }));
back.push(Dots([at([STRIP.x + 2, STRIP.y + 3.5, 0.6]), at([STRIP.x + STRIP.w - 2, STRIP.y + 3.5, 0.6])], { size: 0.45 }));

// ---------- vehículo: cuerpo (rampas de admisión, cámara y rampa de la tobera) ----------
// Conducto exagerado en altura para que se lea (rampas de 13° y 16°, aislador de 26 de alto).
const topZ = (x) => (x <= 120 ? 30 + (14 * x) / 120 : x <= 230 ? 44 : 44 - (2 * (x - 230)) / 70);
const lowZ = (x) => (x <= 60 ? 30 - (14 * x) / 60 : x <= 110 ? 16 - (14 * (x - 60)) / 50 : x <= 190 ? 2 : 2 + (28 * (x - 190)) / 110);
const NOSE = [[0, 30], [60, topZ(60)], [60, 16]];
const RAMP = [[60, topZ(60)], [110, topZ(110)], [110, 2], [60, 16]];
const MID = [[110, topZ(110)], [120, 44], [190, 44], [190, 2], [110, 2]];
const AFT = [[190, 44], [230, 44], [300, 42], [300, 30], [190, 2]];
prism("adm", "proa", NOSE, -SPAN, SPAN);
prism("adm", "rampa", RAMP, -SPAN, SPAN);
prism("cam", "fuselaje", MID, -SPAN, SPAN);
prism("tob", "rampa", AFT, -SPAN, SPAN);
// carenado inferior (labio de admisión) y pared lateral lejana del módulo propulsor
const COWL = [[100, -24], [205, -24], [205, -30], [118, -30]];
prism("car", "carenado", COWL, -SPAN, SPAN, { extra: Dots([120, 140, 160, 180, 200].map((x) => at(pY(x, SPAN, -27))), { size: 0.4 }) });
prism("car", "pared", [[100, -30], [205, -30], [205, 2], [100, 2]], -SPAN - 2, -SPAN, { tone: "mid" });
// montantes inyectores de hidrógeno en la cámara
for (const y of [-16, -2, 12]) prism("iny", "montante", [[123, -24], [129, -24], [129, 2], [123, 2]], y, y + 4, { tone: "mid", extra: Dots([-18, -11, -4].map((z) => at(pY(129, y + 2, z))), { size: 0.45, tone: "hi" }) });
for (const y of [-20, 10]) boxAt("iny", { x: 120, y, w: 12, d: 10, r: 1 }, Z0 + 44, 4, { tone: "mid" }, { name: "iny.colector", bevel: 0.3, extra: Dots([at([123, y + 5, Z0 + 48]), at([129, y + 5, Z0 + 48])], { size: 0.4 }) });
// derivas y aletas
for (const [y0, y1] of [[-SPAN + 6, -SPAN + 9], [SPAN - 9, SPAN - 6]]) prism("deriva", "deriva", [[250, topZ(250)], [300, topZ(300)], [306, 68], [286, 68]], y0, y1, { tone: "mid" });
const FZ = G.frameOf([0, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
for (const side of [1, -1]) {
  const poly = side > 0 ? [[210, SPAN], [270, SPAN], [282, SPAN + 26], [262, SPAN + 26]] : [[210, -SPAN], [262, -SPAN - 26], [282, -SPAN - 26], [270, -SPAN]];
  prism("deriva", "aleta", poly, Z0 + 28, Z0 + 30.5, { F: FZ, tone: "mid" });
  const elevon = side > 0 ? [[270, SPAN], [282, SPAN + 26], [294, SPAN + 26], [282, SPAN]] : [[270, -SPAN], [282, -SPAN], [294, -SPAN - 26], [282, -SPAN - 26]];
  prism("deriva", "elevon", elevon, Z0 + 28, Z0 + 30.5, { F: FZ, tone: "hi" });
}
for (const y of [-22, 19]) prism("deriva", "ventral", [[236, lowZ(236)], [272, lowZ(272)], [272, lowZ(272) - 12], [248, lowZ(248) - 8]], y, y + 3, { tone: "mid" });

// ---------- pórtico de suspensión ----------
const POST = { x: 146, y: -76, w: 8, d: 8, r: 1 };
const BEAM_Z = Z0 + 120;
boxAt("soporte", POST, 3, BEAM_Z - 3, { tone: "mid" }, { bevel: 0.4, name: "soporte.poste", inner: Ln(k.sideSeam(POST, 20, P, 3), { tone: "faint" }) });
boxAt("soporte", { x: 144, y: -80, w: 16, d: 16, r: 1.5 }, 0, 3, { tone: "mid" }, { name: "soporte.base", extra: Dots(k.corners({ x: 144, y: -80, w: 16, d: 16 }, 2.4).map(([px, py]) => at([px, py, 3])), { size: 0.4 }) });
boxAt("soporte", { x: 146, y: -76, w: 8, d: 82, r: 1 }, BEAM_Z, 6, { tone: "mid" }, { bevel: 0.4, name: "soporte.viga", extra: Dots([at([150, -72, BEAM_Z + 6]), at([150, 2, BEAM_Z + 6])], { size: 0.42 }) });
boxAt("soporte", { x: 144, y: -6, w: 12, d: 12, r: 1 }, Z0 + 44, 4, { tone: "mid" }, { name: "soporte.pinza", bevel: 0.3, extra: Dots(k.corners({ x: 144, y: -6, w: 12, d: 12 }, 2).map(([px, py]) => at([px, py, Z0 + 48])), { size: 0.4 }) });
boxAt("soporte", { x: 147, y: -3, w: 6, d: 6, r: 1 }, Z0 + 48, BEAM_Z - Z0 - 48, { tone: "mid" }, { name: "soporte.mastil", bevel: 0.3 });
boxAt("soporte", { x: 146, y: -68, w: 8, d: 8, r: 0.8 }, BEAM_Z - 10, 10, { tone: "mid" }, { name: "soporte.cartela", bevel: 0.2 });

// ---------- selector giratorio de régimen ----------
const CON = { x: 0, y: 52, w: 26, d: 22, r: 2 };
const CON_H = 30;
boxAt("sel", CON, 0, CON_H, { tone: "mid" }, { bevel: 0.6, name: "sel.consola", inner: Ln(k.sideSeam(CON, 8, P, 3), { tone: "faint" }) });
const KNOB = [11, 63];
for (const [x, y] of [[22, 58], [22, 68]]) cylAt("sel", x, y, 1.8, 30, 2.5, { tone: "hi" }, { name: "sel.pulsador", steps: 20 });
cylAt("sel", 4, 70, 1.4, 30, 1.6, { tone: "mid" }, { name: "sel.piloto", steps: 18, extra: `<path class="anat-glow" data-brillo d="${k.ring(4, 70, 0.9, 31.6, P, 18)}"/>` });
const KZ = CON_H;
put("sel", [KNOB[0], KNOB[1], KZ + 3], S(k.cylinder(KNOB[0], KNOB[1], 8.5, KZ, 1, P, 48), { tone: "mid" }) + Ln(k.radialTicks(KNOB[0], KNOB[1], 8.5, 10, 2, KZ + 1, [1, 1.8], P, -0.75 * Math.PI, 1.5 * Math.PI + (1.5 * Math.PI) / 10).minor, { tone: "lo" }) + Ln(k.radialTicks(KNOB[0], KNOB[1], 8.5, 10, 2, KZ + 1, [1, 1.8], P, -0.75 * Math.PI, 1.5 * Math.PI + (1.5 * Math.PI) / 10).major, { tone: "mid" }) + Ln(k.ring(KNOB[0], KNOB[1], 8.5, KZ + 1, P, 64), { tone: "lo" }), { name: "sel.dial", shapes: [record(A.cylinder(KNOB[0], KNOB[1], 8.5, KZ, 1, { name: "sel.dial" }))] });
put("sel", [KNOB[0], KNOB[1], KZ + 4], S(k.cylinder(KNOB[0], KNOB[1], 5, KZ + 1, 5, P, 40), { tone: "hi", lit: true }) + Ln(k.knurl(KNOB[0], KNOB[1], 5, KZ + 1, KZ + 6, 30, P), { tone: "lo" }) + `<path class="iso-line anat-needle" data-tone="lit" data-free="start" data-aguja="selector" d=""/>`, { name: "sel.mando", bias: 0.2, shapes: [record(A.cylinder(KNOB[0], KNOB[1], 5, KZ + 1, 5, { name: "sel.mando" }))] });
const SELF = X.upZ([KNOB[0], KNOB[1], KZ + 6]);

// ---------- estaciones: sondas en la cara lateral cercana ----------
const sideMid = (x) => (topZ(x) + lowZ(x)) / 2;
const probe = (n, x, z = sideMid(x)) => dial(n, pY(x, SPAN, z), [0, 1, 0], { hostR: 0.9, min: 0, max: 3500, R: 6, stem: 6 });
probe(1, 24);
probe(2, 114);
probe(3, 186);
probe(4, 286, 38.5);
const AGUJAS = [...X.AGUJAS, { id: "selector", n: "M", F: { o: SELF.o, a: SELF.a, u: [0, -1, 0], v: [1, 0, 0] }, s: 0.05, r: 4.4, tail: 0, a0: -0.75 * Math.PI, a1: 0.75 * Math.PI, min: 6, max: 10 }];

// ---------- ondas de choque de la admisión (a Mach de diseño, sobre el labio) ----------
const shocks = Ln(k.segment(pY(0, 0, 30), pY(100, 0, -24), P) + k.segment(pY(60, 0, 16), pY(100, 0, -24), P), { tone: "mid", dashed: true });
put("adm", pY(60, 0, 0), shocks, { bias: 0.1, name: "adm.choques", shapes: [A.tube([pY(0, 0, 30), pY(100, 0, -24)], 0.3), A.tube([pY(60, 0, 16), pY(100, 0, -24)], 0.3)] });

// ---------- líneas de corriente ----------
const stream = (part, flujo, pts3, tone) => {
  const svg = k.fadeLineSvg(pts3.map(at), { fade: [14, 20], tone }).replace(/<path class="iso-line/g, '<path data-flow class="iso-line');
  put(part, pts3[Math.floor(pts3.length / 2)], `<g data-flujo="${flujo}">${svg}</g>`, { name: `${part}.linea`, shapes: [A.tube(pts3, 0.4, { name: `${part}.linea` })] });
};
for (const [y, frac] of [[-7, 0.35], [7, 0.7]]) {
  const cold = [];
  for (let x = -40; x <= 118; x += 2) cold.push(pY(x, y, lowZ(Math.max(0, x)) - (lowZ(Math.max(0, x)) + 24) * frac));
  stream("aire", "frio", cold, "blue");
  const hot = [];
  for (let x = 134; x <= 340; x += 2) hot.push(pY(x, y, x <= 205 ? lowZ(x) - (lowZ(x) + 24) * frac : lowZ(Math.min(x, 300)) - (lowZ(205) + 24) * frac * (1 + (x - 205) / 150)));
  stream("gas", "caliente", hot, "red");
}

// ---------- SVG, auditoría y página ----------
const LABEL_TEXT = "Vehículo hipersónico con motor scramjet colgado de un pórtico, con la pared lateral cercana del módulo propulsor quitada: rampas de admisión con sus ondas de choque sobre el labio del carenado, aislador, cámara con montantes inyectores de hidrógeno y tobera de rampa de expansión. Un selector giratorio fija el Mach de vuelo.";
const svg = svgDe(E, { width: W, height: H, label: LABEL_TEXT });
A.auditOrExit(E.R, P, { crowd: [] });

const m0 = scramjet(SCRAMJET.m0);
const DATA = { P, agujas: AGUJAS, base: SCRAMJET_RANGE };
const specJs = `const DATA = ${JSON.stringify(DATA)};\n${sinExport(readFileSync(join(HERE, "modelo.mjs"), "utf8"))}\n${readFileSync(join(HERE, "partes.js"), "utf8")}`;
const PARTES = [["adm", "Admisión (rampas)"], ["car", "Carenado y aislador"], ["iny", "Inyectores de H₂"], ["cam", "Cámara supersónica"], ["tob", "Tobera de rampa"], ["aire", "Aire"], ["gas", "Gases"], ["deriva", "Derivas y aletas"], ["soporte", "Pórtico"], ["sel", "Selector de régimen"]].map(([id, label]) => ({ id, label }));
const ESTACIONES = Array.from({ length: 4 }, (_, i) => ({ id: `e${i + 1}`, label: `Estación ${i + 1}` }));
const fmt = (v, d) => v.toFixed(d).replace(".", ",");
const html = (tema) =>
  tarjeta({
    id: "anat-scramjet",
    fig: "Fig 2.2g",
    titulo: "Scramjet · combustión supersónica",
    pista: "Clic en una pieza · selector ← →",
    lectura: `M ${fmt(SCRAMJET.m0, 1)} · M₂ ${fmt(m0.Ma[2], 2)} · F ${fmt(m0.F, 1)} kN`,
    svg,
    aria: "Vehículo con scramjet con la pared lateral quitada. Flechas: giran el selector de régimen (Mach de vuelo). N o Intro: siguiente pieza.",
    control: { min: SCRAMJET_RANGE.mMin, max: SCRAMJET_RANGE.mMax, step: 0.1, valor: SCRAMJET.m0, etiquetaHtml: "Selector de régimen · M de vuelo", inicialTexto: `M ${fmt(SCRAMJET.m0, 1)}`, minTexto: `M ${SCRAMJET_RANGE.mMin}`, maxTexto: `M ${SCRAMJET_RANGE.mMax}` },
    partes: [...PARTES, ...ESTACIONES],
    claves: [
      { mark: "dashed", label: "Ondas de choque de la admisión (a Mach de diseño, sobre el labio)" },
      { mark: "blue", label: "Aire comprimido por las ondas de choque" },
      { mark: "red", label: "Gases que siguen siendo supersónicos en la cámara" },
      { mark: "lit", label: "Selector de régimen" },
    ],
    pie: "A Mach muy alto, frenar el aire hasta subsónico lo calentaría tanto que no quedaría margen para la combustión. El scramjet solo lo frena parcialmente con ondas de choque oblicuas en las rampas: el aire entra en la cámara todavía supersónico, el hidrógeno arde en una corriente que atraviesa el motor en milisegundos y la propia parte trasera del fuselaje hace de tobera.",
    hipotesis: `<strong>Hipótesis:</strong> ciclo ideal de aire estándar frío (γ = 1,4, c<sub>p</sub> = 1,005 kJ/kg·K, sin disociación); vuelo a 30 km (T<sub>1</sub> = 226,5 K, p<sub>1</sub> = 1,197 kPa); admisión isentrópica que decelera hasta M<sub>2</sub> = M<sub>1</sub>/3; combustión de hidrógeno a presión constante y sin fricción (V<sub>3</sub> = V<sub>2</sub>), dosado f = 0,015 (φ ≈ 0,5), PCI = 120 000 kJ/kg; tobera isentrópica adaptada (p<sub>4</sub> = p<sub>1</sub>); área de captación 0,5 m²; las ondas de choque se dibujan en su posición de diseño.`,
    tema,
  });
escribir({ dir: HERE, nombre: "scramjet", titulo: "Scramjet", html, specJs });
console.log("escrito scramjet.html / scramjet-light.html ·", E.R.items.length, "elementos ·", E.R.solids.length, "sólidos");
