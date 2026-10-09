'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ctx = {}; ctx.window = ctx;
require('node:vm').runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'assets', 'data.js'), 'utf8'), ctx);
module.exports = { PRODUCTS: ctx.NX.PRODUCTS, COMBO: ctx.NX.COMBO };
