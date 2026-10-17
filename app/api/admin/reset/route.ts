import { db } from '@/lib/db';
import { adminAccount, signedIn } from '@/lib/admin';
import { hashPassword, sha256 } from '@/lib/auth';
import { clientIp, rateLimit } from '@/lib/ratelimit';

/** Sets a new admin password from a reset link, then signs the admin in. */
export async function POST(r: Request) {
  if (!rateLimit('reset:' + clientIp(r), 10, 60 * 60_000))
    return Response.json({ error: 'Too many attempts. Wait an hour and try again.' }, { status: 429 });
  const d = await r.json().catch(() => ({}));
  const token = String(d.token || ''), password = String(d.password || '');
  if (password.length < 10) return Response.json({ error: 'Use at least 10 characters' }, { status: 400 });
  const acc = await adminAccount();
  const valid = !!token && acc.resetTokenHash === sha256(token) && !!acc.resetExpires && acc.resetExpires > new Date();
  if (!valid) return Response.json({ error: 'This reset link has expired or was already used. Ask for a new one.' }, { status: 400 });
  const updated = await db.adminAccount.update({
    where: { id: 'admin' },
    data: { passwordHash: hashPassword(password), passwordVersion: { increment: 1 }, resetTokenHash: null, resetExpires: null },
  });
  return signedIn(updated.passwordVersion);
}
