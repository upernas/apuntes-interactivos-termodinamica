// Turbofán ideal de flujos separados (aire estándar frío). Estaciones:
//  0 aire libre a la altitud de vuelo     1 entrada al fan (tras la toma, remanso)
//  2 salida del fan (se divide en flujo frío y caliente)   3 salida del compresor
//  4 salida de la cámara de combustión    5 salida de la turbina
//  6 salida de la tobera caliente (núcleo)   7 salida de la tobera fría (derivación)
// Hipótesis: aire gas ideal γ = 1,4, c_p = 1,005 kJ/kg·K; toma, fan, compresor, turbina y toberas
// isentrópicos; toberas adaptadas (p6 = p7 = p0); combustión a presión constante sin añadir masa;
// la turbina mueve fan y compresor; poder calorífico 42 800 kJ/kg.
export const TURBOFAN = { gamma: 1.4, cp: 1.005, R: 0.287, M0: 0.8, T0: 223.3, p0: 26.5, pif: 1.6, pic: 15.625, bpr: 8, mcore: 40, qhv: 42800, tMin: 1150, tMax: 1700, t4: 1500 };

export function turbofan(t4, base = TURBOFAN) {
  const { gamma, cp, R, M0, T0, p0, pif, pic, bpr, mcore, qhv } = base;
  const k = (gamma - 1) / gamma;
  const a0 = Math.sqrt(gamma * R * 1000 * T0);
  const V0 = M0 * a0;
  const T = [];
  const p = [];
  T[0] = T0;
  p[0] = p0;
  T[1] = T0 * (1 + ((gamma - 1) / 2) * M0 * M0);
  p[1] = p0 * Math.pow(T[1] / T0, 1 / k);
  p[2] = pif * p[1];
  T[2] = T[1] * Math.pow(pif, k);
  p[3] = pic * p[2];
  T[3] = T[2] * Math.pow(pic, k);
  T[4] = t4;
  p[4] = p[3];
  const wc = cp * (T[3] - T[2]);
  const wf = (1 + bpr) * cp * (T[2] - T[1]);
  T[5] = T[4] - (wc + wf) / cp;
  p[5] = p[4] * Math.pow(T[5] / T[4], 1 / k);
  p[6] = p0;
  T[6] = T[5] * Math.pow(p0 / p[5], k);
  p[7] = p0;
  T[7] = T[2] * Math.pow(p0 / p[2], k);
  const V6 = Math.sqrt(2 * cp * 1000 * (T[5] - T[6]));
  const V7 = Math.sqrt(2 * cp * 1000 * (T[2] - T[7]));
  const Fs = V6 - V0 + bpr * (V7 - V0);
  const F = (mcore * Fs) / 1000;
  const f = (cp * (T[4] - T[3])) / qhv;
  const ke = V6 * V6 - V0 * V0 + bpr * (V7 * V7 - V0 * V0);
  const etaTh = ke / (2 * f * qhv * 1000);
  const etaP = (2 * V0 * Fs) / ke;
  const tsfc = (f / Fs) * 1e6;
  return { T, p, V0, V6, V7, Fs, F, f, tsfc, etaTh, etaP, eta: etaTh * etaP, wc, wf, wt: wc + wf, qin: cp * (T[4] - T[3]), mcore, bpr, mtot: mcore * (1 + bpr), M0, a0 };
}
