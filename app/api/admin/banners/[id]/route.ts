import { db } from '@/lib/db';
import { adminError, requireAdmin } from '@/lib/admin';
import { bannerInput } from '@/lib/validation';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(r: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    return Response.json(await db.banner.update({ where: { id }, data: bannerInput(await r.json()) }));
  } catch (e) {
    return adminError(e);
  }
}

/** Quick on/off switch from the banner list. */
export async function PATCH(r: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const d = await r.json();
    if (typeof d.active !== 'boolean') throw new Error('Nothing to change');
    return Response.json(await db.banner.update({ where: { id }, data: { active: d.active } }));
  } catch (e) {
    return adminError(e);
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.banner.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    return adminError(e);
  }
}
