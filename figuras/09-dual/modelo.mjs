// Ciclo dual (mixto o de Sabathé) ideal sobrealimentado. Estados: 1 inicio de la compresión (aire tras el
// intercooler, PMI), 2 fin de la compresión (PMS), x fin del aporte a volumen constante (aún en el PMS),
// 3 fin del aporte a presión constante, 4 fin de la expansión (PMI).
// Hipótesis: aire estándar frío (γ = 1,4, c_p = 1,005 y c_v = 0,718 kJ/kg·K); compresión y expansión isentrópicas;
// aporte total de 1800 kJ/kg, un 30 % isócoro (2 → x) y el resto isobárico (x → 3); cesión isócora 4 → 1;
// relación de compresión 15; compresor isentrópico e intercooler de efectividad 0,8 sin pérdida de presión.
import { MOTOR, turbo } from "../comun/maci.mjs";

export const DUAL = { ...MOTOR, r: 15, qin: 1800, fv: 0.3, pi0: 2 };

export function dual(pi, base = DUAL) {
  const { gamma, cp, cv, R, r, qin, fv } = base;
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
  const qv = fv * qin;
  const qp = qin - qv;
  const Tx = T[2] + qv / cv;
  const px = (p[2] * Tx) / T[2];
  T[3] = Tx + qp / cp;
  p[3] = px;
  v[3] = (v[2] * T[3]) / Tx;
  const rc = v[3] / v[2];
  const alfa = px / p[2];
  v[4] = v[1];
  T[4] = T[3] * Math.pow(v[3] / v[4], gamma - 1);
  p[4] = (p[1] * T[4]) / T[1];
  const qout = cv * (T[4] - T[1]);
  const wnet = qin - qout;
  const etaFormula = 1 - (1 / Math.pow(r, gamma - 1)) * ((alfa * Math.pow(rc, gamma) - 1) / (alfa - 1 + alfa * gamma * (rc - 1)));
  return { ...t, T, p, v, Tx, px, r, rc, alfa, qin, qv, qp, qout, wnet, eta: wnet / qin, etaFormula, pi, faseIsobara: "Combustión: isócora 2 → x en el PMS e isobárica x → 3" };
}
