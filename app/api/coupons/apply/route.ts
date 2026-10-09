import { db } from '@/lib/db';
import { couponDiscount } from '@/lib/coupons';
import { clientIp, rateLimit } from '@/lib/ratelimit';

export async function POST(r: Request) {
  try {
    if (!rateLimit('coupon:' + clientIp(r), 20, 10 * 60_000)) throw new Error('Too many attempts, try again later');
    const d = await r.json();
    const code = String(d.code || '').trim().toUpperCase();
    const c = await db.coupon.findUnique({ where: { code } });
    const discount = couponDiscount(c, Number(d.subtotal) || 0, !!d.hasItemDiscount);
    return Response.json({ code: c!.code, name: c!.name, discount });
  } catch (e: any) {
    return Response.json({ error: e.message || 'Invalid code' }, { status: 400 });
  }
}
