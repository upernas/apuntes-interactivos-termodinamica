// Ayudantes comunes a todas las figuras: envuelven el kit de anatomy (iso-kit, lathe, tube, audit)
// para que cada pieza dibujada registre su forma real en el auditor.
import * as k from "../anatomy/kit/iso-kit.mjs";
import * as G from "../anatomy/kit/lathe.mjs";
import { tubePieces, tubeSvg, crossingsOf } from "../anatomy/kit/tube.mjs";
import * as A from "../anatomy/kit/audit.mjs";

export { k, G, A, tubePieces, tubeSvg, crossingsOf };

export const DEG = Math.PI / 180;

// Una escena: proyección, grabador del auditor y ayudantes que dibujan y registran a la vez.
export function escena(P) {
  const R = A.recorder(P, {});
  const V = G.viewOf(P);
  const KS = G.scaleOf(P);
  const at = (point) => k.iso(point, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const Ln = (d, style) => k.lineSvg(d, style);
  const Dots = (points, style) => k.dotsSvg(points, style);
  const record = R.solid;
  const back = [];
  const front = [];

  function put(part, ref, svg, { bias = 0, shapes = [], name, route, chunk } = {}) {
    R.put({ piece: part, at: ref, bias, svg, move: [0, 0, 0], shapes, name: name ?? R.nameFor(`${part}.item`), route, chunk });
  }

  function tubeItems(part, route, r, { name, tone = "hi", bias = 0, maxLength, spacing, closed = false, owner, touch, bundle, limp = false, breaks = [], gaps = [], caps = true, ends = [true, true], rims, cls = "" } = {}) {
    const id = R.nameFor(name ?? `${part}.tubo`);
    R.route(id, route, r, { owner: owner ?? id, touch, bundle, limp, gaps, closed, ends, rims, piece: part, move: [0, 0, 0] });
    tubePieces(route, r, P, { maxLength, spacing, closed, breaks, gaps, caps }).forEach((piece, index) => {
      let svg = tubeSvg(piece, { tone });
      if (cls) svg = svg.replace('<g class="tb"', `<g class="tb" ${cls}`);
      put(part, piece.mid, svg, { bias, name: `${id}:${index}`, route: id, chunk: index, shapes: [A.tube(piece.points, piece.radii)] });
    });
    return id;
  }

  // Pieza torneada sobre cualquier eje: perfil [s, r] (tercer valor 1 = nudo suave).
  function turned(part, F, profile, style = {}, { extra = "", inner = "", bias = 0, rims, bevel = 0, steps, name, owner, smooth = profile.some((point) => point[2]), ground = false } = {}) {
    const paths = G.solidOf(profile, F, P, { bevel, smooth: smooth === true ? { rows: Math.max(...profile.map(([, r]) => r)) < 20 ? 3 : 5 } : smooth, ...(rims ? { rims } : {}), ...(steps ? { steps } : {}) });
    const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
    const id = R.nameFor(name ?? `${part}.torneado`);
    const shape = record(A.solid(F, profile, { name: id, owner, ground, curve: smooth && !smooth.slope ? profile : undefined }));
    put(part, G.add3(F.o, G.mul3(F.a, mid)), S(paths, { tone: "hi", ...style, inner: inner ? Ln(inner, { tone: "faint" }) : "" }) + extra, { bias, name: id, shapes: [shape] });
    return shape;
  }

  const band = (part, F, s0, s1, r, style = {}, options = {}) => turned(part, F, [[s0, r], [s1, r]], style, options);

  function flangeAt(part, centre, axis, r, thick, { bolts = 8, tone = "hi", bias = 0, boltR, name, owner } = {}) {
    const F = G.frameAlong(centre, axis);
    const id = R.nameFor(name ?? `${part}.brida`);
    const paths = G.disc(-thick / 2, thick / 2, r, F, P);
    const towards = G.dot3(F.a, V) > 0 ? thick / 2 : -thick / 2;
    const face = Math.abs(G.dot3(F.a, V)) > 0.12 && bolts ? Dots(G.dotsOf(F, towards, boltR ?? r * 0.74, bolts, P, { all: true }), { size: 0.42, tone: "mid" }) : "";
    put(part, centre, S(paths, { tone }) + face, { bias, name: id, shapes: [record(A.disc(F, -thick / 2, thick / 2, r, { name: id, owner }))] });
  }

  // Conducto con bridas en ambos extremos (el extremo de la ruta queda sobre la cara del puerto).
  function pipe(part, control, r, { bend = 2.6, tone = "hi", flanges = [true, true], flangeR = 1.5, bands = [], move, bias = 0, maxLength = 26, spacing, name, touch, breaks = [], gaps: extra = [], cls = "" } = {}) {
    const line = G.fillet(control, Math.max(r * bend, 3), r > 3 ? 24 : 12, { P, tube: r });
    const total = G.pathLength(line);
    const collars = [];
    [[0, -1], [total, 1]].forEach(([along, sign], index) => {
      if (!flanges[index]) return;
      const thick = Math.max(0.9, r * 0.5);
      const tangent = G.tangentAlong(line, along);
      collars.push({ kind: "brida", centre: G.add3(G.pointAlong(line, along), G.mul3(tangent, (-sign * thick) / 2)), tangent, radius: r * flangeR, thick, gap: sign < 0 ? [0, thick] : [total - thick, total] });
    });
    const ring = (along, radius, thick, kind) => collars.push({ kind, centre: G.pointAlong(line, along), tangent: G.tangentAlong(line, along), radius, thick, gap: [along - thick / 2, along + thick / 2] });
    for (const share of bands) ring(total * share, r * 1.18, Math.max(0.8, r * 0.6), "abrazadera");
    const gaps = [...collars.map(({ gap }) => gap), ...extra];
    const owner = tubeItems(part, line, r, { name: name ?? `${part}.conducto`, tone, bias, maxLength, spacing: spacing ?? Math.max(1.2, Math.min(3, r * 0.5)), touch, gaps, breaks, cls, rims: flanges.map((flanged) => (flanged ? r * flangeR : r)) });
    for (const { kind, centre, tangent, radius, thick } of collars) flangeAt(part, centre, tangent, radius, thick, { bolts: kind === "brida" && r > 3 ? 8 : 0, tone: kind === "brida" ? tone : "mid", bias, name: `${owner}.${kind}`, owner });
    line.owner = owner;
    line.total = total;
    return line;
  }

  // Caja de planta redondeada apoyada en z.
  function boxAt(part, plan, z, h, style = {}, { extra = "", inner = "", bias = 0, bevel = 0.5, steps = 3, name, owner, ground = false } = {}) {
    const centre = [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2];
    const id = R.nameFor(name ?? `${part}.caja`);
    put(part, centre, S(k.slabOf(plan, z, h, P, steps, bevel), { tone: "hi", ...style, inner }) + extra, { bias, name: id, shapes: [record(A.slab(plan, z, h, { name: id, owner, ground }, steps))] });
    return id;
  }

  // Cilindro vertical.
  function cylAt(part, cx, cy, r, z, h, style = {}, { extra = "", inner = "", bias = 0, steps = 32, bevel = 0, name, owner } = {}) {
    const id = R.nameFor(name ?? `${part}.cilindro`);
    put(part, [cx, cy, z + h / 2], S(k.cylinder(cx, cy, r, z, h, P, steps, bevel), { tone: "hi", ...style, inner }) + extra, { bias, name: id, shapes: [record(A.cylinder(cx, cy, r, z, h, { name: id, owner }))] });
    return id;
  }

  function ballAt(part, centre, r, { tone = "mid", bias = 0, name, owner } = {}) {
    const id = R.nameFor(name ?? `${part}.bola`);
    put(part, centre, S(G.sphereOf(centre, r, P, { steps: G.stepsFor(r, 32) }), { tone }), { bias, name: id, shapes: [record(A.ball(centre, r, { name: id, owner }))] });
  }

  // Tubuladura plana sobre una cara plana: disco de 0 a length a lo largo de outward.
  function boss(part, centre, outward, r, length, { tone = "hi", bias = 0.1, name, ring = true, owner } = {}) {
    const F = G.frameAlong(centre, outward);
    const id = R.nameFor(name ?? `${part}.tubuladura`);
    put(part, G.add3(centre, G.mul3(F.a, length / 2)), S(G.disc(0, length, r, F, P), { tone }) + (ring && G.dot3(F.a, V) > 0.15 ? Ln(G.circleOf(F, length, r * 0.55, P, 16), { tone: "faint" }) : ""), { bias, name: id, shapes: [record(A.disc(F, 0, length, r, { name: id, owner }))] });
    return G.add3(centre, G.mul3(F.a, length));
  }

  // Tubuladura con base de silla sobre un cuerpo curvo (host = forma registrada).
  function padOn(part, host, point, outward, a, h, { name, tone = "hi", bias = 0.1, owner, ring = false } = {}) {
    const hosts = [host].flat();
    const inside = (p) => hosts.some((shape) => A.sdf(shape, p) < 0);
    const axis = G.unit3(outward);
    const F = G.frameAlong(point, axis);
    const start = (angle) => {
      let lo = -2.5 * a;
      let hi = h;
      if (!inside(G.pointOf(F, lo, a, angle))) return 0;
      for (let step = 0; step < 40; step++) {
        const mid = (lo + hi) / 2;
        if (inside(G.pointOf(F, mid, a, angle))) lo = mid;
        else hi = mid;
      }
      return hi;
    };
    const low = Math.min(...Array.from({ length: 48 }, (_, index) => start((index / 48) * Math.PI * 2)));
    const id = R.nameFor(name ?? `${part}.silla`);
    const face = ring && G.dot3(axis, V) > 0.15 ? Ln(G.circleOf(F, h, a * 0.55, P, 16), { tone: "faint" }) : "";
    put(part, G.add3(point, G.mul3(axis, h / 2)), S(G.saddleOf(F, a, start, h, P), { tone }) + face, { bias, name: id, shapes: [record(A.disc(F, low - 0.05, h, a, { name: id, owner, seated: true, cut: hosts }))] });
    return G.add3(point, G.mul3(axis, h));
  }

  // Matriz SVG que lleva coordenadas planas (u hacia la derecha, v hacia abajo) al plano (o, u, v) del mundo.
  function planeMatrix(o, u, v) {
    const O = at(o);
    const U = at(G.add3(o, u));
    const W = at(G.add3(o, v));
    const f = (n) => (Math.round(n * 1000) / 1000).toString();
    return `matrix(${f(U[0] - O[0])} ${f(U[1] - O[1])} ${f(W[0] - O[0])} ${f(W[1] - O[1])} ${f(O[0])} ${f(O[1])})`;
  }

  return { P, R, V, KS, at, S, Ln, Dots, record, back, front, put, tubeItems, turned, band, flangeAt, pipe, boxAt, cylAt, ballAt, boss, padOn, planeMatrix };
}

// Reescribe los trazados M/L/Z absolutos (redondeados a 0,1) como relativos, sin pérdida: ~40 % menos de texto.
const tenths = (n) => {
  const sign = n < 0 ? "-" : "";
  const a = Math.abs(n);
  const whole = Math.floor(a / 10);
  const frac = a % 10;
  return sign + (frac ? `${whole || ""}.${frac}` : `${whole}`);
};
export function compactPath(d) {
  if (!/^[MLZ0-9.\s-]+$/.test(d)) return d;
  const tokens = d.match(/[MLZ]|-?\d*\.?\d+/g) || [];
  let out = "";
  let last = "";
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let command = "";
  const num = (value) => {
    const text = tenths(value);
    if (last && !(text[0] === "-" || (text[0] === "." && last.includes(".")))) out += " ";
    out += text;
    last = text;
  };
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "M" || t === "L" || t === "Z") {
      command = t;
      if (t === "Z") {
        out += "z";
        last = "";
        x = sx;
        y = sy;
      }
      continue;
    }
    const X = Math.round(Number(t) * 10);
    const Y = Math.round(Number(tokens[++i]) * 10);
    if (command === "M") {
      out += "m";
      last = "";
      num(X - x);
      num(Y - y);
      sx = X;
      sy = Y;
      command = "L";
    } else {
      num(X - x);
      num(Y - y);
    }
    x = X;
    y = Y;
  }
  return out;
}
export const compactSvg = (svg) => svg.replace(/ d="([^"]*)"/g, (_, d) => ` d="${compactPath(d)}"`);

// Ordena, emite los grupos clicables y devuelve el SVG de la figura.
export function svgDe(E, { width, height, label, className = "" }) {
  A.settle(E.R, E.P);
  E.R.items.sort((a, b) => a.key - b.key);
  const groups = E.R.items.map((item) => `<g class="it" data-part="${item.piece}">${item.svg}</g>`);
  return compactSvg(k.figureSvg({ width, height, label, body: [...E.back, `<g class="anat-items">${groups.join("")}</g>`, ...E.front], className }));
}
