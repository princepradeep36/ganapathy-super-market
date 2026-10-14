import { db } from '@/lib/db';
import { adminError, requireAdmin } from '@/lib/admin';
import { productInput } from '@/lib/validation';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(r: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { collectionIds, ...data } = productInput(await r.json());
    return Response.json(await db.product.update({ where: { id }, data: { ...data, collections: { set: collectionIds.map((id) => ({ id })) } } }));
  } catch (e) {
    return adminError(e);
  }
}

/** Quick actions from the product table: adjust stock, toggle visibility/featured. */
export async function PATCH(r: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const d = await r.json();
    const data: Record<string, unknown> = {};
    if (typeof d.active === 'boolean') data.active = d.active;
    if (typeof d.featured === 'boolean') data.featured = d.featured;
    if (Number.isInteger(d.stock) && d.stock >= 0) data.stock = d.stock;
    if (Number.isInteger(d.stockDelta)) {
      const p = await db.product.findUniqueOrThrow({ where: { id } });
      data.stock = Math.max(0, p.stock + d.stockDelta);
    }
    return Response.json(await db.product.update({ where: { id }, data }));
  } catch (e) {
    return adminError(e);
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.product.update({ where: { id }, data: { active: false } });
    return Response.json({ ok: true });
  } catch (e) {
    return adminError(e);
  }
}
