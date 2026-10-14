// Turboeje ideal con turbina libre, en banco (aire estándar frío, sin velocidad de vuelo). Estaciones:
//  0 aire ambiente   1 entrada al compresor   2 salida del compresor   3 salida de la cámara
//  4 salida de la turbina del compresor (generador de gas)   5 salida de la turbina libre
//  6 salida de la tobera de escape
// Hipótesis: aire gas ideal γ = 1,4, c_p = 1,005 kJ/kg·K; compresor, turbinas y tobera isentrópicos;
// la turbina del compresor da justo el trabajo del compresor; la turbina libre expande hasta p5 = 1,05·p0
// (lo justo para evacuar el gas); reductor sin pérdidas; la potencia del eje la absorbe un freno dinamométrico.
export const TURBOEJE = { gamma: 1.4, cp: 1.005, R: 0.287, T0: 288.15, p0: 101.3, pic: 14, pnoz: 1.05, mdot: 4.5, rpmSalida: 6000, reduccion: 3.5, qhv: 42800, tMin: 1100, tMax: 1500, t3: 1350 };

export function turboeje(t3, base = TURBOEJE) {
  const { gamma, cp, T0, p0, pic, pnoz, mdot, rpmSalida, reduccion, qhv } = base;
  const k = (gamma - 1) / gamma;
  const T = [];
  const p = [];
  T[0] = T0;
  p[0] = p0;
  T[1] = T0;
  p[1] = p0;
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
  const qin = cp * (T[3] - T[2]);
  const f = qin / qhv;
  const etaTh = wtl / qin;
  const omega = (2 * Math.PI * rpmSalida) / 60;
  const par = (potencia * 1e6) / omega / 1000;
  const bsfc = ((mdot * f * 3600) / (potencia * 1000)) * 1000;
  const especifica = wtl;
  return { T, p, V6, wc, wtl, potencia, qin, f, etaTh, par, bsfc, especifica, rpmTurbina: rpmSalida * reduccion, rpmSalida, mdot, bwr: wc / (wc + wtl) };
}
