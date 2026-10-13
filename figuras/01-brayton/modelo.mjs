// Ciclo Brayton cerrado ideal con refrigeración intermedia, recalentamiento y regeneración.
// Numeración de estaciones (Çengel, fig. 9-43):
//  1 entrada compresor BP          2 salida compresor BP → refrigerador intermedio
//  3 entrada compresor AP          4 salida compresor AP → regenerador (lado frío)
//  5 salida regenerador → caldera  6 salida caldera → turbina AP
//  7 salida turbina AP → recalentador  8 salida recalentador → turbina BP
//  9 salida turbina BP → regenerador (lado caliente)  10 salida regenerador → condensador
// Hipótesis: aire gas ideal, γ = 1,4, cp = 1,005 kJ/kg·K constantes; compresión y expansión
// isentrópicas; sin pérdidas de presión en intercambiadores; regenerador ideal (ε = 1);
// rp total = 8 repartido por igual (√8 por etapa); T3 = T1 y T8 = T6.

export const BRAYTON = { gamma: 1.4, cp: 1.005, rp: 8, p1: 100, t1: 300, eps: 1, mdot: 10, tMin: 900, tMax: 1500, t6: 1300 };

export function brayton(t6, base = BRAYTON) {
  const { gamma, cp, rp, p1, t1, eps, mdot } = base;
  const rs = Math.sqrt(rp);
  const tau = Math.pow(rs, (gamma - 1) / gamma);
  const T = [];
  const p = [];
  T[1] = t1;
  T[2] = t1 * tau;
  T[3] = t1;
  T[4] = T[3] * tau;
  T[6] = t6;
  T[7] = t6 / tau;
  T[8] = t6;
  T[9] = T[8] / tau;
  T[5] = T[4] + eps * (T[9] - T[4]);
  T[10] = T[9] - (T[5] - T[4]);
  p[1] = p1;
  p[2] = p[3] = p1 * rs;
  p[4] = p[5] = p[6] = p1 * rp;
  p[7] = p[8] = p1 * rs;
  p[9] = p[10] = p1;
  const wc1 = cp * (T[2] - T[1]);
  const wc2 = cp * (T[4] - T[3]);
  const wt1 = cp * (T[6] - T[7]);
  const wt2 = cp * (T[8] - T[9]);
  const qCal = cp * (T[6] - T[5]);
  const qRec = cp * (T[8] - T[7]);
  const qIc = cp * (T[2] - T[3]);
  const qCond = cp * (T[10] - T[1]);
  const qReg = cp * (T[5] - T[4]);
  const wc = wc1 + wc2;
  const wt = wt1 + wt2;
  const qin = qCal + qRec;
  const wnet = wt - wc;
  const eta = wnet / qin;
  return { T, p, wc1, wc2, wt1, wt2, qCal, qRec, qIc, qCond, qReg, wc, wt, qin, wnet, eta, bwr: wc / wt, power: (mdot * wnet) / 1000, mdot, rs, tau };
}
