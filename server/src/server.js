import { createServer } from 'node:http';
import { config } from './config.js';
import { ensureProject, findProject, getDb } from './db.js';
import {
  BadJson,
  BodyTooLarge,
  corsHeaders,
  readJson,
  send,
  sendNoContent,
} from './http.js';
import { clientIp, visitorHash } from './visitor.js';
import { checkRate } from './ratelimit.js';
import {
  domainAcceptsMail,
  submittedTooFast,
  suggestDomainFix,
  trippedHoneypot,
} from './spam.js';
import {
  cleanProps,
  isValidEventName,
  normaliseEmail,
  safePath,
  safeReferrer,
  text,
} from './validate.js';

const started = new Date().toISOString();

/**
 * POST /submit — a lead. Body: { project, email, props?, hp? }
 *
 * Repeat submissions of the same address merge into the existing row instead of
 * creating a duplicate, so the lead count stays honest.
 */
async function handleSubmit(req, res, body, ctx) {
  const project = findProject(text(body.project, 64) ?? '');
  if (!project) return send(res, 400, { error: 'unknown project' }, ctx.cors);

  // Bots get a 204: indistinguishable from success, so nothing is learned from
  // probing, and nothing is stored.
  if (trippedHoneypot(body) || submittedTooFast(body)) {
    console.log('[spam] discarded submit');
    return sendNoContent(res, ctx.cors);
  }

  const email = normaliseEmail(body.email);
  if (!email) return send(res, 422, { error: 'invalid email' }, ctx.cors);

  // Offer the correction rather than storing a dead address. The client shows
  // it as "did you mean…" and resubmits if the visitor agrees.
  const fix = suggestDomainFix(email);
  if (fix) return send(res, 422, { error: 'likely typo', suggestion: fix }, ctx.cors);

  if (!(await domainAcceptsMail(email))) {
    return send(res, 422, { error: 'domain does not accept mail' }, ctx.cors);
  }

  const rate = checkRate('submit', ctx.visitor, config.limits.submitsPerHour);
  if (!rate.allowed) {
    return send(
      res,
      429,
      { error: 'too many submissions' },
      { ...ctx.cors, 'retry-after': String(rate.retryAfter) },
    );
  }

  const props = cleanProps(body.props);

  getDb()
    .prepare(
      `INSERT INTO leads (project_id, email, props_json, ip_hash, ua)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(project_id, email) DO UPDATE SET
         props_json = excluded.props_json`,
    )
    .run(project.id, email, JSON.stringify(props), ctx.visitor, ctx.ua);

  return sendNoContent(res, ctx.cors);
}

/**
 * POST /event — a pageview or custom event.
 * Body: { project, name, props?, path?, referrer?, lang?, utm? }
 *
 * Always answers 204, even for input we discard: analytics must never be able
 * to break or slow the page it is measuring.
 */
function handleEvent(req, res, body, ctx) {
  const project = findProject(text(body.project, 64) ?? '');
  if (!project) return sendNoContent(res, ctx.cors);

  const name = text(body.name, 64);
  if (!isValidEventName(name)) return sendNoContent(res, ctx.cors);

  // Over the limit we drop the event silently rather than 429 — a rate-limited
  // tracker should never surface an error into the page.
  if (!checkRate('event', ctx.visitor, config.limits.eventsPerHour).allowed) {
    return sendNoContent(res, ctx.cors);
  }

  const utm = body.utm && typeof body.utm === 'object' ? body.utm : {};

  getDb()
    .prepare(
      `INSERT INTO events
        (project_id, name, props_json, path, referrer,
         utm_source, utm_medium, utm_campaign, lang, visitor_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      project.id,
      name,
      JSON.stringify(cleanProps(body.props)),
      safePath(body.path),
      safeReferrer(body.referrer),
      text(utm.source, 100),
      text(utm.medium, 100),
      text(utm.campaign, 100),
      text(body.lang, 12),
      ctx.visitor,
    );

  return sendNoContent(res, ctx.cors);
}

function handleHealth(res) {
  const db = getDb();
  const { c: leads } = db.prepare('SELECT count(*) c FROM leads').get();
  const { c: events } = db.prepare('SELECT count(*) c FROM events').get();
  return send(res, 200, { ok: true, started, leads, events });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  const origin = req.headers.origin;
  const cors = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    return res.end();
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    return handleHealth(res);
  }

  if (req.method === 'POST' && (url.pathname === '/submit' || url.pathname === '/event')) {
    // A browser POST from an origin we do not know is refused outright. Direct
    // calls (curl, server-side) carry no Origin header and are allowed through.
    if (origin && !Object.keys(cors).length) {
      return send(res, 403, { error: 'origin not allowed' });
    }

    let body;
    try {
      body = await readJson(req);
    } catch (err) {
      if (err instanceof BodyTooLarge) return send(res, 413, { error: 'body too large' }, cors);
      if (err instanceof BadJson) return send(res, 400, { error: err.message }, cors);
      throw err;
    }

    const ctx = {
      cors,
      ua: (req.headers['user-agent'] ?? '').slice(0, 255),
      visitor: visitorHash(clientIp(req), req.headers['user-agent']),
    };

    try {
      return url.pathname === '/submit'
        ? await handleSubmit(req, res, body, ctx)
        : handleEvent(req, res, body, ctx);
    } catch (err) {
      console.error(`[error] ${url.pathname}:`, err.message);
      return send(res, 500, { error: 'internal error' }, cors);
    }
  }

  return send(res, 404, { error: 'not found' });
});

// Seed the project this server was built for; harmless if it already exists.
ensureProject('deklara', 'Deklara — kryptodeklara.ch');

server.listen(config.port, config.host, () => {
  console.log(`[ready] http://${config.host}:${config.port} db=${config.dbPath}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`[stop] ${signal}`);
    server.close(() => process.exit(0));
  });
}
