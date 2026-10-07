// Genera dist/nexustech.html: un solo archivo (CSS + JS + Three.js incluidos) que funciona con doble clic.
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
const rd = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const safe = (js) => js.replace(/<\/script/gi, '<\\/script');
let html = rd('index.html');
html = html.replace(/<link rel="stylesheet" href="assets\/styles.css">/, () => `<style>\n${rd('assets/styles.css')}\n</style>`);
html = html.replace(/<script src="assets\/([^"]+)"><\/script>/g, (_, f) => `<script>${f === 'data.js' ? 'window.NX_LOCAL=true;\n' : ''}${safe(rd('assets/' + f))}</script>`);
if (/src="assets\//.test(html)) throw new Error('quedó una referencia a assets/');
fs.writeFileSync(path.join(root, 'dist', 'nexustech.html'), html);
console.log('dist/nexustech.html', (html.length / 1024).toFixed(0) + ' KB');
