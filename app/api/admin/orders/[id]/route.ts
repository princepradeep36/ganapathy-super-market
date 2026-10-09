import { db } from '@/lib/db';
import { adminError, requireAdmin } from '@/lib/admin';
import { ORDER_STATUSES } from '@/lib/status';
import { queueMail, sendStatusUpdate } from '@/lib/email';

/** Update order status / payment. Cancelling puts the stock back and frees the coupon use. */
export async function PATCH(r: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const d = await r.json();
    const order = await db.order.findUniqueOrThrow({ where: { id }, include: { items: true } });
    const data: { status?: string; paid?: boolean } = {};
    if (typeof d.paid === 'boolean') data.paid = d.paid;
    if (d.status && d.status !== order.status) {
      if (!ORDER_STATUSES.includes(d.status)) throw new Error('Unknown status');
      if (order.status === 'CANCELLED') throw new Error('A cancelled order cannot be reopened. Ask the customer to order again.');
      data.status = d.status;
    }
    const updated = await db.$transaction(async (tx) => {
      if (data.status === 'CANCELLED') {
        for (const i of order.items) await tx.product.update({ where: { id: i.productId }, data: { stock: { increment: i.quantity } } });
        if (order.couponCode) await tx.coupon.updateMany({ where: { code: order.couponCode, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
      }
      return tx.order.update({ where: { id }, data, include: { items: true } });
    });
    if (data.status) queueMail(() => sendStatusUpdate(updated));
    return Response.json(updated);
  } catch (e) {
    return adminError(e);
  }
}
