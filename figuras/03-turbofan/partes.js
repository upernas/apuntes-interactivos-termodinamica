// Turbofán · descripción de piezas y estaciones para el panel (se ejecuta en el navegador).
ANAT_FIGS["anat-turbofan"] = () => {
  const B = DATA.base;
  const K = (t) => `${anatNum(t)} K`;
  const kPa = (p) => `${anatNum(p, 1)} kPa`;
  const kJ = (q) => `${anatNum(q, 1)} kJ/kg`;
  const ms = (v) => `${anatNum(v)} m/s`;
  const pct = (x) => `${anatNum(x * 100, 1)} %`;
  const st = (m, n) => [`Estación ${n} · T / p`, `${K(m.T[n])} · ${kPa(m.p[n])}`];
  const ESTACION = {
    1: ["Entrada al fan", "Aire frenado por la toma: la presión dinámica del vuelo se convierte en presión (compresión dinámica)."],
    2: ["Salida del fan", "Aquí el aire se divide: BPR partes van al conducto de derivación (flujo frío) y una al núcleo."],
    3: ["Salida del compresor", "Máxima presión del ciclo; el aire entra en la cámara de combustión."],
    4: ["Salida de la cámara · entrada a la turbina", "Temperatura máxima del ciclo, fijada por la palanca de gases."],
    5: ["Salida de la turbina", "La turbina ha extraído justo el trabajo que piden el fan y el compresor; el resto de energía se usa en la tobera."],
    6: ["Salida de la tobera caliente", "El gas del núcleo se expande hasta p₀ y sale rápido: aporta el empuje del flujo caliente."],
    7: ["Salida de la tobera fría", "El aire de derivación sale a p₀, más despacio pero en mucha mayor cantidad."],
  };
  const partes = {
    toma: {
      titulo: "Toma de aire (difusor)",
      funcion: "Frena el aire que llega a la velocidad de vuelo y lo lleva al fan con más presión y temperatura (proceso isentrópico de 0 a 1).",
      valores: (m) => [["Vuelo M₀ · V₀", `${anatNum(B.M0, 2)} · ${ms(m.V0)}`], st(m, 0), st(m, 1), ["Relación p₁/p₀", anatNum(m.p[1] / m.p[0], 3)]],
    },
    fan: {
      titulo: "Fan",
      funcion: "Primer escalón de compresión, de gran diámetro: comprime poco (π = 1,6) un caudal enorme. La mayor parte de ese aire no entra en el núcleo.",
      valores: (m) => [st(m, 1), st(m, 2), ["Trabajo del fan (por kg de núcleo)", kJ(m.wf), "c"], ["Caudal total", `${anatNum(m.mtot)} kg/s`]],
    },
    comp: {
      titulo: "Compresor (baja + alta presión)",
      funcion: "Escalonamientos de álabes que comprimen solo el aire del núcleo hasta la presión máxima.",
      valores: (m) => [st(m, 2), st(m, 3), ["w<sub>C</sub> = c<sub>p</sub>(T₃ − T₂)", kJ(m.wc), "c"], ["Relación global p₃/p₁", anatNum(m.p[3] / m.p[1], 1)]],
    },
    cam: {
      titulo: "Cámara de combustión anular",
      funcion: "Los inyectores pulverizan combustible en el tubo de llama; el aire se calienta a presión constante hasta T₄.",
      valores: (m) => [st(m, 3), st(m, 4), ["q<sub>in</sub> = c<sub>p</sub>(T₄ − T₃)", kJ(m.qin), "h"], ["Dosado f = ṁ<sub>comb</sub>/ṁ<sub>aire</sub>", anatNum(m.f, 4)]],
    },
    turb: {
      titulo: "Turbina",
      funcion: "Extrae del gas caliente exactamente el trabajo que consumen el fan y el compresor: w<sub>T</sub> = w<sub>C</sub> + w<sub>fan</sub>.",
      valores: (m) => [st(m, 4), st(m, 5), ["w<sub>T</sub>", kJ(m.wt), "h"], ["Relación p₄/p₅", anatNum(m.p[4] / m.p[5], 2)]],
    },
    tob: {
      titulo: "Tobera caliente (núcleo)",
      funcion: "Convierte la entalpía que queda tras la turbina en velocidad del chorro caliente.",
      valores: (m) => [st(m, 5), st(m, 6), ["Velocidad del chorro V₆", ms(m.V6), "h"]],
    },
    fria: {
      titulo: "Tobera fría (derivación)",
      funcion: "Expande el aire del fan que rodea el núcleo; sale más lento que el caliente pero es BPR veces más masa.",
      valores: (m) => [st(m, 2), st(m, 7), ["Velocidad del chorro V₇", ms(m.V7), "c"], ["Relación de derivación BPR", anatNum(B.bpr)]],
    },
    ff: {
      grupo: "Flujo",
      titulo: "Flujo frío (derivación)",
      funcion: "Aire que solo pasa por el fan. Al acelerar mucha masa con poca diferencia de velocidad, el rendimiento propulsivo es alto.",
      valores: (m) => [["Caudal", `${anatNum(m.mcore * B.bpr)} kg/s`, "c"], ["V₇ − V₀", ms(m.V7 - m.V0), "c"], ["Empuje del flujo frío", `${anatNum((m.mcore * B.bpr * (m.V7 - m.V0)) / 1000, 1)} kN`], ["Parte del empuje total", pct((B.bpr * (m.V7 - m.V0)) / m.Fs)]],
    },
    fc: {
      grupo: "Flujo",
      titulo: "Flujo caliente (núcleo)",
      funcion: "Aire que pasa por compresor, cámara y turbina. Sale mucho más rápido: aporta empuje pero con peor rendimiento propulsivo.",
      valores: (m) => [["Caudal", `${anatNum(m.mcore)} kg/s`, "h"], ["V₆ − V₀", ms(m.V6 - m.V0), "h"], ["Empuje del flujo caliente", `${anatNum((m.mcore * (m.V6 - m.V0)) / 1000, 1)} kN`], ["Parte del empuje total", pct((m.V6 - m.V0) / m.Fs)]],
    },
    nac: {
      titulo: "Góndola y brazos del conducto frío",
      funcion: "Carenado exterior que forma el conducto de derivación; los brazos unen el núcleo con la carcasa del fan.",
      valores: (m) => [["Empuje total F", `${anatNum(m.F, 1)} kN`, "g"], ["Empuje específico F/ṁ<sub>total</sub>", `${anatNum((m.Fs / (1 + B.bpr)), 1)} N·s/kg`]],
    },
    car: {
      titulo: "Carcasa del núcleo",
      funcion: "Envuelve compresor, cámara y turbina; por fuera es la pared interior del conducto de derivación.",
      valores: (m) => [st(m, 3), st(m, 4), ["Rendimiento térmico η<sub>th</sub> = 1 − T₀/T₃", pct(m.etaTh), "g"]],
    },
    eje: {
      titulo: "Eje",
      funcion: "Transmite el trabajo de la turbina al fan y al compresor (en un motor real hay dos o tres ejes concéntricos).",
      valores: (m) => [["w<sub>T</sub> = w<sub>C</sub> + w<sub>fan</sub>", kJ(m.wt)], ["w<sub>fan</sub>", kJ(m.wf)], ["w<sub>C</sub>", kJ(m.wc)]],
    },
    cuna: { titulo: "Cuna de transporte", funcion: "Soporta el motor por la góndola mientras está en el banco.", valores: (m) => [["Empuje total F", `${anatNum(m.F, 1)} kN`, "g"]] },
    pal: {
      grupo: "Control",
      titulo: "Palanca de gases",
      funcion: "Fija el combustible inyectado y con él T₄. Más T₄: más empuje y más consumo, y el chorro caliente sale más rápido, así que baja el rendimiento propulsivo.",
      valores: (m, x) => [["Consigna T₄", K(x), "h"], ["Empuje F", `${anatNum(m.F, 1)} kN`, "g"], ["Consumo específico TSFC", `${anatNum(m.tsfc, 1)} g/(kN·s)`], ["η<sub>th</sub> · η<sub>p</sub> · η<sub>global</sub>", `${pct(m.etaTh)} · ${pct(m.etaP)} · ${pct(m.eta)}`]],
    },
  };
  for (let n = 1; n <= 7; n++) {
    const [titulo, texto] = ESTACION[n];
    partes[`e${n}`] = {
      grupo: `Estación ${n}`,
      titulo,
      funcion: texto,
      valores: (m) => {
        const rows = [[`T<sub>${n}</sub>`, K(m.T[n]), m.T[n] > 600 ? "h" : "c"], [`p<sub>${n}</sub>`, kPa(m.p[n])]];
        if (n === 6) rows.push(["V₆", ms(m.V6), "h"]);
        if (n === 7) rows.push(["V₇", ms(m.V7), "c"]);
        return rows;
      },
    };
  }
  return {
    P: DATA.P,
    partes,
    inicial: "pal",
    control: { min: B.tMin, max: B.tMax, step: 10, valor: B.t4, etiqueta: "Temperatura de entrada a turbina", formato: (v) => K(v) },
    modelo: (t) => turbofan(t, B),
    lectura: (m, x) => `T₄ ${anatNum(x)} K · F ${anatNum(m.F, 1)} kN · η_p ${anatNum(m.etaP * 100, 1)} %`,
    agujas: DATA.agujas.map((a) => ({ ...a, valor: a.id === "empuje" ? (m) => m.F : (m) => m.T[a.n] })),
    temperatura: () => 300,
    tinte: [300, 1500],
    brillo: () => 1,
    palanca: DATA.palanca,
    rotores: [{ sel: '[data-rotor="fan"]', ...DATA.fan, vueltas: (m, x) => 0.12 + (0.35 * (x - B.tMin)) / (B.tMax - B.tMin) }],
    flujos: [
      { sel: '[data-flujo="frio"] [data-flow]', velocidad: (m) => m.V7 / 14 },
      { sel: '[data-flujo="caliente"] [data-flow]', velocidad: (m) => m.V6 / 14 },
    ],
    tour: (t) => 1425 + 225 * Math.sin((t / 9) * Math.PI),
    tourDesde: (x) => (9 / Math.PI) * Math.asin(Math.max(-1, Math.min(1, (x - 1425) / 225))),
  };
};
