// Fig 2.3 · Central de vapor Rankine con recalentamiento y regeneración (un calentador cerrado y
// un calentador abierto/desaireador). node build.mjs [--audit]
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { k, G, A, DEG, escena, svgDe } from "../comun/kitfig.mjs";
import { piezas } from "../comun/piezas.mjs";
import { tarjeta, escribir, sinExport } from "../comun/pagina.mjs";
import { RANKINE, rankine } from "./modelo.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 1000;
const H = 640;
const AZ = 56;
const EL = 30;
const YT = -60;
const YF = 50;
const ZS = 94;
const YB = -70;
const BASE = { x: -362, y: -136, w: 404, d: 216, r: 10 };
const BASE_H = 10;
const FOOT_H = 6;
const STEAM = 4;
const WATER = 2.4;
const PADS = 6.4;
const PADW = 4;
const BOIL = { x: -340, y: -120, w: 90, d: 100, r: 3 };
const BOIL_H = 176;
const TOWARD = G.unit3([Math.cos(AZ * DEG), Math.sin(AZ * DEG), 0]);

const P = k.fitProjection([...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [-290, -108, 232], [BOIL.x, BOIL.y, 210], [-119, -60, 160], [-90, -60, 182], [-90, 40, 182], [-180, 50, 172]], W, H, { pad: 24, azimuth: AZ, elevation: EL });
const E = escena(P);
const { at, S, Ln, Dots, record, back, put, turned, band, pipe, boxAt, cylAt, padOn, boss, ballAt } = E;
const X = piezas(E);
const { radiusAt, alongX, upZ, stepped, shaft, AC, pedestal, exchanger, dial, pump } = X;

// ---------- bancada ----------
back.push(`<path class="iso-halo" d="${k.haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P)}"/>`);
const FEET = [-340, -240, -140, -40, 30].flatMap((x) => [[x, BASE.y + 16], [x, BASE.y + BASE.d - 16]]).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
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
const STRIP = { x: -250, y: BASE.y + BASE.d - 14, w: 220, d: 7, r: 1 };
back.push(S(k.slabOf(STRIP, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
const TICKS = k.topTicks(STRIP.x + 4, STRIP.x + STRIP.w - 4, 5, 5, STRIP.y + 0.8, 0.6, [2, 3.6], P);
back.push(Ln(TICKS.minor, { tone: "lo" }), Ln(TICKS.major, { tone: "mid" }));
back.push(Dots([at([STRIP.x + 2, STRIP.y + 3.5, 0.6]), at([STRIP.x + STRIP.w - 2, STRIP.y + 3.5, 0.6])], { size: 0.45 }));
const LABEL = { x: -350, y: BASE.y + BASE.d - 18, w: 70, d: 11, r: 1.5 };
back.push(S(k.slabOf(LABEL, 0, 0.8, P, 3), { tone: "mid" }));
back.push(Ln(k.planOutline(k.insetPlan(LABEL, 1.6), 0.8, P), { tone: "faint" }));
back.push(k.faceTextSvg(k.topMatrix([LABEL.x + 5, LABEL.y + 7.6], 0.8, P, "x"), "CENTRAL RANKINE", { size: 4.4, tone: "lo" }));
back.push(Dots([at([LABEL.x + 2.4, LABEL.y + LABEL.d / 2, 0.8]), at([LABEL.x + LABEL.w - 2.4, LABEL.y + LABEL.d / 2, 0.8])], { size: 0.45 }));

// ---------- turbinas, alternador y condensador (fila trasera, elevadas) ----------
const casingX = (part, x0, profile, opts) => stepped(part, alongX([x0, YT, ZS]), profile, opts).host;
const topPort = (part, host, x, profile, x0, a = PADS) => padOn(part, host, [x, YT, ZS + radiusAt(profile, x - x0)], [0, 0, 1], a, 6, { name: `${part}.tobera` });
const HP_X = -220;
const HP = [[0, 15], [3, 15], [3, 14], [47, 18], [47, 19.5], [50, 19.5]];
const tap = casingX("tap", HP_X, HP, { ribs: [20] });
pedestal("tap", HP_X, HP_X + 3, YT, ZS, 15);
pedestal("tap", HP_X + 47, HP_X + 50, YT, ZS, 19.5);
shaft("eje", -170, -130, YT, ZS, [AC(-150)]);
const LP_X = -130;
const LP = [[0, 22], [4, 22], [4, 20], [76, 27], [76, 29], [80, 29]];
const tbp = casingX("tbp", LP_X, LP, { ribs: [26, 50] });
pedestal("tbp", LP_X, LP_X + 4, YT, ZS, 22);
pedestal("tbp", LP_X + 76, LP_X + 80, YT, ZS, 29);
shaft("eje", -50, -30, YT, ZS, [AC(-40)]);
const GEN_X = -30;
const genF = alongX([GEN_X, YT, ZS]);
turned("gen", genF, [[0, 20], [3, 24], [57, 24], [60, 20]], { tone: "hi" }, { extra: k.fadedSvg(G.ribsOf(genF, 6, 54, 24, 44, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }), name: "gen.cuerpo" });
pedestal("gen", GEN_X + 6, GEN_X + 16, YT, ZS, 24);
pedestal("gen", GEN_X + 44, GEN_X + 54, YT, ZS, 24);
const TBOX = { x: GEN_X + 20, y: YT - 8, w: 20, d: 16, r: 1.2 };
boxAt("gen", TBOX, ZS + 24, 9, { tone: "mid" }, { bevel: 0.4, extra: Ln(k.planOutline(k.insetPlan(TBOX, 1.4), ZS + 33, P, 3), { tone: "faint" }) + Dots(k.corners(TBOX, 2.2).map(([x, y]) => at([x, y, ZS + 33])), { size: 0.4 }), name: "gen.bornes" });

// Condensador bajo la turbina de baja; el escape baja por un cuello (estación 13).
const COND = { x: -122, y: YT - 24, w: 64, d: 48, r: 2 };
const COND_H = 48;
boxAt("cond", COND, 0, COND_H, { tone: "hi" }, { bevel: 0.6, steps: 3, inner: Ln(k.sideSeam(COND, 12, P, 3), { tone: "faint" }), name: "cond.carcasa", extra: Dots(k.corners(COND, 3).map(([x, y]) => at([x, y, COND_H])), { size: 0.42 }) });
const NECK_X = -70;
const neckTop = ZS - radiusAt(LP, NECK_X - LP_X);
const NECK_A = 10;
padOn("tbp", tbp, [NECK_X, YT, neckTop], [0, 0, -1], NECK_A, neckTop - COND_H, { name: "tbp.cuello" });
// agua de refrigeración: dos tubuladuras en la cara trasera, con tubos al suelo
for (const [x, name] of [[-112, "entrada"], [-96, "salida"]]) {
  const z = name === "entrada" ? 14 : 30;
  const tip = boss("cond", [x, COND.y, z], [0, -1, 0], 4, 3, { name: `cond.agua-${name}` });
  const plate = { x: x - 6, y: COND.y - 20, w: 12, d: 12, r: 1 };
  boxAt("cond", plate, 0, 3, { tone: "mid" }, { name: `cond.arqueta`, extra: Dots(k.corners(plate, 2).map(([px, py]) => at([px, py, 3])), { size: 0.4 }) });
  pipe("cond", [tip, [x, plate.y + 6, z], [x, plate.y + 6, 3]], WATER, { name: `cond.agua-${name}`, flangeR: 1.5 });
}

// ---------- caldera ----------
boxAt("cal", BOIL, 0, BOIL_H, { tone: "hi" }, { bevel: 0.8, steps: 4, inner: Ln(k.sideSeam(BOIL, 70, P, 4) + k.sideSeam(BOIL, 120, P, 4), { tone: "faint" }), name: "cal.hogar" });
const ROOF = k.insetPlan(BOIL, 6);
boxAt("cal", ROOF, BOIL_H, 4, { tone: "mid" }, { bevel: 0.4, name: "cal.techo" });
const ROOF_TOP = BOIL_H + 4;
// calderín sobre el techo
const DRUM_Z = ROOF_TOP + 6 + 11;
for (const x of [-322, -270]) boxAt("cal", { x: x - 3, y: YB - 8, w: 6, d: 16, r: 1 }, ROOF_TOP, DRUM_Z - 11 - ROOF_TOP, { tone: "mid" }, { name: "cal.silleta" });
const drum = band("cal", alongX([-330, YB, DRUM_Z]), 0, 68, 11, { tone: "hi" }, { inner: G.arcOf(alongX([-330, YB, DRUM_Z]), 34, 11, P), name: "cal.calderin" });
X.dish("cal", G.frameOf([-330, YB, DRUM_Z], [-1, 0, 0], [0, 0, 1], [0, 1, 0]), 11, 4.5);
X.dish("cal", alongX([-262, YB, DRUM_Z]), 11, 4.5);
// chimenea detrás del calderín
stepped("cal", upZ([-290, -108, ROOF_TOP]), [[0, 11], [3, 11], [3, 8], [46, 8], [46, 9.4], [50, 9.4]], { ribs: [16, 31], name: "chimenea" });
// mirilla y puerta en la cara frontal
const FRONT = BOIL.y + BOIL.d;
const DOOR = { x: -334, y: FRONT, w: 26, d: 2, r: 0.8 };
boxAt("cal", DOOR, 60, 34, { tone: "mid" }, { bevel: 0.3, name: "cal.puerta", extra: Dots([[-331.5, 63], [-331.5, 91], [-310.5, 63], [-310.5, 91]].map(([x, z]) => at([x, FRONT + 2, z])), { size: 0.4 }) });
const SIGHT = G.frameAlong([-270, FRONT, 70], [0, 1, 0]);
put("cal", [-270, FRONT + 1, 70], S(G.disc(0, 2.4, 6, SIGHT, P), { tone: "mid" }) + `<path class="anat-glow" data-brillo d="${G.circleOf(SIGHT, 2.4, 4, P, 28)}"/>` + Ln(G.circleOf(SIGHT, 2.4, 4, P, 28), { tone: "lo" }) + Dots(G.dotsOf(SIGHT, 2.4, 5, 6, P, { all: true }), { size: 0.36 }), { name: "cal.mirilla", shapes: [record(A.disc(SIGHT, 0, 2.4, 6, { name: "cal.mirilla" }))] });
// panel colector del recalentador en la cara derecha
const RIGHT = BOIL.x + BOIL.w;
const REC = { x: RIGHT, y: -118, w: 3, d: 64, r: 0.8 };
boxAt("rec", REC, 157, 19, { tone: "mid" }, { bevel: 0.3, name: "rec.colector", extra: Dots([[-115, 159], [-115, 174], [-57, 159], [-57, 174]].map(([y, z]) => at([RIGHT + 3, y, z])), { size: 0.4 }) });
const BN = {
  b9: boss("cal", [RIGHT, YT, 150], [1, 0, 0], PADS, 4, { name: "cal.tobera" }),
  b8: boss("cal", [-262, FRONT, 124], [0, 1, 0], PADW, 4, { name: "cal.tobera" }),
  b10: boss("rec", [RIGHT + 3, YT, 165], [1, 0, 0], PADS, 4, { name: "rec.tobera" }),
  b11: boss("rec", [RIGHT + 3, -112, 165], [1, 0, 0], PADS, 4, { name: "rec.tobera" }),
};
// quemador, línea de combustible, válvula y palanca (control)
const BURN = [-295, FRONT, 34];
const burnF = G.frameOf(BURN, [0, 1, 0], [0, 0, 1], [1, 0, 0]);
stepped("pal", burnF, [[0, 10], [2, 10], [2, 8.4], [12, 8.4], [12, 5], [16, 5]], { ribs: [7], name: "quemador" });
const FUEL = 1.5;
const VALVE_Y = 12;
const fuelStart = [BURN[0], FRONT + 16, BURN[2]];
const FUEL_FLOOR = { x: BURN[0] - 6, y: 22, w: 12, d: 12, r: 1.2 };
boxAt("pal", FUEL_FLOOR, 0, 4, { tone: "mid" }, { bevel: 0.3, name: "pal.toma", extra: Dots(k.corners(FUEL_FLOOR, 2).map(([x, y]) => at([x, y, 4])), { size: 0.4 }) });
const fuelLine = pipe("pal", [fuelStart, [BURN[0], 28, BURN[2]], [BURN[0], 28, 4]], FUEL, { flangeR: 2, name: "pal.linea", gaps: [[VALVE_Y - 4.4 - fuelStart[1], VALVE_Y + 4.4 - fuelStart[1]]] });
const VF = G.frameOf([BURN[0], VALVE_Y, BURN[2]], [0, 1, 0], [0, 0, 1], [1, 0, 0]);
const vr = FUEL;
const crown = vr * 2.1;
const bulge = (x) => vr * 1.5 + (crown - vr * 1.5) * Math.sqrt(Math.max(0, 1 - (x / (vr * 2)) ** 2));
const bulgeSlope = (x) => {
  if (Math.abs(x) >= vr * 2 - 1e-9) return 0;
  const t = Math.max(-0.995, Math.min(0.995, x / (vr * 2)));
  return (-(crown - vr * 1.5) * t) / (vr * 2 * Math.sqrt(1 - t * t));
};
const VALVE = [[-4.4, 0], [-4.4, vr * 1.5], ...Array.from({ length: 17 }, (_, i) => { const x = vr * 2 * Math.sin(((i - 8) / 8) * (Math.PI / 2)); return [x, bulge(x), i && i < 16 ? 1 : 0]; }), [4.4, vr * 1.5], [4.4, 0]];
put("pal", [BURN[0], VALVE_Y, BURN[2]], S(G.lathe(VALVE, VF, P, { steps: 36, smooth: { slope: bulgeSlope, rows: 3 } }), { tone: "hi" }), { name: "pal.valvula", shapes: [record(A.body(VF, VALVE, { name: "pal.valvula", owner: fuelLine.owner }))] });
const NECK = upZ([BURN[0], VALVE_Y, BURN[2]]);
const NECK_TOP = crown - 0.2 + 3.2;
put("pal", [BURN[0], VALVE_Y, BURN[2] + crown + 1.5], S(G.disc(crown - 0.2, NECK_TOP, 1.2, NECK, P), { tone: "mid" }), { bias: 0.2, name: "pal.vastago", shapes: [record(A.disc(NECK, crown - 0.2, NECK_TOP, 1.2, { name: "pal.vastago", owner: fuelLine.owner }))] });
const LEVER_Z = BURN[2] + NECK_TOP;
const leverDeg = (t) => 90 + 18 + ((t - RANKINE.tMin) / (RANKINE.tMax - RANKINE.tMin)) * 72;
const LEVER = X.leverFrames([BURN[0], VALVE_Y], LEVER_Z, 15, Array.from({ length: 25 }, (_, i) => 90 + 18 + (72 * i) / 24));
const restDeg = leverDeg(RANKINE.t);
put("pal", [BURN[0], VALVE_Y, LEVER_Z], `<g data-palanca>${LEVER.svg(restDeg)}</g>`, { bias: 0.4, name: "pal.palanca", shapes: [record(A.extruded(LEVER.ring(restDeg), LEVER_Z, 1.2, { name: "pal.palanca", owner: fuelLine.owner }))] });

// ---------- fila delantera: calentador cerrado (FC), desaireador (DA) y bombas ----------
const FC = exchanger("fc", -228, -162, YF, 60, 13, { channel: [12.4, 12.4], rings: [33], saddles: [-222, -186] });
const DA = exchanger("da", -130, -70, YF, 90, 15, { rings: [30], legs: true, saddles: [-124, -82] });
const column = padOn("da", DA.shell, [-90, YF, 105], [0, 0, 1], 8, 20, { name: "da.columna", tone: "hi" });
const N = {
  fc4: padOn("fc", FC.right, FC.channelTop(-154), [0, 0, 1], PADW, 6, { name: "fc.tobera" }),
  fc5: padOn("fc", FC.left, FC.channelTop(-236), [0, 0, 1], PADW, 6, { name: "fc.tobera" }),
  fc10: padOn("fc", FC.shell, FC.top(-182), [0, 0, 1], PADS, 6, { name: "fc.tobera" }),
  fc6: padOn("fc", FC.shell, FC.bottom(-208), [0, 0, -1], PADW, 6, { name: "fc.purga" }),
  da12: boss("da", column, [0, 0, 1], PADS, 4, { name: "da.tobera" }),
  da2: padOn("da", DA.shell, [-75, YF - 15, 90], [0, -1, 0], PADW, 6, { name: "da.tobera" }),
  da3: padOn("da", DA.shell, DA.bottom(-110), [0, 0, -1], PADW, 6, { name: "da.tobera" }),
  cond1: boss("cond", [-75, COND.y + COND.d, 18], [0, 1, 0], PADW, 4, { name: "cond.tobera" }),
};
const B1 = pump("b1", -75, 0, { axis: "y", side: -1 });
const B2 = pump("b2", -110, 0, { axis: "y", side: 1 });
const B3 = pump("b3", -208, 0, { axis: "y", side: 1, z: 14, scale: 0.8 });

// ---------- tuberías (estaciones) ----------
const tint = (n) => `data-temp="${n}"`;
const D = {};
const wp = (n, pts, opts = {}) => (D[n] = pipe(`e${n}`, pts, WATER, { name: `e${n}.tubo`, cls: tint(n), ...opts }));
const sp = (n, pts, opts = {}) => (D[n] = pipe(`e${n}`, pts, STEAM, { name: `e${n}.tubo`, cls: tint(n), ...opts }));
const PORT = {
  hp9: topPort("tap", tap, -202, HP, HP_X),
  hp10: topPort("tap", tap, -182, HP, HP_X),
  lp11: topPort("tbp", tbp, -119, LP, LP_X),
  lp12: topPort("tbp", tbp, -90, LP, LP_X),
};
wp(1, [N.cond1, B1.suction]);
wp(2, [B1.discharge, [-75, B1.discharge[1], 90], N.da2], { bend: 5 });
wp(3, [N.da3, [-110, YF, B2.suction[2]], B2.suction], { bend: 5 });
wp(4, [B2.discharge, [-110, B2.discharge[1], 104], [-154, B2.discharge[1], 104], [-154, YF, 104], N.fc4], { bend: 3.4 });
// mezcla 5 + 7 → 8 en una te esférica
const TEE8 = [-236, YF, 100];
const T8R = 4.4;
const rim = (R, r) => Math.sqrt(R * R - r * r);
ballAt("e8", TEE8, T8R, { tone: "hi", name: "e8.mezcla" });
wp(5, [N.fc5, [TEE8[0], TEE8[1], TEE8[2] - rim(T8R, WATER)]], { flanges: [true, false] });
wp(6, [N.fc6, [-208, YF, B3.suction[2]], B3.suction]);
wp(7, [B3.discharge, [-208, B3.discharge[1], TEE8[2]], [TEE8[0], B3.discharge[1], TEE8[2]], [TEE8[0], TEE8[1] - rim(T8R, WATER), TEE8[2]]], { flanges: [true, false] });
wp(8, [[TEE8[0], TEE8[1], TEE8[2] + rim(T8R, WATER)], [TEE8[0], YF, 124], [-262, YF, 124], BN.b8], { flanges: [false, true] });
sp(9, [BN.b9, [-202, YT, 150], PORT.hp9]);
// escape de la turbina AP → te: recalentador (10) y sangrado al calentador cerrado
const TEE10 = [-182, YT, 165];
const T10R = 7;
ballAt("e10", TEE10, T10R, { tone: "hi", name: "e10.te" });
sp(10, [PORT.hp10, [TEE10[0], YT, 165 - rim(T10R, STEAM)]], { flanges: [true, false] });
pipe("e10", [[TEE10[0] - rim(T10R, STEAM), YT, 165], BN.b10], STEAM, { name: "e10.recalentador", cls: tint(10), flanges: [false, true] });
pipe("e10", [[TEE10[0], YT + rim(T10R, STEAM), 165], [-182, YF, 165], N.fc10], STEAM, { name: "e10.sangrado", cls: tint(10), flanges: [false, true] });
sp(11, [BN.b11, [-119, -112, 165], [-119, YT, 165], PORT.lp11]);
sp(12, [PORT.lp12, [-90, YT, 175], [-90, YF, 175], N.da12], { bend: 4.6 });

// ---------- termómetros ----------
const dialT = (n, centre, dir, hostR, owner) => dial(n, centre, dir, { hostR, owner, min: 273.15, max: 923.15 });
dialT(1, [-75, COND.y + COND.d + 9, 18], [1, 0, 0], WATER, D[1].owner);
dialT(2, [-75, B1.discharge[1], 60], TOWARD, WATER, D[2].owner);
dialT(3, [-110, YF, 44], TOWARD, WATER, D[3].owner);
dialT(4, [-110, B2.discharge[1], 70], TOWARD, WATER, D[4].owner);
dialT(5, [-236, YF, 87], TOWARD, WATER, D[5].owner);
dialT(6, [-208, 26, B3.suction[2]], [1, 0, 0], WATER, D[6].owner);
dialT(7, [-208, B3.discharge[1], 60], TOWARD, WATER, D[7].owner);
dialT(8, [-249, YF, 124], [0, 1, 0], WATER, D[8].owner);
dialT(9, [-202, YT, 132], TOWARD, STEAM, D[9].owner);
dialT(10, [-182, YT, 138], TOWARD, STEAM, D[10].owner);
dialT(11, [-119, YT, 140], TOWARD, STEAM, D[11].owner);
dialT(12, [-90, YT, 142], TOWARD, STEAM, D[12].owner);
dial(13, [NECK_X, YT, (neckTop + COND_H) / 2], TOWARD, { hostR: NECK_A, min: 273.15, max: 923.15, R: 6, stem: 4 });

// ---------- SVG, auditoría y página ----------
const LABEL_TEXT = "Central de vapor Rankine sobre una bancada: caldera con calderín, chimenea y recalentador; turbina de alta y de baja con el alternador en un mismo eje y el condensador bajo la turbina de baja; calentador cerrado, desaireador (calentador abierto) elevado y tres bombas. Trece termómetros numerados marcan las estaciones del ciclo.";
const svg = svgDe(E, { width: W, height: H, label: LABEL_TEXT });
A.auditOrExit(E.R, P, { crowd: [] });

const m0 = rankine(RANKINE.t);
const DATA = { P, agujas: X.AGUJAS, palanca: LEVER.frames, base: RANKINE };
const specJs = `const DATA = ${JSON.stringify(DATA)};\n${sinExport(readFileSync(join(HERE, "..", "comun", "agua.mjs"), "utf8"))}\n${sinExport(readFileSync(join(HERE, "modelo.mjs"), "utf8")).replace(/^import .*$/m, "")}\n${readFileSync(join(HERE, "partes.js"), "utf8")}`;
const PARTES = [["cal", "Caldera"], ["tap", "Turbina AP"], ["rec", "Recalentador"], ["tbp", "Turbina BP"], ["cond", "Condensador"], ["b1", "Bomba de condensado"], ["da", "Calentador abierto"], ["b2", "Bomba de alimentación"], ["fc", "Calentador cerrado"], ["b3", "Bomba de drenaje"], ["gen", "Alternador"], ["eje", "Eje"], ["pal", "Palanca del quemador"]].map(([id, label]) => ({ id, label }));
const ESTACIONES = Array.from({ length: 13 }, (_, i) => ({ id: `e${i + 1}`, label: `Estación ${i + 1}` }));
const html = (tema) =>
  tarjeta({
    id: "anat-rankine",
    fig: "Fig 2.3",
    titulo: "Rankine · recalentamiento + regeneración",
    pista: "Clic en una pieza · palanca ← →",
    lectura: `T₉ ${RANKINE.t} °C · η ${(m0.eta * 100).toFixed(1).replace(".", ",")} % · ${m0.power.toFixed(1).replace(".", ",")} MW`,
    svg,
    aria: "Central de vapor Rankine. Flechas: mueven la palanca del quemador (temperatura de vapor vivo). N o Intro: siguiente pieza.",
    control: { min: RANKINE.tMin, max: RANKINE.tMax, step: 5, valor: RANKINE.t, etiquetaHtml: "Palanca del quemador · T<sub>9</sub> = T<sub>11</sub>", inicialTexto: `${RANKINE.t} °C`, minTexto: `${RANKINE.tMin} °C`, maxTexto: `${RANKINE.tMax} °C` },
    partes: [...PARTES, ...ESTACIONES],
    claves: [
      { mark: "lit", label: "Palanca del quemador: fija la temperatura del vapor vivo y del recalentado" },
      { mark: "raised", label: "Tuberías teñidas de frío (azul) a caliente (naranja) según su temperatura" },
    ],
    pie: "El agua recorre un circuito cerrado: la caldera la convierte en vapor sobrecalentado, que se expande en la turbina de alta, se recalienta y termina de expandirse en la de baja; el condensador lo devuelve a líquido. Dos sangrados de turbina precalientan el agua de alimentación: uno en el calentador cerrado (su drenaje se bombea a la línea) y otro en el desaireador, que es un calentador abierto de mezcla.",
    hipotesis: `<strong>Hipótesis:</strong> ciclo ideal (ejemplo 10-6 de Çengel); bombas y turbinas isentrópicas; sin pérdidas de presión ni de calor; p<sub>caldera</sub> = 15 MPa, sangrado y recalentamiento a 4 MPa, calentador abierto a 0,5 MPa, condensador a 10 kPa; T<sub>9</sub> = T<sub>11</sub>; salidas de condensador y calentadores como líquido saturado, agua de alimentación a la T<sub>sat</sub> del sangrado; líquido incompresible (h = h<sub>f</sub> + v<sub>f</sub>·Δp); propiedades del agua según IAPWS-IF97; ṁ = ${RANKINE.mdot} kg/s de vapor vivo para las potencias.`,
    tema,
  });
escribir({ dir: HERE, nombre: "rankine", titulo: "Rankine", html, specJs });
console.log("escrito rankine.html / rankine-light.html ·", E.R.items.length, "elementos ·", E.R.solids.length, "sólidos");
