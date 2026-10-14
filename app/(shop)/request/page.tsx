import type { Metadata } from 'next';
import RequestForm from '@/components/shop/RequestForm';
import { getT } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t('Request a product') };
}

export default async function RequestPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product } = await searchParams;
  const { t } = await getT();
  return (
    <main className="wrap section narrow">
      <h1>{t('Request a product')}</h1>
      <p className="muted">{t('Can’t find something you need? Tell us and we’ll try to stock it.')}</p>
      <RequestForm product={(product || '').slice(0, 120)} />
    </main>
  );
}
