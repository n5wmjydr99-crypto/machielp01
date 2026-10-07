'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cfg = require('./config');
const { db, id, tx } = require('./db');
const sec = require('./security');
const oauth = require('./oauth');
const bancard = require('./bancard');
const orders = require('./orders');
const stats = require('./stats');
require('./seed').run();

const ROOT = path.join(__dirname, '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon' };
const bancardOrigin = new URL(cfg.bancard.base).origin;
const CSP = `default-src 'self'; script-src 'self' ${bancardOrigin}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; frame-src ${bancardOrigin}; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`;

const send = (res, code, body, headers = {}) => { res.writeHead(code, headers); res.end(body); };
const json = (res, code, obj, headers = {}) => send(res, code, JSON.stringify(obj), { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
const fail = (res, code, msg) => json(res, code, { error: msg });
const redirect = (res, to, headers = {}) => send(res, 302, '', { location: to, ...headers });
// detrás de Caddy (TRUST_PROXY=1) la IP real viene en X-Forwarded-For; solo se confía si la conexión es local
const LOCAL = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const ip = (req) => {
  const a = req.socket.remoteAddress || '?';
  if (process.env.TRUST_PROXY === '1' && LOCAL.has(a)) return String(req.headers['x-forwarded-for'] || a).split(',')[0].trim();
  return a;
};

function readBody(req, limit = 2e6) {
  return new Promise((resolve, reject) => {
    let n = 0; const chunks = [];
    req.on('data', (c) => { n += c.length; if (n > limit) { reject(Object.assign(new Error('Cuerpo demasiado grande'), { code: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
async function readJson(req) {
  const t = await readBody(req);
  try { const v = t ? JSON.parse(t) : {}; if (v && typeof v === 'object') return v; } catch (e) { /* cae abajo */ }
  throw Object.assign(new Error('JSON inválido'), { code: 400 });
}
const sessionCookie = (token, kind) => sec.cookie(kind === 'admin' ? 'nx_admin' : 'nx_sid', token, { maxAge: 14 * 86400, secure: cfg.SECURE });
const clearCookie = (name) => sec.cookie(name, '', { maxAge: 0, secure: cfg.SECURE });

function userOf(req) {
  const s = sec.getSession(sec.parseCookies(req.headers.cookie).nx_sid, 'user');
  return s ? db.prepare('SELECT * FROM users WHERE id=? AND deleted_at IS NULL').get(s.user_id) : null;
}
const adminOf = (req) => !!sec.getSession(sec.parseCookies(req.headers.cookie).nx_admin, 'admin');
const pubUser = (u) => u && { id: u.id, name: u.name, email: u.email, provider: u.provider };
const pubProduct = (p) => ({ id: p.id, name: p.name, brand: p.brand, cat: p.cat, art: p.art, price: p.price, stock: p.stock, desc: p.descr || '', img: p.img || '' });

function loginUser(res, u) {
  const t = sec.createSession('user', u.id);
  return sessionCookie(t, 'user');
}
function upsertOAuth(profile, provider) {
  let u = db.prepare('SELECT * FROM users WHERE email=? AND deleted_at IS NULL').get(profile.email);
  if (!u) { u = { id: id('u_'), name: profile.name, email: profile.email, provider }; db.prepare('INSERT INTO users(id,name,email,pass,provider,created_at) VALUES(?,?,?,NULL,?,?)').run(u.id, u.name, u.email, provider, Date.now()); }
  return u;
}

/* ---------- router ---------- */
const routes = [];
const route = (method, pattern, handler) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), handler });

route('GET', '/api/config', (req, res) => json(res, 200, {
  user: pubUser(userOf(req)), admin: adminOf(req),
  providers: { google: oauth.googleOn(), apple: oauth.appleOn() },
  payments: { mode: bancard.on() ? 'bancard' : cfg.ALLOW_MOCK ? 'mock' : 'off' }
}));
route('GET', '/api/products', (req, res) => json(res, 200, db.prepare('SELECT * FROM products ORDER BY pos, rowid').all().map(pubProduct)));

/* auth de clientes */
const EMAIL = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
route('POST', '/api/auth/register', async (req, res) => {
  if (!sec.rateLimit('reg:' + ip(req), 10, 36e5)) return fail(res, 429, 'Demasiados intentos. Probá más tarde.');
  const b = await readJson(req), email = String(b.email || '').trim().toLowerCase(), name = String(b.name || '').trim().slice(0, 100), pass = String(b.pass || '');
  if (!EMAIL.test(email) || email.length > 120) return fail(res, 400, 'Ingresá un correo válido.');
  if (name.length < 3) return fail(res, 400, 'Ingresá tu nombre completo.');
  if (pass.length < 8 || pass.length > 200) return fail(res, 400, 'La contraseña debe tener al menos 8 caracteres.');
  if (db.prepare('SELECT 1 FROM users WHERE email=? AND deleted_at IS NULL').get(email)) return fail(res, 409, 'Ese correo ya tiene una cuenta.');
  const u = { id: id('u_'), name, email, provider: 'email' };
  db.prepare('INSERT INTO users(id,name,email,pass,provider,created_at) VALUES(?,?,?,?,?,?)').run(u.id, name, email, sec.hashPassword(pass), 'email', Date.now());
  json(res, 201, { user: pubUser(u) }, { 'set-cookie': loginUser(res, u) });
});
route('POST', '/api/auth/login', async (req, res) => {
  const b = await readJson(req), email = String(b.email || '').trim().toLowerCase();
  if (!sec.rateLimit('login:' + ip(req) + email, 8, 6e5)) return fail(res, 429, 'Demasiados intentos. Esperá unos minutos.');
  const u = db.prepare('SELECT * FROM users WHERE email=? AND deleted_at IS NULL').get(email);
  if (!u || !sec.verifyPassword(String(b.pass || ''), u.pass)) return fail(res, 401, 'Correo o contraseña incorrectos.');
  json(res, 200, { user: pubUser(u) }, { 'set-cookie': loginUser(res, u) });
});
route('POST', '/api/auth/logout', (req, res) => { sec.destroySession(sec.parseCookies(req.headers.cookie).nx_sid); json(res, 200, { ok: true }, { 'set-cookie': clearCookie('nx_sid') }); });
route('DELETE', '/api/me', (req, res) => {
  const u = userOf(req); if (!u) return fail(res, 401, 'Iniciá sesión.');
  db.prepare('UPDATE users SET deleted_at=? WHERE id=?').run(Date.now(), u.id); db.prepare('DELETE FROM sessions WHERE user_id=?').run(u.id);
  json(res, 200, { ok: true }, { 'set-cookie': clearCookie('nx_sid') });
});

/* Google / Apple */
route('GET', '/api/auth/google', (req, res) => (oauth.googleOn() ? redirect(res, oauth.googleUrl()) : fail(res, 503, 'Google no está configurado.')));
route('GET', '/api/auth/google/callback', async (req, res, url) => {
  try {
    if (!oauth.takeState(url.searchParams.get('state')) || !url.searchParams.get('code')) throw new Error('state');
    const u = upsertOAuth(await oauth.googleProfile(url.searchParams.get('code')), 'google');
    redirect(res, '/', { 'set-cookie': loginUser(res, u) });
  } catch (e) { redirect(res, '/?auth_error=google'); }
});
route('GET', '/api/auth/apple', (req, res) => (oauth.appleOn() ? redirect(res, oauth.appleUrl()) : fail(res, 503, 'Apple no está configurado.')));
route('POST', '/api/auth/apple/callback', async (req, res) => {
  try {
    const f = new URLSearchParams(await readBody(req, 5e4)), st = oauth.takeState(f.get('state'));
    if (!st || !f.get('code')) throw new Error('state');
    const u = upsertOAuth(await oauth.appleProfile(f.get('code'), st.nonce, f.get('user')), 'apple');
    redirect(res, '/', { 'set-cookie': loginUser(res, u) });
  } catch (e) { redirect(res, '/?auth_error=apple'); }
});

/* pedidos y pagos */
const needUser = (req, res) => { const u = userOf(req); if (!u) fail(res, 401, 'Iniciá sesión para comprar.'); return u; };
const ownOrder = (req, res, u, oid) => { const o = db.prepare('SELECT * FROM orders WHERE id=?').get(oid); if (!o || o.user_id !== u.id) { fail(res, 404, 'Pedido no encontrado.'); return null; } return o; };
route('POST', '/api/orders', async (req, res) => {
  const u = needUser(req, res); if (!u) return;
  const mode = bancard.on() ? 'bancard' : orders.cfg.ALLOW_MOCK ? 'mock' : 'off';
  if (mode === 'off') return fail(res, 503, 'Los pagos aún no están habilitados.');
  if (!sec.rateLimit('order:' + u.id, 10, 36e5)) return fail(res, 429, 'Demasiados pedidos seguidos.');
  let o; try { o = orders.create(u, await readJson(req)); } catch (e) { if (e instanceof orders.Bad) return fail(res, 400, e.message); throw e; }
  if (mode === 'mock') return json(res, 201, { order: orders.view(o), payment: { mode } });
  try { const processId = await bancard.singleBuy(o); json(res, 201, { order: orders.view(o), payment: { mode, processId, scriptUrl: bancard.scriptUrl() } }); }
  catch (e) { orders.release(o.id, 'fallido'); console.error('bancard:', e.message); fail(res, 502, 'No pudimos iniciar el pago. Intentá de nuevo.'); }
});
route('POST', '/api/orders/:id/pay-mock', async (req, res, url, p) => {
  const u = needUser(req, res); if (!u) return;
  if (bancard.on() || !orders.cfg.ALLOW_MOCK) return fail(res, 403, 'Pago simulado deshabilitado.');
  const o = ownOrder(req, res, u, p.id); if (!o) return;
  if (o.pay_status !== 'pendiente') return fail(res, 409, 'El pedido ya fue procesado.');
  try { const c = orders.mockCharge((await readJson(req)).card || {}); orders.markPaid(o.id, c.brand, c.last4); json(res, 200, { order: orders.view(db.prepare('SELECT * FROM orders WHERE id=?').get(o.id)) }); }
  catch (e) { if (e instanceof orders.Bad) return fail(res, 400, e.message); throw e; }
});
route('POST', '/api/orders/:id/cancel', (req, res, url, p) => {
  const u = needUser(req, res); if (!u) return; const o = ownOrder(req, res, u, p.id); if (!o) return;
  if (o.pay_status !== 'pendiente') return fail(res, 409, 'El pedido ya fue procesado.');
  orders.release(o.id, 'cancelado'); json(res, 200, { ok: true });
});
route('GET', '/api/orders', (req, res) => { const u = needUser(req, res); if (!u) return; json(res, 200, db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY date DESC LIMIT 100').all(u.id).map((o) => orders.view(o))); });
route('GET', '/api/orders/:id', (req, res, url, p) => { const u = needUser(req, res); if (!u) return; const o = ownOrder(req, res, u, p.id); if (o) json(res, 200, { order: orders.view(o) }); });
route('POST', '/api/bancard/confirm', async (req, res) => {          // llamado por los servidores de Bancard
  if (!bancard.on()) return fail(res, 404, 'No disponible');
  const body = await readJson(req), shop = String(body?.operation?.shop_process_id || '');
  const o = db.prepare('SELECT * FROM orders WHERE bancard_id=?').get(shop);
  const c = bancard.checkConfirm(body, o);
  if (!c.ok || !o) return fail(res, 403, 'Token inválido');
  if (o.pay_status === 'pendiente') { if (c.success) orders.markPaid(o.id, 'Bancard', null); else orders.release(o.id, 'fallido'); }
  json(res, 200, { status: 'success' });
});

/* panel de dueños */
const needAdmin = (req, res) => { if (adminOf(req)) return true; fail(res, 401, 'Acceso restringido.'); return false; };
route('POST', '/api/admin/login', async (req, res) => {
  if (!sec.rateLimit('adm:' + ip(req), 6, 6e5)) return fail(res, 429, 'Demasiados intentos. Esperá unos minutos.');
  const b = await readJson(req), meta = (k) => db.prepare('SELECT v FROM meta WHERE k=?').get(k)?.v;
  const sameUser = ((a, c) => a.length === c.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(c)))(String(b.user || ''), meta('admin_user') || '');
  const okPass = sec.verifyPassword(String(b.pass || ''), meta('admin_pass'));
  if (!sameUser || !okPass) return fail(res, 401, 'Usuario o contraseña incorrectos.');
  json(res, 200, { ok: true }, { 'set-cookie': sec.cookie('nx_admin', sec.createSession('admin', null, 1 / 3), { maxAge: 8 * 3600, secure: cfg.SECURE }) });
});
route('POST', '/api/admin/logout', (req, res) => { sec.destroySession(sec.parseCookies(req.headers.cookie).nx_admin); json(res, 200, { ok: true }, { 'set-cookie': clearCookie('nx_admin') }); });
route('GET', '/api/admin/stats', (req, res, url) => { if (!needAdmin(req, res)) return; const p = url.searchParams.get('period'); if (!['year', 'month', 'week', 'day'].includes(p)) return fail(res, 400, 'Período inválido'); json(res, 200, stats.compute(p)); });
route('GET', '/api/admin/orders', (req, res) => { if (!needAdmin(req, res)) return; json(res, 200, db.prepare('SELECT * FROM orders ORDER BY date DESC LIMIT 80').all().map((o) => orders.view(o))); });
route('PATCH', '/api/admin/orders/:id', async (req, res, url, p) => {
  if (!needAdmin(req, res)) return; const st = (await readJson(req)).status;
  if (!['Pendiente', 'Enviado', 'Entregado', 'Cancelado'].includes(st)) return fail(res, 400, 'Estado inválido');
  const o = db.prepare('SELECT * FROM orders WHERE id=?').get(p.id); if (!o) return fail(res, 404, 'No existe');
  if (o.status === 'Cancelado' && st !== 'Cancelado') return fail(res, 409, 'Un pedido cancelado no se reactiva.');
  tx(() => {
    if (st === 'Cancelado' && o.status !== 'Cancelado') for (const it of db.prepare('SELECT * FROM order_items WHERE order_id=?').all(o.id)) db.prepare('UPDATE products SET stock=stock+? WHERE id=?').run(it.qty, it.product_id);
    db.prepare('UPDATE orders SET status=? WHERE id=?').run(st, o.id);
  });
  json(res, 200, { ok: true });
});
function cleanProduct(b) {
  const s = (v, m) => String(v ?? '').trim().slice(0, m), int = (v, max) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 && n <= max ? n : null; };
  const p = { name: s(b.name, 120), brand: s(b.brand, 60), cat: s(b.cat, 60), art: s(b.art, 20) || 'phone', price: int(b.price, 2e9), stock: int(b.stock, 1e6), descr: s(b.desc, 1000), img: s(b.img, 1.5e6) };
  if (!p.name || !p.brand || !p.cat) return 'Completá nombre, marca y categoría.';
  if (!p.price) return 'El precio debe ser mayor a 0.';
  if (p.stock === null) return 'Stock inválido.';
  if (p.img && !/^(https:\/\/[^\s]+|data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+)$/.test(p.img)) return 'Imagen inválida (usá https:// o subí un archivo).';
  return p;
}
route('POST', '/api/admin/products', async (req, res) => {
  if (!needAdmin(req, res)) return; const p = cleanProduct(await readJson(req)); if (typeof p === 'string') return fail(res, 400, p);
  const pid = id('p_'); db.prepare('INSERT INTO products(id,name,brand,cat,art,price,stock,descr,img,pos) VALUES(?,?,?,?,?,?,?,?,?,(SELECT COALESCE(MIN(pos),0)-1 FROM products))').run(pid, p.name, p.brand, p.cat, p.art, p.price, p.stock, p.descr, p.img || null);
  json(res, 201, pubProduct(db.prepare('SELECT * FROM products WHERE id=?').get(pid)));
});
route('PUT', '/api/admin/products/:id', async (req, res, url, q) => {
  if (!needAdmin(req, res)) return; const old = db.prepare('SELECT * FROM products WHERE id=?').get(q.id); if (!old) return fail(res, 404, 'No existe');
  const p = cleanProduct({ ...pubProduct(old), ...(await readJson(req)) }); if (typeof p === 'string') return fail(res, 400, p);
  db.prepare('UPDATE products SET name=?,brand=?,cat=?,art=?,price=?,stock=?,descr=?,img=? WHERE id=?').run(p.name, p.brand, p.cat, p.art, p.price, p.stock, p.descr, p.img || null, q.id);
  json(res, 200, pubProduct(db.prepare('SELECT * FROM products WHERE id=?').get(q.id)));
});
route('DELETE', '/api/admin/products/:id', (req, res, url, q) => { if (!needAdmin(req, res)) return; db.prepare('DELETE FROM products WHERE id=?').run(q.id); json(res, 200, { ok: true }); });

/* ---------- archivos estáticos (solo index.html y assets/) ---------- */
function serveStatic(req, res, pathname) {
  const rel = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
  if (rel !== 'index.html' && !rel.startsWith('assets/')) return fail(res, 404, 'No encontrado');
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep) || rel.includes('\0')) return fail(res, 400, 'Ruta inválida');
  fs.readFile(file, (err, data) => err ? fail(res, 404, 'No encontrado') : send(res, 200, data, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' }));
}

const server = http.createServer(async (req, res) => {
  res.setHeader('content-security-policy', CSP); res.setHeader('x-content-type-options', 'nosniff'); res.setHeader('referrer-policy', 'same-origin'); res.setHeader('x-frame-options', 'DENY');
  if (cfg.SECURE) res.setHeader('strict-transport-security', 'max-age=31536000');
  try {
    const url = new URL(req.url, cfg.PUBLIC_URL), api = url.pathname.startsWith('/api/');
    if (!api) { if (req.method !== 'GET' && req.method !== 'HEAD') return fail(res, 405, 'Método no permitido'); return serveStatic(req, res, url.pathname); }
    const external = url.pathname === '/api/auth/apple/callback' || url.pathname === '/api/bancard/confirm';
    if (req.method !== 'GET' && !external) {                 // anti-CSRF: JSON + mismo origen
      const o = req.headers.origin;
      if (o && new URL(o).host !== req.headers.host) return fail(res, 403, 'Origen no permitido');
      if (req.method !== 'DELETE' && !(req.headers['content-type'] || '').startsWith('application/json') && Number(req.headers['content-length'] || 0) > 0) return fail(res, 415, 'Se requiere JSON');
    }
    for (const r of routes) {
      if (r.method !== req.method) continue; const m = r.re.exec(url.pathname);
      if (m) return await r.handler(req, res, url, m.groups || {});
    }
    fail(res, 404, 'No encontrado');
  } catch (e) {
    if (e.code === 400 || e.code === 413) return fail(res, e.code, e.message);
    console.error(e); if (!res.headersSent) fail(res, 500, 'Error interno');
  }
});
if (require.main === module) {
  server.listen(cfg.PORT, process.env.HOST || (cfg.PROD ? '127.0.0.1' : '0.0.0.0'), () => {
    console.log(`NEXUSTECH en ${cfg.PUBLIC_URL}  ·  pagos: ${bancard.on() ? 'Bancard' : cfg.ALLOW_MOCK ? 'SIMULADO' : 'deshabilitados'}  ·  Google: ${oauth.googleOn() ? 'sí' : 'no'}  ·  Apple: ${oauth.appleOn() ? 'sí' : 'no'}`);
    if (cfg.ADMIN_PASSWORD_IS_DEFAULT) console.warn('⚠ ADMIN_PASSWORD no está definida: se usa la clave por defecto. Definila en el entorno antes de publicar.');
  });
}
module.exports = { server };
