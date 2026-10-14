// Fig 2.2b · Turborreactor con postcombustión en su cuna: postquemador con barras de inyección y estabilizadores
// de llama, y tobera convergente-divergente de geometría variable; mitad cercana de la carcasa cortada.
// node build.mjs [--audit]
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { k, A, escena, svgDe } from "../comun/kitfig.mjs";
import { piezas } from "../comun/piezas.mjs";
import { construirReactor } from "../comun/reactor.mjs";
import { tarjeta, escribir, sinExport } from "../comun/pagina.mjs";
import { REACTOR, postcombustion } from "../11-turborreactor/modelo.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 1000;
const H = 560;
const BASE = { x: -206, y: -80, w: 390, d: 196, r: 10 };
const P = k.fitProjection([...k.boxCorners(BASE, -16, 0), [150, 0, 104], [150, 0, 24], [-260, 0, 90], [194, 0, 64]], W, H, { pad: 24, azimuth: 56, elevation: 30 });
const E = escena(P);
const X = piezas(E);
const PC = { min: 0, max: 100, valor: 60 };
const R = construirReactor(E, X, { P, postcombustion: true, label: "POSTCOMBUSTIÓN", palanca: PC });

const LABEL_TEXT = "Turborreactor con postcombustión sobre una cuna, con la mitad cercana de la carcasa cortada: toma, compresor axial, cámara anular, turbina y, detrás, el postquemador con barras de inyección, dos estabilizadores de llama en anillo y la llama, y una tobera convergente-divergente de pétalos con sus actuadores. Un pupitre con la palanca de postcombustión.";
const svg = svgDe(E, { width: W, height: H, label: LABEL_TEXT });
A.auditOrExit(E.R, P, { crowd: [] });

const m0 = postcombustion(PC.valor);
const DATA = { P, agujas: R.AGUJAS, palanca: R.LEVER, base: REACTOR };
const specJs = `const DATA = ${JSON.stringify(DATA)};\n${sinExport(readFileSync(join(HERE, "..", "11-turborreactor", "modelo.mjs"), "utf8"))}\n${readFileSync(join(HERE, "partes.js"), "utf8")}`;
const PARTES = [["toma", "Toma y difusor"], ["comp", "Compresor"], ["cam", "Cámara de combustión"], ["turb", "Turbina"], ["pc", "Postquemador"], ["tob", "Tobera variable"], ["eje", "Eje"], ["car", "Carcasa"], ["aire", "Aire de entrada"], ["chorro", "Chorro"], ["cuna", "Cuna"], ["pal", "Palanca de gases"]].map(([id, label]) => ({ id, label }));
const ESTACIONES = Array.from({ length: 6 }, (_, i) => ({ id: `e${i + 1}`, label: `Estación ${i + 1}` }));
const fmt = (v, d) => v.toFixed(d).replace(".", ",");
const html = (tema) =>
  tarjeta({
    id: "anat-postcombustion",
    fig: "Fig 2.2b",
    titulo: "Turborreactor · postcombustión",
    pista: "Clic en una pieza · palanca ← →",
    lectura: `T₅ ${fmt(m0.T[5], 0)} K · F ${fmt(m0.F, 1)} kN · TSFC ${fmt(m0.tsfc, 1)} g/(kN·s)`,
    svg,
    aria: "Turborreactor con postcombustión cortado sobre su cuna. Flechas: mueven la palanca de postcombustión. N o Intro: siguiente pieza.",
    control: { min: PC.min, max: PC.max, step: 5, valor: PC.valor, etiquetaHtml: "Postcombustión · T<sub>5</sub>", inicialTexto: `${PC.valor} %`, minTexto: "0 % (en seco)", maxTexto: `100 % (${REACTOR.tPC} K)` },
    partes: [...PARTES, ...ESTACIONES],
    claves: [
      { mark: "blue", label: "Aire que entra por la toma" },
      { mark: "red", label: "Chorro caliente a la salida de la tobera" },
      { mark: "lit", label: "Palanca de postcombustión" },
    ],
    pie: "Tras la turbina el gas aún lleva mucho oxígeno. El postquemador inyecta más combustible y lo quema detrás de los estabilizadores de llama: es un recalentamiento a presión constante (4 → 5), como el reheat del Brayton estacionario. El gas sale más caliente y más rápido, el empuje sube mucho y el consumo más todavía. La tobera abre su garganta para dejar pasar el gas más caliente sin que la turbina note el cambio.",
    hipotesis: `<strong>Hipótesis:</strong> ciclo ideal de aire estándar frío (γ = 1,4, c<sub>p</sub> = 1,005 kJ/kg·K); vuelo a M = ${fmt(REACTOR.M0, 2)} y 10 000 m; T<sub>3</sub> = ${REACTOR.t4} K fija; compresor (π = ${REACTOR.pic}), turbina y tobera isentrópicos; postcombustión a presión constante hasta ${REACTOR.tPC} K a plena palanca, sin contar la masa de combustible; tobera adaptada (p<sub>6</sub> = p<sub>0</sub>); ṁ = ${REACTOR.mdot} kg/s.`,
    tema,
  });
escribir({ dir: HERE, nombre: "postcombustion", titulo: "Turborreactor con postcombustión", html, specJs });
console.log("escrito postcombustion.html / postcombustion-light.html ·", E.R.items.length, "elementos ·", E.R.solids.length, "sólidos");
