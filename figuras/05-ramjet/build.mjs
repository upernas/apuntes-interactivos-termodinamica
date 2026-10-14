// Fig 2.2f · Estatorreactor (ramjet) en un banco de empuje frente a la tobera de un túnel de chorro libre.
// node build.mjs [--audit]
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { k, G, A, DEG, escena, svgDe } from "../comun/kitfig.mjs";
import { piezas } from "../comun/piezas.mjs";
import { tarjeta, escribir, sinExport } from "../comun/pagina.mjs";
import { RAMJET, ramjet } from "./modelo.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 1000;
const H = 560;
const AZ = 56;
const EL = 30;
const Z_AX = 64;
const X0 = -100;
const BASE = { x: -232, y: -70, w: 380, d: 160, r: 10 };
const BASE_H = 10;
const FOOT_H = 6;

const P = k.fitProjection([...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [-200, 0, Z_AX + 36], [140, 0, Z_AX + 30]], W, H, { pad: 24, azimuth: AZ, elevation: EL });
const E = escena(P);
const { at, S, Ln, Dots, record, back, put, turned, boxAt, padOn, cylAt } = E;
const X = piezas(E);
const { shellCut, dial, stepped } = X;

// Eje del motor: s desde la punta del cono, en el sentido del flujo (+x).
const ENG = G.frameOf([X0, 0, Z_AX], [1, 0, 0], [0, 0, 1], [0, -1, 0]);
const VV = G.viewOf(P);
const TH_VIEW = Math.atan2(G.dot3(VV, ENG.v), G.dot3(VV, ENG.u));
const TH0 = TH_VIEW + Math.PI / 2;
const TH1 = TH_VIEW + (3 * Math.PI) / 2;
const atS = (s) => G.frameOf(G.add3(ENG.o, G.mul3(ENG.a, s)), ENG.a, ENG.u, ENG.v);
const lin = (pts) => (s) => {
  if (s <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (s <= pts[i][0]) return pts[i - 1][1] + ((pts[i][1] - pts[i - 1][1]) * (s - pts[i - 1][0])) / (pts[i][0] - pts[i - 1][0]);
  return pts[pts.length - 1][1];
};

// ---------- bancada ----------
back.push(`<path class="iso-halo" d="${k.haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P)}"/>`);
const FEET = [-212, -40, 128].flatMap((x) => [[x, BASE.y + 16], [x, BASE.y + BASE.d - 16]]).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
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
const LABEL = { x: 40, y: BASE.y + BASE.d - 18, w: 60, d: 11, r: 1.5 };
back.push(S(k.slabOf(LABEL, 0, 0.8, P, 3), { tone: "mid" }));
back.push(Ln(k.planOutline(k.insetPlan(LABEL, 1.6), 0.8, P), { tone: "faint" }));
back.push(k.faceTextSvg(k.topMatrix([LABEL.x + 5, LABEL.y + 7.6], 0.8, P, "x"), "ESTATORREACTOR", { size: 4.2, tone: "lo" }));
back.push(Dots([at([LABEL.x + 2.4, LABEL.y + LABEL.d / 2, 0.8]), at([LABEL.x + LABEL.w - 2.4, LABEL.y + LABEL.d / 2, 0.8])], { size: 0.45 }));

// ---------- tobera del túnel de chorro libre (entera) con su volante ----------
const TUN = X.alongX([-226, 0, Z_AX]);
stepped("tunel", TUN, [[0, 30], [4, 30], [4, 28], [40, 28], [64, 12], [64, 12], [86, 24]], { ribs: [20], name: "tobera", extra: (a, b, F) => (b === 86 ? Ln(G.circleOf(F, 22, 21.5, P, 96), { tone: "lo" }) : "") });
for (const x of [-216, -196]) {
  const plan = { x: x - 4, y: -12, w: 8, d: 24, r: 1 };
  boxAt("tunel", plan, 0, Z_AX - 28, { tone: "mid" }, { name: "tunel.apoyo", extra: Dots([at([x, -9, Z_AX - 28]), at([x, 9, Z_AX - 28])], { size: 0.4 }) });
}
// consola del volante, delante del túnel
const CON = { x: -186, y: 40, w: 22, d: 16, r: 1.5 };
const CON_H = 40;
boxAt("tunel", CON, 0, CON_H, { tone: "mid" }, { bevel: 0.5, name: "tunel.consola", inner: Ln(k.sideSeam(CON, 10, P, 3), { tone: "faint" }) });
const WHEEL_C = [-175, CON.y + CON.d + 6, 30];
const WF = G.frameOf([WHEEL_C[0], CON.y + CON.d, WHEEL_C[2]], [0, 1, 0], [0, 0, 1], [1, 0, 0]);
put("vol", G.add3(WF.o, [0, 3, 0]), S(G.disc(0, 6, 1.6, WF, P), { tone: "mid" }), { name: "vol.eje", shapes: [record(A.disc(WF, 0, 6, 1.6, { name: "vol.eje" }))] });
const WHEEL_SPOKES = { F: { o: WF.o, a: WF.a, u: WF.u, v: WF.v }, s: 7.5, r0: 2.6, r1: 9.2, count: 4, sweep: 0 };
// los radios van por dentro del aro: el aro se dibuja entero después de ellos
put("vol", G.add3(WF.o, [0, 6.75, 0]), S(G.disc(6, 7.5, 2.6, WF, P), { tone: "hi", lit: true }) + `<path class="iso-line" data-tone="lit" data-rotor="volante" d="${G.spokesOf(WF, 7.5, 2.6, 9.2, 4, P)}"/>` + `<path class="iso-fill" fill-rule="evenodd" d="${G.circleOf(WF, 7.5, 10.6, P, 64)}${G.circleOf(WF, 7.5, 9.2, P, 64)}"/>` + Ln(G.circleOf(WF, 7.5, 10.6, P, 64) + G.circleOf(WF, 7.5, 9.2, P, 64), { tone: "lit" }), { name: "vol.volante", shapes: [record(A.disc(WF, 6, 7.5, 10.6, { name: "vol.volante" }))] });

// ---------- estatorreactor (corte) ----------
const cowlIn = lin([[30, 18], [70, 22], [150, 22], [168, 13], [200, 19]]);
const cowlOut = (s) => (s < 70 ? 20 + (4.5 * (s - 30)) / 40 : s < 150 ? 24.5 : s < 168 ? 24.5 - (1.5 * (s - 150)) / 18 : 23 - (1 * (s - 168)) / 32);
const toma = shellCut("dif", ENG, [30, 40, 50, 60, 70], cowlIn, cowlOut, TH0, TH1, { name: "difusor" });
const cam = shellCut("cam", ENG, [70, 90, 110, 130, 150], cowlIn, cowlOut, TH0, TH1, { name: "camara" });
shellCut("tob", ENG, [150, 156, 162, 168, 176, 184, 192, 200], cowlIn, cowlOut, TH0, TH1, { name: "tobera" });
// cono de admisión y cuerpo central (sin piezas móviles)
const spike = stepped("cono", ENG, [[0, 0.01], [24, 10], [60, 8], [76, 0.01]], { name: "cuerpo", ribs: [24] });
const bodyR = lin([[0, 0], [24, 10], [60, 8], [76, 0]]);
const strut = (part, s, r0, r1, a, rad = 1) => {
  const Fr = G.frameAlong(G.add3(ENG.o, G.mul3(ENG.a, s)), G.radialOf(ENG, a));
  put(part, G.pointOf(ENG, s, (r0 + r1) / 2, a), S(G.disc(r0, r1, rad, Fr, P), { tone: "mid" }), { name: `${part}.brazo`, shapes: [record(A.disc(Fr, r0, r1, rad, { name: `${part}.brazo` }))] });
};
for (const deg of [105, 165]) strut("cono", 44, bodyR(44) + 0.05, cowlIn(44), TH0 + (deg - 35) * DEG, 1.2);
// barras de inyección de combustible y estabilizador de llama en V
for (const deg of [70, 150]) {
  const a = TH0 + (deg - 35) * DEG;
  const Fr = G.frameAlong(G.add3(ENG.o, G.mul3(ENG.a, 84)), G.radialOf(ENG, a));
  put("iny", G.pointOf(ENG, 84, (4 + cowlIn(84)) / 2, a), S(G.disc(4, cowlIn(84), 0.9, Fr, P), { tone: "mid" }) + Dots([6, 10, 14, 18].map((r) => at(G.pointOf(ENG, 84 - 0.9, r, a))), { size: 0.45, tone: "hi" }), { name: "iny.barra", shapes: [record(A.disc(Fr, 4, cowlIn(84), 0.9, { name: "iny.barra" }))] });
}
shellCut("est", ENG, [94, 98], (q) => 10 + (q - 94) * 0.2, (q) => 15 - (q - 94) * 0.6, TH0, TH1, { name: "anillo-v", steps: 24, tone: "hi" });
for (const deg of [95, 175]) strut("est", 96, 13.8, cowlIn(96), TH0 + (deg - 35) * DEG, 0.9);

// ---------- banco de empuje: carro sobre guías y célula de carga ----------
const CAR = { x: -10, y: -18, w: 120, d: 36, r: 1.5 };
const CAR_Z = 22;
for (const y of [-14, 10]) boxAt("banco", { x: -20, y, w: 150, d: 4, r: 0.6 }, 0, 4, { tone: "mid" }, { name: "banco.guia", bevel: 0.2 });
for (const x of [-2, 94]) for (const y of [-16, 8]) boxAt("banco", { x, y, w: 10, d: 8, r: 1 }, 4, CAR_Z - 4, { tone: "mid" }, { name: "banco.patin", bevel: 0.3 });
boxAt("banco", CAR, CAR_Z, 3, { tone: "mid" }, { name: "banco.carro", bevel: 0.4, extra: Dots(k.corners(CAR, 3).map(([x, y]) => at([x, y, CAR_Z + 3])), { size: 0.4 }) });
for (const s of [100, 140]) {
  for (const y of [-8, 8]) {
    const zs = Z_AX - Math.sqrt(cowlOut(s) ** 2 - y * y);
    padOn("cam", cam, [X0 + s, y, zs], [0, 0, -1], 3.5, zs - (CAR_Z + 3), { name: "cam.soporte", tone: "mid" });
  }
}
const FIX = { x: -36, y: -10, w: 12, d: 20, r: 1.2 };
boxAt("banco", FIX, 0, 32, { tone: "mid" }, { bevel: 0.4, name: "banco.bloque" });
const LC = G.frameAlong([FIX.x + FIX.w, 0, CAR_Z + 1.5], [1, 0, 0]);
// célula de carga entre el bloque fijo y el carro (el carro empuja hacia −x)
put("banco", [FIX.x + FIX.w + 7, 0, CAR_Z + 1.5], S(G.lathe([[0, 0], [0, 1.4], [3, 1.4], [3, 3], [11, 3], [11, 1.4], [14, 1.4], [14, 0]], LC, P), { tone: "hi" }), { name: "banco.celula", shapes: [record(A.lathe(LC, [[0, 0], [0, 1.4], [3, 1.4], [3, 3], [11, 3], [11, 1.4], [14, 1.4], [14, 0]], { name: "banco.celula" }))] });
const GAUGE = [FIX.x + FIX.w / 2, 0];
const GZ = 32;
put("banco", [GAUGE[0], GAUGE[1], GZ + 1], S(k.cylinder(GAUGE[0], GAUGE[1], 5, GZ, 2, P, 40), { tone: "hi" }) + Ln(k.ring(GAUGE[0], GAUGE[1], 4.3, GZ + 2, P, 48), { tone: "lo" }) + Ln(k.radialTicks(GAUGE[0], GAUGE[1], 4.3, 12, 3, GZ + 2, [0.8, 1.5], P, -0.75 * Math.PI, 1.5 * Math.PI).minor, { tone: "lo" }) + `<path class="iso-line anat-needle" data-tone="lit" data-free="start" data-aguja="empuje" d=""/>`, { name: "banco.indicador", shapes: [record(A.cylinder(GAUGE[0], GAUGE[1], 5, GZ, 2, { name: "banco.indicador" }))] });
const GF = X.upZ([GAUGE[0], GAUGE[1], GZ]);

// ---------- estaciones ----------
const N0 = G.mul3(G.tangentOf(ENG, TH0), -1);
const N1 = G.tangentOf(ENG, TH1);
const probe = (n, s, top) => dial(n, G.pointOf(ENG, s, (cowlIn(s) + cowlOut(s)) / 2, top ? TH1 : TH0), top ? N1 : N0, { hostR: 0.9, min: 200, max: 2200, R: 6, stem: 7 });
probe(1, 32, false);
probe(2, 66, true);
probe(3, 146, false);
probe(4, 197, true);
const AGUJAS = [...X.AGUJAS, { id: "empuje", n: "F", F: { o: GF.o, a: GF.a, u: [0, -1, 0], v: [1, 0, 0] }, s: 2.05, r: 3.9, tail: 0.9, a0: -0.75 * Math.PI, a1: 0.75 * Math.PI, min: 0, max: 60 }];

// ---------- líneas de corriente ----------
const stream = (part, flujo, pts3, tone) => {
  const svg = k.fadeLineSvg(pts3.map(at), { fade: [14, 20], tone }).replace(/<path class="iso-line/g, '<path data-flow class="iso-line');
  put(part, pts3[Math.floor(pts3.length / 2)], `<g data-flujo="${flujo}">${svg}</g>`, { name: `${part}.linea`, shapes: [A.tube(pts3, 0.4, { name: `${part}.linea` })] });
};
for (const deg of [120, 190]) {
  const a = TH0 + (deg - 35) * DEG;
  const cold = [];
  for (let s = -36; s <= 92; s += 2) cold.push(G.pointOf(ENG, s, s < 24 ? 13 + s * 0.04 : (bodyR(Math.min(s, 76)) + cowlIn(s)) / 2 + (s > 60 ? 2 : 0), a));
  stream("aire", "frio", cold, "blue");
  const hot = [];
  for (let s = 102; s <= 250; s += 2) hot.push(G.pointOf(ENG, s, s <= 200 ? 0.6 * cowlIn(s) : 11.4 + (s - 200) * 0.08, a));
  stream("gas", "caliente", hot, "red");
}

// ---------- SVG, auditoría y página ----------
const LABEL_TEXT = "Estatorreactor (ramjet) cortado por la mitad sobre un banco de empuje: cono de admisión con cuerpo central, difusor, barras de inyección, estabilizador de llama en V, cámara de combustión y tobera convergente-divergente, sin piezas móviles. Delante, la tobera de un túnel de chorro libre con su volante de régimen; el carro empuja una célula de carga con indicador de empuje.";
const svg = svgDe(E, { width: W, height: H, label: LABEL_TEXT });
A.auditOrExit(E.R, P, { crowd: [] });

const m0 = ramjet(RAMJET.m0);
const DATA = { P, agujas: AGUJAS, base: RAMJET, volante: WHEEL_SPOKES };
const specJs = `const DATA = ${JSON.stringify(DATA)};\n${sinExport(readFileSync(join(HERE, "modelo.mjs"), "utf8"))}\n${readFileSync(join(HERE, "partes.js"), "utf8")}`;
const PARTES = [["cono", "Cono de admisión"], ["dif", "Difusor"], ["iny", "Inyectores"], ["est", "Estabilizador de llama"], ["cam", "Cámara de combustión"], ["tob", "Tobera"], ["aire", "Aire"], ["gas", "Gases de escape"], ["tunel", "Túnel"], ["banco", "Banco de empuje"], ["vol", "Volante de régimen"]].map(([id, label]) => ({ id, label }));
const ESTACIONES = Array.from({ length: 4 }, (_, i) => ({ id: `e${i + 1}`, label: `Estación ${i + 1}` }));
const fmt = (v, d) => v.toFixed(d).replace(".", ",");
const html = (tema) =>
  tarjeta({
    id: "anat-ramjet",
    fig: "Fig 2.2f",
    titulo: "Estatorreactor · ramjet",
    pista: "Clic en una pieza · volante ← →",
    lectura: `M ${fmt(RAMJET.m0, 2)} · F ${fmt(m0.F, 1)} kN · η ${fmt(m0.eta * 100, 1)} %`,
    svg,
    aria: "Estatorreactor cortado en un banco de empuje. Flechas: giran el volante de régimen (número de Mach de la corriente). N o Intro: siguiente pieza.",
    control: { min: RAMJET.mMin, max: RAMJET.mMax, step: 0.05, valor: RAMJET.m0, etiquetaHtml: "Volante de régimen · M de vuelo", inicialTexto: `M ${fmt(RAMJET.m0, 2)}`, minTexto: `M ${fmt(RAMJET.mMin, 1)}`, maxTexto: `M ${fmt(RAMJET.mMax, 1)}` },
    partes: [...PARTES, ...ESTACIONES],
    claves: [
      { mark: "blue", label: "Aire que frena el difusor (sin compresor)" },
      { mark: "red", label: "Gases que acelera la tobera" },
      { mark: "lit", label: "Volante de régimen del túnel" },
    ],
    pie: "No tiene compresor ni turbina: la propia velocidad de vuelo comprime el aire al frenarlo en el difusor (compresión dinámica). Por eso no da empuje parado y necesita volar ya rápido, en supersónico. Tras la combustión, la tobera convergente-divergente acelera los gases por encima del Mach de vuelo.",
    hipotesis: `<strong>Hipótesis:</strong> ciclo ideal de aire estándar frío (γ = 1,4, c<sub>p</sub> = 1,005 kJ/kg·K); vuelo a 11 000 m (T<sub>1</sub> = 216,65 K, p<sub>1</sub> = 22,6 kPa); difusor isentrópico que frena el aire hasta velocidad despreciable; combustión a presión constante hasta T<sub>3</sub> = 2000 K sin añadir masa; tobera isentrópica adaptada (p<sub>4</sub> = p<sub>1</sub>); área de captación 0,2 m²; poder calorífico 42 800 kJ/kg.`,
    tema,
  });
escribir({ dir: HERE, nombre: "ramjet", titulo: "Estatorreactor", html, specJs });
console.log("escrito ramjet.html / ramjet-light.html ·", E.R.items.length, "elementos ·", E.R.solids.length, "sólidos");
