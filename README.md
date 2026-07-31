# Deklara — Validation-Phase Site

Landing page for **Deklara**: messy crypto records → canton-ready Wertschriftenverzeichnis for the Swiss tax declaration. This repo contains the fake-door validation site (brief §4–§5), not the product.

- `index.html` — German landing page (primary market)
- `fr/index.html` — French version (Romandie)
- `en/index.html` — English version (expats; English Forum Switzerland channel)
- `impressum.html` / `datenschutz.html` — Swiss DSG legal pages (**contain placeholders**)
- `docs/project-brief.md` — the full project brief
- `docs/validation.md` — validation tracker with kill thresholds
- `favicon.svg`, `robots.txt`, `sitemap.xml`, `_headers` — deploy scaffolding

## Launch checklist (do these before/at publishing)

1. **Register domain** (~CHF 15/yr, e.g. Infomaniak). The pages assume `kryptodeklara.ch` — if you register something else, search-and-replace `kryptodeklara.ch` in `index.html`, `fr/index.html`, `en/index.html`, `robots.txt`, `sitemap.xml`.
2. **Create a Formspree form** (formspree.io, free tier is fine) and replace `DEIN_FORM_ID` in the `FORM_ENDPOINT` constant at the bottom of **all three** of `index.html`, `fr/index.html` and `en/index.html`. Until then the page runs in *fake-door mode*: it shows the success message locally and only fires analytics (no email is stored!).
3. **Set up Plausible Analytics** (plausible.io) for your domain. The tracking snippet is already in the `<head>` of both pages (`data-domain="kryptodeklara.ch"` — update if your domain differs). Goals to create in Plausible: `Signup`, `PreorderClick`, `TierChoice` (custom events, already wired with props: `tier`, `cleanup`, `lang`).
4. **Fill in the legal placeholders** in `impressum.html` and `datenschutz.html` (marked with red dashed boxes: name, address, contact email).
5. **Deploy**: push to a Cloudflare Pages / Netlify / Vercel free-tier project connected to this repo. No build step — it's static files at the repo root. `_headers` is picked up automatically by Cloudflare Pages and Netlify.
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
