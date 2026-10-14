import './globals.css';
import type { Metadata, Viewport } from 'next';
import { store } from '@/lib/config';
import { getLang } from '@/lib/i18n-server';

export const metadata: Metadata = {
  title: { default: `${store.name} · Indian groceries in Sweden`, template: `%s · ${store.name}` },
  icons: { icon: '/brand/logo.png', apple: '/brand/apple-icon.png' },
  openGraph: { images: ['/brand/banner.jpg'] },
  description: 'Authentic Indian groceries — rice, dals, spices, fresh vegetables and snacks. Order online for store pickup or home delivery.',
};
export const viewport: Viewport = { themeColor: '#0d4b36', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Merriweather:wght@700;900&family=Poppins:wght@400;500;600;700;800&family=Catamaran:wght@700;800&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
