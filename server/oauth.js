'use strict';
const crypto = require('node:crypto');
const cfg = require('./config');
const { db, id } = require('./db');

/* El "state" vive en la base (no en una cookie) porque Apple vuelve con un POST entre sitios. Un solo uso, 10 min. */
function newState(extra) {
  const state = crypto.randomBytes(24).toString('base64url');
  db.prepare("INSERT INTO sessions(token,kind,user_id,expires) VALUES(?,?,?,?)").run('st_' + state, 'oauth', extra || '', Date.now() + 6e5);
  return state;
}
function takeState(state) {
  if (!state) return null;
  const r = db.prepare("SELECT * FROM sessions WHERE token=? AND kind='oauth'").get('st_' + state);
  if (!r) return null;
  db.prepare('DELETE FROM sessions WHERE token=?').run(r.token);
  return r.expires > Date.now() ? { nonce: r.user_id } : null;
}
const enc = (o) => new URLSearchParams(o).toString();
const b64u = (b) => Buffer.from(b).toString('base64url');

/* ---- Google (OpenID Connect, flujo de código) ---- */
const googleOn = () => !!(cfg.google.id && cfg.google.secret);
const googleRedirect = () => cfg.PUBLIC_URL + '/api/auth/google/callback';
function googleUrl() {
  return 'https://accounts.google.com/o/oauth2/v2/auth?' + enc({ client_id: cfg.google.id, redirect_uri: googleRedirect(), response_type: 'code', scope: 'openid email profile', state: newState(), prompt: 'select_account' });
}
async function googleProfile(code) {
  const t = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: enc({ code, client_id: cfg.google.id, client_secret: cfg.google.secret, redirect_uri: googleRedirect(), grant_type: 'authorization_code' }) })).json();
  if (!t.access_token) throw new Error('Google rechazó el código');
  const p = await (await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { authorization: 'Bearer ' + t.access_token } })).json();
  if (!p.email || p.email_verified !== true) throw new Error('Correo de Google no verificado');
  return { email: p.email.toLowerCase(), name: p.name || p.email.split('@')[0] };
}

/* ---- Sign in with Apple ---- */
const appleOn = () => !!(cfg.apple.clientId && cfg.apple.teamId && cfg.apple.keyId && cfg.apple.privateKey);
const appleRedirect = () => cfg.PUBLIC_URL + '/api/auth/apple/callback';
function appleSecret() {                     // client_secret = JWT ES256 firmado con la clave .p8
  const head = b64u(JSON.stringify({ alg: 'ES256', kid: cfg.apple.keyId, typ: 'JWT' })), now = Math.floor(Date.now() / 1000);
  const body = b64u(JSON.stringify({ iss: cfg.apple.teamId, iat: now, exp: now + 600, aud: 'https://appleid.apple.com', sub: cfg.apple.clientId }));
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + body), { key: cfg.apple.privateKey, dsaEncoding: 'ieee-p1363' });
  return head + '.' + body + '.' + b64u(sig);
}
function appleUrl() {
  const nonce = crypto.randomBytes(16).toString('hex');
  return 'https://appleid.apple.com/auth/authorize?' + enc({ client_id: cfg.apple.clientId, redirect_uri: appleRedirect(), response_type: 'code', response_mode: 'form_post', scope: 'name email', state: newState(nonce), nonce });
}
async function appleProfile(code, nonce, userJson) {
  const t = await (await fetch('https://appleid.apple.com/auth/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: enc({ client_id: cfg.apple.clientId, client_secret: appleSecret(), code, grant_type: 'authorization_code', redirect_uri: appleRedirect() }) })).json();
  if (!t.id_token) throw new Error('Apple rechazó el código');
  // el id_token llega directo del endpoint de Apple por TLS; igual validamos emisor, audiencia, vencimiento y nonce
  const c = JSON.parse(Buffer.from(t.id_token.split('.')[1], 'base64url').toString());
  if (c.iss !== 'https://appleid.apple.com' || c.aud !== cfg.apple.clientId || c.exp * 1000 < Date.now() || c.nonce !== nonce) throw new Error('Token de Apple inválido');
  if (!c.email) throw new Error('Apple no entregó un correo');
  let name = c.email.split('@')[0];
  try { const u = JSON.parse(userJson || '{}'); if (u.name) name = [u.name.firstName, u.name.lastName].filter(Boolean).join(' ') || name; } catch (e) { /* ignorar */ }
  return { email: c.email.toLowerCase(), name };
}
module.exports = { googleOn, googleUrl, googleProfile, appleOn, appleUrl, appleProfile, takeState };
