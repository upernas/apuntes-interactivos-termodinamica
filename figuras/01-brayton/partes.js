// Brayton cerrado · descripción de piezas y estaciones para el panel (se ejecuta en el navegador).
ANAT_FIGS["anat-brayton"] = () => {
  const B = DATA.base;
  const K = (t) => `${anatNum(t)} K`;
  const kPa = (p) => `${anatNum(p, p < 1000 ? 1 : 0)} kPa`;
  const kJ = (q) => `${anatNum(q, 1)} kJ/kg`;
  const pct = (x) => `${anatNum(x * 100, 1)} %`;
  const st = (m, n) => [`Estación ${n} · T<sub>${n}</sub> / p<sub>${n}</sub>`, `${K(m.T[n])} · ${kPa(m.p[n])}`];
  const ESTACION = {
    1: ["Salida del condensador · entrada al compresor BP", "Gas frío y a la presión baja del circuito; el compresor de baja lo aspira desde aquí."],
    2: ["Salida del compresor BP · entrada al refrigerador intermedio", "Gas comprimido en la primera etapa, ya caliente por la compresión."],
    3: ["Salida del refrigerador intermedio · entrada al compresor AP", "El refrigerador intermedio devuelve el gas a T₁ antes de la segunda compresión."],
    4: ["Salida del compresor AP · entrada al regenerador (lado frío)", "Gas a la presión alta del circuito, todavía relativamente frío."],
    5: ["Salida del regenerador · entrada a la caldera", "Gas precalentado con el escape de la turbina: la caldera aporta solo lo que falta hasta T₆."],
    6: ["Salida de la caldera · entrada a la turbina AP", "Temperatura máxima del ciclo, fijada por la palanca de combustible."],
    7: ["Salida de la turbina AP · entrada al recalentador", "Gas expandido hasta la presión intermedia; vuelve a la caldera para recalentarse."],
    8: ["Salida del recalentador · entrada a la turbina BP", "Recalentado de nuevo hasta T₈ = T₆ a presión intermedia."],
    9: ["Salida de la turbina BP · entrada al regenerador (lado caliente)", "Escape todavía caliente: su calor se recupera en el regenerador en vez de tirarse."],
    10: ["Salida del regenerador · entrada al condensador", "Gas ya enfriado por el regenerador; el condensador cede el resto al agua de refrigeración."],
  };
  const partes = {
    c1: {
      titulo: "Compresor de baja presión (C-BP)",
      funcion: "Primera etapa de compresión: eleva la presión del gas de p₁ a la presión intermedia √r<sub>p</sub>·p₁, de forma isentrópica.",
      valores: (m) => [st(m, 1), st(m, 2), ["Relación de presiones de la etapa", anatNum(m.rs, 3)], ["w<sub>C-BP</sub> = c<sub>p</sub>(T₂ − T₁)", kJ(m.wc1), "c"]],
    },
    ic: {
      titulo: "Refrigerador intermedio (intercooler)",
      funcion: "Enfría el gas entre las dos compresiones a presión constante. Comprimir gas frío cuesta menos trabajo: la compresión se acerca a una isoterma.",
      valores: (m) => [st(m, 2), st(m, 3), ["Calor cedido q<sub>IC</sub> = c<sub>p</sub>(T₂ − T₃)", kJ(m.qIc), "c"]],
    },
    c2: {
      titulo: "Compresor de alta presión (C-AP)",
      funcion: "Segunda etapa de compresión, desde la presión intermedia hasta r<sub>p</sub>·p₁. Con T₃ = T₁ y la misma relación por etapa, consume el mismo trabajo que el de baja.",
      valores: (m) => [st(m, 3), st(m, 4), ["w<sub>C-AP</sub> = c<sub>p</sub>(T₄ − T₃)", kJ(m.wc2), "c"], ["Trabajo total de compresión", kJ(m.wc)]],
    },
    reg: {
      titulo: "Regenerador",
      funcion: "Intercambiador a contracorriente: el escape de la turbina (9→10) calienta el gas comprimido (4→5) antes de la caldera. Ahorra combustible sin cambiar el trabajo neto.",
      valores: (m) => [st(m, 4), st(m, 5), st(m, 9), st(m, 10), ["Calor recuperado q<sub>reg</sub> = c<sub>p</sub>(T₅ − T₄)", kJ(m.qReg), "g"], ["Efectividad ε", anatNum(B.eps, 2)]],
    },
    cal: {
      titulo: "Caldera · calentador de gas",
      funcion: "Hogar con quemador: el gas de trabajo circula por un serpentín y recibe calor a presión constante sin mezclarse con los humos, que salen por la chimenea. Como el circuito es cerrado, el calor entra desde fuera.",
      valores: (m) => [st(m, 5), st(m, 6), ["q<sub>cal</sub> = c<sub>p</sub>(T₆ − T₅)", kJ(m.qCal), "h"], ["Calor total aportado q<sub>in</sub>", kJ(m.qin), "h"]],
    },
    rec: {
      titulo: "Recalentador (en la caldera)",
      funcion: "Segundo serpentín de la caldera: vuelve a calentar el gas entre las dos turbinas, a la presión intermedia, hasta T₈ = T₆. Aumenta el trabajo de expansión.",
      valores: (m) => [st(m, 7), st(m, 8), ["q<sub>rec</sub> = c<sub>p</sub>(T₈ − T₇)", kJ(m.qRec), "h"]],
    },
    t1: {
      titulo: "Turbina de alta presión (T-AP)",
      funcion: "Expansión isentrópica desde la presión máxima hasta la intermedia. Su trabajo, junto con el de la turbina de baja, mueve los compresores y el alternador.",
      valores: (m) => [st(m, 6), st(m, 7), ["w<sub>T-AP</sub> = c<sub>p</sub>(T₆ − T₇)", kJ(m.wt1), "h"]],
    },
    t2: {
      titulo: "Turbina de baja presión (T-BP)",
      funcion: "Segunda expansión, desde la presión intermedia hasta p₁, tras el recalentamiento. El escape (9) sale caliente hacia el regenerador.",
      valores: (m) => [st(m, 8), st(m, 9), ["w<sub>T-BP</sub> = c<sub>p</sub>(T₈ − T₉)", kJ(m.wt2), "h"], ["Trabajo total de turbinas", kJ(m.wt)]],
    },
    cond: {
      titulo: "Condensador (refrigerador de gas)",
      funcion: "Cierra el circuito: cede al agua de refrigeración el calor que queda en el gas y lo devuelve a T₁ antes del compresor.",
      nota: "<strong>Ojo:</strong> la asignatura lo llama «condensador», pero en un Brayton cerrado el gas de trabajo no condensa: no hay cambio de fase y la temperatura baja de forma continua (de T₁₀ a T₁). Es un refrigerador de gas, el equivalente al condensador de un ciclo Rankine.",
      valores: (m) => [st(m, 10), st(m, 1), ["Calor cedido q<sub>out</sub> = c<sub>p</sub>(T₁₀ − T₁)", kJ(m.qCond), "c"], ["Calor total cedido (con IC)", kJ(m.qCond + m.qIc), "c"]],
    },
    gen: {
      titulo: "Alternador",
      funcion: "Recibe por el eje el trabajo neto: lo que dan las turbinas menos lo que consumen los compresores.",
      valores: (m) => [["w<sub>neto</sub> = w<sub>T</sub> − w<sub>C</sub>", kJ(m.wnet), "g"], ["Rendimiento térmico η = w<sub>neto</sub>/q<sub>in</sub>", pct(m.eta), "g"], [`Potencia con ṁ = ${anatNum(B.mdot)} kg/s`, `${anatNum(m.power, 2)} MW`], ["Límite de Ericsson 1 − T₁/T₆", pct(1 - m.T[1] / m.T[6])]],
    },
    eje: {
      titulo: "Eje común y acoplamientos",
      funcion: "Une compresores, turbinas y alternador. Una parte del trabajo de las turbinas vuelve por el eje a los compresores (relación de trabajo de retroceso).",
      valores: (m) => [["w<sub>T</sub> turbinas", kJ(m.wt), "h"], ["w<sub>C</sub> compresores", kJ(m.wc), "c"], ["Relación de retroceso w<sub>C</sub>/w<sub>T</sub>", pct(m.bwr)]],
    },
    pal: {
      grupo: "Control",
      titulo: "Palanca de la válvula de combustible",
      funcion: "Regula el caudal de combustible del quemador y con él la temperatura de salida de caldera y recalentador (T₆ = T₈). Al abrirla sube T₆: aumentan el trabajo neto y el rendimiento.",
      valores: (m, x) => [["Consigna T₆ = T₈", K(x), "h"], ["q<sub>in</sub>", kJ(m.qin), "h"], ["Rendimiento térmico η", pct(m.eta), "g"], [`Potencia (ṁ = ${anatNum(B.mdot)} kg/s)`, `${anatNum(m.power, 2)} MW`]],
    },
  };
  for (let n = 1; n <= 10; n++) {
    const [titulo, texto] = ESTACION[n];
    partes[`e${n}`] = { grupo: `Estación ${n}`, titulo, funcion: texto, valores: (m) => [[`T<sub>${n}</sub>`, K(m.T[n]), m.T[n] > 600 ? "h" : "c"], [`p<sub>${n}</sub>`, kPa(m.p[n])], ["v = RT/p", `${anatNum((0.287 * m.T[n]) / m.p[n], 3)} m³/kg`], ["h − h(300 K) = c<sub>p</sub>(T − 300)", kJ(B.cp * (m.T[n] - 300))]] };
  }
  return {
    P: DATA.P,
    partes,
    inicial: "pal",
    control: { min: B.tMin, max: B.tMax, step: 10, valor: B.t6, etiqueta: "Temperatura de entrada a turbinas", formato: (v) => K(v) },
    modelo: (t6) => brayton(t6, B),
    lectura: (m, x) => `T₆ ${anatNum(x)} K · η ${anatNum(m.eta * 100, 1)} % · ${anatNum(m.power, 2)} MW`,
    agujas: DATA.agujas.map((a) => ({ ...a, valor: (m) => m.T[a.n] })),
    temperatura: (m, n) => m.T[Number(n)],
    tinte: [300, 1500],
    brillo: (m, x) => 0.35 + (0.65 * (x - B.tMin)) / (B.tMax - B.tMin),
    palanca: DATA.palanca,
    tour: (t) => 1200 + 250 * Math.sin((t / 9) * Math.PI),
    tourDesde: (x) => (9 / Math.PI) * Math.asin(Math.max(-1, Math.min(1, (x - 1200) / 250))),
  };
};
