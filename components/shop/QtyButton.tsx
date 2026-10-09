'use client';
import { cart, useCart, type CartItem } from '@/lib/cart';
import { useT } from './I18n';

type Item = Omit<CartItem, 'quantity'>;

/** Blinkit-style control: "Add" turns into a − qty + stepper once in the basket. */
export default function QtyButton({ item, size = 'md' }: { item: Item; size?: 'md' | 'lg' }) {
  const items = useCart();
  const t = useT();
  const qty = items.find((x) => x.id === item.id)?.quantity ?? 0;
  if (item.stock <= 0) return <button className={`qtyAdd qty-${size}`} disabled>{t('Sold out')}</button>;
  if (qty === 0)
    return (
      <button className={`qtyAdd qty-${size}`} onClick={() => cart.setQty(item, 1)} aria-label={t('Add {name} to basket', { name: item.name })}>
        {t('Add')} <span aria-hidden>+</span>
      </button>
    );
  const atMax = qty >= Math.min(item.stock, 50);
  return (
    <div className={`qtyStep qty-${size}`} role="group" aria-label={t('Quantity of {name}', { name: item.name })}>
      <button onClick={() => cart.setQty(item, qty - 1)} aria-label={t('Decrease')}>−</button>
      <output aria-live="polite">{qty}</output>
      <button onClick={() => cart.setQty(item, qty + 1)} disabled={atMax} aria-label={t('Increase')} title={atMax ? t('No more in stock') : undefined}>+</button>
    </div>
  );
}
