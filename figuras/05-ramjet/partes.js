// Estatorreactor · descripción de piezas y estaciones para el panel (se ejecuta en el navegador).
ANAT_FIGS["anat-ramjet"] = () => {
  const B = DATA.base;
  const K = (t) => `${anatNum(t)} K`;
  const kPa = (p) => `${anatNum(p, p < 100 ? 1 : 0)} kPa`;
  const kJ = (q) => `${anatNum(q, 1)} kJ/kg`;
  const ms = (v) => `${anatNum(v)} m/s`;
  const pct = (x) => `${anatNum(x * 100, 1)} %`;
  const st = (m, n) => [`Estación ${n} · T / p`, `${K(m.T[n])} · ${kPa(m.p[n])}`];
  const ESTACION = {
    1: ["Entrada: corriente libre", "Aire a la altitud de vuelo, llegando a la velocidad del avión."],
    2: ["Salida del difusor", "El aire se ha frenado casi por completo: toda su energía cinética se ha convertido en presión y temperatura. Es la única «compresión» del motor."],
    3: ["Salida de la cámara de combustión", "Calentado a presión constante hasta T₃ = 2000 K."],
    4: ["Salida de la tobera", "Gas expandido hasta la presión ambiente y acelerado por encima de la velocidad de vuelo."],
  };
  const partes = {
    cono: {
      titulo: "Cono de admisión (cuerpo central)",
      funcion: "Genera ondas de choque oblicuas que empiezan a frenar el aire supersónico antes del labio; su posición ajusta la toma al Mach de diseño. Va fijo, sujeto por brazos: no gira.",
      valores: (m) => [st(m, 1), ["Mach de vuelo M₁", anatNum(m.M, 2)], ["Velocidad V₁", ms(m.V1)]],
    },
    dif: {
      titulo: "Difusor",
      funcion: "Conducto divergente que frena el aire tras las ondas de choque. Sustituye al compresor: la relación de presiones sale solo del Mach de vuelo.",
      valores: (m) => [st(m, 1), st(m, 2), ["Relación p₂/p₁", anatNum(m.p[2] / m.p[1], 1), "g"], ["Caudal captado ṁ", `${anatNum(m.mdot, 1)} kg/s`]],
    },
    iny: { titulo: "Barras de inyección", funcion: "Pulverizan el combustible en la corriente ya subsónica, aguas arriba del estabilizador.", valores: (m) => [["Dosado f = q<sub>in</sub>/PCI", anatNum(m.f, 4)], ["Combustible", `${anatNum(m.mdot * m.f, 2)} kg/s`]] },
    est: { titulo: "Estabilizador de llama en V", funcion: "Crea una zona de recirculación detrás de la V donde la llama se ancla sin ser arrastrada por la corriente.", valores: (m) => [st(m, 2)] },
    cam: {
      titulo: "Cámara de combustión",
      funcion: "Calienta el aire a presión constante (p₃ = p₂) hasta 2000 K.",
      valores: (m) => [st(m, 2), st(m, 3), ["q<sub>in</sub> = c<sub>p</sub>(T₃ − T₂)", kJ(m.qin), "h"]],
    },
    tob: {
      titulo: "Tobera convergente-divergente",
      funcion: "Acelera los gases hasta la presión ambiente; en la garganta se alcanza M = 1 y en la parte divergente el chorro sigue acelerando en supersónico.",
      valores: (m) => [st(m, 3), st(m, 4), ["Velocidad del chorro V₄", ms(m.V4), "h"], ["Mach de salida M₄", anatNum(m.M4, 2)]],
    },
    aire: { grupo: "Flujo", titulo: "Aire de entrada", funcion: "Llega a la velocidad de vuelo y sale del difusor casi parado.", valores: (m) => [["V₁", ms(m.V1), "c"], ["ṁ", `${anatNum(m.mdot, 1)} kg/s`]] },
    gas: { grupo: "Flujo", titulo: "Gases de escape", funcion: "Salen más rápido de lo que entró el aire: esa diferencia de velocidad es el empuje.", valores: (m) => [["V₄", ms(m.V4), "h"], ["V₄ − V₁", ms(m.V4 - m.V1), "h"]] },
    tunel: { titulo: "Tobera del túnel de chorro libre", funcion: "Reproduce en el banco la corriente supersónica del vuelo, al Mach que fija el volante.", valores: (m) => [["Mach de la corriente", anatNum(m.M, 2)], st(m, 1)] },
    banco: {
      titulo: "Banco de empuje",
      funcion: "El motor va sobre un carro con patines; el empuje lo empuja hacia la corriente y la célula de carga lo mide.",
      valores: (m) => [["Empuje F = ṁ(V₄ − V₁)", `${anatNum(m.F, 1)} kN`, "g"], ["Empuje específico", `${anatNum(m.Fs)} N·s/kg`], ["Consumo específico", `${anatNum(m.tsfc, 1)} g/(kN·s)`]],
    },
    vol: {
      grupo: "Control",
      titulo: "Volante de régimen (garganta variable del túnel)",
      funcion: "Cambia el área de garganta de la tobera del túnel y con ella el Mach de la corriente. Cuanto más rápido se vuela, más comprime el difusor y mayor es el rendimiento térmico.",
      valores: (m, x) => [["Mach de vuelo", anatNum(x, 2)], ["η<sub>th</sub> = 1 − T₁/T₂", pct(m.etaTh), "g"], ["η<sub>p</sub> = 2V₁/(V₁ + V₄)", pct(m.etaP)], ["η<sub>global</sub>", pct(m.eta), "g"], ["Empuje", `${anatNum(m.F, 1)} kN`]],
    },
  };
  for (let n = 1; n <= 4; n++) {
    const [titulo, texto] = ESTACION[n];
    partes[`e${n}`] = { grupo: `Estación ${n}`, titulo, funcion: texto, valores: (m) => [[`T<sub>${n}</sub>`, K(m.T[n]), m.T[n] > 900 ? "h" : "c"], [`p<sub>${n}</sub>`, kPa(m.p[n])]] };
  }
  return {
    P: DATA.P,
    partes,
    inicial: "vol",
    control: { min: B.mMin, max: B.mMax, step: 0.05, valor: B.m0, etiqueta: "Número de Mach de vuelo", formato: (v) => `M ${anatNum(v, 2)}` },
    modelo: (M) => ramjet(M, B),
    lectura: (m, x) => `M ${anatNum(x, 2)} · F ${anatNum(m.F, 1)} kN · η ${anatNum(m.eta * 100, 1)} %`,
    agujas: DATA.agujas.map((a) => ({ ...a, valor: a.id === "empuje" ? (m) => m.F : (m) => m.T[a.n] })),
    temperatura: () => 300,
    tinte: [300, 1500],
    brillo: () => 1,
    rotores: [{ sel: '[data-rotor="volante"]', ...DATA.volante, fase: (m, x) => (x - B.mMin) * 2.6 }],
    flujos: [
      { sel: '[data-flujo="frio"] [data-flow]', velocidad: (m) => m.V1 / 30 },
      { sel: '[data-flujo="caliente"] [data-flow]', velocidad: (m) => m.V4 / 30 },
    ],
    tour: (t) => 2.9 + 1.2 * Math.sin((t / 9) * Math.PI),
    tourDesde: (x) => (9 / Math.PI) * Math.asin(Math.max(-1, Math.min(1, (x - 2.9) / 1.2))),
  };
};
