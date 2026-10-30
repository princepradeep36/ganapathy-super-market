import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from './db';
import { siteUrl } from './config';

// Customer log-in: e-mail code, Google or Facebook. A signed cookie holds the customer id;
// their orders are the ones placed with the same e-mail.

export const CUSTOMER_COOKIE = 'tk-customer';
const SESSION_DAYS = 30;
const secret = () => process.env.SESSION_SECRET || 'dev-only-secret-change-me';
const sign = (body: string) => crypto.createHmac('sha256', secret()).update('customer:' + body).digest('base64url');
const secure = () => process.env.NODE_ENV === 'production' && process.env.INSECURE_COOKIES !== '1';

export const normEmail = (s: unknown) => String(s || '').trim().toLowerCase();
export const validEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 200;

function token(id: string, version: number) {
  const body = `${id}.${version}.${Date.now() + SESSION_DAYS * 86400_000}`;
  return body + '.' + sign(body);
}

/** The logged-in customer, or null. */
export async function currentCustomer() {
  const t = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!t) return null;
  const parts = t.split('.');
  if (parts.length !== 4) return null;
  const [id, version, expires, sig] = parts;
  const a = Buffer.from(sig), b = Buffer.from(sign(`${id}.${version}.${expires}`));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b) || Number(expires) < Date.now()) return null;
  const c = await db.customer.findUnique({ where: { id } });
  return c && c.sessionVersion === Number(version) ? c : null;
}

/** Find or create the customer for a verified e-mail and update their name / social ids. */
export async function upsertCustomer(email: string, extra: { name?: string | null; googleId?: string; facebookId?: string } = {}) {
  const data = { lastLoginAt: new Date(), ...(extra.googleId && { googleId: extra.googleId }), ...(extra.facebookId && { facebookId: extra.facebookId }) };
  return db.customer.upsert({
    where: { email },
    update: { ...data, ...(extra.name && { name: extra.name }) },
    create: { email, name: extra.name || null, ...data },
  });
}

export function setSession(res: NextResponse, c: { id: string; sessionVersion: number }) {
  res.cookies.set(CUSTOMER_COOKIE, token(c.id, c.sessionVersion), { httpOnly: true, sameSite: 'lax', secure: secure(), maxAge: SESSION_DAYS * 86400, path: '/' });
  return res;
}
export function clearSession(res: NextResponse) {
  res.cookies.set(CUSTOMER_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: secure(), maxAge: 0, path: '/' });
  return res;
}

// ---------- e-mail codes ----------
export const CODE_MINUTES = 15;
export const codeHash = (email: string, code: string) => crypto.createHmac('sha256', secret()).update(`code:${email}:${code}`).digest('hex');
export const newCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

// ---------- Google / Facebook ----------
export type Provider = 'google' | 'facebook';
const env = (k: string) => (process.env[k] || '').trim();
export const providers = () => ({
  google: !!(env('GOOGLE_CLIENT_ID') && env('GOOGLE_CLIENT_SECRET')),
  facebook: !!(env('FACEBOOK_APP_ID') && env('FACEBOOK_APP_SECRET')),
});
export const callbackUrl = (p: Provider) => `${siteUrl()}/api/account/oauth/${p}/callback`;
export const STATE_COOKIE = 'tk-oauth-state';
export const stateCookieOptions = () => ({ httpOnly: true, sameSite: 'lax' as const, secure: secure(), maxAge: 600, path: '/api/account/oauth' });

export function authorizeUrl(p: Provider, state: string) {
  if (p === 'google') {
    const q = new URLSearchParams({ client_id: env('GOOGLE_CLIENT_ID'), redirect_uri: callbackUrl(p), response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account' });
    return 'https://accounts.google.com/o/oauth2/v2/auth?' + q;
  }
  const q = new URLSearchParams({ client_id: env('FACEBOOK_APP_ID'), redirect_uri: callbackUrl(p), response_type: 'code', scope: 'email,public_profile', state });
  return 'https://www.facebook.com/v19.0/dialog/oauth?' + q;
}

/** Exchange the code for the user's verified e-mail. Throws with a customer-facing message. */
export async function oauthProfile(p: Provider, code: string): Promise<{ id: string; email: string; name: string | null }> {
  if (p === 'google') {
    const tok = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: env('GOOGLE_CLIENT_ID'), client_secret: env('GOOGLE_CLIENT_SECRET'), redirect_uri: callbackUrl(p), grant_type: 'authorization_code' }),
    }).then((r) => r.json());
    if (!tok.access_token) throw new Error('Google login failed');
    const u = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { authorization: 'Bearer ' + tok.access_token } }).then((r) => r.json());
    if (!u.sub || !u.email || !u.email_verified) throw new Error('Google did not share a verified e-mail');
    return { id: String(u.sub), email: normEmail(u.email), name: u.name || null };
  }
  const q = new URLSearchParams({ client_id: env('FACEBOOK_APP_ID'), client_secret: env('FACEBOOK_APP_SECRET'), redirect_uri: callbackUrl(p), code });
  const tok = await fetch('https://graph.facebook.com/v19.0/oauth/access_token?' + q).then((r) => r.json());
  if (!tok.access_token) throw new Error('Facebook login failed');
  const u = await fetch('https://graph.facebook.com/me?fields=id,name,email&access_token=' + encodeURIComponent(tok.access_token)).then((r) => r.json());
  if (!u.id) throw new Error('Facebook login failed');
  if (!u.email) throw new Error('Facebook did not share your e-mail. Please log in with e-mail instead.');
  return { id: String(u.id), email: normEmail(u.email), name: u.name || null };
}
