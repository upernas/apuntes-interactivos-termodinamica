// Fig 2.1 · Turbina de gas Brayton cerrada con refrigeración intermedia, recalentamiento,
// regeneración y "condensador" (refrigerador de gas). node build.mjs [--audit]
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { k, G, A, DEG, escena, svgDe, compactSvg } from "../comun/kitfig.mjs";
import { tarjeta, escribir, sinExport } from "../comun/pagina.mjs";
import { BRAYTON, brayton } from "./modelo.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 1000;
const H = 600;
const AZ = 56;
const EL = 30;

// Ejes: fila delantera = línea de ejes; fila trasera = intercambiadores; caldera detrás de las turbinas.
const YS = 34;
const ZS = 38;
const YB = -58;
const ZB = 32;
const BASE = { x: -362, y: -150, w: 428, d: 232, r: 10 };
const BASE_H = 10;
const FOOT_H = 6;
const DUCT = 3.6;
const PAD = 5.8;
const PAD_H = 6;
const FURN = { x: -68, y: -100, w: 84, d: 70, r: 3 };
const FURN_H = 128;

const P = k.fitProjection(
  [...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [-26, -65, 182], [FURN.x, FURN.y, FURN_H], [-318, -58, 96], [-240, YS, 130], [-143, YB, 130]],
  W,
  H,
  { pad: 26, azimuth: AZ, elevation: EL },
);
const E = escena(P);
const { V, at, S, Ln, Dots, record, back, put, turned, band, pipe, boxAt, padOn, boss, planeMatrix } = E;
const TOWARD = G.unit3([Math.cos(AZ * DEG), Math.sin(AZ * DEG), 0]);

// ---------- bancada ----------
back.push(`<path class="iso-halo" d="${k.haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P)}"/>`);
const FEET = [-340, -240, -140, -40, 44].flatMap((x) => [[x, BASE.y + 16], [x, BASE.y + BASE.d - 16]]).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
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
const STRIP = { x: -330, y: BASE.y + BASE.d - 14, w: 250, d: 7, r: 1 };
back.push(S(k.slabOf(STRIP, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
const TICKS = k.topTicks(STRIP.x + 4, STRIP.x + STRIP.w - 4, 5, 5, STRIP.y + 0.8, 0.6, [2, 3.6], P);
back.push(Ln(TICKS.minor, { tone: "lo" }), Ln(TICKS.major, { tone: "mid" }));
back.push(Dots([at([STRIP.x + 2, STRIP.y + 3.5, 0.6]), at([STRIP.x + STRIP.w - 2, STRIP.y + 3.5, 0.6])], { size: 0.45 }));
const LABEL = { x: -60, y: BASE.y + BASE.d - 18, w: 70, d: 11, r: 1.5 };
back.push(S(k.slabOf(LABEL, 0, 0.8, P, 3), { tone: "mid" }));
back.push(Ln(k.planOutline(k.insetPlan(LABEL, 1.6), 0.8, P), { tone: "faint" }));
back.push(k.faceTextSvg(k.topMatrix([LABEL.x + 5, LABEL.y + 7.6], 0.8, P, "x"), "BRAYTON CERRADO", { size: 4.4, tone: "lo" }));
back.push(Dots([at([LABEL.x + 2.4, LABEL.y + LABEL.d / 2, 0.8]), at([LABEL.x + LABEL.w - 2.4, LABEL.y + LABEL.d / 2, 0.8])], { size: 0.45 }));

// ---------- máquinas sobre el eje ----------
const along = (x0) => G.frameOf([x0, YS, ZS], [1, 0, 0], [0, 0, 1], [0, -1, 0]);
const radiusAt = (profile, s) => {
  for (let i = profile.length - 1; i > 0; i--) {
    const [s0, r0] = profile[i - 1];
    const [s1, r1] = profile[i];
    if (s >= s0 && s <= s1 && s1 > s0) return r0 + ((r1 - r0) * (s - s0)) / (s1 - s0);
  }
  return profile[0][1];
};
// Pedestal bajo un anillo cilíndrico de radio r entre x0 y x1.
function pedestal(part, x0, x1, r, y = YS, z = ZS) {
  const plan = { x: x0, y: y - 11, w: x1 - x0, d: 22, r: 1.2 };
  const h = z - r;
  boxAt(part, plan, 0, h, { tone: "mid" }, { bevel: 0.4, steps: 3, extra: Dots([at([x0 + 2, y - 8.5, h]), at([x0 + 2, y + 8.5, h])], { size: 0.42 }) });
}
// Pieza torneada partida en sus escalones (anillo · cuerpo · anillo) para que cada trozo se ordene solo
// y para que las piezas con cintura dibujen su contorno real.
const shifted = (F, s0) => G.frameOf(G.add3(F.o, G.mul3(F.a, s0)), F.a, F.u, F.v);
function stepped(part, F0, profile, { ribs = [], tone = "hi", name = "carcasa", extra = () => "" } = {}) {
  const pieces = [[profile[0]]];
  for (let i = 1; i < profile.length; i++) {
    if (profile[i][0] === profile[i - 1][0]) pieces.push([profile[i]]);
    else pieces[pieces.length - 1].push(profile[i]);
  }
  let host = null;
  let longest = -1;
  for (const piece of pieces) {
    const F = shifted(F0, piece[0][0]);
    const local = piece.map(([s, r]) => [s - piece[0][0], r]);
    const length = local[local.length - 1][0];
    const inside = ribs.filter((s) => s > piece[0][0] && s < piece[0][0] + length);
    const slope = (local[local.length - 1][1] - local[0][1]) / length;
    const inner = inside.map((s) => G.arcOf(F, s - piece[0][0], radiusAt(profile, s), P, { slope })).join("");
    const shape = turned(part, F, local, { tone }, { inner, extra: extra(piece[0][0], piece[0][0] + length, F), name: `${part}.${name}` });
    if (length > longest) {
      longest = length;
      host = shape;
    }
  }
  return host;
}
const casing = (part, x0, profile, options) => stepped(part, along(x0), profile, options);
// Tramo de eje entre dos máquinas, en una sola pieza: acoplamientos (r 7,5) y cojinetes como resaltes.
function shaft(part, x0, x1, features = [], r = 3.4) {
  const profile = [[0, r]];
  const marks = [];
  const dots = [];
  for (const { x, R, len, kind } of [...features].sort((a, b) => a.x - b.x)) {
    const a = x - len / 2 - x0;
    const b = x + len / 2 - x0;
    profile.push([a, r], [a, R], [b, R], [b, r]);
    marks.push([x - x0, R]);
    if (kind === "acoplamiento") dots.push([b, R]);
  }
  profile.push([x1 - x0, r]);
  const extra = (a, b, F) => dots.filter(([sb]) => Math.abs(sb - b) < 1e-6).map(([sb, R]) => Dots(G.dotsOf(F, b - a, R * 0.7, 8, P, { all: true }), { size: 0.4 })).join("");
  return stepped(part, along(x0), profile, { tone: "mid", ribs: marks.map(([sm]) => sm), extra, name: "eje" });
}
const AC = (x, R = 7.5) => ({ x, R, len: 5, kind: "acoplamiento" });
function topPort(part, host, x, profile, x0) {
  const r = radiusAt(profile, x - x0);
  return padOn(part, host, [x, YS, ZS + r], [0, 0, 1], PAD, PAD_H, { name: `${part}.tobera` });
}

// Generador
const GEN_X = -326;
const GEN = [[0, 17], [3, 21], [57, 21], [60, 17]];
const genF = along(GEN_X);
const genRibs = G.ribsOf(genF, 6, 54, 21, 40, P, { fade: [0.1, 0.55], seams: true });
turned("gen", genF, GEN, { tone: "hi" }, { extra: k.fadedSvg(genRibs, { tone: "lo" }), name: "gen.cuerpo" });
pedestal("gen", GEN_X + 6, GEN_X + 16, 21);
pedestal("gen", GEN_X + 44, GEN_X + 54, 21);
const TBOX = { x: GEN_X + 20, y: YS - 8, w: 20, d: 16, r: 1.2 };
boxAt("gen", TBOX, ZS + 21, 9, { tone: "mid" }, { bevel: 0.4, extra: Ln(k.planOutline(k.insetPlan(TBOX, 1.4), ZS + 30, P, 3), { tone: "faint" }) + Dots(k.corners(TBOX, 2.2).map(([x, y]) => at([x, y, ZS + 30])), { size: 0.4 }), name: "gen.bornes" });
shaft("eje", GEN_X + 60, -250, [AC(-258)]);

// Compresor de baja (C1) y de alta (C2)
const C1_X = -250;
const C1 = [[0, 20], [4, 20], [4, 18.5], [46, 14.5], [46, 16.5], [50, 16.5]];
const c1 = casing("c1", C1_X, C1, { ribs: [20, 30] });
pedestal("c1", C1_X, C1_X + 4, 20);
pedestal("c1", C1_X + 46, C1_X + 50, 16.5);
shaft("eje", -200, -180, [AC(-190)]);
const C2_X = -180;
const C2 = [[0, 16], [3, 16], [3, 14.5], [43, 11.5], [43, 13], [46, 13]];
const c2 = casing("c2", C2_X, C2, { ribs: [20] });
pedestal("c2", C2_X, C2_X + 3, 16);
pedestal("c2", C2_X + 43, C2_X + 46, 13);

// Eje intermedio con cojinete central
const BRG_X = -100;
shaft("eje", -134, -66, [AC(-122), { x: BRG_X, R: 9, len: 12, kind: "cojinete" }, AC(-78)]);
pedestal("eje", BRG_X - 6, BRG_X + 6, 9);

// Turbina de alta (TAP) y de baja (TBP): el flujo avanza hacia +x y la carcasa se ensancha.
const T1_X = -66;
const T1 = [[0, 12], [3, 12], [3, 11], [37, 15], [37, 16.5], [40, 16.5]];
const t1 = casing("t1", T1_X, T1, { ribs: [20] });
pedestal("t1", T1_X, T1_X + 3, 12);
pedestal("t1", T1_X + 37, T1_X + 40, 16.5);
shaft("eje", -26, -16, [AC(-21, 6.5)]);
const T2_X = -16;
const T2 = [[0, 16.5], [3, 16.5], [3, 15], [52, 20], [52, 21.5], [56, 21.5]];
const t2 = casing("t2", T2_X, T2, { ribs: [18, 34] });
pedestal("t2", T2_X, T2_X + 3, 16.5);
pedestal("t2", T2_X + 52, T2_X + 56, 21.5);

const PORT = {
  c1in: topPort("c1", c1, -240, C1, C1_X),
  c1out: topPort("c1", c1, -210, C1, C1_X),
  c2in: topPort("c2", c2, -170, C2, C2_X),
  c2out: topPort("c2", c2, -143, C2, C2_X),
  t1in: topPort("t1", t1, -57, T1, T1_X),
  t1out: topPort("t1", t1, -35, T1, T1_X),
  t2in: topPort("t2", t2, -6, T2, T2_X),
  t2out: topPort("t2", t2, 30, T2, T2_X),
};

// ---------- intercambiadores (fila trasera, eje a lo largo de x) ----------
const lay = (x0) => G.frameOf([x0, YB, ZB], [1, 0, 0], [0, 0, 1], [0, -1, 0]);
const layBack = (x0) => G.frameOf([x0, YB, ZB], [-1, 0, 0], [0, 0, 1], [0, 1, 0]);
// Fondo elíptico (cabezal abombado) analítico: r = rc·√(1 − (s/L)²).
function dish(part, F, rc, L) {
  const radius = (s) => rc * Math.sqrt(Math.max(0, 1 - (s / L) ** 2));
  const slope = (s) => (s >= L * 0.999 ? -40 : (-rc * s) / (L * L * Math.sqrt(1 - (s / L) ** 2)));
  const profile = Array.from({ length: 14 }, (_, i) => {
    const s = (L * Math.sin((i / 13) * (Math.PI / 2)));
    return [s, i === 13 ? 0 : radius(s), i && i < 13 ? 1 : 0];
  });
  return turned(part, F, profile, { tone: "hi" }, { smooth: { slope, rows: 3 }, name: `${part}.fondo` });
}
function saddle(part, x, r) {
  const plan = { x: x - 4, y: YB - r * 0.75, w: 8, d: r * 1.5, r: 1 };
  boxAt(part, plan, 0, ZB - r, { tone: "mid" }, { bevel: 0.4, name: `${part}.silleta`, extra: Dots([at([x, YB - r * 0.55, 0]), at([x, YB + r * 0.55, 0])], { size: 0.4 }) });
}
// Envolvente + canales en los extremos + fondos; devuelve las formas para las tuberías.
// channel = [izquierdo, derecho]; 0 = el fondo va directamente tras la brida.
const DISH = 4.5;
function exchanger(part, x0, x1, r, { channel = [0, 0], saddles, rings = [] } = {}) {
  const rc = r - 1.2;
  const shellF = lay(x0);
  const inner = rings.map((s) => G.arcOf(shellF, s, r, P)).join("");
  const shell = band(part, shellF, 0, x1 - x0, r, { tone: "hi" }, { inner, name: `${part}.envolvente` });
  for (const x of [x0 - 1.6, x1]) {
    const F = lay(x);
    turned(part, F, [[0, r + 1.4], [1.6, r + 1.4]], { tone: "mid" }, { extra: Dots(G.dotsOf(F, 1.6, r + 0.6, 16, P, { fade: [0.04, 0.42] }), { size: 0.38 }), name: `${part}.brida-canal` });
  }
  const [cl, cr] = channel;
  const left = cl ? band(part, lay(x0 - 1.6 - cl), 0, cl, rc, { tone: "hi" }, { name: `${part}.canal` }) : null;
  const right = cr ? band(part, lay(x1 + 1.6), 0, cr, rc, { tone: "hi" }, { name: `${part}.canal` }) : null;
  dish(part, layBack(x0 - 1.6 - cl), rc, DISH);
  dish(part, lay(x1 + 1.6 + cr), rc, DISH);
  for (const x of saddles ?? [x0 + (x1 - x0) * 0.2, x1 - (x1 - x0) * 0.2]) saddle(part, x, r);
  return { shell, left, right, top: (x) => [x, YB, ZB + r], channelTop: (x) => [x, YB, ZB + rc], ends: [x0 - 1.6 - cl - DISH, x1 + 1.6 + cr + DISH] };
}
const COND = exchanger("cond", -332, -234, 14, { channel: [8, 0], rings: [30, 62] });
const IC = exchanger("ic", -216, -164, 12, { rings: [26] });
const REG = exchanger("reg", -135.6, -97, 16, { channel: [12.4, 12.4], rings: [19] });
const NOZ = {
  cond1: padOn("cond", COND.shell, COND.top(-240), [0, 0, 1], PAD, PAD_H, { name: "cond.tobera" }),
  cond10: padOn("cond", COND.shell, COND.top(-318), [0, 0, 1], PAD, PAD_H, { name: "cond.tobera" }),
  ic2: padOn("ic", IC.shell, IC.top(-210), [0, 0, 1], PAD, PAD_H, { name: "ic.tobera" }),
  ic3: padOn("ic", IC.shell, IC.top(-170), [0, 0, 1], PAD, PAD_H, { name: "ic.tobera" }),
  reg4: padOn("reg", REG.left, REG.channelTop(-143), [0, 0, 1], PAD, PAD_H, { name: "reg.tobera" }),
  reg5: padOn("reg", REG.right, REG.channelTop(-89), [0, 0, 1], PAD, PAD_H, { name: "reg.tobera" }),
  reg9: padOn("reg", REG.shell, [-103, YB - 16, ZB], [0, -1, 0], PAD, PAD_H, { name: "reg.tobera" }),
  reg10: padOn("reg", REG.shell, [-129, YB - 16, ZB], [0, -1, 0], PAD, PAD_H, { name: "reg.tobera" }),
};

// ---------- caldera: cuerpo, paneles de colectores, quemador, chimenea ----------
const FRONT_Y = FURN.y + FURN.d;
boxAt("cal", FURN, 0, FURN_H, { tone: "hi" }, { bevel: 0.8, steps: 4, inner: Ln(k.sideSeam(FURN, 64, P, 4), { tone: "faint" }), name: "cal.hogar" });
const ROOF = k.insetPlan(FURN, 6);
boxAt("cal", ROOF, FURN_H, 4, { tone: "mid" }, { bevel: 0.4, name: "cal.techo" });
const STACK_AT = [-26, FURN.y + FURN.d / 2];
stepped("cal", G.frameOf([STACK_AT[0], STACK_AT[1], FURN_H + 4], [0, 0, 1], [1, 0, 0], [0, 1, 0]), [[0, 11], [3, 11], [3, 8], [46, 8], [46, 9.4], [50, 9.4]], { ribs: [16, 31], name: "chimenea" });
// paneles colectores en la cara frontal
const PANEL_CAL = { x: -66, y: FRONT_Y, w: 20, d: 3, r: 0.8 };
const PANEL_REC = { x: -44, y: FRONT_Y, w: 50, d: 3, r: 0.8 };
const panelScrews = (plan, z0, z1) => Dots([[plan.x + 2, z0 + 2], [plan.x + plan.w - 2, z0 + 2], [plan.x + 2, z1 - 2], [plan.x + plan.w - 2, z1 - 2]].map(([x, z]) => at([x, plan.y + plan.d, z])), { size: 0.4 });
boxAt("cal", PANEL_CAL, 70, 46, { tone: "mid" }, { bevel: 0.3, name: "cal.colector", extra: panelScrews(PANEL_CAL, 70, 116) });
boxAt("rec", PANEL_REC, 70, 46, { tone: "mid" }, { bevel: 0.3, name: "rec.colector", extra: panelScrews(PANEL_REC, 70, 116) });
const PY = FRONT_Y + 3;
const FN = {
  f6: boss("cal", [-57, PY, 110], [0, 1, 0], PAD, 4, { name: "cal.tobera" }),
  f7: boss("rec", [-35, PY, 82], [0, 1, 0], PAD, 4, { name: "rec.tobera" }),
  f8: boss("rec", [-6, PY, 104], [0, 1, 0], PAD, 4, { name: "rec.tobera" }),
  f5: boss("cal", [FURN.x, YB, 80], [-1, 0, 0], PAD, 4, { name: "cal.tobera" }),
};
// puerta de registro y mirilla
const DOOR = { x: -62, y: FRONT_Y, w: 26, d: 2, r: 0.8 };
boxAt("cal", DOOR, 10, 36, { tone: "mid" }, { bevel: 0.3, name: "cal.puerta", extra: Dots([at([-59.5, FRONT_Y + 2, 14]), at([-59.5, FRONT_Y + 2, 42]), at([-38.5, FRONT_Y + 2, 14]), at([-38.5, FRONT_Y + 2, 42])], { size: 0.4 }) });
const SIGHT = G.frameAlong([-18, FRONT_Y, 34], [0, 1, 0]);
put("cal", [-18, FRONT_Y + 2, 34], S(G.disc(0, 2.4, 6, SIGHT, P), { tone: "mid" }) + `<path class="anat-glow" data-brillo d="${G.circleOf(SIGHT, 2.4, 4, P, 28)}"/>` + Ln(G.circleOf(SIGHT, 2.4, 4, P, 28), { tone: "lo" }) + Dots(G.dotsOf(SIGHT, 2.4, 5, 6, P, { all: true }), { size: 0.36 }), { name: "cal.mirilla", shapes: [record(A.disc(SIGHT, 0, 2.4, 6, { name: "cal.mirilla" }))] });

// Quemador en la cara derecha, línea de combustible con válvula y palanca.
const RIGHT_X = FURN.x + FURN.w;
const BURN_Z = 30;
const BURN_Y = FURN.y + FURN.d / 2;
const burnF = G.frameOf([RIGHT_X, BURN_Y, BURN_Z], [1, 0, 0], [0, 0, 1], [0, -1, 0]);
stepped("pal", burnF, [[0, 10], [2, 10], [2, 8.4], [12, 8.4], [12, 5], [16, 5]], { ribs: [7], name: "quemador" });
const FUEL = 1.5;
const VALVE_X = 40;
const fuelStart = [RIGHT_X + 16, BURN_Y, BURN_Z];
const FUEL_FLOOR = { x: 52, y: BURN_Y - 6, w: 12, d: 12, r: 1.2 };
boxAt("pal", FUEL_FLOOR, 0, 4, { tone: "mid" }, { bevel: 0.3, name: "pal.toma", extra: Dots(k.corners(FUEL_FLOOR, 2).map(([x, y]) => at([x, y, 4])), { size: 0.4 }) });
const fuelLine = pipe("pal", [fuelStart, [58, BURN_Y, BURN_Z], [58, BURN_Y, 4]], FUEL, { flangeR: 2, name: "pal.linea", gaps: [[VALVE_X - 4.4 - fuelStart[0], VALVE_X + 4.4 - fuelStart[0]]] });
// Cuerpo de válvula (abultado) sobre el tramo recto.
const VF = G.frameOf([VALVE_X, BURN_Y, BURN_Z], [1, 0, 0], [0, 0, 1], [0, -1, 0]);
const vr = FUEL;
const crown = vr * 2.1;
const bulge = (x) => vr * 1.5 + (crown - vr * 1.5) * Math.sqrt(Math.max(0, 1 - (x / (vr * 2)) ** 2));
const bulgeSlope = (x) => {
  if (Math.abs(x) >= vr * 2 - 1e-9) return 0;
  const t = Math.max(-0.995, Math.min(0.995, x / (vr * 2)));
  return (-(crown - vr * 1.5) * t) / (vr * 2 * Math.sqrt(1 - t * t));
};
const VALVE = [[-4.4, 0], [-4.4, vr * 1.5], ...Array.from({ length: 17 }, (_, i) => { const x = vr * 2 * Math.sin(((i - 8) / 8) * (Math.PI / 2)); return [x, bulge(x), i && i < 16 ? 1 : 0]; }), [4.4, vr * 1.5], [4.4, 0]];
put("pal", [VALVE_X, BURN_Y, BURN_Z], S(G.lathe(VALVE, VF, P, { steps: 36, smooth: { slope: bulgeSlope, rows: 3 } }), { tone: "hi" }), { name: "pal.valvula", shapes: [record(A.body(VF, VALVE, { name: "pal.valvula", owner: fuelLine.owner }))] });
const NECK = G.frameOf([VALVE_X, BURN_Y, BURN_Z], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
const NECK_TOP = crown - 0.2 + 3.2;
put("pal", [VALVE_X, BURN_Y, BURN_Z + crown + 1.5], S(G.disc(crown - 0.2, NECK_TOP, 1.2, NECK, P), { tone: "mid" }), { bias: 0.2, name: "pal.vastago", shapes: [record(A.disc(NECK, crown - 0.2, NECK_TOP, 1.2, { name: "pal.vastago", owner: fuelLine.owner }))] });
// Palanca: barra plana que gira en el plano horizontal sobre el vástago (fotogramas precalculados).
const LEVER_Z = BURN_Z + NECK_TOP;
const LEVER_LEN = 15;
const leverRing = (deg) => {
  const a = deg * DEG;
  const dir = [Math.sin(a), Math.cos(a)];
  const side = [-dir[1], dir[0]];
  // Contorno de estadio: semicírculo trasero (cubo) + semicírculo en la punta.
  const ring = [];
  const arc = ([d, hw], from) => {
    for (let i = 0; i <= 8; i++) {
      const t = from + (i / 8) * Math.PI;
      ring.push([VALVE_X + dir[0] * (d + Math.cos(t) * hw) + side[0] * Math.sin(t) * hw, BURN_Y + dir[1] * (d + Math.cos(t) * hw) + side[1] * Math.sin(t) * hw]);
    }
  };
  arc([-1.8, 1.6], Math.PI / 2);
  arc([LEVER_LEN, 1.3], -Math.PI / 2);
  return ring;
};
const leverDeg = (t6) => 18 + ((t6 - BRAYTON.tMin) / (BRAYTON.tMax - BRAYTON.tMin)) * 72;
const leverSvg = (deg) => {
  const ring = leverRing(deg);
  const a = deg * DEG;
  const tip = [VALVE_X + Math.sin(a) * LEVER_LEN, BURN_Y + Math.cos(a) * LEVER_LEN];
  return S(k.extrude(ring, LEVER_Z, 1.2, P), { tone: "hi", lit: true }) + S(k.cylinder(tip[0], tip[1], 1.6, LEVER_Z + 1.2, 2.4, P, 18), { tone: "hi", lit: true }) + Dots([at([VALVE_X, BURN_Y, LEVER_Z + 1.2])], { size: 0.5, tone: "hi" });
};
const LEVER_FRAMES = Array.from({ length: 25 }, (_, i) => compactSvg(leverSvg(18 + (72 * i) / 24)));
const restDeg = leverDeg(BRAYTON.t6);
put("pal", [VALVE_X, BURN_Y, LEVER_Z], `<g data-palanca>${leverSvg(restDeg)}</g>`, { bias: 0.4, name: "pal.palanca", shapes: [record(A.extruded(leverRing(restDeg), LEVER_Z, 1.2, { name: "pal.palanca", owner: fuelLine.owner }))] });

// ---------- conductos del gas de trabajo (estaciones 1–10) ----------
const tint = (n) => `data-temp="${n}"`;
const D = {};
D[1] = pipe("e1", [NOZ.cond1, [-240, YB, 122], [-240, YS, 122], PORT.c1in], DUCT, { name: "e1.conducto", cls: tint(1) });
D[2] = pipe("e2", [PORT.c1out, [-210, YS, 126], [-210, YB, 126], NOZ.ic2], DUCT, { name: "e2.conducto", cls: tint(2) });
D[3] = pipe("e3", [NOZ.ic3, [-170, YB, 122], [-170, YS, 122], PORT.c2in], DUCT, { name: "e3.conducto", cls: tint(3) });
D[4] = pipe("e4", [PORT.c2out, [-143, YS, 112], [-143, YB, 112], NOZ.reg4], DUCT, { name: "e4.conducto", cls: tint(4) });
D[5] = pipe("e5", [NOZ.reg5, [-89, YB, 80], FN.f5], DUCT, { name: "e5.conducto", cls: tint(5) });
D[6] = pipe("e6", [FN.f6, [-57, YS, 110], PORT.t1in], DUCT, { name: "e6.conducto", cls: tint(6) });
D[7] = pipe("e7", [PORT.t1out, [-35, YS, 82], FN.f7], DUCT, { name: "e7.conducto", cls: tint(7) });
D[8] = pipe("e8", [FN.f8, [-6, YS, 104], PORT.t2in], DUCT, { name: "e8.conducto", cls: tint(8) });
D[9] = pipe("e9", [PORT.t2out, [30, YS, 96], [30, -122, 96], [30, -122, ZB], [-103, -122, ZB], NOZ.reg9], DUCT, { name: "e9.conducto", cls: tint(9) });
D[10] = pipe("e10", [NOZ.reg10, [-129, -122, ZB], [-318, -122, ZB], [-318, -122, 80], [-318, YB, 80], NOZ.cond10], DUCT, { name: "e10.conducto", cls: tint(10) });

// ---------- termómetros de estación ----------
const AGUJAS = [];
function dial(n, centre, stemDir) {
  const part = `e${n}`;
  const d = G.unit3(stemDir);
  const a = 0.9;
  const s0 = Math.sqrt(DUCT * DUCT - a * a);
  const stemLen = 5.4;
  const FS = G.frameAlong(centre, d);
  put(part, G.add3(centre, G.mul3(d, s0 + stemLen / 2)), S(G.disc(s0, s0 + stemLen, a, FS, P), { tone: "mid" }), { name: `${part}.vaina`, shapes: [record(A.disc(FS, s0, s0 + stemLen, a, { name: `${part}.vaina`, owner: D[n].owner }))] });
  const up0 = [0, 0, 1];
  const u = G.unit3(G.sub3(up0, G.mul3(d, G.dot3(up0, d))));
  const v = G.cross3(d, u);
  const o = G.add3(centre, G.mul3(d, s0 + stemLen));
  const F = G.frameOf(o, d, u, v);
  const R = 8;
  const T = 2.6;
  const ticks = G.spokesOf(F, T, R - 2.2, R - 0.9, 15, P, { from: -135 * DEG, to: (135 + 270 / 14) * DEG });
  const right = v; // la proyección del kit es especular: d × u queda a la derecha en pantalla
  const down = G.mul3(u, -1);
  const label = k.faceTextSvg(planeMatrix(G.add3(G.add3(o, G.mul3(d, T)), G.mul3(down, 6)), right, down), String(n), { size: 5.2, tone: "hi", anchor: "middle" });
  const face = S(G.disc(0, T, R, F, P), { tone: "hi", inner: "" }) + Ln(G.circleOf(F, T, R - 0.9, P, 48), { tone: "lo" }) + Ln(ticks, { tone: "lo" }) + label + `<path class="iso-line anat-needle" data-tone="lit" data-free="start" data-aguja="t${n}" d=""/>` + Dots([at(G.pointOf(F, T, 0, 0))], { size: 0.6, tone: "hi" });
  put(part, G.add3(o, G.mul3(d, T / 2)), face, { bias: 0.3, name: `${part}.esfera`, shapes: [record(A.disc(F, 0, T, R, { name: `${part}.esfera`, owner: D[n].owner }))] });
  AGUJAS.push({ id: `t${n}`, n, F: { o: F.o, a: F.a, u: F.u, v: F.v }, s: T + 0.05, r: R - 1.4, tail: 1.6, a0: -135 * DEG, a1: 135 * DEG, min: 200, max: 1600 });
}
dial(1, [-240, YS, 90], TOWARD);
dial(2, [-210, YS, 92], TOWARD);
dial(3, [-170, YS, 90], TOWARD);
dial(4, [-143, YS, 88], TOWARD);
dial(5, [-89, YB, 58], [-0.25, 0.97, 0]);
dial(6, [-57, YS, 86], TOWARD);
dial(7, [-35, YS, 70], TOWARD);
dial(8, [-6, YS, 84], TOWARD);
dial(9, [30, YS, 78], TOWARD);
dial(10, [-318, YB, 64], TOWARD);

// ---------- SVG, auditoría y página ----------
const LABEL_TEXT = "Planta de turbina de gas Brayton de circuito cerrado sobre una bancada: alternador, compresor de baja y de alta, turbina de alta y de baja en un mismo eje; detrás, condensador (refrigerador de gas), refrigerador intermedio, regenerador y la caldera con calentador y recalentador. Diez termómetros numerados marcan las estaciones del ciclo.";
const svg = svgDe(E, { width: W, height: H, label: LABEL_TEXT });
A.auditOrExit(E.R, P, { crowd: [] });

const m0 = brayton(BRAYTON.t6);
const fmtK = (t) => `${Math.round(t)} K`;
const lectura0 = `T₆ ${Math.round(BRAYTON.t6)} K · η ${(m0.eta * 100).toFixed(1).replace(".", ",")} % · ${m0.power.toFixed(2).replace(".", ",")} MW`;
const DATA = { P, agujas: AGUJAS, palanca: LEVER_FRAMES, base: BRAYTON };
const specJs = `const DATA = ${JSON.stringify(DATA)};\n${sinExport(readFileSync(join(HERE, "modelo.mjs"), "utf8"))}\n${readFileSync(join(HERE, "partes.js"), "utf8")}`;
const PARTES = [
  ["c1", "Compresor BP"], ["ic", "Refrigerador intermedio"], ["c2", "Compresor AP"], ["reg", "Regenerador"], ["cal", "Caldera · calentador"], ["t1", "Turbina AP"], ["rec", "Recalentador"], ["t2", "Turbina BP"], ["cond", "Condensador"], ["gen", "Alternador"], ["eje", "Eje"], ["pal", "Palanca de combustible"],
].map(([id, label]) => ({ id, label }));
const ESTACIONES = Array.from({ length: 10 }, (_, i) => ({ id: `e${i + 1}`, label: `Estación ${i + 1}` }));
const html = (tema) =>
  tarjeta({
    id: "anat-brayton",
    fig: "Fig 2.1",
    titulo: "Brayton cerrado · IC + RH + regen.",
    pista: "Clic en una pieza · palanca ← →",
    lectura: lectura0,
    svg,
    aria: "Planta Brayton cerrada. Flechas: mueven la palanca de combustible (T₆). N o Intro: siguiente pieza.",
    control: { min: BRAYTON.tMin, max: BRAYTON.tMax, step: 10, valor: BRAYTON.t6, etiquetaHtml: "Palanca de combustible · T<sub>6</sub> = T<sub>8</sub>", inicialTexto: fmtK(BRAYTON.t6), minTexto: `${BRAYTON.tMin} K`, maxTexto: `${BRAYTON.tMax} K` },
    partes: [...PARTES, ...ESTACIONES],
    claves: [
      { mark: "lit", label: "Palanca de la válvula de combustible: fija la temperatura de entrada a turbinas" },
      { mark: "raised", label: "Conductos teñidos de frío (azul) a caliente (naranja) según su temperatura" },
    ],
    pie: "El mismo gas recorre un circuito cerrado: se comprime en dos etapas con refrigeración intermedia, se precalienta en el regenerador con el escape de la turbina, recibe calor en la caldera, se expande en dos turbinas con recalentamiento intermedio y cede el calor restante en el condensador antes de volver al compresor. Cada termómetro marca la temperatura de su estación.",
    hipotesis: `<strong>Hipótesis:</strong> ciclo ideal de aire estándar frío; aire gas ideal con γ = 1,4 y c<sub>p</sub> = 1,005 kJ/kg·K constantes; compresiones y expansiones isentrópicas; sin pérdidas de presión; regenerador ideal (ε = 1); r<sub>p</sub> = 8 repartida por igual (√8 por etapa); T<sub>1</sub> = T<sub>3</sub> = 300 K, p<sub>1</sub> = 100 kPa; T<sub>6</sub> = T<sub>8</sub>; ṁ = 10 kg/s para las potencias; energías cinética y potencial despreciables.`,
    tema,
  });
escribir({ dir: HERE, nombre: "brayton", titulo: "Brayton cerrado", html, specJs });
console.log("escrito brayton.html / brayton-light.html ·", E.R.items.length, "elementos");
