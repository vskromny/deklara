/**
 * Seed a database with plausible traffic so the dashboard can be eyeballed
 * without waiting for real visitors. Never point this at the live DB.
 *
 *   DB_PATH=/tmp/demo.db node test/seed.js
 */
import { ensureProject, getDb } from '../src/db.js';
import { config } from '../src/config.js';

if (!process.env.DB_PATH) {
  console.error('refusing to run without an explicit DB_PATH');
  process.exit(1);
}

const project = ensureProject('deklara', 'Deklara — kryptodeklara.ch');
const db = getDb();

const pick = (arr, i) => arr[i % arr.length];
const langs = ['de', 'de', 'de', 'de', 'fr', 'en'];
const paths = ['/', '/', '/', '/fr/', '/en/'];
const refs = [null, null, 'https://www.google.com/', 'https://old.reddit.com/r/SwissPersonalFinance', null];
const sources = [null, null, 'google', 'reddit'];
const tiers = ['basic', 'basic', 'plus', 'pro'];

const insertEvent = db.prepare(
  `INSERT INTO events
     (project_id, name, props_json, path, referrer, utm_source, utm_medium,
      utm_campaign, lang, visitor_hash, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))`,
);
const insertLead = db.prepare(
  `INSERT OR IGNORE INTO leads (project_id, email, props_json, ip_hash, created_at)
   VALUES (?, ?, ?, ?, datetime('now', ?))`,
);

const VISITORS = 180;
let signups = 0;
let preorders = 0;

for (let i = 0; i < VISITORS; i++) {
  const visitor = `seed-visitor-${i.toString().padStart(4, '0')}`;
  const daysAgo = `-${i % 21} days`;
  const lang = pick(langs, i);
  const source = pick(sources, i);

  insertEvent.run(
    project.id, 'Pageview', '{}', pick(paths, i), pick(refs, i),
    source, source ? 'cpc' : null, source ? 'winter-2027' : null,
    lang, visitor, daysAgo,
  );

  // ~13% of visitors submit an email — comfortably above the 8% green line.
  if (i % 8 === 0) {
    const tier = pick(tiers, i);
    const cleanup = i % 3 === 0 ? 'ja' : 'nein';
    insertEvent.run(
      project.id, 'Signup', JSON.stringify({ tier, cleanup, lang }),
      pick(paths, i), null, source, source ? 'cpc' : null,
      source ? 'winter-2027' : null, lang, visitor, daysAgo,
    );
    insertLead.run(
      project.id, `seed${i}@example.ch`,
      JSON.stringify({ tier, cleanup, lang }), visitor, daysAgo,
    );
    signups++;

    // ~30% of those click through to the tier modal.
    if (i % 24 === 0) {
      insertEvent.run(
        project.id, 'PreorderClick', '{}', pick(paths, i), null,
        source, null, null, lang, visitor, daysAgo,
      );
      insertEvent.run(
        project.id, 'TierChoice', JSON.stringify({ tier }), pick(paths, i), null,
        source, null, null, lang, visitor, daysAgo,
      );
      preorders++;
    }
  }
}

console.log(
  `seeded ${config.dbPath}: ${VISITORS} visitors, ${signups} signups, ${preorders} preorders`,
);
