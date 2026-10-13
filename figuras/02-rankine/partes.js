// Rankine · descripción de piezas y estaciones para el panel (se ejecuta en el navegador).
ANAT_FIGS["anat-rankine"] = () => {
  const B = DATA.base;
  const C = (T) => `${anatNum(T - 273.15, 1)} °C`;
  const pr = (p) => (p >= 1 ? `${anatNum(p, 1)} MPa` : `${anatNum(p * 1000, 0)} kPa`);
  const kJ = (q) => `${anatNum(q, 1)} kJ/kg`;
  const pct = (x) => `${anatNum(x * 100, 1)} %`;
  const st = (m, n) => [`Estación ${n} · T / p`, `${C(m.S[n].T)} · ${pr(m.S[n].p)}`];
  const hh = (m, n) => [`h<sub>${n}</sub>`, kJ(m.S[n].h)];
  const ESTACION = {
    1: ["Salida del condensador", "Líquido saturado a la presión del condensador: es el punto más frío del ciclo."],
    2: ["Salida de la bomba de condensado", "Líquido comprimido hasta la presión del calentador abierto."],
    3: ["Salida del calentador abierto (desaireador)", "Líquido saturado a 0,5 MPa, ya precalentado por el sangrado de la turbina de baja."],
    4: ["Salida de la bomba de alimentación", "Líquido comprimido hasta la presión de caldera."],
    5: ["Agua de alimentación tras el calentador cerrado", "Calentada sin mezclarse hasta la temperatura de saturación del sangrado de alta."],
    6: ["Drenaje del calentador cerrado", "El vapor sangrado condensa en la carcasa y sale como líquido saturado a 4 MPa."],
    7: ["Salida de la bomba de drenaje", "El drenaje se bombea hasta la presión de caldera para unirse a la línea."],
    8: ["Mezcla → entrada a la caldera", "Agua de alimentación y drenaje bombeado se mezclan antes de entrar en la caldera."],
    9: ["Vapor vivo: salida de caldera → turbina de alta", "Vapor sobrecalentado a la presión y temperatura máximas del ciclo."],
    10: ["Escape de la turbina de alta (sangrado y recalentamiento)", "Una fracción y va al calentador cerrado; el resto vuelve a la caldera para recalentarse."],
    11: ["Salida del recalentador → turbina de baja", "Recalentado a presión constante hasta T₁₁ = T₉: el escape final saldrá más seco."],
    12: ["Sangrado de la turbina de baja → calentador abierto", "Una fracción z de vapor caliente se mezcla con el agua de alimentación en el desaireador."],
    13: ["Escape de la turbina de baja → condensador", "Vapor húmedo a la presión del condensador; su título x indica cuánta agua líquida arrastra."],
  };
  const partes = {
    cal: {
      titulo: "Caldera (generador de vapor)",
      funcion: "Calienta el agua de alimentación a presión constante, la evapora en el calderín y la sobrecalienta hasta T₉. Los humos salen por la chimenea; el agua del ciclo nunca se mezcla con ellos.",
      valores: (m) => [st(m, 8), st(m, 9), ["q<sub>cal</sub> = h₉ − h₈", kJ(m.qCal), "h"], ["Calor total aportado q<sub>in</sub>", kJ(m.qin), "h"]],
    },
    rec: {
      titulo: "Recalentador",
      funcion: "Haz de tubos de la caldera que vuelve a calentar el vapor de la turbina de alta a 4 MPa. Sube el trabajo y, sobre todo, seca el escape de la turbina de baja.",
      valores: (m) => [st(m, 10), st(m, 11), ["q<sub>rec</sub> = (1 − y)(h₁₁ − h₁₀)", kJ(m.qRec), "h"]],
    },
    tap: {
      titulo: "Turbina de alta presión",
      funcion: "Expande isentrópicamente el vapor vivo hasta 4 MPa. Todo el caudal pasa por ella.",
      valores: (m) => [st(m, 9), st(m, 10), hh(m, 9), hh(m, 10), ["w<sub>T,AP</sub> = h₉ − h₁₀", kJ(m.wtAP), "h"]],
    },
    tbp: {
      titulo: "Turbina de baja presión",
      funcion: "Expande el vapor recalentado hasta la presión del condensador; a 0,5 MPa se sangra una fracción z hacia el calentador abierto.",
      valores: (m) => [st(m, 11), st(m, 12), st(m, 13), ["Título del escape x₁₃", anatNum(m.S[13].x, 3), "c"], ["w<sub>T,BP</sub>", kJ(m.wtBP), "h"]],
    },
    cond: {
      titulo: "Condensador",
      funcion: "Condensa a presión y temperatura constantes el vapor de escape cediendo su calor latente al agua de refrigeración. Aquí sí hay cambio de fase: sale líquido saturado.",
      valores: (m) => [st(m, 13), st(m, 1), ["T<sub>sat</sub> a 10 kPa", C(m.S[1].T), "c"], ["q<sub>out</sub> = (1 − y − z)(h₁₃ − h₁)", kJ(m.qout), "c"]],
    },
    b1: {
      titulo: "Bomba de condensado",
      funcion: "Lleva el condensado de 10 kPa a 0,5 MPa. Bombear líquido cuesta muy poco trabajo: w ≈ v·Δp.",
      valores: (m) => [st(m, 1), st(m, 2), ["w<sub>B1</sub> = v₁(p₂ − p₁)", kJ(m.S[2].h - m.S[1].h), "c"], ["Caudal (1 − y − z)", anatNum(m.m[1], 4)]],
    },
    da: {
      titulo: "Calentador abierto (desaireador)",
      funcion: "Mezcla el vapor sangrado de la turbina de baja con el agua de alimentación; además elimina los gases disueltos. A la salida hay líquido saturado a 0,5 MPa.",
      valores: (m) => [st(m, 2), st(m, 12), st(m, 3), ["Fracción sangrada z", anatNum(m.z, 4), "g"], ["Balance z·h₁₂ + (1−y−z)h₂ = (1−y)h₃", "✓"]],
    },
    b2: {
      titulo: "Bomba de alimentación",
      funcion: "Eleva el agua de 0,5 MPa a la presión de caldera (15 MPa). Es la bomba que más trabajo consume.",
      valores: (m) => [st(m, 3), st(m, 4), ["w<sub>B2</sub> = v₃(p₄ − p₃)", kJ(m.S[4].h - m.S[3].h), "c"], ["Caudal (1 − y)", anatNum(m.m[3], 4)]],
    },
    fc: {
      titulo: "Calentador cerrado",
      funcion: "Intercambiador de carcasa y tubos: el vapor sangrado a 4 MPa condensa en la carcasa y calienta el agua de alimentación que va por los tubos, sin mezclarse.",
      valores: (m) => [st(m, 4), st(m, 5), st(m, 10), st(m, 6), ["Fracción sangrada y", anatNum(m.y, 4), "g"]],
    },
    b3: {
      titulo: "Bomba de drenaje",
      funcion: "Devuelve a la línea de alimentación, a 15 MPa, el condensado del vapor sangrado en el calentador cerrado.",
      valores: (m) => [st(m, 6), st(m, 7), ["w<sub>B3</sub> = v₆(p₇ − p₆)", kJ(m.S[7].h - m.S[6].h), "c"], ["Caudal y", anatNum(m.y, 4)]],
    },
    gen: {
      titulo: "Alternador",
      funcion: "Recibe el trabajo neto del ciclo: turbinas menos bombas. En Rankine las bombas apenas consumen (relación de retroceso ≈ 1 %).",
      valores: (m) => [["w<sub>neto</sub> = w<sub>T</sub> − w<sub>B</sub>", kJ(m.wnet), "g"], ["Rendimiento térmico η", pct(m.eta), "g"], [`Potencia con ṁ = ${anatNum(B.mdot)} kg/s`, `${anatNum(m.power, 1)} MW`], ["Carnot entre T₁ y T₉", pct(m.carnot)]],
    },
    eje: {
      titulo: "Eje y acoplamientos",
      funcion: "Transmite al alternador el trabajo de las dos turbinas. Las bombas van movidas por sus propios motores eléctricos.",
      valores: (m) => [["w<sub>T</sub> turbinas", kJ(m.wt), "h"], ["w<sub>B</sub> bombas", kJ(m.wp), "c"], ["Relación de retroceso w<sub>B</sub>/w<sub>T</sub>", pct(m.wp / m.wt)]],
    },
    pal: {
      grupo: "Control",
      titulo: "Palanca de la válvula del quemador",
      funcion: "Regula el combustible y con él la temperatura del vapor vivo y del recalentado (T₉ = T₁₁). Más temperatura: más rendimiento y un escape más seco.",
      valores: (m, x) => [["Consigna T₉ = T₁₁", `${anatNum(x, 0)} °C`, "h"], ["q<sub>in</sub>", kJ(m.qin), "h"], ["Rendimiento η", pct(m.eta), "g"], ["Título del escape x₁₃", anatNum(m.S[13].x, 3)], [`Potencia (ṁ = ${anatNum(B.mdot)} kg/s)`, `${anatNum(m.power, 1)} MW`]],
    },
  };
  for (let n = 1; n <= 13; n++) {
    const [titulo, texto] = ESTACION[n];
    partes[`e${n}`] = {
      grupo: `Estación ${n}`,
      titulo,
      funcion: texto,
      valores: (m) => {
        const s = m.S[n];
        const rows = [[`T<sub>${n}</sub>`, C(s.T), s.T > 500 ? "h" : "c"], [`p<sub>${n}</sub>`, pr(s.p)], [`h<sub>${n}</sub>`, kJ(s.h)]];
        if (s.s !== undefined && ![2, 4, 7, 8].includes(n)) rows.push([`s<sub>${n}</sub>`, `${anatNum(s.s, 4)} kJ/kg·K`]);
        rows.push(["Estado", s.x === null || s.x === undefined ? (s.T > 0 && [9, 10, 11, 12].includes(n) ? "vapor sobrecalentado" : "líquido comprimido") : s.x === 0 ? "líquido saturado" : `vapor húmedo, x = ${anatNum(s.x, 3)}`]);
        rows.push(["Fracción de caudal", anatNum(m.m[n], 4)]);
        return rows;
      },
    };
  }
  partes.e10.valores = (m) => {
    const s = m.S[10];
    return [["T₁₀", C(s.T), "h"], ["p₁₀", pr(s.p)], ["h₁₀", kJ(s.h)], ["Al calentador cerrado (y)", anatNum(m.y, 4)], ["Al recalentador (1 − y)", anatNum(1 - m.y, 4)]];
  };
  return {
    P: DATA.P,
    partes,
    inicial: "pal",
    control: { min: B.tMin, max: B.tMax, step: 5, valor: B.t, etiqueta: "Temperatura del vapor vivo", formato: (v) => `${anatNum(v)} °C` },
    modelo: (t) => rankine(t, B),
    lectura: (m, x) => `T₉ ${anatNum(x)} °C · η ${anatNum(m.eta * 100, 1)} % · ${anatNum(m.power, 1)} MW`,
    agujas: DATA.agujas.map((a) => ({ ...a, valor: (m) => m.S[a.n].T })),
    temperatura: (m, n) => m.S[Number(n)].T,
    tinte: [300, 900],
    brillo: (m, x) => 0.35 + (0.65 * (x - B.tMin)) / (B.tMax - B.tMin),
    palanca: DATA.palanca,
    tour: (t) => 540 + 70 * Math.sin((t / 9) * Math.PI),
    tourDesde: (x) => (9 / Math.PI) * Math.asin(Math.max(-1, Math.min(1, (x - 540) / 70))),
  };
};
