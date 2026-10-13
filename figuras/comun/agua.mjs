// Propiedades del agua según IAPWS-IF97: región 1 (líquido), región 2 (vapor) y región 4 (saturación).
// Unidades: p en MPa, T en K, h en kJ/kg, s en kJ/kg·K, v en m³/kg.
export const IF97_R = 0.461526;
const R1 = [
  [0, -2, 0.14632971213167], [0, -1, -0.84548187169114], [0, 0, -0.3756360367204e1], [0, 1, 0.33855169168385e1], [0, 2, -0.95791963387872], [0, 3, 0.15772038513228], [0, 4, -0.16616417199501e-1], [0, 5, 0.81214629983568e-3],
  [1, -9, 0.28319080123804e-3], [1, -7, -0.60706301565874e-3], [1, -1, -0.18990068218419e-1], [1, 0, -0.32529748770505e-1], [1, 1, -0.21841717175414e-1], [1, 3, -0.5283835796993e-4],
  [2, -3, -0.47184321073267e-3], [2, 0, -0.30001780793026e-3], [2, 1, 0.47661393906987e-4], [2, 3, -0.44141845330846e-5], [2, 17, -0.72694996297594e-15],
  [3, -4, -0.31679644845054e-4], [3, 0, -0.28270797985312e-5], [3, 6, -0.85205128120103e-9], [4, -5, -0.2242528190800e-5], [4, -2, -0.65171222895601e-6], [4, 10, -0.14341729937924e-12],
  [5, -8, -0.40516996860117e-6], [8, -11, -0.12734301741641e-8], [8, -6, -0.17424871230634e-9], [21, -29, -0.68762131295531e-18], [23, -31, 0.14478307828521e-19], [29, -38, 0.26335781662795e-22], [30, -39, -0.11947622640071e-22], [31, -40, 0.18228094581404e-23], [32, -41, -0.93537087292458e-25],
];
const R2_0 = [[0, -0.96927686500217e1], [1, 0.10086655968018e2], [-5, -0.5608791128302e-2], [-4, 0.71452738081455e-1], [-3, -0.40710498223928], [-2, 0.14240819171444e1], [-1, -0.4383951131945e1], [2, -0.28408632460772], [3, 0.21268463753307e-1]];
const R2_R = [
  [1, 0, -0.17731742473213e-2], [1, 1, -0.17834862292358e-1], [1, 2, -0.45996013696365e-1], [1, 3, -0.57581259083432e-1], [1, 6, -0.5032527872793e-1],
  [2, 1, -0.33032641670203e-4], [2, 2, -0.18948987516315e-3], [2, 4, -0.39392777243355e-2], [2, 7, -0.43797295650573e-1], [2, 36, -0.26674547914087e-4],
  [3, 0, 0.20481737692309e-7], [3, 1, 0.43870667284435e-6], [3, 3, -0.3227767723857e-4], [3, 6, -0.15033924542148e-2], [3, 35, -0.40668253562649e-1],
  [4, 1, -0.78847309559367e-9], [4, 2, 0.12790717852285e-7], [4, 3, 0.48225372718507e-6], [5, 7, 0.22922076337661e-5], [6, 3, -0.16714766451061e-10], [6, 16, -0.21171472321355e-2], [6, 35, -0.23895741934104e2],
  [7, 0, -0.5905956432427e-17], [7, 11, -0.12621808899101e-5], [7, 25, -0.38946842435739e-1], [8, 8, 0.11256211360459e-10], [8, 36, -0.82311340897998e1], [9, 13, 0.19809712802088e-7],
  [10, 4, 0.10406965210174e-18], [10, 10, -0.10234747095929e-12], [10, 14, -0.10018179379511e-8], [16, 29, -0.80882908646985e-10], [16, 50, 0.10693031879409], [18, 57, -0.33662250574171],
  [20, 20, 0.89185845355421e-24], [20, 35, 0.30629316876232e-12], [20, 48, -0.42002467698208e-5], [21, 21, -0.59056029685639e-25], [22, 53, 0.37826947613457e-5], [23, 39, -0.12768608934681e-14],
  [24, 26, 0.73087610595061e-28], [24, 40, 0.55414715350778e-16], [24, 58, -0.9436970724121e-6],
];
const R4 = [0.11670521452767e4, -0.72421316703206e6, -0.17073846940092e2, 0.1202082470247e5, -0.32325550322333e7, 0.1491510861353e2, -0.48232657361591e4, 0.40511340542057e6, -0.23855557567849, 0.65017534844798e3];

// Región 1: líquido comprimido.
export function liquido(p, T) {
  const pi = p / 16.53;
  const tau = 1386 / T;
  let g = 0;
  let gp = 0;
  let gt = 0;
  for (const [I, J, n] of R1) {
    const a = Math.pow(7.1 - pi, I);
    const b = Math.pow(tau - 1.222, J);
    g += n * a * b;
    gp += -n * I * Math.pow(7.1 - pi, I - 1) * b;
    gt += n * a * J * Math.pow(tau - 1.222, J - 1);
  }
  return { h: IF97_R * T * tau * gt, s: IF97_R * (tau * gt - g), v: (IF97_R * T * pi * gp) / (p * 1000), T, p };
}
// Región 2: vapor (también vapor saturado hasta 623,15 K).
export function vapor(p, T) {
  const pi = p;
  const tau = 540 / T;
  let g0 = Math.log(pi);
  let g0t = 0;
  for (const [J, n] of R2_0) {
    g0 += n * Math.pow(tau, J);
    g0t += n * J * Math.pow(tau, J - 1);
  }
  let gr = 0;
  let grp = 0;
  let grt = 0;
  for (const [I, J, n] of R2_R) {
    const a = Math.pow(pi, I);
    const b = Math.pow(tau - 0.5, J);
    gr += n * a * b;
    grp += n * I * Math.pow(pi, I - 1) * b;
    grt += n * a * J * Math.pow(tau - 0.5, J - 1);
  }
  return { h: IF97_R * T * tau * (g0t + grt), s: IF97_R * (tau * (g0t + grt) - (g0 + gr)), v: (IF97_R * T * pi * (1 / pi + grp)) / (p * 1000), T, p };
}
// Región 4: temperatura y presión de saturación.
export function tSat(p) {
  const n = R4;
  const beta = Math.pow(p, 0.25);
  const E = beta * beta + n[2] * beta + n[5];
  const F = n[0] * beta * beta + n[3] * beta + n[6];
  const G = n[1] * beta * beta + n[4] * beta + n[7];
  const D = (2 * G) / (-F - Math.sqrt(F * F - 4 * E * G));
  return (n[9] + D - Math.sqrt((n[9] + D) ** 2 - 4 * (n[8] + n[9] * D))) / 2;
}
export function pSat(T) {
  const n = R4;
  const th = T + n[8] / (T - n[9]);
  const A = th * th + n[0] * th + n[1];
  const B = n[2] * th * th + n[3] * th + n[4];
  const C = n[5] * th * th + n[6] * th + n[7];
  return Math.pow((2 * C) / (-B + Math.sqrt(B * B - 4 * A * C)), 4);
}
export function saturacion(p) {
  const T = tSat(p);
  const f = liquido(p, T);
  const g = vapor(p, T);
  return { T, p, hf: f.h, hg: g.h, sf: f.s, sg: g.s, vf: f.v, vg: g.v };
}
// Estado de vapor a (p, s): sobrecalentado (bisección en T) o húmedo (título x).
export function expandir(p, s) {
  const sat = saturacion(p);
  if (s <= sat.sg) {
    const x = (s - sat.sf) / (sat.sg - sat.sf);
    return { p, T: sat.T, s, x, h: sat.hf + x * (sat.hg - sat.hf), v: sat.vf + x * (sat.vg - sat.vf) };
  }
  let lo = sat.T;
  let hi = 1073.15;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (vapor(p, mid).s < s) lo = mid;
    else hi = mid;
  }
  const st = vapor(p, (lo + hi) / 2);
  return { ...st, x: null };
}
// Líquido a (p, h): bisección en T dentro de la región 1.
export function liquidoPh(p, h) {
  let lo = 273.16;
  let hi = Math.min(tSat(p), 623.15);
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (liquido(p, mid).h < h) lo = mid;
    else hi = mid;
  }
  return liquido(p, (lo + hi) / 2);
}
