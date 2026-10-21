'use client';
import { useEffect, useState } from 'react';

export async function api<T = any>(url: string, opts?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = opts || {};
  const r = await fetch(url, json !== undefined ? { ...rest, headers: { 'content-type': 'application/json' }, body: JSON.stringify(json) } : rest);
  const d = await r.json().catch(() => ({}));
  if (r.status === 401) { location.href = '/admin/login'; throw new Error('Session expired'); }
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
}

export function toast(msg: string, kind: 'ok' | 'err' = 'ok') {
  window.dispatchEvent(new CustomEvent('admin-toast', { detail: { msg, kind } }));
}

export function AdminToaster() {
  const [t, setT] = useState<{ msg: string; kind: string } | null>(null);
  useEffect(() => {
    let h: any;
    const on = (e: Event) => { setT((e as CustomEvent).detail); clearTimeout(h); h = setTimeout(() => setT(null), 3200); };
    window.addEventListener('admin-toast', on);
    return () => window.removeEventListener('admin-toast', on);
  }, []);
  return t ? <div className={`atoast atoast-${t.kind}`} role="status">{t.kind === 'ok' ? '✓' : '⚠'} {t.msg}</div> : null;
}

export function Modal({ title, kicker, onClose, children, wide }: { title: string; kicker?: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="modalBack" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${wide ? ' modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modalHead">
          <div>{kicker && <span className="kicker">{kicker}</span>}<h2>{title}</h2></div>
          <button type="button" className="iconBtn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const kr = (ore: number) => new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: ore % 100 ? 2 : 0 }).format((ore || 0) / 100);
export const toInputDate = (d?: string | Date | null) => {
  if (!d) return '';
  const x = new Date(d);
  return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export const fromInputDate = (v: FormDataEntryValue | null) => (v ? new Date(String(v)).toISOString() : '');
export const ago = (d: string | Date) => {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} h ago`;
  return new Date(d).toLocaleDateString('sv-SE');
};
/** 8-digit order number (older orders: their letter code). */
export const ref = (o: { id: string; number?: number | null }) => (o.number ? String(o.number) : o.id.slice(-8).toUpperCase());
