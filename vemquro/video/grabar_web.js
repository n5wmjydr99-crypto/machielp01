// Graba una web cuadro por cuadro a 60 fps con el reloj de la página bajo control (nada de tirones ni cuadros repetidos).
//   node grabar_web.js web.json build/web            -> build/web/w_00000.jpg … + meta.json
//   node grabar_web.js web.json build/web 600 900    -> solo ese tramo (para probar)
// web.json:
//   url, viewport [ancho, alto], dpr, duracion (s, opcional: si no, la del plan)
//   scroll:  [{ t, y } | { t, sel, alinear: "arriba"|"centro", margen }]   posiciones del scroll (se mueve suave entre una y otra)
//   cursor:  [{ t, sel } | { t, xy: [x, y] }]                               el cursor llega a ese lugar en el tiempo t
//   clics:   [{ t }]                                                       clic real donde está el cursor
//   zonas:   { nombre: selector | [selectores] }                           cajas que usa la cámara para acercarse (varias = la que las envuelve)
//   ocultar: [selector]                                                    elementos a esconder (ej. avisos de cookies)
// Los tiempos pueden ser segundos o referencias a la narración: ["l05", "Celulares", -0.1], ["l07", "inicio"], ["l12", "fin", 0.3].
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FPS = 60;
const [cfgPath, salida, desdeArg, hastaArg] = process.argv.slice(2);
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const tiempos = JSON.parse(fs.readFileSync(path.join(__dirname, 'tiempos.json'), 'utf8'));
const DURACION = cfg.duracion || (tiempos.lineas.find((l) => l.id === 'l18').fin + 3.15);
const TOTAL = Math.ceil(DURACION * FPS);
const [VW, VH] = cfg.viewport || [1280, 800];

const normal = (w) => w.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
function tiempo(ref) {
  if (typeof ref === 'number') return ref;
  const [id, que, mas = 0] = ref;
  const l = tiempos.lineas.find((x) => x.id === id);
  if (!l) throw new Error(`no existe la línea ${id}`);
  if (que === 'inicio') return l.inicio + mas;
  if (que === 'fin') return l.fin + mas;
  const p = l.palabras.find((x) => normal(x.w) === normal(que));
  if (!p) throw new Error(`no encuentro "${que}" en ${id}`);
  return p.s + mas;
}
const suave = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * x * (x * (x * 6 - 15) + 10); };

const CURSOR = `(() => {
  if (window.__vq) return;
  const css = document.createElement('style');
  css.textContent = 'html{scroll-behavior:auto!important;scrollbar-width:none!important}::-webkit-scrollbar{display:none!important}*{cursor:none!important}';
  document.head.append(css);
  const c = document.createElement('div');
  c.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M5 2.5L5 19.5L9.6 15.3L12.6 21.6L15.4 20.4L12.5 14.2L18.6 14.2Z" fill="#fff" stroke="#111" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  Object.assign(c.style, { position: 'fixed', left: '0', top: '0', zIndex: 2147483647, pointerEvents: 'none',
    filter: 'drop-shadow(0 3px 5px rgba(0,0,0,.5))', transformOrigin: '6px 3px', willChange: 'transform' });
  const r = document.createElement('div');
  Object.assign(r.style, { position: 'fixed', left: '0', top: '0', zIndex: 2147483646, pointerEvents: 'none', width: '56px', height: '56px',
    marginLeft: '-28px', marginTop: '-28px', borderRadius: '50%', border: '3px solid rgba(255,255,255,.95)', background: 'rgba(255,255,255,.12)', opacity: '0' });
  document.documentElement.append(r, c);
  window.__vq = (x, y, k) => {
    const s = k > 0 && k < 1 ? 1 - 0.14 * Math.sin(Math.PI * Math.min(1, k * 2.5)) : 1;
    c.style.transform = 'translate(' + (x - 6) + 'px,' + (y - 3) + 'px) scale(' + s + ')';
    r.style.left = x + 'px'; r.style.top = y + 'px';
    r.style.opacity = k > 0 && k < 1 ? String(0.9 * (1 - k)) : '0';
    r.style.transform = 'scale(' + (0.35 + 1.1 * k) + ')';
  };
})();`;

// avanza las animaciones CSS (y transiciones) exactamente lo mismo que el reloj
const PASO_ANIM = (ms) => {
  for (const a of document.getAnimations()) {
    if (a.playState === 'finished') continue;
    const ct = a.currentTime == null ? 0 : a.currentTime;
    a.pause();
    a.currentTime = ct + ms;
  }
};

(async () => {
  fs.mkdirSync(salida, { recursive: true });
  const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars'],
  });
  const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: cfg.dpr || 2, locale: 'es-PY' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await page.clock.install({ time: new Date('2026-11-20T15:00:00-03:00') });
  await page.goto(cfg.url, { waitUntil: 'networkidle', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  // carga todo lo perezoso bajando la página una vez, y vuelve arriba
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < alto; y += 500) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(120); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  for (const sel of cfg.ocultar || []) await page.locator(sel).evaluateAll((els) => els.forEach((e) => (e.style.display = 'none'))).catch(() => {});
  await page.evaluate(CURSOR);
  const ahora = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(ahora + 500);

  const caja = async (sel) => {
    const b = await page.locator(sel).first().boundingBox().catch(() => null);
    return b;
  };
  const scrollY = () => page.evaluate(() => window.scrollY);

  // scroll: cada destino con selector se calcula cuando empieza el movimiento hacia él
  const scroll = (cfg.scroll || [{ t: 0, y: 0 }]).map((k) => ({ ...k, t: tiempo(k.t) })).sort((a, b) => a.t - b.t);
  const cursor = (cfg.cursor || []).map((k) => ({ ...k, t: tiempo(k.t), dur: k.dur || 0.7 })).sort((a, b) => a.t - b.t);
  const clics = (cfg.clics || []).map((k) => ({ t: tiempo(k.t), hecho: false })).sort((a, b) => a.t - b.t);
  const zonas = Object.fromEntries(Object.keys(cfg.zonas || {}).map((k) => [k, []]));
  const clicsHechos = [];
  async function destinoScroll(k) {
    if (k.y != null) return k.y;
    const b = await caja(k.sel);
    if (!b) { console.error(`scroll: no encuentro ${k.sel}`); return await scrollY(); }
    const y0 = await scrollY();
    const margen = k.margen || 0;
    const y = k.alinear === 'centro' ? y0 + b.y + b.height / 2 - VH / 2 : y0 + b.y - margen;
    const max = (await page.evaluate(() => document.documentElement.scrollHeight)) - VH;
    return Math.max(0, Math.min(max, y));
  }

  let cur = { x: VW * 0.62, y: VH * 0.7 };
  let mov = null;         // movimiento de cursor en curso
  let clicT = -10;
  const desde = Number(desdeArg || 0), hasta = Number(hastaArg || TOTAL);
  const t0 = Date.now();
  for (let f = 0; f < hasta; f++) {
    const t = f / FPS;
    // --- scroll
    let i = 0;
    while (i < scroll.length - 1 && t >= scroll[i + 1].t) i++;
    if (scroll[i].yr == null) scroll[i].yr = await destinoScroll(scroll[i]);
    let y = scroll[i].yr;
    const sig = scroll[i + 1];
    if (sig) {
      const ini = sig.desde != null ? tiempo(sig.desde) : scroll[i].t;
      if (t >= ini) {
        if (sig.yr == null) sig.yr = await destinoScroll(sig);
        y = scroll[i].yr + (sig.yr - scroll[i].yr) * suave((t - ini) / Math.max(1e-6, sig.t - ini));
      }
    }
    await page.evaluate((yy) => window.scrollTo(0, yy), Math.round(y * 2) / 2);
    // --- cursor: sigue al elemento aunque la página se mueva
    const prox = cursor.find((k) => t >= k.t - k.dur && t < k.t + 0.0001 && !k.listo);
    if (prox && (!mov || mov.k !== prox)) mov = { k: prox, x0: cur.x, y0: cur.y };
    if (mov) {
      const k = mov.k;
      let tx, ty;
      if (k.xy) [tx, ty] = k.xy;
      else { const b = await caja(k.sel); if (b) { tx = b.x + b.width * (k.fx ?? 0.5); ty = b.y + b.height * (k.fy ?? 0.5); } else { tx = cur.x; ty = cur.y; } }
      const e = suave((t - (k.t - k.dur)) / k.dur);
      const arco = Math.sin(Math.PI * e) * Math.min(40, Math.hypot(tx - mov.x0, ty - mov.y0) * 0.12);
      cur = { x: mov.x0 + (tx - mov.x0) * e, y: mov.y0 + (ty - mov.y0) * e - arco };
      if (e >= 1) { k.listo = true; mov = null; }
    }
    // --- clics
    for (const c of clics) {
      if (!c.hecho && t >= c.t) {
        c.hecho = true;
        clicT = t;
        clicsHechos.push(Number(t.toFixed(3)));
        await page.mouse.click(cur.x, cur.y);
      }
    }
    await page.mouse.move(cur.x, cur.y);
    await page.evaluate(([x, yy, k]) => window.__vq(x, yy, k), [cur.x, cur.y, t - clicT < 0.45 ? (t - clicT) / 0.45 : 0]);
    // --- reloj de la página y animaciones CSS: exactamente un cuadro
    const ms = Math.round(((f + 1) * 1000) / FPS) - Math.round((f * 1000) / FPS);
    await page.clock.runFor(ms);
    await page.evaluate(PASO_ANIM, ms);
    // --- zonas para la cámara (cada 6 cuadros alcanza)
    if (f % 6 === 0) {
      for (const [nombre, sel] of Object.entries(cfg.zonas || {})) {
        const cajas = (await Promise.all([].concat(sel).map(caja))).filter(Boolean);
        const b = cajas.length ? cajas.reduce((u, c) => {
          const x0 = Math.min(u.x, c.x), y0 = Math.min(u.y, c.y);
          return { x: x0, y: y0, width: Math.max(u.x + u.width, c.x + c.width) - x0, height: Math.max(u.y + u.height, c.y + c.height) - y0 };
        }) : null;
        zonas[nombre][f / 6] = b ? [b.x / VW, b.y / VH, (b.x + b.width) / VW, (b.y + b.height) / VH].map((v) => Math.round(Math.min(1, Math.max(0, v)) * 1000) / 1000) : null;
      }
    }
    if (f >= desde) {
      await page.screenshot({ path: path.join(salida, `w_${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 90 });
      if (f % 60 === 0) console.log(`web ${f}/${hasta} (${((Date.now() - t0) / (f + 1)).toFixed(0)} ms/cuadro)`);
    }
  }
  // las zonas se guardan cuadro a cuadro (se repite la medición de cada 6 cuadros)
  const zonasCuadro = {};
  for (const [k, v] of Object.entries(zonas)) zonasCuadro[k] = Array.from({ length: hasta }, (_, f) => v[Math.floor(f / 6)] || null);
  fs.writeFileSync(path.join(salida, 'meta.json'), JSON.stringify({ cuadros: hasta, desde: 0, viewport: [VW, VH], clics: clicsHechos, zonas: zonasCuadro }));
  console.log(`listo: ${hasta - desde} cuadros, clics en ${clicsHechos.join(', ')}`);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
