import './globals.css';
import type { Metadata, Viewport } from 'next';
import { siteUrl, store } from '@/lib/config';
import { getLang } from '@/lib/i18n-server';

const DESCRIPTION = `${store.name} — Indian and Tamil grocery store in ${store.deliveryArea}. Rice, atta, dals, spices, fresh vegetables, snacks and sweets. Order online for free store pickup or home delivery.`;

// Built per request so the real site address (SITE_URL) is used for links shared and found in search.
export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${store.name} · Indian groceries in ${store.deliveryArea}`, template: `%s · ${store.name}` },
    description: DESCRIPTION,
    keywords: ['Indian grocery', 'Indian store', 'Tamil shop', 'Indisk livsmedelsbutik', 'indiska varor', store.deliveryArea, 'online grocery Sweden', store.name],
    icons: { icon: '/brand/logo.png', apple: '/brand/apple-icon.png' },
    openGraph: { type: 'website', siteName: store.name, title: `${store.name} · Indian groceries in ${store.deliveryArea}`, description: DESCRIPTION, images: ['/brand/banner.jpg'], locale: 'en_SE' },
  };
}
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
