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

/** Find orders by the e-mail or phone used; with an order number, open just that order. */
export async function POST(req: Request) {
  if (!rateLimit('lookup:' + clientIp(req), 10, 10 * 60_000)) return Response.json({ error: 'Too many attempts, try again later' }, { status: 429 });
  const d = await req.json().catch(() => ({}));
  const contact = String(d.contact ?? d.phone ?? '').trim();
  const isEmail = contact.includes('@');
  if (isEmail ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) : national(contact).length < 7)
    return Response.json({ error: 'Enter the e-mail or mobile number you ordered with' }, { status: 400 });
  const matches = (o: { email: string; phone: string }) => (isEmail ? o.email.trim().toLowerCase() === contact.toLowerCase() : samePhone(o.phone, contact));

  const ref = String(d.ref || '').trim().replace(/^#/, '').replace(/\s+/g, '').toLowerCase();
  if (ref) {
    if (ref.length < 6) return Response.json({ error: 'Enter the 8-digit order number' }, { status: 400 });
    // 8-digit order numbers; older orders can still be found by their letter code.
    const candidates = /^\d{8}$/.test(ref)
      ? await db.order.findMany({ where: { number: Number(ref) }, take: 1 })
      : await db.order.findMany({ where: { id: { endsWith: ref } }, take: 5 });
    const o = candidates.find(matches);
    if (!o) return Response.json({ error: 'No order matches that number and e-mail or phone' }, { status: 404 });
    return Response.json({ id: o.id });
  }

  let where: { email: { equals: string; mode: 'insensitive' } } | { id: { in: string[] } };
  if (isEmail) where = { email: { equals: contact, mode: 'insensitive' } };
  else {
    // Narrow by the last 7 digits in SQL ([^0-9], not \D: the tagged template drops backslashes), then match exactly here.
    const tail = '%' + national(contact).slice(-7);
    const rows = await db.$queryRaw<{ id: string; phone: string }[]>`SELECT id, phone FROM "Order" WHERE regexp_replace(phone, '[^0-9]', '', 'g') LIKE ${tail}`;
    where = { id: { in: rows.filter((r) => samePhone(r.phone, contact)).map((r) => r.id) } };
  }
  const orders = await db.order.findMany({ where, include: { _count: { select: { items: true } } }, orderBy: { createdAt: 'desc' }, take: 50 });
  if (!orders.length) return Response.json({ error: 'No orders found for that e-mail or phone' }, { status: 404 });
  return Response.json({ orders: orders.map(summary) });
}
