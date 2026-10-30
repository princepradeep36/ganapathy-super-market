import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { STATE_COOKIE, authorizeUrl, providers, stateCookieOptions, type Provider } from '@/lib/customer';
import { siteUrl } from '@/lib/config';

/** Start "Log in with Google / Facebook". */
export async function GET(_r: Request, { params }: { params: Promise<{ provider: string }> }) {
  const p = (await params).provider as Provider;
  if (!(p in providers()) || !providers()[p]) return NextResponse.redirect(siteUrl() + '/login');
  const state = crypto.randomBytes(16).toString('base64url');
  const res = NextResponse.redirect(authorizeUrl(p, state));
  res.cookies.set(STATE_COOKIE, state, stateCookieOptions());
  return res;
}
