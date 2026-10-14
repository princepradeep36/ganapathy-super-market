import { db } from '@/lib/db';
import { adminError, requireAdmin } from '@/lib/admin';
import { collectionInput } from '@/lib/validation';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(r: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    // Slug stays the same so shared links keep working.
    return Response.json(await db.collection.update({ where: { id }, data: collectionInput(await r.json()) }));
  } catch (e) {
    return adminError(e);
  }
}

/** Removes the collection only; its products stay in the shop. */
export async function DELETE(_: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.collection.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    return adminError(e);
  }
}
