import { db } from '@/lib/db';
import { adminError, requireAdmin } from '@/lib/admin';
import { couponInput } from '@/lib/validation';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(r: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    return Response.json(await db.coupon.update({ where: { id }, data: couponInput(await r.json()) }));
  } catch (e) {
    return adminError(e);
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.coupon.update({ where: { id }, data: { active: false } });
    return Response.json({ ok: true });
  } catch (e) {
    return adminError(e);
  }
}
