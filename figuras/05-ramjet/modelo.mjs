// Estatorreactor (ramjet) ideal. Estaciones:
//  1 entrada: corriente libre   2 salida del difusor (aire frenado, M ≈ 0)
//  3 salida de la cámara de combustión   4 salida de la tobera
// Hipótesis: aire gas ideal γ = 1,4, c_p = 1,005 kJ/kg·K; difusor y tobera isentrópicos; el difusor frena el
// aire hasta velocidad despreciable; combustión a presión constante hasta T3 = 2000 K sin añadir masa;
// tobera adaptada (p4 = p1); vuelo a 11 000 m; área de captación 0,2 m²; poder calorífico 42 800 kJ/kg.
export const RAMJET = { gamma: 1.4, cp: 1.005, R: 0.287, T1: 216.65, p1: 22.6, t3: 2000, area: 0.2, qhv: 42800, mMin: 1.5, mMax: 4.5, m0: 2.5 };

export function ramjet(M, base = RAMJET) {
  const { gamma, cp, R, T1, p1, t3, area, qhv } = base;
  const k = (gamma - 1) / gamma;
  const a1 = Math.sqrt(gamma * R * 1000 * T1);
  const V1 = M * a1;
  const T = [];
  const p = [];
  T[1] = T1;
  p[1] = p1;
  T[2] = T1 * (1 + ((gamma - 1) / 2) * M * M);
  p[2] = p1 * Math.pow(T[2] / T1, 1 / k);
  T[3] = t3;
  p[3] = p[2];
  p[4] = p1;
  T[4] = T[3] * Math.pow(p[4] / p[3], k);
  const V4 = Math.sqrt(2 * cp * 1000 * (T[3] - T[4]));
  const rho1 = p1 / (R * T1);
  const mdot = rho1 * V1 * area;
  const Fs = V4 - V1;
  const F = (mdot * Fs) / 1000;
  const qin = cp * (T[3] - T[2]);
  const f = qin / qhv;
  const etaTh = 1 - T[1] / T[2];
  const etaP = (2 * V1) / (V1 + V4);
  const M4 = V4 / Math.sqrt(gamma * R * 1000 * T[4]);
  return { T, p, V1, V4, M, M4, mdot, Fs, F, qin, f, etaTh, etaP, eta: etaTh * etaP, tsfc: (f / Fs) * 1e6 };
}
