import type { Metadata } from 'next';
import MyOrders from '@/components/shop/MyOrders';
import { getT } from '@/lib/i18n-server';
import { currentCustomer } from '@/lib/customer';
import { db } from '@/lib/db';
import { orderNo } from '@/lib/orderNo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t('My orders'), robots: { index: false } };
}

export default async function OrdersPage() {
  const c = await currentCustomer();
  const orders = c
    ? await db.order.findMany({ where: { email: { equals: c.email, mode: 'insensitive' } }, include: { _count: { select: { items: true } } }, orderBy: { createdAt: 'desc' }, take: 100 })
    : [];
  const account = c && {
    email: c.email,
    name: c.name,
    orders: orders.map((o) => ({ id: o.id, ref: orderNo(o), createdAt: o.createdAt.toISOString(), status: o.status, deliveryMethod: o.deliveryMethod, total: o.total, itemCount: o._count.items })),
  };
  return <main className="wrap section narrow"><MyOrders account={account} /></main>;
}
