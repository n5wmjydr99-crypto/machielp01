// Captura cuadros de escena.html con Chromium (WebGL por software).
//   node render.js preview build/timeline_ig.json 0,60,120        -> build/preview/f_00060.jpg ...
//   node render.js frames  build/timeline_ig.json 0 400 build/fr   -> JPEG de los cuadros [0, 400)
//   node render.js cover   build/timeline_ig.json 45 build/portada.jpg
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = __dirname;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg' };

async function abrir(tl, modo = 'video') {
  const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.route('http://tekorei.local/**', async (route) => {
    const u = new URL(route.request().url());
    const f = path.join(ROOT, decodeURIComponent(u.pathname));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({ status: 404, body: 'no' });
    return route.fulfill({ status: 200, body: fs.readFileSync(f), headers: { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' } });
  });
  page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await page.goto(`http://tekorei.local/escena.html?tl=${encodeURIComponent(tl)}&modo=${modo}`);
  await page.waitForFunction('window.listo === true', null, { timeout: 180000 });
  return { browser, page };
}

async function cuadro(page, f, calidad = 93) {
  await page.evaluate((n) => window.renderFrame(n), f);
  return page.screenshot({ type: 'jpeg', quality: calidad });
}

(async () => {
  const [modo, tl, a, b, salida] = process.argv.slice(2);
  if (modo === 'preview') {
    const { browser, page } = await abrir(tl);
    const dir = path.join(ROOT, 'build', 'preview');
    fs.mkdirSync(dir, { recursive: true });
    for (const f of a.split(',').map(Number)) {
      const t0 = Date.now();
      fs.writeFileSync(path.join(dir, `f_${String(f).padStart(5, '0')}.jpg`), await cuadro(page, f, 85));
      console.log(`cuadro ${f}: ${Date.now() - t0} ms`);
    }
    await browser.close();
  } else if (modo === 'frames') {
    const desde = Number(a), hasta = Number(b);
    fs.mkdirSync(salida, { recursive: true });
    const { browser, page } = await abrir(tl);
    const t0 = Date.now();
    for (let f = desde; f < hasta; f++) {
      fs.writeFileSync(path.join(salida, `f_${String(f).padStart(5, '0')}.jpg`), await cuadro(page, f));
      if ((f - desde) % 50 === 0) console.log(`${path.basename(salida)} ${f}/${hasta} (${((Date.now() - t0) / (f - desde + 1)).toFixed(0)} ms/cuadro)`);
    }
    await browser.close();
  } else if (modo === 'cover') {
    const { browser, page } = await abrir(tl, 'portada');
    fs.writeFileSync(b, await cuadro(page, Number(a), 95));
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
