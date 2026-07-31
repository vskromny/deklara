# Deklara

**Deklara**: messy crypto records → canton-ready Wertschriftenverzeichnis for the Swiss tax declaration.

## Repository layout

```
web/       — the public landing site (validation phase, brief §4–§5)
server/    — server-side implementation (not started)
docs/      — project brief, validation tracker
```

### `web/` — validation-phase site

- `index.html` — German landing page (primary market)
- `fr/index.html` — French version (Romandie)
- `en/index.html` — English version (expats; English Forum Switzerland channel)
- `impressum.html` / `datenschutz.html` — Swiss DSG legal pages (**contain placeholders**)
- `favicon.svg`, `robots.txt`, `sitemap.xml`, `_headers` — deploy scaffolding
- `CNAME`, `.nojekyll` — GitHub Pages custom-domain config

### `docs/`

- `docs/project-brief.md` — the full project brief (**business-sensitive: unlaunched pricing, market sizing**)
- `docs/validation.md` — validation tracker with kill thresholds

## Launch checklist (do these before/at publishing)

1. ~~**Register domain**~~ — done: `kryptodeklara.ch`, registered at GoDaddy 2026-07-31, expires 2027-07-30, auto-renew on. DNS is managed at GoDaddy (`ns33/ns34.domaincontrol.com`).
2. **Create a Formspree form** (formspree.io, free tier is fine) and replace `DEIN_FORM_ID` in the `FORM_ENDPOINT` constant at the bottom of **all three** of `web/index.html`, `web/fr/index.html` and `web/en/index.html`. Until then the page runs in *fake-door mode*: it shows the success message locally and only fires analytics (**no email is stored!**).
3. **Set up Plausible Analytics** (plausible.io) for your domain. The tracking snippet is already in the `<head>` of all three pages (`data-domain="kryptodeklara.ch"`). Goals to create in Plausible: `Signup`, `PreorderClick`, `TierChoice` (custom events, already wired with props: `tier`, `cleanup`, `lang`).
4. **Fill in the legal placeholders** in `web/impressum.html` and `web/datenschutz.html` (marked with red dashed boxes: name, address, contact email). A Swiss commercial site needs a real imprint.
5. **Deploy**: the `.github/workflows/pages.yml` workflow publishes `web/` to GitHub Pages on every push to `main`. Alternatively Cloudflare Pages / Netlify with build output directory `web` — those two also honour `_headers`, which GitHub Pages ignores.
6. **Test the funnel** once live: submit a real email → check it arrives in Formspree; click "Early-Bird sichern" → tier modal → check events in Plausible.

## Traffic plan (brief §4, step 2)

- One-time Google Search campaign, CHF 200–250, CH-only, **long-tail keywords only** (Selbstanzeige, Wertschriftenverzeichnis krypto, "ohne Transaktionshistorie", canton terms) — do not bid on head terms where Blockpit/Koinly dominate.
- Free question-framed posts: r/SwissPersonalFinance, Mustachian Post forum, English Forum Switzerland.

## Decision thresholds (brief §4)

| Metric | Green | Kill |
|---|---|---|
| Seasonal search volume (combined, CH) | ≥ 3,000/mo | < 1,000/mo |
| Visitor → email rate | ≥ 8% | < 3% |
| Email → early-bird click | ≥ 20% | — |
| Concierge MVP paid customers | ≥ 3 strangers | — |

Minimum sample: 300 visitors / 30 emails. Two failures → stop. Track progress in `docs/validation.md`.

Summer note: emails collected Jul–Oct get re-engaged in January when tax anxiety peaks — slow summer numbers alone are not a kill signal.
