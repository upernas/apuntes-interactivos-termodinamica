// Integra las figuras construidas en la web (termo-apuntes-completo.html).
// Reemplaza solo lo que hay entre marcadores, así que se puede ejecutar tantas veces como haga falta:
//   <style id="anat-css">…</style>, <!-- anat:plantillas -->…<!-- /anat:plantillas --> y
//   <!-- anat:script -->…<!-- /anat:script -->. Los huecos <div class="anat-slot" data-fig="…"> van en las secciones.
// Uso: node integrar.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ISO_CSS } from "./anatomy/kit/iso-kit.mjs";
import { kitScript } from "./anatomy/scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB = join(HERE, "..", "termo-apuntes-completo.html");
const FIGURAS = [
  ["01-brayton", "brayton"],
  ["02-rankine", "rankine"],
  ["03-turbofan", "turbofan"],
  ["04-turbohelice", "turbohelice"],
  ["05-ramjet", "ramjet"],
  ["06-scramjet", "scramjet"],
  ["07-otto", "otto"],
  ["08-diesel", "diesel"],
  ["09-dual", "dual"],
  ["10-turboeje", "turboeje"],
  ["11-turborreactor", "turborreactor"],
  ["12-postcombustion", "postcombustion"],
].filter(([dir, name]) => existsSync(join(HERE, dir, `${name}.frag.js`)));

let html = readFileSync(WEB, "utf8");
const between = (open, close, body, anchor) => {
  const a = html.indexOf(open);
  if (a >= 0) {
    const b = html.indexOf(close, a);
    html = html.slice(0, a) + open + body + close + html.slice(b + close.length);
  } else {
    const at = html.lastIndexOf(anchor);
    html = html.slice(0, at) + open + body + close + "\n" + html.slice(at);
  }
};

const css = ISO_CSS + readFileSync(join(HERE, "comun", "tema.css"), "utf8");
between('<style id="anat-css">', "</style>", css.replace(/\n+/g, "\n"), "</head>");

const plantillas = FIGURAS.map(([dir, name]) => {
  const frag = readFileSync(join(HERE, dir, `${name}.frag.html`), "utf8");
  const id = frag.match(/id="([^"]+)"/)[1];
  return `<template id="tpl-${id}">${frag}</template>`;
}).join("\n");
between("<!-- anat:plantillas -->", "<!-- /anat:plantillas -->", `\n${plantillas}\n`, "<script>");

const montar = `
function anatMontarHuecos() {
  document.querySelectorAll(".anat-slot[data-fig]").forEach((slot) => {
    if (slot.firstElementChild) return;
    const tpl = document.getElementById("tpl-" + slot.dataset.fig);
    const make = ANAT_FIGS[slot.dataset.fig];
    if (!tpl || !make) return;
    slot.appendChild(tpl.content.cloneNode(true));
    anatMontar(slot.querySelector(".anat"), make());
  });
}
// La web construye sus secciones en DOMContentLoaded (antes que este módulo, que registra después).
document.addEventListener("DOMContentLoaded", anatMontarHuecos);
window.addEventListener("load", anatMontarHuecos);`;
const script = `${kitScript()}\n${readFileSync(join(HERE, "comun", "runtime.js"), "utf8")}\nconst ANAT_FIGS = {};\n${FIGURAS.map(([dir, name]) => readFileSync(join(HERE, dir, `${name}.frag.js`), "utf8")).join("\n")}\n${montar}\n`;
between("<!-- anat:script -->", "<!-- /anat:script -->", `<script type="module">\n${script.replace(/<\/(script)/gi, "<\\/$1")}</script>`, "</body>");

writeFileSync(WEB, html);
const missing = FIGURAS.filter(([, name]) => !html.includes(`data-fig="anat-${name}"></div>`)).map(([, name]) => name);
console.log(`integradas: ${FIGURAS.map(([, n]) => n).join(", ")} · ${(html.length / 1024).toFixed(0)} KB${missing.length ? ` · AVISO sin hueco en la web: ${missing.join(", ")}` : ""}`);
