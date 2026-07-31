# Deklara — Project Brief
*Handoff document for Claude Code · July 2026 · Founder: Vladimir (Switzerland)*

---

## 1. What we're building

**Deklara** (working name): a web-based tool that compiles messy crypto records (PDFs, screenshots, CSVs, notes) into a canton-ready **Wertschriftenverzeichnis** (securities register) for the annual Swiss tax declaration.

**Positioning:** NOT a portfolio tracker. NOT for active traders. The anti-Koinly: for HODLers with incomplete records who need one clean document once a year. Competitors (Koinly, Blockpit/Accointing, CoinTracking) require API sync + complete transaction history; Deklara accepts messy, partial, document-based input.

**Tagline (DE):** "Krypto in der Steuererklärung. Erledigt in 10 Minuten."

---

**Why this fits the founder's constraints (low maintenance, minimal marketing):**
- Demand is *mandated by law*, renewed annually — the state does retention
- High-intent seasonal search traffic (Jan–Mar) — works without content marketing
- Seasonal workload — low maintenance rest of year
- CARF regulatory tailwind creates urgency/fear (see §2)

---

## 2. Market facts (sourced during research)

- 18% of Swiss population holds crypto (HSLU/IFZ + LUKB study, June 2026; up from 11% in 2024) ≈ 1.4–1.6M holders; ~140K new investors entered 2025→2026
- Swiss tax rules: crypto declared as wealth at official ESTV values per 31 Dec; staking/lending/mining = taxable income at value on receipt; private capital gains tax-free (safe-harbour criteria, Kreisschreiben 36); wealth tax is cantonal, 26 canton formats; typical deadline 31 March, extensions to Sep–Nov in many cantons
- **CARF:** from 1 Jan 2027 crypto platforms report Swiss user data to tax authorities (first data flows ~2028). Incomplete declarations risk back-taxes/penalties → strong fear-based demand driver + "past years cleanup" opportunity
- Competitors: Koinly (~free tracking, paid reports), Blockpit (acquired Swiss Accointing 2023, KPMG partnership), CoinTracking. All API-sync, transaction-ledger, trader-priced (~CHF 50–250/yr). See §7 for the full verified competitive map.
- Benchmark reality check: median new subscription app = ~$72/mo after 1 yr; only 4.6% reach $10K MRR. Deklara targets a realistic solo-business outcome, not a unicorn.

**Market sizing:** ~200K holders with multi-wallet complexity who self-file × CHF 49–79 ≈ CHF 10–15M serviceable market. 1–2% capture = CHF 100–300K/yr.

---

## 3. Monetization (decided)

**Model: one-time purchase per Steuerjahr (recurring one-time), NOT auto-renew subscription.**
Rationale: Swiss subscription aversion, lower conversion friction, deadline does re-acquisition (January email: "your last year is preloaded, CHF 39"), zero churn management. Auto-renew offered later as opt-in discount.

**Payments: Stripe** (Checkout / Payment Links). Must include **TWINT** + cards + Apple/Google Pay. ~2.9% fees. No Swiss VAT registration needed below CHF 100K revenue. Web = no Apple 15–30% cut (key reason product is web-first, not a mobile app).

**Tiers (to be price-tested during validation):**
| Tier | Price | Scope |
|---|---|---|
| Basic | CHF 39 (early-bird) / 79 | Holdings + staking, ≤3 wallets/exchanges |
| Plus | CHF 89 | DeFi, NFTs, unlimited sources |
| Pro | CHF 149 | + professional-trader safe-harbour risk assessment |
| CARF Cleanup | CHF 190–290 | Compile 3–5 undeclared past years (Selbstanzeige support docs) — potentially biggest 2026–27 earner |
| Treuhänder license | CHF 490/season | Unlimited client compilations for fiduciaries (B2B2C; 1 sale ≈ 10 consumers + free referral channel) |

Blended realistic target: ~CHF 150–160K/yr at 1,500 consumers + 200 cleanups + 20 fiduciaries.

**Retention moat:** store compiled data year-over-year → year 2 takes 2 minutes vs. restarting with a competitor. Target 60–80% annual repeat.

---

## 4. Validation plan (BEFORE building the product) — with kill thresholds

**Step 1 — Search demand (free, this week):** Google Keyword Planner for "krypto steuern", "krypto steuererklärung", "bitcoin steuern schweiz" (+ FR variants), CH-only, Jan–Mar seasonality. PASS: ≥3,000 combined monthly searches in season. KILL: <1,000.

**Step 2 — Fake-door test (2–3 weeks, ~CHF 300):**
- Publish landing page (already built: `deklara-landing.html`)
- Traffic: (a) one-time Google Search test CHF 200–250, CH-only — bid on LONG-TAIL terms per §7 (Selbstanzeige, Wertschriftenverzeichnis, "ohne Transaktionshistorie"), not head terms where Blockpit/Koinly dominate and CPCs are inflated; (b) free question-framed posts on r/SwissPersonalFinance, Mustachian Post forum, English Forum Switzerland
- Metrics: visitor→email **≥8% = green** (<3% = kill); email→early-bird click **≥20%** = willingness to pay. Minimum sample: 300 visitors, 30 emails.
- Optional stronger signal: replace fake door with real CHF 5 refundable Stripe deposit (10 deposits ends the debate)
- Add tier-choice (39/89/149) before email capture to price-test

**Step 3 — Concierge MVP (zero code, strongest signal):** offer 5–10 waitlist users manual compilation for CHF 39. Timing works now: canton extensions run to Sep–Nov, late filers exist. PASS: ≥3 strangers pay + hand over real documents. Bonus: reveals real messy-input formats before writing code.

**Decision gate:** search volume + ≥8% email rate + ≥3 paid concierge customers → BUILD. Two failures → stop (~CHF 300 spent vs. 3 months saved).

**Note:** emails collected Jul–Oct are re-engaged in January when tax anxiety peaks — slow summer numbers are not a kill signal on their own.

---

## 5. Landing page (built — `deklara-landing.html`)

- German (de-CH), Swiss typographic style, red/white/black, Archivo + Inter + IBM Plex Mono
- Signature element: animated Wertschriftenverzeichnis (Formular 101.05) that fills itself + "Bereit zum Einreichen" stamp
- Sections: hero + email capture, 3 pains, 3-step how-it-works, CARF urgency band (dark), pricing card CHF 39 early-bird, FAQ (incl. "no tax advice", "capital gains tax-free", "incomplete history OK"), disclaimer footer
- Deliberately no "app" mention — web-first product decision (once-a-year desk task; avoids App Store cut/review; retention data shows annual-use apps die on mobile)
- **TODOs before publishing:**
  - Replace Formspree placeholder `DEIN_FORM_ID` with real form endpoint
  - Add analytics (Plausible ~CHF 9/mo or free Cloudflare) — fire events `Signup` and `PreorderClick` (hooks marked in JS)
  - Register .ch domain (~CHF 15/yr, e.g. Infomaniak) — Swiss trust signal
  - Host: Cloudflare Pages / Netlify / Vercel free tier
  - Add Impressum + Datenschutz footer (email collection, Swiss DSG)
  - Optional: French version for Romandie (~25% of market, thinner keyword competition)
  - Optional: tier-choice modal on early-bird button

---

## 6. Product architecture direction (for the build phase, post-validation)

- **Web app, not mobile.** Simple stack; static marketing site + app behind login
- Core pipeline: upload (PDF/image/CSV/text) → LLM extraction of holdings & income events → match to official ESTV year-end price list (published by Eidgenössische Steuerverwaltung; fallback: documented exchange price at 31.12) → separate wealth (Bestand 31.12.) vs. income (staking/lending at receipt value) → generate canton-formatted PDF
- Store per-user prior-year data (retention moat); allow full deletion post-export (privacy promise on landing page); plan Swiss hosting eventually
- Human-in-the-loop review screen before PDF export (accuracy liability mitigation)
- Legal guardrail everywhere: "keine Steuerberatung" — compilation tool, not advice

## 7. Competitive map (verified via research, July 2026)

Three layers exist in the Swiss market — none occupies Deklara's slot:

**Layer 1 — Trader software (indirect competitors):**
- **Blockpit** (blockpit.io): European leader post-Accointing acquisition; localized de-ch Swiss guides for every canton; KPMG partnership; ESTV-compatible reports. API/CSV transaction import model, priced by transaction volume.
- **Koinly** (koinly.io): 800+ wallet/exchange integrations, Swiss canton guide, free tracking up to 10K transactions, paid reports.
- **CoinTracking** (cointracking.info): DACH-focused, comprehensive imports, "test winner" in German-language comparisons.
- Common weakness = Deklara's wedge: all require API keys / complete transaction histories; built for active traders; overkill for HODLers with partial, document-based records.

**Layer 2 — Human services (price ceiling / concierge reference):**
- **Swiss Crypto Tax GmbH** (cryptotax.ch, Zürich-Oerlikon, founder Gilbert Lenherr): crypto-focused Treuhand/tax consultancy; personal analysis, 60-min consultations, full declaration + Selbstanzeige support. Priced as human advisory (est. CHF 300–1,000+ per engagement). Notably co-signs Blockpit's Swiss content (credibility partnership).
- **Traditional Treuhand firms** (e.g., STM Treuhand Zürich): crypto declaration as part of general fiduciary services, fiduciary rates.
- **taxea.ch**: online Swiss tax-filing service; recommends Koinly/CoinTracking/Blockpit for the crypto part rather than solving it natively → potential B2B2C partner, not just competitor.
- Key finding: the Selbstanzeige / past-years-cleanup segment has NO self-serve option — guides universally say "contact a tax advisor." Deklara's CARF Cleanup tier enters an empty slot.

**Layer 3 — Free DIY:** cantonal instruction pages (ZH, AG, SG publish how-tos; AG specifies Form 101.05 with code "KR"), ESTV year-end price list (ictax.admin.ch), blog checklists (Schwiizerfranke etc.).

**The gap (confirmed):** nothing between CHF 0 DIY and CHF 100–250 trader software / CHF 500+ human advisory for the messy-records HODLer wanting one canton-ready document.

**Critical GTM caveat:** Blockpit + Koinly dominate SERPs for all head terms ("krypto steuern schweiz", "krypto steuererklärung") with localized content + expert co-signs. Do NOT compete head-on. Keyword strategy = long-tail where trader positioning doesn't fit:
- "wertschriftenverzeichnis krypto erstellen"
- "krypto selbstanzeige" / "krypto nachdeklarieren" (empty self-serve slot + CARF fear)
- Canton-specific: "krypto steuererklärung zürich/aargau/bern..." (26 landing pages later)
- "krypto deklarieren ohne transaktionshistorie" / "krypto steuern nur hodl"
- French equivalents (Romandie: thinner competition)
Plus community channels (r/SwissPersonalFinance, Mustachian Post, English Forum Switzerland) where "I just HODL, Koinly is overkill" is the natural entry.

## 8. Known risks

- Competitors (Blockpit/Koinly) adding AI messy-import — speed matters
- Blockpit/Koinly SERP dominance on head terms (verified) — GTM must stay long-tail + community; head-term SEO is a losing fight
- CARF may push exchanges to give users ready summaries (partial demand erosion post-2028)
- Accuracy/liability stakes in a finance product — review step + disclaimers required
- Seasonal revenue concentration (Jan–Mar + extension tail)
- 26 canton formats = long-tail formatting work (start with ZH/BE/VD/GE/AG, cover ~half the population)

---

*Next immediate actions: keyword volume check → publish page with real form + analytics → community posts → evaluate against §4 thresholds.*
