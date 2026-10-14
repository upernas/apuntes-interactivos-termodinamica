// Motor de cuatro cilindros en línea sobrealimentado (turbo + intercooler), con el cilindro 1 seccionado por su plano
// medio. Lo usan las figuras Otto y Diésel. Devuelve los datos que necesita la animación del navegador.
import { k, G, A, DEG, compactSvg } from "./kitfig.mjs";
import { MOTOR } from "./maci.mjs";

export function construirMotor(E, X, { diesel = false, r: relacion, label, pmax = diesel ? 16000 : 25000 }) {
  const { P, at, S, Ln, Dots, record, back, put, turned, band, pipe, boxAt, cylAt, padOn, boss } = E;
  const { stepped, alongX, alongY, upZ, dial, exchanger } = X;
  const BASE = { x: -196, y: -100, w: 346, d: 202, r: 10 };
  const ZC = 46;
  const RC = MOTOR.rCrank;
  const L = MOTOR.rod;
  const PIN_TOP = 10;
  const HC = (2 * RC) / (relacion - 1);
  const ZPIN_TDC = ZC + RC + L;
  const DECK = ZPIN_TDC + PIN_TOP + HC;
  const XC = 60;
  const BORE = 14;
  const HEAD_TOP = DECK + 20;
  const COVER_TOP = HEAD_TOP + 10;
  const WATER = 3.2;

  // ---------- bancada ----------
  back.push(`<path class="iso-halo" d="${k.haloOf(BASE, -16, 10, P)}"/>`);
  const FEET = [-176, -30, 120].flatMap((x) => [[x, BASE.y + 16], [x, BASE.y + BASE.d - 16]]).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y] of FEET) {
    back.push(S(k.cylinder(x, y, 8, -16, 1.6, P, 28), { tone: "lo" }));
    back.push(S(k.cylinder(x, y, 6, -14.4, 4.4, P, 28), { tone: "mid" }));
  }
  back.push(S(k.slabOf(BASE, -10, 10, P, 8, 1.4), { tone: "mid", inner: Ln(k.sideSeam(BASE, -5, P, 8), { tone: "faint" }) }));
  record(A.slab(BASE, -10, 10, { name: "stand.bancada" }));
  back.push(Ln(k.planOutline(k.insetPlan(BASE, 6), 0, P), { tone: "lo" }));
  const SCREWS = k.corners(BASE, 12);
  back.push(Ln(SCREWS.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 18)).join(""), { tone: "lo" }));
  back.push(Dots(SCREWS.map(([x, y]) => at([x, y, 0])), { size: 0.55 }));
  const LABEL = { x: 20, y: BASE.y + BASE.d - 18, w: 66, d: 11, r: 1.5 };
  back.push(S(k.slabOf(LABEL, 0, 0.8, P, 3), { tone: "mid" }));
  back.push(Ln(k.planOutline(k.insetPlan(LABEL, 1.6), 0.8, P), { tone: "faint" }));
  back.push(k.faceTextSvg(k.topMatrix([LABEL.x + 5, LABEL.y + 7.6], 0.8, P, "x"), label, { size: 4.2, tone: "lo" }));
  back.push(Dots([at([LABEL.x + 2.4, LABEL.y + LABEL.d / 2, 0.8]), at([LABEL.x + LABEL.w - 2.4, LABEL.y + LABEL.d / 2, 0.8])], { size: 0.45 }));

  // ---------- bloque, cárter, culata y tapa (cilindro 1 seccionado por y = 0) ----------
  for (const x of [-64, 54]) boxAt("bloque", { x, y: -32, w: 12, d: 64, r: 1.2 }, 0, 8, { tone: "mid" }, { name: "bloque.bancada", bevel: 0.3, extra: Dots([at([x + 6, -28, 8]), at([x + 6, 28, 8])], { size: 0.42 }) });
  boxAt("bloque", { x: -84, y: -22, w: 168, d: 44, r: 3 }, 8, 14, { tone: "mid" }, { name: "bloque.carter", bevel: 0.5, inner: Ln(k.sideSeam({ x: -84, y: -22, w: 168, d: 44, r: 3 }, 16, P, 3), { tone: "faint" }) });
  // El bloque se corta por y = 0 a lo largo de los cuatro cilindros: solo queda la mitad del fondo, y la mitad
  // retirada se marca con línea fantasma. Así se ven los cuatro pistones, sus bielas y el cigüeñal.
  const XS = [-60, -20, 20, XC];
  const cut = (pts, z, h, part, name, tone = "hi") => {
    const id = E.R.nameFor(`${part}.${name}`);
    const cx = pts.reduce((sum, p) => sum + p[0], 0) / pts.length;
    const cy = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
    put(part, [cx, cy, z + h / 2], S(k.extrude(pts, z, h, P, { convex: false }), { tone }), { name: id, shapes: [record(A.extruded(pts, z, h, { name: id }))] });
  };
  const arc = (cx, r, from, to, n = 16) => Array.from({ length: n + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / n;
    return [cx + r * Math.cos(a), r * Math.sin(a)];
  });
  // cárter: pared del fondo y tabiques de bancada entre cilindros
  boxAt("bloque", { x: -84, y: -26, w: 168, d: 4, r: 0 }, 22, 44, { tone: "hi" }, { name: "bloque.carter-fondo", bevel: 0.3 });
  for (const [x0, x1] of [[-84, -76], [-40, -36], [0, 4], [40, 44], [80, 84]]) boxAt("bloque", { x: x0, y: -22, w: x1 - x0, d: 22, r: 0 }, 22, 44, { tone: "hi" }, { name: "bloque.tabique" });
  // cilindros: cada media camisa se divide en sectores para que el pistón, dentro de la cavidad, se ordene contra cada trozo
  const SECT = [0, -Math.PI / 4, -Math.PI / 2, (-3 * Math.PI) / 4, -Math.PI];
  XS.forEach((xc, index) => {
    const RECT = [index === 0 ? -84 : xc - 20, -26, index === XS.length - 1 ? 84 : xc + 20, 0];
    const edge = (a) => {
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const ts = [];
      if (dx > 1e-9) ts.push((RECT[2] - xc) / dx);
      if (dx < -1e-9) ts.push((RECT[0] - xc) / dx);
      if (dy < -1e-9) ts.push((RECT[1] - 0) / dy);
      if (dy > 1e-9) ts.push((RECT[3] - 0) / dy);
      const t = Math.min(...ts.filter((v) => v > 0));
      return [xc + dx * t, dy * t];
    };
    const corners = [[RECT[2], 0, 0], [RECT[2], -26, Math.atan2(-26, RECT[2] - xc)], [RECT[0], -26, Math.atan2(-26, RECT[0] - xc)], [RECT[0], 0, -Math.PI]];
    for (let i = 0; i < 4; i++) {
      const a0 = SECT[i];
      const a1 = SECT[i + 1];
      const inner = arc(xc, BORE, a0, a1, 8);
      const outer = [edge(a1), ...corners.filter(([, , a]) => a < a0 - 1e-9 && a > a1 + 1e-9).sort((p, q) => p[2] - q[2]).map(([x, y]) => [x, y]), edge(a0)];
      cut([...inner, ...outer], 66, DECK - 66, "bloque", "camisa");
    }
  });
  // línea fantasma de la mitad retirada del bloque (y de 0 a 26, del cárter a la cara superior)
  const ghost = [
    [[-84, 26, 22], [84, 26, 22]], [[84, 26, 22], [84, 26, DECK]], [[84, 26, DECK], [-84, 26, DECK]], [[-84, 26, DECK], [-84, 26, 22]],
    [[84, 0, 22], [84, 26, 22]],
    [[84, 26, DECK], [84, 26, HEAD_TOP]], [[-84, 26, DECK], [-84, 26, HEAD_TOP]], [[-84, 26, HEAD_TOP], [84, 26, HEAD_TOP]],
    [[84, 0, HEAD_TOP], [84, 26, HEAD_TOP]], [[-84, 0, HEAD_TOP], [-84, 26, HEAD_TOP]],
  ];
  E.front.push(`<g class="anat-fantasma" aria-hidden="true">${Ln(ghost.map(([a, b]) => k.segment(a, b, P)).join(""), { tone: "mid", dashed: true })}</g>`);
  // culata: también cortada; su mitad delantera no se dibuja (línea fantasma) pero sigue sosteniendo el colector de escape
  boxAt("culata", { x: -84, y: -26, w: 168, d: 26, r: 0 }, DECK, 20, { tone: "hi" }, { name: "culata.seccion", bevel: 0.3 });
  record(A.slab({ x: -84, y: 0, w: 168, d: 26, r: 0 }, DECK, 20, { name: "culata.fantasma" }, 3));
  const COVER = { x: -80, y: -22, w: 120, d: 44, r: 3 };
  boxAt("culata", COVER, HEAD_TOP, 10, { tone: "mid" }, { name: "culata.tapa", bevel: 0.6, extra: Dots([-70, -30, 10, 30].map((x) => at([x, -18, COVER_TOP])), { size: 0.4 }) });
  boxAt("culata", { x: 40, y: -22, w: 42, d: 22, r: 0 }, HEAD_TOP, 10, { tone: "mid" }, { name: "culata.tapa-seccion", bevel: 0.3 });

  // ---------- cigüeñal: muñones, contrapesos y brazos de cada cilindro ----------
  const CX = alongX([0, 0, ZC]);
  XS.forEach((xc, i) => {
    band("cig", alongX([xc - 16, 0, ZC]), 0, 10, 5, { tone: "mid" }, { name: "cig.munon" });
    band("cig", alongX([xc + 6, 0, ZC]), 0, 14, 5, { tone: "mid" }, { name: "cig.munon" });
    put("cig", [xc - 4, 0, ZC], S(G.disc(xc - 6, xc - 2, 19, CX, P), { tone: "mid" }), { name: "cig.brazo", shapes: [record(A.disc(CX, xc - 6, xc - 2, 19, { name: "cig.brazo" }))] });
    put("cig", [xc + 4, 0, ZC], `<path class="anat-pieza" data-brazo="${i}" d=""/>`, { name: "cig.brazo-cercano", bias: 0.6, shapes: [record(A.disc(CX, xc + 2, xc + 6, 19, { name: "cig.brazo-cercano" })), record(A.disc(alongX([0, 0, ZC + RC]), xc - 2, xc + 2, 4, { name: "cig.munequilla" }))] });
  });

  // ---------- pistones y bielas (se mueven en el navegador; aquí en el PMS) ----------
  XS.forEach((xc, i) => {
    const PF = upZ([xc, 0, ZPIN_TDC - 4]);
    const crown = diesel ? Ln(G.circleOf(PF, 14, 7, P, 40), { tone: "lo" }) : "";
    const piston = S(G.disc(0, 14, BORE - 0.3, PF, P), { tone: "hi", inner: Ln([3, 5.5, 8].map((s) => G.arcOf(PF, s, BORE - 0.3, P)).join(""), { tone: "lo" }) }) + crown;
    put("piston", [xc, 0, ZPIN_TDC + 3], `<g data-piston="${i}">${piston}</g>`, { name: "piston.cuerpo", bias: 0.4, shapes: [A.disc(PF, 0, 14, BORE - 0.3, { name: "piston.cuerpo" })] });
    put("biela", [xc, 0, ZC + RC + L / 2], `<path class="anat-pieza" data-biela="${i}" d=""/>`, { name: "biela.cuerpo", bias: 0.5, shapes: [A.tube([[xc, 0, ZC + 20], [xc, 0, ZPIN_TDC]], 1.8, { name: "biela.cuerpo" })] });
  });

  // ---------- bujías o inyectores con su rampa común ----------
  if (!diesel) {
    stepped("encendido", upZ([XC, 2.5, HEAD_TOP]), [[0, 2.5], [10, 2.5], [10, 2.5], [15, 2.5], [15, 2], [22, 2], [22, 1], [25, 1]], { name: "bujia", ribs: [18] });
    for (const x of XS.slice(0, 3)) stepped("encendido", upZ([x, 0, COVER_TOP]), [[0, 3.6], [5, 3.6], [5, 2], [12, 2], [12, 1], [15, 1]], { name: "bujia", ribs: [8] });
  } else {
    stepped("inyeccion", upZ([XC, 2.4, HEAD_TOP]), [[0, 2.4], [10, 2.4], [10, 3.4], [20, 3.4], [20, 2], [24, 2]], { name: "inyector", ribs: [15] });
    for (const x of XS.slice(0, 3)) stepped("inyeccion", upZ([x, 0, COVER_TOP]), [[0, 3.4], [10, 3.4], [10, 2], [14, 2]], { name: "inyector", ribs: [5] });
    const RAIL_Z = COVER_TOP + 14 + 4;
    stepped("inyeccion", alongX([-72, 0, RAIL_Z]), [[0, 5], [4, 5], [4, 4], [140, 4], [140, 5], [144, 5]], { name: "rampa", ribs: [36, 76, 116] });
    for (const x of [-72, 72]) boxAt("inyeccion", { x: x - 1, y: -3, w: 2, d: 6, r: 0.5 }, COVER_TOP, RAIL_Z - 5 - COVER_TOP, { tone: "mid" }, { name: "inyeccion.soporte" });
  }
  // chispa (Otto) o llama de inyección (Diésel) en la cámara de cada cilindro
  for (const [i, xc] of XS.entries()) {
    const [cx, cy] = at([xc, 0, DECK - HC / 2]);
    E.front.push(`<circle class="anat-glow anat-chispa" data-chispa="${i}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${diesel ? 3.2 : 2.2}" opacity="0"/>`);
  }

  // ---------- colectores de escape y admisión ----------
  const ZM = DECK + 10;
  const EXH = { x: -74, y: 26, w: 110, d: 10, r: 2 };
  boxAt("escape", EXH, ZM - 6, 12, { tone: "hi" }, { name: "escape.colector", bevel: 0.4, extra: Dots([-54, -14, 26].map((x) => at([x, 36, ZM])), { size: 0.45 }) });
  const exhOut = boss("escape", [-74, 31, ZM], [-1, 0, 0], 5, 4, { name: "escape.salida" });
  const INT = { x: -74, y: -36, w: 110, d: 10, r: 2 };
  boxAt("admision", INT, ZM - 6, 12, { tone: "hi" }, { name: "admision.colector", bevel: 0.4, extra: Dots([-54, -14, 26].map((x) => at([x, -26, ZM + 6])), { size: 0.45 }) });
  let intIn;
  if (!diesel) {
    const TF = G.frameOf([-74, -31, ZM], [-1, 0, 0], [0, 0, 1], [0, 1, 0]);
    turned("admision", TF, [[0, 4.9], [8, 4.9]], { tone: "mid" }, { name: "admision.mariposa", inner: G.arcOf(TF, 4, 4.9, P) });
    intIn = [-82, -31, ZM];
  } else intIn = boss("admision", [-74, -31, ZM], [-1, 0, 0], 5, 4, { name: "admision.entrada" });

  // ---------- turbocompresor (eje según y) con filtro y palanca de la válvula de descarga ----------
  const XT = -130;
  const ZT = 74;
  const TY = (y0) => G.frameOf([XT, y0, ZT], [0, 1, 0], [0, 0, 1], [1, 0, 0]);
  const comp = stepped("turbo", TY(40), [[0, 9], [3, 9], [3, 15], [12, 15], [12, 9], [14, 9]], { name: "compresor", ribs: [7.5] }).host;
  stepped("turbo", TY(54), [[0, 6], [8, 6]], { name: "nucleo" });
  const turb = stepped("turbo", TY(62), [[0, 9], [2, 9], [2, 13], [12, 13], [12, 8], [14, 8]], { name: "turbina", ribs: [7] }).host;
  stepped("filtro", G.frameOf([XT, 40, ZT], [0, -1, 0], [0, 0, 1], [-1, 0, 0]), [[0, 6], [3, 6], [3, 9.5], [22, 9.5], [22, 7], [24, 7]], { name: "filtro", ribs: [8, 15] });
  const compOut = padOn("turbo", comp, [XT, 47.5, ZT + 15], [0, 0, 1], 5, 5, { name: "turbo.salida-compresor" });
  const turbIn = padOn("turbo", turb, [XT + 13, 69, ZT], [1, 0, 0], 5, 5, { name: "turbo.entrada-turbina" });
  const PIV = [XT, 69];
  const lz = ZT + 13;
  padOn("turbo", turb, [PIV[0], PIV[1], lz], [0, 0, 1], 2, 3, { name: "turbo.pivote", tone: "mid" });
  const LEVER_Z = lz + 3;
  const leverDeg = (pi) => 200 + ((pi - MOTOR.piMin) / (MOTOR.piMax - MOTOR.piMin)) * 70;
  const LEVER = X.leverFrames(PIV, LEVER_Z, 13, Array.from({ length: 25 }, (_, i) => 200 + (70 * i) / 24));
  const pi0 = diesel ? 2 : 1.6;
  put("pal", [PIV[0], PIV[1], LEVER_Z], `<g data-palanca>${LEVER.svg(leverDeg(pi0))}</g>`, { bias: 0.4, name: "pal.palanca", shapes: [record(A.extruded(LEVER.ring(leverDeg(pi0)), LEVER_Z, 1.2, { name: "pal.palanca" }))] });

  // ---------- intercooler aire-aire (delante a la izquierda) ----------
  const IC = { x: XT - 11, y: -60, w: 22, d: 50, r: 1.5 };
  boxAt("ic", { x: IC.x - 2, y: IC.y, w: IC.w + 4, d: IC.d, r: 2 }, 22, 10, { tone: "mid" }, { name: "ic.deposito", bevel: 0.4 });
  boxAt("ic", IC, 32, 64, { tone: "hi" }, { name: "ic.panal", inner: Ln(Array.from({ length: 9 }, (_, i) => k.segment([IC.x + IC.w, IC.y + 5 * (i + 1), 32], [IC.x + IC.w, IC.y + 5 * (i + 1), 96], P)).join(""), { tone: "faint" }) });
  boxAt("ic", { x: IC.x - 2, y: IC.y, w: IC.w + 4, d: IC.d, r: 2 }, 96, 12, { tone: "mid" }, { name: "ic.deposito", bevel: 0.4 });
  for (const x of [IC.x - 2, IC.x + IC.w - 2]) boxAt("ic", { x, y: IC.y + 4, w: 6, d: IC.d - 8, r: 1 }, 0, 22, { tone: "mid" }, { name: "ic.pata" });
  const icIn = boss("ic", [XT, -55, 108], [0, 0, 1], 5, 4, { name: "ic.entrada" });
  const icOut = boss("ic", [XT, -31, 108], [0, 0, 1], 5, 4, { name: "ic.salida" });

  // ---------- tuberías (teñidas por temperatura) ----------
  const D = {};
  D.esc = pipe("escape", [exhOut, [-88, 31, ZM], [-88, 69, ZM], [-88, 69, ZT], turbIn], WATER, { name: "escape.tubo", cls: 'data-temp="esc"' });
  D.bajante = pipe("escape", [[XT, 76, ZT], [XT, 92, ZT], [XT, 92, 4]], WATER, { name: "escape.bajante", cls: 'data-temp="sal"' });
  boxAt("escape", { x: XT - 6, y: 86, w: 12, d: 12, r: 1 }, 0, 4, { tone: "mid" }, { name: "escape.arqueta", extra: Dots(k.corners({ x: XT - 6, y: 86, w: 12, d: 12 }, 2).map(([px, py]) => at([px, py, 4])), { size: 0.4 }) });
  D.B = pipe("turbo", [compOut, [XT, 47.5, 152], [XT, -55, 152], icIn], WATER, { name: "turbo.tubo-b", cls: 'data-temp="B"' });
  D.uno = pipe("admision", [icOut, [XT, -31, ZM], intIn], WATER, { name: "admision.tubo-1", cls: 'data-temp="1"' });

  // ---------- indicador de diagrama p–v y manómetro de cilindro ----------
  const IND = { x: 98, y: -46, w: 38, d: 8, r: 1.2 };
  boxAt("ind", { x: 113, y: -45, w: 8, d: 6, r: 1 }, 0, 60, { tone: "mid" }, { name: "ind.poste", bevel: 0.3 });
  boxAt("ind", IND, 60, 30, { tone: "mid" }, { name: "ind.caja", bevel: 0.4 });
  const screenM = k.sideMatrix([IND.x, IND.y + IND.d], 90, P, "left");
  const pantalla = `<g transform="${screenM}" class="anat-pantalla"><rect class="anat-pantalla-fondo" x="1.5" y="1.5" width="35" height="27" rx="1"/><path class="anat-eje" d="M5 1.5V28.5M1.5 25H36.5"/><path class="anat-ciclo" data-ciclo d=""/>${[1, 2, 3, 4].map((n) => `<text class="anat-num" data-num="${n}" x="0" y="0">${n}</text>`).join("")}<text class="anat-eje-txt" x="6.5" y="5">p</text><text class="anat-eje-txt" x="33" y="27.8">v</text><circle class="anat-punto" data-punto r="1.1" cx="0" cy="0"/></g>`;
  put("ind", [IND.x + IND.w / 2, IND.y + IND.d + 0.1, 75], pantalla, { bias: 0.2, name: "ind.pantalla", shapes: [A.box([IND.x, IND.y + IND.d, 60], [IND.x + IND.w, IND.y + IND.d + 0.2, 90], { name: "ind.pantalla" })] });
  const PMAN = 84;
  dial("p", [PMAN, -13, DECK + 10], [1, 0, 0], { hostR: 0.9, part: "manometro", min: 0, max: pmax, R: 7, stem: 5 });
  // termómetros de las estaciones del aire
  dial("A", [XT, 27, ZT], [0.55, 0, 1], { hostR: 9.5, part: "eA", min: 250, max: 450 });
  dial("B", [XT, 47.5, 128], [1, 0.6, 0], { hostR: WATER, part: "eB", owner: D.B.owner, min: 250, max: 450 });
  dial("1", [XT, -31, 122], [0.62, 0.79, 0], { hostR: WATER, part: "e1", owner: D.uno.owner, min: 250, max: 450 });

  return {
    BASE,
    LEVER,
    leverDeg,
    // orden de encendido 1-3-4-2: retraso de cada cilindro (de x = −60 a x = 60) respecto al cilindro 1, en grados de cigüeñal
    anim: { XC, ZC, RC, L, ZPIN_TDC, DECK, HC, PIN_TOP, web: { r: 19 }, cil: XS.map((x, i) => ({ x, retraso: [360, 180, 540, 0][i] })), screen: { pmax } },
  };
}
