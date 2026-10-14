// Fig 2.2a · Turborreactor de un eje en su cuna, con la mitad cercana de la carcasa cortada.
// node build.mjs [--audit]
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { k, A, escena, svgDe } from "../comun/kitfig.mjs";
import { piezas } from "../comun/piezas.mjs";
import { construirReactor } from "../comun/reactor.mjs";
import { tarjeta, escribir, sinExport } from "../comun/pagina.mjs";
import { REACTOR, turborreactor } from "./modelo.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const W = 1000;
const H = 560;
const BASE = { x: -126, y: -80, w: 310, d: 196, r: 10 };
const P = k.fitProjection([...k.boxCorners(BASE, -16, 0), [150, 0, 104], [150, 0, 24], [-180, 0, 90], [194, 0, 64]], W, H, { pad: 24, azimuth: 56, elevation: 30 });
const E = escena(P);
const X = piezas(E);
const R = construirReactor(E, X, { P, label: "TURBORREACTOR", palanca: { min: REACTOR.tMin, max: REACTOR.tMax, valor: REACTOR.t4 } });

const LABEL_TEXT = "Turborreactor de un eje sobre una cuna, con la mitad cercana de la carcasa cortada: toma con difusor, ojiva y álabes guía, compresor axial, cámara anular con inyectores, turbina, cono de cola y tobera; líneas de corriente azules (aire de entrada) y naranjas (chorro). Un pupitre con la palanca de gases fija la temperatura de entrada a turbina.";
const svg = svgDe(E, { width: W, height: H, label: LABEL_TEXT });
A.auditOrExit(E.R, P, { crowd: [] });

const m0 = turborreactor(REACTOR.t4);
const DATA = { P, agujas: R.AGUJAS, palanca: R.LEVER, base: REACTOR };
const specJs = `const DATA = ${JSON.stringify(DATA)};\n${sinExport(readFileSync(join(HERE, "modelo.mjs"), "utf8"))}\n${readFileSync(join(HERE, "partes.js"), "utf8")}`;
const PARTES = [["toma", "Toma y difusor"], ["comp", "Compresor"], ["cam", "Cámara de combustión"], ["turb", "Turbina"], ["tob", "Tobera"], ["eje", "Eje"], ["car", "Carcasa"], ["aire", "Aire de entrada"], ["chorro", "Chorro"], ["cuna", "Cuna"], ["pal", "Palanca de gases"]].map(([id, label]) => ({ id, label }));
const ESTACIONES = Array.from({ length: 5 }, (_, i) => ({ id: `e${i + 1}`, label: `Estación ${i + 1}` }));
const fmt = (v, d) => v.toFixed(d).replace(".", ",");
const html = (tema) =>
  tarjeta({
    id: "anat-turborreactor",
    fig: "Fig 2.2a",
    titulo: "Turborreactor · un eje",
    pista: "Clic en una pieza · palanca ← →",
    lectura: `T₃ ${REACTOR.t4} K · F ${fmt(m0.F, 1)} kN · η_p ${fmt(m0.etaP * 100, 1)} %`,
    svg,
    aria: "Turborreactor cortado sobre su cuna. Flechas: mueven la palanca de gases (temperatura de entrada a turbina). N o Intro: siguiente pieza.",
    control: { min: REACTOR.tMin, max: REACTOR.tMax, step: 10, valor: REACTOR.t4, etiquetaHtml: "Palanca de gases · T<sub>3</sub>", inicialTexto: `${REACTOR.t4} K`, minTexto: `${REACTOR.tMin} K`, maxTexto: `${REACTOR.tMax} K` },
    partes: [...PARTES, ...ESTACIONES],
    claves: [
      { mark: "blue", label: "Aire que entra por la toma" },
      { mark: "red", label: "Chorro caliente a la salida de la tobera" },
      { mark: "lit", label: "Palanca de gases" },
    ],
    pie: "Es el Brayton más directo: todo el aire pasa por el compresor, la cámara y la turbina, que solo mueve al compresor. Lo que queda de energía en el gas se convierte en velocidad en la tobera, y el empuje sale de acelerar el aire de V₀ a V_j. Como el chorro sale muy rápido, el rendimiento propulsivo es bajo a velocidades subsónicas.",
    hipotesis: `<strong>Hipótesis:</strong> ciclo ideal de aire estándar frío (γ = 1,4, c<sub>p</sub> = 1,005 kJ/kg·K, R = 0,287 kJ/kg·K); vuelo a M = ${fmt(REACTOR.M0, 2)} y 10 000 m (T<sub>0</sub> = ${fmt(REACTOR.T0, 1)} K, p<sub>0</sub> = ${fmt(REACTOR.p0, 1)} kPa); toma, compresor (π = ${REACTOR.pic}), turbina y tobera isentrópicos; tobera adaptada (p<sub>5</sub> = p<sub>0</sub>); combustión a presión constante sin contar la masa de combustible; poder calorífico 42 800 kJ/kg; ṁ = ${REACTOR.mdot} kg/s.`,
    tema,
  });
escribir({ dir: HERE, nombre: "turborreactor", titulo: "Turborreactor", html, specJs });
console.log("escrito turborreactor.html / turborreactor-light.html ·", E.R.items.length, "elementos ·", E.R.solids.length, "sólidos");
