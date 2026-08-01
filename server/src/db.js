import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from './config.js';

/**
 * Migrations run in order on every boot; each one is applied once and recorded
 * in `schema_migrations`. Append new entries, never edit an applied one.
 */
const MIGRATIONS = [
  {
    name: '001_initial',
    sql: `
      CREATE TABLE projects (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        key        TEXT NOT NULL UNIQUE,
        name       TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE leads (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL REFERENCES projects(id),
        email      TEXT NOT NULL,
        props_json TEXT NOT NULL DEFAULT '{}',
        ip_hash    TEXT,
        ua         TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- One address per project. A repeat submit updates the existing row
      -- rather than inflating the count.
      CREATE UNIQUE INDEX leads_project_email ON leads(project_id, email);
      CREATE INDEX leads_created ON leads(created_at);

      CREATE TABLE events (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id   INTEGER NOT NULL REFERENCES projects(id),
        name         TEXT NOT NULL,
        props_json   TEXT NOT NULL DEFAULT '{}',
        path         TEXT,
        referrer     TEXT,
        utm_source   TEXT,
        utm_medium   TEXT,
        utm_campaign TEXT,
        lang         TEXT,
        visitor_hash TEXT NOT NULL,
        created_at   TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX events_project_created ON events(project_id, created_at);
      CREATE INDEX events_name ON events(project_id, name, created_at);
      CREATE INDEX events_visitor ON events(project_id, visitor_hash, created_at);

      -- Rolling-window rate limiting. Pruned as it is read.
      CREATE TABLE rate_hits (
        bucket     TEXT NOT NULL,
        actor      TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX rate_hits_lookup ON rate_hits(bucket, actor, created_at);
    `,
  },
];

let db;

export function getDb() {
  if (db) return db;

  mkdirSync(dirname(config.dbPath), { recursive: true });
  db = new DatabaseSync(config.dbPath);

  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const applied = new Set(
    db.prepare('SELECT name FROM schema_migrations').all().map((r) => r.name),
  );

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.name)) continue;
    db.exec('BEGIN');
    try {
      db.exec(migration.sql);
      db.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(migration.name);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw new Error(`migration ${migration.name} failed: ${err.message}`);
    }
  }

  return db;
}

/** Look up a project by its public key. Returns undefined if unknown. */
export function findProject(key) {
  return getDb().prepare('SELECT id, key, name FROM projects WHERE key = ?').get(key);
}

/** Create a project if it does not exist yet. Returns the row. */
export function ensureProject(key, name = key) {
  const existing = findProject(key);
  if (existing) return existing;
  getDb().prepare('INSERT INTO projects (key, name) VALUES (?, ?)').run(key, name);
  return findProject(key);
}

export function closeDb() {
  if (!db) return;
  db.close();
  db = undefined;
}
