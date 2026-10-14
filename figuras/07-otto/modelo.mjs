// Ciclo Otto ideal sobrealimentado. Estados: 1 inicio de la compresión (aire tras el intercooler, PMI),
// 2 fin de la compresión (PMS), 3 fin del aporte de calor a volumen constante, 4 fin de la expansión (PMI).
// Hipótesis: aire estándar frío (γ = 1,4, c_v = 0,718 kJ/kg·K); compresión y expansión isentrópicas;
// aporte isócoro de 1800 kJ/kg; cesión isócora 4 → 1; relación de compresión 9; compresor isentrópico
// e intercooler de efectividad 0,8 sin pérdida de presión.
import { MOTOR, turbo } from "../comun/maci.mjs";

export const OTTO = { ...MOTOR, r: 9, qin: 1800, pi0: 1.6, tPicado: 720 };

export function otto(pi, base = OTTO) {
  const { gamma, cv, R, r, qin } = base;
  const t = turbo(pi, base);
  const T = [];
  const p = [];
  const v = [];
  T[1] = t.T1;
  p[1] = t.p1;
  v[1] = (R * T[1]) / p[1];
  T[2] = T[1] * Math.pow(r, gamma - 1);
  p[2] = p[1] * Math.pow(r, gamma);
  v[2] = v[1] / r;
  T[3] = T[2] + qin / cv;
  p[3] = (p[2] * T[3]) / T[2];
  v[3] = v[2];
  T[4] = T[3] / Math.pow(r, gamma - 1);
  p[4] = (p[3] * T[4]) / T[3];
  v[4] = v[1];
  const qout = cv * (T[4] - T[1]);
  const wnet = qin - qout;
  return { ...t, T, p, v, r, qin, qout, wnet, eta: wnet / qin, etaFormula: 1 - 1 / Math.pow(r, gamma - 1), pi };
}
