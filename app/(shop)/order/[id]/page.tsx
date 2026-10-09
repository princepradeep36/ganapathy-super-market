import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { sek } from '@/lib/money';
import { store, telHref } from '@/lib/config';
import { ORDER_FLOW, customerStatusLabel } from '@/lib/status';
import { getT } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t('Your order'), robots: { index: false } };
}

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const o = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!o) notFound();
  const { t } = await getT();
  const status = (s: string) => t(customerStatusLabel(s, o.deliveryMethod));
  const ref = o.id.slice(-8).toUpperCase();
  const cancelled = o.status === 'CANCELLED';
  const step = ORDER_FLOW.indexOf(o.status as any);
  const delivery = o.deliveryMethod === 'DELIVERY';
  return (
    <main className="wrap section orderPage">
      {sp.new && (
        <div className="orderHero">
          <div className="successIcon" aria-hidden>✓</div>
          <h1>{t('Thank you, {name}!', { name: o.customerName.split(' ')[0] })}</h1>
          <p>{t('Your order')} <b>#{ref}</b> {t('has been received. We’ll call or text')} <b>{o.phone}</b> {t('if anything needs confirming.')}</p>
        </div>
      )}
      {!sp.new && <h1>{t('Order #{ref}', { ref })}</h1>}

      <div className="orderGrid">
        <div>
          <section className="card">
            <div className="cardHead">
              <h2>{cancelled ? t('Order cancelled') : status(o.status)}</h2>
              <span className="muted">{t('Placed {date}', { date: o.createdAt.toLocaleString('sv-SE', { dateStyle: 'medium', timeStyle: 'short' }) })}</span>
            </div>
            {cancelled ? (
              <p className="muted">{t('This order was cancelled. Questions? Call us on {phone}.', { phone: store.phone })}</p>
            ) : (
              <ol className="tracker">
                {ORDER_FLOW.map((s, i) => (
                  <li key={s} className={i < step ? 'done' : i === step ? 'now' : ''}>
                    <span className="dot" aria-hidden>{i < step ? '✓' : i + 1}</span>
                    <b>{status(s)}</b>
                  </li>
                ))}
              </ol>
            )}
            <div className="orderFacts">
              <div><small>{t(delivery ? 'Delivery to' : 'Pickup at')}</small><b>{delivery ? `${o.address}, ${o.postalCode} ${o.city}` : <a href={store.mapUrl} target="_blank" rel="noreferrer">{store.address} ↗</a>}</b></div>
              <div><small>{t(delivery ? 'Delivery time' : 'Pickup time')}</small><b>{t(o.deliverySlot || 'As soon as possible')}</b></div>
              <div><small>{t('Payment')}</small><b>{o.paid ? t('Paid ✓') : o.paymentMethod === 'SWISH' ? 'Swish' : t(delivery ? 'Pay on delivery' : 'Pay at pickup')}</b></div>
            </div>
            {o.paymentMethod === 'SWISH' && !o.paid && store.swish && !cancelled && (
              <div className="alert alert-info">{t('Please Swish')} <b>{sek(o.total)}</b> {t('to')} <b>{store.swish}</b> {t('with message')} <b>{ref}</b>.</div>
            )}
          </section>
        </div>
        <aside className="card">
          <h2>{t('Items')}</h2>
          <ul className="receipt">
            {o.items.map((i) => (
              <li key={i.id}><span>{i.quantity} × {i.name}</span><b>{sek(i.unitPrice * i.quantity)}</b></li>
            ))}
          </ul>
          <dl className="sumRows">
            <div><dt>{t('Items')}</dt><dd>{sek(o.originalSubtotal)}</dd></div>
            {o.itemDiscountTotal > 0 && <div className="saving"><dt>{t('Offer savings')}</dt><dd>−{sek(o.itemDiscountTotal)}</dd></div>}
            {o.orderDiscountTotal > 0 && <div className="saving"><dt>{t('Code {code}', { code: o.couponCode || '' })}</dt><dd>−{sek(o.orderDiscountTotal)}</dd></div>}
            <div><dt>{t(delivery ? 'Delivery' : 'Pickup')}</dt><dd>{o.deliveryFee ? sek(o.deliveryFee) : t('Free')}</dd></div>
            <div className="total"><dt>{t('Total')}</dt><dd>{sek(o.total)}</dd></div>
          </dl>
        </aside>
      </div>
      <div className="orderActions">
        <Link className="btn" href="/shop">{t('Continue shopping')}</Link>
        <Link className="btn btn-ghost" href="/orders">{t('All my orders')}</Link>
        <a className="btn btn-ghost" href={telHref()}>{t('Call the store')}</a>
      </div>
    </main>
  );
}
