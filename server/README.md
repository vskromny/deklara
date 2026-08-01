# server

Self-hosted lead capture and analytics. Replaces Formspree and Plausible.
Node + SQLite, no runtime dependencies, runs on the Mac mini under launchd.

Multi-tenant by design: every request carries a `project` key, so future
projects reuse this server rather than standing up another one.

## Run

```bash
npm start                  # foreground on :8787
npm test                   # 30 tests, no framework
npm run install-service    # install + start both launchd agents
npm run uninstall-service  # remove them (leaves data alone)
npm run logs               # tail the API log
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/submit` | Store a lead. `{project, email, props?, company?, t?}` |
| POST | `/event` | Store a pageview or custom event |
| GET | `/health` | Liveness + row counts |
| GET | `/admin` | Dashboard (token required) |
| GET | `/admin/leads.csv` | Email export (token required) |

`/event` always answers 204, even for input it discards — analytics must never
break or slow the page it measures. `/submit` reports real errors, because the
visitor needs to know if their address was not stored.

## Dashboard access

The token is read from `ADMIN_TOKEN`, or generated on first boot into
`data/admin-token.txt` (mode 600) so a fresh install is never open.

```bash
open "http://localhost:8787/admin?token=$(cat data/admin-token.txt)"
```

## Configuration

All optional; defaults in `src/config.js`.

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `8787` | |
| `HOST` | `127.0.0.1` | Loopback only; the tunnel provides public access |
| `DB_PATH` | `data/deklara.db` | |
| `ADMIN_TOKEN` | generated | |
| `ALLOWED_ORIGINS` | kryptodeklara.ch + localhost | Comma-separated |
| `LIMIT_SUBMITS` | `10` | Per visitor hash per hour |
| `LIMIT_EVENTS` | `300` | Per visitor hash per hour |
| `EVENT_RETENTION_DAYS` | `400` | Enforced nightly; `0` disables |

## Backup and restore

`scripts/maintenance.sh` runs nightly at 04:15: it snapshots the database with
`sqlite3 .backup` (safe on a live DB — a plain file copy can be corrupt), gzips
it, verifies the result opens and passes `integrity_check`, rotates logs over
1MB, prunes events past retention, and deletes backups and logs older than 14
days.

Restore:

```bash
gunzip -c backups/deklara-2026-08-01.db.gz > /tmp/restored.db
sqlite3 /tmp/restored.db "pragma integrity_check; select count(*) from leads;"
# then, with the service stopped:
launchctl bootout gui/$UID/ch.kryptodeklara.api
cp /tmp/restored.db data/deklara.db
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ch.kryptodeklara.api.plist
```

## Adding a project

```bash
sqlite3 data/deklara.db \
  "INSERT INTO projects (key, name) VALUES ('newproject', 'New Project');"
```

Then point that site's tracker at it:

```html
<script defer src="/tracker.js"
        data-api="https://api.kryptodeklara.ch"
        data-project="newproject"></script>
```

Add its origin to `ALLOWED_ORIGINS` or the browser will block the requests.

## Privacy model

No cookies. A visitor is `SHA-256(daily_salt + ip + user_agent)`, where the
salt is random, held only in memory, and replaced at 00:00 UTC. Raw IPs are
never written to disk, and hashes stop being linkable across days. Query
strings are stripped from paths and referrers before storage, so an address
accidentally placed in a URL is not retained.

`web/datenschutz.html` describes exactly this. **If you change what is
collected, change that page in the same commit** — it is a legal statement,
not documentation.

## Operational gotchas

- The launchd **agent runs only while the user is logged in**. A LaunchDaemon
  in `/Library/LaunchDaemons` would be needed to survive a reboot with no
  login.
- Node is **nvm-managed**, so its path contains the version number. After
  upgrading node, re-run `npm run install-service` or the service dies
  silently.
- Submissions during downtime are **lost, not queued** — an accepted risk for
  the discovery phase. A Cloudflare Worker front door would fix it.
