import { db } from '@/lib/db';

/** Checks the chosen parent: sub-categories go one level deep only. */
export async function parentFor(id: string | null, raw: unknown) {
  const parentId = raw ? String(raw) : null;
  if (!parentId) return null;
  if (parentId === id) throw new Error('A category cannot be inside itself');
  const parent = await db.category.findUnique({ where: { id: parentId } });
  if (!parent) throw new Error('That parent category no longer exists');
  if (parent.parentId) throw new Error('Choose a main category as the parent (sub-categories go one level deep)');
  if (id && (await db.category.count({ where: { parentId: id } })) > 0) throw new Error('This category has its own sub-categories, so it must stay a main category');
  return parentId;
}
