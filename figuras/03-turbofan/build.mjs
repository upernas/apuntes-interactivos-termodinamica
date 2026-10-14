// Fig 2.2 · Turbofán de flujos separados en su cuna, con media góndola y media carcasa cortadas.
// node build.mjs [--audit]
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { k, G, A, DEG, escena, svgDe, compactSvg } from "../comun/kitfig.mjs";
import { piezas } from "../comun/piezas.mjs";
import { tarjeta, escribir, sinExport } from "../comun/pagina.mjs";
import { TURBOFAN, turbofan } from "./modelo.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 1000;
const H = 600;
const AZ = 56;
const EL = 30;
const X_IN = 150;
const Z_AX = 98;
const BASE = { x: -196, y: -96, w: 380, d: 222, r: 10 };
const BASE_H = 10;
const FOOT_H = 6;

const P = k.fitProjection([...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [X_IN, 0, Z_AX + 67], [X_IN - 180, 0, Z_AX + 67], [X_IN, 0, Z_AX - 67]], W, H, { pad: 24, azimuth: AZ, elevation: EL });
const E = escena(P);
const { at, S, Ln, Dots, record, back, put, turned, band, boxAt, padOn, ballAt } = E;
const X = piezas(E);
const { shellCut, dial } = X;

// Eje del motor: s crece en el sentido del flujo (hacia −x); ángulo desde arriba (u) hacia +y (v).
const ENG = G.frameOf([X_IN, 0, Z_AX], [-1, 0, 0], [0, 0, 1], [0, 1, 0]);
const VV = G.viewOf(P);
const TH_VIEW = Math.atan2(G.dot3(VV, ENG.v), G.dot3(VV, ENG.u));
const TH0 = TH_VIEW + Math.PI / 2;
const TH1 = TH_VIEW + (3 * Math.PI) / 2;
const xAt = (s) => X_IN - s;
const lin = (pts) => (s) => {
  if (s <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (s <= pts[i][0]) return pts[i - 1][1] + ((pts[i][1] - pts[i - 1][1]) * (s - pts[i - 1][0])) / (pts[i][0] - pts[i - 1][0]);
  return pts[pts.length - 1][1];
};

// ---------- bancada ----------
back.push(`<path class="iso-halo" d="${k.haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P)}"/>`);
const FEET = [-176, -60, 60, 164].flatMap((x) => [[x, BASE.y + 16], [x, BASE.y + BASE.d - 16]]).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
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
const STRIP = { x: -180, y: BASE.y + BASE.d - 14, w: 120, d: 7, r: 1 };
back.push(S(k.slabOf(STRIP, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
const TICKS = k.topTicks(STRIP.x + 4, STRIP.x + STRIP.w - 4, 5, 5, STRIP.y + 0.8, 0.6, [2, 3.6], P);
back.push(Ln(TICKS.minor, { tone: "lo" }), Ln(TICKS.major, { tone: "mid" }));
back.push(Dots([at([STRIP.x + 2, STRIP.y + 3.5, 0.6]), at([STRIP.x + STRIP.w - 2, STRIP.y + 3.5, 0.6])], { size: 0.45 }));
const LABEL = { x: 60, y: BASE.y + BASE.d - 18, w: 70, d: 11, r: 1.5 };
back.push(S(k.slabOf(LABEL, 0, 0.8, P, 3), { tone: "mid" }));
back.push(Ln(k.planOutline(k.insetPlan(LABEL, 1.6), 0.8, P), { tone: "faint" }));
back.push(k.faceTextSvg(k.topMatrix([LABEL.x + 5, LABEL.y + 7.6], 0.8, P, "x"), "TURBOFÁN BPR 8", { size: 4.4, tone: "lo" }));
back.push(Dots([at([LABEL.x + 2.4, LABEL.y + LABEL.d / 2, 0.8]), at([LABEL.x + LABEL.w - 2.4, LABEL.y + LABEL.d / 2, 0.8])], { size: 0.45 }));

// ---------- góndola (toma, conducto del fan, tobera fría) ----------
const nacIn = (s) => (s < 22 ? 57 + 3 * Math.sin((Math.PI / 2) * (s / 22)) : s < 140 ? 60 : 60 - (13 * (s - 140)) / 38);
const nacOut = (s) => (s < 30 ? 63 + 4 * Math.sin((Math.PI / 2) * (s / 30)) : s < 120 ? 67 : 67 - (15 * (s - 120)) / 58);
const toma = shellCut("toma", ENG, [0, 3, 6, 10, 14, 18, 22, 26, 30], nacIn, nacOut, TH0, TH1, { name: "labio" });
const nac = shellCut("nac", ENG, [30, 45, 60, 80, 100, 120, 130, 140, 150], nacIn, nacOut, TH0, TH1, { name: "carenado" });
const fria = shellCut("fria", ENG, [150, 157, 164, 171, 178], nacIn, nacOut, TH0, TH1, { name: "tobera" });

// ---------- núcleo: carcasa cortada y tobera caliente ----------
const coreOut = lin([[52, 32], [58, 34.5], [70, 35], [176, 35], [200, 33], [240, 26]]);
const coreIn = (s) => coreOut(s) - 2.5;
const car = shellCut("car", ENG, [52, 55, 58, 64, 70, 90, 110, 130, 150, 176, 188, 200, 213, 226], coreIn, coreOut, TH0, TH1, { name: "carcasa" });
const tob = shellCut("tob", ENG, [226, 233, 240], coreIn, coreOut, TH0, TH1, { name: "tobera" });

// ---------- rotor ----------
const atS = (s) => G.frameOf(G.add3(ENG.o, G.mul3(ENG.a, s)), ENG.a, ENG.u, ENG.v);
X.dish("fan", G.frameOf(G.add3(ENG.o, G.mul3(ENG.a, 30)), G.mul3(ENG.a, -1), ENG.u, G.mul3(ENG.v, -1)), 17, 18);
band("fan", atS(30), 0, 1, 17, { tone: "mid" }, { name: "fan.cubo" });
const FAN_S = 31;
const FAN_R = 58;
const fanSpokes = G.spokesOf(ENG, FAN_S, 18, FAN_R - 0.6, 22, P, { sweep: 0.35 });
const fanFace = Ln(G.circleOf(ENG, FAN_S, 18, P, 64), { tone: "lo" }) + Ln(G.circleOf(ENG, FAN_S, FAN_R - 0.6, P, 160), { tone: "lo" }) + `<path class="iso-line" data-tone="mid" data-rotor="fan" d="${fanSpokes}"/>`;
put("fan", G.add3(ENG.o, G.mul3(ENG.a, FAN_S + 4)), S(G.disc(FAN_S, FAN_S + 8, FAN_R, ENG, P), { tone: "hi" }) + fanFace, { name: "fan.alabes", shapes: [record(A.disc(ENG, FAN_S, FAN_S + 8, FAN_R, { name: "fan.alabes" }))] });
const drumR = lin([[39, 17], [80, 22], [140, 25]]);
turned("comp", atS(39), [[0, 17], [41, 22], [101, 25]].map(([s, r]) => [s, r]), { tone: "mid" }, { name: "comp.tambor" });
const stage = (part, s, rHub) => {
  const F = atS(s);
  const rTip = coreIn(s + 1) - 1;
  shellCut(part, ENG, [s, s + 2], () => rHub, () => rTip, TH0, TH1, { name: "escalon", steps: 24 });
};
for (const s of [58, 66, 74]) stage("comp", s, drumR(s + 1) + 0.05);
for (const s of [86, 94, 102, 110, 118, 126, 134]) stage("comp", s, drumR(s + 1) + 0.05);
band("eje", atS(140), 0, 40, 12, { tone: "mid" }, { name: "eje.arbol" });
// cámara anular: tubo de llama y cinco inyectores en la mitad visible
const CAM = [148, 174];
shellCut("cam", ENG, [148, 152, 157, 161, 165, 170, 174], (q) => 17 - 1.2 * Math.sin((Math.PI * (q - 148)) / 26), (q) => 27 + 1.8 * Math.sin((Math.PI * (q - 148)) / 26), TH0, TH1, { name: "tubo-llama" });
const injectors = [170, 215, 260, 305].map((deg) => deg * DEG).filter((a) => a > TH0 && a < TH1);
for (const a of injectors) {
  const Fr = G.frameAlong(G.add3(ENG.o, G.mul3(ENG.a, 152)), G.radialOf(ENG, a));
  put("cam", G.pointOf(ENG, 152, 30, a), S(G.disc(27 + 1.8 * Math.sin((Math.PI * 4) / 26), coreIn(152), 1.4, Fr, P), { tone: "mid" }), { name: "cam.inyector", shapes: [record(A.disc(Fr, 27 + 1.8 * Math.sin((Math.PI * 4) / 26), coreIn(152), 1.4, { name: "cam.inyector" }))] });
}
turned("turb", atS(180), [[0, 20], [16, 20], [56, 18]], { tone: "mid" }, { name: "turb.tambor" });
for (const s of [183, 191]) stage("turb", s, 20.05);
for (const s of [200, 208, 216, 224, 232]) stage("turb", s, 20 - (2 * (s + 1 - 196)) / 40 + 0.05);
// coronas de estátor, fijas a la carcasa, entre los escalonamientos del rotor
const stator = (part, s0) => shellCut(part, ENG, [s0, s0 + 1.5], (q) => coreIn(q) - 5, coreIn, TH0, TH1, { name: "estator", steps: 24, tone: "mid" });
for (const q of [62, 70, 78, 90, 98, 106, 114, 122, 130]) stator("comp", q);
for (const q of [187, 195, 204, 212, 220, 228]) stator("turb", q);
X.dish("tob", atS(236), 17, 49);
// estructura: brazos del núcleo, brazos del conducto frío y bastidor trasero
const strut = (part, s, r0, r1, a, rad = 1.6) => {
  const Fr = G.frameAlong(G.add3(ENG.o, G.mul3(ENG.a, s)), G.radialOf(ENG, a));
  put(part, G.pointOf(ENG, s, (r0 + r1) / 2, a), S(G.disc(r0, r1, rad, Fr, P), { tone: "mid" }), { name: `${part}.brazo`, shapes: [record(A.disc(Fr, r0, r1, rad, { name: `${part}.brazo` }))] });
};
for (const deg of [190, 280]) strut("car", 82, drumR(82) + 0.1, coreIn(82), deg * DEG, 1.4);
for (const deg of [180, 235, 290]) strut("nac", 64, coreOut(64), nacIn(64), deg * DEG, 2);
// álabes guía de salida del fan (OGV)
for (const deg of [195, 210, 250, 265]) strut("fan", 59, coreOut(59), nacIn(59), deg * DEG, 1.2);
for (const deg of [190, 280]) strut("tob", 237.5, 17 * Math.sqrt(1 - (1.5 / 49) ** 2) - 0.1, coreIn(237.5), deg * DEG, 1.2);

// ---------- cuna ----------
const NAC_BOTTOM = (s) => Z_AX - nacOut(s);
for (const s of [44, 126]) {
  const x = xAt(s);
  for (const y of [-18, 18]) {
    const zs = Z_AX - Math.sqrt(nacOut(s) ** 2 - y * y);
    padOn("nac", nac, [x, y, zs], [0, 0, -1], 4.5, zs - 4, { name: "nac.pata", tone: "mid" });
  }
  const plate = { x: x - 8, y: -26, w: 16, d: 52, r: 1.5 };
  boxAt("cuna", plate, 0, 4, { tone: "mid" }, { name: "cuna.placa", extra: Dots(k.corners(plate, 2.4).map(([px, py]) => at([px, py, 4])), { size: 0.4 }) });
}
for (const y of [-24, 20]) boxAt("cuna", { x: xAt(126) + 8, y, w: xAt(44) - xAt(126) - 16, d: 4, r: 0.6 }, 0, 3, { tone: "mid" }, { name: "cuna.larguero", bevel: 0.2 });

// ---------- pupitre con palanca de gases ----------
const DESK = { x: -46, y: 92, w: 44, d: 26, r: 2 };
const DESK_H = 34;
boxAt("pal", DESK, 0, DESK_H, { tone: "mid" }, { bevel: 0.6, name: "pal.pupitre", inner: Ln(k.sideSeam(DESK, 8, P, 3), { tone: "faint" }) });
const PIV = [-22, 106, DESK_H + 9];
for (const y of [100, 110]) boxAt("pal", { x: -32, y: y - (y > 105 ? 0 : 2), w: 20, d: 2, r: 0.5 }, DESK_H, 14, { tone: "mid" }, { name: "pal.sector", bevel: 0.2 });
const AXLE = G.frameAlong([PIV[0], 102, PIV[2]], [0, 1, 0]);
put("pal", PIV, S(G.disc(0, 8, 2, AXLE, P), { tone: "mid" }), { name: "pal.eje", shapes: [record(A.disc(AXLE, 0, 8, 2, { name: "pal.eje" }))] });
const leverDir = (phi) => [Math.sin(phi * DEG), 0, Math.cos(phi * DEG)];
const leverPhi = (t) => -35 + (70 * (t - TURBOFAN.tMin)) / (TURBOFAN.tMax - TURBOFAN.tMin);
const leverSvg = (phi) => {
  const F = G.frameAlong(PIV, leverDir(phi));
  const knob = G.add3(PIV, G.mul3(leverDir(phi), 22));
  return S(G.disc(2, 22 - Math.sqrt(2.8 ** 2 - 1.1 ** 2), 1.1, F, P), { tone: "hi", lit: true }) + S(G.sphereOf(knob, 2.8, P, { steps: 32 }), { tone: "hi", lit: true });
};
const LEVER = Array.from({ length: 25 }, (_, i) => compactSvg(leverSvg(-35 + (70 * i) / 24)));
const phi0 = leverPhi(TURBOFAN.t4);
const LF = G.frameAlong(PIV, leverDir(phi0));
put("pal", G.add3(PIV, G.mul3(leverDir(phi0), 12)), `<g data-palanca>${leverSvg(phi0)}</g>`, { bias: 0.3, name: "pal.palanca", shapes: [record(A.disc(LF, 2, 22 - Math.sqrt(2.8 ** 2 - 1.1 ** 2), 1.1, { name: "pal.palanca" })), record(A.ball(G.add3(PIV, G.mul3(leverDir(phi0), 22)), 2.8, { name: "pal.pomo" }))] });
// mandos y piloto del pupitre
for (const [x, y] of [[-6, 99], [-6, 112]]) E.cylAt("pal", x, y, 2.2, DESK_H, 3, { tone: "hi" }, { name: "pal.mando", steps: 24, extra: Ln(k.lineOnTop([x, y], [x + 1.8, y], DESK_H + 3, P), { tone: "lo", free: "end" }) });
E.cylAt("pal", -42, 113, 1.6, DESK_H, 1.6, { tone: "mid" }, { name: "pal.piloto", steps: 20, extra: `<path class="anat-glow" data-brillo d="${k.ring(-42, 113, 1.1, DESK_H + 1.6, P, 20)}"/>` });
// indicador de empuje en el pupitre (esfera horizontal)
const GAUGE = [-39.5, 99];
const GF = X.upZ([GAUGE[0], GAUGE[1], DESK_H]);
put("pal", [GAUGE[0], GAUGE[1], DESK_H + 1], S(k.cylinder(GAUGE[0], GAUGE[1], 5.5, DESK_H, 2, P, 40), { tone: "hi" }) + Ln(k.ring(GAUGE[0], GAUGE[1], 4.8, DESK_H + 2, P, 48), { tone: "lo" }) + Ln(k.radialTicks(GAUGE[0], GAUGE[1], 4.8, 12, 3, DESK_H + 2, [0.9, 1.6], P, -0.75 * Math.PI, 1.5 * Math.PI).minor, { tone: "lo" }) + `<path class="iso-line anat-needle" data-tone="lit" data-free="start" data-aguja="empuje" d=""/>`, { name: "pal.indicador", shapes: [record(A.cylinder(GAUGE[0], GAUGE[1], 5.5, DESK_H, 2, { name: "pal.indicador" }))] });

// ---------- estaciones: sondas con esfera sobre la cara de corte ----------
const N0 = G.mul3(G.tangentOf(ENG, TH0), -1);
const probe = (n, s, r) => dial(n, G.pointOf(ENG, s, r, TH0), N0, { hostR: 0.9, min: 200, max: 1800, R: 6, stem: 7 });
probe(1, 14, (nacIn(14) + nacOut(14)) / 2);
probe(2, 46, (nacIn(46) + nacOut(46)) / 2);
probe(3, 141, (coreIn(141) + coreOut(141)) / 2);
probe(4, 177, (coreIn(177) + coreOut(177)) / 2);
probe(5, 222, (coreIn(222) + coreOut(222)) / 2);
probe(6, 237, (coreIn(237) + coreOut(237)) / 2);
probe(7, 172, (nacIn(172) + nacOut(172)) / 2);
const AGUJAS = [...X.AGUJAS, { id: "empuje", n: "F", F: { o: GF.o, a: GF.a, u: [0, -1, 0], v: [1, 0, 0] }, s: 2.05, r: 4.3, tail: 1, a0: -0.75 * Math.PI, a1: 0.75 * Math.PI, min: 0, max: 80 }];

// ---------- líneas de corriente: flujo frío (azul) y flujo caliente (naranja) ----------
const stream = (part, flujo, fn, s0, s1, a, tone) => {
  const pts3 = [];
  for (let s = s0; s <= s1 + 1e-6; s += 2) pts3.push(G.pointOf(ENG, s, fn(s), a));
  const svg = k.fadeLineSvg(pts3.map(at), { fade: [16, 22], tone }).replace(/<path class="iso-line/g, '<path data-flow class="iso-line');
  put(part, pts3[Math.floor(pts3.length / 2)], `<g data-flujo="${flujo}">${svg}</g>`, { name: `${part}.linea`, shapes: [A.tube(pts3, 0.4, { name: `${part}.linea` })] });
};
const bypassR = (s) => (s < 52 ? 44 : s <= 178 ? (coreOut(s) + nacIn(s)) / 2 : coreOut(s) + 6);
const intakeR = (s) => 36 + 0.04 * s;
const hotR = (s) => 20 + (s - 240) * 0.03;
for (const deg of [168, 300]) {
  stream("ff", "frio", intakeR, -30, 27, deg * DEG, "blue");
  stream("ff", "frio", bypassR, 42, 232, deg * DEG, "blue");
}
for (const deg of [205, 270]) stream("fc", "caliente", hotR, 242, 330, deg * DEG, "red");

// ---------- SVG, auditoría y página ----------
const LABEL_TEXT = "Turbofán de flujos separados sobre una cuna, con la mitad cercana de la góndola y de la carcasa del núcleo cortadas: toma, fan, compresores de baja y alta, cámara anular con inyectores, turbinas y toberas fría y caliente; líneas de corriente azules (flujo frío) y naranjas (flujo caliente). Un pupitre con la palanca de gases fija la temperatura de entrada a turbina.";
const svg = svgDe(E, { width: W, height: H, label: LABEL_TEXT });
A.auditOrExit(E.R, P, { crowd: [] });

const m0 = turbofan(TURBOFAN.t4);
const DATA = { P, agujas: AGUJAS, palanca: LEVER, base: TURBOFAN, fan: { F: ENG, s: FAN_S, r0: 18, r1: FAN_R - 0.6, count: 22, sweep: 0.35 } };
const specJs = `const DATA = ${JSON.stringify(DATA)};\n${sinExport(readFileSync(join(HERE, "modelo.mjs"), "utf8"))}\n${readFileSync(join(HERE, "partes.js"), "utf8")}`;
const PARTES = [["toma", "Toma de aire"], ["fan", "Fan"], ["comp", "Compresor"], ["cam", "Cámara de combustión"], ["turb", "Turbina"], ["tob", "Tobera caliente"], ["fria", "Tobera fría"], ["ff", "Flujo frío"], ["fc", "Flujo caliente"], ["nac", "Góndola"], ["car", "Carcasa del núcleo"], ["eje", "Eje"], ["cuna", "Cuna"], ["pal", "Palanca de gases"]].map(([id, label]) => ({ id, label }));
const ESTACIONES = Array.from({ length: 7 }, (_, i) => ({ id: `e${i + 1}`, label: `Estación ${i + 1}` }));
const fmt = (v, d) => v.toFixed(d).replace(".", ",");
const html = (tema) =>
  tarjeta({
    id: "anat-turbofan",
    fig: "Fig 2.2c",
    titulo: "Turbofán · flujos separados",
    pista: "Clic en una pieza · palanca ← →",
    lectura: `T₄ ${TURBOFAN.t4} K · F ${fmt(m0.F, 1)} kN · η_p ${fmt(m0.etaP * 100, 1)} %`,
    svg,
    aria: "Turbofán cortado sobre su cuna. Flechas: mueven la palanca de gases (temperatura de entrada a turbina). N o Intro: siguiente pieza.",
    control: { min: TURBOFAN.tMin, max: TURBOFAN.tMax, step: 10, valor: TURBOFAN.t4, etiquetaHtml: "Palanca de gases · T<sub>4</sub>", inicialTexto: `${TURBOFAN.t4} K`, minTexto: `${TURBOFAN.tMin} K`, maxTexto: `${TURBOFAN.tMax} K` },
    partes: [...PARTES, ...ESTACIONES],
    claves: [
      { mark: "blue", label: "Flujo frío: el aire que solo pasa por el fan (derivación)" },
      { mark: "red", label: "Flujo caliente: el aire del núcleo tras la combustión" },
      { mark: "lit", label: "Palanca de gases" },
    ],
    pie: "El fan acelera mucha masa de aire poco; la mayor parte rodea el núcleo por el conducto de derivación y sale fría por la tobera exterior. El resto pasa por el compresor, la cámara y la turbina, que mueve fan y compresor, y sale caliente por la tobera interior. Cada sonda marca la temperatura de su estación; las líneas de corriente se mueven a la velocidad relativa de cada chorro.",
    hipotesis: `<strong>Hipótesis:</strong> ciclo ideal de aire estándar frío (γ = 1,4, c<sub>p</sub> = 1,005 kJ/kg·K, R = 0,287 kJ/kg·K); vuelo a M = ${fmt(TURBOFAN.M0, 2)} y 10 000 m (T<sub>0</sub> = ${fmt(TURBOFAN.T0, 1)} K, p<sub>0</sub> = ${fmt(TURBOFAN.p0, 1)} kPa); toma, fan, compresor, turbina y toberas isentrópicos; π<sub>fan</sub> = 1,6 y relación global p<sub>3</sub>/p<sub>1</sub> = 25; relación de derivación BPR = 8; toberas adaptadas (p<sub>salida</sub> = p<sub>0</sub>); combustión a presión constante sin contar la masa de combustible; poder calorífico 42 800 kJ/kg; ṁ<sub>núcleo</sub> = ${TURBOFAN.mcore} kg/s para el empuje.`,
    tema,
  });
escribir({ dir: HERE, nombre: "turbofan", titulo: "Turbofán", html, specJs });
console.log("escrito turbofan.html / turbofan-light.html ·", E.R.items.length, "elementos ·", E.R.solids.length, "sólidos");
