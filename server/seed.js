'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { db, id, tx } = require('./db');
const cfg = require('./config');
const { hashPassword, verifyPassword } = require('./security');

function loadCatalog() {
  const ctx = {}; ctx.window = ctx; require('node:vm').runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'assets', 'data.js'), 'utf8'), ctx);
  return ctx.NX.PRODUCTS;
}
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function run() {
  const meta = (k) => db.prepare('SELECT v FROM meta WHERE k=?').get(k)?.v;
  const setMeta = (k, v) => db.prepare('INSERT INTO meta(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v').run(k, v);
  // admin: el entorno es la fuente de verdad; si usuario o clave cambian, se actualiza el hash guardado
  if (meta('admin_user') !== cfg.ADMIN_USER || !verifyPassword(cfg.ADMIN_PASSWORD, meta('admin_pass'))) {
    setMeta('admin_user', cfg.ADMIN_USER); setMeta('admin_pass', hashPassword(cfg.ADMIN_PASSWORD));
    db.prepare("DELETE FROM sessions WHERE kind='admin'").run();      // cerrar sesiones de dueño al rotar la clave
  }
  if (db.prepare('SELECT COUNT(*) c FROM products').get().c === 0) {
    const ins = db.prepare('INSERT INTO products(id,name,brand,cat,art,price,stock,descr,img,pos) VALUES(?,?,?,?,?,?,?,?,NULL,?)');
    tx(() => loadCatalog().forEach((p, i) => ins.run(p.id, p.name, p.brand, p.cat, p.art, p.price, p.stock, p.desc, i)));
  }
  if (cfg.SEED_DEMO && !meta('seeded')) {
    const r = rng(2012), now = Date.now(), start = new Date(2024, 0, 1).getTime(), DAY = 864e5;
    const names = ['Lucía', 'Carlos', 'Mariana', 'Diego', 'Sofía', 'Andrés', 'Valentina', 'Fabián', 'Camila', 'Gustavo', 'Rocío', 'Julián'];
    const last = ['Benítez', 'González', 'Villalba', 'Ortiz', 'Ayala', 'Báez', 'Giménez', 'Acosta', 'Duarte', 'Cabrera'];
    const prods = db.prepare('SELECT id,name,price FROM products').all(), depts = ['Asunción', 'Central', 'Alto Paraná', 'Itapúa'];
    const iu = db.prepare('INSERT INTO users(id,name,email,pass,provider,created_at,deleted_at,seed) VALUES(?,?,?,NULL,?,?,?,1)');
    const io = db.prepare("INSERT INTO orders(id,user_id,customer,date,status,pay_status,subtotal,shipping,total,delivery,billing,pay_brand,pay_last4,seed) VALUES(?,?,?,?,?,'pagado',?,?,?,?,?,?,?,1)");
    const ii = db.prepare('INSERT INTO order_items(order_id,product_id,name,qty,price) VALUES(?,?,?,?,?)');
    tx(() => {
      const users = [];
      for (let i = 0; i < 380; i++) {
        const created = Math.round(start + (now - 2 * DAY - start) * Math.pow(r(), 0.55)); let del = null;
        if (r() < 0.2) { const d = created + (now - created) * (0.15 + r() * 0.85); if (d < now - DAY / 2) del = Math.round(d); }
        const u = { id: 'demo' + i, name: names[(r() * names.length) | 0] + ' ' + last[(r() * last.length) | 0], created, del };
        iu.run(u.id, u.name, `demo${i}@example.invalid`, 'demo', created, del); users.push(u);
      }
      let n = 0;
      for (let i = 0; i < 1250; i++) {
        const u = users[(Math.pow(r(), 0.8) * users.length) | 0], end = u.del || now; if (end - u.created < DAY) continue;
        const date = Math.round(u.created + (end - u.created) * Math.pow(r(), 0.7)), items = [], k = 1 + ((r() * 2.4) | 0);
        for (let j = 0; j < k; j++) { const p = prods[(r() * prods.length) | 0]; items.push({ p, qty: 1 + ((r() * 1.6) | 0) }); }
        const sub = items.reduce((a, b) => a + b.p.price * b.qty, 0), ship = sub > 1000000 ? 0 : 35000, oid = 'NX-' + (100000 + n++);
        const d = { type: ['Casa', 'Departamento', 'Oficina'][(r() * 3) | 0], calle: 'Av. Mcal. López', nro: String(100 + ((r() * 900) | 0)), barrio: 'Centro', ciudad: depts[(r() * 4) | 0], depto: depts[(r() * 4) | 0], tel: '0981 000 000', ref: '' };
        io.run(oid, u.id, u.name, date, now - date > 6 * DAY ? 'Entregado' : ['Pendiente', 'Enviado'][(r() * 2) | 0], sub, ship, sub + ship, JSON.stringify(d), JSON.stringify({ ruc: '80000000-0', razon: u.name }), 'Visa', String(1000 + ((r() * 8999) | 0)));
        items.forEach((it) => ii.run(oid, it.p.id, it.p.name, it.qty, it.p.price));
      }
    });
    setMeta('seeded', '1');
  }
}
module.exports = { run };
