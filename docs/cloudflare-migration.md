# Moving DNS to Cloudflare

The domain stays registered and paid at GoDaddy. Only the nameservers change,
so `api.kryptodeklara.ch` can point at the Mac mini through a Cloudflare Tunnel.

**Do steps 1–3 and 6. Claude does 4, 5 and 7–9.**

---

## Current DNS (captured 2026-08-01, before any change)

If anything goes wrong, this is what to restore at GoDaddy.

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | `185.199.108.153` | 3600 |
| A | `@` | `185.199.109.153` | 3600 |
| A | `@` | `185.199.110.153` | 3600 |
| A | `@` | `185.199.111.153` | 3600 |
| CNAME | `www` | `vskromny.github.io` | 3600 |
| CNAME | `_domainconnect` | `_domainconnect.gd.domaincontrol.com` | 3600 |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;` | 3600 |
| NS | `@` | `ns33.domaincontrol.com`, `ns34.domaincontrol.com` | 3600 |

The four A records are GitHub Pages. `_domainconnect` is a GoDaddy convenience
record and can be dropped after the move. `_dmarc` matters only if you later
send mail from the domain — keep it.

---

## 1. Create a Cloudflare account — YOU

1. Go to **https://dash.cloudflare.com/sign-up**
2. Sign up with your email, confirm the verification mail.
3. No card needed. The free plan covers everything here.

## 2. Add the domain — YOU

1. In the dashboard click **Add a domain**.
2. Enter `kryptodeklara.ch`, choose **Free**, continue.
3. Cloudflare scans the existing records. **Check the list matches the table
   above** — it should find the four A records, the two CNAMEs and the TXT.
   If any A record is missing, add it by hand before continuing; a missing one
   means the site goes down when the nameservers switch.
4. Continue to the nameserver screen.

## 3. Send me the nameservers — YOU

Cloudflare shows two, looking like:

```
xxxx.ns.cloudflare.com
yyyy.ns.cloudflare.com
```

Paste both into the chat. **Don't change anything at GoDaddy yourself** — the
next step is scripted so the switch happens in one shot.

## 4. Verify the Cloudflare zone — CLAUDE

Before touching GoDaddy I query Cloudflare's nameservers directly and confirm
they already answer correctly for the apex and `www`. If they don't, the switch
does not happen. This is the step that prevents an outage window.

## 5. Flip the nameservers at GoDaddy — CLAUDE

Via the GoDaddy API, using the PAT. Propagation is typically minutes but can
take up to 24h — during that window some resolvers use GoDaddy's answers and
some Cloudflare's. Since both serve identical records, the site stays up either
way.

## 6. Create the tunnel — YOU (one command, then it's automatic)

Once the nameservers have propagated, in **Zero Trust → Networks → Tunnels**:

1. **Create a tunnel**, type **Cloudflared**, name it `deklara-mini`.
2. Cloudflare shows an install command containing a long token. Run it in your
   own Terminal (not in chat — the token is a credential):

   ```
   brew install cloudflared
   sudo cloudflared service install <TOKEN>
   ```

3. Back in the dashboard, **Public Hostnames → Add**:
   - Subdomain: `api`
   - Domain: `kryptodeklara.ch`
   - Service: `HTTP` → `localhost:8787`
4. Save.

## 7. Verify end to end — CLAUDE

- `https://api.kryptodeklara.ch/health` answers 200 from outside the network
- A real submit stores a row
- The three events reach `/admin`

## 8. Merge the branch — CLAUDE

`feat/self-hosted-capture` merges to `main` and deploys. **Not before step 7** —
the branch points the live form at `api.kryptodeklara.ch`, so merging early
breaks the form for every visitor.

## 9. Tidy up — CLAUDE

- Delete the `_domainconnect` record (GoDaddy-specific, useless on Cloudflare)
- Confirm HTTPS still enforced on GitHub Pages
- Set the Cloudflare SSL mode to **Full (strict)**

---

## Rollback

If anything breaks, put the GoDaddy nameservers back:

```bash
curl -X PUT "https://api.godaddy.com/v1/domains/kryptodeklara.ch/records/NS/%40" \
  -H "Authorization: Bearer $(cat ~/.godaddy-pat)" \
  -H "Content-Type: application/json" \
  -d '[{"data":"ns33.domaincontrol.com","ttl":3600},
       {"data":"ns34.domaincontrol.com","ttl":3600}]'
```

Then recreate the records from the table above. Ask me and I'll do it in one
call.

## Notes

- **Nothing about the registration changes.** Renewal, ownership and the money
  you paid all stay at GoDaddy. Reversible at any time.
- **The GoDaddy PAT should be rotated** once this is finished — it was pasted
  in chat and is a 1-year credential with DNS write access to the account.
- **Email:** the domain sends no mail today. If you add mail later, the MX
  records must be created in Cloudflare, not GoDaddy.
