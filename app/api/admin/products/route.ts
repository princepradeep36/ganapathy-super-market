import { db } from '@/lib/db';
import { adminError, requireAdmin, slugify } from '@/lib/admin';
import { productInput } from '@/lib/validation';

export async function POST(r: Request) {
  try {
    await requireAdmin();
    const { collectionIds, ...data } = productInput(await r.json());
    const p = await db.product.create({
      data: { ...data, slug: slugify(data.name) + '-' + Date.now().toString(36), collections: { connect: collectionIds.map((id) => ({ id })) } },
    });
    return Response.json(p);
  } catch (e) {
    return adminError(e);
  }
}
