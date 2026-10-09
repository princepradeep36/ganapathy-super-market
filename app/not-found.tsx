import Link from 'next/link';
import { getT } from '@/lib/i18n-server';
export default async function NotFound() {
  const { t } = await getT();
  return (
    <main className="loginPage">
      <div className="loginCard"><h1>{t('Page not found')}</h1><Link className="btn" href="/">{t('Back to the shop')}</Link></div>
    </main>
  );
}
