// Fig 2.2d · Turbohélice de turbina libre (disposición tipo PT6: entrada trasera y flujo hacia delante),
// con la mitad cercana de la carcasa cortada. node build.mjs [--audit]
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { k, G, A, DEG, escena, svgDe, compactSvg } from "../comun/kitfig.mjs";
import { piezas } from "../comun/piezas.mjs";
import { tarjeta, escribir, sinExport } from "../comun/pagina.mjs";
import { TURBOHELICE, turbohelice } from "./modelo.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 1000;
const H = 600;
const AZ = 56;
const EL = 30;
const X_F = 130;
const Z_AX = 82;
const PROP_R = 64;
const BASE = { x: -130, y: -96, w: 330, d: 222, r: 10 };
const BASE_H = 10;
const FOOT_H = 6;

const P = k.fitProjection([...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [X_F + 14, 0, Z_AX + PROP_R], [X_F + 14, 0, Z_AX - PROP_R], [X_F - 100, -40, Z_AX + 50]], W, H, { pad: 24, azimuth: AZ, elevation: EL });
const E = escena(P);
const { at, S, Ln, Dots, record, back, put, turned, band, boxAt, padOn, cylAt } = E;
const X = piezas(E);
const { shellCut, dial, stepped } = X;

// Eje: s crece hacia atrás (−x) desde el plano del reductor; el gas avanza hacia s decreciente.
const ENG = G.frameOf([X_F, 0, Z_AX], [-1, 0, 0], [0, 0, 1], [0, 1, 0]);
const VV = G.viewOf(P);
const TH_VIEW = Math.atan2(G.dot3(VV, ENG.v), G.dot3(VV, ENG.u));
const TH0 = TH_VIEW + Math.PI / 2;
const TH1 = TH_VIEW + (3 * Math.PI) / 2;
const xAt = (s) => X_F - s;
const atS = (s) => G.frameOf(G.add3(ENG.o, G.mul3(ENG.a, s)), ENG.a, ENG.u, ENG.v);
const lin = (pts) => (s) => {
  if (s <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (s <= pts[i][0]) return pts[i - 1][1] + ((pts[i][1] - pts[i - 1][1]) * (s - pts[i - 1][0])) / (pts[i][0] - pts[i - 1][0]);
  return pts[pts.length - 1][1];
};

// ---------- bancada ----------
back.push(`<path class="iso-halo" d="${k.haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P)}"/>`);
const FEET = [-110, 30, 180].flatMap((x) => [[x, BASE.y + 16], [x, BASE.y + BASE.d - 16]]).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
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
const LABEL = { x: 90, y: BASE.y + BASE.d - 18, w: 70, d: 11, r: 1.5 };
back.push(S(k.slabOf(LABEL, 0, 0.8, P, 3), { tone: "mid" }));
back.push(Ln(k.planOutline(k.insetPlan(LABEL, 1.6), 0.8, P), { tone: "faint" }));
back.push(k.faceTextSvg(k.topMatrix([LABEL.x + 5, LABEL.y + 7.6], 0.8, P, "x"), "TURBOHÉLICE", { size: 4.4, tone: "lo" }));
back.push(Dots([at([LABEL.x + 2.4, LABEL.y + LABEL.d / 2, 0.8]), at([LABEL.x + LABEL.w - 2.4, LABEL.y + LABEL.d / 2, 0.8])], { size: 0.45 }));

// ---------- hélice, buje y reductor ----------
X.dish("hel", G.frameOf(G.add3(ENG.o, G.mul3(ENG.a, -6)), G.mul3(ENG.a, -1), ENG.u, G.mul3(ENG.v, -1)), 12, 22);
const PROP_S = -3;
band("hel", atS(-6), 0, 2.2, 12, { tone: "mid" }, { name: "hel.buje" });
band("hel", atS(PROP_S + 0.8), 0, 2.2, 12, { tone: "mid" }, { name: "hel.buje" });
const spinnerR = (s) => 12 * Math.sqrt(Math.max(0, 1 - ((-6 - s) / 22) ** 2));
const PALA = [[12.2, 2.6], [18, 4.2], [30, 5.2], [44, 4.4], [56, 3.2], [PROP_R - 2, 2.2], [PROP_R, 0.8]];
const palaPath = (phase) => {
  let d = "";
  for (let i = 0; i < 4; i++) {
    const a = phase + (i / 4) * 2 * Math.PI;
    const t = G.tangentOf(ENG, a);
    const p = (r, w) => at(G.add3(G.pointOf(ENG, PROP_S, r, a), G.mul3(t, w)));
    const pts = [...PALA.map(([r, w]) => p(r, w)), ...[...PALA].reverse().map(([r, w]) => p(r, -w))];
    d += k.pathOf(pts, true);
  }
  return d;
};
put("hel", G.add3(ENG.o, G.mul3(ENG.a, PROP_S)), `<path class="anat-pala" data-rotor="helice" d="${palaPath(0.3)}"/>` + Ln(G.circleOf(ENG, PROP_S, PROP_R, P, 160), { tone: "faint" }), { name: "hel.palas", shapes: [record(A.disc(ENG, PROP_S - 0.8, PROP_S + 0.8, PROP_R, { name: "hel.palas" }))] });
// reductor planetario coaxial (pieza a pieza por sus escalones)
stepped("red", atS(0), [[0, 14], [3, 14], [3, 22], [28, 25], [28, 30], [36, 30]], { ribs: [14], name: "carcasa", bolts: [[28, 28.4, 18]] });

// ---------- caja de escape, tobera lateral y eje de la turbina libre ----------
const casOut = lin([[36, 31], [56, 31], [58, 30], [72, 30], [86, 34], [112, 34], [124, 30], [160, 27]]);
const casIn = (s) => casOut(s) - 2.5;
const esc = shellCut("esc", ENG, [36, 41, 46, 51, 56], casIn, casOut, TH0, TH1, { name: "caja" });
const STUB_A = 300 * DEG;
const stubBase = G.pointOf(ENG, 46, casOut(46), STUB_A);
const stubTip = padOn("esc", esc, stubBase, G.radialOf(ENG, STUB_A), 9, 9, { name: "esc.tobera" });
const stubF = G.frameAlong(stubTip, G.radialOf(ENG, STUB_A));
turned("esc", stubF, [[0, 10.4], [2, 10.4]], { tone: "mid" }, { name: "esc.labio", extra: Ln(G.circleOf(stubF, 2, 7.6, P, 48), { tone: "lo" }) });
band("tl", atS(36), 0, 21, 5, { tone: "mid" }, { name: "tl.eje" });

// ---------- carcasa del generador de gas (cortada) ----------
const car = shellCut("car", ENG, [56, 58, 64, 72, 79, 86, 99, 112, 118, 124, 136, 148, 160], casIn, casOut, TH0, TH1, { name: "carcasa" });

// ---------- rotores ----------
const ring = (part, s0, rHub, rTip, tone = "hi", name = "escalon") => shellCut(part, ENG, [s0, s0 + 2], () => rHub, () => rTip, TH0, TH1, { name, steps: 24, tone });
const stator = (part, s0) => shellCut(part, ENG, [s0, s0 + 1.5], (q) => casIn(q) - 5, (q) => casIn(q) - 0.12, TH0 + 0.006, TH1 - 0.006, { name: "estator", steps: 24, tone: "mid" });
// turbina libre (de potencia): tambor y dos escalones, con su estátor
turned("tl", atS(57), [[0, 17], [14, 17]], { tone: "mid" }, { name: "tl.tambor" });
for (const s of [59, 65]) ring("tl", s, 17.05, casIn(s + 1) - 1);
stator("tl", 62);
stator("tl", 68.5);
// turbina del compresor
turned("tc", atS(73), [[0, 18], [11, 18]], { tone: "mid" }, { name: "tc.tambor" });
ring("tc", 76, 18.05, casIn(77) - 1);
stator("tc", 80);
// eje del generador de gas, cámara de flujo invertido e inyectores
band("tc", atS(84), 0, 28, 8, { tone: "mid" }, { name: "tc.eje" });
shellCut("cam", ENG, [88, 92, 97, 102, 106, 110], (q) => 14 - 1 * Math.sin((Math.PI * (q - 88)) / 22), (q) => 24 + 1.6 * Math.sin((Math.PI * (q - 88)) / 22), TH0, TH1, { name: "tubo-llama" });
for (const deg of [170, 220, 270, 315]) {
  const a = deg * DEG;
  if (a < TH0 || a > TH1) continue;
  const Fr = G.frameAlong(G.add3(ENG.o, G.mul3(ENG.a, 107)), G.radialOf(ENG, a));
  const rin = 24 + 1.6 * Math.sin((Math.PI * 19) / 22);
  put("cam", G.pointOf(ENG, 107, 29, a), S(G.disc(rin, casIn(107), 1.3, Fr, P), { tone: "mid" }), { name: "cam.inyector", shapes: [record(A.disc(Fr, rin, casIn(107), 1.3, { name: "cam.inyector" }))] });
}
// compresor axial: tambor, escalones y estátores
const drumR = lin([[112, 20], [160, 16]]);
turned("comp", atS(112), [[0, 20], [48, 16]], { tone: "mid" }, { name: "comp.tambor" });
for (const s of [116, 126, 136, 146]) ring("comp", s, drumR(s + 1) + 0.05, casIn(s + 1) - 1);
for (const s of [121, 131, 141, 151]) stator("comp", s);

// ---------- toma trasera con rejilla y caja de accesorios ----------
band("toma", atS(160), 0, 14, 14, { tone: "mid" }, { name: "toma.cubo" });
shellCut("toma", ENG, [160, 162], () => 24.5, () => 29, TH0, TH1, { name: "anillo", steps: 24, tone: "mid" });
for (let i = 0; i <= 9; i++) {
  const a = TH0 + 0.08 + ((TH1 - TH0 - 0.16) * i) / 9;
  const Fb = G.frameOf(G.pointOf(ENG, 162, 27, a), ENG.a, ENG.u, ENG.v);
  put("toma", G.pointOf(ENG, 168, 27, a), S(G.disc(0, 12, 0.7, Fb, P), { tone: "mid" }), { name: "toma.barra", shapes: [record(A.disc(Fb, 0, 12, 0.7, { name: "toma.barra" }))] });
}
stepped("agb", atS(174), [[0, 30], [3, 30], [3, 22], [20, 22], [20, 18], [24, 18]], { ribs: [11], name: "caja", bolts: [[3, 27, 16]] });
const accessory = (name, deg, r, rad, len) => {
  const o = G.pointOf(ENG, 198, r, deg * DEG);
  const Fa = G.frameOf(o, ENG.a, ENG.u, ENG.v);
  stepped("agb", Fa, [[0, rad - 1], [1.5, rad], [len, rad], [len, rad - 1.5], [len + 2, rad - 1.5]], { name, ribs: [len / 2] });
};
accessory("arranque", 210, 9, 6, 13);
accessory("regulador", 290, 10, 4.2, 9);

// ---------- cuna ----------
for (const s of [98, 144]) {
  const x = xAt(s);
  for (const y of [-14, 14]) {
    const zs = Z_AX - Math.sqrt(casOut(s) ** 2 - y * y);
    padOn("car", car, [x, y, zs], [0, 0, -1], 4, zs - 4, { name: "car.pata", tone: "mid" });
  }
  const plate = { x: x - 8, y: -22, w: 16, d: 44, r: 1.5 };
  boxAt("cuna", plate, 0, 4, { tone: "mid" }, { name: "cuna.placa", extra: Dots(k.corners(plate, 2.4).map(([px, py]) => at([px, py, 4])), { size: 0.4 }) });
}
for (const y of [-20, 16]) boxAt("cuna", { x: xAt(144) + 8, y, w: xAt(98) - xAt(144) - 16, d: 4, r: 0.6 }, 0, 3, { tone: "mid" }, { name: "cuna.larguero", bevel: 0.2 });

// ---------- pupitre con palanca de potencia e indicador de par ----------
const DESK = { x: 30, y: 92, w: 44, d: 26, r: 2 };
const DESK_H = 34;
boxAt("pal", DESK, 0, DESK_H, { tone: "mid" }, { bevel: 0.6, name: "pal.pupitre", inner: Ln(k.sideSeam(DESK, 8, P, 3), { tone: "faint" }) });
const PIV = [54, 106, DESK_H + 9];
for (const y of [100, 110]) boxAt("pal", { x: 44, y: y - (y > 105 ? 0 : 2), w: 20, d: 2, r: 0.5 }, DESK_H, 14, { tone: "mid" }, { name: "pal.sector", bevel: 0.2 });
const AXLE = G.frameAlong([PIV[0], 102, PIV[2]], [0, 1, 0]);
put("pal", PIV, S(G.disc(0, 8, 2, AXLE, P), { tone: "mid" }), { name: "pal.eje", shapes: [record(A.disc(AXLE, 0, 8, 2, { name: "pal.eje" }))] });
const leverDir = (phi) => [Math.sin(phi * DEG), 0, Math.cos(phi * DEG)];
const leverPhi = (t) => -35 + (70 * (t - TURBOHELICE.tMin)) / (TURBOHELICE.tMax - TURBOHELICE.tMin);
const ROD = 22 - Math.sqrt(2.8 ** 2 - 1.1 ** 2);
const leverSvg = (phi) => S(G.disc(2, ROD, 1.1, G.frameAlong(PIV, leverDir(phi)), P), { tone: "hi", lit: true }) + S(G.sphereOf(G.add3(PIV, G.mul3(leverDir(phi), 22)), 2.8, P, { steps: 32 }), { tone: "hi", lit: true });
const LEVER = Array.from({ length: 25 }, (_, i) => compactSvg(leverSvg(-35 + (70 * i) / 24)));
const phi0 = leverPhi(TURBOHELICE.t3);
put("pal", G.add3(PIV, G.mul3(leverDir(phi0), 12)), `<g data-palanca>${leverSvg(phi0)}</g>`, { bias: 0.3, name: "pal.palanca", shapes: [record(A.disc(G.frameAlong(PIV, leverDir(phi0)), 2, ROD, 1.1, { name: "pal.palanca" })), record(A.ball(G.add3(PIV, G.mul3(leverDir(phi0), 22)), 2.8, { name: "pal.pomo" }))] });
for (const [x, y] of [[70, 99], [70, 112]]) cylAt("pal", x, y, 2.2, DESK_H, 3, { tone: "hi" }, { name: "pal.mando", steps: 24, extra: Ln(k.lineOnTop([x, y], [x + 1.8, y], DESK_H + 3, P), { tone: "lo", free: "end" }) });
const GAUGE = [36.5, 99];
const GF = X.upZ([GAUGE[0], GAUGE[1], DESK_H]);
put("pal", [GAUGE[0], GAUGE[1], DESK_H + 1], S(k.cylinder(GAUGE[0], GAUGE[1], 5.5, DESK_H, 2, P, 40), { tone: "hi" }) + Ln(k.ring(GAUGE[0], GAUGE[1], 4.8, DESK_H + 2, P, 48), { tone: "lo" }) + Ln(k.radialTicks(GAUGE[0], GAUGE[1], 4.8, 12, 3, DESK_H + 2, [0.9, 1.6], P, -0.75 * Math.PI, 1.5 * Math.PI).minor, { tone: "lo" }) + `<path class="iso-line anat-needle" data-tone="lit" data-free="start" data-aguja="par" d=""/>`, { name: "pal.indicador", shapes: [record(A.cylinder(GAUGE[0], GAUGE[1], 5.5, DESK_H, 2, { name: "pal.indicador" }))] });

// ---------- estaciones: sondas sobre la cara de corte ----------
const N0 = G.mul3(G.tangentOf(ENG, TH0), -1);
const N1 = G.tangentOf(ENG, TH1);
const probe = (n, s) => (n % 2 ? dial(n, G.pointOf(ENG, s, (casIn(s) + casOut(s)) / 2, TH0), N0, { hostR: 0.9, min: 200, max: 1600, R: 6, stem: 7 }) : dial(n, G.pointOf(ENG, s, (casIn(s) + casOut(s)) / 2, TH1), N1, { hostR: 0.9, min: 200, max: 1600, R: 6, stem: 7 }));
probe(1, 156);
probe(2, 114);
probe(3, 87);
probe(4, 71);
probe(5, 58.5);
probe(6, 45);
const AGUJAS = [...X.AGUJAS, { id: "par", n: "M", F: { o: GF.o, a: GF.a, u: [0, -1, 0], v: [1, 0, 0] }, s: 2.05, r: 4.3, tail: 1, a0: -0.75 * Math.PI, a1: 0.75 * Math.PI, min: 0, max: 40 }];

// ---------- líneas de corriente: entrada de aire (azul) y escape caliente (naranja) ----------
const stream = (part, flujo, pts3, tone) => {
  const svg = k.fadeLineSvg(pts3.map(at), { fade: [16, 22], tone }).replace(/<path class="iso-line/g, '<path data-flow class="iso-line');
  put(part, pts3[Math.floor(pts3.length / 2)], `<g data-flujo="${flujo}">${svg}</g>`, { name: `${part}.linea`, shapes: [A.tube(pts3, 0.4, { name: `${part}.linea` })] });
};
for (const deg of [195, 250, 300]) {
  const a = deg * DEG;
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    pts.push(G.pointOf(ENG, 196 - 30 * t, 52 - 24 * Math.pow(t, 0.8), a));
  }
  stream("aire", "frio", pts, "blue");
}
for (const off of [-0.18, 0.18]) {
  const a = STUB_A + off;
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    pts.push(G.pointOf(ENG, 46 + 4 * t + 14 * t * t, casOut(46) + 20 + 34 * t, a));
  }
  stream("gas", "caliente", pts, "red");
}

// ---------- SVG, auditoría y página ----------
const LABEL_TEXT = "Turbohélice de turbina libre sobre una cuna, con la mitad cercana de la carcasa cortada: hélice de cuatro palas con buje y cono, reductor planetario, caja de escape con tobera lateral, turbina libre y su eje, turbina del compresor, cámara de flujo invertido, compresor axial, toma trasera con rejilla y caja de accesorios. Un pupitre con la palanca de potencia y un indicador de par.";
const svg = svgDe(E, { width: W, height: H, label: LABEL_TEXT });
// Excusado tras revisarlo a 8×: 0,44 px² de contacto del estátor de la TC con la carcasa en el borde del corte.
A.auditOrExit(E.R, P, { crowd: [], allow: [["car.carcasa", "tc.estator"]] });

const m0 = turbohelice(TURBOHELICE.t3);
const DATA = { P, agujas: AGUJAS, palanca: LEVER, base: TURBOHELICE, helice: { F: ENG, s: PROP_S, count: 4, sweep: 0, r0: 0, r1: 0, pala: PALA } };
const specJs = `const DATA = ${JSON.stringify(DATA)};\n${sinExport(readFileSync(join(HERE, "modelo.mjs"), "utf8"))}\n${readFileSync(join(HERE, "partes.js"), "utf8")}`;
const PARTES = [["hel", "Hélice"], ["red", "Reductor"], ["esc", "Escape"], ["tl", "Turbina libre"], ["tc", "Turbina del compresor"], ["cam", "Cámara de combustión"], ["comp", "Compresor"], ["toma", "Toma de aire"], ["agb", "Caja de accesorios"], ["car", "Carcasa"], ["aire", "Aire de entrada"], ["gas", "Gases de escape"], ["pal", "Palanca de potencia"]].map(([id, label]) => ({ id, label }));
const ESTACIONES = Array.from({ length: 6 }, (_, i) => ({ id: `e${i + 1}`, label: `Estación ${i + 1}` }));
const fmt = (v, d) => v.toFixed(d).replace(".", ",");
const html = (tema) =>
  tarjeta({
    id: "anat-turbohelice",
    fig: "Fig 2.2d",
    titulo: "Turbohélice · turbina libre",
    pista: "Clic en una pieza · palanca ← →",
    lectura: `T₃ ${TURBOHELICE.t3} K · ${fmt(m0.potencia, 2)} MW en el eje · F ${fmt(m0.F, 1)} kN`,
    svg,
    aria: "Turbohélice de turbina libre cortado. Flechas: mueven la palanca de potencia (temperatura de entrada a turbina). N o Intro: siguiente pieza.",
    control: { min: TURBOHELICE.tMin, max: TURBOHELICE.tMax, step: 10, valor: TURBOHELICE.t3, etiquetaHtml: "Palanca de potencia · T<sub>3</sub>", inicialTexto: `${TURBOHELICE.t3} K`, minTexto: `${TURBOHELICE.tMin} K`, maxTexto: `${TURBOHELICE.tMax} K` },
    partes: [...PARTES, ...ESTACIONES],
    claves: [
      { mark: "blue", label: "Aire que entra por la rejilla trasera" },
      { mark: "red", label: "Gases que salen por la tobera lateral" },
      { mark: "lit", label: "Palanca de potencia" },
    ],
    pie: "El generador de gas (compresor, cámara y turbina del compresor) gira en un eje propio. La turbina libre, en un eje distinto y sin unión mecánica con él, extrae casi toda la energía que queda en el gas y la lleva al reductor, que baja las revoluciones para mover la hélice. El escape aporta solo un pequeño empuje residual.",
    hipotesis: `<strong>Hipótesis:</strong> ciclo ideal de aire estándar frío (γ = 1,4, c<sub>p</sub> = 1,005 kJ/kg·K); vuelo a M = ${fmt(TURBOHELICE.M0, 1)} y 6000 m (T<sub>0</sub> = ${fmt(TURBOHELICE.T0, 1)} K, p<sub>0</sub> = ${fmt(TURBOHELICE.p0, 1)} kPa); toma, compresor (π = ${TURBOHELICE.pic}), turbinas y tobera isentrópicos; la turbina del compresor da exactamente w<sub>C</sub>; la turbina libre expande hasta p<sub>5</sub> = 1,2·p<sub>0</sub> y la tobera hasta p<sub>0</sub>; reductor sin pérdidas (${TURBOHELICE.reduccion}:1, hélice a ${TURBOHELICE.rpmHelice} rpm); rendimiento de la hélice 0,85; ṁ = ${TURBOHELICE.mdot} kg/s.`,
    tema,
  });
escribir({ dir: HERE, nombre: "turbohelice", titulo: "Turbohélice", html, specJs });
console.log("escrito turbohelice.html / turbohelice-light.html ·", E.R.items.length, "elementos ·", E.R.solids.length, "sólidos");
