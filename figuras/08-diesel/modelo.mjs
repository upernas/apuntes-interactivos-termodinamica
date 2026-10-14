// Ciclo Diésel ideal sobrealimentado. Estados: 1 inicio de la compresión (aire tras el intercooler, PMI),
// 2 fin de la compresión (PMS), 3 fin del aporte de calor a presión constante, 4 fin de la expansión (PMI).
// Hipótesis: aire estándar frío (γ = 1,4, c_p = 1,005 y c_v = 0,718 kJ/kg·K); compresión y expansión isentrópicas;
// aporte isobárico de 1800 kJ/kg; cesión isócora 4 → 1; relación de compresión 18; compresor isentrópico
// e intercooler de efectividad 0,8 sin pérdida de presión.
import { MOTOR, turbo } from "../comun/maci.mjs";

export const DIESEL = { ...MOTOR, r: 18, qin: 1800, pi0: 2 };

export function diesel(pi, base = DIESEL) {
  const { gamma, cp, cv, R, r, qin } = base;
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
  T[3] = T[2] + qin / cp;
  p[3] = p[2];
  v[3] = (v[2] * T[3]) / T[2];
  const rc = v[3] / v[2];
  v[4] = v[1];
  T[4] = T[3] * Math.pow(v[3] / v[4], gamma - 1);
  p[4] = (p[1] * T[4]) / T[1];
  const qout = cv * (T[4] - T[1]);
  const wnet = qin - qout;
  const etaFormula = 1 - (1 / Math.pow(r, gamma - 1)) * ((Math.pow(rc, gamma) - 1) / (gamma * (rc - 1)));
  return { ...t, T, p, v, r, rc, qin, qout, wnet, eta: wnet / qin, etaFormula, pi };
}
