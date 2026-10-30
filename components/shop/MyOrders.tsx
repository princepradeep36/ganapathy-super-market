'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { rememberedOrders } from '@/lib/cart';
import { sek } from '@/lib/money';
import { customerStatusLabel } from '@/lib/status';
import { translateError } from '@/lib/i18n';
import { useLang, useT } from './I18n';

type Row = { id: string; ref: string; createdAt: string; status: string; deliveryMethod: string; total: number; itemCount: number };

export default function MyOrders() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState('');
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  useEffect(() => {
    const ids = rememberedOrders();
    if (!ids.length) return setRows([]);
    fetch('/api/orders/lookup?ids=' + ids.join(',')).then((r) => r.json()).then((d) => setRows(d.orders || [])).catch(() => setRows([]));
  }, []);
  async function find(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr('');
    const f = new FormData(e.currentTarget);
    const r = await fetch('/api/orders/lookup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ref: f.get('ref'), phone: f.get('phone') }) });
    const d = await r.json();
    if (!r.ok) return setErr(d.error ? translateError(lang, d.error) : t('Order not found'));
    router.push('/order/' + d.id);
  }
  return (
    <>
      <h1>{t('My orders')}</h1>
      <p className="muted">{t('Orders placed from this device appear here automatically.')}</p>
      {rows === null ? (
        <div className="skeleton" style={{ height: 160 }} />
      ) : rows.length ? (
        <ul className="orderList">
          {rows.map((o) => (
            <li key={o.id}>
              <Link href={`/order/${o.id}`}>
                <span><b>#{o.ref}</b><small>{new Date(o.createdAt).toLocaleDateString('sv-SE')} · {t(o.itemCount === 1 ? '{n} item' : '{n} items', { n: o.itemCount })} · {t(o.deliveryMethod === 'DELIVERY' ? 'Delivery' : 'Pickup')}</small></span>
                <span className={`pill pill-${o.status.toLowerCase()}`}>{t(customerStatusLabel(o.status, o.deliveryMethod))}</span>
                <b>{sek(o.total)}</b>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="emptyState small"><span aria-hidden>📦</span><p>{t('No orders on this device yet.')}</p><Link className="btn" href="/shop">{t('Start shopping')}</Link></div>
      )}
      <section className="card findOrder">
        <h2>{t('Find an order')}</h2>
        <p className="muted">{t('Ordered on another phone? Enter your order number and mobile number.')}</p>
        <form onSubmit={find} className="formGrid">
          <label>{t('Order number')}<input name="ref" required placeholder={t('e.g. 48213907')} inputMode="numeric" /></label>
          <label>{t('Mobile number')}<input name="phone" type="tel" required /></label>
          <div className="full"><button className="btn">{t('Find order')}</button>{err && <span className="err"> {err}</span>}</div>
        </form>
      </section>
    </>
  );
}
