// Runtime común de las figuras de anatomy en la web de apuntes.
// Necesita del kit: iso() y translateAlong() (kitScript).
function anatNum(value, digits = 0) {
  if (!isFinite(value)) return "—";
  return value.toLocaleString("es-ES", { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: Math.abs(value) >= 10000 });
}

function anatMontar(root, spec) {
  if (!root || root.dataset.montada) return;
  root.dataset.montada = "1";
  const stage = root.querySelector(".anat-stage");
  const svg = stage.querySelector("svg");
  const readout = root.querySelector("[data-readout]");
  const panel = root.querySelector(".anat-panel");
  const live = root.querySelector(".anat-live");
  const input = root.querySelector(".anat-ctrl input");
  const output = root.querySelector(".anat-ctrl output");
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const P = spec.P;
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const C = spec.control;
  let x = C.valor;
  let target = C.valor;
  let shown = null;
  let selected = null;
  let frame = 0;
  let last = 0;
  let visible = false;
  let touring = !still.matches && Boolean(spec.tour);
  let clock = 0;
  let idle = 0;

  const groups = new Map();
  svg.querySelectorAll(".it[data-part]").forEach((el) => {
    const id = el.dataset.part;
    if (!spec.partes[id]) return;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(el);
  });
  const extras = [...svg.querySelectorAll("[data-sel]")];
  const tinted = [...svg.querySelectorAll("[data-temp]")];
  const needles = (spec.agujas || []).map((n) => ({ ...n, el: svg.querySelector(`[data-aguja="${n.id}"]`), d: "" }));
  const lever = spec.palanca ? svg.querySelector("[data-palanca]") : null;
  let leverIndex = -1;
  const glows = [...svg.querySelectorAll("[data-brillo]")];
  const buttons = [...root.querySelectorAll("[data-pick]")];

  const pointOf = (F, s, r, angle) => [0, 1, 2].map((i) => F.o[i] + F.a[i] * s + r * (Math.cos(angle) * F.u[i] + Math.sin(angle) * F.v[i]));
  const fmt = (p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  function needlePath(n, value) {
    const share = clamp((value - n.min) / (n.max - n.min), 0, 1);
    const angle = n.a0 + (n.a1 - n.a0) * share;
    const tail = iso(pointOf(n.F, n.s, -n.tail, angle), P);
    const tip = iso(pointOf(n.F, n.s, n.r, angle), P);
    return `M${fmt(tail)}L${fmt(tip)}`;
  }

  function select(id, announce = true) {
    if (selected === id) return;
    if (selected) {
      (groups.get(selected) || []).forEach((el) => el.removeAttribute("data-on"));
      extras.filter((el) => el.dataset.sel === selected).forEach((el) => el.removeAttribute("data-on"));
    }
    selected = id;
    (groups.get(id) || []).forEach((el) => el.setAttribute("data-on", ""));
    extras.filter((el) => el.dataset.sel === id).forEach((el) => el.setAttribute("data-on", ""));
    buttons.forEach((b) => b.setAttribute("aria-pressed", b.dataset.pick === id ? "true" : "false"));
    shown = null;
    if (announce && live) live.textContent = spec.partes[id].titulo;
    draw(true);
  }

  function renderPanel(m) {
    const part = spec.partes[selected];
    if (!part) return;
    const rows = part.valores(m, x);
    const html =
      `<div class="anat-ph"><span class="anat-pk">${part.grupo || "Pieza"}</span><h4>${part.titulo}</h4></div>` +
      `<p class="anat-pf">${part.funcion}</p>` +
      (part.nota ? `<p class="anat-pn">${part.nota}</p>` : "") +
      `<dl class="anat-pv">${rows.map(([k, v, cls]) => `<div${cls ? ` class="${cls}"` : ""}><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
    if (html !== shown) {
      panel.innerHTML = html;
      shown = html;
    }
  }

  function draw(force = false) {
    const m = spec.modelo(x);
    const text = spec.lectura(m, x);
    if (readout && readout.textContent !== text) readout.textContent = text;
    if (output) output.textContent = C.formato(x);
    for (const n of needles) {
      if (!n.el) continue;
      const d = needlePath(n, n.valor(m, x));
      if (d !== n.d) {
        n.el.setAttribute("d", d);
        n.d = d;
      }
    }
    for (const el of tinted) {
      const value = spec.temperatura(m, el.dataset.temp);
      el.style.setProperty("--tt", clamp((value - spec.tinte[0]) / (spec.tinte[1] - spec.tinte[0]), 0, 1).toFixed(3));
    }
    for (const el of glows) el.style.opacity = spec.brillo(m, x).toFixed(3);
    if (lever) {
      const index = Math.round(clamp((x - C.min) / (C.max - C.min), 0, 1) * (spec.palanca.length - 1));
      if (index !== leverIndex) {
        lever.innerHTML = spec.palanca[index];
        leverIndex = index;
      }
    }
    if (spec.animar) spec.animar(m, x, svg);
    renderPanel(m);
  }

  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    const calm = still.matches;
    if (touring) {
      clock += dt;
      target = spec.tour(clock);
    } else if (idle > 0) {
      idle -= dt;
      if (idle <= 0 && !calm && spec.tour) {
        touring = true;
        clock = spec.tourDesde ? spec.tourDesde(x) : 0;
      }
    }
    x = calm ? target : x + (target - x) * (1 - Math.exp(-dt / 0.35));
    if (Math.abs(target - x) < C.step * 0.02) x = target;
    if (input && document.activeElement !== input && !touring) input.value = String(target);
    draw();
    const settled = !touring && x === target && idle <= 0;
    frame = visible && !settled ? requestAnimationFrame(tick) : 0;
  }
  const run = () => {
    if (!frame && visible) {
      last = 0;
      frame = requestAnimationFrame(tick);
    }
  };
  const takeOver = () => {
    touring = false;
    idle = 14;
    run();
  };
  const steer = (value) => {
    takeOver();
    target = clamp(Math.round(value / C.step) * C.step, C.min, C.max);
    if (input) input.value = String(target);
    stage.setAttribute("aria-valuenow", String(target));
    stage.setAttribute("aria-valuetext", `${C.etiqueta}: ${C.formato(target)}`);
    run();
  };

  new IntersectionObserver(
    (entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) run();
    },
    { rootMargin: "120px 0px" },
  ).observe(stage);

  if (input) {
    input.addEventListener("input", () => steer(Number(input.value)));
  }
  let down = null;
  svg.addEventListener("pointerdown", (event) => {
    down = [event.clientX, event.clientY];
  });
  svg.addEventListener("pointerup", (event) => {
    if (!down || Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 8) return;
    const hit = event.target.closest("[data-part]");
    const id = hit && spec.partes[hit.dataset.part] ? hit.dataset.part : null;
    if (id) {
      takeOver();
      select(id);
    }
  });
  buttons.forEach((b) =>
    b.addEventListener("click", () => {
      takeOver();
      select(b.dataset.pick);
    }),
  );
  const order = Object.keys(spec.partes);
  stage.addEventListener("keydown", (event) => {
    const big = event.shiftKey ? 5 : 1;
    let handled = true;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") steer(target + C.step * big);
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") steer(target - C.step * big);
    else if (event.key === "Home") steer(C.min);
    else if (event.key === "End") steer(C.max);
    else if (event.key === "n" || event.key === "N" || event.key === "Enter") {
      takeOver();
      select(order[(order.indexOf(selected) + (event.shiftKey ? order.length - 1 : 1)) % order.length]);
    } else handled = false;
    if (handled) event.preventDefault();
  });
  stage.addEventListener("focus", () => {
    if (live && selected) live.textContent = `${spec.partes[selected].titulo}. ${C.etiqueta}: ${C.formato(target)}`;
  });
  if (still.matches) touring = false;
  select(spec.inicial || order[0], false);
  if (input) input.value = String(x);
  draw(true);
}
