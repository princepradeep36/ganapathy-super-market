import { db } from '@/lib/db';
import { adminError, requireAdmin } from '@/lib/admin';
import { bannerInput } from '@/lib/validation';

export async function POST(r: Request) {
  try {
    await requireAdmin();
    return Response.json(await db.banner.create({ data: bannerInput(await r.json()) }));
  } catch (e) {
    return adminError(e);
  }
}
