// Piezas reutilizables (figuras 2–8): torneados escalonados, ejes, pedestales, intercambiadores,
// termómetros de estación, bombas centrífugas y palanca giratoria. Todas registran su forma real.
import { k, G, A, DEG, compactSvg } from "./kitfig.mjs";

export function piezas(E) {
  const { P, V, at, S, Ln, Dots, record, put, turned, band, boxAt, padOn, planeMatrix } = E;

  const radiusAt = (profile, s) => {
    for (let i = profile.length - 1; i > 0; i--) {
      const [s0, r0] = profile[i - 1];
      const [s1, r1] = profile[i];
      if (s >= s0 && s <= s1 && s1 > s0) return r0 + ((r1 - r0) * (s - s0)) / (s1 - s0);
    }
    return profile[0][1];
  };
  const shifted = (F, s0) => G.frameOf(G.add3(F.o, G.mul3(F.a, s0)), F.a, F.u, F.v);
  // Eje +x con u hacia arriba (la v sale de a × u).
  const alongX = (o) => G.frameOf(o, [1, 0, 0], [0, 0, 1], [0, -1, 0]);
  const alongY = (o) => G.frameOf(o, [0, 1, 0], [0, 0, 1], [1, 0, 0]);
  const upZ = (o) => G.frameOf(o, [0, 0, 1], [1, 0, 0], [0, 1, 0]);

  // Torneado partido por sus escalones (anillo · cuerpo · anillo). Devuelve las formas y la del trozo más largo.
  function stepped(part, F0, profile, { ribs = [], tone = "hi", name = "carcasa", extra = () => "", bolts = [] } = {}) {
    const pieces = [[profile[0]]];
    for (let i = 1; i < profile.length; i++) {
      if (profile[i][0] === profile[i - 1][0]) pieces.push([profile[i]]);
      else pieces[pieces.length - 1].push(profile[i]);
    }
    let host = null;
    let longest = -1;
    const shapes = [];
    for (const piece of pieces) {
      const s0 = piece[0][0];
      const F = shifted(F0, s0);
      const local = piece.map(([s, r]) => [s - s0, r]);
      const length = local[local.length - 1][0];
      if (length <= 0) continue;
      const inside = ribs.filter((s) => s > s0 && s < s0 + length);
      const slope = (local[local.length - 1][1] - local[0][1]) / length;
      const inner = inside.map((s) => G.arcOf(F, s - s0, radiusAt(profile, s), P, { slope })).join("");
      const dots = bolts.filter(([s]) => Math.abs(s - (s0 + length)) < 1e-6 || Math.abs(s - s0) < 1e-6).map(([s, r, count]) => Dots(G.dotsOf(F, s - s0, r, count, P, { fade: [0.04, 0.42] }), { size: 0.38 })).join("");
      const shape = turned(part, F, local, { tone }, { inner, extra: extra(s0, s0 + length, F) + dots, name: `${part}.${name}` });
      shapes.push(shape);
      if (length > longest) {
        longest = length;
        host = shape;
      }
    }
    return { host, shapes };
  }

  // Tramo de eje en x con acoplamientos/cojinetes como resaltes; cada resalte es su propio trozo.
  function shaft(part, x0, x1, y, z, features = [], r = 3.4) {
    const profile = [[0, r]];
    const marks = [];
    for (const { x, R, len } of [...features].sort((a, b) => a.x - b.x)) {
      const a = x - len / 2 - x0;
      const b = x + len / 2 - x0;
      profile.push([a, r], [a, R], [b, R], [b, r]);
      marks.push(x - x0);
    }
    profile.push([x1 - x0, r]);
    const bolts = features.filter((f) => f.kind === "acoplamiento").map(({ x, R, len }) => [x + len / 2 - x0, R * 0.7, 8]);
    return stepped(part, alongX([x0, y, z]), profile, { tone: "mid", ribs: marks, name: "eje", bolts });
  }
  const AC = (x, R = 7.5) => ({ x, R, len: 5, kind: "acoplamiento" });
  const COJ = (x, R = 9) => ({ x, R, len: 12, kind: "cojinete" });

  // Pedestal bajo un anillo cilíndrico (eje en x) de radio r.
  function pedestal(part, x0, x1, y, z, r, depth = 22) {
    const plan = { x: x0, y: y - depth / 2, w: x1 - x0, d: depth, r: 1.2 };
    const h = z - r;
    boxAt(part, plan, 0, h, { tone: "mid" }, { bevel: 0.4, steps: 3, name: `${part}.pedestal`, extra: Dots([at([x0 + (x1 - x0) / 2, y - depth / 2 + 2.5, h]), at([x0 + (x1 - x0) / 2, y + depth / 2 - 2.5, h])], { size: 0.42 }) });
  }

  // Fondo abombado elíptico analítico.
  function dish(part, F, rc, L) {
    const radius = (s) => rc * Math.sqrt(Math.max(0, 1 - (s / L) ** 2));
    const slope = (s) => (s >= L * 0.999 ? -40 : (-rc * s) / (L * L * Math.sqrt(1 - (s / L) ** 2)));
    const profile = Array.from({ length: 14 }, (_, i) => {
      const s = L * Math.sin((i / 13) * (Math.PI / 2));
      return [s, i === 13 ? 0 : radius(s), i && i < 13 ? 1 : 0];
    });
    return turned(part, F, profile, { tone: "hi" }, { smooth: { slope, rows: 3 }, name: `${part}.fondo` });
  }

  // Intercambiador horizontal a lo largo de x: envolvente, bridas, canales opcionales, fondos y silletas.
  function exchanger(part, x0, x1, y, z, r, { channel = [0, 0], saddles, rings = [], legs = false } = {}) {
    const DISH = Math.min(4.5, r * 0.4);
    const rc = r - 1.2;
    const F0 = alongX([x0, y, z]);
    const shell = band(part, F0, 0, x1 - x0, r, { tone: "hi" }, { inner: rings.map((s) => G.arcOf(F0, s, r, P)).join(""), name: `${part}.envolvente` });
    for (const x of [x0 - 1.6, x1]) {
      const F = alongX([x, y, z]);
      turned(part, F, [[0, r + 1.4], [1.6, r + 1.4]], { tone: "mid" }, { extra: Dots(G.dotsOf(F, 1.6, r + 0.6, 16, P, { fade: [0.04, 0.42] }), { size: 0.38 }), name: `${part}.brida` });
    }
    const [cl, cr] = channel;
    const left = cl ? band(part, alongX([x0 - 1.6 - cl, y, z]), 0, cl, rc, { tone: "hi" }, { name: `${part}.canal` }) : null;
    const right = cr ? band(part, alongX([x1 + 1.6, y, z]), 0, cr, rc, { tone: "hi" }, { name: `${part}.canal` }) : null;
    dish(part, G.frameOf([x0 - 1.6 - cl, y, z], [-1, 0, 0], [0, 0, 1], [0, 1, 0]), rc, DISH);
    dish(part, alongX([x1 + 1.6 + cr, y, z]), rc, DISH);
    for (const x of saddles ?? [x0 + (x1 - x0) * 0.2, x1 - (x1 - x0) * 0.2]) {
      const plan = { x: x - 4, y: y - r * 0.75, w: 8, d: r * 1.5, r: 1 };
      if (legs) {
        for (const yy of [y - r * 0.6, y + r * 0.6]) { const zs = z - Math.sqrt(r * r - (yy - y) ** 2); padOn(part, shell, [x, yy, zs], [0, 0, -1], 2.2, zs, { name: `${part}.pata`, tone: "mid" }); }
      } else boxAt(part, plan, 0, z - r, { tone: "mid" }, { bevel: 0.4, name: `${part}.silleta`, extra: Dots([at([x, y - r * 0.55, 0]), at([x, y + r * 0.55, 0])], { size: 0.4 }) });
    }
    return {
      shell,
      left,
      right,
      top: (x) => [x, y, z + r],
      bottom: (x) => [x, y, z - r],
      channelTop: (x) => [x, y, z + rc],
      ends: [x0 - 1.6 - cl - DISH, x1 + 1.6 + cr + DISH],
    };
  }

  // Termómetro (o manómetro) de esfera sobre una tubería o cuerpo cilíndrico de radio hostR.
  const AGUJAS = [];
  function dial(n, centre, stemDir, { hostR, owner, part = `e${n}`, min = 0, max = 1, R = 8, stem = 5.4 }) {
    const d = G.unit3(stemDir);
    const a = 0.9;
    const s0 = Math.sqrt(Math.max(0, hostR * hostR - a * a));
    const FS = G.frameAlong(centre, d);
    put(part, G.add3(centre, G.mul3(d, s0 + stem / 2)), S(G.disc(s0, s0 + stem, a, FS, P), { tone: "mid" }), { name: `${part}.vaina`, shapes: [record(A.disc(FS, s0, s0 + stem, a, { name: `${part}.vaina`, owner }))] });
    const up0 = Math.abs(d[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1];
    const u = G.unit3(G.sub3(up0, G.mul3(d, G.dot3(up0, d))));
    const v = G.cross3(d, u);
    const o = G.add3(centre, G.mul3(d, s0 + stem));
    const F = G.frameOf(o, d, u, v);
    const T = 2.6;
    const ticks = G.spokesOf(F, T, R - 2.2, R - 0.9, 15, P, { from: -135 * DEG, to: (135 + 270 / 14) * DEG });
    // la proyección del kit es especular: d × u queda a la derecha en pantalla
    const label = k.faceTextSvg(planeMatrix(G.add3(G.add3(o, G.mul3(d, T)), G.mul3(u, -R * 0.75)), v, G.mul3(u, -1)), String(n), { size: R * 0.65, tone: "hi", anchor: "middle" });
    const face = S(G.disc(0, T, R, F, P), { tone: "hi" }) + Ln(G.circleOf(F, T, R - 0.9, P, 48), { tone: "lo" }) + Ln(ticks, { tone: "lo" }) + label + `<path class="iso-line anat-needle" data-tone="lit" data-free="start" data-aguja="t${n}" d=""/>` + Dots([at(G.pointOf(F, T, 0, 0))], { size: 0.6, tone: "hi" });
    put(part, G.add3(o, G.mul3(d, T / 2)), face, { bias: 0.3, name: `${part}.esfera`, shapes: [record(A.disc(F, 0, T, R, { name: `${part}.esfera`, owner }))] });
    AGUJAS.push({ id: `t${n}`, n, F: { o: F.o, a: F.a, u: F.u, v: F.v }, s: T + 0.05, r: R - 1.4, tail: 1.6, a0: -135 * DEG, a1: 135 * DEG, min, max });
  }

  // Bomba centrífuga con motor: eje a lo largo de `axis` ("x" o "y"), aspiración axial en el extremo de la voluta
  // (hacia -axis·side) e impulsión arriba. Devuelve los puntos de la cara de las bridas de aspiración e impulsión.
  function pump(part, x, y, { axis = "x", side = 1, z = 18, scale = 1 } = {}) {
    const dir = axis === "x" ? [side, 0, 0] : [0, side, 0];
    const F0 = G.frameOf([x, y, z], dir, [0, 0, 1], G.cross3(dir, [0, 0, 1]));
    const at3 = (s) => G.add3([x, y, z], G.mul3(dir, s));
    const L = scale;
    // bancada
    const len = 54 * L;
    const lo = Math.min(...[-24 * L, 30 * L].map((s) => (axis === "x" ? at3(s)[0] : at3(s)[1])));
    const plan = axis === "x" ? { x: lo, y: y - 9 * L, w: len, d: 18 * L, r: 1.2 } : { x: x - 9 * L, y: lo, w: 18 * L, d: len, r: 1.2 };
    boxAt(part, plan, 0, 3, { tone: "mid" }, { bevel: 0.4, name: `${part}.bancada`, extra: Dots(k.corners(plan, 2.4).map(([px, py]) => at([px, py, 3])), { size: 0.4 }) });
    // motor (detrás, s < 0) sobre un apoyo
    const motorR = 8 * L;
    const mF = shifted(F0, -26 * L);
    const motor = stepped(part, mF, [[0, motorR - 1], [2, motorR], [18 * L, motorR], [18 * L + 2, motorR - 1]], { ribs: [], name: "motor", extra: (a, b, F) => k.fadedSvg(G.ribsOf(F, 3, 18 * L - 1, motorR, 22, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }) });
    const footH = z - motorR - 3;
    const mfoot = axis === "x" ? { x: at3(-17 * L)[0] - 4, y: y - 5, w: 8, d: 10, r: 1 } : { x: x - 5, y: at3(-17 * L)[1] - 4, w: 10, d: 8, r: 1 };
    boxAt(part, mfoot, 3, footH, { tone: "mid" }, { name: `${part}.apoyo` });
    // eje y acoplamiento entre motor y voluta
    stepped(part, shifted(F0, -6 * L), [[0, 1.6], [2, 1.6], [2, 4], [5, 4], [5, 1.6], [8 * L, 1.6]], { tone: "mid", name: "eje", ribs: [3.5] });
    // voluta
    const vR = 10 * L;
    const vol = stepped(part, shifted(F0, 2 * L), [[0, vR * 0.6], [1.5, vR], [9 * L, vR], [10.5 * L, vR * 0.6]], { name: "voluta", ribs: [5 * L] });
    const vfoot = axis === "x" ? { x: at3(6.5 * L)[0] - 4, y: y - 5, w: 8, d: 10, r: 1 } : { x: x - 5, y: at3(6.5 * L)[1] - 4, w: 10, d: 8, r: 1 };
    boxAt(part, vfoot, 3, z - vR - 3, { tone: "mid" }, { name: `${part}.apoyo` });
    // aspiración axial
    const suctionS = 12.5 * L + 4;
    E.boss(part, at3(12.5 * L), dir, 3.6, 4, { name: `${part}.aspiracion` });
    // impulsión arriba (silla sobre la voluta)
    const top = padOn(part, vol.host, G.add3(at3(6.5 * L), [0, 0, vR]), [0, 0, 1], 3.6, 5, { name: `${part}.impulsion` });
    return { suction: at3(suctionS), discharge: top, dir, motor: motor.host };
  }

  // Palanca plana que gira en un plano horizontal sobre un vástago (fotogramas precalculados).
  function leverFrames(pivot, z, len, degs) {
    const ring = (deg) => {
      const a = deg * DEG;
      const dir = [Math.sin(a), Math.cos(a)];
      const side = [-dir[1], dir[0]];
      const out = [];
      const arc = ([d, hw], from) => {
        for (let i = 0; i <= 8; i++) {
          const t = from + (i / 8) * Math.PI;
          out.push([pivot[0] + dir[0] * (d + Math.cos(t) * hw) + side[0] * Math.sin(t) * hw, pivot[1] + dir[1] * (d + Math.cos(t) * hw) + side[1] * Math.sin(t) * hw]);
        }
      };
      arc([-1.8, 1.6], Math.PI / 2);
      arc([len, 1.3], -Math.PI / 2);
      return out;
    };
    const svg = (deg) => {
      const a = deg * DEG;
      const tip = [pivot[0] + Math.sin(a) * len, pivot[1] + Math.cos(a) * len];
      return S(k.extrude(ring(deg), z, 1.2, P), { tone: "hi", lit: true }) + S(k.cylinder(tip[0], tip[1], 1.6, z + 1.2, 2.4, P, 18), { tone: "hi", lit: true }) + Dots([at([pivot[0], pivot[1], z + 1.2])], { size: 0.5, tone: "hi" });
    };
    return { ring, svg, frames: degs.map((d) => compactSvg(svg(d))) };
  }

  return { radiusAt, shifted, alongX, alongY, upZ, stepped, shaft, AC, COJ, pedestal, dish, exchanger, dial, AGUJAS, pump, leverFrames };
}
