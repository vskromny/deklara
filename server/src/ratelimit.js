import { getDb } from './db.js';

/**
 * Rolling-window rate limiting, backed by SQLite so the counters survive a
 * restart. Each accepted request writes one row; the window is enforced by
 * counting rows newer than `windowSeconds` and pruning everything older.
 *
 * The actor is a visitor hash, never a raw IP.
 */
export function checkRate(bucket, actor, limit, windowSeconds = 3600) {
  const db = getDb();
  const cutoff = `-${Math.max(1, Math.floor(windowSeconds))} seconds`;

  // Opportunistic prune: cheap, and keeps the table from growing unbounded
  // without needing a separate sweeper.
  db.prepare(
    `DELETE FROM rate_hits
      WHERE bucket = ? AND created_at < datetime('now', ?)`,
  ).run(bucket, cutoff);

  const { c: used } = db
    .prepare(
      `SELECT count(*) c FROM rate_hits
        WHERE bucket = ? AND actor = ? AND created_at >= datetime('now', ?)`,
    )
    .get(bucket, actor, cutoff);

  if (used >= limit) {
    return { allowed: false, used, limit, retryAfter: windowSeconds };
  }

  db.prepare('INSERT INTO rate_hits (bucket, actor) VALUES (?, ?)').run(bucket, actor);
  return { allowed: true, used: used + 1, limit };
}
