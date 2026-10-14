'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminToaster, api } from './ui';
import { LogoMark } from '@/components/Logo';
import Overview from './Overview';
import Orders from './Orders';
import Products from './Products';
import Categories from './Categories';
import Coupons from './Coupons';
import Collections from './Collections';
import Requests from './Requests';
import Banners from './Banners';

export type Stats = {
  todayRevenue: number; todayOrders: number; pending: number; newOrders: number;
  revenue30: number; orders30: number; aov30: number; savings30: number;
  days: { date: string; total: number; count: number }[];
  top: { name: string; qty: number }[];
  lowStockThreshold: number;
};
type Props = { tab: string; stats: Stats; products: any[]; categories: any[]; collections: any[]; banners: any[]; requests: any[]; coupons: any[]; orders: any[]; storeName: string };

const NAV: [string, string, string][] = [
  ['overview', 'Overview', '▦'],
  ['orders', 'Orders', '🧾'],
  ['products', 'Products', '📦'],
  ['categories', 'Categories', '🗂️'],
  ['collections', 'Collections', '🪔'],
  ['banners', 'Banners', '🖼️'],
  ['coupons', 'Coupons', '🏷️'],
  ['requests', 'Requests', '🙋'],
];

export default function AdminApp(p: Props) {
  const router = useRouter();
  const lowStock = p.products.filter((x) => x.active && x.stock <= p.stats.lowStockThreshold).length;

  // Keep the dashboard fresh while it is open at the counter: new orders appear automatically.
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === 'visible' && router.refresh(), 60_000);
    return () => clearInterval(t);
  }, [router]);

  async function logout() {
    await api('/api/admin/logout', { method: 'POST' }).catch(() => {});
    location.href = '/admin/login';
  }
  const newRequests = p.requests.filter((r) => r.status === 'NEW').length;
  const badge = (k: string) => (k === 'orders' && p.stats.newOrders ? p.stats.newOrders : k === 'products' && lowStock ? lowStock : k === 'requests' ? newRequests : 0);

  return (
    <div className="admin">
      <aside className="aside">
        <Link href="/admin" className="asideBrand"><LogoMark size={40} /><span>{p.storeName}<small>Store admin</small></span></Link>
        <nav>
          {NAV.map(([k, label, icon]) => (
            <Link key={k} href={`/admin?tab=${k}`} className={p.tab === k ? 'on' : ''} scroll={false}>
              <span aria-hidden>{icon}</span>{label}
              {badge(k) > 0 && <i className={k === 'products' ? 'warn' : ''}>{badge(k)}</i>}
            </Link>
          ))}
        </nav>
        <div className="asideFoot">
          <a href="/" target="_blank" rel="noreferrer">↗ View shop</a>
          <button onClick={logout}>⎋ Log out</button>
        </div>
      </aside>
      <main className="amain">
        {p.tab === 'overview' && <Overview stats={p.stats} orders={p.orders} products={p.products} />}
        {p.tab === 'orders' && <Orders orders={p.orders} />}
        {p.tab === 'products' && <Products products={p.products} categories={p.categories} collections={p.collections} lowStock={p.stats.lowStockThreshold} />}
        {p.tab === 'categories' && <Categories categories={p.categories} />}
        {p.tab === 'collections' && <Collections collections={p.collections} />}
        {p.tab === 'banners' && <Banners banners={p.banners} />}
        {p.tab === 'coupons' && <Coupons coupons={p.coupons} />}
        {p.tab === 'requests' && <Requests requests={p.requests} />}
      </main>
      <nav className="abottom" aria-label="Admin">
        {NAV.map(([k, label, icon]) => (
          <Link key={k} href={`/admin?tab=${k}`} className={p.tab === k ? 'on' : ''}>
            <span aria-hidden>{icon}</span>{label}{badge(k) > 0 && <i>{badge(k)}</i>}
          </Link>
        ))}
      </nav>
      <AdminToaster />
    </div>
  );
}
