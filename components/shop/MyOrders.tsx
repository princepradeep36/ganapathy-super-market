'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { rememberedOrders } from '@/lib/cart';
import { sek } from '@/lib/money';
import { customerStatusLabel } from '@/lib/status';
import { translateError } from '@/lib/i18n';
import { useLang, useT } from './I18n';

export type Row = { id: string; ref: string; createdAt: string; status: string; deliveryMethod: string; total: number; itemCount: number };
type Account = { email: string; name: string | null; orders: Row[] };

export default function MyOrders({ account }: { account: Account | null }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState('');
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  useEffect(() => {
    // Logged in: the account's orders plus any other orders placed from this device.
    const own = account?.orders || [];
    const ids = rememberedOrders().filter((id) => !own.some((o) => o.id === id));
    if (!ids.length) return setRows(own);
    fetch('/api/orders/lookup?ids=' + ids.join(','))
      .then((r) => r.json())
      .then((d) => setRows([...own, ...(d.orders || [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
      .catch(() => setRows(own));
  }, [account]);
  async function logout() {
    await fetch('/api/account/logout', { method: 'POST' });
    router.refresh();
  }
  async function find(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr('');
    const f = new FormData(e.currentTarget);
    const r = await fetch('/api/orders/lookup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ref: f.get('ref'), contact: f.get('contact') }) });
    const d = await r.json();
    if (!r.ok) return setErr(d.error ? translateError(lang, d.error) : t('Order not found'));
    router.push('/order/' + d.id);
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
      {account ? (
        <div className="accountBar">
          <span>{t('Logged in as {email}', { email: account.email })}</span>
          <button className="btn btn-ghost btn-sm" onClick={logout}>{t('Log out')}</button>
        </div>
      ) : (
        <div className="card loginCta">
          <p>{t('Log in to see all your orders, from any phone or computer.')}</p>
          <span><Link className="btn" href="/login">{t('Log in')}</Link> <Link className="btn btn-ghost" href="/login?signup=1">{t('Sign up')}</Link></span>
        </div>
      )}
      <p className="muted">{t(account ? 'Orders placed with {email} or from this device.' : 'Orders placed from this device appear here automatically.', { email: account?.email || '' })}</p>
      {rows === null ? (
        <div className="skeleton" style={{ height: 160 }} />
      ) : rows.length ? (
        list(rows)
      ) : (
        <div className="emptyState small"><span aria-hidden>📦</span><p>{t(account ? 'No orders yet.' : 'No orders on this device yet.')}</p><Link className="btn" href="/shop">{t('Start shopping')}</Link></div>
      )}
      {!account && <section className="card findOrder">
        <h2>{t('Find an order')}</h2>
        <p className="muted">{t('Ordered on another phone? Enter your order number and the e-mail or mobile number you ordered with.')}</p>
        <form onSubmit={find} className="formGrid">
          <label>{t('E-mail or mobile number')}<input name="contact" required autoComplete="email" /></label>
          <label>{t('Order number')}<input name="ref" required placeholder={t('e.g. 48213907')} inputMode="numeric" /></label>
          <div className="full"><button className="btn">{t('Find order')}</button>{err && <span className="err"> {err}</span>}</div>
        </form>
      </section>}
    </>
  );
}
