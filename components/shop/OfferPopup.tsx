'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useT } from './I18n';

type Popup = { id: string; image: string; title: string; link: string | null; version: string };

/** An offer poster shown once per visit when someone opens the shop. Chosen in admin → Banners. */
export default function OfferPopup({ popup }: { popup: Popup }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const key = `popup:${popup.id}:${popup.version}`;

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(key) === '1'; } catch { /* storage blocked: show once per page load */ }
    if (seen) return;
    const timer = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(timer);
  }, [key]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  });

  function close() {
    setOpen(false);
    try { sessionStorage.setItem(key, '1'); } catch { /* ignore */ }
  }

  if (!open) return null;
  const img = <img src={popup.image} alt={popup.title} />;
  return (
    <div className="modalBack offerPopBack" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="offerPop" role="dialog" aria-modal="true" aria-label={popup.title}>
        <button className="offerPopClose" onClick={close} aria-label={t('Close')}>×</button>
        {popup.link
          ? popup.link.startsWith('/')
            ? <Link href={popup.link} onClick={close}>{img}</Link>
            : <a href={popup.link} target="_blank" rel="noreferrer" onClick={close}>{img}</a>
          : img}
      </div>
    </div>
  );
}
