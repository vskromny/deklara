import { createHash, randomBytes } from 'node:crypto';

/**
 * Cookieless visitor identity.
 *
 * A visitor is identified by SHA-256(daily_salt + ip + user_agent). The salt is
 * random, held only in memory, and replaced when the UTC day turns — so the
 * hashes stop being linkable across days and there is nothing on disk that maps
 * back to an IP. That is what keeps this out of consent-banner territory under
 * revDSG/GDPR: no cookie, no identifier that outlives the day, no raw IP stored.
 */

let salt = randomBytes(32);
let saltDay = utcDay();

function utcDay() {
  return new Date().toISOString().slice(0, 10);
}

function currentSalt() {
  const today = utcDay();
  if (today !== saltDay) {
    salt = randomBytes(32);
    saltDay = today;
  }
  return salt;
}

export function visitorHash(ip, userAgent) {
  return createHash('sha256')
    .update(currentSalt())
    .update('|')
    .update(String(ip ?? ''))
    .update('|')
    .update(String(userAgent ?? ''))
    .digest('hex');
}

/**
 * The client IP. Behind Cloudflare Tunnel the real address arrives in
 * CF-Connecting-IP; we never trust X-Forwarded-For from the open internet
 * because anyone can set it.
 */
export function clientIp(req) {
  return (
    req.headers['cf-connecting-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/** Exposed for tests — forces a salt rotation. */
export function _rotateSaltForTest() {
  salt = randomBytes(32);
  saltDay = utcDay();
}
