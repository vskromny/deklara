# Google Ads campaign — ready to execute

CHF 250, Switzerland only, German first. Built from brief §4 (validation) and
§7 (competitive map).

**Run this in January, not now.** The product is Jan–Mar seasonal; in August
you would pay for clicks nobody makes and get a conversion rate that proves
nothing either way. The exception is if Keyword Planner shows unexpectedly
strong off-season volume — then a small CHF 50 probe is defensible.

**Do not start before:** Step 1 keyword check passes (≥3,000/mo in season), and
a test submit on the live site lands in the dashboard.

---

## Campaign settings

| Setting | Value | Why |
|---|---|---|
| Type | Search only | No Display. The Display Network will eat the budget on junk impressions. |
| Networks | Google Search only — **uncheck "Search partners"** | Partners convert worse and are hard to diagnose at this budget |
| Location | Switzerland, **"Presence: people in this location"** | The default also targets people *interested in* Switzerland — expats searching from abroad, wrong audience |
| Language | German (add French as a separate campaign later) | |
| Budget | **CHF 12/day**, run ~21 days | CHF 250 over three weeks. Four days at CHF 60 tells you nothing. |
| Bidding | **Manual CPC**, max CHF 1.50 | Do not use Maximise Conversions — with under ~30 conversions it has nothing to learn from and will overspend |
| Ad rotation | Rotate evenly | So the copy test is fair |
| Schedule | All days; consider 07:00–23:00 | |

Set the budget cap in the account. Nothing else protects you from a runaway.

---

## Keywords — long-tail only

Brief §7 is explicit: Blockpit and Koinly own every head term with localised
content and expert co-signs. Bidding on "krypto steuern schweiz" burns CHF 250
in days at inflated CPCs against better-resourced competitors.

All in **phrase match** (quotes) unless marked. Exact match `[...]` for the
highest-intent terms.

### Ad group 1 — Wertschriftenverzeichnis (highest intent)

```
[wertschriftenverzeichnis krypto]
"wertschriftenverzeichnis krypto erstellen"
"krypto wertschriftenverzeichnis vorlage"
"formular 101.05 krypto"
"krypto in wertschriftenverzeichnis eintragen"
```

These people know exactly what document they need. Send to `/`.

### Ad group 2 — Selbstanzeige / past years (empty market slot, highest margin)

```
[krypto selbstanzeige]
"krypto nachdeklarieren"
"krypto steuern nachzahlen"
"bitcoin nicht deklariert"
"krypto steuern vergessen"
"straflose selbstanzeige krypto"
```

Brief §7: *"the Selbstanzeige / past-years-cleanup segment has NO self-serve
option — guides universally say 'contact a tax advisor'."* This is the CHF
190–290 tier and the least contested ground. Watch this group closely.

### Ad group 3 — Incomplete records (the actual wedge)

```
"krypto deklarieren ohne transaktionshistorie"
"krypto steuern nur hodl"
"krypto steuern ohne api"
"krypto steuererklärung ohne koinly"
"bitcoin steuern einfach schweiz"
```

Straight at the Koinly-is-overkill audience.

### Ad group 4 — Canton-specific (cheap, low volume, very high intent)

```
"krypto steuererklärung zürich"
"krypto steuern aargau"
"krypto steuererklärung bern"
"krypto steuern st. gallen"
"krypto steuererklärung luzern"
```

Start with ZH/AG/BE — the cantons that publish their own crypto how-tos, so
demand is demonstrably there. Dedicated canton landing pages come later.

### Negative keywords (add before launch)

```
-gratis          -kostenlos       -free
-umgehen         -vermeiden       -hinterziehen    -legal umgehen
-kurs            -preis prognose  -kaufen          -verkaufen
-mining rechner  -wallet          -börse
-job             -lehre           -ausbildung      -kurs besuchen
-koinly          -blockpit        -cointracking
```

Two matter most: **`-umgehen`/`-hinterziehen`** (people looking to evade tax,
not declare it — you cannot serve them and should not pay for them), and the
**competitor names** (brand searchers are looking for that product, and those
clicks are expensive and convert badly).

---

## Ad copy — German

Three responsive search ads, rotating evenly. Give each 8–10 headlines and 3–4
descriptions; Google assembles them.

### Headlines

```
Krypto in der Steuererklärung
Erledigt in 10 Minuten
Wertschriftenverzeichnis für deinen Kanton
Ohne lückenlose Transaktionshistorie
Screenshots und PDFs genügen
Kein Abo. Einmal pro Jahr.
Offizielle ESTV-Kurswerte per 31.12.
Alle 26 Kantone
Early-Bird CHF 39 statt CHF 79
Auch für frühere Steuerjahre
```

### Descriptions

```
Lade Screenshots, PDFs und Wallet-Auszüge hoch. Deklara erstellt dein fertiges Wertschriftenverzeichnis.
Kein Portfolio-Tracking, kein Trader-Abo. Nur die eine Deklaration, die du einmal im Jahr brauchst.
Keine API-Schlüssel, keine vollständige Historie nötig. Für HODLer mit unvollständigen Unterlagen.
Ab 2027 melden Krypto-Plattformen an die Steuerbehörden. Jetzt sauber nachdeklarieren.
```

The last description is for ad group 2 only — CARF urgency is the reason that
audience acts now.

### Ad group → description pairing

| Ad group | Lead with |
|---|---|
| 1 Wertschriftenverzeichnis | "fertiges Wertschriftenverzeichnis für deinen Kanton" |
| 2 Selbstanzeige | CARF 2027 deadline |
| 3 Incomplete records | "keine lückenlose Historie nötig" |
| 4 Canton | canton name in headline 1 |

---

## Landing URLs with tracking

Use these as the Final URL per ad group. The dashboard reads `utm_*` and will
show cost-per-signup per group instead of one undifferentiated number.

```
https://kryptodeklara.ch/?utm_source=google&utm_medium=cpc&utm_campaign=jan2027&utm_content=wertschriften
https://kryptodeklara.ch/?utm_source=google&utm_medium=cpc&utm_campaign=jan2027&utm_content=selbstanzeige
https://kryptodeklara.ch/?utm_source=google&utm_medium=cpc&utm_campaign=jan2027&utm_content=keine-historie
https://kryptodeklara.ch/?utm_source=google&utm_medium=cpc&utm_campaign=jan2027&utm_content=kanton
```

French, when you add it:

```
https://kryptodeklara.ch/fr/?utm_source=google&utm_medium=cpc&utm_campaign=jan2027-fr
```

---

## Free channels — do these now, they are season-agnostic

Post as a question, not an ad. These communities punish marketing and reward
genuine problems.

- **r/SwissPersonalFinance** — "How do you declare crypto when you don't have
  full transaction history? Koinly seems built for traders."
- **Mustachian Post forum** — same angle; this audience is exactly the
  low-activity HODLer.
- **English Forum Switzerland** — the expat cut, links to `/en/`.

Tag the links so they show up separately:

```
https://kryptodeklara.ch/?utm_source=reddit&utm_medium=post&utm_campaign=organic
https://kryptodeklara.ch/?utm_source=mustachian&utm_medium=post&utm_campaign=organic
https://kryptodeklara.ch/en/?utm_source=englishforum&utm_medium=post&utm_campaign=organic
```

Disclose that it is your project. Getting caught not disclosing costs more than
the traffic is worth.

---

## What to watch, and when to stop

Minimum sample before concluding anything: **300 visitors, 30 emails.**

| Metric | Green | Kill |
|---|---|---|
| Visitor → email | ≥8% | <3% |
| Email → early-bird click | ≥20% | — |
| Cost per email | <CHF 8 | >CHF 25 |

**Kill an ad group early** if it spends CHF 40 with zero signups. **Pause the
whole campaign** if CHF 100 is gone and the signup rate is under 3%.

The most informative outcome is not the overall rate — it is *which ad group*
converts. If Selbstanzeige outperforms, the CARF cleanup tier is the real
business and the annual declaration is the side product. That would change what
gets built first.
