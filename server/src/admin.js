import { timingSafeEqual } from 'node:crypto';
import { RANGES, leadRows, resolveRange, summary } from './stats.js';

/** Constant-time token comparison, so the check can't be timed open. */
export function tokenMatches(provided, expected) {
  if (!provided || !expected) return false;
  const a = Buffer.from(String(provided));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const esc = (v) =>
  String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const pct = (n) => `${n.toFixed(1)}%`;

/**
 * Colour the two funnel rates against the brief's kill thresholds, so the
 * dashboard answers "are we still building this?" at a glance rather than
 * making you remember the numbers.
 */
function verdict(metric, value) {
  if (metric === 'signup') {
    if (value >= 8) return ['green', 'on target'];
    if (value < 3) return ['red', 'below kill threshold'];
    return ['amber', 'inconclusive'];
  }
  if (value >= 20) return ['green', 'on target'];
  return ['amber', 'below target'];
}

/** Columns from `numericFrom` onward are right-aligned, headers included. */
function table(caption, columns, rows, renderRow, numericFrom = columns.length) {
  if (!rows.length) return `<section><h2>${esc(caption)}</h2><p class="empty">No data yet.</p></section>`;
  const head = columns
    .map((c, i) => `<th${i >= numericFrom ? ' class="n"' : ''}>${esc(c)}</th>`)
    .join('');
  return `<section>
    <h2>${esc(caption)}</h2>
    <table>
      <thead><tr>${head}</tr></thead>
      <tbody>${rows.map(renderRow).join('')}</tbody>
    </table>
  </section>`;
}

function sparkline(daily) {
  if (daily.length < 2) return '';
  const max = Math.max(...daily.map((d) => d.visitors), 1);
  const w = 100 / daily.length;
  const bars = daily
    .map((d, i) => {
      const h = (d.visitors / max) * 100;
      return `<rect x="${(i * w).toFixed(2)}" y="${(100 - h).toFixed(2)}" width="${(w * 0.8).toFixed(2)}" height="${h.toFixed(2)}"><title>${esc(d.day)}: ${d.visitors} visitors, ${d.signups} signups</title></rect>`;
    })
    .join('');
  return `<svg class="spark" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Daily visitors">${bars}</svg>`;
}

export function renderDashboard(project, range, token) {
  const s = summary(project.id, range);
  const [sClass, sNote] = verdict('signup', s.signupRate);
  const [pClass, pNote] = verdict('preorder', s.preorderRate);

  const tabs = Object.entries(RANGES)
    .map(
      ([key, { label }]) =>
        `<a class="${key === s.range ? 'on' : ''}" href="/admin?token=${encodeURIComponent(token)}&range=${key}">${esc(label)}</a>`,
    )
    .join('');

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<title>${esc(project.name)} — analytics</title>
<style>
  :root{--ink:#101010;--paper:#fff;--field:#f4f4f1;--red:#e3000f;--grey:#6e6e6e;
        --green:#0a7d2e;--amber:#a86500}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font:16px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
       color:var(--ink);background:var(--paper);padding:24px;max-width:1000px;margin:0 auto}
  header{display:flex;justify-content:space-between;align-items:baseline;gap:16px;
         flex-wrap:wrap;border-bottom:2px solid var(--ink);padding-bottom:14px}
  h1{font-size:1.3rem;letter-spacing:-0.02em}
  .tabs{display:flex;gap:4px;font-size:0.8rem}
  .tabs a{padding:5px 10px;border:1.5px solid var(--ink);color:var(--ink);text-decoration:none}
  .tabs a.on{background:var(--ink);color:#fff}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:22px 0}
  .card{border:2px solid var(--ink);padding:14px 16px}
  .card .n{font-size:1.9rem;font-weight:700;letter-spacing:-0.03em;line-height:1.1}
  .card .k{font-size:0.7rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--grey);
           margin-bottom:6px}
  .card .note{font-size:0.72rem;margin-top:4px}
  .green{color:var(--green)} .red{color:var(--red)} .amber{color:var(--amber)}
  .spark{width:100%;height:70px;fill:var(--ink);margin:6px 0 22px;display:block}
  section{margin:22px 0}
  h2{font-size:0.78rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--grey);
     margin-bottom:8px}
  table{width:100%;border-collapse:collapse;font-size:0.86rem}
  th,td{text-align:left;padding:7px 10px;border-bottom:1px solid #dcdcd7}
  th{font-size:0.68rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--grey)}
  td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
  .empty{color:var(--grey);font-size:0.86rem}
  footer{margin-top:32px;border-top:2px solid var(--ink);padding-top:14px;
         font-size:0.75rem;color:var(--grey);display:flex;gap:16px;flex-wrap:wrap}
  footer a{color:var(--red)}
  @media(max-width:620px){body{padding:16px}.card .n{font-size:1.5rem}}
</style>
</head><body>
<header>
  <h1>${esc(project.name)}</h1>
  <nav class="tabs">${tabs}</nav>
</header>

<div class="grid">
  <div class="card"><div class="k">Visitors</div><div class="n">${s.visitors}</div></div>
  <div class="card"><div class="k">Pageviews</div><div class="n">${s.pageviews}</div></div>
  <div class="card"><div class="k">Emails stored</div><div class="n">${s.leads}</div></div>
  <div class="card">
    <div class="k">Visitor → email</div>
    <div class="n ${sClass}">${pct(s.signupRate)}</div>
    <div class="note ${sClass}">${esc(sNote)} · green ≥8% · kill &lt;3%</div>
  </div>
  <div class="card">
    <div class="k">Email → early-bird</div>
    <div class="n ${pClass}">${pct(s.preorderRate)}</div>
    <div class="note ${pClass}">${esc(pNote)} · green ≥20%</div>
  </div>
  <div class="card">
    <div class="k">Wants cleanup</div>
    <div class="n">${s.cleanupYes}</div>
    <div class="note">of ${s.cleanupTotal} leads (Selbstanzeige)</div>
  </div>
</div>

${sparkline(s.daily)}

${table('By language', ['Lang', 'Visitors', 'Signups'], s.byLang,
  (r) => `<tr><td>${esc(r.lang)}</td><td class="n">${r.visitors}</td><td class="n">${r.signups ?? 0}</td></tr>`, 1)}

${table('Tier interest', ['Tier', 'Clicks'], s.byTier,
  (r) => `<tr><td>${esc(r.tier)}</td><td class="n">${r.n}</td></tr>`, 1)}

${table('Campaigns', ['Source', 'Medium', 'Campaign', 'Visitors', 'Signups'], s.byCampaign,
  (r) => `<tr><td>${esc(r.source)}</td><td>${esc(r.medium)}</td><td>${esc(r.campaign)}</td><td class="n">${r.visitors}</td><td class="n">${r.signups ?? 0}</td></tr>`, 3)}

${table('Referrers', ['Referrer', 'Visitors'], s.byReferrer,
  (r) => `<tr><td>${esc(r.referrer)}</td><td class="n">${r.visitors}</td></tr>`, 1)}

${table('Pages', ['Path', 'Views'], s.byPath,
  (r) => `<tr><td>${esc(r.path)}</td><td class="n">${r.views}</td></tr>`, 1)}

${table('All events', ['Event', 'Count', 'Unique visitors'], s.byEvent,
  (r) => `<tr><td>${esc(r.name)}</td><td class="n">${r.n}</td><td class="n">${r.uniques}</td></tr>`, 1)}

<footer>
  <a href="/admin/leads.csv?token=${encodeURIComponent(token)}">Download emails (CSV)</a>
  <span>Cookieless · no raw IPs stored · minimum sample 300 visitors / 30 emails</span>
</footer>
</body></html>`;
}

export function renderLeadsCsv(projectId) {
  const rows = leadRows(projectId);
  const cell = (v) => {
    const s = String(v ?? '');
    // Guard against CSV injection when the file is opened in Numbers/Excel.
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return `"${safe.replaceAll('"', '""')}"`;
  };

  const lines = ['email,tier,cleanup,lang,created_at'];
  for (const row of rows) {
    let props = {};
    try {
      props = JSON.parse(row.props_json);
    } catch {}
    lines.push(
      [row.email, props.tier, props.cleanup, props.lang, row.created_at].map(cell).join(','),
    );
  }
  return lines.join('\n') + '\n';
}
