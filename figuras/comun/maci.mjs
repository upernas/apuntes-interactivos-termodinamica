// Motores alternativos sobrealimentados (aire estándar frío): turbocompresor + intercooler y cinemática biela-manivela.
// Estaciones del aire: A entrada del compresor, B salida del compresor, 1 salida del intercooler (= estado 1 del ciclo).
export const MOTOR = { p0: 100, T0: 298, gamma: 1.4, cp: 1.005, cv: 0.718, R: 0.287, epsIC: 0.8, vd: 0.5e-3, cil: 4, rpm: 3000, rCrank: 15, rod: 50, piMin: 1, piMax: 2.5 };

// Compresor isentrópico hasta p1 = π·p0 e intercooler de efectividad ε (sin pérdida de presión).
export function turbo(pi, base = MOTOR) {
  const { p0, T0, gamma, cp, epsIC } = base;
  const k = (gamma - 1) / gamma;
  const TB = T0 * Math.pow(pi, k);
  const T1 = TB - epsIC * (TB - T0);
  return { TA: T0, pA: p0, TB, pB: pi * p0, T1, p1: pi * p0, wc: cp * (TB - T0), qIC: cp * (TB - T1) };
}

// Desplazamiento del pistón desde el PMS (mismas unidades que r y L).
export const recorrido = (theta, r, L) => r * (1 - Math.cos(theta)) + L - Math.sqrt(L * L - r * r * Math.sin(theta) * Math.sin(theta));

// Masa por cilindro y ciclo, potencia y presión media indicada a partir de w_neto (kJ/kg).
export function cifras(m, base = MOTOR) {
  const { vd, cil, rpm, R } = base;
  const r = m.r;
  const V1 = (vd * r) / (r - 1);
  const masa = (m.p[1] * V1) / (R * m.T[1]);
  const W = masa * m.wnet;
  return { masa, W, potencia: (cil * W * rpm) / 120, pmi: W / vd / 1000, caudal: (cil * masa * rpm) / 120 };
}

// Estado (v, p) dentro del cilindro para un ángulo de cigüeñal (grados, ciclo de 720°).
export function estadoEnAngulo(m, deg, base = MOTOR) {
  const { rCrank: r, rod: L, gamma } = base;
  const a = ((deg % 720) + 720) % 720;
  const th = (a * Math.PI) / 180;
  const share = recorrido(th, r, L) / (2 * r);
  const v = m.v[2] + (m.v[1] - m.v[2]) * share;
  if (a < 180) return { v, p: m.p[1], fase: "Admisión (el pistón aspira aire a p₁)", punto: 0 };
  if (a < 360) return { v, p: m.p[1] * Math.pow(m.v[1] / v, gamma), fase: "Compresión 1 → 2", punto: 0 };
  if (a < 540) {
    if (m.v[3] > m.v[2] && v < m.v[3]) return { v, p: m.p[3], fase: m.faseIsobara || "Combustión a presión constante 2 → 3", punto: 0 };
    return { v, p: m.p[3] * Math.pow(m.v[3] / v, gamma), fase: "Expansión 3 → 4", punto: 0 };
  }
  return { v, p: m.p[1], fase: "Escape (cesión de calor 4 → 1 y barrido)", punto: 0 };
}
