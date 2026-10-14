// Estatorreactor de combustión supersónica (scramjet) ideal. Estaciones:
//  1 corriente libre   2 entrada a la cámara (tras la admisión y el aislador, todavía supersónica)
//  3 salida de la cámara   4 salida de la tobera
// Hipótesis: aire gas ideal γ = 1,4, c_p = 1,005 kJ/kg·K (sin disociación); admisión isentrópica que decelera
// la corriente hasta M2 = M1/3, todavía supersónica; combustión de hidrógeno a presión constante y sin
// fricción (por cantidad de movimiento, V3 = V2) con dosado f = 0,015 (φ ≈ 0,5) y PCI = 120 000 kJ/kg;
// tobera isentrópica adaptada (p4 = p1); vuelo a 30 km; área de captación 0,5 m²; empuje sin la masa de combustible.
export const SCRAMJET = { gamma: 1.4, cp: 1.005, R: 0.287, T1: 226.5, p1: 1.197, ratio: 3, f: 0.015, qhv: 120000, area: 0.5, mMin: 5, mMax: 10, m0: 8 };

export function scramjet(M, base = SCRAMJET) {
  const { gamma, cp, R, T1, p1, ratio, f, qhv, area } = base;
  const k = (gamma - 1) / gamma;
  const a = (T) => Math.sqrt(gamma * R * 1000 * T);
  const V1 = M * a(T1);
  const T = [];
  const p = [];
  const Ma = [];
  const V = [];
  T[1] = T1;
  p[1] = p1;
  Ma[1] = M;
  V[1] = V1;
  Ma[2] = M / ratio;
  T[2] = (T1 * (1 + ((gamma - 1) / 2) * M * M)) / (1 + ((gamma - 1) / 2) * Ma[2] * Ma[2]);
  p[2] = p1 * Math.pow(T[2] / T1, 1 / k);
  V[2] = Ma[2] * a(T[2]);
  const q = f * qhv;
  T[3] = T[2] + q / cp;
  p[3] = p[2];
  V[3] = V[2];
  Ma[3] = V[3] / a(T[3]);
  p[4] = p1;
  T[4] = T[3] * Math.pow(p[4] / p[3], k);
  V[4] = Math.sqrt(V[3] * V[3] + 2 * cp * 1000 * (T[3] - T[4]));
  Ma[4] = V[4] / a(T[4]);
  const rho1 = p1 / (R * T1);
  const mdot = rho1 * V1 * area;
  const Fs = V[4] - V1;
  const F = (mdot * Fs) / 1000;
  const etaTh = 1 - T1 / T[2];
  const etaP = (2 * V1) / (V1 + V[4]);
  const Tt = T1 * (1 + ((gamma - 1) / 2) * M * M);
  return { T, p, Ma, V, V1, V4: V[4], M, mdot, q, Fs, F, etaTh, etaP, eta: etaTh * etaP, isp: Fs / (f * 9.80665), Tt, f };
}
