import { db } from '@/lib/db';
import { adminError, requireAdmin, slugify } from '@/lib/admin';
import { parentFor } from './parent';

export async function GET() {
  try {
    await requireAdmin();
    return Response.json(await db.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }));
  } catch (e) {
    return adminError(e);
  }
}

export async function POST(r: Request) {
  try {
    await requireAdmin();
    const d = await r.json();
    const name = String(d.name || '').trim();
    if (!name) throw new Error('Category name is required');
    const count = await db.category.count();
    const parentId = await parentFor(null, d.parentId);
    return Response.json(await db.category.create({ data: { name, slug: slugify(name), icon: String(d.icon || '🛒').slice(0, 8), sortOrder: Number(d.sortOrder) || count + 1, parentId } }));
  } catch (e) {
    return adminError(e);
  }
}
