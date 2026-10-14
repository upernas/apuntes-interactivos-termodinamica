// Turboeje · descripción de piezas y estaciones para el panel (se ejecuta en el navegador).
ANAT_FIGS["anat-turboeje"] = () => {
  const B = DATA.base;
  const K = (t) => `${anatNum(t)} K`;
  const kPa = (p) => `${anatNum(p, 1)} kPa`;
  const kJ = (q) => `${anatNum(q, 1)} kJ/kg`;
  const MW = (x) => `${anatNum(x, 2)} MW`;
  const pct = (x) => `${anatNum(x * 100, 1)} %`;
  const st = (m, n) => [`Estación ${n} · T / p`, `${K(m.T[n])} · ${kPa(m.p[n])}`];
  const ESTACION = {
    1: ["Entrada al compresor", "Aire ambiente que entra por la rejilla trasera; en banco no hay compresión dinámica."],
    2: ["Salida del compresor", "Presión máxima del ciclo; el aire gira 180° y entra en la cámara de flujo invertido."],
    3: ["Salida de la cámara · entrada a la turbina del compresor", "Temperatura máxima, fijada por la palanca de potencia."],
    4: ["Salida de la turbina del compresor", "El generador de gas ya se ha cobrado el trabajo del compresor; el gas aún tiene presión y temperatura altas."],
    5: ["Salida de la turbina libre", "La turbina libre ha extraído casi toda la energía disponible: solo queda la presión justa para la tobera."],
    6: ["Salida de la tobera de escape", "Los gases salen a p₀ despacio: su energía ya está en el eje."],
  };
  const partes = {
    freno: {
      titulo: "Freno dinamométrico",
      funcion: "Absorbe la potencia del eje (en un freno hidráulico, agitando agua) y la convierte en calor. Su carcasa tiende a girar con el rotor: el brazo de reacción apoyado en la célula de carga mide ese par.",
      valores: (m) => [["Potencia absorbida", MW(m.potencia), "g"], ["Par medido", `${anatNum(m.par, 2)} kN·m`], ["Régimen del eje", `${anatNum(m.rpmSalida)} rpm`]],
    },
    eje: {
      titulo: "Eje de salida",
      funcion: "Lleva la potencia del reductor al consumidor. En un helicóptero es la entrada de la transmisión principal del rotor; aquí, la del freno.",
      valores: (m) => [["Potencia en el eje P = ṁ·w<sub>TL</sub>", MW(m.potencia), "g"], ["Par M = P/ω", `${anatNum(m.par, 2)} kN·m`], ["Régimen", `${anatNum(m.rpmSalida)} rpm`]],
    },
    red: {
      titulo: "Reductor de salida",
      funcion: "Baja las revoluciones de la turbina libre a las del eje de salida y multiplica el par en la misma proporción (sin pérdidas, la potencia se conserva).",
      valores: (m) => [["Relación de reducción", `${anatNum(B.reduccion, 1)} : 1`], ["Turbina libre → eje", `${anatNum(m.rpmTurbina)} → ${anatNum(m.rpmSalida)} rpm`], ["Potencia transmitida", MW(m.potencia), "g"]],
    },
    esc: {
      titulo: "Caja de escape y tobera lateral",
      funcion: "Recoge el gas que sale de la turbina libre y lo expulsa por la tobera lateral; la turbina libre ya ha cogido casi toda su energía.",
      valores: (m) => [st(m, 5), st(m, 6), ["Velocidad de salida V₆", `${anatNum(m.V6)} m/s`, "h"]],
    },
    tl: {
      titulo: "Turbina libre (de potencia)",
      funcion: "Está en un eje propio, sin unión mecánica con el generador de gas: el gas la mueve como un fluido mueve un molinete. Su trabajo va entero al reductor y al eje de salida.",
      valores: (m) => [st(m, 4), st(m, 5), ["w<sub>TL</sub> = c<sub>p</sub>(T₄ − T₅)", kJ(m.wtl), "h"], ["Potencia en el eje P = ṁ·w<sub>TL</sub>", MW(m.potencia), "g"]],
    },
    tc: {
      titulo: "Turbina del compresor",
      funcion: "Primera turbina, unida al compresor por el eje del generador de gas: extrae exactamente el trabajo que este consume.",
      valores: (m) => [st(m, 3), st(m, 4), ["w<sub>TC</sub> = w<sub>C</sub>", kJ(m.wc), "h"]],
    },
    cam: {
      titulo: "Cámara de combustión de flujo invertido",
      funcion: "El aire del compresor da la vuelta y entra en el tubo de llama, donde los inyectores añaden el combustible; calienta a presión constante.",
      valores: (m) => [st(m, 2), st(m, 3), ["q<sub>in</sub> = c<sub>p</sub>(T₃ − T₂)", kJ(m.qin), "h"], ["Dosado f", anatNum(m.f, 4)]],
    },
    comp: {
      titulo: "Compresor axial",
      funcion: "Escalonamientos de rotor y estátor que elevan la presión del aire desde la toma hasta la cámara.",
      valores: (m) => [st(m, 1), st(m, 2), ["Relación de presiones π<sub>C</sub>", anatNum(B.pic)], ["w<sub>C</sub> = c<sub>p</sub>(T₂ − T₁)", kJ(m.wc), "c"]],
    },
    toma: {
      titulo: "Toma trasera con rejilla",
      funcion: "El aire entra radialmente por la rejilla, que impide el paso de objetos, y se frena al llegar al compresor.",
      valores: (m) => [st(m, 0), st(m, 1), ["Caudal ṁ", `${anatNum(m.mdot, 1)} kg/s`, "c"]],
    },
    agb: { titulo: "Caja de accesorios", funcion: "Engranajes movidos por el generador de gas que arrastran el motor de arranque-generador, la bomba y el regulador de combustible.", valores: (m) => [["Caudal de combustible", `${anatNum(m.mdot * m.f * 3600)} kg/h`]] },
    car: { titulo: "Carcasa del generador de gas", funcion: "Envuelve compresor, cámara y turbinas; aquí está cortada para ver el interior. Las patas apoyan el motor en la cuna.", valores: (m) => [["Rendimiento térmico η<sub>th</sub>", pct(m.etaTh), "g"], ["Consumo específico", `${anatNum(m.bsfc)} g/kWh`]] },
    aire: { grupo: "Flujo", titulo: "Aire de entrada", funcion: "Entra por la rejilla trasera y avanza hacia delante a través del motor.", valores: (m) => [["Caudal ṁ", `${anatNum(m.mdot)} kg/s`, "c"], st(m, 1)] },
    gas: { grupo: "Flujo", titulo: "Gases de escape", funcion: "Salen por la tobera lateral muy despacio: en un turboeje no se busca empuje, toda la energía posible se convierte en potencia de eje.", valores: (m) => [["V₆", `${anatNum(m.V6)} m/s`, "h"], ["T₆", K(m.T[6]), "h"]] },
    pal: {
      grupo: "Control",
      titulo: "Palanca de potencia",
      funcion: "Fija el combustible y con él T₃. Más T₃ significa más energía para la turbina libre y más potencia en el eje; el regulador mantiene constante el régimen de salida.",
      valores: (m, x) => [["Consigna T₃", K(x), "h"], ["Potencia en el eje", MW(m.potencia), "g"], ["Par de salida", `${anatNum(m.par, 2)} kN·m`], ["Rendimiento térmico (eje)", pct(m.etaTh), "g"], ["Consumo específico", `${anatNum(m.bsfc)} g/kWh`]],
    },
  };
  for (let n = 1; n <= 6; n++) {
    const [titulo, texto] = ESTACION[n];
    partes[`e${n}`] = { grupo: `Estación ${n}`, titulo, funcion: texto, valores: (m) => [[`T<sub>${n}</sub>`, K(m.T[n]), m.T[n] > 600 ? "h" : "c"], [`p<sub>${n}</sub>`, kPa(m.p[n])]] };
  }
  return {
    P: DATA.P,
    partes,
    inicial: "pal",
    control: { min: B.tMin, max: B.tMax, step: 10, valor: B.t3, etiqueta: "Temperatura de entrada a turbina", formato: (v) => K(v) },
    modelo: (t) => turboeje(t, B),
    lectura: (m, x) => `T₃ ${anatNum(x)} K · ${anatNum(m.potencia, 2)} MW · ${anatNum(m.par, 2)} kN·m`,
    agujas: DATA.agujas.map((a) => ({ ...a, valor: a.id === "par" ? (m) => m.par : (m) => m.T[a.n] })),
    temperatura: () => 300,
    tinte: [300, 1500],
    brillo: () => 1,
    palanca: DATA.palanca,
    flujos: [
      { sel: '[data-flujo="frio"] [data-flow]', velocidad: () => 8 },
      { sel: '[data-flujo="caliente"] [data-flow]', velocidad: (m) => m.V6 / 10 },
    ],
    tour: (t) => 1300 + 180 * Math.sin((t / 9) * Math.PI),
    tourDesde: (x) => (9 / Math.PI) * Math.asin(Math.max(-1, Math.min(1, (x - 1300) / 180))),
  };
};
