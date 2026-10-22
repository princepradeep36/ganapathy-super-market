'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useT } from './I18n';
import ProductImage from './ProductImage';
import { sek } from '@/lib/money';

type Hit = { slug: string; name: string; unit: string | null; image: string; price: number; regularPrice: number; stock: number; category: string };

/** Header search: shows matching products as soon as two letters are typed. Enter still opens the full results page. */
export default function SearchBox() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(pathname === '/shop' ? params.get('q') || '' : '');
  const [hits, setHits] = useState<Hit[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLFormElement>(null);
  const term = q.trim();

  useEffect(() => {
    if (term.length < 2) { setHits([]); setTotal(0); setBusy(false); return; }
    setBusy(true);
    const ctl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const r = await fetch('/api/search?q=' + encodeURIComponent(term), { signal: ctl.signal });
        const d = await r.json();
        setHits(d.items); setTotal(d.total); setActive(-1); setBusy(false);
      } catch { /* replaced by newer typing */ }
    }, 180);
    return () => { clearTimeout(timer); ctl.abort(); };
  }, [term]);

  // Close the list after moving to another page, or when clicking elsewhere.
  useEffect(() => { setOpen(false); }, [pathname, params]);
  useEffect(() => {
    const away = (e: Event) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, []);

  function go(url: string) {
    setOpen(false);
    (document.activeElement as HTMLElement | null)?.blur();
    router.push(url);
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (active >= 0 && hits[active]) return go('/product/' + hits[active].slug);
    go(term ? '/shop?q=' + encodeURIComponent(term) : '/shop');
  }
  function keys(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, hits.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, -1)); }
    else if (e.key === 'Escape') setOpen(false);
  }

  const show = open && term.length >= 2;
  const requestUrl = '/request?product=' + encodeURIComponent(term);
  return (
    <form ref={box} className="search searchLive" action="/shop" role="search" onSubmit={submit}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input
        name="q" type="search" value={q} autoComplete="off" enterKeyHint="search"
        placeholder={t('Search for atta, dal, paneer, masala…')} aria-label={t('Search products')}
        role="combobox" aria-expanded={show} aria-controls="searchList" aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `sr-${active}` : undefined}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)} onKeyDown={keys}
      />
      {show && (
        <div className="searchDrop" id="searchList" role="listbox">
          {hits.map((h, i) => (
            <a key={h.slug} id={`sr-${i}`} role="option" aria-selected={i === active} href={'/product/' + h.slug}
              className={`searchHit${i === active ? ' on' : ''}${h.stock > 0 ? '' : ' out'}`}
              onMouseEnter={() => setActive(i)} onClick={(e) => { e.preventDefault(); go('/product/' + h.slug); }}>
              <ProductImage image={h.image} name={h.name} size="sm" />
              <span className="searchHitText">
                <b>{h.name}</b>
                <small>{[h.unit, h.category].filter(Boolean).join(' · ')}{h.stock > 0 ? '' : ' · ' + t('Out of stock')}</small>
              </span>
              <span className="searchHitPrice">{h.price < h.regularPrice && <s>{sek(h.regularPrice)}</s>}{sek(h.price)}</span>
            </a>
          ))}
          {!hits.length && (busy
            ? <p className="searchMsg">{t('Searching…')}</p>
            : <p className="searchMsg">{t('Nothing found for “{q}”', { q: term })} · <a href={requestUrl} onClick={(e) => { e.preventDefault(); go(requestUrl); }}>{t('Request this product')}</a></p>)}
          {hits.length > 0 && (
            <button type="submit" className="searchAll" onMouseEnter={() => setActive(-1)}>
              {t('See all results for “{q}”', { q: term })}{total > hits.length ? ` (${total})` : ''} →
            </button>
          )}
        </div>
      )}
    </form>
  );
}
