import Link from 'next/link';
import { getT } from '@/lib/i18n-server';
export default async function NotFound() {
  const { t } = await getT();
  return (
    <main className="wrap section">
      <div className="emptyState">
        <span aria-hidden>🥲</span>
        <h2>{t('We couldn’t find that page')}</h2>
        <p>{t('The product may have sold out or moved. Try searching or browse the shop.')}</p>
        <Link className="btn" href="/shop">{t('Go to shop')}</Link>
      </div>
    </main>
  );
}
