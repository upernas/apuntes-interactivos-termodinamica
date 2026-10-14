// Turborreactor ideal de un eje, con y sin postcombustión (aire estándar frío). Estaciones:
//  0 aire libre a la altitud de vuelo   1 entrada al compresor (tras la toma, remanso)   2 salida del compresor
//  3 salida de la cámara de combustión   4 salida de la turbina
//  con postcombustión: 5 salida del postquemador   6 salida de la tobera; sin ella: 5 salida de la tobera
// Hipótesis: γ = 1,4, c_p = 1,005 kJ/kg·K; toma, compresor, turbina y tobera isentrópicos; tobera adaptada (p = p0);
// combustión y postcombustión a presión constante sin añadir masa; la turbina mueve solo el compresor.
export const REACTOR = { gamma: 1.4, cp: 1.005, R: 0.287, M0: 0.85, T0: 223.3, p0: 26.5, pic: 12, mdot: 50, qhv: 42800, tMin: 1150, tMax: 1700, t4: 1450, tPC: 2000 };

export function turborreactor(t3, base = REACTOR, tPost = null) {
  const { gamma, cp, R, M0, T0, p0, pic, mdot, qhv } = base;
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
  const pc = tPost !== null;
  let qpc = 0;
  let n = 5;
  if (pc) {
    T[5] = Math.max(T[4], tPost);
    p[5] = p[4];
    qpc = cp * (T[5] - T[4]);
    n = 6;
  }
  const Tin = T[n - 1];
  p[n] = p0;
  T[n] = Tin * Math.pow(p0 / p[n - 1], k);
  const Vj = Math.sqrt(2 * cp * 1000 * (Tin - T[n]));
  const Fs = Vj - V0;
  const F = (mdot * Fs) / 1000;
  const qin = cp * (T[3] - T[2]);
  const f = qin / qhv;
  const fpc = qpc / qhv;
  const ke = Vj * Vj - V0 * V0;
  const etaTh = ke / (2 * (qin + qpc) * 1000);
  const etaP = (2 * V0 * Fs) / ke;
  const tsfc = ((f + fpc) / Fs) * 1e6;
  return { T, p, V0, Vj, Fs, F, wc, wt: wc, qin, qpc, f, fpc, tsfc, etaTh, etaP, eta: etaTh * etaP, mdot, M0, a0, pc, salida: n };
}

// Postcombustión: la palanca va de 0 % (en seco) a 100 % (T5 = tPC) con T3 fija.
export function postcombustion(share, base = REACTOR) {
  const seco = turborreactor(base.t4, base);
  const tPost = seco.T[4] + (share / 100) * (base.tPC - seco.T[4]);
  return { ...turborreactor(base.t4, base, tPost), seco, share };
}
