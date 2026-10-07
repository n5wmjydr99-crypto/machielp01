'use strict';
/* Integración Bancard vPOS 2.0 ("single_buy"). Los datos de la tarjeta se ingresan en el iframe de Bancard:
   nunca pasan por este servidor. Verificá nombres de campos y URLs contra la documentación que te entrega Bancard. */
const crypto = require('node:crypto');
const cfg = require('./config');
const md5 = (s) => crypto.createHash('md5').update(s).digest('hex');
const on = () => !!(cfg.bancard.publicKey && cfg.bancard.privateKey);
const amountStr = (n) => Number(n).toFixed(2);

async function singleBuy(order) {
  const shop = String(order.bancard_id), amount = amountStr(order.total), cur = 'PYG';
  const res = await fetch(cfg.bancard.base + '/vpos/api/0.3/single_buy', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ public_key: cfg.bancard.publicKey, operation: {
      token: md5(cfg.bancard.privateKey + shop + amount + cur), shop_process_id: Number(shop), amount, currency: cur,
      additional_data: '', description: 'Pedido ' + order.id + ' NEXUSTECH',
      return_url: cfg.PUBLIC_URL + '/?pedido=' + encodeURIComponent(order.id), cancel_url: cfg.PUBLIC_URL + '/?pedido=' + encodeURIComponent(order.id) + '&cancelado=1' } })
  });
  const j = await res.json().catch(() => ({}));
  if (j.status !== 'success' || !j.process_id) throw new Error('Bancard no creó la operación');
  return j.process_id;
}
/* Webhook de confirmación. Devuelve {ok, success, shop} sólo si el token coincide. */
function checkConfirm(body, order) {
  const op = body && body.operation; if (!op) return { ok: false };
  const expected = md5(cfg.bancard.privateKey + op.shop_process_id + 'confirm' + op.amount + op.currency);
  const good = typeof op.token === 'string' && op.token.length === expected.length && crypto.timingSafeEqual(Buffer.from(op.token), Buffer.from(expected));
  if (!good) return { ok: false };
  if (order && (op.amount !== amountStr(order.total) || op.currency !== 'PYG')) return { ok: false };
  return { ok: true, success: op.response === 'S' && op.response_code === '00', shop: String(op.shop_process_id) };
}
module.exports = { on, singleBuy, checkConfirm, scriptUrl: () => cfg.bancard.base + '/checkout/javascript/dist/bancard-checkout-3.0.0.js' };
