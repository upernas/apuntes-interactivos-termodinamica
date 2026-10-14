// Animación común de los motores alternativos (se ejecuta en el navegador; necesita iso() y translateAlong()).
// tipo: "otto" (calor a volumen constante), "diesel" (a presión constante) o "dual" (primero isócoro y luego isobárico).
function motorAnimacion(DATA, tipo) {
  const isocoro = tipo !== "diesel";
  const llama = tipo !== "otto";
  const A = DATA.anim;
  const P = DATA.P;
  const VELOCIDAD = 300; // grados de cigüeñal por segundo (un ciclo de cuatro tiempos en 2,4 s)
  let el = null;
  let lastX = null;
  let pActual = 0;
  let fase = "";
  const f1 = (n) => n.toFixed(1);
  const path = (pts) => "M" + pts.map((p) => { const s = iso(p, P); return `${f1(s[0])} ${f1(s[1])}`; }).join("L") + "Z";
  const xL = (m, v) => 6 + (28 * (v - m.v[2])) / (m.v[1] - m.v[2]);
  const yL = (p) => 25 - 21 * Math.min(1.05, p / A.screen.pmax);
  function ciclo(m) {
    const pts = [];
    for (let d = 180; d <= 540; d += 3) {
      const e = estadoEnAngulo(m, d);
      pts.push([xL(m, e.v), yL(e.p)]);
    }
    if (isocoro) pts.splice(60, 0, [xL(m, m.v[2]), yL(m.p[2])], [xL(m, m.v[2]), yL(m.p[3])]);
    const d = "M" + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join("L") + "Z";
    return d + `M${xL(m, m.v[2]).toFixed(2)} ${yL(m.p[1]).toFixed(2)}H${xL(m, m.v[1]).toFixed(2)}`;
  }
  return {
    presion: () => pActual,
    fase: () => fase,
    animar(m, x, svg, t) {
      if (!el) {
        el = {
          cil: A.cil.map((c, i) => ({
            ...c,
            piston: svg.querySelector(`[data-piston="${i}"]`),
            biela: svg.querySelector(`[data-biela="${i}"]`),
            brazo: svg.querySelector(`[data-brazo="${i}"]`),
            chispa: svg.querySelector(`[data-chispa="${i}"]`),
          })),
          ciclo: svg.querySelector("[data-ciclo]"),
          punto: svg.querySelector("[data-punto]"),
          nums: [...svg.querySelectorAll("[data-num]")],
        };
      }
      const deg = (t * VELOCIDAD + 300) % 720;
      // cada cilindro va retrasado según el orden de encendido; el indicador y el manómetro siguen al cilindro 1
      for (const c of el.cil) {
        const local = (((deg - c.retraso) % 720) + 720) % 720;
        const th = (local * Math.PI) / 180;
        const s = Math.sin(th);
        const co = Math.cos(th);
        const zPin = A.ZC + A.RC * co + Math.sqrt(A.L * A.L - A.RC * A.RC * s * s);
        if (c.piston) c.piston.setAttribute("transform", translateAlong(P, [0, 0, zPin - A.ZPIN_TDC]));
        const pinY = A.RC * s;
        const pinZ = A.ZC + A.RC * co;
        if (c.biela) c.biela.setAttribute("d", path([[c.x - 1.8, pinY, pinZ], [c.x + 1.8, pinY, pinZ], [c.x + 1.4, 0, zPin], [c.x - 1.4, 0, zPin]]));
        const wx = c.x + 6;
        const brazo = [];
        for (let i = 0; i <= 12; i++) {
          const phi = th + Math.PI - 1.15 + (2.3 * i) / 12;
          brazo.push([wx, A.web.r * Math.sin(phi), A.ZC + A.web.r * Math.cos(phi)]);
        }
        for (let i = 0; i <= 12; i++) {
          const a = th - Math.PI / 2 + (Math.PI * i) / 12;
          brazo.push([wx, pinY + 6.5 * Math.sin(a), pinZ + 6.5 * Math.cos(a)]);
        }
        if (c.brazo) c.brazo.setAttribute("d", path(brazo));
        const dd = local - 360;
        const brillo = llama ? (dd > -4 && dd < 45 ? Math.sin((Math.PI * (dd + 4)) / 49) : 0) : dd > -6 && dd < 30 ? Math.exp(-((dd + 2) * (dd + 2)) / 60) : 0;
        if (c.chispa) c.chispa.setAttribute("opacity", brillo.toFixed(2));
      }
      if (x !== lastX) {
        el.ciclo.setAttribute("d", ciclo(m));
        const pos = [null, [xL(m, m.v[1]) - 1, yL(m.p[1]) - 1.6], [xL(m, m.v[2]) + 1.4, yL(m.p[2]) + 2.2], [xL(m, m.v[3]) + 1.2, yL(m.p[3]) + 0.6], [xL(m, m.v[4]) - 1, yL(m.p[4]) - 1.4]];
        el.nums.forEach((n) => {
          const [px, py] = pos[Number(n.dataset.num)];
          n.setAttribute("x", px.toFixed(2));
          n.setAttribute("y", py.toFixed(2));
        });
        lastX = x;
      }
      const e = estadoEnAngulo(m, deg);
      pActual = e.p;
      fase = e.fase;
      el.punto.setAttribute("cx", xL(m, e.v).toFixed(2));
      el.punto.setAttribute("cy", yL(e.p).toFixed(2));
    },
  };
}
