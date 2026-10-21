import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { isAdmin } from '@/lib/admin';
import { db } from '@/lib/db';
import { store } from '@/lib/config';
import AdminApp, { type Stats } from '@/components/admin/AdminApp';
import { getSchedule } from '@/lib/schedule';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Store admin', robots: { index: false } };

const TABS = ['overview', 'orders', 'products', 'categories', 'collections', 'banners', 'coupons', 'delivery', 'requests'] as const;
type Tab = (typeof TABS)[number];

export default async function Admin({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  if (!(await isAdmin())) redirect('/admin/login');
  const sp = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(sp.tab || '') ? (sp.tab as Tab) : 'overview';

  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const since30 = new Date(now.getTime() - 30 * 864e5);
  const since14 = new Date(startOfDay.getTime() - 13 * 864e5);

  const [schedule, products, categories, collections, banners, requests, coupons, orders, recent30, top] = await Promise.all([
    getSchedule(),
    db.product.findMany({ include: { category: { include: { parent: true } }, collections: { select: { id: true } } }, orderBy: [{ active: 'desc' }, { name: 'asc' }] }),
    db.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], include: { _count: { select: { products: true, children: true } } } }),
    db.collection.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], include: { _count: { select: { products: true } } } }),
    db.banner.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] }),
    db.productRequest.findMany({ orderBy: [{ status: 'asc' }, { createdAt: 'desc' }], take: 300 }),
    db.coupon.findMany({ orderBy: [{ active: 'desc' }, { createdAt: 'desc' }] }),
    db.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' }, take: 300 }),
    db.order.findMany({ where: { createdAt: { gte: since30 }, status: { not: 'CANCELLED' } }, select: { total: true, createdAt: true, orderDiscountTotal: true, itemDiscountTotal: true } }),
    db.orderItem.groupBy({
      by: ['productId', 'name'],
      where: { order: { createdAt: { gte: since30 }, status: { not: 'CANCELLED' } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 6,
    }),
  ]);

  const days: { date: string; total: number; count: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(since14.getTime() + i * 864e5);
    days.push({ date: d.toISOString(), total: 0, count: 0 });
  }
  for (const o of recent30) {
    if (o.createdAt < since14) continue;
    const idx = Math.floor((o.createdAt.getTime() - since14.getTime()) / 864e5);
    if (days[idx]) { days[idx].total += o.total; days[idx].count++; }
  }
  const today = recent30.filter((o) => o.createdAt >= startOfDay);
  const rev30 = recent30.reduce((a, o) => a + o.total, 0);

  const stats: Stats = {
    todayRevenue: today.reduce((a, o) => a + o.total, 0),
    todayOrders: today.length,
    pending: orders.filter((o) => ['NEW', 'CONFIRMED', 'PACKED', 'READY'].includes(o.status)).length,
    newOrders: orders.filter((o) => o.status === 'NEW').length,
    revenue30: rev30,
    orders30: recent30.length,
    aov30: recent30.length ? Math.round(rev30 / recent30.length) : 0,
    savings30: recent30.reduce((a, o) => a + o.orderDiscountTotal + o.itemDiscountTotal, 0),
    days,
    top: top.map((t) => ({ name: t.name, qty: t._sum.quantity || 0 })),
    lowStockThreshold: store.lowStock,
  };

  return <AdminApp tab={tab} stats={stats} products={products} categories={categories} collections={collections} banners={banners} schedule={schedule} requests={requests} coupons={coupons} orders={orders} storeName={store.name} />;
}
