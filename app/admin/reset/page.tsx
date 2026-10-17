import type { Metadata } from 'next';
import ResetForm from './ResetForm';

export const metadata: Metadata = { title: 'Choose a new password', robots: { index: false } };

export default async function Reset({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = '' } = await searchParams;
  return <ResetForm token={token} />;
}
