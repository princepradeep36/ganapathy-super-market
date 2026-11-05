import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { brandsWithProducts } from '@/lib/brands';
import BrandTile from '@/components/shop/BrandTile';
import { getT } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t('All brands') };
}

export default async function BrandsPage() {
  const { t } = await getT();
  const products = await db.product.findMany({ where: { active: true }, select: { name: true, image: true, stock: true }, orderBy: [{ featured: 'desc' }, { createdAt: 'asc' }] });
  const brands = brandsWithProducts(products).sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  // Group A–Z so customers can jump to a letter.
  const groups = new Map<string, typeof brands>();
  for (const b of brands) {
    const l = /[a-z]/i.test(b.name[0]) ? b.name[0].toUpperCase() : '#';
    groups.set(l, [...(groups.get(l) ?? []), b]);
  }
  return (
    <main className="wrap section">
      <nav className="crumbs"><Link href="/">{t('Home')}</Link> / {t('Brands')}</nav>
      <h1>{t('Shop by brand')}</h1>
      <p className="muted">{t('{n} brands', { n: brands.length })} · {t('Pick a brand to see all its products.')}</p>
      <nav className="brandLetters" aria-label={t('Jump to letter')}>
        {[...groups.keys()].map((l) => <a key={l} href={`#brand-${l}`}>{l}</a>)}
      </nav>
      {[...groups.entries()].map(([l, list]) => (
        <section key={l} id={`brand-${l}`} className="brandGroup">
          <h2>{l}</h2>
          <div className="brandGrid">{list.map((b) => <BrandTile key={b.slug} b={b} t={t} />)}</div>
        </section>
      ))}
    </main>
  );
}
