// Ciclo Rankine ideal con recalentamiento y regeneración (Çengel, ejemplo 10-6):
// un calentador cerrado (sangrado a 4 MPa, drenaje bombeado a la línea) y uno abierto (desaireador, 0,5 MPa).
// Estaciones:
//  1 salida condensador (líquido saturado)     2 salida bomba de condensado
//  3 salida calentador abierto (líq. sat.)     4 salida bomba de alimentación
//  5 agua de alimentación tras el calentador cerrado   6 drenaje del calentador cerrado (líq. sat.)
//  7 salida bomba de drenaje                   8 mezcla → caldera
//  9 salida caldera → turbina AP               10 escape turbina AP (sangrado y recalentador)
//  11 salida recalentador → turbina BP         12 sangrado al calentador abierto
//  13 escape turbina BP → condensador
// Hipótesis: bombas y turbinas isentrópicas, sin pérdidas de presión, calentadores ideales
// (salidas de líquido saturado; agua de alimentación a T_sat del sangrado), líquido incompresible
// (h = h_f + v_f·Δp), propiedades del agua y del vapor según IAPWS-IF97.
import { liquido, vapor, saturacion, expandir } from "../comun/agua.mjs";

export const RANKINE = { pCald: 15, pRec: 4, pAb: 0.5, pCond: 0.01, tMin: 450, tMax: 620, t: 600, mdot: 60 };

export function rankine(tC, base = RANKINE) {
  const { pCald, pRec, pAb, pCond, mdot } = base;
  const T = tC + 273.15;
  const S = [];
  const satC = saturacion(pCond);
  const satA = saturacion(pAb);
  const satR = saturacion(pRec);
  const liq = (p, t, h, s, v) => ({ p, T: t, h, s, v, x: 0 });
  S[1] = liq(pCond, satC.T, satC.hf, satC.sf, satC.vf);
  S[2] = { ...liquido(pAb, satC.T), x: null };
  S[2].h = S[1].h + S[1].v * (pAb - pCond) * 1000;
  S[3] = liq(pAb, satA.T, satA.hf, satA.sf, satA.vf);
  S[4] = { p: pCald, h: S[3].h + S[3].v * (pCald - pAb) * 1000, s: S[3].s, v: S[3].v, x: null };
  S[6] = liq(pRec, satR.T, satR.hf, satR.sf, satR.vf);
  // líquido comprimido tratado como incompresible (hipótesis del libro): h₅ = h₆ + v₆(p₅ − p₆)
  S[5] = { p: pCald, T: satR.T, h: S[6].h + S[6].v * (pCald - pRec) * 1000, s: S[6].s, v: S[6].v, x: null };
  S[7] = { p: pCald, h: S[6].h + S[6].v * (pCald - pRec) * 1000, s: S[6].s, v: S[6].v, x: null };
  S[9] = { ...vapor(pCald, T), x: null };
  S[10] = expandir(pRec, S[9].s);
  S[11] = { ...vapor(pRec, T), x: null };
  S[12] = expandir(pAb, S[11].s);
  S[13] = expandir(pCond, S[11].s);
  const y = (S[5].h - S[4].h) / (S[10].h - S[6].h + S[5].h - S[4].h);
  const z = ((1 - y) * (S[3].h - S[2].h)) / (S[12].h - S[2].h);
  S[8] = { p: pCald, h: (1 - y) * S[5].h + y * S[7].h, x: null };
  // temperaturas de los líquidos comprimidos a partir de h (h ≈ cte en T para el líquido: aproximación por bisección)
  for (const n of [2, 4, 7, 8]) S[n].T = tLiquido(S[n].p, S[n].h);
  const m = [];
  m[1] = m[2] = m[13] = 1 - y - z;
  m[3] = m[4] = m[5] = 1 - y;
  m[6] = m[7] = y;
  m[8] = m[9] = 1;
  m[10] = 1;
  m[11] = 1 - y;
  m[12] = z;
  const wp1 = m[1] * (S[2].h - S[1].h);
  const wp2 = m[3] * (S[4].h - S[3].h);
  const wp3 = y * (S[7].h - S[6].h);
  const wtAP = S[9].h - S[10].h;
  const wtBP = (1 - y) * (S[11].h - S[12].h) + (1 - y - z) * (S[12].h - S[13].h);
  const qCal = S[9].h - S[8].h;
  const qRec = (1 - y) * (S[11].h - S[10].h);
  const qin = qCal + qRec;
  const qout = (1 - y - z) * (S[13].h - S[1].h);
  const wp = wp1 + wp2 + wp3;
  const wt = wtAP + wtBP;
  const wnet = wt - wp;
  return { S, m, y, z, wp1, wp2, wp3, wp, wtAP, wtBP, wt, qCal, qRec, qin, qout, wnet, eta: wnet / qin, power: (mdot * wnet) / 1000, mdot, tC, carnot: 1 - S[1].T / T };
}

function tLiquido(p, h) {
  let lo = 273.16;
  let hi = 623.15;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (liquido(p, mid).h < h) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
