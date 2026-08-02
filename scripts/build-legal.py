#!/usr/bin/env python3
"""
Generate the six legal pages (imprint + privacy, in DE/FR/EN) from one
template.

Legal text drifts silently when three language versions are edited by hand —
one gets a new clause, the others quietly do not, and the site ends up making
different promises depending on which flag the visitor clicked. Generating all
six from a single structure makes that impossible: a missing translation is a
KeyError at build time, not a legal inconsistency discovered later.

    python3 scripts/build-legal.py

Edit this file, never the generated HTML.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web"

CONTROLLER = {
    "name": "Vladimir Skromny",
    "street": "Im Gässli 19",
    "city": "8162 Steinmaur",
    "email": "kontakt@kryptodeklara.ch",
}

# ---------------------------------------------------------------- shell ----

STYLE = """  :root{--ink:#101010;--paper:#fff;--field:#f4f4f1;--red:#e3000f;--grey:#6e6e6e;--line:#101010}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;color:var(--ink);background:var(--paper);font-size:16px;line-height:1.6}
  .wrap{max-width:760px;margin:0 auto;padding:0 24px}
  header{border-bottom:2px solid var(--line)}
  .bar{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:18px 0}
  .logo{font-family:'Archivo',sans-serif;font-weight:800;font-size:1.25rem;letter-spacing:-0.02em;display:flex;align-items:center;gap:10px;color:var(--ink);text-decoration:none}
  .cross{width:20px;height:20px;background:var(--red);position:relative;flex:none}
  .cross::before,.cross::after{content:"";position:absolute;background:#fff}
  .cross::before{width:12px;height:4px;left:4px;top:8px}
  .cross::after{width:4px;height:12px;left:8px;top:4px}
  .lang{font-family:'IBM Plex Mono',monospace;font-size:0.75rem}
  .lang a{color:var(--grey);text-decoration:none;display:inline-block;padding:6px 2px}
  .lang a:hover{color:var(--red)}
  .lang .active{color:var(--ink);font-weight:500}
  main{padding:56px 0 80px}
  h1{font-family:'Archivo',sans-serif;font-weight:800;font-size:2rem;letter-spacing:-0.02em;margin-bottom:12px}
  .stand{font-family:'IBM Plex Mono',monospace;font-size:0.78rem;color:var(--grey);margin-bottom:32px}
  h2{font-family:'Archivo',sans-serif;font-weight:700;font-size:1.1rem;margin:32px 0 10px}
  p,li{margin-bottom:12px;max-width:44rem}
  ul{margin:0 0 12px 20px}
  li{margin-bottom:10px}
  address{font-style:normal;background:var(--field);padding:14px 16px;margin:8px 0;line-height:1.7}
  address a{color:var(--red)}
  .small{font-size:0.85rem;color:var(--grey);margin-top:10px}
  a{color:var(--red)}
  footer{border-top:2px solid var(--line);padding:32px 0 48px;font-size:0.8rem;color:var(--grey)}
  footer a{color:var(--ink)}
  @media(max-width:620px){
    .wrap{padding:0 18px}
    main{padding:40px 0 56px}
    h1{font-size:1.6rem}
  }"""

PAGE = """<!DOCTYPE html>
<html lang="{html_lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} — Deklara</title>
<meta name="robots" content="noindex">
<link rel="icon" type="image/svg+xml" href="{root}favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
{style}
</style>
</head>
<body>
<header>
  <div class="wrap bar">
    <a class="logo" href="{home}"><span class="cross" aria-hidden="true"></span>Deklara</a>
    <nav class="lang" aria-label="{lang_label}">{lang_nav}</nav>
  </div>
</header>
<main>
  <div class="wrap">
    <h1>{title}</h1>
    <p class="stand">{stand}</p>

{body}  </div>
</main>
<footer>
  <div class="wrap">
    <p><a href="{home}">{back}</a> · <a href="{other_href}">{other_label}</a></p>
  </div>
</footer>
</body>
</html>
"""

# Where each language's pages live, and how they reach the site root.
LOCALES = {
    "de": {"dir": "", "root": "", "home": "./", "html_lang": "de-CH"},
    "fr": {"dir": "fr/", "root": "../", "home": "../fr/", "html_lang": "fr-CH"},
    "en": {"dir": "en/", "root": "../", "home": "../en/", "html_lang": "en-CH"},
}

FILENAMES = {
    "de": {"imprint": "impressum.html", "privacy": "datenschutz.html"},
    "fr": {"imprint": "mentions-legales.html", "privacy": "confidentialite.html"},
    "en": {"imprint": "legal-notice.html", "privacy": "privacy.html"},
}

UI = {
    "de": {
        "lang_label": "Sprache",
        "back": "Zurück zur Startseite",
        "imprint": "Impressum",
        "privacy": "Datenschutz",
        "stand": "Stand: August 2026",
    },
    "fr": {
        "lang_label": "Langue",
        "back": "Retour à l'accueil",
        "imprint": "Mentions légales",
        "privacy": "Confidentialité",
        "stand": "Version : août 2026",
    },
    "en": {
        "lang_label": "Language",
        "back": "Back to home",
        "imprint": "Legal notice",
        "privacy": "Privacy",
        "stand": "Last updated: August 2026",
    },
}

ADDRESS = {
    "de": "Schweiz",
    "fr": "Suisse",
    "en": "Switzerland",
}

# French typography puts a non-breaking space before a colon.
EMAIL_LABEL = {
    "de": "E-Mail:",
    "fr": "E-mail&nbsp;:",
    "en": "Email:",
}


def address_block(lang):
    return (
        "    <address>\n"
        f"      {CONTROLLER['name']}<br>\n"
        f"      {CONTROLLER['street']}<br>\n"
        f"      {CONTROLLER['city']}, {ADDRESS[lang]}<br>\n"
        f"      {EMAIL_LABEL[lang]} <a href=\"mailto:{CONTROLLER['email']}\">{CONTROLLER['email']}</a>\n"
        "    </address>\n"
    )


# --------------------------------------------------------------- content ----

IMPRINT = {
    "de": {
        "title": "Impressum",
        "sections": [
            ("Verantwortlich für diese Website", "ADDRESS"
             "<p class=\"small\">Deklara ist ein Einzelprojekt und (noch) nicht im Handelsregister eingetragen. Es besteht keine Mehrwertsteuerpflicht, da der massgebende Jahresumsatz die Eintragungsgrenze nicht erreicht.</p>"),
            ("Haftungsausschluss",
             "<p>Deklara befindet sich in Entwicklung. Diese Website dient der Interessensbekundung. Alle Angaben ohne Gewähr. Deklara erbringt keine Steuer-, Rechts- oder Anlageberatung; die bereitgestellten Inhalte und künftigen Dokumente sind reine Kompilationen der von Nutzerinnen und Nutzern gelieferten Unterlagen und ersetzen keine individuelle Beratung durch eine Fachperson oder Auskünfte der zuständigen kantonalen Steuerbehörde.</p>"
             "<p>Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte externer Links wird keine Haftung übernommen.</p>"),
            ("Urheberrecht",
             "<p>Sämtliche Inhalte dieser Website (Texte, Gestaltung, Grafiken) sind urheberrechtlich geschützt. © 2026 Deklara.</p>"),
        ],
    },
    "fr": {
        "title": "Mentions légales",
        "sections": [
            ("Responsable de ce site", "ADDRESS"
             "<p class=\"small\">Deklara est un projet individuel qui n'est pas (encore) inscrit au registre du commerce. Il n'est pas assujetti à la TVA, le chiffre d'affaires annuel déterminant n'atteignant pas le seuil d'assujettissement.</p>"),
            ("Clause de non-responsabilité",
             "<p>Deklara est en cours de développement. Ce site sert à recueillir des manifestations d'intérêt. Toutes les informations sont fournies sans garantie. Deklara ne fournit aucun conseil fiscal, juridique ou en matière de placement ; les contenus proposés et les futurs documents sont de simples compilations des pièces fournies par les utilisatrices et utilisateurs et ne remplacent ni un conseil individuel par une personne qualifiée ni les renseignements de l'autorité fiscale cantonale compétente.</p>"
             "<p>Aucune responsabilité n'est assumée quant à l'exactitude, l'exhaustivité et l'actualité des contenus de liens externes.</p>"),
            ("Droit d'auteur",
             "<p>L'ensemble des contenus de ce site (textes, conception, graphiques) est protégé par le droit d'auteur. © 2026 Deklara.</p>"),
        ],
    },
    "en": {
        "title": "Legal notice",
        "sections": [
            ("Responsible for this website", "ADDRESS"
             "<p class=\"small\">Deklara is an individual project and is not (yet) entered in the Swiss commercial register. It is not liable for VAT, as the relevant annual turnover does not reach the registration threshold.</p>"),
            ("Disclaimer",
             "<p>Deklara is under development. This website serves to gauge interest. All information is provided without warranty. Deklara does not provide tax, legal or investment advice; the content offered and any future documents are compilations of the records supplied by users and replace neither individual advice from a qualified professional nor information from the competent cantonal tax authority.</p>"
             "<p>No liability is accepted for the accuracy, completeness or timeliness of the content of external links.</p>"),
            ("Copyright",
             "<p>All content on this website (text, design, graphics) is protected by copyright. © 2026 Deklara.</p>"),
        ],
    },
}

PRIVACY = {
    "de": {
        "title": "Datenschutzerklärung",
        "sections": [
            ("1. Verantwortliche Stelle", "ADDRESS"
             "<p>Verantwortlich im Sinne des Schweizer Bundesgesetzes über den Datenschutz (DSG) ist die oben genannte Person. Diese Erklärung gilt für die Website kryptodeklara.ch in allen drei Sprachfassungen (deutsch, französisch, englisch).</p>"
             "<p>Soweit Personen in der EU/im EWR die Website nutzen, gelten ergänzend die Bestimmungen der Datenschutz-Grundverordnung (DSGVO). Das Angebot richtet sich an Personen mit Steuerpflicht in der Schweiz.</p>"),
            ("2. Welche Daten wir bearbeiten",
             "<ul>"
             "<li><strong>Wartelisten-Anmeldung:</strong> Wenn du dich für den Frühzugang einträgst, bearbeiten wir deine E-Mail-Adresse sowie deine freiwilligen Angaben: gewählte Preisstufe, Interesse an der Nachdeklaration früherer Steuerjahre (Selbstanzeige) und die Sprache der Seite. Die Angabe ist freiwillig; ohne E-Mail-Adresse ist eine Anmeldung technisch nicht möglich.</li>"
             "<li><strong>Nutzungsstatistiken:</strong> Wir betreiben unsere Reichweitenmessung selbst, auf eigener Infrastruktur in der Schweiz. Es kommt kein externer Analysedienst zum Einsatz. Pro Aufruf erfassen wir: den aufgerufenen Pfad (ohne Query-Parameter), die Herkunfts-URL (nur Domain und Pfad), die Sprache, allfällige Kampagnen-Parameter (utm_source, utm_medium, utm_campaign) sowie das ausgelöste Ereignis (Seitenaufruf, Anmeldung, Klick auf «Frühzugang», Wahl einer Preisstufe).</li>"
             "<li><strong>Keine Cookies, keine Speicherung von IP-Adressen:</strong> Wir setzen keine Cookies und speichern keine IP-Adressen. Um wiederkehrende Aufrufe innerhalb desselben Tages zu erkennen, bilden wir einen nicht umkehrbaren Hashwert aus IP-Adresse, Browserkennung und einem zufälligen Tagesschlüssel. Dieser Schlüssel besteht ausschliesslich im Arbeitsspeicher, wird täglich um 00:00&nbsp;UTC neu erzeugt und nie gespeichert. Die Hashwerte sind dadurch über den Tag hinaus nicht verknüpfbar und lassen sich nicht auf eine bestimmte Person zurückrechnen. Weil weder Cookies gesetzt noch Personendaten auf deinem Gerät gespeichert oder ausgelesen werden, ist für diese Website keine Einwilligung erforderlich.</li>"
             "<li><strong>Server-Logdaten der Dienstleister:</strong> Beim Abruf der Website fallen bei unseren Hosting- und Netzwerkdienstleistern technisch bedingte Protokolldaten an (u.&nbsp;a. IP-Adresse, Zeitpunkt, abgerufene Ressource, Browserkennung). Auf diese Daten haben wir keinen direkten Zugriff; sie werden von den Anbietern zur Bereitstellung und Absicherung des Dienstes bearbeitet.</li>"
             "</ul>"),
            ("3. Zweck und Rechtsgrundlage",
             "<p>Deine E-Mail-Adresse verwenden wir ausschliesslich, um dich über den Launch von Deklara und deinen Early-Bird-Zugang zu informieren. Die Nutzungsstatistiken dienen dazu, den Bedarf für das Produkt zu prüfen sowie die Website und ihre Sprachfassungen zu verbessern.</p>"
             "<p>Die Bearbeitung erfolgt gestützt auf deine Einwilligung (Eintragung in die Warteliste) sowie auf unser überwiegendes berechtigtes Interesse an einer datensparsamen Reichweitenmessung. Es findet weder ein Verkauf noch eine Weitergabe an Dritte zu Werbezwecken statt. Es werden keine Persönlichkeitsprofile erstellt.</p>"),
            ("4. Auftragsbearbeiter und Bekanntgabe ins Ausland",
             "<ul>"
             "<li><strong>Formularverarbeitung und Datenhaltung:</strong> Deine Anmeldung wird nicht an einen externen Formulardienst übermittelt. Sie geht direkt an unseren eigenen Server in der Schweiz und wird dort in einer lokalen Datenbank gespeichert.</li>"
             "<li><strong>Hosting der Website:</strong> Die statischen Seiten werden über GitHub Pages (GitHub&nbsp;Inc., USA, Microsoft-Konzern) ausgeliefert.</li>"
             "<li><strong>Netzwerkzugang:</strong> Die Verbindung zu unserem Server läuft über den Tunnel- und DNS-Dienst von Cloudflare,&nbsp;Inc. (USA). Cloudflare bearbeitet dabei Verbindungsdaten als Transportdienstleister.</li>"
             "<li><strong>Schriftarten:</strong> Diese Seite lädt Schriftarten von Google Fonts (Google Ireland&nbsp;Ltd., Irland). Dabei wird deine IP-Adresse an Google übermittelt.</li>"
             "</ul>"
             "<p>Einzelne dieser Anbieter haben ihren Sitz in den USA. Die Bekanntgabe stützt sich auf die Standardvertragsklauseln der EU-Kommission bzw. auf die Zertifizierung nach dem Swiss&#8209;U.S. Data Privacy Framework. Die eigentlichen Wartelisten- und Statistikdaten verlassen die Schweiz nicht.</p>"),
            ("5. Aufbewahrung und Löschung",
             "<p>Wartelisten-Daten (E-Mail-Adresse und freiwillige Angaben) bewahren wir bis zum Launch bzw. bis zu deinem Widerruf auf. Du kannst dich jederzeit formlos per E-Mail an die oben genannte Adresse abmelden; deine Daten werden dann gelöscht.</p>"
             "<p>Die pseudonymen Nutzungsstatistiken werden automatisch nach 400&nbsp;Tagen gelöscht. Sicherungskopien der Datenbank werden 14&nbsp;Tage aufbewahrt und danach ebenfalls gelöscht. Nach einer Löschung auf deinen Wunsch hin können deine Daten daher noch bis zu 14&nbsp;Tage in Sicherungskopien enthalten sein.</p>"),
            ("6. Datensicherheit",
             "<p>Die Übertragung erfolgt ausschliesslich verschlüsselt (TLS/HTTPS). Die Datenbank liegt auf einem Server in der Schweiz, der nicht direkt aus dem Internet erreichbar ist, sondern nur über eine ausgehende, authentifizierte Tunnelverbindung. Der Zugriff auf die gespeicherten Daten ist auf die verantwortliche Person beschränkt und durch ein Zugangstoken geschützt. Wir bearbeiten nur die Daten, die für den genannten Zweck erforderlich sind.</p>"),
            ("7. Keine automatisierte Einzelentscheidung",
             "<p>Es findet keine automatisierte Einzelentscheidung im Sinne von Art.&nbsp;21&nbsp;DSG statt, die für dich mit einer Rechtsfolge verbunden wäre oder dich erheblich beeinträchtigen würde.</p>"),
            ("8. Deine Rechte",
             "<p>Du hast im Rahmen des anwendbaren Rechts insbesondere das Recht auf Auskunft über die zu deiner Person bearbeiteten Daten, auf Berichtigung unrichtiger Daten, auf Löschung oder Vernichtung, auf Herausgabe oder Übertragung deiner Daten (Datenportabilität) sowie das Recht, gegen die Bearbeitung Widerspruch zu erheben oder eine erteilte Einwilligung jederzeit zu widerrufen. Der Widerruf gilt ab dem Zeitpunkt der Erklärung und berührt die Rechtmässigkeit der bis dahin erfolgten Bearbeitung nicht.</p>"
             "<p>Wende dich dazu an die oben genannte Kontaktadresse. Zur Bearbeitung deines Anliegens kann eine Identifikation nötig sein.</p>"
             "<p>Du hast zudem das Recht, dich beim <strong>Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB)</strong>, Feldeggweg&nbsp;1, 3003&nbsp;Bern, zu beschweren. Personen mit Wohnsitz in der EU/im EWR können sich an die für sie zuständige Datenschutz-Aufsichtsbehörde wenden.</p>"),
            ("9. Änderungen",
             "<p>Wir können diese Datenschutzerklärung bei Bedarf anpassen. Es gilt die jeweils auf dieser Seite veröffentlichte Fassung.</p>"),
        ],
    },
    "fr": {
        "title": "Politique de confidentialité",
        "sections": [
            ("1. Responsable du traitement", "ADDRESS"
             "<p>Le responsable du traitement au sens de la loi fédérale suisse sur la protection des données (LPD) est la personne mentionnée ci-dessus. La présente politique s'applique au site kryptodeklara.ch dans ses trois versions linguistiques (allemand, français, anglais).</p>"
             "<p>Dans la mesure où des personnes situées dans l'UE/l'EEE utilisent le site, les dispositions du règlement général sur la protection des données (RGPD) s'appliquent en complément. L'offre s'adresse aux personnes assujetties à l'impôt en Suisse.</p>"),
            ("2. Quelles données nous traitons",
             "<ul>"
             "<li><strong>Inscription à la liste d'attente :</strong> lorsque vous vous inscrivez pour l'accès anticipé, nous traitons votre adresse e-mail ainsi que vos indications facultatives : formule tarifaire choisie, intérêt pour la régularisation d'années fiscales antérieures (dénonciation spontanée) et langue de la page. Ces indications sont facultatives ; sans adresse e-mail, l'inscription est techniquement impossible.</li>"
             "<li><strong>Statistiques d'utilisation :</strong> nous assurons nous-mêmes la mesure d'audience, sur notre propre infrastructure en Suisse. Aucun service d'analyse externe n'est utilisé. Pour chaque consultation, nous enregistrons : le chemin appelé (sans paramètres de requête), l'URL de provenance (domaine et chemin uniquement), la langue, les éventuels paramètres de campagne (utm_source, utm_medium, utm_campaign) ainsi que l'événement déclenché (consultation de page, inscription, clic sur « accès anticipé », choix d'une formule tarifaire).</li>"
             "<li><strong>Aucun cookie, aucune conservation d'adresses IP :</strong> nous ne déposons aucun cookie et ne conservons aucune adresse IP. Afin de reconnaître les consultations répétées au cours d'une même journée, nous calculons une empreinte non réversible à partir de l'adresse IP, de l'identifiant du navigateur et d'une clé quotidienne aléatoire. Cette clé n'existe qu'en mémoire vive, est régénérée chaque jour à 00h00&nbsp;UTC et n'est jamais enregistrée. Les empreintes ne sont donc pas rattachables au-delà de la journée et ne permettent pas de remonter à une personne déterminée. Comme aucun cookie n'est déposé et qu'aucune donnée personnelle n'est stockée ou lue sur votre appareil, aucun consentement n'est requis pour ce site.</li>"
             "<li><strong>Journaux serveur des prestataires :</strong> lors de la consultation du site, des données de journalisation techniques sont générées chez nos prestataires d'hébergement et de réseau (notamment adresse IP, horodatage, ressource appelée, identifiant du navigateur). Nous n'avons pas d'accès direct à ces données ; elles sont traitées par les prestataires aux fins de fourniture et de sécurisation du service.</li>"
             "</ul>"),
            ("3. Finalité et base légale",
             "<p>Nous utilisons votre adresse e-mail exclusivement pour vous informer du lancement de Deklara et de votre accès early-bird. Les statistiques d'utilisation servent à vérifier le besoin pour le produit ainsi qu'à améliorer le site et ses versions linguistiques.</p>"
             "<p>Le traitement repose sur votre consentement (inscription à la liste d'attente) ainsi que sur notre intérêt légitime prépondérant à une mesure d'audience respectueuse des données. Il n'y a ni vente ni transmission à des tiers à des fins publicitaires. Aucun profil de la personnalité n'est établi.</p>"),
            ("4. Sous-traitants et communication à l'étranger",
             "<ul>"
             "<li><strong>Traitement du formulaire et conservation des données :</strong> votre inscription n'est pas transmise à un service de formulaire externe. Elle parvient directement à notre propre serveur en Suisse, où elle est enregistrée dans une base de données locale.</li>"
             "<li><strong>Hébergement du site :</strong> les pages statiques sont diffusées via GitHub Pages (GitHub&nbsp;Inc., États-Unis, groupe Microsoft).</li>"
             "<li><strong>Accès réseau :</strong> la connexion à notre serveur passe par le service de tunnel et de DNS de Cloudflare,&nbsp;Inc. (États-Unis). Cloudflare traite à cette occasion les données de connexion en qualité de prestataire de transport.</li>"
             "<li><strong>Polices de caractères :</strong> cette page charge des polices depuis Google Fonts (Google Ireland&nbsp;Ltd., Irlande). Votre adresse IP est transmise à Google à cette occasion.</li>"
             "</ul>"
             "<p>Certains de ces prestataires ont leur siège aux États-Unis. La communication se fonde sur les clauses contractuelles types de la Commission européenne ou sur la certification au titre du Swiss&#8209;U.S. Data Privacy Framework. Les données de la liste d'attente et les statistiques elles-mêmes ne quittent pas la Suisse.</p>"),
            ("5. Conservation et suppression",
             "<p>Nous conservons les données de la liste d'attente (adresse e-mail et indications facultatives) jusqu'au lancement ou jusqu'à votre révocation. Vous pouvez vous désinscrire à tout moment, sans formalité, par e-mail à l'adresse indiquée ci-dessus ; vos données sont alors supprimées.</p>"
             "<p>Les statistiques d'utilisation pseudonymisées sont automatiquement supprimées après 400&nbsp;jours. Les copies de sauvegarde de la base de données sont conservées 14&nbsp;jours puis supprimées. Après une suppression à votre demande, vos données peuvent donc encore figurer jusqu'à 14&nbsp;jours dans des copies de sauvegarde.</p>"),
            ("6. Sécurité des données",
             "<p>La transmission est exclusivement chiffrée (TLS/HTTPS). La base de données se trouve sur un serveur situé en Suisse, qui n'est pas directement accessible depuis Internet mais uniquement via une connexion tunnel sortante et authentifiée. L'accès aux données enregistrées est limité au responsable du traitement et protégé par un jeton d'accès. Nous ne traitons que les données nécessaires à la finalité indiquée.</p>"),
            ("7. Absence de décision individuelle automatisée",
             "<p>Aucune décision individuelle automatisée au sens de l'art.&nbsp;21&nbsp;LPD, qui produirait des effets juridiques à votre égard ou vous affecterait de manière significative, n'est prise.</p>"),
            ("8. Vos droits",
             "<p>Dans les limites du droit applicable, vous disposez notamment du droit d'accès aux données vous concernant, du droit de rectification des données inexactes, du droit à la suppression ou à la destruction, du droit à la remise ou au transfert de vos données (portabilité), ainsi que du droit de vous opposer au traitement ou de révoquer à tout moment un consentement donné. La révocation vaut à compter de sa déclaration et n'affecte pas la licéité du traitement effectué jusque-là.</p>"
             "<p>Adressez-vous pour cela à l'adresse de contact indiquée ci-dessus. Une identification peut être nécessaire au traitement de votre demande.</p>"
             "<p>Vous avez en outre le droit de déposer une réclamation auprès du <strong>Préposé fédéral à la protection des données et à la transparence (PFPDT)</strong>, Feldeggweg&nbsp;1, 3003&nbsp;Berne. Les personnes domiciliées dans l'UE/l'EEE peuvent s'adresser à l'autorité de contrôle compétente pour elles.</p>"),
            ("9. Modifications",
             "<p>Nous pouvons adapter la présente politique de confidentialité si nécessaire. La version publiée sur cette page fait foi.</p>"),
        ],
    },
    "en": {
        "title": "Privacy policy",
        "sections": [
            ("1. Controller", "ADDRESS"
             "<p>The controller within the meaning of the Swiss Federal Act on Data Protection (FADP) is the person named above. This policy applies to the website kryptodeklara.ch in all three language versions (German, French, English).</p>"
             "<p>Where individuals in the EU/EEA use the website, the provisions of the General Data Protection Regulation (GDPR) apply in addition. The service is aimed at people with a tax liability in Switzerland.</p>"),
            ("2. What data we process",
             "<ul>"
             "<li><strong>Waiting-list signup:</strong> when you sign up for early access, we process your email address together with your optional details: the pricing tier you selected, your interest in declaring previous tax years retrospectively (voluntary disclosure), and the language of the page. These details are optional; without an email address, signing up is technically impossible.</li>"
             "<li><strong>Usage statistics:</strong> we run our own audience measurement, on our own infrastructure in Switzerland. No external analytics service is used. For each visit we record: the path requested (without query parameters), the referring URL (domain and path only), the language, any campaign parameters (utm_source, utm_medium, utm_campaign), and the event triggered (page view, signup, click on \"early access\", choice of a pricing tier).</li>"
             "<li><strong>No cookies, no storage of IP addresses:</strong> we set no cookies and store no IP addresses. To recognise repeat visits within the same day, we compute an irreversible hash from the IP address, the browser identifier and a random daily key. That key exists only in memory, is regenerated every day at 00:00&nbsp;UTC and is never stored. The hashes therefore cannot be linked beyond a single day and cannot be traced back to an identified person. Because no cookies are set and no personal data is stored on or read from your device, no consent is required for this website.</li>"
             "<li><strong>Service providers' server logs:</strong> when the website is accessed, technical log data is generated at our hosting and network providers (including IP address, timestamp, resource requested, browser identifier). We have no direct access to this data; it is processed by those providers in order to deliver and secure the service.</li>"
             "</ul>"),
            ("3. Purpose and legal basis",
             "<p>We use your email address solely to inform you about the launch of Deklara and your early-bird access. The usage statistics serve to test demand for the product and to improve the website and its language versions.</p>"
             "<p>Processing is based on your consent (signing up to the waiting list) and on our overriding legitimate interest in privacy-preserving audience measurement. There is no sale and no disclosure to third parties for advertising purposes. No personality profiles are created.</p>"),
            ("4. Processors and disclosure abroad",
             "<ul>"
             "<li><strong>Form handling and data storage:</strong> your signup is not transmitted to an external form service. It goes directly to our own server in Switzerland and is stored there in a local database.</li>"
             "<li><strong>Website hosting:</strong> the static pages are delivered via GitHub Pages (GitHub&nbsp;Inc., USA, Microsoft group).</li>"
             "<li><strong>Network access:</strong> the connection to our server runs through the tunnel and DNS service of Cloudflare,&nbsp;Inc. (USA). Cloudflare processes connection data in the role of a transport provider.</li>"
             "<li><strong>Fonts:</strong> this page loads fonts from Google Fonts (Google Ireland&nbsp;Ltd., Ireland). Your IP address is transmitted to Google in the process.</li>"
             "</ul>"
             "<p>Some of these providers are based in the USA. Disclosure is based on the European Commission's standard contractual clauses or on certification under the Swiss&#8209;U.S. Data Privacy Framework. The waiting-list and statistics data themselves do not leave Switzerland.</p>"),
            ("5. Retention and deletion",
             "<p>We keep waiting-list data (email address and optional details) until launch or until you withdraw. You can unsubscribe at any time, informally, by email to the address given above; your data is then deleted.</p>"
             "<p>The pseudonymous usage statistics are deleted automatically after 400&nbsp;days. Database backups are kept for 14&nbsp;days and then deleted as well. Following a deletion at your request, your data may therefore still be contained in backups for up to 14&nbsp;days.</p>"),
            ("6. Data security",
             "<p>Transmission is encrypted throughout (TLS/HTTPS). The database sits on a server in Switzerland which is not directly reachable from the internet, but only through an outbound, authenticated tunnel connection. Access to the stored data is limited to the controller and protected by an access token. We process only the data required for the stated purpose.</p>"),
            ("7. No automated individual decision-making",
             "<p>No automated individual decision within the meaning of Art.&nbsp;21&nbsp;FADP takes place that would produce legal effects concerning you or significantly affect you.</p>"),
            ("8. Your rights",
             "<p>Within the limits of applicable law, you have in particular the right to information about the data processed about you, to rectification of inaccurate data, to deletion or destruction, to release or transfer of your data (data portability), as well as the right to object to processing or to withdraw consent at any time. Withdrawal takes effect from the moment it is declared and does not affect the lawfulness of processing carried out up to that point.</p>"
             "<p>Please contact us at the address given above. Identification may be required in order to handle your request.</p>"
             "<p>You also have the right to lodge a complaint with the <strong>Federal Data Protection and Information Commissioner (FDPIC)</strong>, Feldeggweg&nbsp;1, 3003&nbsp;Bern, Switzerland. Individuals resident in the EU/EEA may contact their competent supervisory authority.</p>"),
            ("9. Changes",
             "<p>We may adapt this privacy policy as required. The version published on this page applies.</p>"),
        ],
    },
}


def lang_nav(current_lang, kind):
    """Language switcher pointing at the same document in each language."""
    parts = []
    for lang in ("de", "fr", "en"):
        label = lang.upper()
        if lang == current_lang:
            parts.append(f'<span class="active">{label}</span>')
        else:
            target = LOCALES[lang]["dir"] + FILENAMES[lang][kind]
            # Every legal page lives either at the root or one level down.
            prefix = "" if LOCALES[current_lang]["dir"] == "" else "../"
            parts.append(f'<a href="{prefix}{target}" lang="{lang}">{label}</a>')
    return " · ".join(parts)


def render(kind, lang):
    source = IMPRINT if kind == "imprint" else PRIVACY
    data = source[lang]
    loc = LOCALES[lang]
    ui = UI[lang]

    body = ""
    for heading, html in data["sections"]:
        html = html.replace("ADDRESS", address_block(lang), 1)
        body += f"    <h2>{heading}</h2>\n"
        # Section bodies are single-line HTML strings; indent them consistently.
        if html.lstrip().startswith("<address>"):
            body += html
        else:
            body += "    " + html + "\n"
        body += "\n"

    other = "privacy" if kind == "imprint" else "imprint"
    return PAGE.format(
        html_lang=loc["html_lang"],
        title=data["title"],
        root=loc["root"],
        home=loc["home"],
        style=STYLE,
        stand=ui["stand"],
        lang_label=ui["lang_label"],
        lang_nav=lang_nav(lang, kind),
        back=ui["back"],
        other_href=FILENAMES[lang][other],
        other_label=ui[other],
        body=body,
    )


def main():
    written = []
    for lang in ("de", "fr", "en"):
        for kind in ("imprint", "privacy"):
            path = WEB / LOCALES[lang]["dir"] / FILENAMES[lang][kind]
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(render(kind, lang), encoding="utf-8")
            written.append(str(path.relative_to(WEB)))

    # Structural parity check: same number of sections in every language.
    for source, name in ((IMPRINT, "imprint"), (PRIVACY, "privacy")):
        counts = {lang: len(source[lang]["sections"]) for lang in source}
        if len(set(counts.values())) != 1:
            raise SystemExit(f"section count mismatch in {name}: {counts}")

    for path in written:
        print("wrote", path)
    print(f"\n{len(written)} pages, section counts match across languages")


if __name__ == "__main__":
    main()
