'use client';
// Tiny cart store kept in localStorage — no account or server session needed.
// Prices here are only for display; the server re-prices every order.
import { useSyncExternalStore } from 'react';

export type CartItem = {
  id: string;
  name: string;
  slug?: string;
  unit?: string | null;
  price: number; // current price in öre (offer price if on sale)
  regularPrice: number;
  image: string;
  stock: number;
  quantity: number;
};

const KEY = 'gsm-cart';
const EMPTY: CartItem[] = [];
let cache: CartItem[] | null = null;
const listeners = new Set<() => void>();

function read(): CartItem[] {
  if (typeof window === 'undefined') return EMPTY;
  if (cache) return cache;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    cache = Array.isArray(v) ? v.filter((x) => x && x.id && x.quantity > 0) : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function write(next: CartItem[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener('storage', onStorage);
  };
}

export const cart = {
  get: read,
  setQty(item: Omit<CartItem, 'quantity'>, qty: number) {
    const items = read();
    const q = Math.max(0, Math.min(qty, item.stock || 99, 50));
    const exists = items.some((x) => x.id === item.id);
    if (q === 0) return write(items.filter((x) => x.id !== item.id));
    write(exists ? items.map((x) => (x.id === item.id ? { ...x, ...item, quantity: q } : x)) : [...items, { ...item, quantity: q }]);
    if (!exists) window.dispatchEvent(new CustomEvent('gsm-toast', { detail: `${item.name} added to basket` }));
  },
  remove(id: string) {
    write(read().filter((x) => x.id !== id));
  },
  replace(items: CartItem[]) {
    write(items);
  },
  clear() {
    write([]);
  },
};

export function useCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function cartTotals(items: CartItem[]) {
  let count = 0, original = 0, subtotal = 0;
  for (const x of items) {
    count += x.quantity;
    original += (x.regularPrice ?? x.price) * x.quantity;
    subtotal += x.price * x.quantity;
  }
  return { count, original, subtotal, itemDiscount: original - subtotal };
}

// Drawer open/close is a separate tiny event channel.
export const openCart = () => window.dispatchEvent(new Event('gsm-open-cart'));

// Remember orders placed from this browser so customers can track them without an account.
const ORDERS_KEY = 'gsm-orders';
export function rememberOrder(id: string) {
  try {
    const ids: string[] = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    localStorage.setItem(ORDERS_KEY, JSON.stringify([id, ...ids.filter((x) => x !== id)].slice(0, 20)));
  } catch {}
}
export function rememberedOrders(): string[] {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  } catch {
    return [];
  }
}
