// Plan de tomas y gráficos del video de Vemquro, atado a tiempos.json (narración real).
// Las zonas de pantalla van en coordenadas de la pantalla de la laptop: [u0, v0, u1, v1], 0..1 desde arriba a la izquierda.
// Si la grabación de la web trae meta.json, las zonas de los elementos (chips, precio, WhatsApp...) salen de ahí.

const CLAVES = new Set(['nexustech', 'celulares', 'samsung', 'guaranies', 'whatsapp', 'combo', 'descuento', '20', '40',
  'dolares', 'vemquro', 'hosting', 'mes', 'dominio', 'ano', 'web']);

export function normal(w) {
  return w.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function limpiar(w) {
  return w.replace(/[«»¿?¡!.,;:]/g, '');
}

export function crearPlan(tiempos, meta) {
  const L = Object.fromEntries(tiempos.lineas.map((l) => [l.id, l]));
  const ini = (id) => L[id].inicio;
  const fin = (id) => L[id].fin;
  // tiempo en que empieza la primera palabra de la línea que coincide con `palabra`
  const T = (id, palabra) => {
    const p = L[id].palabras.find((x) => normal(x.w) === normal(palabra));
    if (!p) throw new Error(`no encuentro "${palabra}" en ${id}`);
    return p.s;
  };

  // Zonas de la pantalla. Con meta.json (grabación real) se usan las cajas medidas en ese momento.
  const zona = (nombre, t, porDefecto, min = 0.34) => {
    const z = meta && meta.zonas && meta.zonas[nombre];
    if (!z) return porDefecto;
    const f = Math.min(z.length - 1, Math.max(0, Math.round(t * 60) - (meta.desde || 0)));
    const b = z[f];
    if (!b) return porDefecto;
    let [u0, v0, u1, v1] = b;
    const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
    const w = Math.max(u1 - u0, min), h = Math.max(v1 - v0, min * 0.6);
    u0 = Math.min(Math.max(cu - w / 2, 0), 1 - w); v0 = Math.min(Math.max(cv - h / 2, 0), 1 - h);
    return [u0, v0, u0 + w, v0 + h];
  };

  const PANTALLA = [0, 0, 1, 1];
  const normalCam = { zona: PANTALLA, relleno: 0.93, elev: 13, az: 0, y: 0.4 };
  const fin_total = fin('l18') + 3.15;

  // Cámara: estados en el tiempo; entre uno y otro se mueve suave, nunca queda congelada.
  const camara = [
    { t: 0.0, zona: [0.1, 0.06, 0.9, 0.66], relleno: 1.0, elev: 5, az: 0, y: 0.42 },          // gancho: pegados a la pantalla
    { t: 1.35, ...normalCam, relleno: 0.95 },                                                    // se abre y aparece la laptop
    { t: ini('l03'), ...normalCam, relleno: 0.92, az: -3 },
    { t: fin('l04'), ...normalCam, relleno: 0.95, az: 2 },
    { t: ini('l05') + 0.5, zona: zona('filtros', ini('l05') + 0.5, [0.05, 0.1, 0.75, 0.55]), relleno: 0.86, elev: 11, az: 0, y: 0.4 },
    { t: fin('l06'), zona: zona('filtros', fin('l06'), [0.05, 0.1, 0.75, 0.55]), relleno: 0.9, elev: 11, az: 1, y: 0.4 },
    { t: ini('l07') + 0.2, ...normalCam, relleno: 0.96 },
    { t: ini('l08') + 0.35, zona: zona('producto', ini('l08') + 0.35, [0.05, 0.15, 0.55, 0.95]), relleno: 0.8, elev: 10, az: -2, y: 0.42 },
    { t: fin('l08'), zona: zona('producto', fin('l08'), [0.05, 0.15, 0.55, 0.95]), relleno: 0.84, elev: 10, az: -1, y: 0.42 },
    { t: ini('l09') + 0.45, zona: zona('whatsapp', ini('l09') + 0.45, [0.62, 0.5, 1.0, 1.0]), relleno: 0.78, elev: 12, az: 4, y: 0.44 },
    { t: fin('l09'), zona: zona('whatsapp', fin('l09'), [0.62, 0.5, 1.0, 1.0]), relleno: 0.82, elev: 12, az: 5, y: 0.44 },
    { t: ini('l10') + 0.4, ...normalCam, relleno: 0.95 },
    { t: ini('l11') + 0.3, zona: zona('combo', ini('l11') + 0.3, [0.15, 0.1, 0.85, 0.95]), relleno: 0.9, elev: 12, az: 0, y: 0.4 },
    { t: ini('l12') + 0.1, zona: zona('carrito', ini('l12') + 0.1, [0.55, 0.0, 1.0, 1.0]), relleno: 0.72, elev: 11, az: 5, y: 0.42 },
    { t: fin('l12') + 0.1, zona: zona('carrito', fin('l12'), [0.55, 0.0, 1.0, 1.0]), relleno: 0.76, elev: 11, az: 6, y: 0.42 },
    { t: ini('l13') + 0.5, zona: PANTALLA, relleno: 0.64, elev: 19, az: -14, y: 0.6 },          // plano abierto para los precios
    { t: fin('l16'), zona: PANTALLA, relleno: 0.68, elev: 17, az: 12, y: 0.6 },
    { t: ini('l17') + 0.5, ...normalCam, relleno: 0.95, az: -2 },
    { t: ini('l18') + 0.3, zona: PANTALLA, relleno: 0.7, elev: 17, az: 3, y: 0.62 },
    { t: fin('l18') + 0.4, zona: PANTALLA, relleno: 0.5, elev: 24, az: 14, y: 0.6 },            // cierre: se aleja y se ve el jarrón impreso en 3D
    { t: fin_total, zona: PANTALLA, relleno: 0.45, elev: 27, az: 20, y: 0.58 },
  ];

  // Subtítulos: grupos de hasta 3 palabras (máx. 17 letras), sin cruzar puntos ni comas.
  const grupos = [];
  for (const l of tiempos.lineas) {
    let g = null;
    l.palabras.forEach((p, i) => {
      const texto = limpiar(p.w);
      const largo = g ? g.palabras.reduce((a, x) => a + x.texto.length + 1, 0) + texto.length : 0;
      if (!g || g.palabras.length >= 3 || largo > 17 || g.corte) {
        g = { palabras: [], corte: false };
        grupos.push(g);
      }
      g.palabras.push({ texto, s: p.s, e: p.e, clave: CLAVES.has(normal(p.w)) });
      if (/[.,;:?!]$/.test(p.w) && i < l.palabras.length - 1) g.corte = true;
    });
  }
  grupos.forEach((g) => { g.desde = g.palabras[0].s; });
  grupos.forEach((g, i) => {
    const sig = grupos[i + 1];
    const finLinea = g.palabras[g.palabras.length - 1].e + 0.25;
    g.hasta = sig ? Math.min(sig.desde, Math.max(finLinea, g.palabras[g.palabras.length - 1].e)) : finLinea;
  });

  const precios = {
    desde: ini('l13') + 0.1, hasta: fin('l16') + 0.35,
    filas: [
      { id: 'f1', t: T('l13', '20') - 0.15, pill: 'p1', tp: T('l13', 'según') },
      { id: 'f2', t: ini('l14') + 0.05, pill: 'p2', tp: T('l15', 'mes') },
      { id: 'f3', t: ini('l16') + 0.05, pill: 'p3', tp: T('l16', 'año') },
    ],
  };
  const dm = { desde: ini('l18') - 0.15, burbuja: T('l18', 'WEB'), hasta: fin('l18') + 0.25 };
  const cierre = { desde: fin('l18') + 0.2 };

  return { camara, grupos, precios, dm, cierre, duracion: fin_total, subsY: 1590 };
}
