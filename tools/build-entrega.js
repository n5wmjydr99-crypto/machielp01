// Arma la carpeta entrega/: index.html + estilo.css + imagenes/  (el JS va dentro del index.html)
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..'), out = path.join(root, 'entrega');
const rd = (f) => fs.readFileSync(path.join(root, f), 'utf8'), safe = (js) => js.replace(/<\/script/gi, '<\\/script');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'estilo.css'), rd('assets/styles.css'));
let html = rd('index.html');
html = html.replace('<link rel="stylesheet" href="assets/styles.css">', '<link rel="stylesheet" href="estilo.css">');
html = html.replace(/<script src="assets\/([^"]+)"><\/script>/g, (_, f) => `<script>${f === 'data.js' ? "window.NX_LOCAL=true;window.NX_IMG_DIR='imagenes/';\n" : ''}${safe(rd('assets/' + f))}</script>`);
if (/(src|href)="assets\//.test(html)) throw new Error('quedó una referencia a assets/');
fs.writeFileSync(path.join(out, 'index.html'), html);
console.log('entrega/index.html', (html.length / 1024).toFixed(0) + ' KB · estilo.css', (fs.statSync(path.join(out, 'estilo.css')).size / 1024).toFixed(0) + ' KB');
