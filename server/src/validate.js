/**
 * Input validation. Everything crossing the wire is untrusted: we normalise,
 * bound the size of every field, and drop anything unrecognised rather than
 * storing it.
 */

// Deliberately not RFC 5322 — that grammar accepts addresses no mail server
// would route. This covers the shapes real signups actually take.
const EMAIL = /^[^\s@,;:<>()[\]\\"]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

const EVENT_NAME = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

export const MAX_PROP_KEYS = 12;
export const MAX_PROP_LEN = 200;
export const MAX_EMAIL_LEN = 254;
export const MAX_TEXT_LEN = 500;

export function normaliseEmail(input) {
  if (typeof input !== 'string') return null;
  const email = input.trim().toLowerCase();
  if (!email || email.length > MAX_EMAIL_LEN) return null;
  if (!EMAIL.test(email)) return null;
  // A trailing single-label TLD like "a@b.c" is almost always a typo.
  const tld = email.slice(email.lastIndexOf('.') + 1);
  if (tld.length < 2) return null;
  return email;
}

export function isValidEventName(name) {
  return typeof name === 'string' && EVENT_NAME.test(name);
}

/** Clamp free text to a sane length, or return null when absent. */
export function text(value, max = MAX_TEXT_LEN) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

/**
 * Props are a flat bag of short scalars. Nested objects, arrays and oversized
 * values are dropped rather than rejected — a malformed prop should never cost
 * us the underlying signup or pageview.
 */
export function cleanProps(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    if (Object.keys(out).length >= MAX_PROP_KEYS) break;
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,31}$/.test(key)) continue;
    if (value === null || value === undefined) continue;
    if (typeof value === 'object') continue;
    out[key] = String(value).slice(0, MAX_PROP_LEN);
  }
  return out;
}

/** Keep only the path of a URL — never the query string, which can carry PII. */
export function safePath(input) {
  const raw = text(input, 2048);
  if (!raw) return null;
  try {
    const url = new URL(raw, 'https://placeholder.invalid');
    return url.pathname.slice(0, 255);
  } catch {
    return raw.split('?')[0].slice(0, 255);
  }
}

/** Referrers are stored as origin + path only, for the same reason. */
export function safeReferrer(input) {
  const raw = text(input, 2048);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return `${url.origin}${url.pathname}`.slice(0, 255);
  } catch {
    return null;
  }
}
