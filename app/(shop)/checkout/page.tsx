import type { Metadata } from 'next';
import { publicStore, store } from '@/lib/config';
import Checkout from '@/components/shop/Checkout';
import { getT } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t('Checkout') };
}

export default function CheckoutPage() {
  return <Checkout cfg={publicStore()} storeAddress={store.address} storeHours={store.hours} mapUrl={store.mapUrl} />;
}
