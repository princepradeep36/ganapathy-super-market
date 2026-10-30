import { db } from '@/lib/db';
import { clientIp, rateLimit } from '@/lib/ratelimit';
import { orderNo } from '@/lib/orderNo';

/** Phone as national digits: drop 00 / +46 prefixes and leading zeros so 070…, +4670… and 004670… compare equal. */
function national(s: string) {
  let n = String(s || '').replace(/\D/g, '').replace(/^00/, '');
  if (/^46\d{8,}$/.test(n)) n = n.slice(2);
  return n.replace(/^0+/, '');
}
const samePhone = (a: string, b: string) => {
  const x = national(a);
  return x.length >= 7 && x === national(b);
};

type WithCount = Awaited<ReturnType<typeof db.order.findFirstOrThrow>> & { _count: { items: number } };
const summary = (o: WithCount) => ({ id: o.id, ref: orderNo(o), createdAt: o.createdAt, status: o.status, deliveryMethod: o.deliveryMethod, total: o.total, itemCount: o._count.items });

/** Status of orders remembered on this device (ids are unguessable cuids). */
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get('ids') || '').split(',').filter(Boolean).slice(0, 20);
  const orders = ids.length
    ? await db.order.findMany({ where: { id: { in: ids } }, include: { _count: { select: { items: true } } }, orderBy: { createdAt: 'desc' } })
    : [];
  return Response.json({ orders: orders.map(summary) });
}

/** Open one order by its number + the e-mail or phone used for it. */
export async function POST(req: Request) {
  if (!rateLimit('lookup:' + clientIp(req), 10, 10 * 60_000)) return Response.json({ error: 'Too many attempts, try again later' }, { status: 429 });
  const d = await req.json().catch(() => ({}));
  const contact = String(d.contact ?? d.phone ?? '').trim();
  const isEmail = contact.includes('@');
  if (isEmail ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) : national(contact).length < 7)
    return Response.json({ error: 'Enter the e-mail or mobile number you ordered with' }, { status: 400 });
  const matches = (o: { email: string; phone: string }) => (isEmail ? o.email.trim().toLowerCase() === contact.toLowerCase() : samePhone(o.phone, contact));

  // Listing all of a customer's orders needs a login (see /login); here only one order, by its number.
  const ref = String(d.ref || '').trim().replace(/^#/, '').replace(/\s+/g, '').toLowerCase();
  if (ref.length < 6) return Response.json({ error: 'Enter the 8-digit order number' }, { status: 400 });
  // 8-digit order numbers; older orders can still be found by their letter code.
  const candidates = /^\d{8}$/.test(ref)
    ? await db.order.findMany({ where: { number: Number(ref) }, take: 1 })
    : await db.order.findMany({ where: { id: { endsWith: ref } }, take: 5 });
  const o = candidates.find(matches);
  if (!o) return Response.json({ error: 'No order matches that number and e-mail or phone' }, { status: 404 });
  return Response.json({ id: o.id });
}
