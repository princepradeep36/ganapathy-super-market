import { db } from '@/lib/db';
import { CODE_MINUTES, codeHash, newCode, normEmail, validEmail } from '@/lib/customer';
import { mailEnabled, sendLoginCode } from '@/lib/email';
import { clientIp, rateLimit } from '@/lib/ratelimit';

/** Step 1 of e-mail login / sign-up: send a 6-digit code to { email }. */
export async function POST(r: Request) {
  if (!rateLimit('logincode:' + clientIp(r), 6, 15 * 60_000)) return Response.json({ error: 'Too many attempts, try again later' }, { status: 429 });
  const email = normEmail((await r.json().catch(() => ({}))).email);
  if (!validEmail(email)) return Response.json({ error: 'Please enter a valid e-mail' }, { status: 400 });
  if (!mailEnabled()) return Response.json({ error: 'Login by e-mail is not available right now. Please call the store.' }, { status: 503 });
  const recent = await db.loginCode.count({ where: { email, createdAt: { gt: new Date(Date.now() - 15 * 60_000) } } });
  if (recent >= 3) return Response.json({ error: 'Too many attempts, try again later' }, { status: 429 });

  const code = newCode();
  await db.loginCode.deleteMany({ where: { expires: { lt: new Date() } } });
  const row = await db.loginCode.create({ data: { email, codeHash: codeHash(email, code), expires: new Date(Date.now() + CODE_MINUTES * 60_000) } });
  try {
    await sendLoginCode(email, code, CODE_MINUTES);
  } catch (e: any) {
    console.error('[email] login code', e?.message || e);
    await db.loginCode.delete({ where: { id: row.id } });
    return Response.json({ error: 'Could not send the e-mail. Please try again.' }, { status: 502 });
  }
  return Response.json({ ok: true });
}
