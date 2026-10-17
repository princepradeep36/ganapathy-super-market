import crypto from 'crypto';

const SESSION_HOURS = 12;
const secret = () => {
  const s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV === 'production') console.warn('[auth] SESSION_SECRET is not set — using an insecure default');
  return s || 'dev-only-secret-change-me';
};
const sign = (body: string) => crypto.createHmac('sha256', secret()).update(body).digest('hex');

/** Session token: expiry + password version, signed. A password change invalidates older tokens. */
export function makeToken(version: number) {
  const body = `${Date.now() + SESSION_HOURS * 3600_000}-${version}`;
  return body + '.' + sign(body);
}

export function validToken(t: string | undefined, version: number) {
  if (!t) return false;
  const [body, sig] = t.split('.');
  if (!body || !sig) return false;
  const [expires, v] = body.split('-');
  if (Number(expires) < Date.now() || Number(v) !== version) return false;
  const a = Buffer.from(sig), b = Buffer.from(sign(body));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Constant-time compare; an empty expected value never matches. */
export function same(a: string, b: string) {
  const x = crypto.createHash('sha256').update(a).digest();
  const y = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(x, y) && b.length > 0;
}

export function hashPassword(pw: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt:${salt}:${crypto.scryptSync(pw, salt, 64).toString('hex')}`;
}

export function checkHash(pw: string, stored: string) {
  const [kind, salt, hash] = stored.split(':');
  if (kind !== 'scrypt' || !salt || !hash) return false;
  const a = Buffer.from(hash, 'hex'), b = crypto.scryptSync(pw, salt, 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
export const randomToken = () => crypto.randomBytes(32).toString('base64url');
