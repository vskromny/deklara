import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(here, '..');

const int = (v, fallback) => {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
};

const list = (v) =>
  (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export const config = {
  port: int(process.env.PORT, 8787),
  host: process.env.HOST ?? '127.0.0.1',
  dbPath: process.env.DB_PATH ?? join(ROOT, 'data', 'deklara.db'),
  logDir: process.env.LOG_DIR ?? join(ROOT, 'logs'),

  // Bearer token for /admin. Generated on first boot if unset (see server.js).
  adminToken: process.env.ADMIN_TOKEN ?? '',

  // Browsers may POST from these origins. Anything else is refused.
  allowedOrigins: list(process.env.ALLOWED_ORIGINS).length
    ? list(process.env.ALLOWED_ORIGINS)
    : [
        'https://kryptodeklara.ch',
        'https://www.kryptodeklara.ch',
        'http://localhost:8811',
        'http://127.0.0.1:8811',
      ],

  // Hard caps. Requests above these are rejected before parsing.
  maxBodyBytes: int(process.env.MAX_BODY_BYTES, 8 * 1024),

  // Rate limits, per visitor hash per rolling hour (phase 2).
  limits: {
    submitsPerHour: int(process.env.LIMIT_SUBMITS, 10),
    eventsPerHour: int(process.env.LIMIT_EVENTS, 300),
  },

  // Retention for raw event rows, in days. 0 disables pruning.
  eventRetentionDays: int(process.env.EVENT_RETENTION_DAYS, 400),
};
