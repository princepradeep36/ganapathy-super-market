import { db } from '@/lib/db';
import { adminError, requireAdmin } from '@/lib/admin';
import { couponInput } from '@/lib/validation';

export async function POST(r: Request) {
  try {
    await requireAdmin();
    return Response.json(await db.coupon.create({ data: couponInput(await r.json()) }));
  } catch (e) {
    return adminError(e);
  }
}
