'use strict';
const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');

const file = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'nexustech.db');
if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
const db = new DatabaseSync(file);
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, pass TEXT, provider TEXT NOT NULL DEFAULT 'email',
  created_at INTEGER NOT NULL, deleted_at INTEGER, seed INTEGER NOT NULL DEFAULT 0);
CREATE UNIQUE INDEX IF NOT EXISTS users_email ON users(email) WHERE deleted_at IS NULL;
CREATE TABLE IF NOT EXISTS sessions(
  token TEXT PRIMARY KEY, kind TEXT NOT NULL, user_id TEXT, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS products(
  id TEXT PRIMARY KEY, name TEXT NOT NULL, brand TEXT NOT NULL, cat TEXT NOT NULL, art TEXT, price INTEGER NOT NULL CHECK(price>=0),
  stock INTEGER NOT NULL CHECK(stock>=0), descr TEXT, img TEXT, pos INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS orders(
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, customer TEXT, date INTEGER NOT NULL, status TEXT NOT NULL, pay_status TEXT NOT NULL DEFAULT 'pendiente',
  subtotal INTEGER NOT NULL, shipping INTEGER NOT NULL, total INTEGER NOT NULL,
  delivery TEXT NOT NULL, billing TEXT NOT NULL, pay_brand TEXT, pay_last4 TEXT, bancard_id TEXT, seed INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS orders_date ON orders(date);
CREATE TABLE IF NOT EXISTS order_items(
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE, product_id TEXT, name TEXT NOT NULL, qty INTEGER NOT NULL, price INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS oi_order ON order_items(order_id);
CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY, v TEXT);
`);

const id = (p = '') => p + crypto.randomBytes(9).toString('base64url');
function tx(fn) {            // transacción simple: si algo falla, rollback
  db.exec('BEGIN IMMEDIATE');
  try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
}
module.exports = { db, id, tx };
