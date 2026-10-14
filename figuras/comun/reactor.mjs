// Turborreactor de un eje en su cuna, con la mitad cercana de la carcasa cortada. Lo usan las figuras del
// turborreactor (tobera fija) y del turborreactor con postcombustión (postquemador y tobera de geometría variable).
// Toma el núcleo del turbofán (compresor, cámara anular y turbina) sin fan ni conducto de derivación.
import { k, G, A, DEG, compactSvg } from "./kitfig.mjs";

export function construirReactor(E, X, { P, postcombustion = false, label, palanca }) {
  const { at, S, Ln, Dots, record, back, put, turned, band, boxAt, padOn } = E;
  const { shellCut, dial } = X;
  const X_IN = 150;
  const Z_AX = 64;
  const BASE = postcombustion ? { x: -206, y: -80, w: 390, d: 196, r: 10 } : { x: -126, y: -80, w: 310, d: 196, r: 10 };
  const BASE_H = 10;
  const FOOT_H = 6;
  const ENG = G.frameOf([X_IN, 0, Z_AX], [-1, 0, 0], [0, 0, 1], [0, 1, 0]);
  const VV = G.viewOf(P);
  const TH_VIEW = Math.atan2(G.dot3(VV, ENG.v), G.dot3(VV, ENG.u));
  const TH0 = TH_VIEW + Math.PI / 2;
  const TH1 = TH_VIEW + (3 * Math.PI) / 2;
  const xAt = (s) => X_IN - s;
  const atS = (s) => G.frameOf(G.add3(ENG.o, G.mul3(ENG.a, s)), ENG.a, ENG.u, ENG.v);
  const lin = (pts) => (s) => {
    if (s <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (s <= pts[i][0]) return pts[i - 1][1] + ((pts[i][1] - pts[i - 1][1]) * (s - pts[i - 1][0])) / (pts[i][0] - pts[i - 1][0]);
    return pts[pts.length - 1][1];
  };

  // ---------- bancada ----------
  back.push(`<path class="iso-halo" d="${k.haloOf(BASE, -BASE_H - FOOT_H, BASE_H, P)}"/>`);
  const feetX = postcombustion ? [-186, -60, 60, 164] : [-106, 30, 164];
  const FEET = feetX.flatMap((x) => [[x, BASE.y + 16], [x, BASE.y + BASE.d - 16]]).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
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
  const LABEL = { x: 60, y: BASE.y + BASE.d - 18, w: 76, d: 11, r: 1.5 };
  back.push(S(k.slabOf(LABEL, 0, 0.8, P, 3), { tone: "mid" }));
  back.push(Ln(k.planOutline(k.insetPlan(LABEL, 1.6), 0.8, P), { tone: "faint" }));
  back.push(k.faceTextSvg(k.topMatrix([LABEL.x + 5, LABEL.y + 7.6], 0.8, P, "x"), label, { size: 4.4, tone: "lo" }));
  back.push(Dots([at([LABEL.x + 2.4, LABEL.y + LABEL.d / 2, 0.8]), at([LABEL.x + LABEL.w - 2.4, LABEL.y + LABEL.d / 2, 0.8])], { size: 0.45 }));

  // ---------- carcasa: toma (difusor), núcleo y tobera o postquemador ----------
  const coreOut = lin([[0, 30], [5, 33], [12, 34.5], [70, 35], [176, 35], [200, 33], [226, 28.5], [240, 26]]);
  const coreIn = (s) => coreOut(s) - 2.5;
  shellCut("toma", ENG, [0, 2, 5, 9, 14, 20, 28, 36, 44, 52], coreIn, coreOut, TH0, TH1, { name: "difusor" });
  const car = shellCut("car", ENG, [52, 58, 64, 70, 90, 110, 130, 150, 176, 188, 200, 213, 226], coreIn, coreOut, TH0, TH1, { name: "carcasa" });
  const pcOut = lin([[226, 28.5], [236, 29.5], [304, 29.5]]);
  const pcIn = (s) => pcOut(s) - 2;
  if (!postcombustion) shellCut("tob", ENG, [226, 233, 240], coreIn, coreOut, TH0, TH1, { name: "tobera" });
  else {
    shellCut("pc", ENG, [226, 232, 238, 246, 256, 266, 276, 286, 296, 304], pcIn, pcOut, TH0, TH1, { name: "camisa" });
    // tobera convergente-divergente de geometría variable (pétalos)
    const nozOut = lin([[304, 29.5], [314, 24.5], [324, 27]]);
    const nozIn = (s) => nozOut(s) - 1.6;
    shellCut("tob", ENG, [304, 307, 310, 314, 318, 321, 324], nozIn, nozOut, TH0, TH1, { name: "petalos" });
    // actuadores de los pétalos sobre la camisa
    for (const deg of [200, 255, 310]) {
      const a = deg * DEG;
      const Fr = G.frameOf(G.pointOf(ENG, 288, pcOut(288) + 0.95, a), ENG.a, ENG.u, ENG.v);
      put("tob", G.pointOf(ENG, 296, pcOut(288) + 0.95, a), S(G.disc(0, 16, 0.9, Fr, P), { tone: "mid" }), { name: "tob.actuador", shapes: [record(A.disc(Fr, 0, 16, 0.9, { name: "tob.actuador" }))] });
    }
  }

  // ---------- rotor: ojiva, compresor, eje, cámara y turbina (núcleo del turbofán) ----------
  X.dish("comp", G.frameOf(G.add3(ENG.o, G.mul3(ENG.a, 39)), G.mul3(ENG.a, -1), ENG.u, G.mul3(ENG.v, -1)), 17, 22);
  const drumR = lin([[39, 17], [80, 22], [140, 25]]);
  turned("comp", atS(39), [[0, 17], [41, 22], [101, 25]], { tone: "mid" }, { name: "comp.tambor" });
  const stage = (part, s, rHub, outer = coreIn) => shellCut(part, ENG, [s, s + 2], () => rHub, () => outer(s + 1) - 1, TH0, TH1, { name: "escalon", steps: 24 });
  for (const s of [58, 66, 74, 86, 94, 102, 110, 118, 126, 134]) stage("comp", s, drumR(s + 1) + 0.05);
  band("eje", atS(140), 0, 40, 12, { tone: "mid" }, { name: "eje.arbol" });
  shellCut("cam", ENG, [148, 152, 157, 161, 165, 170, 174], (q) => 17 - 1.2 * Math.sin((Math.PI * (q - 148)) / 26), (q) => 27 + 1.8 * Math.sin((Math.PI * (q - 148)) / 26), TH0, TH1, { name: "tubo-llama" });
  for (const a of [170, 215, 260, 305].map((deg) => deg * DEG).filter((a) => a > TH0 && a < TH1)) {
    const Fr = G.frameAlong(G.add3(ENG.o, G.mul3(ENG.a, 152)), G.radialOf(ENG, a));
    const r0 = 27 + 1.8 * Math.sin((Math.PI * 4) / 26);
    put("cam", G.pointOf(ENG, 152, 30, a), S(G.disc(r0, coreIn(152), 1.4, Fr, P), { tone: "mid" }), { name: "cam.inyector", shapes: [record(A.disc(Fr, r0, coreIn(152), 1.4, { name: "cam.inyector" }))] });
  }
  turned("turb", atS(180), [[0, 20], [16, 20], [56, 18]], { tone: "mid" }, { name: "turb.tambor" });
  for (const s of [183, 191]) stage("turb", s, 20.05);
  for (const s of [200, 208, 216, 224, 232]) stage("turb", s, 20 - (2 * (s + 1 - 196)) / 40 + 0.05, (q) => (q < 226 ? coreIn(q) : postcombustion ? pcIn(q) : coreIn(q)));
  const stator = (part, s0) => shellCut(part, ENG, [s0, s0 + 1.5], (q) => coreIn(q) - 5, coreIn, TH0, TH1, { name: "estator", steps: 24, tone: "mid" });
  for (const q of [62, 70, 78, 90, 98, 106, 114, 122, 130]) stator("comp", q);
  for (const q of [187, 195, 204, 212, 220]) stator("turb", q);
  const strut = (part, s, r0, r1, a, rad = 1.6) => {
    const Fr = G.frameAlong(G.add3(ENG.o, G.mul3(ENG.a, s)), G.radialOf(ENG, a));
    put(part, G.pointOf(ENG, s, (r0 + r1) / 2, a), S(G.disc(r0, r1, rad, Fr, P), { tone: "mid" }), { name: `${part}.brazo`, shapes: [record(A.disc(Fr, r0, r1, rad, { name: `${part}.brazo` }))] });
  };
  // álabes guía de entrada y brazos del núcleo
  for (const deg of [195, 240, 285]) strut("toma", 47, drumR(47) + 0.1, coreIn(47), deg * DEG, 1.2);
  for (const deg of [190, 280]) strut("car", 82, drumR(82) + 0.1, coreIn(82), deg * DEG, 1.4);
  // cono de cola y bastidor trasero
  const CONE_L = postcombustion ? 18 : 49;
  X.dish(postcombustion ? "pc" : "tob", atS(236), 17, CONE_L);
  for (const deg of [190, 280]) strut(postcombustion ? "pc" : "tob", 237.5, 17 * Math.sqrt(1 - (1.5 / CONE_L) ** 2) - 0.1, (postcombustion ? pcIn : coreIn)(237.5), deg * DEG, 1.2);

  // ---------- postquemador: inyectores anulares, estabilizadores de llama y llama ----------
  let llama = "";
  if (postcombustion) {
    // barras de inyección radiales justo detrás del cono
    for (const deg of [185, 230, 275, 320].filter((d) => d * DEG > TH0 && d * DEG < TH1)) strut("pc", 258, 9, pcIn(258), deg * DEG, 0.8);
    // dos estabilizadores de llama en anillo (en V) sujetos por brazos
    for (const [r0, r1] of [[11, 13], [19, 21]]) shellCut("pc", ENG, [266, 269], () => r0, () => r1, TH0, TH1, { name: "estabilizador", steps: 24, tone: "mid" });
    for (const deg of [205, 295]) {
      strut("pc", 267.5, 13.05, 18.95, deg * DEG, 0.7);
      strut("pc", 267.5, 21.05, pcIn(267.5), deg * DEG, 0.7);
    }
    // llama: silueta en el plano de corte (simétrica respecto al eje), envolvente tenue y núcleo más vivo
    const flameR = (s) => 19.5 * Math.sin((Math.PI / 2) * Math.min(1, (s - 268) / 12)) * (1 - 0.45 * Math.max(0, (s - 284) / 46));
    const silueta = (scale, s1) => {
      const up = [];
      const down = [];
      for (let s = 268; s <= s1; s += 1.5) {
        const r = Math.max(0.4, flameR(s) * scale * (s > s1 - 10 ? (s1 - s) / 10 : 1));
        up.push(at(G.pointOf(ENG, s, r, TH0)));
        down.push(at(G.pointOf(ENG, s, r, TH1)));
      }
      return k.pathOf([...up, ...down.reverse()], true);
    };
    llama = `<g data-brillo class="anat-llama" aria-hidden="true"><path class="anat-glow" opacity=".22" d="${silueta(1, 340)}"/><path class="anat-glow" opacity=".38" d="${silueta(0.62, 326)}"/><path class="anat-llama-nucleo" opacity=".55" d="${silueta(0.28, 312)}"/></g>`;
  }

  // ---------- cuna ----------
  for (const s of [70, 168]) {
    const x = xAt(s);
    for (const y of [-14, 14]) {
      const zs = Z_AX - Math.sqrt(coreOut(s) ** 2 - y * y);
      padOn("car", car, [x, y, zs], [0, 0, -1], 4, zs - 4, { name: "car.pata", tone: "mid" });
    }
    const plate = { x: x - 8, y: -22, w: 16, d: 44, r: 1.5 };
    boxAt("cuna", plate, 0, 4, { tone: "mid" }, { name: "cuna.placa", extra: Dots(k.corners(plate, 2.4).map(([px, py]) => at([px, py, 4])), { size: 0.4 }) });
  }
  for (const y of [-20, 16]) boxAt("cuna", { x: xAt(168) + 8, y, w: xAt(70) - xAt(168) - 16, d: 4, r: 0.6 }, 0, 3, { tone: "mid" }, { name: "cuna.larguero", bevel: 0.2 });

  // ---------- pupitre con palanca e indicador de empuje ----------
  const DESK = { x: 20, y: 74, w: 44, d: 26, r: 2 };
  const DESK_H = 30;
  boxAt("pal", DESK, 0, DESK_H, { tone: "mid" }, { bevel: 0.6, name: "pal.pupitre", inner: Ln(k.sideSeam(DESK, 8, P, 3), { tone: "faint" }) });
  const PIV = [44, 88, DESK_H + 9];
  for (const y of [82, 92]) boxAt("pal", { x: 34, y: y - (y > 87 ? 0 : 2), w: 20, d: 2, r: 0.5 }, DESK_H, 14, { tone: "mid" }, { name: "pal.sector", bevel: 0.2 });
  const AXLE = G.frameAlong([PIV[0], 84, PIV[2]], [0, 1, 0]);
  put("pal", PIV, S(G.disc(0, 8, 2, AXLE, P), { tone: "mid" }), { name: "pal.eje", shapes: [record(A.disc(AXLE, 0, 8, 2, { name: "pal.eje" }))] });
  const leverDir = (phi) => [Math.sin(phi * DEG), 0, Math.cos(phi * DEG)];
  const leverPhi = (v) => -35 + (70 * (v - palanca.min)) / (palanca.max - palanca.min);
  const ROD = 22 - Math.sqrt(2.8 ** 2 - 1.1 ** 2);
  const leverSvg = (phi) => S(G.disc(2, ROD, 1.1, G.frameAlong(PIV, leverDir(phi)), P), { tone: "hi", lit: true }) + S(G.sphereOf(G.add3(PIV, G.mul3(leverDir(phi), 22)), 2.8, P, { steps: 32 }), { tone: "hi", lit: true });
  const LEVER = Array.from({ length: 25 }, (_, i) => compactSvg(leverSvg(-35 + (70 * i) / 24)));
  const phi0 = leverPhi(palanca.valor);
  put("pal", G.add3(PIV, G.mul3(leverDir(phi0), 12)), `<g data-palanca>${leverSvg(phi0)}</g>`, { bias: 0.3, name: "pal.palanca", shapes: [record(A.disc(G.frameAlong(PIV, leverDir(phi0)), 2, ROD, 1.1, { name: "pal.palanca" })), record(A.ball(G.add3(PIV, G.mul3(leverDir(phi0), 22)), 2.8, { name: "pal.pomo" }))] });
  for (const [x, y] of [[60, 81], [60, 94]]) E.cylAt("pal", x, y, 2.2, DESK_H, 3, { tone: "hi" }, { name: "pal.mando", steps: 24, extra: Ln(k.lineOnTop([x, y], [x + 1.8, y], DESK_H + 3, P), { tone: "lo", free: "end" }) });
  E.cylAt("pal", 24, 95, 1.6, DESK_H, 1.6, { tone: "mid" }, { name: "pal.piloto", steps: 20, extra: `<path class="anat-glow" data-brillo d="${k.ring(24, 95, 1.1, DESK_H + 1.6, P, 20)}"/>` });
  const GAUGE = [26.5, 81];
  const GF = X.upZ([GAUGE[0], GAUGE[1], DESK_H]);
  put("pal", [GAUGE[0], GAUGE[1], DESK_H + 1], S(k.cylinder(GAUGE[0], GAUGE[1], 5.5, DESK_H, 2, P, 40), { tone: "hi" }) + Ln(k.ring(GAUGE[0], GAUGE[1], 4.8, DESK_H + 2, P, 48), { tone: "lo" }) + Ln(k.radialTicks(GAUGE[0], GAUGE[1], 4.8, 12, 3, DESK_H + 2, [0.9, 1.6], P, -0.75 * Math.PI, 1.5 * Math.PI).minor, { tone: "lo" }) + `<path class="iso-line anat-needle" data-tone="lit" data-free="start" data-aguja="empuje" d=""/>`, { name: "pal.indicador", shapes: [record(A.cylinder(GAUGE[0], GAUGE[1], 5.5, DESK_H, 2, { name: "pal.indicador" }))] });

  // ---------- estaciones: sondas sobre la cara de corte ----------
  const N0 = G.mul3(G.tangentOf(ENG, TH0), -1);
  const N1 = G.tangentOf(ENG, TH1);
  const probe = (n, s, inner, outer, side = 0) => dial(n, G.pointOf(ENG, s, (inner(s) + outer(s)) / 2, side ? TH1 : TH0), side ? N1 : N0, { hostR: 0.9, min: 200, max: 2100, R: 6, stem: 7 });
  probe(1, 46, coreIn, coreOut);
  probe(2, 141, coreIn, coreOut);
  probe(3, 177, coreIn, coreOut);
  probe(4, 222, coreIn, coreOut, 1);
  if (postcombustion) {
    probe(5, 300, pcIn, pcOut);
    probe(6, 322, (q) => lin([[304, 29.5], [314, 24.5], [324, 27]])(q) - 1.6, lin([[304, 29.5], [314, 24.5], [324, 27]]), 1);
  } else probe(5, 237, coreIn, coreOut);
  const AGUJAS = [...X.AGUJAS, { id: "empuje", n: "F", F: { o: GF.o, a: GF.a, u: [0, -1, 0], v: [1, 0, 0] }, s: 2.05, r: 4.3, tail: 1, a0: -0.75 * Math.PI, a1: 0.75 * Math.PI, min: 0, max: postcombustion ? 70 : 60 }];

  // ---------- líneas de corriente: aire de entrada (azul) y chorro caliente (naranja) ----------
  const stream = (part, flujo, fn, s0, s1, a, tone) => {
    const pts3 = [];
    for (let s = s0; s <= s1 + 1e-6; s += 2) pts3.push(G.pointOf(ENG, s, fn(s), a));
    const svg = k.fadeLineSvg(pts3.map(at), { fade: [16, 22], tone }).replace(/<path class="iso-line/g, '<path data-flow class="iso-line');
    put(part, pts3[Math.floor(pts3.length / 2)], `<g data-flujo="${flujo}">${svg}</g>`, { name: `${part}.linea`, shapes: [A.tube(pts3, 0.4, { name: `${part}.linea` })] });
  };
  for (const deg of [168, 300]) stream("aire", "frio", (s) => 24 + 0.02 * s, -44, 30, deg * DEG, "blue");
  const END = postcombustion ? 326 : 242;
  for (const deg of [205, 270]) stream("chorro", "caliente", (s) => (postcombustion ? 22 : 19) + (s - END) * 0.03, END, END + 88, deg * DEG, "red");
  if (llama) E.front.push(llama);

  return { AGUJAS, LEVER, BASE, X_IN, Z_AX, END };
}
