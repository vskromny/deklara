import { resolveMx } from 'node:dns/promises';

/**
 * Spam and typo defences for lead capture.
 *
 * Everything here fails open: a false positive costs a real signup, which is
 * far more expensive than storing the occasional junk row. The only hard
 * rejections are the honeypot and the submit-too-fast check, both of which a
 * human physically cannot trigger.
 */

/**
 * Bots fill every field they find. Humans never see these.
 *
 * Several names are accepted so the visible markup can use something a
 * scraper finds plausible ("company") without the server having to know which
 * page it came from. Any of them arriving non-empty means a bot.
 */
const HONEYPOT_FIELDS = ['hp', 'company', 'website', 'fax'];

export function trippedHoneypot(body) {
  if (!body || typeof body !== 'object') return false;
  return HONEYPOT_FIELDS.some((field) => {
    const value = body[field];
    return typeof value === 'string' && value.trim().length > 0;
  });
}

/**
 * `t` is milliseconds between page load and submit, sent by the client. Under
 * ~1.5s means a script, not a person reading a landing page. Missing or absurd
 * values are accepted — an older browser or a blocked timer shouldn't cost a
 * lead.
 */
export function submittedTooFast(body, minMs = 1500) {
  const t = Number(body?.t);
  if (!Number.isFinite(t) || t < 0) return false;
  return t < minMs;
}

// Near-misses for the addresses Swiss signups actually use. Catching these at
// submit time is worth more than any spam filter: a typo'd address is a lead
// silently lost at launch.
const TYPOS = new Map([
  ['gmail.co', 'gmail.com'],
  ['gmail.con', 'gmail.com'],
  ['gmai.com', 'gmail.com'],
  ['gmial.com', 'gmail.com'],
  ['gmail.ch', 'gmail.com'],
  ['hotmial.com', 'hotmail.com'],
  ['hotmail.co', 'hotmail.com'],
  ['outlok.com', 'outlook.com'],
  ['bluewin.com', 'bluewin.ch'],
  ['bluewn.ch', 'bluewin.ch'],
  ['sunrise.com', 'sunrise.ch'],
  ['gmx.com', 'gmx.ch'],
  ['yahoo.co', 'yahoo.com'],
]);

export function suggestDomainFix(email) {
  const domain = email.slice(email.lastIndexOf('@') + 1);
  const fix = TYPOS.get(domain);
  return fix ? email.slice(0, email.lastIndexOf('@') + 1) + fix : null;
}

const mxCache = new Map();
const MX_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * Does the domain accept mail at all? Resolves MX with a short timeout and
 * caches the answer. Returns true on any DNS failure or timeout — we only ever
 * use a definitive "this domain has no MX records" to reject.
 */
export async function domainAcceptsMail(email, timeoutMs = 1500) {
  const domain = email.slice(email.lastIndexOf('@') + 1).toLowerCase();
  const cached = mxCache.get(domain);
  if (cached && Date.now() - cached.at < MX_TTL_MS) return cached.ok;

  let ok = true;
  try {
    const records = await Promise.race([
      resolveMx(domain),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
    // An empty MX set is the one signal we trust enough to act on.
    ok = Array.isArray(records) && records.length > 0;
  } catch (err) {
    // NXDOMAIN means the domain does not exist at all — safe to reject.
    ok = err?.code === 'ENOTFOUND' || err?.code === 'NXDOMAIN' ? false : true;
  }

  mxCache.set(domain, { ok, at: Date.now() });
  return ok;
}

export function _clearMxCacheForTest() {
  mxCache.clear();
}
