'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { cart, cartTotals, rememberOrder, useCart, type CartItem } from '@/lib/cart';
import { sek } from '@/lib/money';
import { DELIVERY_SLOTS } from '@/lib/status';
import { inDeliveryArea, type PublicStore } from '@/lib/config';
import ProductImage from './ProductImage';
import { translateError } from '@/lib/i18n';
import { useLang, useT } from './I18n';

type Coupon = { code: string; name: string; discount: number } | null;
const CUSTOMER_KEY = 'gsm-customer';

export default function Checkout({ cfg, storeAddress, storeHours, mapUrl }: { cfg: PublicStore; storeAddress: string; storeHours: string; mapUrl: string }) {
  const items = useCart();
  const router = useRouter();
  const tr = useT();
  const lang = useLang();
  const [hydrated, setHydrated] = useState(false);
  const [method, setMethod] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [payment, setPayment] = useState<'ON_RECEIPT' | 'SWISH'>('ON_RECEIPT');
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState<Coupon>(null);
  const [couponMsg, setCouponMsg] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [postal, setPostal] = useState('');

  // Refresh prices & stock from the server so the basket never shows stale offers.
  useEffect(() => {
    setHydrated(true);
    try { const s = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || '{}'); setSaved(s); setPostal(s.postalCode || ''); } catch {}
    const current = cart.get();
    if (!current.length) return;
    fetch('/api/cart/validate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ids: current.map((x) => x.id) }) })
      .then((r) => r.json())
      .then((d: { products: Omit<CartItem, 'quantity'>[] }) => {
        const changes: string[] = [];
        const next: CartItem[] = [];
        for (const x of current) {
          const p = d.products.find((y) => y.id === x.id);
          if (!p || p.stock <= 0) { changes.push(tr('{name} is no longer available', { name: x.name })); continue; }
          if (p.price !== x.price) changes.push(tr('{name} is now {amount}', { name: x.name, amount: sek(p.price) }));
          const quantity = Math.min(x.quantity, p.stock);
          if (quantity < x.quantity) changes.push(tr('Only {n} × {name} left', { n: p.stock, name: x.name }));
          next.push({ ...x, ...p, quantity });
        }
        if (changes.length) { cart.replace(next); setNotice(changes.join(' · ')); }
      })
      .catch(() => {});
  }, []);

  const t = cartTotals(items);
  const orderDiscount = coupon?.discount || 0;
  const afterDiscounts = Math.max(0, t.subtotal - orderDiscount);
  const deliveryFee = method === 'DELIVERY' && afterDiscounts < cfg.freeDeliveryMin ? cfg.deliveryFee : 0;
  const total = afterDiscounts + deliveryFee;
  const belowMin = method === 'DELIVERY' && t.subtotal < cfg.minDeliveryOrder;
  const postalDigits = postal.replace(/\D/g, '');
  const outsideArea = method === 'DELIVERY' && postalDigits.length === 5 && !inDeliveryArea(postal, cfg.deliveryPrefixes);

  // Any basket change invalidates the coupon amount.
  const sig = useMemo(() => items.map((x) => x.id + ':' + x.quantity + ':' + x.price).join(','), [items]);
  useEffect(() => { if (coupon) { setCoupon(null); setCouponMsg(tr('Basket changed — please re-apply your code')); } }, [sig]); // eslint-disable-line

  async function applyCoupon() {
    setCouponMsg('');
    if (!code.trim()) return;
    const res = await fetch('/api/coupons/apply', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code, subtotal: t.subtotal, hasItemDiscount: t.itemDiscount > 0 }) });
    const d = await res.json();
    if (!res.ok) { setCoupon(null); setCouponMsg(translateError(lang, d.error)); return; }
    setCoupon(d);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (outsideArea) return setError(tr('We only deliver within {area}. Please choose store pickup.', { area: cfg.deliveryArea }));
    if (belowMin) return setError(tr('Minimum order for home delivery is {amount}.', { amount: sek(cfg.minDeliveryOrder) }));
    const f = new FormData(e.currentTarget);
    const body = {
      customerName: String(f.get('name') || ''),
      email: String(f.get('email') || ''),
      phone: String(f.get('phone') || ''),
      address: String(f.get('address') || ''),
      postalCode: String(f.get('postalCode') || ''),
      city: String(f.get('city') || ''),
      deliveryMethod: method,
      deliverySlot: String(f.get('slot') || ''),
      notes: String(f.get('notes') || ''),
      paymentMethod: payment === 'SWISH' ? 'SWISH' : method === 'DELIVERY' ? 'PAY_ON_DELIVERY' : 'PAY_AT_PICKUP',
      couponCode: coupon?.code || null,
      items: items.map((x) => ({ productId: x.id, quantity: x.quantity })),
    };
    setBusy(true);
    try {
      const res = await fetch('/api/orders', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ? translateError(lang, d.error) : tr('Could not place the order'));
      try { localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name: body.customerName, email: body.email, phone: body.phone, address: body.address, postalCode: body.postalCode, city: body.city })); } catch {}
      rememberOrder(d.id);
      cart.clear();
      router.push('/order/' + d.id + '?new=1');
    } catch (x: any) {
      setError(x.message);
      setBusy(false);
    }
  }

  if (!hydrated) return <main className="wrap section"><div className="skeleton" style={{ height: 420 }} /></main>;
  if (!items.length)
    return (
      <main className="wrap section">
        <div className="emptyState">
          <span aria-hidden>🧺</span>
          <h2>{tr('Your basket is empty')}</h2>
          <p>{tr('Add something delicious and come back here.')}</p>
          <Link className="btn" href="/shop">{tr('Continue shopping')}</Link>
        </div>
      </main>
    );

  return (
    <main className="wrap checkout">
      <div className="checkoutHead">
        <h1>{tr('Checkout')}</h1>
        <ol className="steps"><li className="done">{tr('Basket')}</li><li className="on">{tr('Details')}</li><li>{tr('Confirmation')}</li></ol>
      </div>
      {notice && <div className="alert alert-info">{tr('Prices were updated: {notice}', { notice })}</div>}
      <div className="checkoutGrid">
        <form id="order-form" className="checkoutMain" onSubmit={submit}>
          <section className="card">
            <h2><span className="stepNo">1</span> {tr('How would you like to get your order?')}</h2>
            <div className="optionGrid">
              <label className={`option${method === 'PICKUP' ? ' on' : ''}`}>
                <input type="radio" name="method" checked={method === 'PICKUP'} onChange={() => setMethod('PICKUP')} />
                <span className="optIcon" aria-hidden>🏪</span>
                <span><b>{tr('Store pickup')}</b><small>{tr('Free · usually ready within 2 hours')}</small></span>
                <em>{tr('Free')}</em>
              </label>
              <label className={`option${method === 'DELIVERY' ? ' on' : ''}`}>
                <input type="radio" name="method" checked={method === 'DELIVERY'} onChange={() => setMethod('DELIVERY')} />
                <span className="optIcon" aria-hidden>🚚</span>
                <span><b>{tr('Home delivery')}</b><small>{tr('Only within {area} · free over {amount}', { area: cfg.deliveryArea, amount: sek(cfg.freeDeliveryMin) })}</small></span>
                <em>{afterDiscounts >= cfg.freeDeliveryMin ? tr('Free') : sek(cfg.deliveryFee)}</em>
              </label>
            </div>
            {method === 'PICKUP' ? (
              <div className="pickupInfo"><b>{tr('Pickup at:')}</b> <a href={mapUrl} target="_blank" rel="noreferrer" className="linkBtn">{storeAddress} ↗</a><br /><small>{tr(storeHours)}</small></div>
            ) : (
              <div className="formGrid">
                <label className="full">{tr('Street address')}<input name="address" defaultValue={saved.address} autoComplete="street-address" required placeholder={tr('Street and house number, apartment')} /></label>
                <label>{tr('Postal code')}<input name="postalCode" value={postal} onChange={(e) => setPostal(e.target.value)} autoComplete="postal-code" required inputMode="numeric" placeholder="252 18" /></label>
                <label>{tr('City')}<input name="city" defaultValue={saved.city || cfg.deliveryArea} autoComplete="address-level2" required /></label>
                {outsideArea ? (
                  <div className="alert alert-warn full">
                    {tr('Sorry, we only deliver within')} <b>{cfg.deliveryArea}</b>{tr('. You’re welcome to pick up your order in our store — it’s free.')}{' '}
                    <button type="button" className="linkBtn" onClick={() => setMethod('PICKUP')}>{tr('Switch to store pickup')}</button>
                  </div>
                ) : (
                  <p className="muted small full" style={{ margin: 0 }}>{tr('🚚 We deliver within {area} only (postal codes {from}xx–{to}xx). Outside {area}? Choose store pickup.', { area: cfg.deliveryArea, from: cfg.deliveryPrefixes[0], to: cfg.deliveryPrefixes[cfg.deliveryPrefixes.length - 1] })}</p>
                )}
              </div>
            )}
            <label className="field">{tr(method === 'DELIVERY' ? 'Delivery time' : 'Preferred pickup time')}
              <select name="slot" defaultValue={DELIVERY_SLOTS[0]}>
                {DELIVERY_SLOTS.map((s) => <option key={s} value={s}>{tr(s)}</option>)}
                <option value="">{tr('As soon as possible')}</option>
              </select>
            </label>
          </section>

          <section className="card">
            <h2><span className="stepNo">2</span> {tr('Your details')}</h2>
            <div className="formGrid">
              <label className="full">{tr('Full name')}<input name="name" defaultValue={saved.name} autoComplete="name" required minLength={2} /></label>
              <label>{tr('Mobile number')}<input name="phone" type="tel" defaultValue={saved.phone} autoComplete="tel" required placeholder="+46 70 123 45 67" /></label>
              <label>{tr('Email')}<input name="email" type="email" defaultValue={saved.email} autoComplete="email" required placeholder="you@example.com" /></label>
              <label className="full">{tr('Notes for the store')} <span className="opt">{tr('(optional)')}</span><textarea name="notes" maxLength={500} placeholder={tr('E.g. ripe mangoes please, call when outside…')} /></label>
            </div>
          </section>

          <section className="card">
            <h2><span className="stepNo">3</span> {tr('Payment')}</h2>
            <div className="optionGrid">
              <label className={`option${payment === 'ON_RECEIPT' ? ' on' : ''}`}>
                <input type="radio" name="payment" checked={payment === 'ON_RECEIPT'} onChange={() => setPayment('ON_RECEIPT')} />
                <span className="optIcon" aria-hidden>💳</span>
                <span><b>{tr(method === 'DELIVERY' ? 'Pay on delivery' : 'Pay at pickup')}</b><small>{tr('Card, cash or Swish when you receive it')}</small></span>
              </label>
              {cfg.swish && (
                <label className={`option${payment === 'SWISH' ? ' on' : ''}`}>
                  <input type="radio" name="payment" checked={payment === 'SWISH'} onChange={() => setPayment('SWISH')} />
                  <span className="optIcon" aria-hidden>📱</span>
                  <span><b>{tr('Swish now')}</b><small>{tr('Pay to {number} — we confirm by phone', { number: cfg.swish })}</small></span>
                </label>
              )}
            </div>
          </section>
        </form>

        <aside className="card summary">
          <h2>{tr('Order summary')}</h2>
          <ul className="sumItems">
            {items.map((x) => (
              <li key={x.id}>
                <ProductImage image={x.image} name={x.name} size="sm" />
                <span><b>{x.name}</b><small>{x.quantity} × {sek(x.price)}</small></span>
                <b>{sek(x.price * x.quantity)}</b>
              </li>
            ))}
          </ul>
          <Link href="/shop" className="linkBtn">{tr('+ Add more items')}</Link>
          <div className="couponBox">
            <label htmlFor="coupon">{tr('Discount code')}</label>
            <div>
              <input id="coupon" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyCoupon())} placeholder={tr('Enter code')} />
              <button type="button" onClick={applyCoupon}>{tr('Apply')}</button>
            </div>
            {coupon && <p className="ok">{tr('✓ {code} applied — you save {amount}', { code: coupon.code, amount: sek(coupon.discount) })} <button type="button" className="linkBtn" onClick={() => { setCoupon(null); setCode(''); }}>{tr('Remove')}</button></p>}
            {couponMsg && <p className="err">{couponMsg}</p>}
          </div>
          <dl className="sumRows">
            <div><dt>{tr('Items ({n})', { n: t.count })}</dt><dd>{sek(t.original)}</dd></div>
            {t.itemDiscount > 0 && <div className="saving"><dt>{tr('Offer savings')}</dt><dd>−{sek(t.itemDiscount)}</dd></div>}
            {orderDiscount > 0 && <div className="saving"><dt>{tr('Code {code}', { code: coupon?.code || '' })}</dt><dd>−{sek(orderDiscount)}</dd></div>}
            <div><dt>{tr(method === 'DELIVERY' ? 'Delivery' : 'Pickup')}</dt><dd>{deliveryFee ? sek(deliveryFee) : tr('Free')}</dd></div>
            <div className="total"><dt>{tr('Total')}</dt><dd>{sek(total)}</dd></div>
          </dl>
          {t.itemDiscount + orderDiscount > 0 && <div className="saveLine">{tr('🎉 You save {amount} on this order', { amount: sek(t.itemDiscount + orderDiscount) })}</div>}
          {method === 'DELIVERY' && deliveryFee > 0 && <p className="muted small">{tr('Add {amount} more for free delivery.', { amount: sek(cfg.freeDeliveryMin - afterDiscounts) })}</p>}
          {belowMin && <div className="alert alert-warn">{tr('Minimum order for delivery is {amount}.', { amount: sek(cfg.minDeliveryOrder) })}</div>}
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          <button className="btn btn-block btn-lg" type="submit" form="order-form" disabled={busy || belowMin || outsideArea}>
            {busy ? tr('Placing order…') : tr('Place order · {amount}', { amount: sek(total) })}
          </button>
          <small className="fine">{tr('🔒 Prices, stock and discounts are re-checked when you place the order. No payment is taken online.')}</small>
        </aside>
      </div>
    </main>
  );
}
