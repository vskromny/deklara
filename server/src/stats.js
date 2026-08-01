import { getDb } from './db.js';

/** Named ranges the dashboard offers. `all` means no lower bound. */
export const RANGES = {
  '7d': { label: 'Last 7 days', sql: "datetime('now', '-7 days')" },
  '30d': { label: 'Last 30 days', sql: "datetime('now', '-30 days')" },
  all: { label: 'All time', sql: "'1970-01-01'" },
};

export function resolveRange(input) {
  return Object.hasOwn(RANGES, input) ? input : '30d';
}

/**
 * Everything the dashboard needs, in one pass.
 *
 * The funnel deliberately mirrors the brief's decision thresholds:
 * visitors -> Signup is the "visitor to email" rate (green >=8%, kill <3%),
 * and Signup -> PreorderClick is the early-bird rate (green >=20%).
 */
export function summary(projectId, range = '30d') {
  const db = getDb();
  const since = RANGES[resolveRange(range)].sql;

  const one = (sql, ...params) => db.prepare(sql).get(projectId, ...params);
  const many = (sql, ...params) => db.prepare(sql).all(projectId, ...params);

  const { visitors } = one(
    `SELECT count(DISTINCT visitor_hash) visitors FROM events
      WHERE project_id = ? AND created_at >= ${since}`,
  );

  const { pageviews } = one(
    `SELECT count(*) pageviews FROM events
      WHERE project_id = ? AND name = 'Pageview' AND created_at >= ${since}`,
  );

  const byEvent = many(
    `SELECT name, count(*) n, count(DISTINCT visitor_hash) uniques
       FROM events
      WHERE project_id = ? AND created_at >= ${since}
      GROUP BY name ORDER BY n DESC`,
  );

  const { leads } = one(
    `SELECT count(*) leads FROM leads
      WHERE project_id = ? AND created_at >= ${since}`,
  );

  const count = (name) => byEvent.find((r) => r.name === name)?.uniques ?? 0;
  const signups = count('Signup');
  const preorders = count('PreorderClick');

  const byLang = many(
    `SELECT coalesce(lang, '?') lang, count(DISTINCT visitor_hash) visitors,
            sum(name = 'Signup') signups
       FROM events
      WHERE project_id = ? AND created_at >= ${since}
      GROUP BY lang ORDER BY visitors DESC`,
  );

  const byPath = many(
    `SELECT coalesce(path, '?') path, count(*) views
       FROM events
      WHERE project_id = ? AND name = 'Pageview' AND created_at >= ${since}
      GROUP BY path ORDER BY views DESC LIMIT 10`,
  );

  const byReferrer = many(
    `SELECT coalesce(referrer, '(direct)') referrer,
            count(DISTINCT visitor_hash) visitors
       FROM events
      WHERE project_id = ? AND created_at >= ${since}
      GROUP BY referrer ORDER BY visitors DESC LIMIT 10`,
  );

  const byCampaign = many(
    `SELECT coalesce(utm_source, '(none)') source,
            coalesce(utm_medium, '') medium,
            coalesce(utm_campaign, '') campaign,
            count(DISTINCT visitor_hash) visitors,
            sum(name = 'Signup') signups
       FROM events
      WHERE project_id = ? AND created_at >= ${since}
      GROUP BY source, medium, campaign
      ORDER BY visitors DESC LIMIT 10`,
  );

  const byTier = many(
    `SELECT json_extract(props_json, '$.tier') tier, count(*) n
       FROM events
      WHERE project_id = ? AND name = 'TierChoice' AND created_at >= ${since}
        AND json_extract(props_json, '$.tier') IS NOT NULL
      GROUP BY tier ORDER BY n DESC`,
  );

  const cleanup = one(
    `SELECT sum(json_extract(props_json, '$.cleanup') IN ('ja','yes','oui','true')) yes,
            count(*) total
       FROM leads
      WHERE project_id = ? AND created_at >= ${since}`,
  );

  const daily = many(
    `SELECT date(created_at) day,
            count(DISTINCT visitor_hash) visitors,
            sum(name = 'Signup') signups
       FROM events
      WHERE project_id = ? AND created_at >= ${since}
      GROUP BY day ORDER BY day`,
  );

  const rate = (n, d) => (d > 0 ? (n / d) * 100 : 0);

  return {
    range: resolveRange(range),
    visitors,
    pageviews,
    leads,
    signups,
    preorders,
    signupRate: rate(signups, visitors),
    preorderRate: rate(preorders, signups),
    byEvent,
    byLang,
    byPath,
    byReferrer,
    byCampaign,
    byTier,
    cleanupYes: cleanup.yes ?? 0,
    cleanupTotal: cleanup.total ?? 0,
    daily,
  };
}

export function leadRows(projectId) {
  return getDb()
    .prepare(
      `SELECT email, props_json, created_at FROM leads
        WHERE project_id = ? ORDER BY created_at DESC`,
    )
    .all(projectId);
}
