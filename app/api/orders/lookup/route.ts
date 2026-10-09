import { db } from '@/lib/db';
import { clientIp, rateLimit } from '@/lib/ratelimit';

const digits = (s: string) => String(s || '').replace(/\D/g, '').slice(-7);

/** Status of orders remembered on this device (ids are unguessable cuids). */
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get('ids') || '').split(',').filter(Boolean).slice(0, 20);
  const orders = ids.length
    ? await db.order.findMany({ where: { id: { in: ids } }, include: { _count: { select: { items: true } } }, orderBy: { createdAt: 'desc' } })
    : [];
  return Response.json({
    orders: orders.map((o) => ({ id: o.id, ref: o.id.slice(-8).toUpperCase(), createdAt: o.createdAt, status: o.status, deliveryMethod: o.deliveryMethod, total: o.total, itemCount: o._count.items })),
  });
}

/** Find an order by its short reference + the phone number used. */
export async function POST(req: Request) {
  if (!rateLimit('lookup:' + clientIp(req), 10, 10 * 60_000)) return Response.json({ error: 'Too many attempts, try again later' }, { status: 429 });
  const d = await req.json().catch(() => ({}));
  const ref = String(d.ref || '').trim().replace(/^#/, '').toLowerCase();
  if (ref.length < 6) return Response.json({ error: 'Enter the 8-character order number' }, { status: 400 });
  const candidates = await db.order.findMany({ where: { id: { endsWith: ref } }, take: 5 });
  const o = candidates.find((x) => digits(x.phone) === digits(d.phone));
  if (!o) return Response.json({ error: 'No order matches that number and phone' }, { status: 404 });
  return Response.json({ id: o.id });
}
