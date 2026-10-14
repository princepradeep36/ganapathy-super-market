'use client';
import Link from 'next/link';
import { useState } from 'react';
import { translateError } from '@/lib/i18n';
import { useLang, useT } from './I18n';

/** "Can you stock this?" form. The store sees requests in admin (and by e-mail when set up). */
export default function RequestForm({ product = '' }: { product?: string }) {
  const t = useT();
  const lang = useLang();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState('');

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const f = new FormData(e.currentTarget);
    const body = Object.fromEntries(['productName', 'details', 'name', 'phone', 'email'].map((k) => [k, String(f.get(k) || '')]));
    try {
      const r = await fetch('/api/requests', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Could not send your request');
      setSent(body.productName);
    } catch (x: any) {
      setErr(translateError(lang, x.message));
    } finally {
      setBusy(false);
    }
  }

  if (sent)
    return (
      <div className="card requestDone" role="status">
        <span aria-hidden>🙏</span>
        <h2>{t('Thank you! We got your request')}</h2>
        <p>{t('We’ll check if we can stock “{product}” and get back to you.', { product: sent })}</p>
        <div className="emptyBtns">
          <Link className="btn" href="/shop">{t('Back to the shop')}</Link>
          <button className="btn btn-ghost" onClick={() => setSent('')}>{t('Request another product')}</button>
        </div>
      </div>
    );

  return (
    <form onSubmit={send} className="card formGrid requestForm">
      <label className="full">{t('Which product are you looking for?')}<input name="productName" required minLength={2} maxLength={120} defaultValue={product} placeholder={t('e.g. Aachi chicken masala 200 g')} /></label>
      <label className="full">{t('Anything else we should know?')} <span className="opt">{t('(optional)')}</span><textarea name="details" rows={3} maxLength={500} placeholder={t('Brand, pack size, how often you would buy it…')} /></label>
      <label className="full">{t('Your name')}<input name="name" required minLength={2} maxLength={80} autoComplete="name" /></label>
      <label>{t('Mobile number')}<input name="phone" type="tel" maxLength={30} autoComplete="tel" /></label>
      <label>{t('E-mail')}<input name="email" type="email" maxLength={120} autoComplete="email" /></label>
      <p className="full muted small">{t('Add a phone number or e-mail so we can tell you when it arrives.')}</p>
      {err && <div className="alert alert-error full">{err}</div>}
      <div className="full"><button className="btn" disabled={busy}>{busy ? t('Sending…') : t('Send request')}</button></div>
    </form>
  );
}
