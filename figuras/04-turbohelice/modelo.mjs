// Turbohélice ideal con turbina libre (aire estándar frío). Estaciones:
//  0 aire libre   1 entrada al compresor   2 salida del compresor   3 salida de la cámara
//  4 salida de la turbina del compresor (generador de gas)   5 salida de la turbina libre
//  6 salida de la tobera de escape
// Hipótesis: aire gas ideal γ = 1,4, c_p = 1,005 kJ/kg·K; toma, compresor, turbinas y tobera isentrópicos;
// la turbina del compresor da justo el trabajo del compresor; la turbina libre expande hasta p5 = 1,2·p0
// y la tobera aprovecha el resto (empuje residual); reductor sin pérdidas; rendimiento de hélice 0,85.
export const TURBOHELICE = { gamma: 1.4, cp: 1.005, R: 0.287, M0: 0.5, T0: 249.2, p0: 47.2, pic: 12, pnoz: 1.2, mdot: 8, etaH: 0.85, rpmHelice: 1200, reduccion: 16, qhv: 42800, tMin: 1100, tMax: 1500, t3: 1350 };

export function turbohelice(t3, base = TURBOHELICE) {
  const { gamma, cp, R, M0, T0, p0, pic, pnoz, mdot, etaH, rpmHelice, reduccion, qhv } = base;
  const k = (gamma - 1) / gamma;
  const a0 = Math.sqrt(gamma * R * 1000 * T0);
  const V0 = M0 * a0;
  const T = [];
  const p = [];
  T[0] = T0;
  p[0] = p0;
  T[1] = T0 * (1 + ((gamma - 1) / 2) * M0 * M0);
  p[1] = p0 * Math.pow(T[1] / T0, 1 / k);
  p[2] = pic * p[1];
  T[2] = T[1] * Math.pow(pic, k);
  T[3] = t3;
  p[3] = p[2];
  const wc = cp * (T[2] - T[1]);
  T[4] = T[3] - wc / cp;
  p[4] = p[3] * Math.pow(T[4] / T[3], 1 / k);
  p[5] = pnoz * p0;
  T[5] = T[4] * Math.pow(p[5] / p[4], k);
  p[6] = p0;
  T[6] = T[5] * Math.pow(p0 / p[5], k);
  const wtl = cp * (T[4] - T[5]);
  const V6 = Math.sqrt(2 * cp * 1000 * (T[5] - T[6]));
  const potencia = (mdot * wtl) / 1000;
  const Fh = (etaH * potencia * 1e6) / V0 / 1000;
  const Fj = (mdot * (V6 - V0)) / 1000;
  const qin = cp * (T[3] - T[2]);
  const f = qin / qhv;
  const etaTh = (wtl + (V6 * V6 - V0 * V0) / 2000) / qin;
  const omega = (2 * Math.PI * rpmHelice) / 60;
  const par = (potencia * 1e6) / omega / 1000;
  const eshp = potencia + (Fj * V0) / etaH / 1000;
  const bsfc = ((mdot * f * 3600) / (potencia * 1000)) * 1000;
  return { T, p, V0, V6, wc, wtl, potencia, Fh, Fj, F: Fh + Fj, qin, f, etaTh, par, eshp, bsfc, rpmTurbina: rpmHelice * reduccion, rpmHelice, mdot };
}
