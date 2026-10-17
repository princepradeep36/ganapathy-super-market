import { db } from '@/lib/db';
import { adminAccount, adminEmail } from '@/lib/admin';
import { randomToken, sha256 } from '@/lib/auth';
import { mailConfig, mailEnabled, sendAdminReset } from '@/lib/email';
import { clientIp, rateLimit } from '@/lib/ratelimit';

const RESET_MINUTES = 60;

/** "o•••r@g•••.com": enough to recognise the inbox without giving it away. */
function mask(email: string) {
  const [user, domain = ''] = email.split('@');
  const dot = domain.lastIndexOf('.');
  const host = dot > 0 ? domain.slice(0, dot) : domain;
  const hide = (s: string) => (s.length <= 2 ? s[0] + '•••' : s[0] + '•••' + s[s.length - 1]);
  return `${hide(user)}@${hide(host)}${dot > 0 ? domain.slice(dot) : ''}`;
}

/**
 * Forgot password: { email } → reset link to the admin address if it matches.
 * Forgot sign-in e-mail: { remind: true } → sign-in e-mail + reset link to the admin
 * address (and the store's order inbox, if different). Mail only ever goes to addresses
 * set on the server, never to one typed in the form.
 */
export async function POST(r: Request) {
  if (!rateLimit('forgot:' + clientIp(r), 5, 60 * 60_000))
    return Response.json({ error: 'Too many attempts. Wait an hour and try again.' }, { status: 429 });
  if (!mailEnabled() || !adminEmail())
    return Response.json({ error: 'E-mail sending is not set up for this shop, so a reset link cannot be sent. Ask whoever runs the server to set it up.' }, { status: 503 });
  const d = await r.json().catch(() => ({}));
  const remind = d.remind === true;
  const email = String(d.email || '').trim().toLowerCase();
  // For a typed address: same answer whether or not it matches, so it can't be guessed.
  if (!remind && email !== adminEmail()) return Response.json({ ok: true });

  await adminAccount();
  const token = randomToken();
  await db.adminAccount.update({ where: { id: 'admin' }, data: { resetTokenHash: sha256(token), resetExpires: new Date(Date.now() + RESET_MINUTES * 60_000) } });
  const to = remind ? [...new Set([adminEmail(), mailConfig().storeInbox.toLowerCase()].filter(Boolean))] : [adminEmail()];
  for (const addr of to) await sendAdminReset(addr, token, RESET_MINUTES, remind ? adminEmail() : undefined).catch((e) => console.error('[email] reset', e?.message || e));
  return Response.json(remind ? { ok: true, sentTo: to.map(mask) } : { ok: true });
}
