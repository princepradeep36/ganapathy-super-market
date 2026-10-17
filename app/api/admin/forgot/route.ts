import { db } from '@/lib/db';
import { adminAccount, adminEmail } from '@/lib/admin';
import { randomToken, sha256 } from '@/lib/auth';
import { mailEnabled, sendAdminReset } from '@/lib/email';
import { clientIp, rateLimit } from '@/lib/ratelimit';

const RESET_MINUTES = 60;

/** E-mails a one-time reset link to the admin address (ADMIN_EMAIL). */
export async function POST(r: Request) {
  if (!rateLimit('forgot:' + clientIp(r), 5, 60 * 60_000))
    return Response.json({ error: 'Too many attempts. Wait an hour and try again.' }, { status: 429 });
  if (!mailEnabled())
    return Response.json({ error: 'E-mail sending is not set up for this shop, so a reset link cannot be sent. Ask whoever runs the server to set it up.' }, { status: 503 });
  const d = await r.json().catch(() => ({}));
  const email = String(d.email || '').trim().toLowerCase();
  // Same answer whether or not the address matches, so the admin e-mail can't be guessed.
  if (email && email === adminEmail()) {
    await adminAccount();
    const token = randomToken();
    await db.adminAccount.update({ where: { id: 'admin' }, data: { resetTokenHash: sha256(token), resetExpires: new Date(Date.now() + RESET_MINUTES * 60_000) } });
    await sendAdminReset(adminEmail(), token, RESET_MINUTES).catch((e) => console.error('[email] reset', e?.message || e));
  }
  return Response.json({ ok: true });
}
