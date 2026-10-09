// Exporta la ilustración de cada producto como archivo PNG real: entrega/imagenes/<id>.png
const fs = require('fs'), path = require('path'), vm = require('vm');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = path.join(__dirname, '..'), out = path.join(root, 'entrega', 'imagenes');
(async () => {
  const ctx = {}; ctx.window = ctx; vm.runInNewContext(fs.readFileSync(path.join(root, 'assets', 'data.js'), 'utf8'), ctx);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined }), p = await b.newPage({ viewport: { width: 600, height: 600 } });
  for (const pr of ctx.NX.PRODUCTS) {
    const uri = ctx.NX.productArt(pr.art, pr.brand);
    await p.setContent(`<body style="margin:0;background:#08080a"><img src="${uri}" width="600" height="600" style="display:block"></body>`);
    await p.waitForFunction(() => document.images[0].complete);
    await p.screenshot({ path: path.join(out, pr.id + '.png') });
  }
  await b.close(); console.log(ctx.NX.PRODUCTS.length + ' imágenes en entrega/imagenes');
})();
