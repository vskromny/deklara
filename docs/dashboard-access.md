# Dashboard access

## How it is protected now

`https://api.kryptodeklara.ch/admin` sits behind **Cloudflare Access**.
Unauthenticated requests are stopped at Cloudflare's edge and never reach the
Mac mini.

| Path | Public | Protection |
|---|---|---|
| `POST /submit` | yes | CORS allowlist, rate limit, honeypot |
| `POST /event` | yes | CORS allowlist, rate limit |
| `GET /health` | yes | none needed |
| `GET /admin` | via login | **Cloudflare Access** + token |
| `GET /admin/leads.csv` | via login | **Cloudflare Access** + token |
| anything else | no | 404 at the edge |

Two independent layers guard the dashboard: Access must let you in, *and* the
server still requires its token. Either one alone is enough to keep a stranger
out.

## Logging in

Open:

```
https://api.kryptodeklara.ch/admin?token=<token from server/data/admin-token.txt>
```

Cloudflare asks for your email, sends a one-time code to
**v.skromny@gmail.com**, and the session lasts 24 hours. Only that address is
allowed by the policy.

Locally on the Mac mini, no login is required:

```bash
open "http://localhost:8787/admin?token=$(cat server/data/admin-token.txt)"
```

## Configuration

- Zero Trust org: `silent-band-422f.cloudflareaccess.com`
- Access app: `Deklara dashboard` → `api.kryptodeklara.ch/admin`
- Policy: `Only Vladimir` → allow `v.skromny@gmail.com`
- Identity: one-time PIN by email (built in, no password anywhere)
- Session: 24h

## Adding a passkey later

One-time email codes are already passwordless. For true passkeys, add Google
as an identity provider in Zero Trust → Settings → Authentication, then add it
to the app's `allowed_idps`. Google accounts support passkeys, so the login
becomes Touch ID rather than a code in your inbox. No change needed on our
side.

## Adding someone else

```bash
ACC=<account id>; APP=<app id>
curl -X POST -H "Authorization: Bearer $(cat ~/.cloudflare-token)" \
  -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/accounts/$ACC/access/apps/$APP/policies" \
  -d '{"name":"Accountant","decision":"allow",
       "include":[{"email":{"email":"someone@example.ch"}}]}'
```

## Ordering rule, if this is ever rebuilt

Create the Access application **before** opening the `/admin` path in the
tunnel. Doing it the other way round exposes the dashboard for the gap in
between.

## If you ever drop Cloudflare

Remove the `/admin` ingress rule from the tunnel config. The dashboard becomes
local-only again, which is where it sat before Access was set up. No code
change, and the database never leaves the Mac mini in either arrangement.
