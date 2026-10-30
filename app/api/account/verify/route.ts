import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { codeHash, normEmail, setSession, upsertCustomer } from '@/lib/customer';
import { clientIp, rateLimit } from '@/lib/ratelimit';

const MAX_TRIES = 5;

/** Step 2 of e-mail login: { email, code } → logged in (account created on first login). */
export async function POST(r: Request) {
  if (!rateLimit('loginverify:' + clientIp(r), 15, 15 * 60_000)) return Response.json({ error: 'Too many attempts, try again later' }, { status: 429 });
  const d = await r.json().catch(() => ({}));
  const email = normEmail(d.email);
  const code = String(d.code || '').replace(/\D/g, '');
  const row = await db.loginCode.findFirst({ where: { email, expires: { gt: new Date() } }, orderBy: { createdAt: 'desc' } });
  if (!row || row.attempts >= MAX_TRIES) return Response.json({ error: 'The code has expired. Ask for a new one.' }, { status: 400 });
  const a = Buffer.from(row.codeHash), b = Buffer.from(codeHash(email, code));
  if (code.length !== 6 || !crypto.timingSafeEqual(a, b)) {
    await db.loginCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    return Response.json({ error: 'Wrong code' }, { status: 400 });
  }
  await db.loginCode.deleteMany({ where: { email } });
  const c = await upsertCustomer(email);
  return setSession(NextResponse.json({ ok: true }), c);
}
