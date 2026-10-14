// Fig 2.4a · Motor Otto de cuatro cilindros con turbocompresor e intercooler (cilindro 1 seccionado).
// node build.mjs [--audit]
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { k, A, escena, svgDe } from "../comun/kitfig.mjs";
import { piezas } from "../comun/piezas.mjs";
import { construirMotor } from "../comun/motor.mjs";
import { tarjeta, escribir, sinExport } from "../comun/pagina.mjs";
import { OTTO, otto } from "./modelo.mjs";
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
const M = construirMotor(E, X, { diesel: false, r: OTTO.r, label: "OTTO TURBO" });

const LABEL_TEXT = "Motor Otto de cuatro cilindros en línea sobre una bancada, con el cilindro 1 seccionado: pistón, biela y cigüeñal en movimiento, bujías, colectores de admisión con mariposa y de escape, turbocompresor con filtro y palanca de la válvula de descarga, intercooler aire-aire, manómetro de cilindro e indicador del diagrama p–v con los estados 1 a 4.";
const svg = svgDe(E, { width: W, height: H, label: LABEL_TEXT });
A.auditOrExit(E.R, P, { crowd: [] });

const m0 = otto(OTTO.pi0);
const c0 = cifras(m0);
const DATA = { P, agujas: X.AGUJAS, palanca: M.LEVER.frames, base: OTTO, anim: M.anim };
const strip = (src) => sinExport(src).replace(/^import .*$/gm, "");
const specJs = `const DATA = ${JSON.stringify(DATA)};\n${strip(readFileSync(join(HERE, "..", "comun", "maci.mjs"), "utf8"))}\n${strip(readFileSync(join(HERE, "modelo.mjs"), "utf8"))}\n${readFileSync(join(HERE, "..", "comun", "motor-anim.js"), "utf8")}\n${readFileSync(join(HERE, "partes.js"), "utf8")}`;
const PARTES = [["piston", "Pistón"], ["biela", "Biela"], ["cig", "Cigüeñal"], ["bloque", "Bloque"], ["culata", "Culata"], ["encendido", "Bujías"], ["admision", "Admisión y mariposa"], ["escape", "Escape"], ["turbo", "Turbocompresor"], ["filtro", "Filtro de aire"], ["ic", "Intercooler"], ["pal", "Válvula de descarga"], ["ind", "Indicador p–v"], ["manometro", "Manómetro"]].map(([id, label]) => ({ id, label }));
const ESTACIONES = [["eA", "Estación A"], ["eB", "Estación B"], ["e1", "Estación 1"]].map(([id, label]) => ({ id, label }));
const fmt = (v, d) => v.toFixed(d).replace(".", ",");
const html = (tema) =>
  tarjeta({
    id: "anat-otto",
    fig: "Fig 2.4a",
    titulo: "Otto · turbo + intercooler",
    pista: "Clic en una pieza · palanca ← →",
    lectura: `p₁ ${fmt(m0.p[1] / 100, 2)} bar · ${fmt(c0.potencia, 0)} kW · η ${fmt(m0.eta * 100, 1)} %`,
    svg,
    aria: "Motor Otto sobrealimentado con el cilindro 1 seccionado. Flechas: mueven la palanca de la válvula de descarga (presión de sobrealimentación). N o Intro: siguiente pieza.",
    control: { min: OTTO.piMin, max: OTTO.piMax, step: 0.05, valor: OTTO.pi0, etiquetaHtml: "Válvula de descarga · p<sub>1</sub>/p<sub>0</sub>", inicialTexto: `${fmt(OTTO.pi0, 2)}`, minTexto: `${fmt(OTTO.piMin, 1)} (atmosférico)`, maxTexto: fmt(OTTO.piMax, 1) },
    partes: [...PARTES, ...ESTACIONES],
    claves: [
      { mark: "lit", label: "Palanca de la válvula de descarga (wastegate): fija la sobrealimentación" },
      { mark: "raised", label: "Tuberías teñidas según la temperatura del aire o del gas" },
    ],
    pie: "El pistón recorre los cuatro tiempos y el indicador dibuja el ciclo Otto ideal: compresión isentrópica 1→2, aporte de calor a volumen constante 2→3 (chispa en el PMS), expansión 3→4 y cesión a volumen constante 4→1. El turbocompresor aprovecha el escape para meter más aire en el cilindro; el intercooler lo enfría antes de entrar.",
    hipotesis: `<strong>Hipótesis:</strong> ciclo Otto ideal de aire estándar frío (γ = 1,4, c<sub>v</sub> = 0,718 kJ/kg·K, R = 0,287 kJ/kg·K); compresión y expansión isentrópicas; aporte isócoro de 1800 kJ/kg y cesión isócora; relación de compresión r = ${OTTO.r}; aire ambiente a 100 kPa y 298 K; compresor isentrópico e intercooler de efectividad 0,8 sin pérdida de presión; se ignoran la renovación de carga y el balance de la turbina; 2,0 L (4 × 0,5 L) a 3000 rpm para la potencia.`,
    tema,
  });
escribir({ dir: HERE, nombre: "otto", titulo: "Motor Otto", html, specJs });
console.log("escrito otto.html / otto-light.html ·", E.R.items.length, "elementos ·", E.R.solids.length, "sólidos");
