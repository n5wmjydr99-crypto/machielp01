/* NEXUSTECH · modo local (sin servidor): imita la API en el navegador con localStorage.
   Se usa al abrir index.html con doble clic (file://) o en el archivo único dist/nexustech.html.
   Es solo para demostración: los datos viven en este navegador y la clave de dueños no es segura. */
(function () {
  'use strict';
  const NX = (window.NX = window.NX || {});
  const KEY = 'nxl_db_v1', DAY = 864e5;
  class Err extends Error { constructor(m, status) { super(m); this.status = status; } }
  const bad = (m, s = 400) => { throw new Err(m, s); };

  /* ---------- hash (SHA-256 si hay WebCrypto) ---------- */
  async function hash(s) {
    try { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join(''); }
    catch (e) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return 'x' + h; }
  }
  const ADMIN_HASH = '698d413210c816a99826e6f1284c16e4640216a1fb1af936629b834311aec9f1';   // HOST:Melo.2012 (solo demo)

  /* ---------- base de datos local + semilla de demostración ---------- */
  function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function seed() {
    const r = rng(2012), now = Date.now(), start = new Date(2024, 0, 1).getTime();
    const names = ['Lucía', 'Carlos', 'Mariana', 'Diego', 'Sofía', 'Andrés', 'Valentina', 'Fabián', 'Camila', 'Gustavo', 'Rocío', 'Julián'];
    const last = ['Benítez', 'González', 'Villalba', 'Ortiz', 'Ayala', 'Báez', 'Giménez', 'Acosta', 'Duarte', 'Cabrera'];
    const depts = ['Asunción', 'Central', 'Alto Paraná', 'Itapúa'], prods = NX.PRODUCTS, users = [], orders = [];
    for (let i = 0; i < 380; i++) {
      const c = Math.round(start + (now - 2 * DAY - start) * Math.pow(r(), 0.55)); let del = null;
      if (r() < 0.2) { const d = c + (now - c) * (0.15 + r() * 0.85); if (d < now - DAY / 2) del = Math.round(d); }
      users.push({ id: 'demo' + i, name: names[(r() * names.length) | 0] + ' ' + last[(r() * last.length) | 0], email: `demo${i}@example.invalid`, pass: null, provider: 'demo', createdAt: c, deletedAt: del });
    }
    let n = 0;
    for (let i = 0; i < 1250; i++) {
      const u = users[(Math.pow(r(), 0.8) * users.length) | 0], end = u.deletedAt || now; if (end - u.createdAt < DAY) continue;
      const date = Math.round(u.createdAt + (end - u.createdAt) * Math.pow(r(), 0.7)), items = [], k = 1 + ((r() * 2.4) | 0);
      for (let j = 0; j < k; j++) { const p = prods[(r() * prods.length) | 0]; items.push({ id: p.id, name: p.name, qty: 1 + ((r() * 1.6) | 0), price: p.price }); }
      const sub = items.reduce((a, b) => a + b.price * b.qty, 0), ship = sub > 1000000 ? 0 : 35000;
      orders.push({ id: 'NX-' + (100000 + n++), userId: u.id, customer: u.name, date, status: now - date > 6 * DAY ? 'Entregado' : ['Pendiente', 'Enviado'][(r() * 2) | 0], payStatus: 'pagado',
        subtotal: sub, shipping: ship, total: sub + ship, items,
        delivery: { type: ['Casa', 'Departamento', 'Oficina'][(r() * 3) | 0], calle: 'Av. Mcal. López', nro: String(100 + ((r() * 900) | 0)), barrio: 'Centro', ciudad: depts[(r() * 4) | 0], depto: depts[(r() * 4) | 0], tel: '0981 000 000', ref: '' },
        billing: { ruc: '80000000-0', razon: u.name }, pay: { brand: 'Visa', last4: String(1000 + ((r() * 8999) | 0)) } });
    }
    return { products: NX.PRODUCTS.map((p) => ({ ...p, img: '' })), users, orders, session: null, admin: false };
  }
  let mem = null;
  function load() {
    if (mem) return mem;
    try { const t = localStorage.getItem(KEY); if (t) return (mem = JSON.parse(t)); } catch (e) { /* sin storage */ }
    return (mem = seed());
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* cuota llena: sigue en memoria */ } }
  const db = () => load();
  const me = () => db().users.find((u) => u.id === db().session && !u.deletedAt) || null;
  const pubUser = (u) => u && { id: u.id, name: u.name, email: u.email, provider: u.provider };
  const pubProd = (p) => ({ id: p.id, name: p.name, brand: p.brand, cat: p.cat, art: p.art, price: p.price, stock: p.stock, desc: p.desc || '', img: p.img || '' });
  const uid = (p) => p + Math.random().toString(36).slice(2, 11);

  /* ---------- estadísticas ---------- */
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function buckets(p) {
    const now = new Date(), out = [], d0 = (y, m, d) => new Date(y, m, d).getTime();
    if (p === 'year') for (let y = 2024; y <= now.getFullYear(); y++) out.push({ label: String(y), s: d0(y, 0, 1), e: d0(y + 1, 0, 1) });
    if (p === 'month') for (let i = 11; i >= 0; i--) { const y = now.getFullYear(), m = now.getMonth() - i, a = new Date(y, m, 1); out.push({ label: MES[a.getMonth()] + " '" + String(a.getFullYear()).slice(2), s: a.getTime(), e: d0(y, m + 1, 1) }); }
    if (p === 'week') { const dow = (now.getDay() + 6) % 7; for (let i = 11; i >= 0; i--) { const s = d0(now.getFullYear(), now.getMonth(), now.getDate() - dow - 7 * i), a = new Date(s); out.push({ label: a.getDate() + ' ' + MES[a.getMonth()], s, e: d0(a.getFullYear(), a.getMonth(), a.getDate() + 7) }); } }
    if (p === 'day') for (let i = 29; i >= 0; i--) { const s = d0(now.getFullYear(), now.getMonth(), now.getDate() - i), a = new Date(s); out.push({ label: a.getDate() + '/' + (a.getMonth() + 1), s, e: d0(a.getFullYear(), a.getMonth(), a.getDate() + 1) }); }
    return out;
  }
  function stats(period) {
    if (!['year', 'month', 'week', 'day'].includes(period)) bad('Período inválido');
    const bs = buckets(period), from = bs[0].s, to = bs[bs.length - 1].e, d = db();
    const paid = d.orders.filter((o) => o.payStatus === 'pagado' && o.status !== 'Cancelado' && o.date >= from && o.date < to);
    bs.forEach((b) => {
      const os = paid.filter((o) => o.date >= b.s && o.date < b.e);
      b.rev = os.reduce((a, o) => a + o.total, 0); b.n = os.length;
      b.newC = d.users.filter((u) => u.createdAt >= b.s && u.createdAt < b.e).length;
      b.lostC = d.users.filter((u) => u.deletedAt && u.deletedAt >= b.s && u.deletedAt < b.e).length;
      b.active = d.users.filter((u) => u.createdAt < b.e && (!u.deletedAt || u.deletedAt >= b.e)).length;
    });
    const tp = {}; paid.forEach((o) => o.items.forEach((i) => { tp[i.name] = (tp[i.name] || 0) + i.qty; }));
    return { period, from, buckets: bs, top: Object.entries(tp).sort((a, b) => b[1] - a[1]).slice(0, 7), activeNow: d.users.filter((u) => !u.deletedAt).length };
  }

  /* ---------- pedidos ---------- */
  const DEPTOS = NX.DEPARTAMENTOS, str = (v, m) => String(v ?? '').trim().slice(0, m);
  const luhn = (n) => { let s = 0, d = false; for (let i = n.length - 1; i >= 0; i--) { let x = +n[i]; if (d) { x *= 2; if (x > 9) x -= 9; } s += x; d = !d; } return n.length >= 13 && s % 10 === 0; };
  const brandOf = (n) => (/^4/.test(n) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(n) ? 'Mastercard' : /^3[47]/.test(n) ? 'Amex' : 'Tarjeta');
  function createOrder(u, b) {
    const dd = b.delivery || {}, bb = b.billing || {};
    const delivery = { type: str(dd.type, 20), calle: str(dd.calle, 120), nro: str(dd.nro, 20), piso: str(dd.piso, 60), barrio: str(dd.barrio, 80), ciudad: str(dd.ciudad, 80), depto: str(dd.depto, 40), tel: str(dd.tel, 20), ref: str(dd.ref, 200) };
    if (!['Casa', 'Departamento', 'Oficina'].includes(delivery.type)) bad('Tipo de dirección inválido.');
    if (!delivery.calle || !delivery.nro || !delivery.barrio || !delivery.ciudad) bad('Completá calle, número, barrio y ciudad.');
    if (delivery.type !== 'Casa' && !delivery.piso) bad('Indicá piso / oficina / departamento.');
    if (!DEPTOS.includes(delivery.depto)) bad('Departamento inválido.');
    if (!/^\+?[\d\s-]{8,16}$/.test(delivery.tel)) bad('Teléfono inválido.');
    const billing = { ruc: str(bb.ruc, 15), razon: str(bb.razon, 120) };
    if (!/^\d{5,9}-\d$/.test(billing.ruc)) bad('RUC inválido. Formato: 80012345-6');
    if (billing.razon.length < 3) bad('Ingresá la Razón Social.');
    const d = db(), items = [], seen = new Set();
    if (!Array.isArray(b.items) || !b.items.length) bad('El carrito está vacío.');
    for (const it of b.items) {
      const qty = Math.floor(Number(it.qty)), p = d.products.find((x) => x.id === it.id);
      if (!(qty >= 1 && qty <= 99) || seen.has(it.id)) bad('Carrito inválido.'); seen.add(it.id);
      if (!p) bad('Un artículo ya no está disponible.');
      if (p.stock < qty) bad('Sin stock suficiente de: ' + p.name);
      items.push({ p, qty });
    }
    const subtotal = items.reduce((a, l) => a + l.p.price * l.qty, 0), shipping = subtotal >= 1000000 ? 0 : 35000;
    const n = d.orders.reduce((m, o) => Math.max(m, +o.id.slice(3)), 100000) + 1;
    items.forEach((l) => { l.p.stock -= l.qty; });
    const o = { id: 'NX-' + n, userId: u.id, customer: u.name, date: Date.now(), status: 'Pendiente', payStatus: 'pendiente', subtotal, shipping, total: subtotal + shipping,
      items: items.map((l) => ({ id: l.p.id, name: l.p.name, qty: l.qty, price: l.p.price })), delivery, billing, pay: { brand: null, last4: null } };
    d.orders.push(o); return o;
  }
  const restock = (o) => o.items.forEach((i) => { const p = db().products.find((x) => x.id === i.id); if (p) p.stock += i.qty; });
  const mineOrder = (u, id) => { const o = db().orders.find((x) => x.id === id && x.userId === u.id); if (!o) bad('Pedido no encontrado.', 404); return o; };
  const needUser = () => me() || bad('Iniciá sesión para comprar.', 401);
  const needAdmin = () => { if (!db().admin) bad('Acceso restringido.', 401); };

  function cleanProduct(old, b) {
    const s = (v, m) => String(v ?? '').trim().slice(0, m), int = (v, max) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 && n <= max ? n : null; };
    const m = { ...(old || {}), ...b }, p = { name: s(m.name, 120), brand: s(m.brand, 60), cat: s(m.cat, 60), art: s(m.art, 20) || 'phone', price: int(m.price, 2e9), stock: int(m.stock, 1e6), desc: s(m.desc, 1000), img: s(m.img, 1.5e6) };
    if (!p.name || !p.brand || !p.cat) bad('Completá nombre, marca y categoría.');
    if (!p.price) bad('El precio debe ser mayor a 0.');
    if (p.stock === null) bad('Stock inválido.');
    if (p.img && !/^(https:\/\/[^\s]+|data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+)$/.test(p.img)) bad('Imagen inválida (usá https:// o subí un archivo).');
    return p;
  }

  /* ---------- "servidor" en el navegador ---------- */
  NX.localApi = async function (method, path, body) {
    body = body || {}; const url = new URL(path, 'http://x'), p = url.pathname, d = db(); let m;
    const done = (v) => { save(); return v; };
    if (method === 'GET' && p === '/api/config') return { user: pubUser(me()), admin: d.admin, providers: { google: false, apple: false }, payments: { mode: 'mock' } };
    if (method === 'GET' && p === '/api/products') return d.products.map(pubProd);
    if (method === 'POST' && p === '/api/auth/register') {
      const email = String(body.email || '').trim().toLowerCase(), name = String(body.name || '').trim().slice(0, 100), pass = String(body.pass || '');
      if (!/^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(email)) bad('Ingresá un correo válido.');
      if (name.length < 3) bad('Ingresá tu nombre completo.');
      if (pass.length < 8) bad('La contraseña debe tener al menos 8 caracteres.');
      if (d.users.some((u) => u.email === email && !u.deletedAt)) bad('Ese correo ya tiene una cuenta.', 409);
      const u = { id: uid('u_'), name, email, pass: await hash(email + ':' + pass), provider: 'email', createdAt: Date.now(), deletedAt: null };
      d.users.push(u); d.session = u.id; return done({ user: pubUser(u) });
    }
    if (method === 'POST' && p === '/api/auth/login') {
      const email = String(body.email || '').trim().toLowerCase(), u = d.users.find((x) => x.email === email && !x.deletedAt);
      if (!u || !u.pass || u.pass !== (await hash(email + ':' + String(body.pass || '')))) bad('Correo o contraseña incorrectos.', 401);
      d.session = u.id; return done({ user: pubUser(u) });
    }
    if (method === 'POST' && p === '/api/auth/logout') { d.session = null; return done({ ok: true }); }
    if (method === 'DELETE' && p === '/api/me') { const u = needUser(); u.deletedAt = Date.now(); d.session = null; return done({ ok: true }); }
    if (method === 'POST' && p === '/api/orders') { const u = needUser(), o = createOrder(u, body); return done({ order: o, payment: { mode: 'mock' } }); }
    if (method === 'GET' && p === '/api/orders') return d.orders.filter((o) => o.userId === needUser().id).sort((a, b) => b.date - a.date);
    if ((m = p.match(/^\/api\/orders\/([^/]+)\/pay-mock$/)) && method === 'POST') {
      const u = needUser(), o = mineOrder(u, m[1]); if (o.payStatus !== 'pendiente') bad('El pedido ya fue procesado.', 409);
      const c = body.card || {}, num = String(c.num || '').replace(/\s/g, ''), e = String(c.exp || '').match(/^(\d{2})\/(\d{2})$/);
      if (!/^\d{13,19}$/.test(num) || !luhn(num)) bad('El número de tarjeta no es válido.');
      if (str(c.name, 80).length < 3) bad('Ingresá el nombre del titular.');
      if (!e || +e[1] < 1 || +e[1] > 12 || new Date(2000 + +e[2], +e[1], 1) <= new Date()) bad('La tarjeta está vencida o la fecha es inválida.');
      if (!/^\d{3,4}$/.test(String(c.cvv || ''))) bad('CVV inválido.');
      o.payStatus = 'pagado'; o.pay = { brand: brandOf(num), last4: num.slice(-4) };   // nunca se guarda el número ni el CVV
      return done({ order: o });
    }
    if ((m = p.match(/^\/api\/orders\/([^/]+)\/cancel$/)) && method === 'POST') { const o = mineOrder(needUser(), m[1]); if (o.payStatus !== 'pendiente') bad('El pedido ya fue procesado.', 409); restock(o); o.status = 'Cancelado'; o.payStatus = 'cancelado'; return done({ ok: true }); }
    if ((m = p.match(/^\/api\/orders\/([^/]+)$/)) && method === 'GET') return { order: mineOrder(needUser(), m[1]) };

    if (method === 'POST' && p === '/api/admin/login') {
      if ((await hash(String(body.user || '') + ':' + String(body.pass || ''))) !== ADMIN_HASH) bad('Usuario o contraseña incorrectos.', 401);
      d.admin = true; return done({ ok: true });
    }
    if (method === 'POST' && p === '/api/admin/logout') { d.admin = false; return done({ ok: true }); }
    if (method === 'GET' && p === '/api/admin/stats') { needAdmin(); return stats(url.searchParams.get('period')); }
    if (method === 'GET' && p === '/api/admin/orders') { needAdmin(); return d.orders.slice().sort((a, b) => b.date - a.date).slice(0, 80); }
    if ((m = p.match(/^\/api\/admin\/orders\/([^/]+)$/)) && method === 'PATCH') {
      needAdmin(); const o = d.orders.find((x) => x.id === m[1]); if (!o) bad('No existe', 404);
      if (!['Pendiente', 'Enviado', 'Entregado', 'Cancelado'].includes(body.status)) bad('Estado inválido');
      if (o.status === 'Cancelado' && body.status !== 'Cancelado') bad('Un pedido cancelado no se reactiva.', 409);
      if (body.status === 'Cancelado' && o.status !== 'Cancelado') restock(o);
      o.status = body.status; return done({ ok: true });
    }
    if (method === 'POST' && p === '/api/admin/products') { needAdmin(); const c = cleanProduct(null, body), np = { id: uid('p_'), ...c, img: c.img }; d.products.unshift(np); return done(pubProd(np)); }
    if ((m = p.match(/^\/api\/admin\/products\/([^/]+)$/))) {
      needAdmin(); const i = d.products.findIndex((x) => x.id === m[1]); if (i < 0) bad('No existe', 404);
      if (method === 'PUT') { d.products[i] = { id: m[1], ...cleanProduct(pubProd(d.products[i]), body) }; return done(pubProd(d.products[i])); }
      if (method === 'DELETE') { d.products.splice(i, 1); return done({ ok: true }); }
    }
    bad('No encontrado', 404);
  };
})();
