import { db } from '@/lib/db';
import { adminError, requireAdmin } from '@/lib/admin';
import { scheduleInput } from '@/lib/validation';

/** Saves the delivery / pickup times offered at checkout. */
export async function PUT(r: Request) {
  try {
    await requireAdmin();
    const data = scheduleInput(await r.json());
    return Response.json(await db.deliverySchedule.upsert({ where: { id: 'main' }, update: data, create: { id: 'main', ...data } }));
  } catch (e) {
    return adminError(e);
  }
}
