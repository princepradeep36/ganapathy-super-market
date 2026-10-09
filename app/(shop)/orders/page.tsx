import type { Metadata } from 'next';
import MyOrders from '@/components/shop/MyOrders';
import { getT } from '@/lib/i18n-server';
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t('My orders'), robots: { index: false } };
}
export default function OrdersPage() {
  return <main className="wrap section narrow"><MyOrders /></main>;
}
