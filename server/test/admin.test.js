import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const PORT = 8898;
const BASE = `http://127.0.0.1:${PORT}`;
const TOKEN = 'test-admin-token';

let child;
let tmp;

before(async () => {
  tmp = mkdtempSync(join(tmpdir(), 'deklara-admin-'));
  const env = { ...process.env, PORT: String(PORT), DB_PATH: join(tmp, 'a.db'), ADMIN_TOKEN: TOKEN };

  child = spawn(process.execPath, ['--no-warnings', join(SRC, 'server.js')], {
    env,
    stdio: 'ignore',
  });

  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${BASE}/health`)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }

  // A lead and a couple of events to render.
  await fetch(`${BASE}/submit`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      project: 'deklara',
      email: 'dash@gmail.com',
      t: 5000,
      props: { tier: 'plus', cleanup: 'ja', lang: 'de' },
    }),
  });
  for (const name of ['Pageview', 'Signup', 'PreorderClick']) {
    await fetch(`${BASE}/event`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ project: 'deklara', name, lang: 'de', path: '/' }),
    });
  }
});

after(() => {
  child?.kill('SIGTERM');
  if (tmp) rmSync(tmp, { recursive: true, force: true });
});

describe('/admin auth', () => {
  it('401s without a token', async () => {
    assert.equal((await fetch(`${BASE}/admin`)).status, 401);
  });

  it('401s with a wrong token', async () => {
    assert.equal((await fetch(`${BASE}/admin?token=nope`)).status, 401);
  });

  it('401s with a token of the same length but different bytes', async () => {
    const wrong = 'x'.repeat(TOKEN.length);
    assert.equal((await fetch(`${BASE}/admin?token=${wrong}`)).status, 401);
  });

  it('accepts a bearer header', async () => {
    const res = await fetch(`${BASE}/admin`, { headers: { authorization: `Bearer ${TOKEN}` } });
    assert.equal(res.status, 200);
  });
});

describe('/admin dashboard', () => {
  it('renders real numbers', async () => {
    const html = await (await fetch(`${BASE}/admin?token=${TOKEN}&range=all`)).text();
    assert.match(html, /Emails stored<\/div><div class="n">1<\/div>/);
    assert.match(html, /Deklara/);
  });

  it('marks itself noindex', async () => {
    const html = await (await fetch(`${BASE}/admin?token=${TOKEN}`)).text();
    assert.match(html, /name="robots" content="noindex/);
  });

  it('falls back to a valid range for junk input', async () => {
    const res = await fetch(`${BASE}/admin?token=${TOKEN}&range=../../etc`);
    assert.equal(res.status, 200);
  });

  it('escapes HTML in stored values', async () => {
    await fetch(`${BASE}/event`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        project: 'deklara',
        name: 'TierChoice',
        props: { tier: '<script>alert(1)</script>' },
      }),
    });
    const html = await (await fetch(`${BASE}/admin?token=${TOKEN}&range=all`)).text();
    assert.ok(!html.includes('<script>alert(1)</script>'), 'must not emit raw script tag');
    assert.match(html, /&lt;script&gt;/);
  });
});

describe('/admin/leads.csv', () => {
  it('401s without a token', async () => {
    assert.equal((await fetch(`${BASE}/admin/leads.csv`)).status, 401);
  });

  it('exports a header and one row', async () => {
    const res = await fetch(`${BASE}/admin/leads.csv?token=${TOKEN}`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/csv/);
    assert.match(res.headers.get('content-disposition'), /attachment/);
    const lines = (await res.text()).trim().split('\n');
    assert.equal(lines[0], 'email,tier,cleanup,lang,created_at');
    assert.equal(lines.length, 2);
    assert.match(lines[1], /dash@gmail\.com/);
  });

  it('neutralises formula injection', async () => {
    await fetch(`${BASE}/submit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        project: 'deklara',
        email: 'calc@gmail.com',
        t: 5000,
        props: { tier: '=1+1' },
      }),
    });
    const csv = await (await fetch(`${BASE}/admin/leads.csv?token=${TOKEN}`)).text();
    assert.ok(csv.includes(`"'=1+1"`), 'leading = must be quoted off');
  });
});
