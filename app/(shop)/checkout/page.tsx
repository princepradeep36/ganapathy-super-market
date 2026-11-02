import type { Metadata } from 'next';
import { ordersOpen, publicStore, store } from '@/lib/config';
import Checkout from '@/components/shop/Checkout';
import { LaunchCheckout } from '@/components/shop/LaunchNotice';
import { getT } from '@/lib/i18n-server';
import { availableSlots, getSchedule } from '@/lib/schedule';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t('Checkout') };
}

export default async function CheckoutPage() {
  const { lang, t } = await getT();
  if (!ordersOpen()) return <LaunchCheckout lang={lang} t={t} />;
  const schedule = await getSchedule();
  return (
    <Checkout
      cfg={publicStore()} storeAddress={store.address} storeHours={store.hours} mapUrl={store.mapUrl}
      slots={availableSlots(schedule, new Date(), lang)} allowAsap={schedule.allowAsap}
    />
  );
}
