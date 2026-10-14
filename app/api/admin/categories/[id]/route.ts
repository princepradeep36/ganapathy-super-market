import { db } from '@/lib/db';
import { adminError, requireAdmin } from '@/lib/admin';
import { parentFor } from '../parent';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(r: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const d = await r.json();
    const name = String(d.name || '').trim();
    if (!name) throw new Error('Category name is required');
    const parentId = await parentFor(id, d.parentId);
    // Slug stays the same so existing links keep working.
    return Response.json(await db.category.update({ where: { id }, data: { name, icon: String(d.icon || '🛒').slice(0, 8), sortOrder: Number(d.sortOrder) || 0, parentId } }));
  } catch (e) {
    return adminError(e);
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const n = await db.product.count({ where: { categoryId: id } });
    if (n > 0) throw new Error(`Move or remove the ${n} product(s) in this category first`);
    const subs = await db.category.count({ where: { parentId: id } });
    if (subs > 0) throw new Error(`Move or delete its ${subs} sub-categor${subs === 1 ? 'y' : 'ies'} first`);
    await db.category.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    return adminError(e);
  }
}
