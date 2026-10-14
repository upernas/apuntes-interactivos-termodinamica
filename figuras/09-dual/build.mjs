// Fig 2.4c · Motor de ciclo dual de cuatro cilindros con turbocompresor e intercooler (bloque seccionado a lo largo de los cuatro cilindros).
// node build.mjs [--audit]
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { k, A, escena, svgDe } from "../comun/kitfig.mjs";
import { piezas } from "../comun/piezas.mjs";
import { construirMotor } from "../comun/motor.mjs";
import { tarjeta, escribir, sinExport } from "../comun/pagina.mjs";
import { DUAL, dual } from "./modelo.mjs";
import { cifras } from "../comun/maci.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 1000;
const H = 620;
const AZ = 52;
const EL = 28;
const BASE = { x: -196, y: -100, w: 346, d: 202, r: 10 };

const P = k.fitProjection([...k.boxCorners(BASE, -16, 0), [-130, 47, 156], [-130, -50, 156], [60, 0, 182]], W, H, { pad: 22, azimuth: AZ, elevation: EL });
const E = escena(P);
const X = piezas(E);
const M = construirMotor(E, X, { diesel: true, r: DUAL.r, label: "DUAL TURBO", pmax: 22000 });

const LABEL_TEXT = "Motor de ciclo dual (diésel rápido) de cuatro cilindros en línea sobre una bancada, con el bloque seccionado por el plano de los cilindros: cuatro pistones con cámara en la cabeza, biela y cigüeñal en movimiento, inyectores en una rampa común, colectores de admisión y de escape, turbocompresor con filtro y palanca de la válvula de descarga, intercooler aire-aire, manómetro de cilindro e indicador del diagrama p–v con el tramo isócoro 2→x y el isobárico x→3.";
const svg = svgDe(E, { width: W, height: H, label: LABEL_TEXT });
A.auditOrExit(E.R, P, { crowd: [] });

const m0 = dual(DUAL.pi0);
const c0 = cifras(m0);
const DATA = { P, agujas: X.AGUJAS, palanca: M.LEVER.frames, base: DUAL, anim: M.anim };
const strip = (src) => sinExport(src).replace(/^import .*$/gm, "");
const specJs = `const DATA = ${JSON.stringify(DATA)};\n${strip(readFileSync(join(HERE, "..", "comun", "maci.mjs"), "utf8"))}\n${strip(readFileSync(join(HERE, "modelo.mjs"), "utf8"))}\n${readFileSync(join(HERE, "..", "comun", "motor-anim.js"), "utf8")}\n${readFileSync(join(HERE, "partes.js"), "utf8")}`;
const PARTES = [["piston", "Pistón"], ["biela", "Biela"], ["cig", "Cigüeñal"], ["bloque", "Bloque"], ["culata", "Culata"], ["inyeccion", "Inyección (rampa común)"], ["admision", "Admisión"], ["escape", "Escape"], ["turbo", "Turbocompresor"], ["filtro", "Filtro de aire"], ["ic", "Intercooler"], ["pal", "Válvula de descarga"], ["ind", "Indicador p–v"], ["manometro", "Manómetro"]].map(([id, label]) => ({ id, label }));
const ESTACIONES = [["eA", "Estación A"], ["eB", "Estación B"], ["e1", "Estación 1"]].map(([id, label]) => ({ id, label }));
const fmt = (v, d) => v.toFixed(d).replace(".", ",");
const html = (tema) =>
  tarjeta({
    id: "anat-dual",
    fig: "Fig 2.4c",
    titulo: "Dual · turbo + intercooler",
    pista: "Clic en una pieza · palanca ← →",
    lectura: `p₁ ${fmt(m0.p[1] / 100, 2)} bar · ${fmt(c0.potencia, 0)} kW · η ${fmt(m0.eta * 100, 1)} %`,
    svg,
    aria: "Motor de ciclo dual sobrealimentado con el bloque seccionado. Flechas: mueven la palanca de la válvula de descarga (presión de sobrealimentación). N o Intro: siguiente pieza.",
    control: { min: DUAL.piMin, max: DUAL.piMax, step: 0.05, valor: DUAL.pi0, etiquetaHtml: "Válvula de descarga · p<sub>1</sub>/p<sub>0</sub>", inicialTexto: `${fmt(DUAL.pi0, 2)}`, minTexto: `${fmt(DUAL.piMin, 1)} (atmosférico)`, maxTexto: fmt(DUAL.piMax, 1) },
    partes: [...PARTES, ...ESTACIONES],
    claves: [
      { mark: "lit", label: "Palanca de la válvula de descarga (wastegate): fija la sobrealimentación" },
      { mark: "raised", label: "Tuberías teñidas según la temperatura del aire o del gas" },
    ],
    pie: "El ciclo dual describe mejor un diésel rápido real: la primera parte del combustible arde casi de golpe en el PMS (aporte isócoro 2→x, como en un Otto) y el resto mientras el pistón ya baja (aporte isobárico x→3, como en un Diésel). Después vienen la expansión 3→4 y la cesión a volumen constante 4→1. Con la misma r, su rendimiento queda entre el del Otto y el del Diésel.",
    hipotesis: `<strong>Hipótesis:</strong> ciclo dual ideal de aire estándar frío (γ = 1,4, c<sub>p</sub> = 1,005 y c<sub>v</sub> = 0,718 kJ/kg·K, R = 0,287 kJ/kg·K); compresión y expansión isentrópicas; aporte total de 1800 kJ/kg, ${Math.round(DUAL.fv * 100)} % a volumen constante y el resto a presión constante; cesión isócora; relación de compresión r = ${DUAL.r}; aire ambiente a 100 kPa y 298 K; compresor isentrópico e intercooler de efectividad 0,8 sin pérdida de presión; se ignoran la renovación de carga y el balance de la turbina; 2,0 L (4 × 0,5 L) a 3000 rpm para la potencia.`,
    tema,
  });
escribir({ dir: HERE, nombre: "dual", titulo: "Motor de ciclo dual", html, specJs });
console.log("escrito dual.html / dual-light.html ·", E.R.items.length, "elementos ·", E.R.solids.length, "sólidos");
