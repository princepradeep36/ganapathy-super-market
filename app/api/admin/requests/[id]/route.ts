import { db } from '@/lib/db';
import { adminError, requireAdmin } from '@/lib/admin';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(r: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const d = await r.json();
    if (!['NEW', 'DONE'].includes(d.status)) throw new Error('Unknown status');
    return Response.json(await db.productRequest.update({ where: { id }, data: { status: d.status } }));
  } catch (e) {
    return adminError(e);
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.productRequest.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    return adminError(e);
  }
}
