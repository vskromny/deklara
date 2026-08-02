# Securing the dashboard

## Where things stand

The tunnel now routes only the collector endpoints publicly:

| Path | Public | Why |
|---|---|---|
| `POST /submit` | yes | the live form needs it |
| `POST /event` | yes | the tracker needs it |
| `GET /health` | yes | uptime checks |
| `GET /admin` | **no — 404** | dashboard |
| `GET /admin/leads.csv` | **no — 404** | the email list |

Everything else on `api.kryptodeklara.ch` returns 404 at Cloudflare's edge, so
it never reaches the Mac mini.

The dashboard is still reachable **on the machine itself**:

```bash
open "http://localhost:8787/admin?token=$(cat server/data/admin-token.txt)"
```

This closed the real problem: the whole email list sat behind a single
32-character token, on the open internet, with no rate limit and no lockout —
and that token is in a chat transcript and browser history.

## Getting remote access back, with real auth

Cloudflare Access puts a login in front of `/admin` at the edge, so
unauthenticated requests never reach the Mac mini at all. Free for up to 50
users. Supports one-time email codes (no password) or passkeys via Google as
identity provider.

**Access is not enabled on the account yet, and the API cannot enable it** —
it needs one dashboard action:

1. **https://one.dash.cloudflare.com** → pick a team name (e.g. `deklara`).
   This becomes `deklara.cloudflareaccess.com`, the login domain.
2. That is all. Tell Claude, and the rest is scripted:
   - create an Access application scoped to `api.kryptodeklara.ch/admin`
   - policy: allow only `v.skromny@gmail.com`
   - identity: one-time PIN by email, or Google for a passkey flow
   - re-open the `/admin` path in the tunnel, now protected by Access
   - verify that an unauthenticated request is redirected to login and that
     `/submit` and `/event` are untouched

**Important ordering:** the Access application must exist *before* the `/admin`
path is re-opened in the tunnel. Re-opening first would expose the dashboard
again for the gap in between.

## Token permissions needed

The current token can manage tunnels and DNS. For the Access step it also
needs:

- `Account` → `Access: Apps and Policies` → `Edit`
- `Account` → `Access: Organizations, Identity Providers, and Groups` → `Edit`

## If you ever drop Cloudflare

The fallback is what is running right now: collector paths public, admin
local-only. No code change, no data movement — the database never leaves the
Mac mini in either arrangement.
