import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/shop/LoginForm';
import { currentCustomer, providers } from '@/lib/customer';
import { getT } from '@/lib/i18n-server';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t('Log in'), robots: { index: false } };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ signup?: string; error?: string }> }) {
  if (await currentCustomer()) redirect('/orders');
  const sp = await searchParams;
  const p = providers();
  return (
    <main className="wrap section narrow">
      <LoginForm key={sp.signup ? 'signup' : 'login'} signup={!!sp.signup} google={p.google} facebook={p.facebook} error={sp.error?.slice(0, 200)} />
    </main>
  );
}
