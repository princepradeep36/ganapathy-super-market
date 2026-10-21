import { orderNo } from '@/lib/orderNo';
import { db } from '@/lib/db';
import { adminError, requireAdmin } from '@/lib/admin';

const cell = (v: unknown) => {
  const s = String(v ?? '');
  return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const kr = (ore: number) => (ore / 100).toFixed(2);

/** CSV export of orders (opens directly in Excel / Google Sheets) for bookkeeping. */
export async function GET(r: Request) {
  try {
    await requireAdmin();
    const days = Math.min(366, Number(new URL(r.url).searchParams.get('days')) || 31);
    const since = new Date(Date.now() - days * 864e5);
    const orders = await db.order.findMany({ where: { createdAt: { gte: since } }, include: { items: true }, orderBy: { createdAt: 'desc' } });
    const head = ['Order', 'Date', 'Status', 'Paid', 'Customer', 'Phone', 'Email', 'Method', 'Slot', 'Address', 'Items', 'Item value', 'Offer savings', 'Coupon', 'Coupon savings', 'Delivery fee', 'Total'];
    const rows = orders.map((o) => [
      orderNo(o), o.createdAt.toISOString().slice(0, 16).replace('T', ' '), o.status, o.paid ? 'yes' : 'no',
      o.customerName, o.phone, o.email, o.deliveryMethod, o.deliverySlot, [o.address, o.postalCode, o.city].filter(Boolean).join(' '),
      o.items.map((i) => `${i.quantity}x ${i.name}`).join(' | '),
      kr(o.originalSubtotal), kr(o.itemDiscountTotal), o.couponCode, kr(o.orderDiscountTotal), kr(o.deliveryFee), kr(o.total),
    ]);
    const csv = '﻿' + [head, ...rows].map((r) => r.map(cell).join(';')).join('\n');
    return new Response(csv, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"` } });
  } catch (e) {
    return adminError(e);
  }
}
