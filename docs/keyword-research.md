# Keyword research — Step 1 (partial)

**Status: not complete.** Google Trends gives relative interest, never absolute
search counts. The brief's gate — ≥3,000 searches/month in season — can only be
answered by Keyword Planner. What follows is the shape of demand, not its size.

Source: Google Trends, Switzerland, monthly, Jan 2019 – Aug 2026 (92 points),
pulled 2026-08-02.

---

## The numbers

Monthly averages across seven years. Values are a relative index (0–100)
normalised across all five terms — **not** search counts.

| Month | krypto steuern | krypto steuererklärung | bitcoin steuern | wertschriften­verzeichnis | selbstanzeige |
|---|---|---|---|---|---|
| Jan | 14.1 | 0 | 8.6 | 12.5 | 30.4 |
| Feb | 11.0 | 0 | 17.5 | 33.9 | 35.8 |
| **Mar** | 13.3 | 2.3 | 8.1 | **49.8** | 31.1 |
| Apr | 10.0 | 0 | 6.6 | 24.6 | 27.8 |
| May | 2.9 | 0 | 3.9 | 14.6 | 26.5 |
| Jun | 0 | 0 | 4.9 | 18.3 | 25.3 |
| Jul | 2.5 | 0 | 0.3 | 13.6 | 25.5 |
| Aug | 2.9 | 0 | 0 | 12.5 | 25.8 |
| Sep | 3.3 | 0 | 2.7 | 15.4 | 22.3 |
| Oct | 13.3 | 0 | 0 | 9.9 | 26.7 |
| Nov | 19.4 | 0 | 6.6 | 3.1 | 19.9 |
| Dec | 18.3 | 0 | 6.7 | 3.6 | 20.4 |

---

## Four findings

### 1. The season peaks in March, not January

`wertschriftenverzeichnis` runs 3.1 in November and **49.8 in March** — a
sixteen-fold swing, and the clearest seasonal signal in the data. February
(33.9) and April (24.6) are the shoulders.

The brief plans the ad spend for January. **The data says late January through
March, weighted to March.** Spending the whole budget in January would miss the
peak by six weeks.

### 2. "krypto steuererklärung" is effectively dead in Switzerland

Zero in eleven months of twelve, 2.3 in March. This is one of the terms the
brief names as a primary keyword. Swiss people are not searching that phrase.

Anything built on it — ad groups, page titles, SEO — is aimed at demand that
does not exist. It does not follow that the *product* has no demand, only that
this is the wrong phrase for it.

### 3. "selbstanzeige" is the strongest and steadiest term

Never drops below 19.9, peaks at 35.8, and unlike everything else it barely
dips in summer. Year-round demand, not seasonal.

That matches brief §7: the Selbstanzeige / past-years segment has **no
self-serve option** — every guide says "see a tax advisor". It is also the
highest-margin tier (CHF 190–290) and gains urgency from CARF reporting in
2027.

**Caveat that matters:** `selbstanzeige` is a general tax-amnesty term. Most of
that volume is undeclared bank accounts and foreign income, not crypto. The
addressable slice is unknown and certainly much smaller. It shows the *frame*
has attention, not that the crypto niche does.

### 4. The crypto terms return literal zero in many months

`bitcoin steuern` reads 0 in August and October; `krypto steuern` reads 0 in
June. Trends reports zero when volume falls under its reporting floor — so
these are low-volume terms in Switzerland, not merely quiet ones.

This is the finding that should worry us, and it is exactly what Keyword
Planner will settle.

---

## What this does and does not tell us

**Established:** demand is real and sharply seasonal, peaking in March; the
Selbstanzeige framing carries more steady attention than the crypto-tax
framing; one of the brief's primary keywords is a dead end.

**Not established:** whether any of this clears 3,000 searches/month. Trends
cannot answer that at any level of effort. Keyword Planner can, in five
minutes.

---

## What changes if this holds up

- **Move the ad budget** from January to late-January → March, weighted to March
- **Drop `krypto steuererklärung`** as a primary term
- **Promote the Selbstanzeige/CARF-cleanup angle** from a tier to the lead
  message — it has steadier demand, no self-serve competitor, and the best
  margin
- **Re-check** whether the annual-declaration product is the main business at
  all, or the side product

None of this is actionable until the absolute numbers are in.

---

## Method note

Pulled through Google Trends' own API from an authenticated browser session on
a residential connection. Direct server-side calls return HTTP 429 — Google
blocks datacenter addresses. A second calibration query (comparing against the
high-volume term `steuererklärung` to estimate absolute values) was
rate-limited before completing; worth retrying later, though it would only ever
yield an estimate.
