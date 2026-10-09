'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cart, cartTotals, openCart, useCart } from '@/lib/cart';
import { sek } from '@/lib/money';
import type { PublicStore } from '@/lib/config';
import ProductImage from './ProductImage';
import { useT } from './I18n';
import { rich } from './rich';
import type { T } from '@/lib/i18n';

const itemsLabel = (t: T, n: number) => t(n === 1 ? '{n} item' : '{n} items', { n });

/** Header button showing item count + basket value. */
export function CartButton() {
  const items = useCart();
  const tr = useT();
  const t = cartTotals(items);
  return (
    <button className="cartBtn" onClick={openCart} aria-label={tr('Open basket, {n} items', { n: t.count })}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
      {t.count > 0 ? (
        <span className="cartBtnText"><b>{itemsLabel(tr, t.count)}</b><small>{sek(t.subtotal)}</small></span>
      ) : (
        <span className="cartBtnText"><b>{tr('Basket')}</b></span>
      )}
    </button>
  );
}

function FreeDeliveryBar({ subtotal, cfg }: { subtotal: number; cfg: PublicStore }) {
  const t = useT();
  if (!cfg.freeDeliveryMin) return null;
  const left = cfg.freeDeliveryMin - subtotal;
  const pct = Math.min(100, Math.round((subtotal / cfg.freeDeliveryMin) * 100));
  return (
    <div className="freeBar">
      <p>{rich(t(left > 0 ? 'Add {amount} more for {free} in {area}' : '🎉 You’ve unlocked {free} in {area}'), { amount: <b>{sek(left)}</b>, free: <b>{t('free home delivery')}</b>, area: cfg.deliveryArea })}</p>
      <div className="freeBarTrack"><span style={{ width: pct + '%' }} /></div>
    </div>
  );
}

/** Slide-in basket drawer, available on every shop page. */
export function CartDrawer({ cfg }: { cfg: PublicStore }) {
  const [open, setOpen] = useState(false);
  const items = useCart();
  const t = cartTotals(items);
  const path = usePathname();
  const tr = useT();
  useEffect(() => {
    const o = () => setOpen(true);
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('gsm-open-cart', o);
    window.addEventListener('keydown', k);
    return () => { window.removeEventListener('gsm-open-cart', o); window.removeEventListener('keydown', k); };
  }, []);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; }, [open]);
  return (
    <div className={`drawerRoot${open ? ' open' : ''}`} aria-hidden={!open} inert={!open}>
      <div className="drawerBack" onClick={() => setOpen(false)} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={tr('Your basket')}>
        <header className="drawerHead">
          <h2>{tr('Your basket')} {t.count > 0 && <small>({t.count})</small>}</h2>
          <button className="iconBtn" onClick={() => setOpen(false)} aria-label={tr('Close basket')}>✕</button>
        </header>
        {items.length === 0 ? (
          <div className="drawerEmpty">
            <span>🧺</span>
            <h3>{tr('Your basket is empty')}</h3>
            <p>{tr('Fresh vegetables, rice, spices and snacks are just a tap away.')}</p>
            <Link className="btn" href="/shop">{tr('Start shopping')}</Link>
          </div>
        ) : (
          <>
            <FreeDeliveryBar subtotal={t.subtotal} cfg={cfg} />
            <ul className="drawerList">
              {items.map((x) => (
                <li key={x.id}>
                  <ProductImage image={x.image} name={x.name} size="sm" />
                  <div className="dlInfo">
                    <b>{x.name}</b>
                    <small>{x.unit ? x.unit + ' · ' : ''}{sek(x.price)}{x.regularPrice > x.price && <s> {sek(x.regularPrice)}</s>}</small>
                  </div>
                  <div className="qtyStep qty-sm">
                    <button onClick={() => cart.setQty(x, x.quantity - 1)} aria-label={tr('Decrease')}>−</button>
                    <output>{x.quantity}</output>
                    <button onClick={() => cart.setQty(x, x.quantity + 1)} disabled={x.quantity >= x.stock} aria-label={tr('Increase')}>+</button>
                  </div>
                  <b className="dlTotal">{sek(x.price * x.quantity)}</b>
                </li>
              ))}
            </ul>
            <footer className="drawerFoot">
              {t.itemDiscount > 0 && <div className="saveLine">{tr('You save {amount} on offers', { amount: sek(t.itemDiscount) })}</div>}
              <div className="drawerSum"><span>{tr('Subtotal')}</span><b>{sek(t.subtotal)}</b></div>
              <Link href="/checkout" className="btn btn-block btn-lg">{tr('Go to checkout →')}</Link>
              <button className="linkBtn" onClick={() => cart.clear()}>{tr('Clear basket')}</button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}

/** Small confirmation toast (e.g. "Added to basket · View"). */
export function Toaster() {
  const t = useT();
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let t: any;
    const on = (e: Event) => {
      setMsg((e as CustomEvent).detail);
      clearTimeout(t);
      t = setTimeout(() => setMsg(null), 2600);
    };
    window.addEventListener('gsm-toast', on);
    return () => window.removeEventListener('gsm-toast', on);
  }, []);
  if (!msg) return null;
  return (
    <div className="toast" role="status">
      <span>✓ {msg.endsWith(' added to basket') ? t('{name} added to basket', { name: msg.slice(0, -' added to basket'.length) }) : t(msg)}</span>
      <button onClick={() => { setMsg(null); openCart(); }}>{t('View basket')}</button>
    </div>
  );
}

/** Bottom tab bar on phones — like most grocery apps. */
export function MobileNav() {
  const path = usePathname();
  const tr = useT();
  const t = cartTotals(useCart());
  const tab = (href: string, label: string, icon: string) => (
    <Link href={href} className={path === href ? 'on' : ''}><span aria-hidden>{icon}</span>{label}</Link>
  );
  return (
    <nav className="mnav" aria-label={tr('Main')}>
      {tab('/', tr('Home'), '🏠')}
      {tab('/shop', tr('Shop'), '🔍')}
      {tab('/shop?offers=1', tr('Offers'), '🏷️')}
      {tab('/orders', tr('Orders'), '📦')}
      <button onClick={openCart}><span aria-hidden>🧺</span>{tr('Basket')}{t.count > 0 && <i>{t.count}</i>}</button>
    </nav>
  );
}

/** Sticky bar on phones showing basket total → checkout. */
export function MobileCartBar() {
  const tr = useT();
  const t = cartTotals(useCart());
  const path = usePathname();
  if (!t.count || path.startsWith('/checkout')) return null;
  return (
    <button className="mcart" onClick={openCart}>
      <span><b>{itemsLabel(tr, t.count)}</b> · {sek(t.subtotal)}</span>
      <span>{tr('View basket →')}</span>
    </button>
  );
}
