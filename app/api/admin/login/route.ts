import { checkAdminLogin, signedIn } from '@/lib/admin';
import { clientIp, rateLimit } from '@/lib/ratelimit';

export async function POST(r: Request) {
  if (!rateLimit('login:' + clientIp(r), 8, 15 * 60_000))
    return Response.json({ error: 'Too many attempts. Wait 15 minutes and try again.' }, { status: 429 });
  const d = await r.json().catch(() => ({}));
  const acc = await checkAdminLogin(String(d.email || ''), String(d.password || ''));
  if (!acc) return Response.json({ error: 'Wrong email or password' }, { status: 401 });
  return signedIn(acc.passwordVersion);
}
