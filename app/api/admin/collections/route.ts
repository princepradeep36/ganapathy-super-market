import { db } from '@/lib/db';
import { adminError, requireAdmin, slugify } from '@/lib/admin';
import { collectionInput } from '@/lib/validation';

export async function POST(r: Request) {
  try {
    await requireAdmin();
    const data = collectionInput(await r.json());
    return Response.json(await db.collection.create({ data: { ...data, slug: slugify(data.name) } }));
  } catch (e) {
    return adminError(e);
  }
}
