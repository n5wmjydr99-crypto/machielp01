'use strict';
const { db } = require('./db');
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function buckets(p) {
  const now = new Date(), out = [], d0 = (y, m, d) => new Date(y, m, d).getTime();
  if (p === 'year') for (let y = 2024; y <= now.getFullYear(); y++) out.push({ label: String(y), s: d0(y, 0, 1), e: d0(y + 1, 0, 1) });
  if (p === 'month') for (let i = 11; i >= 0; i--) { const y = now.getFullYear(), m = now.getMonth() - i, a = new Date(y, m, 1); out.push({ label: MES[a.getMonth()] + " '" + String(a.getFullYear()).slice(2), s: a.getTime(), e: d0(y, m + 1, 1) }); }
  if (p === 'week') { const dow = (now.getDay() + 6) % 7; for (let i = 11; i >= 0; i--) { const s = d0(now.getFullYear(), now.getMonth(), now.getDate() - dow - 7 * i), a = new Date(s); out.push({ label: a.getDate() + ' ' + MES[a.getMonth()], s, e: d0(a.getFullYear(), a.getMonth(), a.getDate() + 7) }); } }
  if (p === 'day') for (let i = 29; i >= 0; i--) { const s = d0(now.getFullYear(), now.getMonth(), now.getDate() - i), a = new Date(s); out.push({ label: a.getDate() + '/' + (a.getMonth() + 1), s, e: d0(a.getFullYear(), a.getMonth(), a.getDate() + 1) }); }
  return out;
}
function compute(period) {
  const bs = buckets(period); if (!bs.length) return null;
  const from = bs[0].s, to = bs[bs.length - 1].e;
  // solo cuentan pedidos pagados y no cancelados
  const orders = db.prepare("SELECT id,date,total FROM orders WHERE pay_status='pagado' AND status!='Cancelado' AND date>=? AND date<?").all(from, to);
  const users = db.prepare('SELECT created_at c, deleted_at d FROM users').all();
  bs.forEach((b) => {
    const os = orders.filter((o) => o.date >= b.s && o.date < b.e);
    b.rev = os.reduce((a, o) => a + o.total, 0); b.n = os.length;
    b.newC = users.filter((u) => u.c >= b.s && u.c < b.e).length;
    b.lostC = users.filter((u) => u.d && u.d >= b.s && u.d < b.e).length;
    b.active = users.filter((u) => u.c < b.e && (!u.d || u.d >= b.e)).length;
  });
  const top = db.prepare(`SELECT oi.name, SUM(oi.qty) q FROM order_items oi JOIN orders o ON o.id=oi.order_id
    WHERE o.pay_status='pagado' AND o.status!='Cancelado' AND o.date>=? AND o.date<? GROUP BY oi.name ORDER BY q DESC LIMIT 7`).all(from, to).map((r) => [r.name, r.q]);
  return { period, from, buckets: bs, top, activeNow: users.filter((u) => !u.d).length };
}
module.exports = { compute };
