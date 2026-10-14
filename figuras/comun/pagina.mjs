// Monta la tarjeta de la figura y escribe: página independiente (oscura y clara) y fragmento para la web.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { k } from "./kitfig.mjs";
import { kitScript } from "../anatomy/scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const temaCss = () => readFileSync(join(HERE, "tema.css"), "utf8");
export const runtimeJs = () => readFileSync(join(HERE, "runtime.js"), "utf8");
export const sinExport = (source) => source.replace(/^export /gm, "");

// Paleta de la web para las páginas independientes (en la web ya está en :root).
const PALETA = `:root{--mu:#1CBBBB;--mu-d:#138F8F;--mu-dk:#1B3D50;--mu-light:#E0F6F6;--paper:#FFFFFF;--paper2:#F4F5F7;--line:#D8DCE6;--text:#1A1F2E;--dim:#4A5168;--mute:#9AA0AE;--hot:#C84B1A;--cold:#0369A1;--sans:'Manrope',system-ui,sans-serif;--serif:'Fraunces',Georgia,serif;--mono:'JetBrains Mono',ui-monospace,Consolas,monospace}`;

export function tarjeta({ id, fig, titulo, pista, lectura, svg, aria, control, partes, claves = [], pie, hipotesis, tema = "light" }) {
  const corner = (name, text, extra = "") => `<span class="iso-plate-corner" data-corner="${name}"${extra}>${esc(text)}</span>`;
  const ctrl = `<div class="anat-ctrl"><label for="${id}-ctrl"><span>${control.etiquetaHtml}</span><output for="${id}-ctrl">${esc(control.inicialTexto)}</output></label><input id="${id}-ctrl" type="range" min="${control.min}" max="${control.max}" step="${control.step}" value="${control.valor}"><div class="anat-range"><span>${esc(control.minTexto)}</span><span>${esc(control.maxTexto)}</span></div></div>`;
  const stage = `<div class="anat-stage" tabindex="0" role="slider" aria-label="${esc(aria)}" aria-valuemin="${control.min}" aria-valuemax="${control.max}" aria-valuenow="${control.valor}" aria-valuetext="${esc(control.inicialTexto)}">${svg}<span class="anat-live" aria-live="polite"></span></div>`;
  const side = `<div class="anat-side">${ctrl}<div class="anat-panel"></div></div>`;
  // arriba a la izquierda va el nombre de la máquina (el número de figura queda solo en data-num)
  const plate = `<div class="iso-plate" data-num="${esc(fig)}"><div class="iso-plate-corners" aria-hidden="true">${corner("fig", titulo)}${corner("hint", pista)}${corner("readout", lectura, " data-readout")}</div><div class="anat-body">${stage}${side}</div></div>`;
  const swatch = (mark) => k.plateHtml({ fig: "", keys: [{ mark, label: "x" }], body: "" }).match(/<svg class="iso-swatch"[\s\S]*?<\/svg>/)[0];
  const keys = claves.length ? `<span class="iso-keys">${claves.map(({ mark, label }) => `<span class="iso-key">${swatch(mark)}${esc(label)}</span>`).join("")}</span>` : "";
  const buttons = `<span class="anat-parts">${partes.map(({ id: part, label, num }) => `<button type="button" data-pick="${part}" aria-pressed="false">${num ? `<span>${esc(num)}</span>` : ""}${esc(label)}</button>`).join("")}</span>`;
  const legend = `<figcaption class="iso-legend">${buttons}${keys}<span class="iso-caption">${pie}</span><span class="anat-hip">${hipotesis}</span></figcaption>`;
  return `<figure class="iso-figure anat iso" id="${id}" data-fig="${id}" data-theme="${tema}">${plate}${legend}</figure>`;
}

// specJs: código que define `ANAT_FIGS["<id>"] = () => SPEC` dentro de un bloque.
export function escribir({ dir, nombre, titulo, html, specJs, width = 1180 }) {
  const frag = `/* figura ${nombre} */\n{\n${specJs}\n}\n`;
  writeFileSync(join(dir, `${nombre}.frag.js`), frag);
  writeFileSync(join(dir, `${nombre}.frag.html`), html("light"));
  const mount = `document.querySelectorAll(".anat[data-fig]").forEach((el) => anatMontar(el, ANAT_FIGS[el.dataset.fig]()));`;
  const script = `${kitScript()}\n${runtimeJs()}\nconst ANAT_FIGS = {};\n${frag}\n${mount}`;
  for (const theme of ["dark", "light"]) {
    const body = `<style>${PALETA}${temaCss()}</style>${html(theme)}`;
    const page = k.pageHtml({ title: titulo, theme, body, script, width }).replace('<html lang="en">', '<html lang="es">');
    writeFileSync(join(dir, theme === "light" ? `${nombre}-light.html` : `${nombre}.html`), page);
  }
}
