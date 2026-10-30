import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { STATE_COOKIE, oauthProfile, providers, setSession, upsertCustomer, type Provider } from '@/lib/customer';
import { siteUrl } from '@/lib/config';

/** Google / Facebook send the shopper back here with a one-time code. */
export async function GET(r: Request, { params }: { params: Promise<{ provider: string }> }) {
  const p = (await params).provider as Provider;
  const q = new URL(r.url).searchParams;
  const fail = (msg: string) => NextResponse.redirect(siteUrl() + '/login?error=' + encodeURIComponent(msg));
  if (!(p in providers()) || !providers()[p]) return fail('Login failed, please try again');
  const state = (await cookies()).get(STATE_COOKIE)?.value;
  // Cancelled on the Google/Facebook page: back to the login page without a scary message.
  if (q.get('error')) return NextResponse.redirect(siteUrl() + '/login');
  if (!state || state !== q.get('state') || !q.get('code')) return fail('Login failed, please try again');
  try {
    const u = await oauthProfile(p, q.get('code')!);
    const idField = p === 'google' ? 'googleId' : 'facebookId';
    // Same Google/Facebook account but a new e-mail there: free the id from the old row first.
    await db.customer.updateMany({ where: { [idField]: u.id, NOT: { email: u.email } }, data: { [idField]: null } });
    const c = await upsertCustomer(u.email, { name: u.name, [idField]: u.id });
    const res = setSession(NextResponse.redirect(siteUrl() + '/orders'), c);
    res.cookies.delete({ name: STATE_COOKIE, path: '/api/account/oauth' });
    return res;
  } catch (e: any) {
    console.error('[login]', p, e?.message || e);
    return fail(e?.message?.includes('e-mail') ? e.message : 'Login failed, please try again');
  }
}
