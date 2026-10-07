'use strict';
const crypto = require('node:crypto');
const { db, id } = require('./db');

/* contraseñas: scrypt con sal */
function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  return 'scrypt$' + salt.toString('hex') + '$' + crypto.scryptSync(pw, salt, 64).toString('hex');
}
function verifyPassword(pw, stored) {
  if (!stored || !stored.startsWith('scrypt$')) return false;
  const [, s, h] = stored.split('$');
  const a = Buffer.from(h, 'hex'), b = crypto.scryptSync(pw, Buffer.from(s, 'hex'), 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* sesiones en base de datos, cookie HttpOnly */
const DAY = 864e5;
function createSession(kind, userId, days = 14) {
  const token = crypto.randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO sessions(token,kind,user_id,expires) VALUES(?,?,?,?)').run(token, kind, userId || null, Date.now() + days * DAY);
  return token;
}
function getSession(token, kind) {
  if (!token) return null;
  const s = db.prepare('SELECT * FROM sessions WHERE token=?').get(token);
  if (!s || s.expires < Date.now() || s.kind !== kind) return null;
  return s;
}
const destroySession = (t) => t && db.prepare('DELETE FROM sessions WHERE token=?').run(t);
setInterval(() => db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now()), 36e5).unref();

function parseCookies(h) { const o = {}; (h || '').split(';').forEach((p) => { const i = p.indexOf('='); if (i > 0) o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); }); return o; }
function cookie(name, val, { maxAge, secure } = {}) {
  return `${name}=${encodeURIComponent(val)}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}${maxAge != null ? '; Max-Age=' + maxAge : ''}`;
}

/* límite de intentos (por IP + clave) */
const hits = new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now(), arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now); hits.set(key, arr);
  return arr.length <= max;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some((t) => now - t < 36e5)) hits.delete(k); }, 6e5).unref();

module.exports = { hashPassword, verifyPassword, createSession, getSession, destroySession, parseCookies, cookie, rateLimit, id };
