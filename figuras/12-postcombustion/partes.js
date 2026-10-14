// Turborreactor con postcombustión · descripción de piezas y estaciones para el panel (se ejecuta en el navegador).
ANAT_FIGS["anat-postcombustion"] = () => {
  const B = DATA.base;
  const K = (t) => `${anatNum(t)} K`;
  const kPa = (p) => `${anatNum(p, 1)} kPa`;
  const kJ = (q) => `${anatNum(q, 1)} kJ/kg`;
  const ms = (v) => `${anatNum(v)} m/s`;
  const pct = (x) => `${anatNum(x * 100, 1)} %`;
  const st = (m, n) => [`Estación ${n} · T / p`, `${K(m.T[n])} · ${kPa(m.p[n])}`];
  const ESTACION = {
    1: ["Entrada al compresor", "Aire frenado por la toma: la presión dinámica del vuelo se convierte en presión (compresión dinámica)."],
    2: ["Salida del compresor", "Máxima presión del ciclo; el aire entra en la cámara de combustión."],
    3: ["Salida de la cámara · entrada a la turbina", "Temperatura máxima del ciclo, fijada por la palanca de gases."],
    4: ["Salida de la turbina", "La turbina ha extraído solo el trabajo del compresor; el gas aún está caliente y a presión."],
    5: ["Salida del postquemador", "Gas recalentado a presión constante: la temperatura máxima del motor, aunque no pase por ninguna turbina."],
    6: ["Salida de la tobera", "El gas se expande hasta p₀ y sale a la velocidad del chorro V_j, mucho mayor que en seco."],
  };
  const partes = {
    toma: { titulo: "Toma de aire y difusor", funcion: "Frena el aire que llega a la velocidad de vuelo y lo entrega al compresor con más presión y temperatura (0 → 1). La ojiva y los álabes guía lo orientan hacia el primer escalonamiento.", valores: (m) => [["Vuelo M₀ · V₀", `${anatNum(B.M0, 2)} · ${ms(m.V0)}`], st(m, 0), st(m, 1), ["Relación p₁/p₀", anatNum(m.p[1] / m.p[0], 3)]] },
    comp: { titulo: "Compresor axial", funcion: "Escalonamientos de rotor y estátor que comprimen todo el caudal hasta la presión máxima.", valores: (m) => [st(m, 1), st(m, 2), ["w<sub>C</sub> = c<sub>p</sub>(T₂ − T₁)", kJ(m.wc), "c"], ["Relación de presiones π<sub>C</sub>", anatNum(B.pic)]] },
    cam: { titulo: "Cámara de combustión anular", funcion: "Los inyectores pulverizan combustible en el tubo de llama; el aire se calienta a presión constante hasta T₃.", valores: (m) => [st(m, 2), st(m, 3), ["q<sub>in</sub> = c<sub>p</sub>(T₃ − T₂)", kJ(m.qin), "h"], ["Dosado f", anatNum(m.f, 4)]] },
    turb: { titulo: "Turbina", funcion: "Extrae del gas exactamente el trabajo que consume el compresor (w<sub>T</sub> = w<sub>C</sub>). El resto de la energía queda para la tobera.", valores: (m) => [st(m, 3), st(m, 4), ["w<sub>T</sub> = w<sub>C</sub>", kJ(m.wt), "h"], ["Relación p₃/p₄", anatNum(m.p[3] / m.p[4], 2)]] },
    pc: { titulo: "Postquemador", funcion: "Conducto tras la turbina con barras de inyección y estabilizadores de llama en V: crean una zona de baja velocidad donde la llama se mantiene. Recalienta el gas a presión constante, sin turbina detrás.", valores: (m) => [st(m, 4), st(m, 5), ["q<sub>pc</sub> = c<sub>p</sub>(T₅ − T₄)", kJ(m.qpc), "h"], ["Dosado extra f<sub>pc</sub>", anatNum(m.fpc, 4)]] },
    tob: { titulo: "Tobera convergente-divergente variable", funcion: "Los pétalos, movidos por los actuadores, abren la garganta al encender la postcombustión para que el gas, más caliente y menos denso, salga sin subir la contrapresión sobre la turbina.", valores: (m) => [st(m, 5), st(m, 6), ["Velocidad del chorro V_j", ms(m.Vj), "h"], ["Empuje F", `${anatNum(m.F, 1)} kN`, "g"], ["Empuje en seco", `${anatNum(m.seco.F, 1)} kN`]] },
    eje: { titulo: "Eje", funcion: "Une turbina y compresor en un solo eje.", valores: (m) => [["w<sub>T</sub> = w<sub>C</sub>", kJ(m.wc)]] },
    car: { titulo: "Carcasa", funcion: "Envuelve compresor, cámara y turbina; aquí está cortada para ver el interior. Las patas apoyan el motor en la cuna.", valores: (m) => [["Rendimiento térmico η<sub>th</sub>", pct(m.etaTh), "g"], ["η<sub>th</sub> en seco", pct(m.seco.etaTh)]] },
    aire: { grupo: "Flujo", titulo: "Aire de entrada", funcion: "Todo el aire que entra pasa por el núcleo: no hay flujo de derivación.", valores: (m) => [["Caudal ṁ", `${anatNum(m.mdot)} kg/s`, "c"], ["V₀", ms(m.V0), "c"]] },
    chorro: { grupo: "Flujo", titulo: "Chorro", funcion: "Gas caliente que sale mucho más rápido que el avión. Cuanto mayor es V_j/V₀, más empuje por kilo de aire pero peor rendimiento propulsivo.", valores: (m) => [["V_j", ms(m.Vj), "h"], ["V_j − V₀", ms(m.Vj - m.V0), "h"], ["Rendimiento propulsivo η<sub>p</sub>", pct(m.etaP), "g"]] },
    cuna: { titulo: "Cuna de transporte", funcion: "Soporta el motor por la carcasa mientras está en el banco.", valores: (m) => [["Empuje F", `${anatNum(m.F, 1)} kN`, "g"]] },
    pal: {
      grupo: "Control",
      titulo: "Palanca de postcombustión",
      funcion: "Más allá del tope de gases (T₃ fija) se enciende el postquemador: la palanca fija cuánto se recalienta el gas. El empuje sube, pero el consumo específico sube aún más: solo se usa en despegue y combate.",
      valores: (m, x) => [["Postcombustión", `${anatNum(x)} % · T₅ = ${K(m.T[5])}`, "h"], ["Empuje F", `${anatNum(m.F, 1)} kN (+${anatNum((m.F / m.seco.F - 1) * 100)} % sobre seco)`, "g"], ["Consumo específico TSFC", `${anatNum(m.tsfc, 1)} g/(kN·s)`], ["TSFC en seco", `${anatNum(m.seco.tsfc, 1)} g/(kN·s)`], ["η<sub>th</sub> · η<sub>p</sub>", `${pct(m.etaTh)} · ${pct(m.etaP)}`]],
    },
  };
  for (let n = 1; n <= 6; n++) {
    const [titulo, texto] = ESTACION[n];
    partes[`e${n}`] = { grupo: `Estación ${n}`, titulo, funcion: texto, valores: (m) => [[`T<sub>${n}</sub>`, K(m.T[n]), m.T[n] > 600 ? "h" : "c"], [`p<sub>${n}</sub>`, kPa(m.p[n])], ...(n === 6 ? [["V_j", ms(m.Vj), "h"]] : [])] };
  }
  return {
    P: DATA.P,
    partes,
    inicial: "pal",
    control: { min: 0, max: 100, step: 5, valor: 60, etiqueta: "Postcombustión", formato: (v) => `${anatNum(v)} %` },
    modelo: (x) => postcombustion(x, B),
    lectura: (m) => `T₅ ${anatNum(m.T[5])} K · F ${anatNum(m.F, 1)} kN · TSFC ${anatNum(m.tsfc, 1)} g/(kN·s)`,
    agujas: DATA.agujas.map((a) => ({ ...a, valor: a.id === "empuje" ? (m) => m.F : (m) => m.T[a.n] })),
    temperatura: () => 300,
    tinte: [300, 1500],
    brillo: (m, x) => Math.min(1, x / 40),
    palanca: DATA.palanca,
    flujos: [
      { sel: '[data-flujo="frio"] [data-flow]', velocidad: (m) => m.V0 / 14 },
      { sel: '[data-flujo="caliente"] [data-flow]', velocidad: (m) => m.Vj / 14 },
    ],
    tour: (t) => 50 + 50 * Math.sin((t / 9) * Math.PI),
    tourDesde: (x) => (9 / Math.PI) * Math.asin(Math.max(-1, Math.min(1, (x - 50) / 50))),
  };
};
