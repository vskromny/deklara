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

## Phase 0 — prerequisites (DONE 2026-08-01)

- [x] Free Cloudflare account created
- [x] Nameservers moved to `angela`/`remy.ns.cloudflare.com`. Registration
      stays at GoDaddy. DNSSEC confirmed off first — a DS record would have
      made the domain unresolvable on switch
- [x] Records recreated in CF and verified against both Cloudflare nameservers
      **before** the flip, so there was no window without answers
- [x] Zero downtime: the site returned 200 throughout
- [x] Proxy status normalised — the apex had 3 DNS-only A records and 1
      proxied, which would have sent visitors down different paths depending
      on which record their resolver picked

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

- [x] CORS allowlist (kryptodeklara.ch + localhost only)
- [x] Rate limit per ip_hash (e.g. 10 submits/hour, 300 events/hour)
- [x] Honeypot field + min-time-on-page check for spam
- [x] Payload size cap, strict JSON parse, reject unknown project keys
- [x] Email format + MX-ish sanity check, dedupe on (project, email)
- [x] 16 tests covering all of the above (`npm test`)

**Accept:** 11th submit in an hour returns 429; a submit from an unlisted
origin is rejected; duplicate email does not create a second row.

## Phase 3 — dashboard

- [x] `GET /admin` — token-gated (bearer in query or header), server-rendered
- [x] Shows: visitors, pageviews, signups, conversion rate, per-language split,
      top referrers/UTM, `TierChoice` breakdown
- [x] `GET /admin/leads.csv` — export the email list
- [x] Date range filter (7d / 30d / all)
- [x] Funnel rates colour-coded against the brief's kill thresholds
- [x] Token auto-generated on first boot (data/admin-token.txt, mode 600)
- [x] `test/seed.js` generates demo traffic; 11 more tests (27 total)

**Accept:** dashboard renders real numbers from seeded test data; CSV opens in
Numbers; no access without the token.

## Phase 4 — always-on

- [x] launchd plist at `~/Library/LaunchAgents/ch.kryptodeklara.api.plist`
- [x] `KeepAlive` + `RunAtLoad` so it survives a crash
- [x] Logs to `server/logs/`, rotated at 1MB (keep 14 days)
- [x] Nightly 04:15 `sqlite3 .backup`, gzipped, integrity-checked, keep 14
- [x] `scripts/install-service.sh` / `uninstall-service.sh`, both idempotent

**Accept:** verified — killing the service by PID brought it back in <8s with a
new PID and a fresh `started` timestamp; `maintenance.sh` produced a backup that
gunzips, opens, passes `pragma integrity_check` and contains the seeded row.

> **Two caveats, both honest gaps rather than bugs:**
>
> 1. A **LaunchAgent only runs while the user is logged in.** The original
>    acceptance wording ("without anyone logging in") is not satisfied and
>    cannot be by an agent — that needs a LaunchDaemon in
>    `/Library/LaunchDaemons` (sudo, runs as root). Fine while the Mac mini
>    stays logged in; enable auto-login, or promote to a daemon later.
> 2. Node is **nvm-managed**, so its absolute path contains the version number.
>    Upgrading node moves it and the agent dies silently. Re-run
>    `npm run install-service` after any node upgrade.

## Phase 5 — expose (needs phase 0)

- [x] `cloudflared` installed (brew), tunnel `deklara-mini` created via API
- [x] Public hostname `api.kryptodeklara.ch` → `localhost:8787`
- [x] Tunnel runs under launchd as a **user** agent — `cloudflared service
      install` would need sudo and create a system daemon; a user agent matches
      how the API already runs so both start and stop together
- [x] Tunnel token kept in `~/.cloudflared/deklara-mini.token` (mode 600), read
      at start time by a wrapper rather than baked into the world-readable plist
- [x] TLS verified end to end
- [x] Connected to 4 edges: zrh01, zrh02, ams06, ams17

**Accept:** verified — `https://api.kryptodeklara.ch/health` returns 200 over
the public internet with a valid cert, a real submit traversed
Cloudflare → tunnel → Mac mini and landed in SQLite, CORS allows
`kryptodeklara.ch` and returns 403 for other origins.

> Note: this machine's resolver had cached the NXDOMAIN for `api` from before
> the record existed, so local `curl` failed while `dig` succeeded. Tests use
> `--resolve` against the edge IP. Flush with
> `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder` if it bites
> again.

## Phase 6 — frontend swap

- [x] `web/tracker.js` — pageview on load + `track(name, props)`, sendBeacon,
      same event names: `Signup`, `PreorderClick`, `TierChoice`
- [x] Remove the plausible.io script tag from all three locales
- [x] Point `FORM_ENDPOINT` at `https://api.kryptodeklara.ch/submit`
- [x] Drop `FAKE_DOOR` mode — real storage now
- [x] Keep the three locale files byte-identical in their shared blocks
- [x] Honeypot (`company`) + elapsed-time field wired into the real form
- [x] Typo suggestions surfaced in the page, per locale

**Accept:** verified end to end against a local instance — the full funnel
(Pageview → PreorderClick → TierChoice → Signup) landed with UTM attribution
intact, and the lead stored with tier/cleanup/lang. No plausible.io,
FAKE_DOOR or formspree references remain in any locale.

> **Two bugs this phase, both found by testing rather than reading:**
>
> 1. `sendBeacon` with an `application/json` Blob is not CORS-safelisted, so it
>    forces a preflight a beacon cannot perform. Chrome dropped every event
>    silently while `sendBeacon` still returned `true` — analytics would have
>    reported zero forever with no error. Now sent as `text/plain`, which is
>    safelisted; the server parses JSON regardless of declared type.
> 2. The page rendered the honeypot as `company` while the server only checked
>    `hp`, so the trap was inert and a bot submission was stored. The server now
>    checks several names, with a test per name.

**Still blocked on phase 5:** `api.kryptodeklara.ch` does not resolve yet, so
the live site cannot reach the API until the tunnel exists.

## Phase 7 — legal + docs

- [x] `web/datenschutz.html`: self-hosted analytics, no cookies, exact field
      list, daily-salt hashing explained, retention, deletion contact
- [x] Remove the Plausible/Formspree mentions
- [x] Processor list corrected: GitHub Pages, Cloudflare (tunnel), Google Fonts
- [x] Event retention (400 days) actually **implemented** in `maintenance.sh` —
      it was a config value nothing enforced, so the policy would have stated a
      retention period the code did not apply
- [x] `server/README.md`: run, back up, restore, add a new project, gotchas
- [x] Root `README.md` launch checklist updated

**Accept:** verified claim by claim against the code — no cookie or storage API
anywhere, no raw-IP column (only `ip_hash`/`visitor_hash`), salt never written
to disk, query strings stripped from stored paths and referrers, UTM fields
captured as described, retention enforced nightly.

> **Two gaps worth knowing:**
>
> 1. The page now names Cloudflare as a transport processor, which becomes
>    true at phase 5 and is not yet. Over-disclosure, so harmless, but revisit
>    if the tunnel plan changes.
> 2. `datenschutz.html` and `impressum.html` are **German only**, while the site
>    serves FR and EN. The header says it applies to all three, but a French or
>    English visitor gets a German legal page. Worth translating before the
>    campaign drives non-German traffic.

## Phase 8 — end-to-end

- [x] Real submit from a browser on the **live public site** lands in the DB —
      full funnel (Pageview → PreorderClick → TierChoice → Signup) captured
      with UTM attribution, lead stored with tier/cleanup/lang
- [x] Test rows cleared afterwards so the dashboard starts from zero
- [ ] **NEEDS YOU** Reboot the Mac mini, confirm all three services return.
      Not done autonomously: rebooting your always-on machine is your call, and
      the LaunchAgents only restart once you log back in
- [x] Restore a backup into a scratch DB and confirm it opens — verified:
      `integrity_check` ok, all 5 tables present, row counts intact
- [x] Note the known gap: submissions during downtime are lost (accepted risk
      for the discovery phase), documented in `server/README.md`

---

## Out of scope for now

- Queueing submissions during downtime (a Cloudflare Worker front door)
- Email notification on each new lead
- Multi-user dashboard auth
