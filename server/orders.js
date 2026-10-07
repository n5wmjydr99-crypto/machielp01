'use strict';
const { db, tx } = require('./db');
const bancard = require('./bancard');
const cfg = require('./config');

const shipCost = (sub) => (sub >= 1000000 ? 0 : 35000);
const DEPTOS = ['Asunción', 'Central', 'Alto Paraná', 'Itapúa', 'Concepción', 'San Pedro', 'Cordillera', 'Guairá', 'Caaguazú', 'Caazapá', 'Misiones', 'Paraguarí', 'Ñeembucú', 'Amambay', 'Canindeyú', 'Presidente Hayes', 'Boquerón', 'Alto Paraguay'];
const str = (v, max) => String(v ?? '').trim().slice(0, max);
class Bad extends Error {}

function validate(body) {
  const d = body.delivery || {}, b = body.billing || {};
  const delivery = { type: str(d.type, 20), calle: str(d.calle, 120), nro: str(d.nro, 20), piso: str(d.piso, 60), barrio: str(d.barrio, 80), ciudad: str(d.ciudad, 80), depto: str(d.depto, 40), tel: str(d.tel, 20), ref: str(d.ref, 200) };
  if (!['Casa', 'Departamento', 'Oficina'].includes(delivery.type)) throw new Bad('Tipo de dirección inválido.');
  if (!delivery.calle || !delivery.nro || !delivery.barrio || !delivery.ciudad) throw new Bad('Completá calle, número, barrio y ciudad.');
  if (delivery.type !== 'Casa' && !delivery.piso) throw new Bad('Indicá piso / oficina / departamento.');
  if (!DEPTOS.includes(delivery.depto)) throw new Bad('Departamento inválido.');
  if (!/^\+?[\d\s-]{8,16}$/.test(delivery.tel)) throw new Bad('Teléfono inválido.');
  const billing = { ruc: str(b.ruc, 15), razon: str(b.razon, 120) };
  if (!/^\d{5,9}-\d$/.test(billing.ruc)) throw new Bad('RUC inválido. Formato: 80012345-6');
  if (billing.razon.length < 3) throw new Bad('Ingresá la Razón Social.');
  return { delivery, billing };
}

/* crea el pedido y reserva stock; todos los precios salen de la base, nunca del cliente */
function create(user, body) {
  const { delivery, billing } = validate(body);
  const raw = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  if (!raw.length) throw new Bad('El carrito está vacío.');
  return tx(() => {
    const lines = [], seen = new Set();
    for (const it of raw) {
      const qty = Math.floor(Number(it.qty)); if (!(qty >= 1 && qty <= 99) || seen.has(it.id)) throw new Bad('Carrito inválido.'); seen.add(it.id);
      const p = db.prepare('SELECT * FROM products WHERE id=?').get(String(it.id));
      if (!p) throw new Bad('Un artículo ya no está disponible.');
      if (p.stock < qty) throw new Bad('Sin stock suficiente de: ' + p.name);
      lines.push({ p, qty });
    }
    const subtotal = lines.reduce((a, l) => a + l.p.price * l.qty, 0), shipping = shipCost(subtotal), total = subtotal + shipping;
    const n = (db.prepare("SELECT COALESCE(MAX(CAST(SUBSTR(id,4) AS INTEGER)),100000)+1 n FROM orders").get().n);
    const oid = 'NX-' + n;
    db.prepare("INSERT INTO orders(id,user_id,customer,date,status,pay_status,subtotal,shipping,total,delivery,billing,bancard_id) VALUES(?,?,?,?,'Pendiente','pendiente',?,?,?,?,?,?)")
      .run(oid, user.id, user.name, Date.now(), subtotal, shipping, total, JSON.stringify(delivery), JSON.stringify(billing), String(n));
    for (const l of lines) {
      db.prepare('UPDATE products SET stock=stock-? WHERE id=? AND stock>=?').run(l.qty, l.p.id, l.qty);
      db.prepare('INSERT INTO order_items(order_id,product_id,name,qty,price) VALUES(?,?,?,?,?)').run(oid, l.p.id, l.p.name, l.qty, l.p.price);
    }
    return db.prepare('SELECT * FROM orders WHERE id=?').get(oid);
  });
}
function release(orderId, newStatus) {          // devuelve el stock reservado y marca el pedido como cancelado
  tx(() => {
    const o = db.prepare('SELECT * FROM orders WHERE id=?').get(orderId);
    if (!o || o.status === 'Cancelado' || o.pay_status === 'pagado') return;
    for (const it of db.prepare('SELECT * FROM order_items WHERE order_id=?').all(orderId)) db.prepare('UPDATE products SET stock=stock+? WHERE id=?').run(it.qty, it.product_id);
    db.prepare("UPDATE orders SET status='Cancelado', pay_status=? WHERE id=?").run(newStatus || 'fallido', orderId);
  });
}
function markPaid(orderId, brand, last4) { db.prepare("UPDATE orders SET pay_status='pagado', pay_brand=?, pay_last4=? WHERE id=? AND pay_status='pendiente'").run(brand || null, last4 || null, orderId); }
setInterval(() => {                              // pedidos sin pagar tras 30 min liberan su stock
  for (const o of db.prepare("SELECT id FROM orders WHERE pay_status='pendiente' AND date<?").all(Date.now() - 18e5)) release(o.id, 'expirado');
}, 6e4).unref();

const view = (o, withItems = true) => ({ id: o.id, date: o.date, status: o.status, payStatus: o.pay_status, subtotal: o.subtotal, shipping: o.shipping, total: o.total, customer: o.customer,
  delivery: JSON.parse(o.delivery), billing: JSON.parse(o.billing), pay: { brand: o.pay_brand, last4: o.pay_last4 },
  items: withItems ? db.prepare('SELECT product_id id,name,qty,price FROM order_items WHERE order_id=?').all(o.id) : undefined });

/* ---- pago simulado (sin Bancard): validación server-side y solo se guardan marca + últimos 4 ---- */
const luhn = (n) => { let s = 0, d = false; for (let i = n.length - 1; i >= 0; i--) { let x = +n[i]; if (d) { x *= 2; if (x > 9) x -= 9; } s += x; d = !d; } return n.length >= 13 && s % 10 === 0; };
const brandOf = (n) => (/^4/.test(n) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(n) ? 'Mastercard' : /^3[47]/.test(n) ? 'Amex' : 'Tarjeta');
function mockCharge(card) {
  const num = String(card.num || '').replace(/\s/g, ''), m = String(card.exp || '').match(/^(\d{2})\/(\d{2})$/);
  if (!/^\d{13,19}$/.test(num) || !luhn(num)) throw new Bad('El número de tarjeta no es válido.');
  if (str(card.name, 80).length < 3) throw new Bad('Ingresá el nombre del titular.');
  if (!m || +m[1] < 1 || +m[1] > 12 || new Date(2000 + +m[2], +m[1], 1) <= new Date()) throw new Bad('La tarjeta está vencida o la fecha es inválida.');
  if (!/^\d{3,4}$/.test(String(card.cvv || ''))) throw new Bad('CVV inválido.');
  return { brand: brandOf(num), last4: num.slice(-4) };
}
module.exports = { create, release, markPaid, view, mockCharge, Bad, DEPTOS, bancard, cfg };
