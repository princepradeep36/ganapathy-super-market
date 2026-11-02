import Link from 'next/link';
import { ordersOpen, ordersOpenAt } from '@/lib/config';
import type { Lang, T } from '@/lib/i18n';

export const launchDate = (lang: Lang) =>
  ordersOpenAt().toLocaleDateString(lang === 'sv' ? 'sv-SE' : 'en-GB', { day: 'numeric', month: 'long', timeZone: 'Europe/Stockholm' });

/** Strip under the header until the grand launch. */
export function LaunchStrip({ lang, t }: { lang: Lang; t: T }) {
  if (ordersOpen()) return null;
  return (
    <div className="launchStrip" role="status">
      <div className="wrap">
        <span aria-hidden>🪔</span> <b>{t('Grand launch on {date} for Diwali!', { date: launchDate(lang) })}</b> {t('Online orders open then. Wait for our exciting launch offers!')}
      </div>
    </div>
  );
}

/** Shown instead of the checkout form until the grand launch. */
export function LaunchCheckout({ lang, t }: { lang: Lang; t: T }) {
  const date = launchDate(lang);
  return (
    <main className="wrap section narrow">
      <div className="card launchCard">
        <span className="launchIcon" aria-hidden>🪔</span>
        <h1>{t('Grand launch on {date} for Diwali!', { date })}</h1>
        <p>{t('You can browse all our products now. Online ordering opens on {date}, with exciting launch offers.', { date })}</p>
        <p className="muted">{t('Your basket is saved on this device, so you can order as soon as we open.')}</p>
        <Link className="btn btn-lg" href="/shop">{t('Keep browsing')}</Link>
      </div>
    </main>
  );
}
