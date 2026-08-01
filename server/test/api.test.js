import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SERVER = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'server.js');
const PORT = 8899;
const BASE = `http://127.0.0.1:${PORT}`;
const ORIGIN = 'https://kryptodeklara.ch';

let child;
let tmp;

const post = (path, body, headers = {}) =>
  fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

before(async () => {
  tmp = mkdtempSync(join(tmpdir(), 'deklara-test-'));
  child = spawn(process.execPath, ['--no-warnings', SERVER], {
    env: {
      ...process.env,
      PORT: String(PORT),
      DB_PATH: join(tmp, 'test.db'),
      LIMIT_SUBMITS: '3',
      LIMIT_EVENTS: '5',
    },
    stdio: 'ignore',
  });

  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('server did not start');
});

after(() => {
  child?.kill('SIGTERM');
  if (tmp) rmSync(tmp, { recursive: true, force: true });
});

describe('POST /submit', () => {
  it('stores a valid lead', async () => {
    const res = await post('/submit', {
      project: 'deklara',
      email: 'Valid.User@Gmail.com',
      t: 5000,
      props: { tier: 'basic', lang: 'de' },
    });
    assert.equal(res.status, 204);
  });

  it('deduplicates on (project, email), case-insensitively', async () => {
    const before = (await (await fetch(`${BASE}/health`)).json()).leads;
    const res = await post('/submit', {
      project: 'deklara',
      email: 'valid.user@gmail.com',
      t: 5000,
    });
    assert.equal(res.status, 204);
    const after = (await (await fetch(`${BASE}/health`)).json()).leads;
    assert.equal(after, before, 'duplicate must not create a second row');
  });

  it('rejects a malformed address', async () => {
    const res = await post('/submit', { project: 'deklara', email: 'nope', t: 5000 });
    assert.equal(res.status, 422);
  });

  it('suggests a fix for a typo\'d domain', async () => {
    const res = await post('/submit', { project: 'deklara', email: 'x@gmai.com', t: 5000 });
    assert.equal(res.status, 422);
    assert.equal((await res.json()).suggestion, 'x@gmail.com');
  });

  it('rejects an unknown project', async () => {
    const res = await post('/submit', { project: 'nope', email: 'a@gmail.com', t: 5000 });
    assert.equal(res.status, 400);
  });

  it('silently discards a honeypot hit', async () => {
    const before = (await (await fetch(`${BASE}/health`)).json()).leads;
    const res = await post('/submit', {
      project: 'deklara',
      email: 'bot@gmail.com',
      hp: 'i am a bot',
      t: 5000,
    });
    assert.equal(res.status, 204, 'must look like success to the bot');
    const after = (await (await fetch(`${BASE}/health`)).json()).leads;
    assert.equal(after, before, 'nothing may be stored');
  });

  it('silently discards a submit that arrives too fast', async () => {
    const before = (await (await fetch(`${BASE}/health`)).json()).leads;
    const res = await post('/submit', { project: 'deklara', email: 'fast@gmail.com', t: 200 });
    assert.equal(res.status, 204);
    const after = (await (await fetch(`${BASE}/health`)).json()).leads;
    assert.equal(after, before);
  });

  it('rate limits after LIMIT_SUBMITS in the window', async () => {
    // Two already counted above (the valid one and its duplicate); limit is 3.
    const codes = [];
    for (const email of ['r1@gmail.com', 'r2@gmail.com', 'r3@gmail.com']) {
      const res = await post('/submit', { project: 'deklara', email, t: 5000 });
      codes.push(res.status);
    }
    assert.ok(codes.includes(429), `expected a 429, got ${codes.join(',')}`);
  });
});

describe('POST /event', () => {
  it('accepts a valid event and strips the query string', async () => {
    const res = await post('/event', {
      project: 'deklara',
      name: 'Signup',
      path: '/?utm_source=google&email=leak@example.com',
      lang: 'de',
    });
    assert.equal(res.status, 204);
  });

  it('answers 204 for a bad event name without storing it', async () => {
    const before = (await (await fetch(`${BASE}/health`)).json()).events;
    const res = await post('/event', { project: 'deklara', name: '../../etc/passwd' });
    assert.equal(res.status, 204);
    const after = (await (await fetch(`${BASE}/health`)).json()).events;
    assert.equal(after, before);
  });

  it('answers 204 for an unknown project without storing it', async () => {
    const before = (await (await fetch(`${BASE}/health`)).json()).events;
    const res = await post('/event', { project: 'nope', name: 'Signup' });
    assert.equal(res.status, 204);
    const after = (await (await fetch(`${BASE}/health`)).json()).events;
    assert.equal(after, before);
  });
});

describe('CORS', () => {
  it('allows a listed origin', async () => {
    const res = await post('/event', { project: 'deklara', name: 'Pageview' }, { origin: ORIGIN });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), ORIGIN);
  });

  it('refuses an unlisted origin', async () => {
    const res = await post(
      '/submit',
      { project: 'deklara', email: 'evil@gmail.com', t: 5000 },
      { origin: 'https://evil.example' },
    );
    assert.equal(res.status, 403);
  });

  it('answers preflight', async () => {
    const res = await fetch(`${BASE}/event`, {
      method: 'OPTIONS',
      headers: { origin: ORIGIN, 'access-control-request-method': 'POST' },
    });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), ORIGIN);
  });
});

describe('limits', () => {
  it('refuses an oversized body', async () => {
    const res = await post('/submit', {
      project: 'deklara',
      email: 'big@gmail.com',
      props: { blob: 'x'.repeat(20000) },
      t: 5000,
    });
    assert.equal(res.status, 413);
  });

  it('refuses malformed JSON', async () => {
    const res = await fetch(`${BASE}/submit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json',
    });
    assert.equal(res.status, 400);
  });
});
