import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { makeToken } from '@/lib/auth';
import { clientIp, rateLimit } from '@/lib/ratelimit';

function same(a: string, b: string) {
  const x = crypto.createHash('sha256').update(a).digest();
  const y = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(x, y) && b.length > 0;
}

export async function POST(r: Request) {
  if (!rateLimit('login:' + clientIp(r), 8, 15 * 60_000))
    return Response.json({ error: 'Too many attempts. Wait 15 minutes and try again.' }, { status: 429 });
  const d = await r.json().catch(() => ({}));
  const ok = same(String(d.email || '').trim().toLowerCase(), (process.env.ADMIN_EMAIL || '').toLowerCase()) && same(String(d.password || ''), process.env.ADMIN_PASSWORD || '');
  if (!ok) return Response.json({ error: 'Wrong email or password' }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set('gsm-admin', makeToken(), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' && process.env.INSECURE_COOKIES !== '1', maxAge: 12 * 3600, path: '/' });
  return res;
}
