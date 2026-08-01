import { config } from './config.js';

export function send(res, status, body, headers = {}) {
  const payload = body === undefined || body === null ? '' : JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...headers,
  });
  res.end(payload);
}

export function sendHtml(res, status, html, headers = {}) {
  res.writeHead(status, {
    'content-type': 'text/html; charset=utf-8',
    'content-length': Buffer.byteLength(html),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...headers,
  });
  res.end(html);
}

export function sendNoContent(res, headers = {}) {
  res.writeHead(204, { 'cache-control': 'no-store', ...headers });
  res.end();
}

/**
 * CORS for the collector endpoints. Only origins on the allowlist get a
 * permissive header back; everything else is answered without one, which the
 * browser turns into a blocked request.
 */
export function corsHeaders(origin) {
  if (!origin || !config.allowedOrigins.includes(origin)) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  };
}

export class BodyTooLarge extends Error {}
export class BadJson extends Error {}

/** Read and JSON-parse a request body, refusing anything over the size cap. */
export async function readJson(req, limit = config.maxBodyBytes) {
  const declared = Number.parseInt(req.headers['content-length'] ?? '', 10);
  if (Number.isFinite(declared) && declared > limit) throw new BodyTooLarge();

  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new BodyTooLarge();
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new BadJson('body must be a JSON object');
    }
    return parsed;
  } catch (err) {
    if (err instanceof BadJson) throw err;
    throw new BadJson('malformed JSON');
  }
}
