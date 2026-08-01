# Build plan — self-hosted capture + analytics

Replaces Formspree and Plausible with our own stack, running on the Mac mini
(Macmini9,1 / M1). Multi-tenant from day one so future projects reuse it.

**Loop state lives in this file.** Tick a box only when its acceptance check
passes. Work top to bottom; each phase is independently shippable.

## Stack

| Part | Choice | Why |
|---|---|---|
| Runtime | Node 23 (installed), no framework | zero deps to patch |
| Store | SQLite (`server/data/deklara.db`) | single file, trivial backup |
| Exposure | Cloudflare Tunnel → `api.kryptodeklara.ch` | free, hides home IP, no port forward |
| Autostart | launchd | survives reboot |
| Frontend | ~1KB `tracker.js` served from our origin | not on ad-block lists, unlike plausible.io |

## Data model

```sql
projects(id, key, name, created_at)
leads(id, project_id, email, props_json, ip_hash, ua, created_at)
events(id, project_id, name, props_json, path, referrer, visitor_hash, created_at)
```

`visitor_hash` = SHA-256(daily_salt + ip + user_agent), salt rotated at 00:00
UTC and never stored. No cookies, no raw IPs → no consent banner under revDSG.

---

## Phase 0 — prerequisites (MANUAL, blocks phase 5 only)

- [ ] Vladimir creates a free Cloudflare account
- [ ] Nameservers moved from GoDaddy to Cloudflare (Claude can flip NS via the
      GoDaddy API once the CF account exists and the zone is added)
- [ ] Existing records recreated in CF: 4× A apex → GitHub Pages, `www` CNAME

> Cloudflare Tunnel public hostnames only work when the zone is on Cloudflare
> DNS. Everything in phases 1–4 can be built and tested locally without this.

## Phase 1 — API skeleton

- [x] `server/src/db.js` — open SQLite, run migrations on boot
- [x] `server/src/server.js` — plain `node:http`, routes:
      `POST /submit`, `POST /event`, `GET /health`
- [x] `POST /submit` validates email, writes `leads`, returns 204
- [x] `POST /event` writes `events`, returns 204 (never blocks the page)
- [x] `npm start` runs it on :8787

**Accept:** `curl -X POST localhost:8787/submit -d '{"email":"a@b.ch","project":"deklara"}'`
returns 204 and the row is in SQLite.

## Phase 2 — hardening

- [ ] CORS allowlist (kryptodeklara.ch + localhost only)
- [ ] Rate limit per ip_hash (e.g. 10 submits/hour, 300 events/hour)
- [ ] Honeypot field + min-time-on-page check for spam
- [ ] Payload size cap, strict JSON parse, reject unknown project keys
- [ ] Email format + MX-ish sanity check, dedupe on (project, email)

**Accept:** 11th submit in an hour returns 429; a submit from an unlisted
origin is rejected; duplicate email does not create a second row.

## Phase 3 — dashboard

- [ ] `GET /admin` — token-gated (bearer in query or header), server-rendered
- [ ] Shows: visitors, pageviews, signups, conversion rate, per-language split,
      top referrers/UTM, `TierChoice` breakdown
- [ ] `GET /admin/leads.csv` — export the email list
- [ ] Date range filter (7d / 30d / all)

**Accept:** dashboard renders real numbers from seeded test data; CSV opens in
Numbers; no access without the token.

## Phase 4 — always-on

- [ ] launchd plist at `~/Library/LaunchAgents/ch.kryptodeklara.api.plist`
- [ ] `KeepAlive` + `RunAtLoad` so it survives reboot and crash
- [ ] Logs to `server/logs/`, rotated (keep 14 days)
- [ ] Nightly `sqlite3 .backup` to a dated file, keep 14

**Accept:** `killall node` → process is back within seconds; after a reboot
`/health` answers without anyone logging in.

## Phase 5 — expose (needs phase 0)

- [ ] `cloudflared` installed, tunnel created, credentials stored
- [ ] Public hostname `api.kryptodeklara.ch` → `localhost:8787`
- [ ] Tunnel runs under launchd too
- [ ] TLS verified end to end

**Accept:** `curl https://api.kryptodeklara.ch/health` returns 200 from off the
home network (phone on cellular).

## Phase 6 — frontend swap

- [ ] `web/tracker.js` — pageview on load + `track(name, props)`, sendBeacon,
      same event names: `Signup`, `PreorderClick`, `TierChoice`
- [ ] Remove the plausible.io script tag from all three locales
- [ ] Point `FORM_ENDPOINT` at `https://api.kryptodeklara.ch/submit`
- [ ] Drop `FAKE_DOOR` mode — real storage now
- [ ] Keep the three locale files byte-identical in their shared blocks

**Accept:** submitting on the live site stores a row; the three events appear
in the dashboard; no requests to plausible.io remain.

## Phase 7 — legal + docs

- [ ] `web/datenschutz.html`: state self-hosted analytics, no cookies, no
      third-party processor, what's stored, retention, deletion contact
- [ ] Remove the Plausible/Formspree mentions
- [ ] `server/README.md`: run, back up, restore, add a new project
- [ ] Root `README.md` launch checklist updated

**Accept:** privacy page matches what the code actually does, claim by claim.

## Phase 8 — end-to-end

- [ ] Real submit from a phone on cellular lands in the DB
- [ ] Reboot the Mac mini, confirm both services return
- [ ] Restore a backup into a scratch DB and confirm it opens
- [ ] Note the known gap: submissions during downtime are lost (accepted risk
      for the discovery phase)

---

## Out of scope for now

- Queueing submissions during downtime (a Cloudflare Worker front door)
- Email notification on each new lead
- Multi-user dashboard auth
