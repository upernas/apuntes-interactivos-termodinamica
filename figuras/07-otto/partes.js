// Motor Otto turbo · descripción de piezas y estaciones (se ejecuta en el navegador).
ANAT_FIGS["anat-otto"] = () => {
  const B = DATA.base;
  const anim = motorAnimacion(DATA, "otto");
  const K = (t) => `${anatNum(t)} K`;
  const bar = (p) => `${anatNum(p / 100, 2)} bar`;
  const MPa = (p) => `${anatNum(p / 1000, 2)} MPa`;
  const kJ = (q) => `${anatNum(q, 1)} kJ/kg`;
  const pct = (x) => `${anatNum(x * 100, 1)} %`;
  const st = (m, n) => [`Estado ${n} · T / p`, `${K(m.T[n])} · ${MPa(m.p[n])}`];
  const fig = (m) => cifras(m, B);
  const partes = {
    piston: { titulo: "Pistón", funcion: "Recorre el cilindro entre el PMS y el PMI. En el ciclo ideal comprime el aire (1→2) y recibe el trabajo de la expansión (3→4).", valores: (m) => [["Tiempo actual", anim.fase()], ["Presión en el cilindro", MPa(anim.presion()), "h"], st(m, 2), st(m, 3)] },
    biela: { titulo: "Biela", funcion: "Convierte el movimiento rectilíneo del pistón en giro del cigüeñal.", valores: (m) => [["Presión sobre el pistón", MPa(anim.presion()), "h"], ["Presión media indicada", MPa(fig(m).pmi * 1000)]] },
    cig: { titulo: "Cigüeñal", funcion: "Recoge el trabajo de los cuatro cilindros. En un motor de cuatro tiempos da dos vueltas por cada ciclo.", valores: (m) => [["Régimen", `${B.rpm} rpm`], ["Potencia indicada", `${anatNum(fig(m).potencia, 0)} kW`, "g"]] },
    bloque: { titulo: "Bloque y cárter", funcion: "Aloja los cilindros y el cigüeñal. Aquí está cortado por el plano medio de los cuatro cilindros: la línea discontinua marca la mitad retirada, y se ven los pistones, que siguen el orden de encendido 1-3-4-2.", valores: (m) => [["Cilindrada", `${anatNum(B.cil * B.vd * 1000, 1)} L (${B.cil} × ${anatNum(B.vd * 1000, 1)} L)`], ["Relación de compresión r", anatNum(B.r)]] },
    culata: { titulo: "Culata", funcion: "Cierra los cilindros por arriba: forma la cámara de combustión y lleva válvulas, colectores y bujías.", valores: (m) => [["Volumen de la cámara", `${anatNum((B.vd * 1e6) / (B.r - 1), 1)} cm³ por cilindro`]] },
    encendido: { titulo: "Bujías", funcion: "Hacen saltar la chispa al final de la compresión: el aporte de calor ideal 2→3 es instantáneo, a volumen constante.", valores: (m) => [st(m, 2), st(m, 3), ["q<sub>in</sub> (isócoro) = c<sub>v</sub>(T₃ − T₂)", kJ(m.qin), "h"]] },
    admision: { titulo: "Colector de admisión y mariposa", funcion: "Reparte el aire sobrealimentado y enfriado entre los cilindros. En un Otto la mariposa regula la carga.", valores: (m) => [st(m, 1), ["Masa por cilindro y ciclo", `${anatNum(fig(m).masa * 1e6, 0)} mg`]] },
    escape: { titulo: "Colector de escape", funcion: "Lleva los gases calientes a la turbina del turbocompresor y luego a la salida.", valores: (m) => [st(m, 4), ["Calor cedido q<sub>out</sub> = c<sub>v</sub>(T₄ − T₁)", kJ(m.qout), "c"]] },
    turbo: { titulo: "Turbocompresor", funcion: "La turbina, movida por el escape, arrastra al compresor por un eje común; el compresor eleva la presión del aire de admisión.", valores: (m) => [["Relación de presiones p₁/p₀", anatNum(m.pi, 2)], ["T<sub>B</sub> salida del compresor", K(m.TB), "h"], ["Trabajo del compresor c<sub>p</sub>(T<sub>B</sub> − T<sub>A</sub>)", kJ(m.wc)], ["Potencia del compresor", `${anatNum((fig(m).caudal * m.wc), 1)} kW`]] },
    filtro: { titulo: "Filtro de aire", funcion: "Limpia el aire antes del compresor.", valores: (m) => [["T<sub>A</sub>", K(m.TA)], ["p<sub>A</sub>", bar(m.pA)]] },
    ic: { titulo: "Intercooler", funcion: "Enfría el aire comprimido: más densidad (más masa por ciclo) y menos temperatura al final de la compresión, lo que aleja el picado.", valores: (m) => [["T<sub>B</sub> → T₁", `${K(m.TB)} → ${K(m.T1)}`, "c"], ["Calor retirado", kJ(m.qIC), "c"], ["T₂ con intercooler", K(m.T[2])], ["T₂ sin intercooler", K(m.TB * Math.pow(B.r, B.gamma - 1)), "h"]] },
    pal: {
      grupo: "Control",
      titulo: "Palanca de la válvula de descarga (wastegate)",
      funcion: "Desvía parte del escape fuera de la turbina y así limita la presión de sobrealimentación. Más presión significa más masa por ciclo y más potencia, con el mismo rendimiento ideal.",
      valores: (m, x) => [["Sobrealimentación p₁/p₀", anatNum(x, 2)], ["Potencia indicada", `${anatNum(fig(m).potencia, 0)} kW`, "g"], ["Rendimiento η = 1 − 1/r<sup>γ−1</sup>", pct(m.eta), "g"], ["p<sub>máx</sub> = p₃", MPa(m.p[3]), "h"], ["T₂ (riesgo de picado)", K(m.T[2]), m.T[2] > B.tPicado ? "h" : ""]],
    },
    ind: { titulo: "Indicador del diagrama p–v", funcion: "Dibuja el ciclo ideal del cilindro 1 y sigue el estado actual del gas (punto) al compás del pistón.", valores: (m) => [["Estado actual", anim.fase()], st(m, 1), st(m, 2), st(m, 3), st(m, 4), ["w<sub>neto</sub> = q<sub>in</sub> − q<sub>out</sub>", kJ(m.wnet), "g"]] },
    manometro: { titulo: "Manómetro del cilindro 1", funcion: "Marca la presión instantánea dentro del cilindro durante el ciclo.", valores: (m) => [["Presión actual", MPa(anim.presion()), "h"], ["Máxima p₃", MPa(m.p[3])]] },
    eA: { grupo: "Estación A", titulo: "Entrada del compresor", funcion: "Aire ambiente aspirado a través del filtro.", valores: (m) => [["T<sub>A</sub>", K(m.TA), "c"], ["p<sub>A</sub>", bar(m.pA)]] },
    eB: { grupo: "Estación B", titulo: "Salida del compresor", funcion: "Aire comprimido y calentado por la compresión, camino del intercooler.", valores: (m) => [["T<sub>B</sub>", K(m.TB), "h"], ["p<sub>B</sub>", bar(m.pB)]] },
    e1: { grupo: "Estación 1", titulo: "Salida del intercooler = estado 1", funcion: "Aire que llena el cilindro: es el estado 1 del ciclo, al inicio de la compresión.", valores: (m) => [["T₁", K(m.T[1]), "c"], ["p₁", bar(m.p[1])], ["v₁ = RT₁/p₁", `${anatNum(m.v[1], 3)} m³/kg`]] },
  };
  return {
    P: DATA.P,
    partes,
    inicial: "pal",
    continuo: true,
    control: { min: B.piMin, max: B.piMax, step: 0.05, valor: B.pi0, etiqueta: "Sobrealimentación p₁/p₀", formato: (v) => anatNum(v, 2) },
    modelo: (pi) => otto(pi, B),
    lectura: (m, x) => `p₁ ${anatNum(m.p[1] / 100, 2)} bar · ${anatNum(cifras(m, B).potencia, 0)} kW · η ${anatNum(m.eta * 100, 1)} %`,
    agujas: DATA.agujas.map((a) => ({ ...a, valor: a.n === "p" ? () => anim.presion() : a.n === "A" ? (m) => m.TA : a.n === "B" ? (m) => m.TB : (m) => m.T1 })),
    temperatura: (m, key) => ({ esc: m.T[4], sal: m.T[4] * 0.85, B: m.TB, 1: m.T1 })[key] ?? 300,
    tinte: [290, 1000],
    brillo: () => 1,
    palanca: DATA.palanca,
    animar: anim.animar,
    tour: (t) => 1.75 + 0.7 * Math.sin((t / 9) * Math.PI),
    tourDesde: (x) => (9 / Math.PI) * Math.asin(Math.max(-1, Math.min(1, (x - 1.75) / 0.7))),
  };
};
