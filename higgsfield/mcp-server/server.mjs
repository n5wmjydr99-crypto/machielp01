#!/usr/bin/env node
// Conector MCP para Higgsfield (https://cloud.higgsfield.ai) — stdio, sin dependencias (Node >= 18).
//
// Credenciales (variables de entorno, igual que el SDK oficial):
//   HF_KEY="KEY_ID:KEY_SECRET"            o bien
//   HF_API_KEY="KEY_ID" + HF_API_SECRET="KEY_SECRET"
// Opcional: HF_BASE_URL (por defecto https://api.higgsfield.ai)

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { basename, dirname, extname, resolve } from 'node:path';
import { createInterface } from 'node:readline';

const BASE_URL = (process.env.HF_BASE_URL || 'https://api.higgsfield.ai').replace(/\/+$/, '');
const SERVER_INFO = { name: 'higgsfield', version: '1.0.0' };
const DONE = new Set(['completed', 'failed', 'nsfw', 'canceled']);

const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
};

function credential() {
  if (process.env.HF_KEY) return process.env.HF_KEY;
  const { HF_API_KEY: k, HF_API_SECRET: s } = process.env;
  if (k && s) return `${k}:${s}`;
  // En Claude Code en la nube la clave se guarda como "network secret" y el proxy la inyecta en el
  // encabezado Authorization; basta con enviar un valor de relleno que el proxy reemplaza.
  if (process.env.CCR_AGENT_PROXY_ENABLED) return 'proxy-injected';
  throw new Error('Faltan credenciales de Higgsfield: define HF_KEY ("id:secret") o HF_API_KEY + HF_API_SECRET.');
}

async function api(method, path, body) {
  const url = path.startsWith('http') ? path : `${BASE_URL}/${path.replace(/^\/+/, '')}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Key ${credential()}`,
      'Content-Type': 'application/json',
      'User-Agent': 'higgsfield-mcp/1.0',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    const detail = data.detail ?? data.message ?? data.error ?? text;
    const d = String(typeof detail === 'string' ? detail : JSON.stringify(detail));
    const hint = res.status === 402 || /credit/i.test(d) ? ' (créditos insuficientes: recarga en cloud.higgsfield.ai)'
      : /model_not_found/.test(d) ? ' (ruta de modelo inexistente: consulta higgsfield_models)'
      : res.status === 401 || res.status === 403 ? ' (revisa la clave)' : '';
    throw new Error(`Higgsfield ${method} ${url} → ${res.status}${hint}: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  }
  return data;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(requestId, timeoutSec = 600, intervalSec = 3) {
  const deadline = Date.now() + timeoutSec * 1000;
  let last;
  while (Date.now() < deadline) {
    last = await api('GET', `/requests/${encodeURIComponent(requestId)}/status`);
    if (DONE.has(last.status)) return last;
    await sleep(intervalSec * 1000);
  }
  return { ...last, request_id: requestId, note: `Sigue en curso tras ${timeoutSec}s; consulta luego con higgsfield_status.` };
}

// Junta todas las URLs de salida (images[].url, video.url, etc.) para que sean fáciles de usar.
function collectUrls(obj, out = new Set()) {
  if (!obj || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && /^https?:\/\//.test(v) && !/_url$/.test(k)) out.add(v);
    else if (typeof v === 'object') collectUrls(v, out);
  }
  return out;
}

function summarize(result) {
  const urls = [...collectUrls(result)];
  return urls.length ? { ...result, output_urls: urls } : result;
}

// ---------- herramientas ----------
const tools = {
  higgsfield_models: {
    description:
      'Lista el catálogo actual de modelos de Higgsfield (GET /models): slug (ruta para higgsfield_generate), título, ' +
      'descripción, tipo de operación (text2image, image_edit, image2video, text2video, video2video…) y tipo de salida. ' +
      'Úsalo antes de generar para elegir una ruta válida.',
    inputSchema: {
      type: 'object',
      properties: {
        output_type: { type: 'string', enum: ['image', 'video'], description: 'Filtra por tipo de salida' },
        operation: { type: 'string', description: 'Filtra por operación: text2image, image_edit, image2video, text2video, video2video, character' },
        search: { type: 'string', description: 'Texto a buscar en slug, título o descripción (p. ej. "kling", "seedream")' },
      },
    },
    async run({ output_type, operation, search } = {}) {
      const { items = [] } = await api('GET', '/models');
      const q = search?.toLowerCase();
      const list = items
        .filter((m) => !output_type || m.output_type === output_type)
        .filter((m) => !operation || (m.operation_type || []).includes(operation))
        .filter((m) => !q || `${m.slug} ${m.title} ${m.description}`.toLowerCase().includes(q))
        .map(({ slug, title, description, operation_type, output_type: out }) => ({ slug, title, description, operation_type, output_type: out }));
      return { total: list.length, models: list };
    },
  },

  higgsfield_generate: {
    description:
      'Lanza una generación en Higgsfield (imagen, video…). "model" es el slug del modelo (consúltalo con higgsfield_models), ' +
      'p. ej. "bytedance/seedream/v5.0/pro/text-to-image"; "arguments" es el JSON de entrada del modelo (prompt, ' +
      'aspect_ratio, resolution, image_url…). Por defecto espera el resultado y devuelve output_urls.',
    inputSchema: {
      type: 'object',
      properties: {
        model: { type: 'string', description: 'Slug del modelo, p. ej. bytedance/seedream/v5.0/pro/text-to-image (ver higgsfield_models)' },
        arguments: { type: 'object', description: 'Parámetros del modelo (prompt, aspect_ratio, resolution, image_url, duration…)' },
        wait: { type: 'boolean', description: 'Esperar a que termine (por defecto true). false = devolver request_id al instante.' },
        timeout_seconds: { type: 'number', description: 'Máximo de espera si wait=true (por defecto 600).' },
        webhook_url: { type: 'string', description: 'URL opcional que Higgsfield llamará al terminar.' },
      },
      required: ['model', 'arguments'],
    },
    async run({ model, arguments: args, wait = true, timeout_seconds = 600, webhook_url }) {
      let path = model.replace(/^\/+/, '');
      if (webhook_url) path += `?hf_webhook=${encodeURIComponent(webhook_url)}`;
      const sub = await api('POST', path, args ?? {});
      if (!wait) return sub;
      return summarize(await waitFor(sub.request_id, timeout_seconds));
    },
  },

  higgsfield_status: {
    description: 'Consulta el estado de una petición (queued, in_progress, completed, failed, nsfw, canceled). Si está completa incluye las salidas.',
    inputSchema: { type: 'object', properties: { request_id: { type: 'string' } }, required: ['request_id'] },
    async run({ request_id }) {
      return summarize(await api('GET', `/requests/${encodeURIComponent(request_id)}/status`));
    },
  },

  higgsfield_wait: {
    description: 'Espera a que una petición termine y devuelve el resultado con output_urls.',
    inputSchema: {
      type: 'object',
      properties: { request_id: { type: 'string' }, timeout_seconds: { type: 'number' } },
      required: ['request_id'],
    },
    async run({ request_id, timeout_seconds = 600 }) {
      return summarize(await waitFor(request_id, timeout_seconds));
    },
  },

  higgsfield_cancel: {
    description: 'Cancela una petición que todavía está en cola (las que ya empezaron no se pueden cancelar).',
    inputSchema: { type: 'object', properties: { request_id: { type: 'string' } }, required: ['request_id'] },
    async run({ request_id }) {
      await api('POST', `/requests/${encodeURIComponent(request_id)}/cancel`);
      return { request_id, canceled: true };
    },
  },

  higgsfield_upload: {
    description: 'Sube un archivo local (imagen/video/audio) a Higgsfield y devuelve su URL pública, para usarla como image_url, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Ruta local del archivo' },
        content_type: { type: 'string', description: 'MIME opcional; se deduce de la extensión' },
      },
      required: ['path'],
    },
    async run({ path, content_type }) {
      const file = resolve(path);
      const type = content_type || MIME[extname(file).toLowerCase()] || 'application/octet-stream';
      const data = await readFile(file);
      const slot = await api('POST', '/files/generate-upload-url', { content_type: type });
      const put = await fetch(slot.upload_url, {
        method: 'PUT',
        headers: slot.upload_headers || { 'Content-Type': type },
        body: data,
      });
      if (!put.ok) throw new Error(`Falló la subida (${put.status}): ${await put.text()}`);
      return { file: basename(file), content_type: type, bytes: data.length, public_url: slot.public_url };
    },
  },

  higgsfield_download: {
    description: 'Descarga una URL de salida de Higgsfield a un archivo local.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        path: { type: 'string', description: 'Ruta destino (se crean las carpetas). Por defecto ./higgsfield-output/<nombre>' },
      },
      required: ['url'],
    },
    async run({ url, path }) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`No se pudo descargar (${res.status})`);
      const name = basename(new URL(url).pathname) || `output-${Date.now()}`;
      const dest = resolve(path || `higgsfield-output/${name}`);
      await mkdir(dirname(dest), { recursive: true });
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(dest, buf);
      return { saved_to: dest, bytes: buf.length };
    },
  },
};

// ---------- protocolo MCP (JSON-RPC 2.0 por stdio, un mensaje por línea) ----------
const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');
const log = (...a) => process.stderr.write(`[higgsfield-mcp] ${a.join(' ')}\n`);

async function handle(msg) {
  const { id, method, params } = msg;
  const reply = (result) => id !== undefined && send({ jsonrpc: '2.0', id, result });
  const fail = (code, message) => id !== undefined && send({ jsonrpc: '2.0', id, error: { code, message } });

  switch (method) {
    case 'initialize':
      return reply({
        protocolVersion: params?.protocolVersion || '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
        instructions: 'Genera imágenes y videos con Higgsfield. Usa higgsfield_upload para entradas locales y higgsfield_generate para generar.',
      });
    case 'ping':
      return reply({});
    case 'tools/list':
      return reply({
        tools: Object.entries(tools).map(([name, t]) => ({ name, description: t.description, inputSchema: t.inputSchema })),
      });
    case 'tools/call': {
      const tool = tools[params?.name];
      if (!tool) return fail(-32602, `Herramienta desconocida: ${params?.name}`);
      try {
        const out = await tool.run(params.arguments || {});
        return reply({ content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] });
      } catch (e) {
        log(e.message);
        return reply({ content: [{ type: 'text', text: e.message }], isError: true });
      }
    }
    default:
      if (method?.startsWith('notifications/')) return;
      return fail(-32601, `Método no soportado: ${method}`);
  }
}

createInterface({ input: process.stdin }).on('line', (line) => {
  if (!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); } catch { return send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON inválido' } }); }
  handle(msg).catch((e) => log('error interno:', e.stack || e));
});
log(`listo (API ${BASE_URL})`);
