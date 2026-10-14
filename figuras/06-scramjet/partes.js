// Scramjet · descripción de piezas y estaciones para el panel (se ejecuta en el navegador).
ANAT_FIGS["anat-scramjet"] = () => {
  const B = DATA.base;
  const K = (t) => `${anatNum(t)} K`;
  const kPa = (p) => `${anatNum(p, p < 10 ? 2 : p < 100 ? 1 : 0)} kPa`;
  const ms = (v) => `${anatNum(v)} m/s`;
  const pct = (x) => `${anatNum(x * 100, 1)} %`;
  const st = (m, n) => [`Estación ${n} · T / p / M`, `${K(m.T[n])} · ${kPa(m.p[n])} · ${anatNum(m.Ma[n], 2)}`];
  const ESTACION = {
    1: ["Corriente libre", "Aire a 30 km, muy frío y enrarecido, llegando a velocidad hipersónica."],
    2: ["Entrada a la cámara", "Tras las ondas de choque de las rampas y el aislador el aire está mucho más caliente y comprimido, pero todavía es supersónico."],
    3: ["Salida de la cámara", "El hidrógeno ha ardido sin que la corriente deje de ser supersónica (si M₃ bajara de 1 el motor pasaría a ramjet: ahogo térmico)."],
    4: ["Salida de la tobera", "El gas se expande a lo largo de la parte trasera del fuselaje hasta la presión ambiente."],
  };
  const partes = {
    adm: {
      titulo: "Admisión de rampas (cuerpo delantero)",
      funcion: "La parte inferior del fuselaje se inclina en dos rampas: cada una genera una onda de choque oblicua que comprime y frena el aire. A Mach de diseño ambas ondas caen justo sobre el labio del carenado.",
      valores: (m) => [st(m, 1), st(m, 2), ["Relación de presiones p₂/p₁", anatNum(m.p[2] / m.p[1], 0), "g"], ["Temperatura de remanso", K(m.Tt), "h"]],
    },
    car: {
      titulo: "Carenado y aislador",
      funcion: "El carenado cierra el conducto por debajo. El tramo recto antes de la cámara (aislador) aloja el tren de ondas de choque y evita que la subida de presión de la combustión remonte hacia la admisión.",
      valores: (m) => [st(m, 2), ["Caudal captado ṁ", `${anatNum(m.mdot, 1)} kg/s`], ["Velocidad V₂", ms(m.V[2])]],
    },
    iny: { titulo: "Montantes inyectores de hidrógeno", funcion: "Inyectan hidrógeno en la corriente supersónica; el hidrógeno se mezcla y arde en milisegundos, que es lo que tarda el aire en atravesar la cámara.", valores: (m) => [["Dosado f", anatNum(B.f, 3)], ["Calor aportado q = f·PCI", `${anatNum(m.q)} kJ/kg`, "h"]] },
    cam: {
      titulo: "Cámara de combustión supersónica",
      funcion: "Combustión a presión constante en una corriente que sigue siendo supersónica. Sin fricción y a presión constante, la cantidad de movimiento obliga a que la velocidad no cambie: solo sube la temperatura, y el Mach baja.",
      valores: (m) => [st(m, 2), st(m, 3), ["V₂ = V₃", ms(m.V[3])], ["¿Sigue supersónica?", m.Ma[3] > 1 ? "sí, M₃ > 1" : "no: ahogo térmico", m.Ma[3] > 1 ? "g" : "h"]],
    },
    tob: {
      titulo: "Tobera de rampa de expansión",
      funcion: "No hay tobera cerrada: el gas se expande contra la rampa trasera del fuselaje (SERN), que recibe la presión y da empuje.",
      valores: (m) => [st(m, 3), st(m, 4), ["Velocidad del chorro V₄", ms(m.V4), "h"]],
    },
    aire: { grupo: "Flujo", titulo: "Aire comprimido por choques", funcion: "Se frena de M₁ a M₂ = M₁/3 sin dejar de ser supersónico.", valores: (m) => [["M₁ → M₂", `${anatNum(m.Ma[1], 1)} → ${anatNum(m.Ma[2], 2)}`, "c"], ["T₁ → T₂", `${K(m.T[1])} → ${K(m.T[2])}`]] },
    gas: { grupo: "Flujo", titulo: "Gases de combustión", funcion: "Salen más rápido de lo que entró el aire: la diferencia es el empuje.", valores: (m) => [["V₄ − V₁", ms(m.V4 - m.V1), "h"], ["Empuje F", `${anatNum(m.F, 1)} kN`, "g"], ["Impulso específico (por kg de H₂)", `${anatNum(m.isp)} s`]] },
    deriva: { titulo: "Derivas y aletas", funcion: "Estabilizan el vehículo en vuelo hipersónico.", valores: (m) => [["Mach de vuelo", anatNum(m.M, 1)]] },
    soporte: { titulo: "Pórtico de suspensión", funcion: "Sostiene el vehículo por el lomo para dejar libre el conducto, como un montante de túnel.", valores: (m) => [["Empuje", `${anatNum(m.F, 1)} kN`, "g"]] },
    sel: {
      grupo: "Control",
      titulo: "Selector de régimen (Mach de vuelo)",
      funcion: "Fija el Mach de vuelo simulado. Por debajo de M ≈ 6 la combustión llevaría la corriente a subsónica (régimen de ramjet); por encima, el scramjet gana rendimiento térmico y propulsivo.",
      valores: (m, x) => [["Mach de vuelo", anatNum(x, 1)], ["η<sub>th</sub> = 1 − T₁/T₂", pct(m.etaTh), "g"], ["η<sub>p</sub>", pct(m.etaP)], ["η<sub>global</sub>", pct(m.eta), "g"], ["Mach en la cámara M₂ → M₃", `${anatNum(m.Ma[2], 2)} → ${anatNum(m.Ma[3], 2)}`]],
    },
  };
  for (let n = 1; n <= 4; n++) {
    const [titulo, texto] = ESTACION[n];
    partes[`e${n}`] = { grupo: `Estación ${n}`, titulo, funcion: texto, valores: (m) => [[`T<sub>${n}</sub>`, K(m.T[n]), m.T[n] > 900 ? "h" : "c"], [`p<sub>${n}</sub>`, kPa(m.p[n])], [`M<sub>${n}</sub>`, anatNum(m.Ma[n], 2)], [`V<sub>${n}</sub>`, ms(m.V[n])]] };
  }
  return {
    P: DATA.P,
    partes,
    inicial: "sel",
    control: { min: B.mMin, max: B.mMax, step: 0.1, valor: B.m0, etiqueta: "Número de Mach de vuelo", formato: (v) => `M ${anatNum(v, 1)}` },
    modelo: (M) => scramjet(M, B),
    lectura: (m, x) => `M ${anatNum(x, 1)} · M₂ ${anatNum(m.Ma[2], 2)} · F ${anatNum(m.F, 1)} kN`,
    agujas: DATA.agujas.map((a) => ({ ...a, valor: a.id === "selector" ? (m, x) => x : (m) => m.T[a.n] })),
    temperatura: () => 300,
    tinte: [300, 1500],
    brillo: () => 1,
    flujos: [
      { sel: '[data-flujo="frio"] [data-flow]', velocidad: (m) => m.V1 / 60 },
      { sel: '[data-flujo="caliente"] [data-flow]', velocidad: (m) => m.V4 / 60 },
    ],
    tour: (t) => 8 + 1.8 * Math.sin((t / 9) * Math.PI),
    tourDesde: (x) => (9 / Math.PI) * Math.asin(Math.max(-1, Math.min(1, (x - 8) / 1.8))),
  };
};
