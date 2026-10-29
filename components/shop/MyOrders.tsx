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
  const [found, setFound] = useState<Row[] | null>(null);
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
    setFound(null);
    const f = new FormData(e.currentTarget);
    const r = await fetch('/api/orders/lookup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ref: f.get('ref'), contact: f.get('contact') }) });
    const d = await r.json();
    if (!r.ok) return setErr(d.error ? translateError(lang, d.error) : t('Order not found'));
    if (d.id) return router.push('/order/' + d.id);
    setFound(d.orders || []);
  }
  const list = (items: Row[]) => (
    <ul className="orderList">
      {items.map((o) => (
        <li key={o.id}>
          <Link href={`/order/${o.id}`}>
            <span><b>#{o.ref}</b><small>{new Date(o.createdAt).toLocaleDateString('sv-SE')} · {t(o.itemCount === 1 ? '{n} item' : '{n} items', { n: o.itemCount })} · {t(o.deliveryMethod === 'DELIVERY' ? 'Delivery' : 'Pickup')}</small></span>
            <span className={`pill pill-${o.status.toLowerCase()}`}>{t(customerStatusLabel(o.status, o.deliveryMethod))}</span>
            <b>{sek(o.total)}</b>
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <>
      <h1>{t('My orders')}</h1>
      <p className="muted">{t('Orders placed from this device appear here automatically.')}</p>
      {rows === null ? (
        <div className="skeleton" style={{ height: 160 }} />
      ) : rows.length ? (
        list(rows)
      ) : (
        <div className="emptyState small"><span aria-hidden>📦</span><p>{t('No orders on this device yet.')}</p><Link className="btn" href="/shop">{t('Start shopping')}</Link></div>
      )}
      <section className="card findOrder">
        <h2>{t('Find an order')}</h2>
        <p className="muted">{t('Enter the e-mail or mobile number you ordered with to see all your orders. Add the order number to go straight to one order.')}</p>
        <form onSubmit={find} className="formGrid">
          <label>{t('E-mail or mobile number')}<input name="contact" required autoComplete="email" /></label>
          <label>{t('Order number (optional)')}<input name="ref" placeholder={t('e.g. 48213907')} inputMode="numeric" /></label>
          <div className="full"><button className="btn">{t('Find order')}</button>{err && <span className="err"> {err}</span>}</div>
        </form>
        {found && (
          <>
            <p className="muted">{t(found.length === 1 ? '{n} order found' : '{n} orders found', { n: found.length })}</p>
            {list(found)}
          </>
        )}
      </section>
    </>
  );
}
