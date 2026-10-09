import crypto from 'crypto';

const SESSION_HOURS = 12;
const secret = () => {
  const s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV === 'production') console.warn('[auth] SESSION_SECRET is not set — using an insecure default');
  return s || 'dev-only-secret-change-me';
};
const sign = (body: string) => crypto.createHmac('sha256', secret()).update(body).digest('hex');

export function makeToken() {
  const body = String(Date.now() + SESSION_HOURS * 3600_000);
  return body + '.' + sign(body);
}

export function validToken(t?: string) {
  if (!t) return false;
  const [body, sig] = t.split('.');
  if (!body || !sig || Number(body) < Date.now()) return false;
  const a = Buffer.from(sig), b = Buffer.from(sign(body));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
